"use client";

import Link from "next/link";
import { useCurrentUser } from "@/components/auth/CurrentUserProvider";
import { Button } from "@/components/ui/button";
import { UserMenu } from "./UserMenu";

/**
 * Desktop header account slot: avatar menu when signed in, "Sign in"
 * otherwise. Renders a same-size placeholder while the session is being
 * resolved so signed-in users never see a "Sign in" flash and the header
 * doesn't shift.
 */
export function HeaderAccount() {
  const { user, status } = useCurrentUser();

  if (status === "loading") {
    return (
      <span
        aria-hidden
        className="block h-9 w-[78px] animate-pulse rounded-lg bg-muted/40"
      />
    );
  }

  if (user) return <UserMenu user={user} />;

  return (
    <Button
      variant="default"
      size="sm"
      asChild
      className="magnetic h-9 rounded-lg bg-primary px-4 text-[13px] font-semibold text-primary-foreground shadow-[0_1px_2px_0_oklch(0_0_0/0.12),inset_0_1px_0_0_oklch(1_0_0/0.12),0_4px_14px_-4px_oklch(0.54_0.225_270/0.55)] hover:bg-primary/92"
    >
      <Link href="/signin">Sign in</Link>
    </Button>
  );
}
