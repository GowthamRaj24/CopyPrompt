import { ImageResponse } from "next/og";
import { getPublicCollectionBySlug } from "@/server/services/collection.service";
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
 * Per-collection Open Graph card.
 *
 * Shown when anyone shares a `/c/[slug]` link to WhatsApp, X, Slack,
 * etc. Layout mirrors the prompt OG so the share-preview system reads
 * as one product: branded header, big title, supporting subtitle, and
 * a footer band of stats + the domain.
 */

export const alt = "Curated AI prompt collection";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await getPublicCollectionBySlug(slug);

  if (!data) {
    return new ImageResponse(<FallbackCard />, { ...size });
  }

  const { collection, owner } = data;
  const ownerName = owner?.fullName ?? "a curator";

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
              padding: "10px 18px",
              borderRadius: 999,
              border: `1px solid ${OG_COLORS.brandBorder}`,
              background: OG_COLORS.brandSoft,
              fontSize: 20,
              fontWeight: 600,
              color: "#E8E0FF",
            }}
          >
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: 999,
                background: collection.isCurated ? "#facc15" : OG_COLORS.brand,
                boxShadow: `0 0 8px ${
                  collection.isCurated ? "#facc15" : OG_COLORS.brand
                }`,
              }}
            />
            {collection.isCurated ? "Curated playbook" : "Public collection"}
          </div>
        </div>

        {/* Body */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 20,
            marginTop: 44,
            flex: 1,
            position: "relative",
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: 18,
              color: OG_COLORS.textMuted,
              fontWeight: 600,
              letterSpacing: 1.2,
              textTransform: "uppercase",
            }}
          >
            By {ownerName}
          </div>

          <div
            style={{
              display: "flex",
              fontSize: pickTitleSize(collection.name),
              fontWeight: 800,
              lineHeight: 1.04,
              letterSpacing: -2.4,
              color: OG_COLORS.textPrimary,
              maxWidth: 1020,
            }}
          >
            {truncate(collection.name, 80)}
          </div>

          {collection.description && (
            <div
              style={{
                display: "flex",
                fontSize: 26,
                lineHeight: 1.45,
                color: "rgba(250, 250, 251, 0.78)",
                maxWidth: 980,
              }}
            >
              {truncate(collection.description, 140)}
            </div>
          )}
        </div>

        <OgFooter
          left={
            <>
              <span style={{ display: "flex" }}>
                <span
                  style={{ color: OG_COLORS.textPrimary, fontWeight: 700 }}
                >
                  {collection.promptCount}
                </span>
                <span style={{ marginLeft: 8 }}>
                  {collection.promptCount === 1 ? "prompt" : "prompts"}
                </span>
              </span>
              <span style={{ display: "flex" }}>·</span>
              <span style={{ display: "flex" }}>Copy & paste, free</span>
            </>
          }
        />
      </div>
    ),
    { ...size },
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
          Curated AI prompt collection
        </div>
        <div
          style={{
            fontSize: 26,
            color: "rgba(250, 250, 251, 0.78)",
            lineHeight: 1.4,
          }}
        >
          Hand-picked prompts you can copy & paste, free.
        </div>
      </div>
      <OgFooter left={<span style={{ display: "flex" }}>Free forever</span>} />
    </div>
  );
}

function pickTitleSize(title: string): number {
  if (title.length <= 32) return 76;
  if (title.length <= 50) return 64;
  if (title.length <= 70) return 54;
  return 46;
}
