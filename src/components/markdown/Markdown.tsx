import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

/**
 * Markdown
 * ────────
 * Renders user-submitted markdown (sample outputs, curator notes, AI
 * responses) with carefully-tuned Tailwind styles that match the rest
 * of the app's typography.
 *
 * Why this component exists
 * ─────────────────────────
 * Before this, AI sample outputs like:
 *
 *     1. **Outcome-focused** (what they'll have after)
 *     2. **Pain-focused** (what they'll stop suffering)
 *
 * were rendered as plain text with literal asterisks visible. Now
 * `**bold**` becomes <strong>, ordered/unordered lists become real
 * lists, headings render as headings, fenced code blocks get a mono
 * background, etc.
 *
 * Security
 * ────────
 * Raw HTML is disabled by default in react-markdown — only markdown
 * syntax is parsed. Safe for arbitrary user input.
 *
 * Plugins
 * ───────
 *   - remark-gfm: GitHub-flavored markdown (tables, task lists,
 *     strikethrough, autolinks)
 */

const components: Components = {
  // ── Block-level ───────────────────────────────────────────────
  h1: ({ children }) => (
    <h1 className="mt-5 mb-2 text-[18px] font-bold tracking-[-0.02em] text-foreground first:mt-0 md:text-[19px]">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="mt-5 mb-2 text-[16px] font-semibold tracking-[-0.015em] text-foreground first:mt-0 md:text-[17px]">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="mt-4 mb-1.5 text-[14px] font-semibold text-foreground first:mt-0 md:text-[15px]">
      {children}
    </h3>
  ),
  h4: ({ children }) => (
    <h4 className="mt-4 mb-1.5 text-[13px] font-semibold text-foreground/90 first:mt-0">
      {children}
    </h4>
  ),
  p: ({ children }) => (
    <p className="my-2 text-[13px] leading-[1.65] text-foreground/85 first:mt-0 last:mb-0 md:text-[14px]">
      {children}
    </p>
  ),

  // ── Lists ─────────────────────────────────────────────────────
  ul: ({ children }) => (
    <ul className="my-2 ml-5 list-disc space-y-1 marker:text-muted-foreground/60 first:mt-0 last:mb-0">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="my-2 ml-5 list-decimal space-y-1 marker:font-medium marker:text-primary/80 first:mt-0 last:mb-0">
      {children}
    </ol>
  ),
  li: ({ children }) => (
    <li className="pl-1 text-[13px] leading-[1.65] text-foreground/85 md:text-[14px]">
      {children}
    </li>
  ),

  // ── Inline emphasis ───────────────────────────────────────────
  strong: ({ children }) => (
    <strong className="font-semibold text-foreground">{children}</strong>
  ),
  em: ({ children }) => (
    <em className="italic text-foreground/90">{children}</em>
  ),
  del: ({ children }) => (
    <del className="text-muted-foreground line-through">{children}</del>
  ),

  // ── Code ──────────────────────────────────────────────────────
  code: ({ className, children, ...props }) => {
    // react-markdown passes `className="language-xyz"` on fenced code
    // blocks but leaves it undefined for inline code. We use that to
    // pick the visual treatment.
    const isInline = !className;
    if (isInline) {
      return (
        <code
          className="rounded-[4px] border border-border/50 bg-muted/60 px-1 py-[1px] font-mono text-[12px] text-foreground"
          {...props}
        >
          {children}
        </code>
      );
    }
    // Block code is wrapped in <pre> below — just style the inner text
    return (
      <code
        className="block overflow-x-auto whitespace-pre font-mono text-[12px] leading-[1.7] text-foreground"
        {...props}
      >
        {children}
      </code>
    );
  },
  pre: ({ children }) => (
    <pre className="my-3 overflow-x-auto rounded-lg border border-border/50 bg-muted/40 p-3 first:mt-0 last:mb-0">
      {children}
    </pre>
  ),

  // ── Quote ─────────────────────────────────────────────────────
  blockquote: ({ children }) => (
    <blockquote className="my-3 border-l-2 border-primary/40 bg-primary/[0.03] py-1 pl-3 text-foreground/85 first:mt-0 last:mb-0">
      {children}
    </blockquote>
  ),

  // ── Links ─────────────────────────────────────────────────────
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="link-underline font-medium text-primary"
    >
      {children}
    </a>
  ),

  // ── Tables (GFM) ──────────────────────────────────────────────
  table: ({ children }) => (
    <div className="my-3 overflow-x-auto rounded-lg border border-border/50 first:mt-0 last:mb-0">
      <table className="w-full text-[12.5px] md:text-[13px]">{children}</table>
    </div>
  ),
  thead: ({ children }) => (
    <thead className="border-b border-border/50 bg-muted/40">{children}</thead>
  ),
  tr: ({ children }) => (
    <tr className="border-b border-border/30 last:border-0">{children}</tr>
  ),
  th: ({ children }) => (
    <th className="px-3 py-2 text-left font-semibold text-foreground">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="px-3 py-2 text-foreground/85">{children}</td>
  ),

  // ── Misc ──────────────────────────────────────────────────────
  hr: () => <hr className="my-4 border-border/40" />,
};

export function Markdown({
  content,
  className,
}: {
  content: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={components}
        // Disable raw HTML for safety — only markdown syntax is parsed.
        skipHtml
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
