"use client";

import "leaflet/dist/leaflet.css";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import type { Path } from "leaflet";

const MapContainer = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(() => import("react-leaflet").then((mod) => mod.TileLayer), {
  ssr: false,
});
const GeoJSON = dynamic(() => import("react-leaflet").then((mod) => mod.GeoJSON), {
  ssr: false,
});
const CircleMarker = dynamic(
  () => import("react-leaflet").then((mod) => mod.CircleMarker),
  {
    ssr: false,
  }
);

const ARCGIS_GEOJSON_URL =
  "https://services1.arcgis.com/jUJYIo9tSA7EHvfZ/arcgis/rest/services/DINS_2025_Eaton_Public_View/FeatureServer/0/query?where=1%3D1&outFields=*&f=geojson&returnGeometry=true&resultRecordCount=1000";
const OFFICIAL_MAP_URL =
  "https://gis.data.cnra.ca.gov/maps/CALFIRE-Forestry::eaton-fire-structure-status-map/explore?location=34.182220,-118.153460,13";

const MAP_CENTER: [number, number] = [34.18222, -118.15346];
const MAP_ZOOM = 13;
const CURRENT_LOCATION: [number, number] = MAP_CENTER;

type FeatureProperties = Record<string, unknown>;
type Feature = {
  type: "Feature";
  geometry?: unknown;
  properties?: FeatureProperties;
};
type FeatureCollection = {
  type: "FeatureCollection";
  features: Feature[];
};

type DerivedFields = {
  statusKey?: string;
  structureTypeKey?: string;
  inspectionKey?: string;
};

function normalizeValue(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return "";
}

function fieldScore(key: string, terms: string[]): number {
  const lowerKey = key.toLowerCase();
  return terms.reduce((score, term) => {
    if (lowerKey === term) return score + 6;
    if (lowerKey.includes(term)) return score + 3;
    return score;
  }, 0);
}

function pickBestField(properties: FeatureProperties, terms: string[]): string | undefined {
  const keys = Object.keys(properties);
  let bestKey: string | undefined;
  let bestScore = 0;

  for (const key of keys) {
    const score = fieldScore(key, terms);
    if (score > bestScore) {
      bestScore = score;
      bestKey = key;
    }
  }

  return bestScore > 0 ? bestKey : undefined;
}

function detectFields(features: Feature[]): DerivedFields {
  const sample = features.find((feature) => feature.properties)?.properties;
  if (!sample) return {};

  return {
    statusKey: pickBestField(sample, ["damage", "status", "state", "impact"]),
    structureTypeKey: pickBestField(sample, ["structure", "occupancy", "building", "type", "use"]),
    inspectionKey: pickBestField(sample, ["inspection", "inspected", "review", "assess", "verification"]),
  };
}

function getStatusLabel(properties: FeatureProperties, fields: DerivedFields): string {
  const candidateKeys = [
    fields.statusKey,
    "DAMAGE",
    "DAMAGE_STATUS",
    "DAMAGESTATE",
    "STATUS",
    "STATUS_LABEL",
  ].filter(Boolean) as string[];

  for (const key of candidateKeys) {
    const value = normalizeValue(properties[key]);
    if (value) return value;
  }

  return "Unknown";
}

function getStructureLabel(properties: FeatureProperties, fields: DerivedFields): string | null {
  const candidateKeys = [
    fields.structureTypeKey,
    "STRUCTURE_TYPE",
    "STRUCTURE",
    "BLDG_TYPE",
    "OCCUPANCY",
    "TYPE",
  ].filter(Boolean) as string[];

  for (const key of candidateKeys) {
    const value = normalizeValue(properties[key]);
    if (value) return value;
  }

  return null;
}

function getInspectionLabel(properties: FeatureProperties, fields: DerivedFields): string | null {
  const candidateKeys = [
    fields.inspectionKey,
    "INSPECTION_STATUS",
    "INSPECTION",
    "INSPECTED",
    "ASSESSMENT_STATUS",
    "REVIEW_STATUS",
  ].filter(Boolean) as string[];

  for (const key of candidateKeys) {
    const value = normalizeValue(properties[key]);
    if (value) return value;
  }

  return null;
}

