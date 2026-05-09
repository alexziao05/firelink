import type { SemanticTier } from "@/lib/dashboardSemantic";
import { apiGet } from "@/lib/api";
import fireIncidentsData from "@/data/fire_incidents.json";
import weatherAlertsData from "@/data/weather_alerts.json";

export type RawFireIncident = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  acres: number;
  containment: number;
  status: string;
  timestamp: string;
};

export type RawWeatherAlert = {
  id: string;
  event: string;
  severity: string;
  area: string;
  description: string;
  wind_mph: number;
  humidity_pct: number;
  onset: string;
  expires: string;
  timestamp: string;
};

export type FireGrowthPoint = {
  /** ISO timestamp for chart + tooltip */
  timestampIso: string;
  acres: number;
  /** 0–100 */
  containmentPct: number;
};

/** Compare last two plateau points in the merged growth series (+acres vs prior report). */
export function lastReportedGrowthDelta(series: FireGrowthPoint[]): {
  deltaAcres: number;
  priorAcres: number;
  currentAcres: number;
} | null {
  if (series.length < 2) return null;
  const prior = series[series.length - 2]!;
  const current = series[series.length - 1]!;
  return {
    deltaAcres: current.acres - prior.acres,
    priorAcres: prior.acres,
    currentAcres: current.acres,
  };
}

export type AlertTimelineItem = {
  id: string;
  event: string;
  severity: string;
  tier: SemanticTier;
  timestampIso: string;
  windMph: number;
  humidityPct: number;
};

export type PastIncidentUpdateItem = {
  id: string;
  timestampIso: string;
  status: string;
  acres: number;
  containmentPct: number;
};

export type FireConditionsViewModel = {
  latestIncident: {
    name: string;
    acres: number;
    containmentPct: number;
    status: string;
    timestampIso: string;
  };
  growthSeries: FireGrowthPoint[];
  latestAlert: {
    event: string;
    severity: string;
    tier: SemanticTier;
    alertLevelLabel: string;
    area: string;
    /** Official-style observation text when present (mock / API). */
    description: string;
    windMph: number;
    humidityPct: number;
    timestampIso: string;
  };
  /** Recent alerts, newest first (5–8 items) */
  alertTimeline: AlertTimelineItem[];
  /** Past incident reports (newest first), excluding latest snapshot shown above */
  pastIncidentUpdates: PastIncidentUpdateItem[];
  /** Severity-only timeline for “recent alert severity” context (newest first, same window) */
  alertSeverityTimeline: { timestampIso: string; severity: string; tier: SemanticTier }[];
};

function parseTime(iso: string): number {
  return new Date(iso).getTime();
}

/** Map NWS-style event + severity to dashboard semantic colors. */
export function alertToTier(event: string, severity: string): SemanticTier {
  const ev = event.toLowerCase();
  const sev = severity.trim().toLowerCase();
  if (sev === "severe" || /red\s*flag/i.test(event)) return "urgent";
  if (sev === "moderate" || /fire\s*weather\s*watch/i.test(ev)) return "warning";
  if (sev === "minor" || /advisory/i.test(ev)) return "info";
  return "neutral";
}

function latestByTimestamp<T extends { timestamp: string }>(rows: T[]): T | null {
  if (rows.length === 0) return null;
  return rows.reduce((a, b) =>
    parseTime(b.timestamp) >= parseTime(a.timestamp) ? b : a,
  );
}

function buildGrowthSeries(incidents: RawFireIncident[]): FireGrowthPoint[] {
  const sorted = [...incidents].sort(
    (a, b) => parseTime(a.timestamp) - parseTime(b.timestamp),
  );
  const out: FireGrowthPoint[] = [];
  for (const row of sorted) {
    const acres = row.acres;
    const containmentPct = row.containment * 100;
    const prev = out[out.length - 1];
    if (prev && prev.acres === acres && prev.containmentPct === containmentPct) {
      prev.timestampIso = row.timestamp;
      continue;
    }
    out.push({
      timestampIso: row.timestamp,
      acres,
      containmentPct,
    });
  }
  return out;
}

const ALERT_TIMELINE_COUNT = 8;
const PAST_INCIDENT_UPDATES_CAP = 56;

