import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function Home() {
  return (
    <div className="relative flex flex-1 flex-col items-center justify-center px-4 py-20 text-center sm:py-24">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-800 dark:text-amber-300">
        FireLink
      </p>
      <h1 className="mt-4 text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-4xl">
        Wildfire readiness by SMS
      </h1>
      <p className="mx-auto mt-4 max-w-lg text-zinc-700 dark:text-zinc-200">
        Public community dashboards stay anonymous — ZIP-level stats and broad
        needs only.
      </p>
      <Link
        href="/dashboard/91001"
        className="mt-8 inline-flex rounded-full bg-amber-500 px-6 py-3 text-sm font-semibold text-stone-950 shadow-lg shadow-amber-900/30 transition hover:bg-amber-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/70"
      >
        Open demo dashboard (91001)
      </Link>
    </div>
  );
}
