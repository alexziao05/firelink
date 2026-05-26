import type { SemanticTier } from "./dashboardSemantic";

/** Row / list item: left accent + tinted surface (light + dark). */
export const needRowToneClasses: Record<SemanticTier, string> = {
  urgent:
    "border-l-[3px] border-l-[#DC2626] bg-red-50/90 border-y border-r border-[var(--card-border)] dark:border-y-slate-800 dark:border-r-slate-800 dark:bg-red-950/20 dark:border-l-red-500",
  warning:
    "border-l-[3px] border-l-[#F97316] bg-orange-50/80 border-y border-r border-[var(--card-border)] dark:border-y-slate-800 dark:border-r-slate-800 dark:bg-orange-950/20 dark:border-l-orange-500",
  safe:
    "border-l-[3px] border-l-[#16A34A] bg-green-50/80 border-y border-r border-[var(--card-border)] dark:border-y-slate-800 dark:border-r-slate-800 dark:bg-green-950/20 dark:border-l-green-500",
  info:
    "border-l-[3px] border-l-[#2563EB] bg-blue-50/80 border-y border-r border-[var(--card-border)] dark:border-y-slate-800 dark:border-r-slate-800 dark:bg-blue-950/25 dark:border-l-blue-500",
  neutral:
    "border border-[var(--card-border)] bg-[var(--card)]",
};

/** Stat cards: semantic accent (not full orange). */
export const statToneClasses: Record<SemanticTier, string> = {
  urgent:
    "border-[var(--card-border)] border-l-[3px] border-l-[#DC2626] bg-[var(--card)] shadow-sm shadow-red-900/5 dark:shadow-red-900/20",
  warning:
    "border-[var(--card-border)] border-l-[3px] border-l-[#F97316] bg-[var(--card)] shadow-sm shadow-orange-900/5 dark:shadow-orange-900/15",
  safe:
    "border-[var(--card-border)] border-l-[3px] border-l-[#16A34A] bg-[var(--card)] shadow-sm shadow-green-900/5 dark:shadow-green-900/15",
  info:
    "border-[var(--card-border)] border-l-[3px] border-l-[#2563EB] bg-[var(--card)] shadow-sm shadow-blue-900/5 dark:shadow-blue-900/15",
  neutral: "border border-[var(--card-border)] bg-[var(--card)]",
};

export const statLabelToneClasses: Record<SemanticTier, string> = {
  urgent: "text-red-800 dark:text-red-300",
  warning: "text-orange-800 dark:text-orange-300",
  safe: "text-green-800 dark:text-green-300",
  info: "text-blue-800 dark:text-blue-300",
  neutral: "text-[var(--muted-foreground)]",
};

/** Activity dot + pill */
export const activityDotClasses: Record<SemanticTier, string> = {
  urgent: "bg-[#DC2626]",
  warning: "bg-[#F97316]",
  safe: "bg-[#16A34A]",
  info: "bg-[#2563EB]",
  neutral: "bg-slate-400 dark:bg-slate-500",
};

export const activityPillClasses: Record<SemanticTier, string> = {
  urgent:
    "border-red-200 bg-red-50 text-red-900 dark:border-red-800/60 dark:bg-red-950/40 dark:text-red-200",
  warning:
    "border-orange-200 bg-orange-50 text-orange-900 dark:border-orange-800/60 dark:bg-orange-950/40 dark:text-orange-200",
  safe:
    "border-green-200 bg-green-50 text-green-900 dark:border-green-800/60 dark:bg-green-950/40 dark:text-green-200",
  info:
    "border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-800/60 dark:bg-blue-950/40 dark:text-blue-200",
  neutral:
    "border-slate-200 bg-slate-100 text-slate-800 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200",
};

/** Household status pill */
export const statusPillClasses: Record<SemanticTier, string> = {
  urgent:
    "border-red-300/80 bg-red-50 text-red-900 dark:border-red-700/50 dark:bg-red-950/35 dark:text-red-200",
  warning:
    "border-orange-300/80 bg-orange-50 text-orange-900 dark:border-orange-700/50 dark:bg-orange-950/35 dark:text-orange-200",
  safe:
    "border-green-300/80 bg-green-50 text-green-900 dark:border-green-700/50 dark:bg-green-950/35 dark:text-green-200",
  info:
    "border-blue-300/80 bg-blue-50 text-blue-900 dark:border-blue-700/50 dark:bg-blue-950/35 dark:text-blue-200",
  neutral:
    "border-slate-300/80 bg-slate-100 text-slate-800 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200",
};
