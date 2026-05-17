"use client";

import { LayoutDashboardIcon, LogOutIcon, ShieldIcon, UserIcon } from "lucide-react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { AppUser } from "@/server/lib/auth";

/**
 * Header user menu - shows when user is signed in.
 * Avatar + dropdown with Account / Sign out.
 *
 * Admins get a visible shield indicator on the avatar AND a dedicated
 * "Admin" section in the dropdown so it's obvious at a glance.
 *
 * Server Component. The signout is a server action via form POST.
 */
export function UserMenu({ user }: { user: AppUser }) {
  const initials = (user.fullName ?? user.email)
    .split(/[\s@]/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join("");

  const isAdmin = user.plan === "admin";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={`relative grid size-8 place-items-center rounded-full ring-1 ring-inset transition-all ${
            isAdmin
              ? "ring-primary/60 hover:ring-primary"
              : "ring-border hover:ring-primary/50"
          }`}
          aria-label={isAdmin ? "Open admin user menu" : "Open user menu"}
        >
          <Avatar className="size-7">
            {user.avatarUrl && (
              <AvatarImage src={user.avatarUrl} alt={user.fullName ?? user.email} />
            )}
            <AvatarFallback className="bg-primary/10 text-xs font-medium text-primary">
              {initials || <UserIcon className="size-4" />}
            </AvatarFallback>
          </Avatar>
          {/* Admin shield — bottom-right corner of the avatar */}
          {isAdmin && (
            <span
              aria-hidden
              className="absolute -right-0.5 -bottom-0.5 grid size-3.5 place-items-center rounded-full bg-primary text-primary-foreground ring-2 ring-background"
              title="You're an admin"
            >
              <ShieldIcon className="size-2" strokeWidth={3} />
            </span>
          )}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel className="flex flex-col gap-0.5">
          <span className="text-xs text-muted-foreground">Signed in as</span>
          <span className="line-clamp-1 text-sm font-medium">
            {user.fullName ?? user.email}
          </span>
          {user.fullName && (
            <span className="line-clamp-1 text-xs text-muted-foreground">
              {user.email}
            </span>
          )}
          {isAdmin && (
            <span className="mt-1.5 inline-flex w-fit items-center gap-1 rounded-md border border-primary/30 bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
              <ShieldIcon className="size-2.5" strokeWidth={2.5} />
              Admin
            </span>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuItem asChild>
          <Link href="/account" className="cursor-pointer">
            <UserIcon className="mr-2 size-4" />
            Account
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <Link href="/favorites" className="cursor-pointer">
            <span className="mr-2 leading-none text-pink-400">♥</span>
            Favorites
          </Link>
        </DropdownMenuItem>

        {isAdmin && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Admin
            </DropdownMenuLabel>
            <DropdownMenuItem asChild>
              <Link href="/admin" className="cursor-pointer">
                <LayoutDashboardIcon className="mr-2 size-4 text-primary" />
                Dashboard
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/admin/queue" className="cursor-pointer">
                <ShieldIcon className="mr-2 size-4 text-primary" />
                Review queue
              </Link>
            </DropdownMenuItem>
          </>
        )}

        <DropdownMenuSeparator />

        {/* Sign out via form POST (clears HttpOnly cookies on server) */}
        <DropdownMenuItem asChild>
          <form action="/auth/signout" method="post" className="w-full">
            <Button
              type="submit"
              variant="ghost"
              size="sm"
              className="h-auto w-full justify-start px-2 py-1.5 text-sm text-muted-foreground hover:text-foreground"
            >
              <LogOutIcon className="mr-2 size-4" />
              Sign out
            </Button>
          </form>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