function statusToColor(rawStatus: string): string {
  const status = rawStatus.toLowerCase();
  if (status.includes("destroy")) return "#dc2626";
  if (status.includes("major")) return "#ea580c";
  if (status.includes("minor")) return "#f59e0b";
  if (status.includes("affect")) return "#facc15";
  if (status.includes("no damage") || status.includes("undamaged") || status.includes("none"))
    return "#16a34a";
  if (status.includes("inaccessible") || status.includes("unknown")) return "#6b7280";
  return "#6b7280";
}

const LEGEND_ITEMS = [
  { label: "Destroyed", color: "#dc2626" },
  { label: "Major", color: "#ea580c" },
  { label: "Minor", color: "#f59e0b" },
  { label: "Affected", color: "#facc15" },
  { label: "No Damage", color: "#16a34a" },
  { label: "Unknown", color: "#6b7280" },
];

export function LiveEatonMap() {
  const [data, setData] = useState<FeatureCollection | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [leafletLib, setLeafletLib] = useState<typeof import("leaflet") | null>(null);

  useEffect(() => {
    let mounted = true;

    import("leaflet")
      .then((mod) => {
        if (mounted) setLeafletLib(mod);
      })
      .catch(() => {
        if (mounted) setError("Unable to initialize map renderer");
      });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    const controller = new AbortController();

    async function loadMapData() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(ARCGIS_GEOJSON_URL, {
          method: "GET",
          signal: controller.signal,
          headers: {
            Accept: "application/geo+json,application/json;q=0.9,*/*;q=0.8",
          },
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error(`Map request failed (${response.status})`);
        }

        const json = (await response.json()) as FeatureCollection;
        if (!json || json.type !== "FeatureCollection" || !Array.isArray(json.features)) {
          throw new Error("Invalid GeoJSON response");
        }

        if (mounted) {
          setData(json);
        }
      } catch (loadError) {
        if (!mounted || controller.signal.aborted) return;
        setError(loadError instanceof Error ? loadError.message : "Unable to load map data");
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    loadMapData();

    return () => {
      mounted = false;
      controller.abort();
    };
  }, []);

  const derivedFields = useMemo(() => detectFields(data?.features ?? []), [data]);

  const mapData = useMemo(() => {
    if (!data) return null;
    return {
      ...data,
      features: data.features.map((feature) => {
        const props = feature.properties ?? {};
        const damageStatus = getStatusLabel(props, derivedFields);
        const structureType = getStructureLabel(props, derivedFields);
        const inspectionStatus = getInspectionLabel(props, derivedFields);
        return {
          ...feature,
          properties: {
            ...props,
            __damageStatus: damageStatus,
            __structureType: structureType,
            __inspectionStatus: inspectionStatus,
          },
        };
      }),
    };
  }, [data, derivedFields]);

  return (
    <section
      aria-labelledby="live-eaton-fire-map-title"
      className="live-eaton-map relative z-0 isolate rounded-2xl border border-(--card-border) bg-(--card) p-4 shadow-sm"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 id="live-eaton-fire-map-title" className="text-base font-bold text-foreground">
            Live Eaton Fire Map
          </h3>
          <p className="mt-0.5 text-xs text-(--muted-foreground)">
            Public ArcGIS structure status points from CAL FIRE / CNRA.
          </p>
        </div>
        <a
          href={OFFICIAL_MAP_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center rounded-lg border border-amber-500/40 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-900 transition hover:bg-amber-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/40 dark:border-amber-400/40 dark:bg-amber-950/30 dark:text-amber-100 dark:hover:bg-amber-950/45"
        >
          Open official map
        </a>
      </div>

      <div className="mt-3 overflow-hidden rounded-xl border border-(--card-border) bg-slate-100 dark:bg-slate-900/40">
        {isLoading ? (
          <div className="flex h-[360px] w-full items-center justify-center px-6 text-center md:h-[520px]">
            <p className="text-sm text-(--muted-foreground)">Loading live map data...</p>
          </div>
        ) : error || !mapData || !leafletLib ? (
          <div className="flex h-[360px] w-full flex-col items-center justify-center gap-3 px-6 text-center md:h-[520px]">
            <p className="text-sm font-semibold text-foreground">Live map data unavailable</p>
            <a
              href={OFFICIAL_MAP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-lg border border-(--card-border) bg-(--card) px-3 py-1.5 text-xs font-semibold text-foreground transition hover:bg-slate-100 dark:hover:bg-slate-800/70"
            >
              Open official CAL FIRE / CNRA map
            </a>
            <iframe
              title="Eaton Fire official map fallback"
              src={OFFICIAL_MAP_URL}
              className="mt-2 h-[220px] w-full border-0 md:h-[280px]"
              loading="lazy"
              allowFullScreen
            />
          </div>
        ) : (
          <MapContainer
            center={MAP_CENTER}
            zoom={MAP_ZOOM}
            className="h-[360px] w-full md:h-[520px]"
            scrollWheelZoom
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <GeoJSON
              data={mapData as GeoJSON.GeoJsonObject}
              pointToLayer={(_, latlng) =>
                leafletLib.circleMarker(latlng, {
                  radius: 6,
                  color: "#0f172a",
                  weight: 1,
                  opacity: 0.7,
                  fillColor: "#6b7280",
                  fillOpacity: 0.9,
                })
              }
              onEachFeature={(feature, layer) => {
                const properties = (feature.properties ?? {}) as FeatureProperties & {
                  __damageStatus?: string;
                  __structureType?: string | null;
                  __inspectionStatus?: string | null;
                };
                const status = properties.__damageStatus ?? "Unknown";
                const fillColor = statusToColor(status);

                if ("setStyle" in layer && typeof layer.setStyle === "function") {
                  (layer as Path).setStyle({
                    fillColor,
                    color: "#0f172a",
                    weight: 1,
                    opacity: 0.7,
                    fillOpacity: 0.9,
                  });
                }

                const structureType = properties.__structureType;
                const inspectionStatus = properties.__inspectionStatus;
                const popupParts = [
                  `<div style="font-size:12px;line-height:1.4;">`,
                  `<strong>Damage/Status:</strong> ${status}`,
                  structureType ? `<br/><strong>Structure Type:</strong> ${structureType}` : "",
                  inspectionStatus
                    ? `<br/><strong>Inspection:</strong> ${inspectionStatus}`
                    : "",
                  `</div>`,
                ];
                layer.bindPopup(popupParts.join(""));
              }}
            />
            <CircleMarker
              center={CURRENT_LOCATION}
              radius={10}
              pathOptions={{
                color: "#ffffff",
                weight: 2,
                fillColor: "#3b82f6",
                fillOpacity: 0.35,
              }}
            />
            <CircleMarker
              center={CURRENT_LOCATION}
              radius={5}
              pathOptions={{
                color: "#ffffff",
                weight: 2,
                fillColor: "#2563eb",
                fillOpacity: 1,
              }}
            />
          </MapContainer>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <div className="inline-flex items-center gap-1.5 text-[11px] text-foreground">
          <span
            aria-hidden="true"
            className="h-2.5 w-2.5 rounded-full border-2 border-white bg-blue-600 shadow-[0_0_0_3px_rgba(59,130,246,0.35)]"
          />
          <span>Current location</span>
        </div>
        {LEGEND_ITEMS.map((item) => (
          <div key={item.label} className="inline-flex items-center gap-1.5 text-[11px] text-foreground">
            <span
              aria-hidden="true"
              className="h-2.5 w-2.5 rounded-full border border-black/40"
              style={{ backgroundColor: item.color }}
            />
            <span>{item.label}</span>
          </div>
        ))}
      </div>

      <p className="mt-3 text-[11px] font-medium uppercase tracking-wide text-(--muted-foreground)">
        Source: ArcGIS FeatureServer (CAL FIRE / CNRA public view)
      </p>

      <p className="mt-3 rounded-xl border border-amber-500/25 bg-amber-50/70 p-3 text-xs leading-snug text-amber-950 dark:border-amber-500/35 dark:bg-amber-950/25 dark:text-amber-100">
        Public incident map data may lag official evacuation orders. Follow local emergency
        instructions.
      </p>

      <style jsx global>{`
        .live-eaton-map .leaflet-container {
          position: relative;
          z-index: 0;
        }

        .live-eaton-map .leaflet-pane {
          z-index: 10;
        }

        .live-eaton-map .leaflet-top,
        .live-eaton-map .leaflet-bottom {
          z-index: 20;
        }
      `}</style>
    </section>
  );
}
