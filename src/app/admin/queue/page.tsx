import { InboxIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import {
  getSubmissionCounts,
  listSubmissionsByStatus,
} from "@/server/services/admin.service";
import { SubmissionCard } from "./components/SubmissionCard";

export const metadata: Metadata = {
  title: "Admin · Queue",
  robots: { index: false, follow: false },
};

interface PageProps {
  searchParams: Promise<{ status?: string }>;
}

const TABS = [
  { value: "pending" as const, label: "Pending" },
  { value: "approved" as const, label: "Approved" },
  { value: "rejected" as const, label: "Rejected" },
];

export default async function AdminQueuePage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const status =
    sp.status === "approved" || sp.status === "rejected"
      ? sp.status
      : "pending";

  const [submissions, counts] = await Promise.all([
    listSubmissionsByStatus(status),
    getSubmissionCounts(),
  ]);

  return (
    <section className="container mx-auto px-4 py-10 sm:px-6 md:py-14">
      <header className="mb-8 border-b border-border pb-6 md:mb-10">
        <p className="eyebrow mb-2">Admin · Queue</p>
        <h1 className="text-3xl font-bold tracking-[-0.02em] md:text-4xl">
          Submissions
        </h1>
        <p className="mt-2 text-[14px] text-muted-foreground">
          Review user-submitted prompts. Approve to publish, reject with a
          reason.
        </p>
      </header>

      {/* Segment tabs — matches search/category style */}
      <div className="mb-8 inline-flex items-center gap-0.5 rounded-md border border-border bg-card p-0.5">
        {TABS.map((tab) => (
          <Link
            key={tab.value}
            href={
              tab.value === "pending"
                ? "/admin/queue"
                : `/admin/queue?status=${tab.value}`
            }
            className={`inline-flex h-8 items-center gap-1.5 rounded px-3 text-[12px] font-medium transition-colors ${
              status === tab.value
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
            aria-current={status === tab.value ? "page" : undefined}
          >
            {tab.label}
            <span
              className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                status === tab.value
                  ? "bg-background text-foreground"
                  : "bg-muted/50 text-muted-foreground"
              }`}
            >
              {counts[tab.value]}
            </span>
          </Link>
        ))}
      </div>

      {/* List */}
      {submissions.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/30 py-20 text-center">
          <div className="mb-5 grid size-14 place-items-center rounded-xl bg-primary/10 text-primary">
            <InboxIcon className="size-6" strokeWidth={2} />
          </div>
          <p className="text-[16px] font-semibold">
            {status === "pending" ? "Inbox zero" : `No ${status} submissions`}
          </p>
          <p className="mt-1 text-[13px] text-muted-foreground">
            {status === "pending"
              ? "Nothing waiting for review."
              : `Nothing has been ${status} yet.`}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {submissions.map((s) => (
            <SubmissionCard
              key={s.id}
              id={s.id}
              promptData={s.promptData}
              email={s.email}
              createdAt={s.createdAt}
              showActions={status === "pending"}
            />
          ))}
        </div>
      )}
    </section>
  );
}
