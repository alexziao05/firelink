import { HouseholdsListClient } from "@/components/HouseholdsListClient";
import { StatCard } from "@/components/StatCard";
import { getCommunityData } from "@/lib/data";
import Link from "next/link";
import type { Metadata } from "next";

type Props = Readonly<{
  params: Promise<{ zip: string }>;
}>;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { zip } = await params;
  return {
    title: `FireLink — Community · ${zip}`,
    description:
      "Community snapshot: anonymous ID-level status and readiness for this ZIP — no PII.",
  };
}

export default async function DashboardHouseholdsPage({ params }: Props) {
  const { zip } = await params;
  const data = await getCommunityData(zip);

  if (!data) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center py-12 text-center">
        <p className="text-[var(--muted-foreground)]">No data for this ZIP.</p>
        <Link
          href="/dashboard/91001"
          className="mt-3 text-sm font-semibold text-blue-700 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300"
        >
          Open demo ZIP
        </Link>
      </div>
    );
  }

  const { stats, households } = data;

  return (
    <div>
      <h2 className="mb-2 text-lg font-semibold text-[var(--foreground)]">
        Community snapshot
      </h2>
      <p className="mb-6 text-sm text-[var(--muted-foreground)]">
        Snapshot by anonymous ID — no names or addresses.
      </p>

      <section
        className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4"
        aria-label="Community summary counts"
      >
        <StatCard label="With pets" value={stats.pets} tone="neutral" />
        <StatCard
          label="Transport needs"
          value={stats.transportationNeeds}
          tone="urgent"
        />
        <StatCard
          label="Medical power support"
          value={stats.medicalPowerNeeds}
          tone="warning"
        />
        <StatCard label="Marked safe" value={stats.markedSafe} tone="safe" />
      </section>

      <HouseholdsListClient households={households} />
    </div>
  );
}
