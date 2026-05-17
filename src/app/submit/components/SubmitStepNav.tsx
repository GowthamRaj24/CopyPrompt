"use client";

import { useEffect, useState } from "react";

const STEPS = [
  { id: "step-distribution", label: "Distribution", num: "01" },
  { id: "step-content", label: "Content", num: "02" },
  { id: "step-proof", label: "Proof", num: "03" },
  { id: "step-discover", label: "Discover", num: "04" },
  { id: "step-launch", label: "Launch", num: "05" },
] as const;

export function SubmitStepNav() {
  const [active, setActive] = useState<string>(STEPS[0].id);

  useEffect(() => {
    const sections = STEPS.map((s) => document.getElementById(s.id)).filter(
      Boolean,
    ) as HTMLElement[];

    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target.id) setActive(visible.target.id);
      },
      { rootMargin: "-30% 0px -55% 0px", threshold: [0, 0.25, 0.5] },
    );

    for (const el of sections) observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <nav
      aria-label="Form sections"
      className="hidden lg:block"
    >
      <div className="sticky top-24 space-y-1">
        <p className="eyebrow mb-4 px-2">Workflow</p>
        {STEPS.map((step) => {
          const isActive = active === step.id;
          return (
            <a
              key={step.id}
              href={`#${step.id}`}
              className={`group flex items-center gap-3 rounded-lg px-2 py-2.5 transition-colors ${
                isActive
                  ? "bg-primary/15 text-primary"
                  : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
              }`}
            >
              <span
                className={`font-mono text-[11px] font-semibold tabular-nums ${
                  isActive ? "text-primary" : "text-muted-foreground/50"
                }`}
              >
                {step.num}
              </span>
              <span className="text-[13px] font-medium">{step.label}</span>
              {isActive && (
                <span
                  className="ml-auto size-1.5 rounded-full bg-primary"
                  aria-hidden
                />
              )}
            </a>
          );
        })}
      </div>
    </nav>
  );
}
