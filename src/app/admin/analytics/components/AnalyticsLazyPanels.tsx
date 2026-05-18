"use client";

import {
  ActivityIcon,
  BarChart3Icon,
  Loader2Icon,
  SparklesIcon,
  TagIcon,
  TrendingUpIcon,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import type {
  AdminTotals,
  CategoryLeaderboardItem,
  DailyPulse,
  ModelLeaderboardItem,
  TagLeaderboardItem,
  TimeSeriesPoint,
} from "@/server/services/analytics.service";
import {
  CatalogSection,
  PulseSection,
  SectionHeader,
  TrendsSection,
  TotalsSection,
} from "./analytics-ui";

type Section = "pulse" | "totals" | "trends" | "catalog";

type PanelConfig = {
  id: Section;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  buttonLabel: string;
};

const PANELS: PanelConfig[] = [
  {
    id: "pulse",
    title: "Last 24 hours",
    subtitle: "Signups, submissions, favorites, and ratings since yesterday",
    icon: <ActivityIcon className="size-4" />,
    buttonLabel: "Load 24h activity",
  },
  {
    id: "totals",
    title: "Platform totals",
    subtitle: "All-time counts across users, submissions, and engagement",
    icon: <SparklesIcon className="size-4" />,
    buttonLabel: "Load platform totals",
  },
  {
    id: "trends",
    title: "30-day trends",
    subtitle: "Daily signups, submissions, and favorites over the last month",
    icon: <TrendingUpIcon className="size-4" />,
    buttonLabel: "Load trend charts",
  },
  {
    id: "catalog",
    title: "Catalog breakdown",
    subtitle: "Top categories, tags, and models by usage",
    icon: <TagIcon className="size-4" />,
    buttonLabel: "Load catalog stats",
  },
];

function renderPanelContent(section: Section, data: unknown) {
  switch (section) {
    case "pulse":
      return <PulseSection pulse={data as DailyPulse} />;
    case "totals":
      return <TotalsSection totals={data as AdminTotals} />;
    case "trends": {
      const trends = data as {
        signupsSeries: TimeSeriesPoint[];
        submissionsSeries: TimeSeriesPoint[];
        favoritesSeries: TimeSeriesPoint[];
      };
      return (
        <TrendsSection
          signupsSeries={trends.signupsSeries}
          submissionsSeries={trends.submissionsSeries}
          favoritesSeries={trends.favoritesSeries}
        />
      );
    }
    case "catalog": {
      const catalog = data as {
        topCategories: CategoryLeaderboardItem[];
        topTags: TagLeaderboardItem[];
        topModels: ModelLeaderboardItem[];
      };
      return (
        <CatalogSection
          topCategories={catalog.topCategories}
          topTags={catalog.topTags}
          topModels={catalog.topModels}
        />
      );
    }
    default:
      return null;
  }
}

export function AnalyticsLazyPanels() {
  const [loaded, setLoaded] = useState<Partial<Record<Section, unknown>>>({});
  const [loading, setLoading] = useState<Section | null>(null);
  const [errors, setErrors] = useState<Partial<Record<Section, string>>>({});

  async function loadSection(section: Section) {
    if (loaded[section] || loading === section) return;

    setLoading(section);
    setErrors((prev) => {
      const next = { ...prev };
      delete next[section];
      return next;
    });

    try {
      const res = await fetch(`/api/admin/analytics?section=${section}`, {
        cache: "no-store",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(
          typeof data.error === "string" ? data.error : "Failed to load",
        );
      }
      setLoaded((prev) => ({ ...prev, [section]: data }));
    } catch (err) {
      setErrors((prev) => ({
        ...prev,
        [section]:
          err instanceof Error ? err.message : "Could not load this section",
      }));
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="space-y-6">
      {PANELS.map((panel) => {
        const data = loaded[panel.id];
        const error = errors[panel.id];
        const isLoading = loading === panel.id;

        return (
          <section
            key={panel.id}
            className="rounded-xl border border-border/60 bg-card/30 p-4 sm:p-5"
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <SectionHeader
                icon={panel.icon}
                title={panel.title}
                subtitle={panel.subtitle}
              />
              {!data && (
                <Button
                  type="button"
                  variant="outline"
                  className="press h-9 shrink-0 gap-2 self-start text-[13px]"
                  disabled={isLoading}
                  onClick={() => loadSection(panel.id)}
                >
                  {isLoading ? (
                    <Loader2Icon className="size-3.5 animate-spin" />
                  ) : (
                    <BarChart3Icon className="size-3.5" />
                  )}
                  {isLoading ? "Loading…" : panel.buttonLabel}
                </Button>
              )}
            </div>

            {error && (
              <p className="mt-4 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-[13px] text-destructive">
                {error}
              </p>
            )}

            {data ? (
              <div className="mt-5">{renderPanelContent(panel.id, data)}</div>
            ) : null}
          </section>
        );
      })}
    </div>
  );
}
