import { semanticForHouseholdStatus } from "@/lib/dashboardSemantic";
import { statusPillClasses } from "@/lib/semanticStyles";
import type { AnonymousHousehold } from "@/lib/types";

interface HouseholdCardProps {
  household: AnonymousHousehold;
}

export function HouseholdCard({ household }: HouseholdCardProps) {
  const pct = Math.min(100, Math.max(0, household.prep_score));
  const tier = semanticForHouseholdStatus(household.status);
  const pillClass = statusPillClasses[tier];
  const barClass =
    pct < 40
      ? "bg-[#DC2626]"
      : pct < 70
        ? "bg-[#F97316]"
        : "bg-[#16A34A]";
  const prepLabel = pct < 40 ? "Critical" : pct < 70 ? "In progress" : "Strong";

  return (
    <article className="flex flex-col gap-4 rounded-2xl border border-[var(--card-border)] bg-[var(--card)] p-5">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <span className="font-mono text-lg font-semibold text-[var(--foreground)]">
          Household {household.anonymous_id}
        </span>
        <span className="rounded-full border border-[var(--card-border)] bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-[var(--foreground)] dark:bg-slate-800/80 dark:text-[var(--foreground)]">
          ZIP {household.zip_code}
        </span>
      </header>
      <p className="text-xs text-[var(--muted-foreground)]">
        Status:{" "}
        <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${pillClass}`}>
          {household.status}
        </span>
      </p>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
        <Detail label="Pets" value={household.has_pets ? "Yes" : "No"} />
        <Detail
          label="Transportation"
          value={household.has_transport ? "Yes" : "No"}
        />
        <Detail
          label="Medical device power support needed"
          value={household.medical_needs ? "Yes" : "No"}
        />
        <Detail
          label="Can help others"
          value={household.can_volunteer ? "Yes" : "No"}
        />
      </dl>
      <div>
        <div className="mb-1 flex justify-between text-xs text-[var(--muted-foreground)]">
          <span>Preparedness</span>
          <span>
            {pct}% · <span className="font-medium text-[var(--foreground)]">{prepLabel}</span>
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
          <div
            className={`h-full rounded-full transition-[width] duration-500 ${barClass}`}
            style={{ width: `${pct}%` }}
            role="progressbar"
            aria-valuenow={pct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuetext={`${pct}% prepared, ${prepLabel}`}
          />
        </div>
      </div>
    </article>
  );
}

function Detail({
  label,
  value,
  className = "",
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <dt className="text-[var(--muted-foreground)]">{label}</dt>
      <dd className="font-medium text-[var(--foreground)]">{value}</dd>
    </div>
  );
}
