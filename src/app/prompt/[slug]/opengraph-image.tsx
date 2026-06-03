import { ImageResponse } from "next/og";
import { getPromptBySlug } from "@/server/services/prompt.service";
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
 * Per-prompt Open Graph card.
 *
 * Rendered at request time by Next.js when a crawler hits
 * `/prompt/[slug]/opengraph-image`. The result is a 1200x630 PNG that
 * gets unfurled by WhatsApp, iMessage, Slack, X, LinkedIn, Discord,
 * Facebook, and Telegram. We don't need to also wire `openGraph.images`
 * in the page's `generateMetadata` — Next.js auto-detects this file's
 * existence and injects the correct `<meta>` tags.
 *
 * Layout
 * ──────
 *   Top:    brand lockup (left) · model badge (right)
 *   Middle: prompt title (huge) · either preview text (text prompts)
 *           or the prompt's hero image inset (image prompts)
 *   Bottom: copy count · category · domain
 */

export const alt = "AI prompt — copy & paste, free forever";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const prompt = await getPromptBySlug(slug);

  // Fallback to a generic-but-branded card if the slug doesn't resolve
  // (deleted prompt, cache mid-update). Avoids serving a 404 in OG.
  if (!prompt) {
    return new ImageResponse(<FallbackCard />, { ...size });
  }

  const isImage = prompt.model.type === "image";
  const heroImageUrl =
    isImage && prompt.images[0] ? prompt.images[0].cdnUrl : null;

  return new ImageResponse(
    (
      <div style={OG_CONTAINER_STYLE}>
        <OgBackdrop />

        {/* ── Top row ─────────────────────────────────────── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            position: "relative",
          }}
        >
          <OgBrandLockup />
          <ModelPill
            name={prompt.model.name}
            type={prompt.model.type}
          />
        </div>

        {/* ── Body ─────────────────────────────────────────
           Two-column layout when a hero image is available;
           single full-width column otherwise. */}
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            gap: 40,
            marginTop: 36,
            flex: 1,
            position: "relative",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 18,
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
                letterSpacing: 1,
                textTransform: "uppercase",
              }}
            >
              {prompt.category.name}
            </div>
            <div
              style={{
                display: "flex",
                fontSize: pickTitleSize(prompt.title),
                fontWeight: 800,
                lineHeight: 1.05,
                letterSpacing: -2,
                color: OG_COLORS.textPrimary,
              }}
            >
              {truncate(prompt.title, 90)}
            </div>

            {!heroImageUrl && (
              <PromptPreviewBlock text={prompt.promptText} />
            )}
          </div>

          {heroImageUrl && (
            <div
              style={{
                display: "flex",
                width: 380,
                height: 380,
                borderRadius: 20,
                overflow: "hidden",
                position: "relative",
                border: `1px solid ${OG_COLORS.surfaceBorder}`,
                background: OG_COLORS.surface,
                flexShrink: 0,
                alignSelf: "center",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={heroImageUrl}
                alt={prompt.title}
                width={380}
                height={380}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
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
                  {formatCount(prompt.copyCount)}
                </span>
                <span style={{ marginLeft: 8 }}>copies</span>
              </span>
              <span style={{ display: "flex" }}>·</span>
              <span style={{ display: "flex" }}>
                {isImage ? "Image" : "Text"} prompt
              </span>
              <span style={{ display: "flex" }}>·</span>
              <span style={{ display: "flex" }}>Free forever</span>
            </>
          }
        />
      </div>
    ),
    { ...size },
  );
}

/* ─── Sub-components ─────────────────────────────────────── */

function ModelPill({
  name,
  type,
}: {
  name: string;
  type: "image" | "text";
}) {
  const dot =
    type === "image"
      ? OG_COLORS.modelImageDot
      : OG_COLORS.modelTextDot;
  return (
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
          background: dot,
          boxShadow: `0 0 8px ${dot}`,
        }}
      />
      {name}
    </div>
  );
}

function PromptPreviewBlock({ text }: { text: string }) {
  // Limit to ~5 lines for a clean look — Satori has no real text
  // overflow, so we hand-clamp first.
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(0, 5)
    .map((l) => truncate(l, 78));

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        marginTop: 8,
        padding: "22px 26px",
        borderRadius: 16,
        border: `1px solid ${OG_COLORS.surfaceBorder}`,
        background: "rgba(15, 18, 28, 0.65)",
        fontFamily: "monospace",
        fontSize: 19,
        color: "rgba(250, 250, 251, 0.78)",
        lineHeight: 1.55,
        gap: 4,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {lines.map((line, i) => (
        <div
          key={i}
          style={{
            display: "flex",
            opacity: 1 - i * 0.07,
          }}
        >
          {line || "\u00A0"}
        </div>
      ))}
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
            maxWidth: 920,
          }}
        >
          The fastest way to find AI prompts
        </div>
        <div
          style={{
            fontSize: 26,
            color: "rgba(250, 250, 251, 0.78)",
            maxWidth: 820,
            lineHeight: 1.4,
          }}
        >
          Search, copy & paste curated prompts for every AI tool.
        </div>
      </div>
      <OgFooter
        left={
          <>
            <span style={{ display: "flex" }}>Free forever</span>
            <span style={{ display: "flex" }}>·</span>
            <span style={{ display: "flex" }}>No signup to browse</span>
          </>
        }
      />
    </div>
  );
}

/* ─── Helpers ────────────────────────────────────────────── */

function pickTitleSize(title: string): number {
  // Long titles need smaller type to fit two lines without wrapping
  // weirdly. Tuned by eye against ImageResponse's Satori line wrapping.
  if (title.length <= 36) return 64;
  if (title.length <= 60) return 54;
  if (title.length <= 80) return 46;
  return 40;
}

function formatCount(n: number): string {
  if (n >= 10_000) return `${(n / 1000).toFixed(1)}K`;
  if (n >= 1_000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}
