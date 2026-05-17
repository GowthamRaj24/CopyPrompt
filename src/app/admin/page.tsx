import {
  ArrowRightIcon,
  BarChart3Icon,
  CheckCircle2Icon,
  ClockIcon,
  XCircleIcon,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { getSubmissionCounts } from "@/server/services/admin.service";

export const metadata: Metadata = {
  title: "Admin · Dashboard",
  robots: { index: false, follow: false },
};

export default async function AdminDashboardPage() {
  const counts = await getSubmissionCounts();

  return (
    <section className="container mx-auto px-4 py-10 sm:px-6 md:py-14">
      <header className="mb-10 border-b border-border pb-6">
        <p className="eyebrow mb-2">Admin</p>
        <h1 className="text-3xl font-bold tracking-[-0.02em] md:text-4xl">
          Dashboard
        </h1>
        <p className="mt-2 text-[14px] text-muted-foreground">
          Approve or reject incoming submissions.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard
          icon={<ClockIcon className="size-5" />}
          label="Pending"
          value={counts.pending}
          accent={counts.pending > 0}
          href="/admin/queue"
          cta={counts.pending > 0 ? "Review now" : "All clear"}
        />
        <StatCard
          icon={<CheckCircle2Icon className="size-5" />}
          label="Approved"
          value={counts.approved}
          href="/admin/queue?status=approved"
        />
        <StatCard
          icon={<XCircleIcon className="size-5" />}
          label="Rejected"
          value={counts.rejected}
          href="/admin/queue?status=rejected"
        />
      </div>

      {/* Analytics teaser — full dashboard at /admin/analytics */}
      <div className="mt-6">
        <Link
          href="/admin/analytics"
          className="lift relative flex items-center gap-4 rounded-xl border border-border bg-card p-5 transition-all hover:border-primary/40"
        >
          <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
            <BarChart3Icon className="size-5" />
          </span>
          <div className="flex-1">
            <p className="text-[14px] font-semibold tracking-[-0.005em]">
              Analytics
            </p>
            <p className="mt-0.5 text-[12.5px] text-muted-foreground">
              Live signups, submissions, copies, and the prompts people
              actually use.
            </p>
          </div>
          <ArrowRightIcon className="size-4 text-muted-foreground" />
        </Link>
      </div>
    </section>
  );
}

function StatCard({
  icon,
  label,
  value,
  accent,
  href,
  cta,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  accent?: boolean;
  href?: string;
  cta?: string;
}) {
  const card = (
    <div
      className={`lift relative flex flex-col gap-3 rounded-xl border p-5 transition-all ${
        accent
          ? "border-primary/40 bg-primary/[0.06] hover:border-primary/60"
          : "border-border bg-card hover:border-foreground/30"
      }`}
    >
      <div
        className={`flex items-center gap-2 text-[13px] font-medium ${
          accent ? "text-primary" : "text-muted-foreground"
        }`}
      >
        {icon}
        {label}
      </div>
      <div className="text-3xl font-bold tracking-[-0.02em] text-foreground md:text-4xl">
        {value.toLocaleString()}
      </div>
      {cta && (
        <div
          className={`flex items-center gap-1 text-[13px] font-medium ${
            accent ? "text-primary" : "text-muted-foreground"
          }`}
        >
          {cta}
          {href && <ArrowRightIcon className="size-3.5" />}
        </div>
      )}
    </div>
  );

  return href ? <Link href={href}>{card}</Link> : card;
}
