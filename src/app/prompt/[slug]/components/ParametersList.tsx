interface ParametersListProps {
  params: Record<string, unknown>;
  modelType: "image" | "text";
}

/**
 * Typeset key-value list of prompt parameters.
 */
export function ParametersList({ params, modelType }: ParametersListProps) {
  const entries = Object.entries(params);

  if (entries.length === 0) {
    return (
      <p className="text-[12px] text-muted-foreground">
        No parameters specified.
      </p>
    );
  }

  const sorted = entries.sort(([, a], [, b]) => {
    const aLen = typeof a === "string" ? a.length : 0;
    const bLen = typeof b === "string" ? b.length : 0;
    return aLen - bLen;
  });

  return (
    <div>
      <dl className="space-y-0">
        {sorted.map(([key, value]) => {
          const label = formatLabel(key);
          const isLong = typeof value === "string" && value.length > 50;

          if (isLong) {
            return (
              <div key={key} className="border-b border-border/40 py-2.5 last:border-b-0">
                <dt className="mb-1.5 text-[11px] font-medium text-muted-foreground">
                  {label}
                </dt>
                <dd className="rounded-md border border-border/40 bg-background/30 p-2 font-mono text-[11px] leading-[1.65] whitespace-pre-wrap text-foreground">
                  {String(value)}
                </dd>
              </div>
            );
          }

          return (
            <div
              key={key}
              className="flex items-center justify-between gap-4 border-b border-border/40 py-2 last:border-b-0"
            >
              <dt className="text-[11px] font-medium text-muted-foreground">
                {label}
              </dt>
              <dd className="font-mono text-[12px] text-foreground">
                {formatValue(value)}
              </dd>
            </div>
          );
        })}
      </dl>

      <p className="mt-3 text-[11px] text-muted-foreground">
        {modelType === "image"
          ? "Image generation parameters"
          : "Text generation parameters"}
      </p>
    </div>
  );
}

function formatLabel(key: string): string {
  return key
    .split("_")
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(" ");
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  if (typeof value === "boolean") return value ? "true" : "false";
  return JSON.stringify(value);
}
