"use client";

import { useEffect, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { FireGrowthPoint } from "@/lib/fireConditionsAdapter";

type ChartRow = FireGrowthPoint & { t: number };

function useChartTheme() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const root = document.documentElement;
    const read = () => setDark(root.classList.contains("dark"));
    read();
    const obs = new MutationObserver(read);
    obs.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);
  return dark;
}

function formatTick(ts: number) {
  const d = new Date(ts);
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function FireGrowthChart({ series }: { series: FireGrowthPoint[] }) {
  const dark = useChartTheme();
  const muted = dark ? "#94a3b8" : "#64748b";
  const grid = dark ? "rgba(148,163,184,0.12)" : "rgba(100,116,139,0.15)";
  const lineColor = dark ? "#fb923c" : "#ea580c";

  const data: ChartRow[] = series.map((p) => ({
    ...p,
    t: new Date(p.timestampIso).getTime(),
  }));

  if (data.length === 0) {
    return (
      <div
        className="flex items-center justify-center rounded-2xl border border-[var(--card-border)] bg-[var(--card)] text-sm text-[var(--muted-foreground)] h-[220px] lg:h-[280px]"
      >
        No acreage timeline yet.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--card)] p-4 shadow-sm">
      <h3 className="text-base font-bold text-[var(--foreground)]">Fire growth</h3>
      <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">
        Acres reported over time
      </p>
      <div className="mt-3 h-[220px] lg:h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 6, right: 8, bottom: 4, left: 0 }}>
            <CartesianGrid stroke={grid} vertical={false} strokeDasharray="3 6" />
            <XAxis
              type="number"
              dataKey="t"
              domain={["dataMin", "dataMax"]}
              tickFormatter={(v) => formatTick(v as number)}
              tick={{ fill: muted, fontSize: 10 }}
              tickLine={false}
              axisLine={{ stroke: grid }}
            />
            <YAxis
              tick={{ fill: muted, fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              width={44}
              tickFormatter={(v) => (typeof v === "number" ? v.toLocaleString() : String(v))}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const row = payload[0].payload as ChartRow;
                return (
                  <div
                    className={`rounded-xl border px-3 py-2 text-xs shadow-lg ${
                      dark
                        ? "border-[#1f2937] bg-[#121821] text-slate-100"
                        : "border-[#e2e8f0] bg-white text-slate-900"
                    }`}
                  >
                    <p className="font-semibold">{formatTick(row.t)}</p>
                    <p className="mt-1 tabular-nums">{row.acres.toLocaleString()} acres</p>
                    <p
                      className={`mt-0.5 tabular-nums ${dark ? "text-slate-400" : "text-slate-500"}`}
                    >
                      {row.containmentPct.toFixed(1)}% contained
                    </p>
                  </div>
                );
              }}
            />
            <Line
              type="monotone"
              dataKey="acres"
              stroke={lineColor}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 0 }}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
