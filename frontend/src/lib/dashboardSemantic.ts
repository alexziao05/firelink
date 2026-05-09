import type { NeedItem } from "./types";

/** Semantic tiers — pair with text labels/icons for accessibility. */
export type SemanticTier = "urgent" | "warning" | "safe" | "info" | "neutral";

const norm = (s: string) => s.trim().toLowerCase();

/** Fixed display order for “Needs now”. */
export const NEEDS_NOW_PRIORITY_LABELS = [
  "Evacuation rides",
  "Pet transport",
  "Medical device power support",
  "Shelter info",
] as const;

export function semanticForNeedLabel(label: string): SemanticTier {
  const l = norm(label);
  if (/evacuation/.test(l) && /ride/.test(l)) return "urgent";
  if (/pet|animal/.test(l) && /transport|boarding/.test(l)) return "warning";
  if (/medical|power support|prescription|oxygen/.test(l)) return "warning";
  if (/shelter/.test(l)) return "info";
  if (/marked safe/.test(l)) return "safe";
  return "neutral";
}

/** Priority labels first (0 if absent), then Marked safe when present. */
export function buildNeedsNowRows(needs: NeedItem[]): NeedItem[] {
  const rows: NeedItem[] = [];
  for (const label of NEEDS_NOW_PRIORITY_LABELS) {
    const found = needs.find((n) => norm(n.label) === norm(label));
    rows.push(found ?? { label, count: 0 });
  }
  const safe = needs.find((n) => /marked safe/i.test(n.label));
  if (safe) rows.push(safe);
  return rows;
}

export function semanticForActivityMessage(message: string): SemanticTier {
  const m = message.toLowerCase();
  if (/\bmarked safe\b/i.test(m)) return "safe";
  if (/volunteer|volunteered/i.test(m)) return "safe";
  if (/evacuation transport|requested evacuation|needs ride/i.test(m)) return "urgent";
  if (/shelter info|asked for.*shelter|pet shelter/i.test(m)) return "info";
  if (/medical device|power support/i.test(m)) return "warning";
  if (/completed.*task|go-bag|prep task|checklist/i.test(m)) return "warning";
  return "neutral";
}

export function semanticForHouseholdStatus(status: string): SemanticTier {
  const s = status.toLowerCase();
  if (/needs ride|requested help|need.*help/i.test(s)) return "urgent";
  if (/\bsafe\b/.test(s) && !/shelter/.test(s)) return "safe";
  if (/prepar/i.test(s)) return "warning";
  if (/shelter/i.test(s)) return "info";
  if (/medical|power/i.test(s)) return "warning";
  return "neutral";
}

export function activityTypeLabel(message: string): string {
  const t = semanticForActivityMessage(message);
  switch (t) {
    case "urgent":
      return "Urgent";
    case "warning":
      if (/medical|power/i.test(message)) return "Medical";
      return "Prep";
    case "safe":
      if (/volunteer/i.test(message)) return "Volunteer";
      return "Safe";
    case "info":
      return "Shelter";
    default:
      return "Update";
  }
}
