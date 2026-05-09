"use client";

import type { AlertTimelineItem } from "@/lib/fireConditionsAdapter";
import { activityPillClasses } from "@/lib/semanticStyles";

function formatShortTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function AlertTimeline({ items }: { items: AlertTimelineItem[] }) {
  if (items.length === 0) {
    return (
      <p className="text-sm text-[var(--muted-foreground)]">No recent weather alerts.</p>
    );
  }

  return (
    <div className="w-full">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
        Recent alerts
      </p>
      <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1 [scrollbar-width:thin] lg:mx-0 lg:flex-wrap lg:overflow-x-visible lg:px-0">
        {items.map((a) => (
          <article
            key={a.id}
            className={`min-w-[min(100%,240px)] shrink-0 rounded-2xl border border-[var(--card-border)] bg-[var(--card)] p-3 shadow-sm sm:min-w-[220px] lg:min-w-0 lg:flex-1 lg:basis-[calc(50%-0.375rem)]`}
          >
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-semibold leading-snug text-[var(--foreground)]">
                {a.event}
              </h3>
              <span
                className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${activityPillClasses[a.tier]}`}
              >
                {a.severity}
              </span>
            </div>
            <time
              dateTime={a.timestampIso}
              className="mt-1 block text-xs text-[var(--muted-foreground)]"
            >
              {formatShortTime(a.timestampIso)}
            </time>
            <dl className="mt-2 grid grid-cols-2 gap-x-2 gap-y-1 text-xs">
              <div>
                <dt className="text-[var(--muted-foreground)]">Wind gust</dt>
                <dd className="font-semibold tabular-nums text-[var(--foreground)]">
                  {a.windMph} mph
                </dd>
              </div>
              <div>
                <dt className="text-[var(--muted-foreground)]">Humidity</dt>
                <dd className="font-semibold tabular-nums text-[var(--foreground)]">
                  {a.humidityPct}%
                </dd>
              </div>
            </dl>
          </article>
        ))}
      </div>
    </div>
  );
}
