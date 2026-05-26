import type { SemanticTier } from "@/lib/dashboardSemantic";
import {
  statLabelToneClasses,
  statToneClasses,
} from "@/lib/semanticStyles";

interface StatCardProps {
  label: string;
  value: string | number;
  subtitle?: string;
  /** Visual emphasis — maps to semantic response colors (not brand amber). */
  tone?: SemanticTier;
}

export function StatCard({
  label,
  value,
  subtitle,
  tone = "neutral",
}: StatCardProps) {
  const borderWrap = statToneClasses[tone];
  const labelTone = statLabelToneClasses[tone];

  return (
    <div className={`rounded-2xl p-5 ${borderWrap}`}>
      <p className={`text-xs font-semibold uppercase tracking-wider ${labelTone}`}>
        {label}
      </p>
      <p className="mt-2 text-3xl font-bold tabular-nums text-[var(--foreground)]">
        {value}
      </p>
      {subtitle ? (
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">{subtitle}</p>
      ) : null}
    </div>
  );
}
