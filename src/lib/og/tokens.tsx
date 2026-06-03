/**
 * Shared design tokens for every `opengraph-image.tsx` / `twitter-image.tsx`
 * file. Each OG generator imports from here so the entire share-preview
 * system stays visually consistent — same gradient, same accent, same
 * type scale.
 */

/** Standard Open Graph canvas (Facebook, LinkedIn, WhatsApp, Slack, iMessage). */
export const OG_SIZE = { width: 1200, height: 630 } as const;

/** Twitter Large Card prefers a slightly taller 16:9-ish ratio. */
export const TWITTER_SIZE = { width: 1200, height: 675 } as const;

export const OG_COLORS = {
  bgStart: "#0A0A0F",
  bgMid: "#12121A",
  bgEnd: "#1A1530",
  textPrimary: "#FAFAFB",
  textMuted: "#A0A0B0",
  brand: "#7E5BEF",
  brandLight: "#8B6CF0",
  brandSoft: "rgba(126, 91, 239, 0.12)",
  brandBorder: "rgba(126, 91, 239, 0.35)",
  divider: "rgba(255, 255, 255, 0.08)",
  surface: "rgba(255, 255, 255, 0.04)",
  surfaceBorder: "rgba(255, 255, 255, 0.08)",
  modelTextDot: "#10b981",
  modelImageDot: "#60a5fa",
} as const;

/** Outer container styles every OG card uses for the dark + glow backdrop. */
export const OG_CONTAINER_STYLE = {
  display: "flex",
  flexDirection: "column" as const,
  width: "100%",
  height: "100%",
  background: `linear-gradient(145deg, ${OG_COLORS.bgStart} 0%, ${OG_COLORS.bgMid} 42%, ${OG_COLORS.bgEnd} 100%)`,
  color: OG_COLORS.textPrimary,
  padding: 64,
  fontFamily: "sans-serif",
  position: "relative" as const,
  overflow: "hidden" as const,
};

/** Two corner glows + a thin gradient bar at the top — common ornament. */
export function OgBackdrop() {
  return (
    <>
      <div
        style={{
          position: "absolute",
          top: -120,
          right: -80,
          width: 420,
          height: 420,
          borderRadius: 999,
          background: "rgba(126, 91, 239, 0.22)",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: -100,
          left: -60,
          width: 360,
          height: 360,
          borderRadius: 999,
          background: "rgba(56, 189, 248, 0.12)",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 4,
          background:
            "linear-gradient(90deg, transparent 0%, #7E5BEF 50%, transparent 100%)",
        }}
      />
    </>
  );
}

/** Branding lockup used at the top-left of every card. */
export function OgBrandLockup({ size = 44 }: { size?: number }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        position: "relative",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: size,
          height: size,
          borderRadius: 12,
          background:
            "linear-gradient(180deg, #8B6CF0 0%, #7E5BEF 100%)",
          fontSize: Math.round(size * 0.5),
          fontWeight: 800,
          color: "#fff",
        }}
      >
        m
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 2,
        }}
      >
        <div
          style={{
            fontSize: 22,
            fontWeight: 800,
            letterSpacing: -0.6,
          }}
        >
          My Copyprompt
        </div>
        <div
          style={{
            fontSize: 13,
            color: OG_COLORS.textMuted,
            letterSpacing: 1.4,
            textTransform: "uppercase",
            fontWeight: 600,
          }}
        >
          Free prompt library
        </div>
      </div>
    </div>
  );
}

/** Footer band: free-form left content + site URL on the right. */
export function OgFooter({ left }: { left: React.ReactNode }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginTop: 28,
        fontSize: 20,
        color: OG_COLORS.textMuted,
        position: "relative",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
        {left}
      </div>
      <div
        style={{
          display: "flex",
          fontSize: 18,
          fontWeight: 700,
          color: OG_COLORS.brand,
          letterSpacing: 0.5,
        }}
      >
        mycopyprompt.in
      </div>
    </div>
  );
}

/** Truncate text by characters, adding ellipsis if cut. */
export function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1).trimEnd()}…`;
}
