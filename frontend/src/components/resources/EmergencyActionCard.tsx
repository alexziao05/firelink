import type { SemanticTier } from "@/lib/dashboardSemantic";
import type { ReactNode } from "react";

type EmergencyTone = Extract<SemanticTier, "urgent" | "warning" | "info">;

/** Maps tone → dominant section styling for hero CTAs (mobile-first). */
const shellClasses: Record<EmergencyTone, string> = {
  urgent:
    "border-2 border-red-700/30 bg-red-50/90 shadow-[0_0_0_1px_rgba(220,38,38,0.08),0_12px_40px_-20px_rgba(15,23,42,0.2)] dark:border-red-500/35 dark:bg-red-950/25 dark:shadow-[0_0_0_1px_rgba(220,38,38,0.12),0_16px_48px_-24px_rgba(0,0,0,0.45)]",
  warning:
    "border-2 border-orange-700/25 bg-orange-50/90 shadow-[0_0_0_1px_rgba(249,115,22,0.08),0_12px_40px_-20px_rgba(15,23,42,0.2)] dark:border-orange-500/35 dark:bg-orange-950/25 dark:shadow-[0_0_0_1px_rgba(249,115,22,0.12),0_16px_48px_-24px_rgba(0,0,0,0.45)]",
  info:
    "border-2 border-blue-700/25 bg-blue-50/90 shadow-[0_0_0_1px_rgba(37,99,235,0.08),0_12px_40px_-20px_rgba(15,23,42,0.2)] dark:border-blue-500/35 dark:bg-blue-950/25 dark:shadow-[0_0_0_1px_rgba(37,99,235,0.12),0_16px_48px_-24px_rgba(0,0,0,0.45)]",
};

const iconTileClasses: Record<EmergencyTone, string> = {
  urgent:
    "bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-200",
  warning:
    "bg-orange-100 text-orange-900 dark:bg-orange-950/60 dark:text-orange-200",
  info:
    "bg-blue-100 text-blue-900 dark:bg-blue-950/60 dark:text-blue-200",
};

const ctaClasses: Record<EmergencyTone, string> = {
  urgent:
    "bg-red-600 text-white hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-500",
  warning:
    "bg-orange-600 text-white hover:bg-orange-700 dark:bg-orange-600 dark:hover:bg-orange-500",
  info:
    "bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500",
};

export interface EmergencyActionCardProps {
  tone: EmergencyTone;
  icon: ReactNode;
  title: string;
  description: string;
  actionLabel: string;
  /** When set, primary control is an anchor (`tel:` or `#anchor`). Otherwise a visual-only button. */
  href?: string;
}

export function EmergencyActionCard({
  tone,
  icon,
  title,
  description,
  actionLabel,
  href,
}: EmergencyActionCardProps) {
  const shell = shellClasses[tone];
  const iconTile = iconTileClasses[tone];
  const cta = ctaClasses[tone];

  const controlClass = `inline-flex min-h-11 w-full items-center justify-center rounded-xl px-4 py-3 text-sm font-bold tracking-tight transition ${cta} focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--foreground)]`;

  return (
    <article
      className={`flex min-h-[120px] flex-col gap-4 rounded-2xl p-5 sm:min-h-[132px] sm:p-6 ${shell}`}
    >
      <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-start sm:gap-4">
        <div
          className={`flex size-12 shrink-0 items-center justify-center rounded-2xl sm:size-14 ${iconTile}`}
          aria-hidden
        >
          <span className="[&_svg]:size-7 [&_svg]:sm:size-8">{icon}</span>
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-lg font-bold leading-tight tracking-tight text-[var(--foreground)] sm:text-xl">
            {title}
          </h3>
          <p className="mt-1.5 text-sm leading-snug text-[var(--muted-foreground)]">
            {description}
          </p>
        </div>
      </div>
      <div className="mt-auto pt-0">
        {href ? (
          <a href={href} className={controlClass} aria-label={actionLabel}>
            {actionLabel}
          </a>
        ) : (
          <button type="button" className={controlClass} aria-label={actionLabel}>
            {actionLabel}
          </button>
        )}
      </div>
    </article>
  );
}
