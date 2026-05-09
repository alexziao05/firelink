"use client";

import { ActivityLog } from "@/components/ActivityLog";
import { FilterMenu } from "@/components/FilterMenu";
import type { ActivityItem } from "@/lib/types";
import { type FeedFilterId, filterActivityByFeed } from "@/lib/dashboardFilters";
import { useEffect, useMemo, useState } from "react";

const FEED_CHIPS: { id: FeedFilterId; label: string }[] = [
  { id: "all", label: "All" },
  { id: "urgent", label: "Urgent" },
  { id: "new", label: "New" },
  { id: "volunteers", label: "Volunteers" },
  { id: "safe", label: "Safe" },
];

const SORT_OPTIONS = [
  { id: "newest" as const, label: "Newest" },
  { id: "oldest" as const, label: "Oldest" },
];
const LIVE_FEED_PAGE_SIZE = 5;

interface HomeFeedProps {
  events: ActivityItem[];
}

export function HomeFeed({ events }: HomeFeedProps) {
  const [filter, setFilter] = useState<FeedFilterId>("all");
  const [activitySort, setActivitySort] = useState<"newest" | "oldest">("newest");
  const [visibleEventCount, setVisibleEventCount] = useState(LIVE_FEED_PAGE_SIZE);

  const filteredEvents = useMemo(
    () => filterActivityByFeed(events, filter),
    [events, filter],
  );
  const visibleEvents = filteredEvents.slice(0, visibleEventCount);
  const hasMoreEvents = visibleEventCount < filteredEvents.length;

  useEffect(() => {
    setVisibleEventCount(LIVE_FEED_PAGE_SIZE);
  }, [filter, activitySort]);

  return (
    <div className="space-y-8">
      <section aria-labelledby="activity-feed-heading">
        <h2
          id="activity-feed-heading"
          className="mb-1 text-sm font-bold uppercase tracking-wide text-[var(--foreground)]"
        >
          Live feed
        </h2>
        <p className="mb-3 text-xs text-[var(--muted-foreground)]">
          Recent SMS and status events — color tags mirror response priority.
        </p>
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <FilterMenu
            options={FEED_CHIPS}
            value={filter}
            onChange={setFilter}
            menuLabel="Filter activity"
            buttonLabel="Filter"
            align="left"
          />
          <FilterMenu
            options={SORT_OPTIONS}
            value={activitySort}
            onChange={setActivitySort}
            menuLabel="Sort activity"
            buttonLabel="Sort"
            align="left"
          />
        </div>
        <ActivityLog events={visibleEvents} sortOrder={activitySort} />
        {hasMoreEvents ? (
          <div className="mt-3">
            <button
              type="button"
              onClick={() => setVisibleEventCount((count) => count + LIVE_FEED_PAGE_SIZE)}
              className="inline-flex items-center rounded-full border border-[var(--card-border)] bg-[var(--card)] px-4 py-2 text-sm font-semibold text-[var(--foreground)] transition hover:bg-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:hover:bg-white/10"
            >
              See more
            </button>
          </div>
        ) : null}
      </section>
    </div>
  );
}
