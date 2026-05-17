import { ImageResponse } from "next/og";
import { SITE_BRAND } from "@/lib/site-brand";
import { getPromptByShareToken } from "@/server/services/prompt.service";

export const runtime = "nodejs";
export const alt = "Private prompt preview";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

interface RouteContext {
  params: Promise<{ token: string }>;
}

export default async function Image({ params }: RouteContext) {
  const { token } = await params;
  const prompt = await getPromptByShareToken(token);

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
            fontSize: 48,
            fontWeight: 700,
          }}
        >
          Link not found
        </div>
      ),
      { ...size },
    );
  }

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
          justifyContent: "space-between",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            fontSize: 22,
            color: "#A78BFA",
            fontWeight: 600,
          }}
        >
          <span>🔒</span>
          <span>Private prompt</span>
        </div>
        <div
          style={{
            fontSize: 56,
            fontWeight: 700,
            letterSpacing: -2,
            lineHeight: 1.1,
            maxWidth: 1000,
          }}
        >
          {prompt.title}
        </div>
        <div style={{ fontSize: 24, color: "#9CA3AF" }}>
          {SITE_BRAND.displayName} · {prompt.model.name}
        </div>
      </div>
    ),
    { ...size },
  );
}
