import {
  ArrowRightIcon,
  CpuIcon,
  FolderIcon,
  HashIcon,
  SparklesIcon,
} from "lucide-react";
import Link from "next/link";

interface BrowseSeoSectionProps {
  models: Array<{
    slug: string;
    name: string;
    type: "image" | "text";
    promptCount: number;
  }>;
  tags: Array<{ slug: string; name: string; promptCount: number }>;
  /** Optional curated collections — shown above models when present. */
  curatedCollections?: Array<{
    slug: string;
    name: string;
    description: string | null;
    promptCount: number;
  }>;
}

/** Homepage SEO browse links — curated boards + models + popular tags. */
export function BrowseSeoSection({
  models,
  tags,
  curatedCollections,
}: BrowseSeoSectionProps) {
  const topModels = models.slice(0, 8);
  const topTags = tags.slice(0, 16);
  const topCurated = (curatedCollections ?? []).slice(0, 6);

  if (
    topModels.length === 0 &&
    topTags.length === 0 &&
    topCurated.length === 0
  ) {
    return null;
  }

  return (
    <section className="cv-below-fold border-t border-border/40 bg-card/10">
      <div className="container mx-auto px-4 py-10 sm:px-6 md:py-14">
        {topCurated.length > 0 && (
          <div className="mb-10">
            <div className="mb-6 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-end">
              <div>
                <p className="eyebrow mb-1.5 inline-flex items-center gap-1.5">
                  <SparklesIcon className="size-3" />
                  Curated playbooks
                </p>
                <h2 className="text-[1.375rem] font-bold tracking-[-0.03em] md:text-[1.75rem]">
                  Hand-picked collections
                </h2>
                <p className="mt-1 text-[12.5px] text-muted-foreground">
                  Themed boards for specific workflows.
                </p>
              </div>
              <Link
                href="/collections"
                className="link-underline inline-flex items-center gap-1 text-[13px] font-medium text-muted-foreground hover:text-foreground"
              >
                All collections
                <ArrowRightIcon className="size-3" />
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {topCurated.map((c) => (
                <Link
                  key={c.slug}
                  href={`/c/${c.slug}`}
                  className="lift flex h-full flex-col gap-2 rounded-xl border border-border/50 bg-card/60 p-4 transition-all hover:border-primary/30 hover:bg-card"
                >
                  <span className="grid size-8 shrink-0 place-items-center rounded-lg border border-border/50 bg-background/60 text-muted-foreground">
                    <FolderIcon className="size-3.5" strokeWidth={2} />
                  </span>
                  <p className="line-clamp-2 text-[14px] font-semibold tracking-[-0.01em] text-foreground">
                    {c.name}
                  </p>
                  {c.description && (
                    <p className="line-clamp-2 text-[12px] text-muted-foreground">
                      {c.description}
                    </p>
                  )}
                  <p className="mt-auto font-mono text-[11px] text-muted-foreground">
                    {c.promptCount} prompts
                  </p>
                </Link>
              ))}
            </div>
          </div>
        )}

        {topModels.length > 0 && (
          <div className="mb-10">
            <div className="mb-6 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-end">
              <div>
                <p className="eyebrow mb-1.5 inline-flex items-center gap-1.5">
                  <CpuIcon className="size-3" />
                  By AI model
                </p>
                <h2 className="text-[1.375rem] font-bold tracking-[-0.03em] md:text-[1.75rem]">
                  Prompts for every tool
                </h2>
                <p className="mt-1 text-[12.5px] text-muted-foreground">
                  Midjourney, ChatGPT, Claude, Flux, and more.
                </p>
              </div>
              <Link
                href="/models"
                className="link-underline inline-flex items-center gap-1 text-[13px] font-medium text-muted-foreground hover:text-foreground"
              >
                All models
                <ArrowRightIcon className="size-3" />
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-4">
              {topModels.map((m) => (
                <Link
                  key={m.slug}
                  href={`/models/${m.slug}`}
                  className="lift rounded-lg border border-border/50 bg-card/60 px-3 py-2.5 text-[13px] font-medium transition-all hover:border-primary/30 hover:bg-card hover:text-primary"
                >
                  <span className="line-clamp-1">{m.name}</span>
                  <span className="mt-0.5 block font-mono text-[10px] tabular-nums text-muted-foreground">
                    {m.promptCount} prompts
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {topTags.length > 0 && (
          <div>
            <div className="mb-5">
              <p className="eyebrow mb-1.5 inline-flex items-center gap-1.5">
                <HashIcon className="size-3" />
                Popular tags
              </p>
              <h2 className="text-[1.375rem] font-bold tracking-[-0.03em] md:text-[1.75rem]">
                Trending topics
              </h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {topTags.map((t) => (
                <Link
                  key={t.slug}
                  href={`/tag/${t.slug}`}
                  className="press inline-flex items-center gap-1.5 rounded-full border border-border/50 bg-card/50 px-3 py-1 text-[12px] font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:bg-card hover:text-foreground"
                >
                  <span className="text-foreground">#{t.name}</span>
                  <span className="font-mono text-[10px] tabular-nums opacity-70">
                    {t.promptCount}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
