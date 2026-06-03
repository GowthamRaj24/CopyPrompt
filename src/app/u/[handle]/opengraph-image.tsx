import { ImageResponse } from "next/og";
import {
  getCreatorByHandle,
  getCreatorStats,
} from "@/server/services/creator.service";
import {
  OG_COLORS,
  OG_CONTAINER_STYLE,
  OG_SIZE,
  OgBackdrop,
  OgBrandLockup,
  OgFooter,
  truncate,
} from "@/lib/og/tokens";

/**
 * Per-creator Open Graph card.
 *
 * Shown when someone shares `/u/<handle>` — the public creator profile.
 * Layout matches the prompt and collection OG cards: brand header,
 * handle pill, full name + bio, stats footer.
 */

export const alt = "AI prompt creator on My Copyprompt";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function Image({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;
  const creator = await getCreatorByHandle(handle);

  if (!creator) {
    return new ImageResponse(<FallbackCard />, { ...size });
  }

  const stats = await getCreatorStats(creator.id);

  const displayName = creator.fullName ?? `@${creator.handle}`;

  return new ImageResponse(
    (
      <div style={OG_CONTAINER_STYLE}>
        <OgBackdrop />

        {/* Top row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            position: "relative",
          }}
        >
          <OgBrandLockup />
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "10px 20px",
              borderRadius: 999,
              border: `1px solid ${OG_COLORS.brandBorder}`,
              background: OG_COLORS.brandSoft,
              fontSize: 22,
              fontWeight: 600,
              color: "#E8E0FF",
              fontFamily: "monospace",
            }}
          >
            @{creator.handle}
          </div>
        </div>

        {/* Body */}
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            gap: 36,
            marginTop: 48,
            flex: 1,
            position: "relative",
            alignItems: "center",
          }}
        >
          {/* Avatar circle (uses initial if no avatarUrl) */}
          <Avatar
            url={creator.avatarUrl}
            initial={(displayName[0] ?? "?").toUpperCase()}
          />

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 16,
              flex: 1,
              minWidth: 0,
            }}
          >
            <div
              style={{
                display: "flex",
                fontSize: 18,
                color: OG_COLORS.textMuted,
                fontWeight: 600,
                letterSpacing: 1.4,
                textTransform: "uppercase",
              }}
            >
              Prompt creator
            </div>

            <div
              style={{
                display: "flex",
                fontSize: pickTitleSize(displayName),
                fontWeight: 800,
                lineHeight: 1.04,
                letterSpacing: -2.2,
                color: OG_COLORS.textPrimary,
              }}
            >
              {truncate(displayName, 60)}
            </div>

            {creator.bio && (
              <div
                style={{
                  display: "flex",
                  fontSize: 24,
                  lineHeight: 1.45,
                  color: "rgba(250, 250, 251, 0.78)",
                  maxWidth: 720,
                }}
              >
                {truncate(creator.bio, 180)}
              </div>
            )}
          </div>
        </div>

        <OgFooter
          left={
            <>
              <span style={{ display: "flex" }}>
                <span
                  style={{ color: OG_COLORS.textPrimary, fontWeight: 700 }}
                >
                  {stats.promptCount}
                </span>
                <span style={{ marginLeft: 8 }}>
                  {stats.promptCount === 1 ? "prompt" : "prompts"}
                </span>
              </span>
              <span style={{ display: "flex" }}>·</span>
              <span style={{ display: "flex" }}>
                <span
                  style={{ color: OG_COLORS.textPrimary, fontWeight: 700 }}
                >
                  {formatCount(stats.totalCopies)}
                </span>
                <span style={{ marginLeft: 8 }}>copies received</span>
              </span>
            </>
          }
        />
      </div>
    ),
    { ...size },
  );
}

function Avatar({ url, initial }: { url: string | null; initial: string }) {
  const ring = `4px solid ${OG_COLORS.brandBorder}`;
  if (url) {
    return (
      <div
        style={{
          display: "flex",
          width: 220,
          height: 220,
          borderRadius: 999,
          overflow: "hidden",
          border: ring,
          flexShrink: 0,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={url}
          alt=""
          width={220}
          height={220}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </div>
    );
  }
  return (
    <div
      style={{
        display: "flex",
        width: 220,
        height: 220,
        borderRadius: 999,
        alignItems: "center",
        justifyContent: "center",
        background:
          "linear-gradient(180deg, #8B6CF0 0%, #7E5BEF 100%)",
        border: ring,
        flexShrink: 0,
        fontSize: 110,
        fontWeight: 800,
        color: "#fff",
      }}
    >
      {initial}
    </div>
  );
}

function FallbackCard() {
  return (
    <div style={OG_CONTAINER_STYLE}>
      <OgBackdrop />
      <OgBrandLockup />
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          flex: 1,
          justifyContent: "center",
          gap: 16,
          position: "relative",
        }}
      >
        <div
          style={{
            fontSize: 60,
            fontWeight: 800,
            lineHeight: 1.05,
            letterSpacing: -2,
          }}
        >
          Prompt creator on My Copyprompt
        </div>
      </div>
      <OgFooter left={<span style={{ display: "flex" }}>Free forever</span>} />
    </div>
  );
}

function pickTitleSize(name: string): number {
  if (name.length <= 18) return 88;
  if (name.length <= 28) return 72;
  if (name.length <= 40) return 58;
  return 48;
}

function formatCount(n: number): string {
  if (n >= 1_000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}
