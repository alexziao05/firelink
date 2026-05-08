/**
 * FireLink - Wildfire Evacuation Intelligence Platform
 * Main App Component
 */
import React, { useEffect, useState } from "react";
import MapView from "./components/MapView";
import ReportForm from "./components/ReportForm";
import RoutePanel from "./components/RoutePanel";
import RiskLegend from "./components/RiskLegend";
import BottomReportButton from "./components/BottomReportButton";
import ReportSheet from "./components/ReportSheet";
import RouteSheet from "./components/RouteSheet";
import { client } from "./api/client";
import {
  Report,
  Shelter,
  RiskCell,
  RouteResponse,
  ReportCreate,
} from "./types";

/**
 * App Component
 * Main application container with:
 * - Interactive map on the left
 * - Report form and route panel on the right
 * - Real-time incident data and risk visualization
 */
const App: React.FC = () => {
  // State management
  const [reports, setReports] = useState<Report[]>([]);
  const [shelters, setShelters] = useState<Shelter[]>([]);
  const [riskCells, setRiskCells] = useState<RiskCell[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [route, setRoute] = useState<RouteResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [apiHealth, setApiHealth] = useState(false);
  const [reportSheetOpen, setReportSheetOpen] = useState(false);
  const [routeSheetOpen, setRouteSheetOpen] = useState(false);

  // Initialize app: check API health and load data
  useEffect(() => {
    const initializeApp = async () => {
      try {
        await client.health();
        setApiHealth(true);
        await loadData();
      } catch (err) {
        setError("Failed to connect to EvacLink backend. Is it running?");
        console.error(err);
      }
    };

    initializeApp();

    // Refresh data every 30 seconds
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  // Load reports, shelters, and risk grid
  const loadData = async () => {
    try {
      const [reportsData, sheltersData] = await Promise.all([
        client.getReports(),
        client.getShelters(),
      ]);

      setReports(reportsData);
      setShelters(sheltersData);

      // Load risk grid if we have a location
      if (selectedLocation) {
        const riskData = await client.getRiskGrid(
          selectedLocation.lat - 0.05,
          selectedLocation.lat + 0.05,
          selectedLocation.lng - 0.05,
          selectedLocation.lng + 0.05
        );
        setRiskCells(riskData);
      }
    } catch (err) {
      console.error("Failed to load data:", err);
    }
  };

  // Handle new report submission
  const handleReportSubmit = async (report: ReportCreate) => {
    setIsLoading(true);
    try {
      await client.createReport(report);
      await loadData();
      setSelectedLocation(null);
    } catch (err) {
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Handle route request
  const handleRouteRequest = async (
    startLat: number,
    startLng: number,
    shelterId?: number
  ) => {
    setIsLoading(true);
    try {
      const routeResponse = await client.computeRoute({
        start_latitude: startLat,
        start_longitude: startLng,
        shelter_id: shelterId,
      });
      setRoute(routeResponse);
    } catch (err) {
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Handle location selection from map
  const handleLocationSelect = async (lat: number, lng: number) => {
    setSelectedLocation({ lat, lng });
    setRoute(null); // Clear previous route

    // Load risk grid for this area
    try {
      const riskData = await client.getRiskGrid(
        lat - 0.05,
        lat + 0.05,
        lng - 0.05,
        lng + 0.05
      );
      setRiskCells(riskData);
    } catch (err) {
      console.error("Failed to load risk data:", err);
    }
  };

  if (!apiHealth) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          backgroundColor: "#f5f5f5",
        }}
      >
        <div style={{ textAlign: "center", padding: "20px" }}>
          <h1>EvacLink</h1>
          <p style={{ color: "#666", marginBottom: "20px" }}>
            Wildfire Evacuation Intelligence Platform
          </p>
          <div
            style={{
              backgroundColor: "#fee",
              padding: "16px",
              borderRadius: "8px",
              color: "#c33",
              maxWidth: "400px",
            }}
          >
            <p>
              <strong>Error:</strong> Cannot connect to backend
            </p>
            <p style={{ fontSize: "12px", margin: 0 }}>
              Make sure the FastAPI backend is running at{" "}
              <code>http://localhost:8000</code>
            </p>            <p style={{ fontSize: "12px", margin: "8px 0 0 0" }}>
              Run: <code>cd firelink/backend && python -m uvicorn app.main:app --reload</code>
            </p>          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        backgroundColor: "#f5f5f5",
      }}
    >
      {/* Header */}
      <header
        style={{
          backgroundColor: "#1a1a1a",
          color: "white",
          padding: "16px 24px",
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        }}
      >
        <h1 style={{ margin: 0, fontSize: "24px" }}>� FireLink</h1>
        <p style={{ margin: "4px 0 0 0", fontSize: "12px", opacity: 0.8 }}>
          Wildfire Evacuation Intelligence Platform
        </p>
      </header>

      {/* Main content */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden", gap: "16px", padding: "16px" }}>
        {/* Map takes full primary space now */}
        <div style={{ flex: 1, minWidth: 0, borderRadius: "8px", overflow: "hidden" }}>
          <MapView
            reports={reports}
            shelters={shelters}
            riskCells={riskCells}
            selectedLocation={selectedLocation}
            route={route}
            onLocationSelect={(lat, lng) => {
              handleLocationSelect(lat, lng);
              // open route sheet when a location is selected
              setRouteSheetOpen(true);
            }}
          />
        </div>
      </div>

      {/* Floating bottom report button and sheets */}
      <BottomReportButton onOpen={() => setReportSheetOpen(true)} />

      <ReportSheet
        isOpen={reportSheetOpen}
        onClose={() => setReportSheetOpen(false)}
        selectedLocation={selectedLocation}
        setSelectedLocation={setSelectedLocation}
        onSubmit={handleReportSubmit}
        isLoading={isLoading}
      />

      <RouteSheet
        isOpen={routeSheetOpen}
        onClose={() => setRouteSheetOpen(false)}
        selectedLocation={selectedLocation}
        shelters={shelters}
        onRouteRequest={handleRouteRequest}
        route={route}
        isLoading={isLoading}
      />
    </div>
  );
};

export default App;
