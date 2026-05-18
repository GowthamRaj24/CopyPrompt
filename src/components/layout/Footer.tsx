import Link from "next/link";
import { LogoLink } from "@/components/layout/Logo";
import { SITE_BRAND } from "@/lib/site-brand";

/**
 * Minimal modern footer — restrained, elegant.
 * Hidden on auth routes via the parent <HiddenOnAuth /> wrapper.
 */
export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-20 border-t border-border/40">
      <div className="container mx-auto px-4 py-10 sm:px-6 md:py-14">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-12">
          {/* Brand column */}
          <div className="md:col-span-5">
            <LogoLink
              size="sm"
              className="[&_span:last-child]:text-[13px]"
            />
            <p className="mt-2.5 max-w-xs text-[13px] leading-relaxed text-muted-foreground">
              The fastest way to find, copy and paste prompts for every AI tool.
              Free forever.
            </p>
          </div>

          {/* Link columns */}
          <div className="grid grid-cols-2 gap-6 md:col-span-7 md:grid-cols-3">
            <FooterColumn
              title="Browse"
              links={[
                { href: "/search", label: "All prompts" },
                { href: "/models", label: "By AI model" },
                { href: "/search?type=image", label: "Image" },
                { href: "/search?type=text", label: "Text" },
              ]}
            />
            <FooterColumn
              title="Product"
              links={[
                { href: "/submit", label: "Submit" },
                { href: "/about", label: "About" },
                { href: "/changelog", label: "Changelog" },
              ]}
            />
            <FooterColumn
              title="Legal"
              links={[
                { href: "/privacy", label: "Privacy" },
                { href: "/terms", label: "Terms" },
              ]}
            />
          </div>
        </div>

        {/* Bottom strip */}
        <div className="mt-10 flex flex-col items-start justify-between gap-2 border-t border-border/40 pt-5 text-[11px] text-muted-foreground sm:flex-row sm:items-center">
          <p>© {year} {SITE_BRAND.name}</p>
          <div className="flex items-center gap-3">
            <Link
              href="/privacy"
              className="transition-colors hover:text-foreground"
            >
              Privacy
            </Link>
            <Link
              href="/terms"
              className="transition-colors hover:text-foreground"
            >
              Terms
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: { href: string; label: string }[];
}) {
  return (
    <div>
      <h3 className="mb-2.5 text-[12px] font-semibold tracking-[-0.01em] text-foreground">
        {title}
      </h3>
      <ul className="space-y-1.5">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="text-[12px] text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
