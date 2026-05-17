"use client";

import { MenuIcon, ShieldIcon } from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/layout/Logo";
import { SITE_BRAND } from "@/lib/site-brand";
import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import type { AppUser } from "@/server/lib/auth";

interface MobileNavProps {
  user: AppUser | null;
}

const NAV_LINKS = [
  { href: "/search", label: "Browse all" },
  { href: "/search?type=image", label: "Image prompts" },
  { href: "/search?type=text", label: "Text prompts" },
  { href: "/search?sort=trending", label: "Trending" },
  { href: "/favorites", label: "Favorites" },
];

export function MobileNav({ user }: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          aria-label="Open menu"
          className="press grid size-8 place-items-center rounded-lg border border-border/50 bg-card/60 transition-colors hover:bg-card md:hidden"
        >
          <MenuIcon className="size-4" />
        </button>
      </SheetTrigger>

      <SheetContent
        side="right"
        className="w-full max-w-[280px] border-l border-border/40 bg-background p-0"
      >
        <SheetHeader className="border-b border-border/40 p-4">
          <SheetTitle asChild>
            <Link
              href="/"
              onClick={close}
              className="flex items-center gap-2 text-left"
            >
              <Logo size="sm" />
            </Link>
          </SheetTitle>
        </SheetHeader>

        <nav aria-label="Mobile navigation" className="flex flex-col p-2.5">
          <p className="eyebrow mb-1.5 px-2.5 pt-1.5">Browse</p>
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={close}
              className="rounded-lg px-2.5 py-2 text-[13px] font-medium text-foreground transition-colors hover:bg-muted hover:text-primary"
            >
              {link.label}
            </Link>
          ))}

          <div className="my-2.5 h-px bg-border/40" />

          <p className="eyebrow mb-1.5 px-2.5">Contribute</p>
          <Link
            href="/submit"
            onClick={close}
            className="rounded-lg px-2.5 py-2 text-[13px] font-medium text-foreground transition-colors hover:bg-muted hover:text-primary"
          >
            Submit a prompt
          </Link>

          <div className="my-2.5 h-px bg-border/40" />

          {user ? (
            <>
              <p className="eyebrow mb-1.5 px-2.5">Account</p>
              <div className="flex items-center gap-2 px-2.5 pb-1.5">
                <p className="flex-1 text-[11px] text-muted-foreground">
                  Signed in as{" "}
                  <span className="font-medium text-foreground">
                    {user.fullName ?? user.email}
                  </span>
                </p>
                {user.plan === "admin" && (
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-md border border-primary/30 bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
                    <ShieldIcon className="size-2.5" strokeWidth={2.5} />
                    Admin
                  </span>
                )}
              </div>
              <Link
                href="/account"
                onClick={close}
                className="rounded-lg px-2.5 py-1.5 text-[12px] text-foreground transition-colors hover:bg-muted"
              >
                Account settings
              </Link>
              <Link
                href="/favorites"
                onClick={close}
                className="rounded-lg px-2.5 py-1.5 text-[12px] text-foreground transition-colors hover:bg-muted"
              >
                Favorites
              </Link>
              {user.plan === "admin" && (
                <>
                  <div className="my-2 h-px bg-border/40" />
                  <p className="eyebrow mb-1.5 px-2.5">Admin</p>
                  <Link
                    href="/admin"
                    onClick={close}
                    className="rounded-lg px-2.5 py-1.5 text-[12px] text-primary transition-colors hover:bg-muted"
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/admin/queue"
                    onClick={close}
                    className="rounded-lg px-2.5 py-1.5 text-[12px] text-primary transition-colors hover:bg-muted"
                  >
                    Review queue
                  </Link>
                </>
              )}
              <form action="/auth/signout" method="post" className="mt-1">
                <button
                  type="submit"
                  className="w-full rounded-lg px-2.5 py-1.5 text-left text-[12px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  Sign out
                </button>
              </form>
            </>
          ) : (
            <Link
              href="/signin"
              onClick={close}
              className="magnetic mt-1 flex h-10 items-center justify-center rounded-lg bg-primary text-[13px] font-medium text-primary-foreground hover:bg-primary/90"
            >
              Sign in
            </Link>
          )}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
