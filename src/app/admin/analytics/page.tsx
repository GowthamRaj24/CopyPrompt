import {
  CopyIcon,
  EyeIcon,
  SparklesIcon,
  TrendingUpIcon,
} from "lucide-react";
import type { Metadata } from "next";
import { loadAdminTrafficDashboard } from "@/server/services/analytics.service";
import { AnalyticsLazyPanels } from "./components/AnalyticsLazyPanels";
import {
  SectionHeader,
  TopPromptsTable,
  TrafficStat,
} from "./components/analytics-ui";

export const metadata: Metadata = {
  title: "Admin · Analytics",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminAnalyticsPage() {
  const { traffic, topPrompts } = await loadAdminTrafficDashboard();

  return (
    <section className="container mx-auto px-4 py-10 sm:px-6 md:py-14">
      <header className="mb-8 border-b border-border pb-6 md:mb-10">
        <p className="eyebrow mb-2">Admin · Analytics</p>
        <h1 className="text-3xl font-bold tracking-[-0.02em] md:text-5xl">
          Traffic
        </h1>
        <p className="mt-2 text-[12px] text-muted-foreground">
          Views, copies, and top prompts load immediately. Other metrics load
          on demand when you need them.
        </p>
      </header>

      <section className="mb-10">
        <SectionHeader
          icon={<EyeIcon className="size-4" />}
          title="Traffic overview"
          subtitle="Aggregate views and copies across all prompts"
        />
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <TrafficStat
            icon={<EyeIcon className="size-4" />}
            label="Total views"
            value={traffic.totalViews}
          />
          <TrafficStat
            icon={<CopyIcon className="size-4" />}
            label="Total copies"
            value={traffic.totalCopies}
          />
          <TrafficStat
            icon={<SparklesIcon className="size-4" />}
            label="Published prompts"
            value={traffic.publishedPrompts}
          />
        </div>
      </section>

      <section className="mb-10">
        <SectionHeader
          icon={<TrendingUpIcon className="size-4" />}
          title="Top prompts by copies"
          subtitle="What people are actually using"
        />
        <div className="mt-4">
          <TopPromptsTable topPrompts={topPrompts} />
        </div>
      </section>

      <section>
        <SectionHeader
          icon={<SparklesIcon className="size-4" />}
          title="More metrics"
          subtitle="Click a section to load it — nothing else runs until you ask"
        />
        <div className="mt-4">
          <AnalyticsLazyPanels />
        </div>
      </section>
    </section>
  );
}
