import { ArrowLeftIcon, BoltIcon, ShieldCheckIcon, ZapIcon } from "lucide-react";
import Link from "next/link";

interface AuthLayoutProps {
  title: string;
  subtitle?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
}

const HIGHLIGHTS = [
  {
    icon: ZapIcon,
    title: "Every AI tool",
    body: "ChatGPT, Claude, Midjourney, Flux, Gemini and beyond.",
  },
  {
    icon: BoltIcon,
    title: "One-click copy",
    body: "Search, click, paste. The fastest workflow there is.",
  },
  {
    icon: ShieldCheckIcon,
    title: "Free, forever",
    body: "No paywalls. No newsletter you didn't ask for.",
  },
];

/**
 * Premium auth shell — modern split.
 * Left: form. Right: marketing showcase (lg+).
 * No global header/footer (HiddenOnAuth wraps them).
 */
export function AuthLayout({
  title,
  subtitle,
  footer,
  children,
}: AuthLayoutProps) {
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Top utility — back link */}
      <div className="absolute top-0 right-0 left-0 z-20 flex items-center justify-end px-4 py-5 sm:px-6">
        <Link
          href="/"
          className="link-underline inline-flex items-center gap-1.5 text-[12px] font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeftIcon className="size-3.5" aria-hidden />
          Back home
        </Link>
      </div>

      <div className="relative grid min-h-screen lg:grid-cols-[1fr_1.05fr]">
        {/* ── Form column ────────────────────────────── */}
        <main className="flex items-center justify-center px-4 pt-20 pb-12 sm:px-6 sm:pb-16">
          <div className="w-full max-w-md">
            {/* Brand */}
            <Link
              href="/"
              className="reveal mb-9 inline-flex items-center gap-2 transition-opacity hover:opacity-90"
              aria-label="CopyPrompt home"
            >
              <span
                aria-hidden
                className="grid size-7 place-items-center overflow-hidden rounded-md bg-primary text-primary-foreground"
              >
                <svg
                  viewBox="0 0 16 16"
                  fill="none"
                  className="size-3.5"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M5 3h6a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              <span className="text-[15px] font-semibold tracking-[-0.01em]">
                CopyPrompt
              </span>
            </Link>

            {/* Form card */}
            <div className="reveal delay-1 rounded-xl border border-border bg-card p-6 shadow-card sm:p-8">
              <div className="mb-6">
                <h1 className="text-2xl font-bold leading-tight tracking-[-0.02em] sm:text-3xl">
                  {title}
                </h1>
                {subtitle && (
                  <p className="mt-2 text-[14px] leading-relaxed text-muted-foreground">
                    {subtitle}
                  </p>
                )}
              </div>
              {children}
            </div>

            {footer && (
              <p className="reveal delay-2 mt-6 text-center text-[14px] text-muted-foreground">
                {footer}
              </p>
            )}
          </div>
        </main>

        {/* ── Showcase column (lg+) ──────────────────── */}
        <aside
          aria-hidden="true"
          className="relative hidden overflow-hidden border-l border-border bg-card/40 lg:block"
        >
          {/* Atmosphere */}
          <div
            aria-hidden
            className="bg-hero pointer-events-none absolute inset-0"
          />
          <div
            aria-hidden
            className="bg-grid pointer-events-none absolute inset-0 opacity-[0.4]"
          />

          <div className="relative flex h-full flex-col justify-center p-12 xl:p-16">
            <div className="max-w-md">
              <h2 className="text-4xl font-bold leading-[1.05] tracking-[-0.03em] xl:text-[3rem]">
                The fastest way to find{" "}
                <span className="bg-gradient-to-br from-primary to-primary/60 bg-clip-text text-transparent">
                  AI prompts.
                </span>
              </h2>
              <p className="mt-5 text-[15px] leading-relaxed text-muted-foreground">
                Search, copy and paste prompts that actually work — for ChatGPT,
                Claude, Midjourney, Flux and every AI tool you use.
              </p>

              {/* Feature list */}
              <ul className="mt-10 space-y-4">
                {HIGHLIGHTS.map((h) => (
                  <li
                    key={h.title}
                    className="flex items-start gap-3 rounded-lg border border-border/60 bg-card/60 p-4 backdrop-blur-md"
                  >
                    <span className="grid size-9 shrink-0 place-items-center rounded-md bg-primary/15 text-primary">
                      <h.icon className="size-4" />
                    </span>
                    <div>
                      <p className="text-[14px] font-semibold tracking-[-0.005em]">
                        {h.title}
                      </p>
                      <p className="mt-0.5 text-[13px] leading-relaxed text-muted-foreground">
                        {h.body}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
