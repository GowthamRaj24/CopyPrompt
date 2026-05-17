/**
 * Ambient orbs — five colored blobs floating slowly behind every page.
 *
 * Layer stack (back → front)
 * ──────────────────────────
 *   html             solid bg-color
 *   body::before     8-anchor aurora mesh   (static)
 *   AmbientOrbs      5 animated color orbs  ← this file
 *   body::after      grid + dots + wisps    (static texture)
 *   page content     everything else
 *
 * Each orb drives a different `@keyframes` track so motion never
 * synchronizes — the eye perceives "living atmosphere" rather than a
 * loop. All animations are pure `transform: translate3d(…) scale(…)`
 * so the GPU compositor handles them off the main thread; the orbs
 * never trigger layout or paint after initial render.
 *
 * Performance budget
 * ──────────────────
 *   - 5 fixed elements × 1 composited layer each ≈ 0% CPU
 *   - blur(90px) is rasterized once per orb, then translated — cheap
 *   - on mobile / coarse pointers, the parent .ambient-orbs disables
 *     all animations (see globals.css) to spare battery
 *   - prefers-reduced-motion: reduce is honored by the global rule
 */
export function AmbientOrbs() {
  return (
    <div className="ambient-orbs" aria-hidden>
      <span className="orb orb-indigo" />
      <span className="orb orb-cyan" />
      <span className="orb orb-violet" />
      <span className="orb orb-teal" />
      <span className="orb orb-rose" />
    </div>
  );
}
