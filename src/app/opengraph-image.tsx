import { ImageResponse } from "next/og";

/**
 * Default Open Graph / WhatsApp / social preview for the homepage and
 * any route without its own `opengraph-image` file.
 *
 * Served at `/opengraph-image` (1200×630). WhatsApp, iMessage, Slack,
 * X, and LinkedIn all read `og:image` from this.
 */
export const alt = "CopyPrompt — free AI prompts for every tool";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
          background:
            "linear-gradient(145deg, #0A0A0F 0%, #12121A 42%, #1A1530 100%)",
          color: "#FAFAFB",
          padding: 72,
          fontFamily: "sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
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

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            position: "relative",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 52,
              height: 52,
              borderRadius: 14,
              background: "linear-gradient(180deg, #8B6CF0 0%, #7E5BEF 100%)",
              fontSize: 26,
              fontWeight: 800,
            }}
          >
            C
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <div
              style={{
                fontSize: 32,
                fontWeight: 800,
                letterSpacing: -1,
              }}
            >
              CopyPrompt
            </div>
            <div
              style={{
                fontSize: 18,
                color: "#A0A0B0",
                letterSpacing: 1.5,
                textTransform: "uppercase",
                fontWeight: 600,
              }}
            >
              Free prompt library
            </div>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            marginTop: 48,
            gap: 20,
            position: "relative",
            flex: 1,
          }}
        >
          <div
            style={{
              fontSize: 64,
              fontWeight: 800,
              lineHeight: 1.05,
              letterSpacing: -2.5,
              maxWidth: 900,
            }}
          >
            The fastest way to find AI prompts
          </div>
          <div
            style={{
              fontSize: 28,
              lineHeight: 1.45,
              color: "rgba(250, 250, 251, 0.78)",
              maxWidth: 820,
            }}
          >
            Search, copy & paste curated prompts for ChatGPT, Claude,
            Midjourney, Flux, Gemini — no paywall.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 12,
            position: "relative",
          }}
        >
          {["ChatGPT", "Claude", "Midjourney", "Flux", "Gemini"].map(
            (tool) => (
              <div
                key={tool}
                style={{
                  display: "flex",
                  padding: "10px 18px",
                  borderRadius: 999,
                  border: "1px solid rgba(126, 91, 239, 0.35)",
                  background: "rgba(126, 91, 239, 0.12)",
                  fontSize: 20,
                  fontWeight: 600,
                  color: "#E8E0FF",
                }}
              >
                {tool}
              </div>
            ),
          )}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: 36,
            fontSize: 22,
            color: "#A0A0B0",
            position: "relative",
          }}
        >
          <div style={{ display: "flex", gap: 24 }}>
            <div style={{ color: "#FAFAFB", fontWeight: 700 }}>
              180+ prompts
            </div>
            <div>·</div>
            <div>Free forever</div>
            <div>·</div>
            <div>No signup to browse</div>
          </div>
          <div
            style={{
              fontSize: 20,
              fontWeight: 600,
              color: "#7E5BEF",
            }}
          >
            copy-prompt.vercel.app
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
