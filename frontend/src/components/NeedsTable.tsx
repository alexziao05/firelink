import { semanticForNeedLabel } from "@/lib/dashboardSemantic";
import { needRowToneClasses } from "@/lib/semanticStyles";
import type { NeedItem } from "@/lib/types";

const tierDotClass: Record<
  ReturnType<typeof semanticForNeedLabel>,
  string
> = {
  urgent: "bg-red-600 dark:bg-red-500",
  warning: "bg-orange-500 dark:bg-orange-400",
  safe: "bg-green-600 dark:bg-green-500",
  info: "bg-blue-600 dark:bg-blue-500",
  neutral: "bg-slate-500 dark:bg-slate-400",
};

interface NeedsTableProps {
  needs: NeedItem[];
}

export function NeedsTable({ needs }: NeedsTableProps) {
  return (
    <div className="-mx-1 overflow-x-auto rounded-2xl border border-[var(--card-border)] bg-[var(--card)] sm:mx-0">
      <table className="w-full min-w-[280px] border-collapse text-left text-sm">
        <thead className="border-b border-[var(--card-border)] bg-slate-100/90 text-[10px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)] dark:bg-slate-900/80 dark:text-slate-400">
          <tr>
            <th className="px-5 py-3">Need</th>
            <th className="px-5 py-3 text-right">Count</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--card-border)]">
          {needs.map((row) => {
            const tier = semanticForNeedLabel(row.label);
            const surface = needRowToneClasses[tier];
            const dot = tierDotClass[tier];
            return (
              <tr key={row.label} className={surface}>
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-2">
                    <span
                      className={`size-2 shrink-0 rounded-full ${dot}`}
                      aria-hidden
                    />
                    <span className="font-medium text-[var(--foreground)]">{row.label}</span>
                  </div>
                </td>
                <td className="px-5 py-3.5 text-right font-mono text-base font-bold tabular-nums text-[var(--foreground)]">
                  {row.count}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
