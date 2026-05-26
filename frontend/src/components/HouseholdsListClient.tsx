"use client";

import { FilterMenu } from "@/components/FilterMenu";
import { HouseholdCard } from "@/components/HouseholdCard";
import type { AnonymousHousehold } from "@/lib/types";
import { useMemo, useState } from "react";

type SortOrder = "default" | "prep-asc" | "prep-desc";

const SORT_OPTIONS = [
  { id: "default" as const, label: "Default" },
  { id: "prep-asc" as const, label: "Preparedness: Low → High" },
  { id: "prep-desc" as const, label: "Preparedness: High → Low" },
];

interface HouseholdsListClientProps {
  households: AnonymousHousehold[];
}

export function HouseholdsListClient({ households }: HouseholdsListClientProps) {
  const [sort, setSort] = useState<SortOrder>("default");

  const sorted = useMemo(() => {
    if (sort === "default") return households;
    const copy = [...households];
    copy.sort((a, b) =>
      sort === "prep-asc"
        ? a.prep_score - b.prep_score
        : b.prep_score - a.prep_score,
    );
    return copy;
  }, [households, sort]);

  return (
    <div>
      <div className="mb-5">
        <FilterMenu
          options={SORT_OPTIONS}
          value={sort}
          onChange={setSort}
          menuLabel="Sort community entries"
          buttonLabel="Sort"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {sorted.map((h) => (
          <HouseholdCard key={h.anonymous_id} household={h} />
        ))}
      </div>
    </div>
  );
}
