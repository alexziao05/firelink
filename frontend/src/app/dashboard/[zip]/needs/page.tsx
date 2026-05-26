import { HomeFeed } from "@/components/HomeFeed";
import { NeedsNowSection } from "@/components/NeedsNowSection";
import { NeedsFilterClient } from "@/components/NeedsFilterClient";
import { getCommunityData } from "@/lib/data";
import Link from "next/link";
import type { Metadata } from "next";

type Props = Readonly<{
  params: Promise<{ zip: string }>;
}>;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { zip } = await params;
  return {
    title: `FireLink — Needs · ${zip}`,
    description: "Current community need categories and counts for this ZIP.",
  };
}

export default async function DashboardNeedsPage({ params }: Props) {
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

  return (
    <div>
      <NeedsNowSection zip={zip} needs={data.needs} showQueueLink={false} />

      <HomeFeed events={data.events} />

      <div className="mt-10 sm:mt-12">
        <h2 className="mb-2 text-lg font-semibold text-[var(--foreground)]">Needs queue</h2>
        <p className="mb-6 text-sm text-[var(--muted-foreground)]">
          Broad categories and counts — filter by type or search labels.
        </p>
        <NeedsFilterClient needs={data.needs} />
      </div>
    </div>
  );
}
