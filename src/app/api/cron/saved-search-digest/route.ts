import { type NextRequest, NextResponse } from "next/server";
import { rejectUnauthorizedCron } from "@/server/lib/cron-auth";
import { sendSavedSearchDigestEmail } from "@/server/lib/email";
import {
  buildSearchHref,
  loadDigestBatches,
  markSavedSearchDelivered,
} from "@/server/services/saved-search.service";

/**
 * GET /api/cron/saved-search-digest
 *
 * Walks every saved search, finds new matches since `last_seen_at`,
 * emails the user one digest per day, then bumps `last_seen_at`.
 *
 * Auth: Bearer token against CRON_SECRET (Vercel Cron pattern).
 */
export async function GET(req: NextRequest) {
  const unauthorized = rejectUnauthorizedCron(req);
  if (unauthorized) return unauthorized;

  const batches = await loadDigestBatches();

  let sent = 0;
  let failed = 0;

  for (const batch of batches) {
    try {
      await sendSavedSearchDigestEmail({
        to: batch.email,
        name: batch.fullName,
        groups: batch.groups.map((g) => ({
          label: g.saved.label,
          searchHref: buildSearchHref(g.saved),
          matches: g.matches.map((m) => ({
            title: m.title,
            slug: m.slug,
            modelName: m.modelName,
            modelType: m.modelType,
            primaryImageUrl: m.primaryImage?.cdnUrl ?? null,
          })),
        })),
      });

      // Watermark every saved search the user has — even those with zero
      // matches today — so next run is bounded by today's window.
      for (const g of batch.groups) {
        await markSavedSearchDelivered(g.saved.id);
      }
      sent += 1;
    } catch (err) {
      console.error("[digest] send failed", { userId: batch.userId, err });
      failed += 1;
    }
  }

  return NextResponse.json({ ok: true, sent, failed, batches: batches.length });
}
