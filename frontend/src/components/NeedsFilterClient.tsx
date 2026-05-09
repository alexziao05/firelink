"use client";

import { FilterMenu } from "@/components/FilterMenu";
import { NeedsTable } from "@/components/NeedsTable";
import { filterNeedsByCategory } from "@/lib/dashboardFilters";
import type { NeedItem } from "@/lib/types";
import { useMemo, useState } from "react";

type Category = Parameters<typeof filterNeedsByCategory>[1];

const CATEGORIES: { id: Category; label: string }[] = [
  { id: "all", label: "All" },
  { id: "transport", label: "Transport" },
  { id: "medical", label: "Medical" },
  { id: "shelter", label: "Shelter" },
  { id: "pets", label: "Pets" },
  { id: "status", label: "Status" },
];

interface NeedsFilterClientProps {
  needs: NeedItem[];
}

export function NeedsFilterClient({ needs }: NeedsFilterClientProps) {
  const [category, setCategory] = useState<Category>("all");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const byCat = filterNeedsByCategory(needs, category);
    const q = query.trim().toLowerCase();
    if (!q) return byCat;
    return byCat.filter((n) => n.label.toLowerCase().includes(q));
  }, [needs, category, query]);

  return (
    <div>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex-1">
          <label htmlFor="needs-search" className="sr-only">
            Search needs
          </label>
          <input
            id="needs-search"
            type="search"
            placeholder="Search needs…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-xl border border-[var(--card-border)] bg-[var(--card)] px-4 py-3 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:border-[var(--brand-amber)]/60 focus:outline-none focus:ring-2 focus:ring-[var(--brand-amber)]/25"
          />
        </div>
        <div className="shrink-0">
          <FilterMenu
            options={CATEGORIES}
            value={category}
            onChange={setCategory}
            menuLabel="Filter needs by category"
            buttonLabel="Filter"
            buttonClassName="h-[46px] rounded-xl px-4 py-3 text-sm font-semibold"
          />
        </div>
      </div>
      {filtered.length === 0 ? (
        <p className="rounded-xl border border-[var(--card-border)] bg-[var(--card)] p-6 text-center text-sm text-[var(--muted-foreground)]">
          No needs match this filter.
        </p>
      ) : (
        <NeedsTable needs={filtered} />
      )}
    </div>
  );
}
