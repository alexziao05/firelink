import { FireConditionsSection } from "@/components/fire/FireConditionsSection";
import { getLiveFireConditionsViewModel } from "@/lib/fireConditionsAdapter";
import Link from "next/link";
import type { Metadata } from "next";

type Props = Readonly<{
  params: Promise<{ zip: string }>;
}>;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { zip } = await params;
  return {
    title: `FireLink — Fire conditions · ${zip}`,
    description:
      "Wildfire status, containment, acreage trends, and fire-weather alerts — mock data for demo only.",
  };
}

export default async function FireConditionsPage({ params }: Props) {
  const { zip } = await params;
  const fireData = await getLiveFireConditionsViewModel();

  if (!fireData) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center py-12 text-center">
        <h2 className="text-xl font-bold text-foreground">No fire conditions data</h2>
        <p className="mt-3 max-w-md text-(--muted-foreground)">
          Check back when incident and weather feeds are connected.
        </p>
        <Link
          href={`/dashboard/${zip}/needs`}
          className="mt-6 text-sm font-semibold text-blue-700 underline underline-offset-2 dark:text-blue-400"
        >
          Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div>
      <FireConditionsSection data={fireData} showHeading={false} />
    </div>
  );
}
