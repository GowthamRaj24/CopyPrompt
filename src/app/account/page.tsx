import {
  BellIcon,
  ChevronRightIcon,
  FolderIcon,
  HeartIcon,
  LayoutDashboardIcon,
  LogOutIcon,
  PlusIcon,
  ShieldAlertIcon,
  ShieldIcon,
  SparklesIcon,
  UserIcon,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { buildShareUrl } from "@/lib/share-token";
import { SITE_BRAND } from "@/lib/site-brand";
import { requireUser } from "@/server/lib/auth";
import { getCreatorById } from "@/server/services/creator.service";
import { listOwnedPrompts } from "@/server/services/private-prompt.service";
import { listRecentCopiedPrompts } from "@/server/services/recent-copies.service";
import { MyPromptsSection } from "./components/MyPromptsSection";
import { ProfileSection } from "./components/ProfileSection";
import { RecentlyCopiedSection } from "./components/RecentlyCopiedSection";

export const metadata: Metadata = {
  title: "Account",
  description: `Manage your ${SITE_BRAND.displayName} account, prompts, and settings.`,
  robots: { index: false, follow: false },
};

export default async function AccountPage() {
  const user = await requireUser();
  const [rows, recentCopies, creator] = await Promise.all([
    listOwnedPrompts(user.id),
    listRecentCopiedPrompts(user.id, 12),
    getCreatorById(user.id),
  ]);

  const prompts = rows.map((p) => ({
    id: p.id,
    title: p.title,
    slug: p.slug,
    visibility: p.visibility,
    status: p.status,
    copyCount: p.copyCount,
    createdAt: p.createdAt.toISOString(),
    shareUrl: p.shareToken ? buildShareUrl(p.shareToken) : null,
    publicUrl: p.visibility === "public" ? `/prompt/${p.slug}` : null,
  }));

  const privateCount = prompts.filter((p) => p.visibility === "private").length;
  const publicCount = prompts.length - privateCount;
  const totalCopies = prompts.reduce((sum, p) => sum + p.copyCount, 0);
  const isAdmin = user.plan === "admin";

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

      <div className="container relative mx-auto px-4 py-10 sm:px-6 md:py-14">
        <header className="reveal delay-1 mb-8 flex flex-col gap-4 border-b border-border pb-6 md:mb-10 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="eyebrow mb-2">Account</p>
            <h1 className="flex items-center gap-3 text-3xl font-bold tracking-[-0.02em] md:text-5xl">
              <span className="grid size-9 shrink-0 place-items-center rounded-lg border border-primary/30 bg-primary/10 text-primary md:size-12">
                <UserIcon className="size-4 md:size-5" strokeWidth={2} />
              </span>
              My prompts
            </h1>
            <p className="mt-2 text-[12px] text-muted-foreground">
              {prompts.length === 0
                ? "Create a private link or submit to the public catalog"
                : `${prompts.length} total · ${publicCount} public · ${privateCount} private · ${totalCopies.toLocaleString()} copies`}
            </p>
          </div>
          <Link
            href="/submit"
            className="magnetic inline-flex h-9 shrink-0 items-center gap-2 self-start rounded-md bg-primary px-4 text-[13px] font-semibold text-primary-foreground shadow-soft hover:bg-primary/90 md:self-auto"
          >
            <PlusIcon className="size-3.5" />
            New prompt
          </Link>
        </header>

        <div className="mx-auto grid max-w-[1080px] gap-6 lg:grid-cols-[minmax(0,272px)_minmax(0,1fr)] lg:gap-8">
          <aside className="reveal delay-2 space-y-3 lg:sticky lg:top-20 lg:self-start">
            <div className="overflow-hidden rounded-xl border border-border/60 bg-card/80 shadow-soft backdrop-blur-sm">
              <div className="border-b border-border/40 px-4 py-4">
                <div className="flex items-center gap-3">
                  <Avatar className="size-11 ring-2 ring-primary/15 ring-offset-2 ring-offset-card">
                    {user.avatarUrl && (
                      <AvatarImage
                        src={user.avatarUrl}
                        alt={user.fullName ?? user.email}
                      />
                    )}
                    <AvatarFallback className="bg-primary/15 text-sm font-semibold text-primary">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-1 text-[14px] font-semibold tracking-[-0.02em]">
                      {user.fullName ?? "Member"}
                    </p>
                    <p className="line-clamp-1 text-[11px] text-muted-foreground">
                      {user.email}
                    </p>
                    <div className="mt-1.5">
                      <PlanBadge variant={user.plan === "admin" ? "admin" : user.plan === "premium" ? "premium" : "free"}>
                        {user.plan === "admin" ? "Admin" : user.plan === "premium" ? "Premium" : "Free"}
                      </PlanBadge>
                    </div>
                  </div>
                </div>

                <dl className="mt-4 grid grid-cols-3 gap-2">
                  <StatCell label="Prompts" value={prompts.length} />
                  <StatCell label="Private" value={privateCount} />
                  <StatCell label="Copies" value={totalCopies} />
                </dl>
              </div>

              <nav className="p-2" aria-label="Account navigation">
                {isAdmin && (
                  <NavRow
                    href="/admin"
                    icon={<LayoutDashboardIcon className="size-4" />}
                    label="Admin"
                    hint="Queue & analytics"
                  />
                )}
                <NavRow
                  href="/favorites"
                  icon={<HeartIcon className="size-4" />}
                  label="Favorites"
                  hint="Saved prompts"
                />
                <NavRow
                  href="/account/collections"
                  icon={<FolderIcon className="size-4" />}
                  label="Collections"
                  hint="My boards"
                />
                <NavRow
                  href="/account/searches"
                  icon={<BellIcon className="size-4" />}
                  label="Saved searches"
                  hint="Email alerts"
                />
                <NavRow
                  href="/submit"
                  icon={<PlusIcon className="size-4" />}
                  label="Submit"
                  hint="New prompt"
                />
                <NavRow
                  href="/account#my-prompts"
                  icon={<SparklesIcon className="size-4" />}
                  label="My prompts"
                  hint={`${prompts.length} total`}
                  active
                />
              </nav>

              <div className="border-t border-border/40 p-3">
                <form action="/auth/signout" method="post">
                  <Button
                    type="submit"
                    variant="outline"
                    className="press h-9 w-full gap-2 text-[12px]"
                  >
                    <LogOutIcon className="size-3.5" />
                    Sign out
                  </Button>
                </form>
              </div>
            </div>

            <Link
              href="/account/danger-zone"
              className="group flex items-center gap-3 rounded-xl border border-border/60 bg-card/40 px-3.5 py-2.5 transition-colors hover:border-destructive/30 hover:bg-destructive/[0.04]"
            >
              <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-destructive/10 text-destructive">
                <ShieldAlertIcon className="size-3.5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[12px] font-medium group-hover:text-destructive">
                  Privacy & data
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Export or delete
                </p>
              </div>
              <ChevronRightIcon className="size-3.5 text-muted-foreground/40 group-hover:text-destructive" />
            </Link>
          </aside>

          <div className="reveal delay-3 min-w-0">
            {creator && (
              <ProfileSection
                initial={{
                  handle: creator.handle,
                  fullName: creator.fullName,
                  bio: creator.bio,
                }}
              />
            )}
            <RecentlyCopiedSection initial={recentCopies} />
            <MyPromptsSection initialPrompts={prompts} />
          </div>
        </div>
      </div>
    </section>
  );
}

