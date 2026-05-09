"use client";

import { useEffect, useState } from "react";

function formatTime(d: Date) {
  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  }).format(d);
}

export function DashboardLastUpdated() {
  const [ts, setTs] = useState<Date | null>(null);

  useEffect(() => {
    const bump = () => setTs(new Date());
    bump();
    window.addEventListener("firelink:dashboard-refresh", bump);
    return () => window.removeEventListener("firelink:dashboard-refresh", bump);
  }, []);

  return (
    <p className="inline-flex items-center gap-1.5 text-[11px] font-medium tracking-[0.01em] text-(--muted-foreground) sm:text-xs">
      <span>Last updated:</span>
      {ts === null ? (
        <span className="font-mono tabular-nums text-foreground">
          <span className="sr-only">Loading time</span>
          —
        </span>
      ) : (
        <time dateTime={ts.toISOString()} className="font-mono tabular-nums text-foreground">
          {formatTime(ts)}
        </time>
      )}
    </p>
  );
}
