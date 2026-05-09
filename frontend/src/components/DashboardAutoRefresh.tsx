"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/**
 * Placeholder “live” updates: refetches server components on an interval.
 * Swap for SWR / websockets when the API is wired.
 */
export function DashboardAutoRefresh() {
  const router = useRouter();

  useEffect(() => {
    const id = window.setInterval(() => {
      router.refresh();
      window.dispatchEvent(new Event("firelink:dashboard-refresh"));
    }, 5000);
    return () => window.clearInterval(id);
  }, [router]);

  return null;
}
