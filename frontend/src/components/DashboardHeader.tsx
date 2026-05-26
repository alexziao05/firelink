import Link from "next/link";
import { DashboardLastUpdated } from "./DashboardLastUpdated";
import { ThemeToggle } from "./ThemeToggle";

export function DashboardHeader({ zip }: { zip: string }) {
  return (
    <header className="sticky top-0 z-40 border-b border-[var(--chrome-border)] bg-[var(--chrome-surface)] pt-[env(safe-area-inset-top)] shadow-[0_1px_0_0_rgba(15,23,42,0.06)] dark:shadow-[0_1px_0_0_rgba(248,250,252,0.06)]">
      <div className="mx-auto flex max-w-6xl items-start gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <Link
              href="/"
              className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--brand-amber)] hover:opacity-90 dark:text-[var(--brand-amber)]"
            >
              FireLink
            </Link>
            <span
              className="inline-flex items-center gap-1 rounded-full border border-red-600/35 bg-red-50 px-2 py-0.5 text-[10px] font-semibold leading-none text-red-900 sm:text-[11px] dark:border-red-500/40 dark:bg-red-950/40 dark:text-red-200"
              aria-label="Active response status"
            >
              Active wildfire response
              <span
                className="relative inline-flex size-2.5 shrink-0 items-center justify-center"
                aria-hidden
              >
                <span className="absolute inset-0 rounded-full border border-current animate-live-dot" />
                <span className="absolute inset-[3px] rounded-full bg-current animate-live-dot" />
              </span>
            </span>
          </div>
          <h1 className="mt-1 text-base font-bold leading-tight tracking-tight text-[var(--foreground)] sm:text-lg">
            Eaton Fire
          </h1>
          <div className="mt-1">
            <DashboardLastUpdated />
          </div>
          <p className="mt-2 text-sm leading-snug break-words text-[var(--muted-foreground)]">
            ZIP{" "}
            <span className="font-mono font-semibold text-[var(--foreground)]">{zip}</span>
            <span className="mx-1.5 text-[var(--muted-foreground)]">|</span>
            <span>Los Angeles County — Altadena/Pasadena Foothills</span>
          </p>
        </div>
        <div className="shrink-0 pt-0.5">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