function StatCell({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-border/40 bg-muted/20 px-2 py-2 text-center">
      <p className="font-mono text-[15px] font-semibold tabular-nums leading-none text-foreground">
        {value.toLocaleString()}
      </p>
      <p className="mt-1 text-[9px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
    </div>
  );
}

function PlanBadge({
  children,
  variant,
}: {
  children: React.ReactNode;
  variant: "admin" | "premium" | "free";
}) {
  const styles = {
    admin: "border-primary/30 bg-primary/10 text-primary",
    premium:
      "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400",
    free: "border-border bg-background/80 text-muted-foreground",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider ${styles[variant]}`}
    >
      {variant === "admin" && (
        <ShieldIcon className="size-2.5" strokeWidth={2.5} />
      )}
      {children}
    </span>
  );
}

function NavRow({
  href,
  icon,
  label,
  hint,
  active,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  hint: string;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`group flex items-center gap-2.5 rounded-lg px-2.5 py-2 transition-colors ${
        active ? "bg-primary/10" : "hover:bg-muted/40"
      }`}
    >
      <span
        className={`grid size-7 shrink-0 place-items-center rounded-md border transition-colors ${
          active
            ? "border-primary/40 bg-primary/15 text-primary"
            : "border-border/50 bg-background/60 text-muted-foreground group-hover:border-primary/25 group-hover:text-primary"
        }`}
      >
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p
          className={`text-[12px] font-medium leading-tight ${
            active ? "text-primary" : "text-foreground"
          }`}
        >
          {label}
        </p>
        <p className="text-[10px] text-muted-foreground">{hint}</p>
      </div>
      {active && (
        <span
          className="size-1.5 shrink-0 rounded-full bg-primary"
          aria-hidden
        />
      )}
    </Link>
  );
}
