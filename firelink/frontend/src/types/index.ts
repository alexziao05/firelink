/**
 * TypeScript types and interfaces for EvacLink frontend.
 */

export type ReportType =
  | "blocked_road"
  | "fire_seen"
  | "heavy_smoke"
  | "assistance_needed"
  | "power_outage";

export interface Report {
  id: number;
  report_type: ReportType;
  latitude: number;
  longitude: number;
  note?: string;
  created_at: string;
  updated_at: string;
  is_resolved: boolean;
}

export interface ReportCreate {
  report_type: ReportType;
  latitude: number;
  longitude: number;
  note?: string;
}

export interface Shelter {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  capacity?: number;
  description?: string;
}

export interface RiskCell {
  latitude: number;
  longitude: number;
  risk_score: number;
}

export interface RouteRequest {
  start_latitude: number;
  start_longitude: number;
  shelter_id?: number;
}

export interface RouteResponse {
  route_geojson: {
    type: "LineString";
    coordinates: [number, number][];
  };
  risk_score: number;
  explanation: string[];
  destination_shelter: Shelter;
}

export interface MapLocation {
  latitude: number;
  longitude: number;
}

export interface FeatureCollection {
  type: "FeatureCollection";
  features: Feature[];
}

export interface Feature {
  type: "Feature";
  geometry: {
    type: string;
    coordinates: number[];
  };
  properties: Record<string, unknown>;
}
