import type { SemanticTier } from "@/lib/dashboardSemantic";
import { activityPillClasses, statToneClasses } from "@/lib/semanticStyles";
import type { ReactNode } from "react";

export interface ResourceCardProps {
  tone: SemanticTier;
  icon: ReactNode;
  title: string;
  description: string;
  actionLabel: string;
  /** Anchor href when actionable link; omit for visual-only SMS-style prompts. */
  href?: string;
}

export function ResourceCard({
  tone,
  icon,
  title,
  description,
  actionLabel,
  href,
}: ResourceCardProps) {
  const cardWrap = statToneClasses[tone];
  const pill = activityPillClasses[tone];

  const actionClass = `inline-flex min-h-11 w-full items-center justify-center rounded-xl border px-4 py-2.5 text-sm font-bold tracking-tight transition hover:opacity-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--foreground)] ${pill}`;

  return (
    <article
      className={`flex flex-col gap-4 rounded-2xl p-5 ${cardWrap}`}
      aria-labelledby={`resource-${slug(title)}`}
    >
      <div className="flex gap-3">
        <div
          className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/80 dark:bg-slate-900/50 [&_svg]:size-5"
          aria-hidden
        >
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <h3
            id={`resource-${slug(title)}`}
            className="text-base font-bold leading-snug text-[var(--foreground)]"
          >
            {title}
          </h3>
          <p className="mt-1.5 text-sm leading-snug text-[var(--muted-foreground)]">
            {description}
          </p>
        </div>
      </div>
      <div className="mt-auto">
        {href ? (
          <a href={href} className={actionClass} aria-label={actionLabel}>
            {actionLabel}
          </a>
        ) : (
          <button type="button" className={actionClass} aria-label={actionLabel}>
            {actionLabel}
          </button>
        )}
      </div>
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
