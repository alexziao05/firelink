import type { ActivityItem, NeedItem } from "./types";

export type FeedFilterId = "all" | "urgent" | "new" | "volunteers" | "safe";

const MS_DAY = 86_400_000;

export function filterActivityByFeed(
  events: ActivityItem[],
  filter: FeedFilterId,
): ActivityItem[] {
  const sorted = [...events].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );

  if (filter === "all") return sorted;

  if (filter === "new") {
    const cutoff = Date.now() - MS_DAY;
    return sorted.filter((e) => new Date(e.timestamp).getTime() >= cutoff);
  }

  const lower = (s: string) => s.toLowerCase();

  return sorted.filter((e) => {
    const m = lower(e.message);
    switch (filter) {
      case "urgent":
        return (
          /transport|ride|evacuat|medical|power support|requested|help|shelter info|needs ride/i.test(
            m,
          )
        );
      case "volunteers":
        return (
          /volunteer|can help|matched|community transport|prep|completed|checklist/i.test(
            m,
          )
        );
      case "safe":
        return /marked safe|\bsafe\b/i.test(m);
      default:
        return true;
    }
  });
}

/** Needs for “urgent queue” on home: highest counts first, de-prioritize “marked safe” informational row */
export function urgentNeedsPreview(needs: NeedItem[], limit = 4): NeedItem[] {
  const copy = [...needs].sort((a, b) => {
    const aSafe = /marked safe/i.test(a.label) ? 1 : 0;
    const bSafe = /marked safe/i.test(b.label) ? 1 : 0;
    if (aSafe !== bSafe) return aSafe - bSafe;
    return b.count - a.count;
  });
  return copy.slice(0, limit);
}

export function filterNeedsByCategory(
  needs: NeedItem[],
  category: "all" | "transport" | "medical" | "shelter" | "pets" | "status",
): NeedItem[] {
  if (category === "all") return needs;

  const lower = (label: string) => label.toLowerCase();

  return needs.filter((n) => {
    const l = lower(n.label);
    switch (category) {
      case "transport":
        return /ride|transport|evacuat/.test(l);
      case "medical":
        return /medical|power|prescription|oxygen/.test(l);
      case "shelter":
        return /shelter/.test(l);
      case "pets":
        return /pet|animal/.test(l);
      case "status":
        return /marked safe|safe/.test(l);
      default:
        return true;
    }
  });
}