/** Newest-first, removing exact duplicates (same time + acreage + containment + status). */
function distinctIncidentSnapshotsDesc(rows: RawFireIncident[]): RawFireIncident[] {
  const sorted = [...rows].sort((a, b) => parseTime(b.timestamp) - parseTime(a.timestamp));
  const out: RawFireIncident[] = [];
  let lastKey = "";
  for (const row of sorted) {
    const key = `${row.timestamp}|${row.acres}|${row.containment}|${row.status}`;
    if (out.length > 0 && lastKey === key) continue;
    lastKey = key;
    out.push(row);
  }
  return out;
}

export function getFireConditionsViewModel(
  incidents: RawFireIncident[],
  alerts: RawWeatherAlert[],
): FireConditionsViewModel | null {
  if (incidents.length === 0 && alerts.length === 0) return null;

  const snapshotsDesc =
    incidents.length > 0 ? distinctIncidentSnapshotsDesc(incidents) : [];
  const latestAlertRow = latestByTimestamp(alerts);

  const growthSeries = buildGrowthSeries(incidents);

  const sortedAlertsDesc = [...alerts].sort(
    (a, b) => parseTime(b.timestamp) - parseTime(a.timestamp),
  );
  const slice = sortedAlertsDesc.slice(0, ALERT_TIMELINE_COUNT);

  const alertTimeline: AlertTimelineItem[] = slice.map((a) => {
    const tier = alertToTier(a.event, a.severity);
    return {
      id: a.id,
      event: a.event,
      severity: a.severity,
      tier,
      timestampIso: a.timestamp,
      windMph: a.wind_mph,
      humidityPct: a.humidity_pct,
    };
  });

  const alertSeverityTimeline = slice.map((a) => ({
    timestampIso: a.timestamp,
    severity: a.severity,
    tier: alertToTier(a.event, a.severity),
  }));

  const defaultLatest = {
    event: "—",
    severity: "—",
    tier: "neutral" as SemanticTier,
    alertLevelLabel: "No active alert",
    area: "",
    description: "",
    windMph: 0,
    humidityPct: 0,
    timestampIso: "",
  };

  const latestAlert = latestAlertRow
    ? {
        event: latestAlertRow.event,
        severity: latestAlertRow.severity,
        tier: alertToTier(latestAlertRow.event, latestAlertRow.severity),
        alertLevelLabel: `${latestAlertRow.event} · ${latestAlertRow.severity}`,
        area: latestAlertRow.area,
        description: latestAlertRow.description,
        windMph: latestAlertRow.wind_mph,
        humidityPct: latestAlertRow.humidity_pct,
        timestampIso: latestAlertRow.timestamp,
      }
    : defaultLatest;

  const defaultIncident = {
    name: "—",
    acres: 0,
    containmentPct: 0,
    status: "No incident updates available.",
    timestampIso: "",
  };

  const headline = snapshotsDesc[0];

  const latestIncident = headline
    ? {
        name: headline.name,
        acres: headline.acres,
        containmentPct: headline.containment * 100,
        status: headline.status,
        timestampIso: headline.timestamp,
      }
    : defaultIncident;

  const pastIncidentUpdates: PastIncidentUpdateItem[] = snapshotsDesc
    .slice(1, 1 + PAST_INCIDENT_UPDATES_CAP)
    .map((row) => ({
      id: row.id,
      timestampIso: row.timestamp,
      status: row.status,
      acres: row.acres,
      containmentPct: row.containment * 100,
    }));

  return {
    latestIncident,
    growthSeries,
    latestAlert,
    alertTimeline,
    pastIncidentUpdates,
    alertSeverityTimeline,
  };
}

/** Demo: bundled mock incidents + alerts (server-safe, no network). */
export function getMockFireConditionsViewModel(): FireConditionsViewModel | null {
  return getFireConditionsViewModel(
    fireIncidentsData as RawFireIncident[],
    weatherAlertsData as RawWeatherAlert[],
  );
}

/**
 * Fetches incidents + alerts from the backend in parallel and builds the view
 * model. Falls back to the bundled mock if either request fails so the demo
 * never goes blank.
 */
export async function getLiveFireConditionsViewModel(): Promise<FireConditionsViewModel | null> {
  try {
    const [incidents, alerts] = await Promise.all([
      apiGet<RawFireIncident[]>("/fire-incidents/"),
      apiGet<RawWeatherAlert[]>("/weather-alerts/"),
    ]);
    return getFireConditionsViewModel(incidents, alerts);
  } catch {
    return getMockFireConditionsViewModel();
  }
}
