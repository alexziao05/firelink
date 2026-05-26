import { redirect } from "next/navigation";
import type { Metadata } from "next";

type Props = Readonly<{
  params: Promise<{ zip: string }>;
}>;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { zip } = await params;
  return {
    title: `FireLink — Dashboard · ${zip}`,
    description:
      "Anonymous ZIP-level wildfire readiness dashboard — community needs and resources.",
  };
}

export default async function DashboardZipRootPage({ params }: Props) {
  const { zip } = await params;
  redirect(`/dashboard/${zip}/fire`);
}
