import { ArrowRightIcon, BookOpenIcon } from "lucide-react";
import Link from "next/link";
import { GUIDE_ARTICLES } from "@/lib/guides/content";

/** Homepage strip linking to editorial guides — AdSense content depth signal. */
export function HomeGuidesSection() {
  const featured = GUIDE_ARTICLES.slice(0, 3);

  return (
    <section className="cv-below-fold border-t border-border/40 bg-card/10">
      <div className="container mx-auto px-4 py-10 sm:px-6 md:py-14">
        <div className="mb-6 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <p className="eyebrow mb-1.5 inline-flex items-center gap-1.5">
              <BookOpenIcon className="size-3" aria-hidden />
              Learn
            </p>
            <h2 className="text-[1.375rem] font-bold tracking-[-0.03em] md:text-[1.75rem]">
              Prompt engineering guides
            </h2>
            <p className="mt-1 max-w-lg text-[12.5px] text-muted-foreground">
              Original tutorials on ChatGPT, Claude, Midjourney, and Flux — not
              generic tips lists.
            </p>
          </div>
          <Link
            href="/guides"
            className="link-underline inline-flex items-center gap-1 text-[13px] font-medium text-muted-foreground hover:text-foreground"
          >
            All guides
            <ArrowRightIcon className="size-3" aria-hidden />
          </Link>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {featured.map((guide) => (
            <Link
              key={guide.slug}
              href={`/guides/${guide.slug}`}
              className="lift rounded-xl border border-border/50 bg-card/60 p-4 transition-all hover:border-primary/30 hover:bg-card"
            >
              <h3 className="line-clamp-2 text-[14px] font-semibold tracking-[-0.01em]">
                {guide.title}
              </h3>
              <p className="mt-2 line-clamp-3 text-[12px] leading-relaxed text-muted-foreground">
                {guide.description}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
