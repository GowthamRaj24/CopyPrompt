"use client";

import { CheckIcon } from "lucide-react";

export function ModelPicker({
  models,
  value,
  onChange,
  error,
}: {
  models: Array<{ slug: string; name: string }>;
  value: string;
  onChange: (slug: string) => void;
  error?: string;
}) {
  if (models.length === 0) {
    return (
      <p className="text-[13px] text-muted-foreground">
        No models available for this prompt type.
      </p>
    );
  }

  return (
    <div>
      <div
        className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3"
        role="listbox"
        aria-label="AI model"
      >
        {models.map((m) => {
          const selected = value === m.slug;
          return (
            <button
              key={m.slug}
              type="button"
              role="option"
              aria-selected={selected}
              onClick={() => onChange(m.slug)}
              className={`press relative flex min-h-[52px] items-center justify-between gap-2 rounded-xl border px-4 py-3 text-left transition-all ${
                selected
                  ? "border-primary bg-primary/15 text-foreground shadow-[0_0_24px_-8px_oklch(0.66_0.21_270_/_0.5)]"
                  : "border-border/50 bg-background/40 text-muted-foreground hover:border-primary/30 hover:bg-primary/5 hover:text-foreground"
              }`}
            >
              <span className="text-[13px] font-semibold leading-snug">
                {m.name}
              </span>
              {selected && (
                <span className="grid size-5 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground">
                  <CheckIcon className="size-3" strokeWidth={3} />
                </span>
              )}
            </button>
          );
        })}
      </div>
      {error && (
        <p className="mt-2 text-[12px] text-destructive">{error}</p>
      )}
    </div>
  );
}
