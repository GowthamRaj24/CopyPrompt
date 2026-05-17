import { HeartIcon } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { type AppUser, getCurrentUser } from "@/server/lib/auth";
import { CommandTrigger } from "./CommandTrigger";
import { MobileNav } from "./MobileNav";
import { ThemeToggle } from "./ThemeToggle";
import { UserMenu } from "./UserMenu";

/**
 * Sticky top header — clean, minimal, precision-crafted.
 * Hidden on auth routes via the parent <HiddenOnAuth /> wrapper.
 *
 * Features:
 *   - Glass-strong backdrop blur
 *   - Cmd+K search trigger
 *   - Minimal nav links with refined hover
 *   - Compact, restrained proportions
 */
export async function Header() {
  let user: AppUser | null = null;
  try {
    user = await getCurrentUser();
  } catch (err) {
    console.error("Header auth lookup failed", err);
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border/50 bg-background/60 backdrop-blur-xl backdrop-saturate-150 supports-[backdrop-filter]:bg-background/40">
      <div className="container mx-auto flex h-14 items-center justify-between gap-4 px-4 sm:px-6">
        <Link
          href="/"
          className="group flex items-center gap-2.5 transition-opacity hover:opacity-85"
        >
          <Logomark />
          <span className="text-[14px] font-semibold tracking-[-0.02em]">
            CopyPrompt
          </span>
        </Link>

        <nav
          className="hidden items-center gap-0.5 md:flex"
          aria-label="Primary"
        >
          <NavLink href="/search">Browse</NavLink>
          <NavLink href="/search?type=image">Image</NavLink>
          <NavLink href="/search?type=text">Text</NavLink>
        </nav>

        {/* Desktop action row — visible from md+ */}
        <div className="hidden items-center gap-1.5 md:flex">
          <CommandTrigger />
          <ThemeToggle />
          <Link
            href="/favorites"
            aria-label="Favorites"
            className="press grid size-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <HeartIcon className="size-[15px]" strokeWidth={1.8} />
          </Link>
          <Button variant="ghost" size="sm" asChild className="press h-8 px-3 text-[13px]">
            <Link href="/submit">Submit</Link>
          </Button>
          {user ? (
            <UserMenu user={user} />
          ) : (
            <Button
              variant="default"
              size="sm"
              asChild
              className="magnetic h-8 rounded-lg bg-primary px-3.5 text-[12px] font-medium text-primary-foreground shadow-[0_1px_2px_0_oklch(0_0_0/0.15),inset_0_1px_0_0_oklch(1_0_0/0.1)] hover:bg-primary/90"
            >
              <Link href="/signin">Sign in</Link>
            </Button>
          )}
        </div>

        {/* Mobile action row — theme toggle next to the menu trigger so
            users can flip themes without opening the nav sheet. */}
        <div className="flex items-center gap-1 md:hidden">
          <ThemeToggle />
          <MobileNav user={user} />
        </div>
      </div>
    </header>
  );
}

function NavLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="rounded-lg px-2.5 py-1.5 text-[13px] font-medium text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
    >
      {children}
    </Link>
  );
}

/** Logo mark — refined gradient square with copy icon */
function Logomark() {
  return (
    <span
      aria-hidden
      className="relative grid size-[26px] place-items-center overflow-hidden rounded-[7px] bg-primary text-primary-foreground shadow-[inset_0_1px_0_0_rgb(255_255_255_/_0.12),0_1px_2px_0_oklch(0_0_0/0.2)]"
    >
      <span
        className="absolute inset-0 bg-gradient-to-b from-white/15 to-transparent"
        aria-hidden
      />
      <svg
        viewBox="0 0 16 16"
        fill="none"
        className="relative size-3"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M5 3h6a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <path
          d="M3 9V3h6"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.5"
        />
      </svg>
    </span>
  );
}
