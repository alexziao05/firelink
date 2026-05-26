import type { SemanticTier } from "@/lib/dashboardSemantic";
import { statToneClasses, statusPillClasses } from "@/lib/semanticStyles";
import type { ReactNode } from "react";

export type NearbyStatus = "open" | "limited" | "closed";

const statusToTier: Record<NearbyStatus, SemanticTier> = {
  open: "safe",
  limited: "warning",
  closed: "urgent",
};

const statusLabels: Record<NearbyStatus, string> = {
  open: "Open",
  limited: "Limited capacity",
  closed: "Closed",
};

export interface NearbyResourceCardProps {
  icon: ReactNode;
  name: string;
  distance: string;
  status: NearbyStatus;
  notes: string;
}

export function NearbyResourceCard({
  icon,
  name,
  distance,
  status,
  notes,
}: NearbyResourceCardProps) {
  const tier = statusToTier[status];
  const cardWrap = statToneClasses[tier];
  const pillClass = statusPillClasses[tier];
  const label = statusLabels[status];

  return (
    <article
      className={`flex flex-col gap-3 rounded-2xl p-5 ${cardWrap}`}
      aria-labelledby={`near-${slug(name)}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex min-w-0 flex-1 gap-3">
          <div
            className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/80 dark:bg-slate-900/50 [&_svg]:size-5"
            aria-hidden
          >
            {icon}
          </div>
          <div className="min-w-0">
            <h3
              id={`near-${slug(name)}`}
              className="text-base font-bold leading-snug text-[var(--foreground)]"
            >
              {name}
            </h3>
            <p className="mt-1 font-mono text-sm font-semibold tabular-nums text-[var(--muted-foreground)]">
              {distance}
            </p>
          </div>
        </div>
        <span
          className={`inline-flex shrink-0 rounded-full border px-2.5 py-1 text-xs font-semibold ${pillClass}`}
          aria-label={`Status: ${label}`}
        >
          {label}
        </span>
      </div>
      <p className="text-sm leading-snug text-[var(--muted-foreground)]">{notes}</p>
    </article>
  );
}

function slug(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}
