"use client";

import { useState } from "react";
import type { PastIncidentUpdateItem } from "@/lib/fireConditionsAdapter";

function formatWhen(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/** First paint count, then reveal this many each "Show more". */
const INITIAL_COUNT = 6;
const MORE_COUNT = 8;

export function FirePastUpdates({ items }: { items: PastIncidentUpdateItem[] }) {
  const [visibleCount, setVisibleCount] = useState(INITIAL_COUNT);

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--card)] p-4 shadow-sm">
        <h4 className="text-sm font-bold text-[var(--foreground)]">Past incident updates</h4>
        <p className="mt-2 text-xs text-[var(--muted-foreground)]">No older reports in this timeline.</p>
      </div>
    );
  }

  const resolvedInitial = Math.min(INITIAL_COUNT, items.length);
  const cappedVisible = Math.min(visibleCount, items.length);
  const shown = items.slice(0, cappedVisible);
  const hasMore = cappedVisible < items.length;
  const canCollapse = items.length > resolvedInitial && cappedVisible > resolvedInitial;

  return (
    <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--card)] p-4 shadow-sm">
      <h4 className="text-sm font-bold text-[var(--foreground)]">Past incident updates</h4>
      <p className="mt-1 text-xs text-[var(--muted-foreground)]">
        Older incident reports (newest of these first). Same snapshot may be merged in the feed.
      </p>
      <ul className="mt-4 max-h-[min(70vh,520px)] space-y-2 overflow-y-auto pr-1 [scrollbar-width:thin]">
        {shown.map((row) => (
          <li
            key={row.id}
            className="rounded-xl border border-[var(--card-border)] bg-slate-50/60 px-3 py-2.5 dark:bg-slate-900/35"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2 gap-y-1">
              <time
                dateTime={row.timestampIso}
                className="text-[11px] font-semibold tabular-nums text-[var(--muted-foreground)]"
              >
                {formatWhen(row.timestampIso)}
              </time>
              <span className="text-[11px] font-semibold tabular-nums text-[var(--foreground)]">
                {row.acres.toLocaleString()} ac · {row.containmentPct.toFixed(1)}% contained
              </span>
            </div>
            <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-[var(--foreground)]">
              {row.status}
            </p>
          </li>
        ))}
      </ul>
      {hasMore ? (
        <button
          type="button"
          onClick={() => setVisibleCount((n) => Math.min(n + MORE_COUNT, items.length))}
          className="mt-3 w-full rounded-xl border border-[var(--card-border)] bg-slate-100/80 py-2.5 text-xs font-semibold text-[var(--foreground)] transition hover:bg-slate-200/90 dark:bg-slate-800/80 dark:hover:bg-slate-800"
        >
          Show more ({items.length - cappedVisible} older)
        </button>
      ) : null}
      {canCollapse ? (
        <button
          type="button"
          onClick={() => setVisibleCount(resolvedInitial)}
          className="mt-3 text-xs font-semibold text-blue-700 underline underline-offset-2 dark:text-blue-400"
        >
          Collapse list
        </button>
      ) : null}
    </div>
  );
}
