/**
 * Inline JSON-LD <script> renderer.
 *
 * Renders one or more Schema.org payloads as `<script type="application/ld+json">`
 * tags. Designed for server components — the JSON is emitted into the
 * initial HTML so crawlers and AI engines see it on first byte.
 *
 * Usage
 * ─────
 *   <JsonLd data={promptCreativeWorkJsonLd({...})} />
 *
 *   <JsonLd
 *     data={[
 *       breadcrumbListJsonLd([...]),
 *       promptCreativeWorkJsonLd({...}),
 *       faqJsonLd([...]),
 *     ]}
 *   />
 *
 * Why `dangerouslySetInnerHTML`
 * ─────────────────────────────
 * React would escape `<` and `>` inside a regular text child, breaking
 * the JSON. The official Next.js recommendation is to use `dangerouslySet`
 * with a JSON.stringify'd payload. We strip "</" sequences as a defensive
 * measure against payload-injection in case any user content slips into
 * the JSON.
 */

type JsonLdValue = Record<string, unknown> | Array<Record<string, unknown>>;

function serialize(data: JsonLdValue): string {
  // Replace "</" with "<\/" so a malicious string can't close the
  // <script> tag prematurely.
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export function JsonLd({ data }: { data: JsonLdValue }) {
  if (Array.isArray(data)) {
    return (
      <>
        {data.map((item, idx) => (
          <script
            // biome-ignore lint/suspicious/noArrayIndexKey: order is stable per render
            key={idx}
            type="application/ld+json"
            // biome-ignore lint/security/noDangerouslySetInnerHtml: required for JSON-LD
            dangerouslySetInnerHTML={{ __html: serialize(item) }}
          />
        ))}
      </>
    );
  }

  return (
    <script
      type="application/ld+json"
      // biome-ignore lint/security/noDangerouslySetInnerHtml: required for JSON-LD
      dangerouslySetInnerHTML={{ __html: serialize(data) }}
    />
  );
}
