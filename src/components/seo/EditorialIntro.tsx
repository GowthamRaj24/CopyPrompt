/**
 * Visible editorial block for listing pages (category, tag, model).
 * Gives crawlers and human reviewers substantive unique prose above
 * the prompt grid — critical for AdSense "low value content" compliance.
 */
export function EditorialIntro({ paragraphs }: { paragraphs: string[] }) {
  if (paragraphs.length === 0) return null;

  return (
    <div className="reveal delay-2 mb-8 max-w-3xl space-y-3.5 rounded-xl border border-border/50 bg-card/30 p-5 md:mb-10 md:p-6">
      {paragraphs.map((paragraph) => (
        <p
          key={paragraph.slice(0, 48)}
          className="text-[14px] leading-[1.75] text-muted-foreground md:text-[15px]"
        >
          {paragraph}
        </p>
      ))}
    </div>
  );
}
