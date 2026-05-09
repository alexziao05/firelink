import { DashboardAutoRefresh } from "@/components/DashboardAutoRefresh";
import { DashboardBottomNav } from "@/components/DashboardBottomNav";
import { DashboardHeader } from "@/components/DashboardHeader";

type Props = Readonly<{
  children: React.ReactNode;
  params: Promise<{ zip: string }>;
}>;

export default async function DashboardZipLayout({ children, params }: Props) {
  const { zip } = await params;

  return (
    <>
      <DashboardAutoRefresh />
      <div className="flex min-h-screen flex-1 flex-col">
        <DashboardHeader zip={zip} />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 pt-5 pb-32 sm:px-6 sm:pt-6 sm:pb-32 lg:px-8 lg:pt-8 lg:pb-36">
          {children}
        </main>
        <DashboardBottomNav zip={zip} />
      </div>
    </>
  );
}
