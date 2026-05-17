import type { ReactNode } from "react";

export function StudioPanel({
  id,
  step,
  title,
  subtitle,
  children,
  className = "",
}: {
  id: string;
  step: string;
  title: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      id={id}
      className={`submit-panel scroll-mt-28 p-6 sm:p-8 ${className}`}
    >
      <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-center gap-4">
          <span
            className="font-mono text-4xl font-bold leading-none tracking-tighter text-primary/25 sm:text-5xl"
            aria-hidden
          >
            {step}
          </span>
          <div>
            <h2 className="text-xl font-bold tracking-[-0.03em] text-foreground sm:text-2xl">
              {title}
            </h2>
            {subtitle && (
              <p className="mt-1 max-w-lg text-[13px] leading-relaxed text-muted-foreground">
                {subtitle}
              </p>
            )}
          </div>
        </div>
      </header>
      <div className="space-y-5">{children}</div>
    </section>
  );
}
