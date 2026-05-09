"use client";

import { activityTypeLabel, semanticForActivityMessage } from "@/lib/dashboardSemantic";
import { activityDotClasses, activityPillClasses } from "@/lib/semanticStyles";
import type { ActivityItem } from "@/lib/types";

interface ActivityLogProps {
  events: ActivityItem[];
  /** Default newest first */
  sortOrder?: "newest" | "oldest";
}

function formatTime(iso: string) {
  try {
    return new Intl.DateTimeFormat(undefined, {
      hour: "numeric",
      minute: "2-digit",
      month: "short",
      day: "numeric",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function ActivityLog({
  events,
  sortOrder = "newest",
}: ActivityLogProps) {
  const sorted = [...events].sort((a, b) => {
    const ta = new Date(a.timestamp).getTime();
    const tb = new Date(b.timestamp).getTime();
    return sortOrder === "newest" ? tb - ta : ta - tb;
  });

  return (
    <ul className="space-y-3" aria-live="polite">
      {sorted.map((ev) => {
        const tier = semanticForActivityMessage(ev.message);
        const pill = activityPillClasses[tier];
        const dot = activityDotClasses[tier];
        const typeLabel = activityTypeLabel(ev.message);
        return (
          <li
            key={ev.id}
            className="flex flex-col gap-2 rounded-xl border border-[var(--card-border)] bg-[var(--card)] px-4 py-3 sm:flex-row sm:items-start sm:justify-between"
          >
            <div className="flex min-w-0 flex-1 gap-3">
              <span
                className={`mt-2 size-2.5 shrink-0 rounded-full ${dot}`}
                aria-hidden
              />
              <div className="min-w-0">
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${pill}`}
                  >
                    {typeLabel}
                  </span>
                </div>
                <p className="max-w-3xl leading-snug text-[var(--foreground)]">{ev.message}</p>
              </div>
            </div>
            <time
              className="shrink-0 text-xs text-[var(--muted-foreground)] sm:pt-2 sm:text-right"
              dateTime={ev.timestamp}
            >
              {formatTime(ev.timestamp)}
            </time>
          </li>
        );
      })}
    </ul>
  );
}
