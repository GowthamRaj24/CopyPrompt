import { HeartIcon, PlusIcon } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { type AppUser, getCurrentUser } from "@/server/lib/auth";
import { CommandTrigger } from "./CommandTrigger";
import { HeaderNav } from "./HeaderNav";
import { LogoLink } from "./Logo";
import { MobileNav } from "./MobileNav";
import { ThemeToggle } from "./ThemeToggle";
import { UserMenu } from "./UserMenu";

/**
 * Sticky top header — glass surface, pill nav, grouped actions.
 */
export async function Header() {
  let user: AppUser | null = null;
  try {
    user = await getCurrentUser();
  } catch (err) {
    console.error("Header auth lookup failed", err);
  }

  return (
    <header className="sticky top-0 z-50">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 z-10 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent"
      />

      <div className="border-b border-border/40 bg-background/75 shadow-[0_8px_32px_-12px_oklch(0_0_0/0.12)] backdrop-blur-2xl backdrop-saturate-150 supports-[backdrop-filter]:bg-background/55 dark:shadow-[0_8px_32px_-12px_oklch(0_0_0/0.45)]">
        <div className="container relative mx-auto flex h-[60px] items-center justify-between gap-3 px-4 sm:gap-4 sm:px-6 lg:gap-8">
          <LogoLink size="md" variant="header" className="shrink-0" />

          <div className="absolute left-1/2 hidden -translate-x-1/2 md:block">
            <Suspense fallback={<HeaderNavFallback />}>
              <HeaderNav />
            </Suspense>
          </div>

          <div className="hidden items-center gap-2 md:flex">
            <div className="flex items-center gap-0.5 rounded-xl border border-border/50 bg-card/30 p-0.5 shadow-[inset_0_1px_0_0_oklch(1_0_0/0.05)] backdrop-blur-sm dark:bg-card/20">
              <CommandTrigger />
              <ThemeToggle className="size-9 rounded-lg border-0 bg-transparent hover:bg-muted/80" />
              <Link
                href="/favorites"
                aria-label="Favorites"
                className="press grid size-9 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted/80 hover:text-foreground"
              >
                <HeartIcon className="size-[15px]" strokeWidth={1.8} />
              </Link>
            </div>

            <span aria-hidden className="mx-0.5 h-6 w-px bg-border/50" />

            <Button
              variant="ghost"
              size="sm"
              asChild
              className="press h-9 gap-1.5 rounded-lg px-3 text-[13px] font-medium text-muted-foreground hover:bg-muted/60 hover:text-foreground"
            >
              <Link href="/submit">
                <PlusIcon className="size-3.5" strokeWidth={2.2} />
                Submit
              </Link>
            </Button>

            {user ? (
              <UserMenu user={user} />
            ) : (
              <Button
                variant="default"
                size="sm"
                asChild
                className="magnetic h-9 rounded-lg bg-primary px-4 text-[13px] font-semibold text-primary-foreground shadow-[0_1px_2px_0_oklch(0_0_0/0.12),inset_0_1px_0_0_oklch(1_0_0/0.12),0_4px_14px_-4px_oklch(0.54_0.225_270/0.55)] hover:bg-primary/92"
              >
                <Link href="/signin">Sign in</Link>
              </Button>
            )}
          </div>

          <div className="flex items-center gap-1 md:hidden">
            <CommandTrigger mobile />
            <ThemeToggle className="size-9 rounded-lg" />
            <MobileNav user={user} />
          </div>
        </div>
      </div>
    </header>
  );
}

function HeaderNavFallback() {
  return (
    <div
      aria-hidden
      className="h-9 w-[220px] animate-pulse rounded-xl border border-border/40 bg-muted/20"
    />
  );
}
