/**
 * API client for EvacLink backend communication.
 */

import {
  Report,
  ReportCreate,
  Shelter,
  RiskCell,
  RouteRequest,
  RouteResponse,
  FeatureCollection,
} from "../types";

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

class EvacLinkClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  // Health
  async health() {
    return this.request("/health");
  }

  // Reports
  async createReport(report: ReportCreate): Promise<Report> {
    return this.request("/reports", {
      method: "POST",
      body: JSON.stringify(report),
    });
  }

  async getReports(reportType?: string): Promise<Report[]> {
    let endpoint = "/reports";
    if (reportType) {
      endpoint += `?report_type=${reportType}`;
    }
    return this.request(endpoint);
  }

  async getReport(id: number): Promise<Report> {
    return this.request(`/reports/${id}`);
  }

  async updateReport(
    id: number,
    updates: { is_resolved?: boolean; note?: string }
  ): Promise<Report> {
    const params = new URLSearchParams();
    if (updates.is_resolved !== undefined) {
      params.append("is_resolved", String(updates.is_resolved));
    }
    if (updates.note !== undefined) {
      params.append("note", updates.note);
    }
    return this.request(`/reports/${id}?${params}`, {
      method: "PATCH",
    });
  }

  // Shelters & Layers
  async getShelters(): Promise<Shelter[]> {
    return this.request("/layers/shelters");
  }

  async getFireLayer(): Promise<FeatureCollection> {
    return this.request("/layers/fire");
  }

  // Risk
  async getRiskGrid(
    minLat: number,
    maxLat: number,
    minLon: number,
    maxLon: number
  ): Promise<RiskCell[]> {
    const params = new URLSearchParams({
      min_lat: String(minLat),
      max_lat: String(maxLat),
      min_lon: String(minLon),
      max_lon: String(maxLon),
    });
    return this.request(`/risk/grid?${params}`);
  }

  // Routing
  async computeRoute(request: RouteRequest): Promise<RouteResponse> {
    return this.request("/route", {
      method: "POST",
      body: JSON.stringify(request),
    });
  }
}

export const client = new EvacLinkClient();
