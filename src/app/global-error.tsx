"use client";

import { useEffect } from "react";

/**
 * Root-level error boundary. Fires when something blows up so badly
 * that even the root layout can't render. Must include its own <html>
 * and <body> because the layout is unavailable.
 *
 * Keep it minimal — no external CSS imports, no fancy components. The
 * goal is to give the user a way out, not to look pretty.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[global error]", error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0a0a0f",
          color: "#fafafa",
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          padding: "1rem",
        }}
      >
        <div style={{ maxWidth: "28rem", textAlign: "center" }}>
          <h1
            style={{
              fontSize: "1.5rem",
              fontWeight: 700,
              margin: "0 0 0.75rem",
              letterSpacing: "-0.02em",
            }}
          >
            Something broke.
          </h1>
          <p
            style={{
              fontSize: "0.9375rem",
              color: "#a1a1aa",
              margin: "0 0 1.5rem",
              lineHeight: 1.6,
            }}
          >
            The error has been logged. You can try reloading the app.
          </p>
          {error.digest && (
            <p
              style={{
                fontFamily: "ui-monospace, SFMono-Regular, monospace",
                fontSize: "0.75rem",
                color: "#71717a",
                marginBottom: "1.5rem",
              }}
            >
              Reference: {error.digest}
            </p>
          )}
          <button
            type="button"
            onClick={reset}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              height: "2.75rem",
              padding: "0 1.25rem",
              borderRadius: "0.5rem",
              backgroundColor: "#6366f1",
              color: "#ffffff",
              border: "none",
              fontWeight: 600,
              fontSize: "0.875rem",
              cursor: "pointer",
            }}
          >
            Reload app
          </button>
        </div>
      </body>
    </html>
  );
}
