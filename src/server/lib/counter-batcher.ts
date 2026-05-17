import { sql } from "drizzle-orm";
import { db } from "@/server/lib/db";
import { prompts } from "@/server/models/prompt.model";

/**
 * In-memory counter batcher
 * ─────────────────────────
 * Instead of firing one `UPDATE prompts SET copy_count = copy_count + 1`
 * per copy / view event — which serializes write contention on hot rows
 * and burns a connection per request — we accumulate deltas in memory
 * and flush them in periodic batches.
 *
 * 100 viewers on a trending prompt in 5 seconds → 1 UPDATE (`+= 100`)
 * instead of 100 UPDATEs.
 *
 * Trade-off: counts can be up to `FLUSH_INTERVAL_MS` stale on the page.
 * For copy/view stats that's perfectly acceptable.
 *
 * Caveats
 * ───────
 *   - State lives in the Node.js process memory. On Vercel/Lambda each
 *     cold start gets its own batcher; warm instances batch efficiently.
 *     For maximum win in serverless, run on a stateful host (Fly, Render,
 *     long-running Node) or front this with Redis (TODO if needed).
 *   - On process shutdown we attempt a best-effort flush; any in-flight
 *     deltas lost during an ungraceful crash are bounded by FLUSH_INTERVAL.
 *   - Cached on globalThis so HMR / repeated module evals in dev share
 *     the same accumulator (otherwise we'd lose deltas on every edit).
 */

const FLUSH_INTERVAL_MS = 5000;

interface BatcherState {
  copyDeltas: Map<string, number>;
  viewDeltas: Map<string, number>;
  flushTimer: NodeJS.Timeout | null;
  shutdownRegistered: boolean;
}

const globalForBatcher = globalThis as unknown as {
  __counterBatcher?: BatcherState;
};

function getState(): BatcherState {
  if (!globalForBatcher.__counterBatcher) {
    globalForBatcher.__counterBatcher = {
      copyDeltas: new Map(),
      viewDeltas: new Map(),
      flushTimer: null,
      shutdownRegistered: false,
    };
  }
  return globalForBatcher.__counterBatcher;
}

function scheduleFlush(state: BatcherState) {
  if (state.flushTimer) return;
  state.flushTimer = setTimeout(() => {
    state.flushTimer = null;
    void flush();
  }, FLUSH_INTERVAL_MS);

  // Best-effort flush on shutdown — only registered once per process.
  if (!state.shutdownRegistered) {
    state.shutdownRegistered = true;
    const onExit = () => {
      void flush();
    };
    // Node fires these on SIGTERM/SIGINT; harmless on serverless.
    process.once("SIGTERM", onExit);
    process.once("SIGINT", onExit);
    process.once("beforeExit", onExit);
  }
}

/**
 * Increment the in-memory copy-count delta for a prompt.
 * Returns immediately. The DB UPDATE is flushed within
 * FLUSH_INTERVAL_MS, coalescing concurrent events.
 */
export function queueCopyIncrement(promptId: string, by = 1): void {
  const state = getState();
  state.copyDeltas.set(promptId, (state.copyDeltas.get(promptId) ?? 0) + by);
  scheduleFlush(state);
}

/**
 * Increment the in-memory view-count delta for a prompt.
 */
export function queueViewIncrement(promptId: string, by = 1): void {
  const state = getState();
  state.viewDeltas.set(promptId, (state.viewDeltas.get(promptId) ?? 0) + by);
  scheduleFlush(state);
}

/**
 * Flush all pending deltas to Postgres.
 *
 * Exported for tests / forced flush from request handlers if needed.
 * Errors are logged; deltas are dropped on failure to avoid unbounded
 * memory growth on persistent DB outages.
 */
export async function flush(): Promise<void> {
  const state = getState();
  if (state.copyDeltas.size === 0 && state.viewDeltas.size === 0) return;

  // Snapshot + clear atomically (Node is single-threaded, this is safe)
  const copies = state.copyDeltas;
  const views = state.viewDeltas;
  state.copyDeltas = new Map();
  state.viewDeltas = new Map();

  try {
    await db.transaction(async (tx) => {
      // Each entry is one UPDATE with += delta. Running them in parallel
      // inside a single transaction completes in roughly one round-trip
      // worth of latency thanks to pipelining.
      const updates: Array<Promise<unknown>> = [];

      for (const [id, delta] of copies) {
        if (delta <= 0) continue;
        updates.push(
          tx
            .update(prompts)
            .set({ copyCount: sql`${prompts.copyCount} + ${delta}` })
            .where(sql`${prompts.id} = ${id}`),
        );
      }
      for (const [id, delta] of views) {
        if (delta <= 0) continue;
        updates.push(
          tx
            .update(prompts)
            .set({ viewCount: sql`${prompts.viewCount} + ${delta}` })
            .where(sql`${prompts.id} = ${id}`),
        );
      }

      await Promise.all(updates);
    });
  } catch (err) {
    console.error("[counter-batcher] flush failed", err);
    // Deltas are already cleared — accept the small loss rather than
    // grow unbounded across repeated failures.
  }
}
