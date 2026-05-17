import {
  HeartIcon,
  LogOutIcon,
  SettingsIcon,
  ShieldAlertIcon,
  ShieldIcon,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/server/lib/auth";

export const metadata: Metadata = {
  title: "Account",
  description: "Manage your CopyPrompt account.",
  robots: { index: false, follow: false },
};

export default async function AccountPage() {
  const user = await requireUser();

  const initials = (user.fullName ?? user.email)
    .split(/[\s@]/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join("");

  return (
    <section className="relative">
      <div
        aria-hidden
        className="bg-spotlight-top pointer-events-none absolute inset-x-0 top-0 h-[460px]"
      />

      <div className="container relative mx-auto max-w-2xl px-4 py-10 sm:px-6 md:py-14">
        <header className="reveal mb-10 border-b border-border pb-6 md:mb-14">
          <p className="eyebrow mb-2">Account</p>
          <h1 className="text-3xl font-bold tracking-[-0.02em] md:text-5xl">
            Your account
          </h1>
          <p className="mt-3 text-[14px] leading-relaxed text-muted-foreground md:text-[15px]">
            Manage your profile and sign out.
          </p>
        </header>

        {/* Profile card */}
        <div className="reveal delay-1 rounded-xl border border-border bg-card p-6 shadow-soft">
          <div className="flex items-center gap-4">
            <Avatar className="size-14">
              {user.avatarUrl && (
                <AvatarImage
                  src={user.avatarUrl}
                  alt={user.fullName ?? user.email}
                />
              )}
              <AvatarFallback className="bg-primary/15 text-base font-semibold text-primary">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <h2 className="line-clamp-1 text-[16px] font-semibold tracking-[-0.01em]">
                {user.fullName ?? user.email}
              </h2>
              <p className="line-clamp-1 text-[13px] text-muted-foreground">
                {user.email}
              </p>
              {user.plan === "admin" ? (
                <span className="mt-2 inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-primary">
                  <ShieldIcon className="size-2.5" strokeWidth={2.5} />
                  Admin
                </span>
              ) : (
                <span className="mt-2 inline-flex items-center rounded-full border border-border bg-background px-2 py-0.5 text-[11px] font-medium text-foreground">
                  {user.plan === "premium" ? "Premium plan" : "Free plan"}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Quick links */}
        <div className="reveal delay-2 mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <QuickLink
            href="/favorites"
            icon={<HeartIcon className="size-4" />}
            label="Favorites"
            sublabel="Your saved prompts"
          />
          <QuickLink
            href="/submit"
            icon={<SettingsIcon className="size-4" />}
            label="Submit a prompt"
            sublabel="Share with the community"
          />
        </div>

        {/* Sign out */}
        <div className="reveal delay-3 mt-6 rounded-xl border border-border bg-card p-6 shadow-soft">
          <h3 className="text-[14px] font-semibold tracking-[-0.005em]">
            Sign out
          </h3>
          <p className="mt-1 text-[13px] text-muted-foreground">
            You&apos;ll need to sign in again to manage favorites or submit
            prompts.
          </p>
          <form action="/auth/signout" method="post" className="mt-4">
            <Button
              type="submit"
              variant="outline"
              size="lg"
              className="press h-10 rounded-md border-border text-[13px]"
            >
              <LogOutIcon className="size-4" />
              Sign out
            </Button>
          </form>
        </div>

        {/* Danger zone — privacy controls */}
        <Link
          href="/account/danger-zone"
          className="reveal delay-3 group mt-4 flex items-center gap-3 rounded-xl border border-border bg-card px-6 py-4 transition-colors hover:border-destructive/40 hover:bg-destructive/[0.02]"
        >
          <span className="grid size-9 shrink-0 place-items-center rounded-md bg-destructive/10 text-destructive">
            <ShieldAlertIcon className="size-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[13.5px] font-semibold tracking-[-0.005em] transition-colors group-hover:text-destructive">
              Privacy & data
            </p>
            <p className="line-clamp-1 text-[12px] text-muted-foreground">
              Download a copy of your data or delete your account.
            </p>
          </div>
        </Link>
      </div>
    </section>
  );
}

function QuickLink({
  href,
  icon,
  label,
  sublabel,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  sublabel: string;
}) {
  return (
    <Link
      href={href}
      className="lift group flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 transition-all hover:border-primary/40"
    >
      <span className="grid size-9 shrink-0 place-items-center rounded-md bg-primary/15 text-primary">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-[14px] font-semibold tracking-[-0.005em] text-foreground transition-colors group-hover:text-primary">
          {label}
        </p>
        <p className="line-clamp-1 text-[12px] text-muted-foreground">
          {sublabel}
        </p>
      </div>
    </Link>
  );
}
