import { buildNeedsNowRows, semanticForNeedLabel } from "@/lib/dashboardSemantic";
import { needRowToneClasses } from "@/lib/semanticStyles";
import type { NeedItem } from "@/lib/types";
import Link from "next/link";

function NeedTierIcon({ tier }: { tier: ReturnType<typeof semanticForNeedLabel> }) {
  const common = "size-4 shrink-0";
  switch (tier) {
    case "urgent":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M12 9v4M12 17h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-red-700 dark:text-red-400"
          />
        </svg>
      );
    case "warning":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M12 7l8 14H4L12 7z"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinejoin="round"
            className="text-orange-700 dark:text-orange-400"
          />
          <path
            d="M12 11v4M12 17h.01"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            className="text-orange-700 dark:text-orange-400"
          />
        </svg>
      );
    case "info":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M4 21V8l8-5 8 5v13H4z"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinejoin="round"
            className="text-blue-700 dark:text-blue-400"
          />
          <path
            d="M9 21v-8h6v8"
            stroke="currentColor"
            strokeWidth="1.75"
            className="text-blue-700 dark:text-blue-400"
          />
        </svg>
      );
    case "safe":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M5 13l4 4L19 7"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-green-700 dark:text-green-400"
          />
        </svg>
      );
    default:
      return (
        <span
          className="size-2.5 shrink-0 rounded-full bg-slate-400 dark:bg-slate-500"
          aria-hidden
        />
      );
  }
}

function tierAriaLabel(tier: ReturnType<typeof semanticForNeedLabel>): string {
  switch (tier) {
    case "urgent":
      return "Urgent priority";
    case "warning":
      return "High priority";
    case "info":
      return "Information request";
    case "safe":
      return "Safety status";
    default:
      return "Need category";
  }
}

interface NeedsNowSectionProps {
  zip: string;
  needs: NeedItem[];
  showQueueLink?: boolean;
}

export function NeedsNowSection({ zip, needs, showQueueLink = true }: NeedsNowSectionProps) {
  const rows = buildNeedsNowRows(needs);

  return (
    <section
      className="mb-8 rounded-2xl border-2 border-red-700/25 bg-[var(--card)] p-4 shadow-[0_0_0_1px_rgba(220,38,38,0.08),0_12px_40px_-20px_rgba(15,23,42,0.35)] dark:border-red-500/30 dark:shadow-[0_0_0_1px_rgba(220,38,38,0.12),0_16px_48px_-24px_rgba(0,0,0,0.55)]"
      aria-labelledby="needs-now-heading"
    >
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-red-800 dark:text-red-300">
            Needs now
          </p>
          <h2 id="needs-now-heading" className="text-lg font-bold tracking-tight text-[var(--foreground)] sm:text-xl">
            Current needs
          </h2>
          <p className="mt-0.5 max-w-prose text-xs text-[var(--muted-foreground)]">
            Highest-impact requests for this ZIP — scan counts first, then open the full queue.
          </p>
        </div>
        {showQueueLink ? (
          <Link
            href={`/dashboard/${zip}/needs`}
            className="shrink-0 rounded-lg border border-blue-600/40 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-900 underline-offset-2 hover:bg-blue-100 hover:underline dark:border-blue-500/40 dark:bg-blue-950/40 dark:text-blue-100 dark:hover:bg-blue-950/70"
          >
            Full needs queue
          </Link>
        ) : null}
      </div>
      <ul className="space-y-2">
        {rows.map((n) => {
          const tier = semanticForNeedLabel(n.label);
          const rowClass = needRowToneClasses[tier];
          const isSafeRow = tier === "safe";
          return (
            <li
              key={n.label}
              className={`flex items-center justify-between gap-3 rounded-xl px-3 py-3 sm:px-4 ${rowClass}`}
            >
              <div className="flex min-w-0 items-center gap-2.5">
                <span
                  className="flex size-8 items-center justify-center rounded-lg bg-white/80 dark:bg-slate-900/50"
                  aria-hidden
                >
                  <NeedTierIcon tier={tier} />
                </span>
                <div className="min-w-0">
                  <span className="sr-only">{tierAriaLabel(tier)}: </span>
                  <span className="text-sm font-semibold text-[var(--foreground)]">{n.label}</span>
                  {isSafeRow ? (
                    <p className="text-[11px] text-[var(--muted-foreground)]">Community status check-ins</p>
                  ) : null}
                </div>
              </div>
              <span
                className={`shrink-0 font-mono text-lg font-bold tabular-nums text-[var(--foreground)] ${n.count > 0 && tier === "urgent" ? "text-red-800 dark:text-red-200" : ""}`}
              >
                {n.count}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
