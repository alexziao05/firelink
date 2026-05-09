"use client";

import { useLayoutEffect, useRef, useState } from "react";
import type { SemanticTier } from "@/lib/dashboardSemantic";
import { activityPillClasses, statToneClasses } from "@/lib/semanticStyles";

function formatWhen(iso: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function drynessContext(windMph: number, humidityPct: number): string | null {
  if (humidityPct <= 0 && windMph <= 0) return null;
  if (humidityPct < 20 && windMph >= 14) {
    return "Very dry air combined with gusty winds increases potential for rapid fire spread.";
  }
  if (humidityPct < 25) {
    return "Low humidity dries fuels quickly and intensifies burning conditions.";
  }
  if (windMph >= 18) {
    return "Elevated gusts push embers farther—watch for spotting.";
  }
  return "Monitor changing wind and humidity; conditions can worsen quickly.";
}

export function LatestFireUpdate({
  fireName,
  status,
  timestampIso,
  acres,
  containmentPct,
  growthDelta,
  alert,
}: {
  fireName: string;
  status: string;
  timestampIso: string;
  acres: number;
  containmentPct: number;
  growthDelta: {
    deltaAcres: number;
    priorAcres: number;
    currentAcres: number;
  } | null;
  alert: {
    tier: SemanticTier;
    event: string;
    timestampIso: string;
    severity: string;
    alertLevelLabel: string;
    windMph: number;
    humidityPct: number;
    area: string;
    description: string;
  } | null;
}) {
  const [expanded, setExpanded] = useState(false);
  const textRef = useRef<HTMLParagraphElement>(null);
  const [clamped, setClamped] = useState(false);

  useLayoutEffect(() => {
    const el = textRef.current;
    if (!el || expanded) return;
    setClamped(el.scrollHeight > el.clientHeight);
  }, [status, expanded]);

  const clampClass = expanded ? "" : "line-clamp-4";

  const deltaLine =
    growthDelta && growthDelta.deltaAcres !== 0
      ? `${growthDelta.deltaAcres > 0 ? "+" : ""}${growthDelta.deltaAcres.toLocaleString()} acres vs prior reported size`
      : growthDelta && growthDelta.deltaAcres === 0
        ? "Same reported size as prior update"
        : null;

  const weatherNote = alert ? drynessContext(alert.windMph, alert.humidityPct) : null;

  return (
    <aside className="rounded-2xl border border-[var(--card-border)] bg-[var(--card)] p-4 shadow-sm">
      <h3 className="text-sm font-bold text-[var(--foreground)]">Latest fire update</h3>
      {fireName && fireName !== "—" ? (
        <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
          {fireName}
        </p>
      ) : null}
      <time
        dateTime={timestampIso || undefined}
        className="mt-1 block text-xs text-[var(--muted-foreground)]"
      >
        Report time: {formatWhen(timestampIso)}
      </time>

      <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-[var(--card-border)] bg-slate-50/80 px-3 py-2 dark:bg-slate-900/40">
          <dt className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
            Size
          </dt>
          <dd className="mt-0.5 text-lg font-bold tabular-nums text-[var(--foreground)]">
            {acres.toLocaleString()} ac
          </dd>
        </div>
        <div className="rounded-xl border border-[var(--card-border)] bg-slate-50/80 px-3 py-2 dark:bg-slate-900/40">
          <dt className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
            Contained
          </dt>
          <dd className="mt-0.5 text-lg font-bold tabular-nums text-[var(--foreground)]">
            {containmentPct.toFixed(1)}%
          </dd>
        </div>
        <div className="col-span-2 rounded-xl border border-[var(--card-border)] bg-slate-50/80 px-3 py-2 sm:col-span-1 dark:bg-slate-900/40">
          <dt className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
            Change
          </dt>
          <dd className="mt-0.5 text-sm font-semibold leading-snug text-[var(--foreground)]">
            {deltaLine ?? "—"}
          </dd>
        </div>
      </dl>

      <div className="mt-5 border-t border-[var(--card-border)] pt-4">
        <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--muted-foreground)]">
          Incident status
        </h4>
        <p
          ref={textRef}
          className={`mt-2 text-sm leading-relaxed text-[var(--foreground)] ${clampClass}`}
        >
          {status}
        </p>
        {clamped || expanded ? (
          <button
            type="button"
            onClick={() => setExpanded((e) => !e)}
            className="mt-2 text-xs font-semibold text-blue-700 underline underline-offset-2 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300"
          >
            {expanded ? "Show less" : "Read more"}
          </button>
        ) : null}
      </div>

      <div className="mt-5 border-t border-[var(--card-border)] pt-4">
        <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--muted-foreground)]">
          Fire weather snapshot
        </h4>
        {alert?.timestampIso ? (
          <>
            <div className={`mt-2 rounded-xl p-3 ${statToneClasses[alert.tier]}`}>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-semibold text-[var(--foreground)]">{alert.event}</span>
                <span
                  className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase ${activityPillClasses[alert.tier]}`}
                >
                  {alert.severity}
                </span>
              </div>
              <time
                dateTime={alert.timestampIso}
                className="mt-2 block text-xs text-[var(--muted-foreground)]"
              >
                Observation time: {formatWhen(alert.timestampIso)}
              </time>
              <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <dt className="text-[var(--muted-foreground)]">Wind gusts</dt>
                  <dd className="font-semibold tabular-nums text-[var(--foreground)]">
                    {alert.windMph} mph
                  </dd>
                </div>
                <div>
                  <dt className="text-[var(--muted-foreground)]">Humidity</dt>
                  <dd className="font-semibold tabular-nums text-[var(--foreground)]">
                    {alert.humidityPct}%
                  </dd>
                </div>
              </dl>
              {alert.area ? (
                <p className="mt-2 text-xs leading-snug text-[var(--muted-foreground)]">
                  Area: {alert.area}
                </p>
              ) : null}
              {alert.description ? (
                <p className="mt-2 border-t border-[var(--card-border)] pt-2 text-xs leading-relaxed text-[var(--foreground)]">
                  {alert.description}
                </p>
              ) : null}
              {weatherNote ? (
                <p className="mt-2 text-xs font-medium leading-snug text-[var(--muted-foreground)]">
                  {weatherNote}
                </p>
              ) : null}
            </div>
          </>
        ) : (
          <p className="mt-2 text-xs text-[var(--muted-foreground)]">
            No fire-weather observations in the current feed.
          </p>
        )}
      </div>

      <p className="mt-4 text-xs leading-relaxed text-[var(--muted-foreground)]">
        This dashboard uses demo data for training and awareness only. For evacuation orders and
        official incident information, follow your county emergency office and trusted local fire
        agencies.
      </p>

      <p className="mt-4 rounded-xl border border-amber-500/25 bg-amber-50/80 p-3 text-xs leading-snug text-amber-950 dark:border-amber-500/35 dark:bg-amber-950/30 dark:text-amber-100">
        Follow official evacuation orders. If you are in immediate danger, call 911.
      </p>
    </aside>
  );
}