import { ImageResponse } from "next/og";
import { getPromptBySlug } from "@/server/services/prompt.service";

/**
 * Dynamic Open Graph image for prompt detail pages.
 *
 * Why this exists
 * ───────────────
 * Static metadata gives image prompts a nice preview via their own
 * reference image. Text prompts had no image to fall back on, so social
 * shares looked plain and AI engines had nothing visual to attach.
 *
 * Next.js generates this on demand and caches at the edge, so every
 * prompt URL now has a unique, branded social preview without us
 * authoring 10k PNGs.
 */

// Node runtime — required because `getPromptBySlug` uses `postgres-js`,
// which doesn't run on the Edge. Performance is still excellent: the
// route is cached by Next.js so we only render the image once per
// prompt and serve it from the CDN thereafter.
export const runtime = "nodejs";
export const alt = "AI prompt preview";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

interface RouteContext {
  params: Promise<{ slug: string }>;
}

export default async function Image({ params }: RouteContext) {
  const { slug } = await params;
  const prompt = await getPromptBySlug(slug);

  // Fallback when the slug is invalid — Next.js will still render the
  // 404 page for the route itself; we just give the OG something safe.
  if (!prompt) {
    return new ImageResponse(
      (
        <div
          style={{
            display: "flex",
            width: "100%",
            height: "100%",
            background: "#0A0A0F",
            color: "#FAFAFB",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 56,
            fontWeight: 700,
            letterSpacing: -1.5,
          }}
        >
          CopyPrompt
        </div>
      ),
      { ...size },
    );
  }

  const isImage = prompt.model.type === "image";
  const preview =
    prompt.promptText.length > 220
      ? `${prompt.promptText.slice(0, 220).trimEnd()}…`
      : prompt.promptText;

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
          background:
            "linear-gradient(135deg, #0A0A0F 0%, #14141C 50%, #1A1530 100%)",
          color: "#FAFAFB",
          padding: 72,
          fontFamily: "sans-serif",
          position: "relative",
        }}
      >
        {/* Top primary accent stripe — mirrors the in-app prompt card */}
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

        {/* Eyebrow */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            fontSize: 20,
            color: "#A0A0B0",
            letterSpacing: 2,
            textTransform: "uppercase",
            fontWeight: 600,
          }}
        >
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: 999,
              background: "#7E5BEF",
              boxShadow: "0 0 16px 2px rgba(126, 91, 239, 0.6)",
            }}
          />
          {isImage ? "Image prompt" : "Text prompt"} · {prompt.model.name}
        </div>

        {/* Title */}
        <div
          style={{
            display: "flex",
            marginTop: 28,
            fontSize: prompt.title.length > 60 ? 56 : 68,
            fontWeight: 800,
            lineHeight: 1.05,
            letterSpacing: -2,
            color: "#FAFAFB",
            maxWidth: "100%",
          }}
        >
          {prompt.title}
        </div>

        {/* Prompt preview */}
        <div
          style={{
            display: "flex",
            marginTop: 32,
            padding: "20px 24px",
            borderRadius: 16,
            border: "1px solid rgba(126, 91, 239, 0.35)",
            background:
              "linear-gradient(180deg, rgba(126, 91, 239, 0.08) 0%, rgba(20, 20, 28, 0.6) 100%)",
            fontFamily: "monospace",
            fontSize: 22,
            lineHeight: 1.55,
            color: "rgba(250, 250, 251, 0.88)",
            maxWidth: "100%",
            flex: 1,
          }}
        >
          {preview}
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: 32,
            fontSize: 22,
            color: "#A0A0B0",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              color: "#FAFAFB",
              fontWeight: 700,
              fontSize: 26,
              letterSpacing: -0.6,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 36,
                height: 36,
                borderRadius: 10,
                background: "#7E5BEF",
                fontSize: 18,
                fontWeight: 800,
              }}
            >
              C
            </div>
            CopyPrompt
          </div>
          <div style={{ display: "flex", gap: 18 }}>
            <span>{prompt.copyCount.toLocaleString()} copies</span>
            <span>·</span>
            <span>{prompt.category.name}</span>
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
