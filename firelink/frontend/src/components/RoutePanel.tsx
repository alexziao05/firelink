/**
 * RoutePanel Component - Route request and display panel
 */
import React, { useState } from "react";
import { RouteResponse, Shelter } from "../types";

interface RoutePanelProps {
  selectedLocation: { lat: number; lng: number } | null;
  shelters: Shelter[];
  onRouteRequest: (
    startLat: number,
    startLng: number,
    shelterId?: number
  ) => Promise<void>;
  route: RouteResponse | null;
  isLoading?: boolean;
}

/**
 * RoutePanel Component
 * Allows users to:
 * - Request safest evacuation route from selected location
 * - Choose specific shelter or auto-select nearest
 * - View route explanation and risk score
 * - Display destination shelter info
 */
const RoutePanel: React.FC<RoutePanelProps> = ({
  selectedLocation,
  shelters,
  onRouteRequest,
  route,
  isLoading = false,
}) => {
  const [selectedShelter, setSelectedShelter] = useState<number | "nearest">(
    "nearest"
  );
  const [error, setError] = useState("");

  const handleRequestRoute = async () => {
    setError("");

    if (!selectedLocation) {
      setError("Please select a location on the map first");
      return;
    }

    try {
      const shelterId =
        selectedShelter === "nearest"
          ? undefined
          : (selectedShelter as number);
      await onRouteRequest(
        selectedLocation.lat,
        selectedLocation.lng,
        shelterId
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to compute route"
      );
    }
  };

  const getRiskLevel = (score: number) => {
    if (score < 0.3) return "Low";
    if (score < 0.6) return "Medium";
    return "High";
  };

  const getRiskColor = (score: number) => {
    if (score < 0.3) return "#4caf50";
    if (score < 0.6) return "#ff9800";
    return "#f44336";
  };

  return (
    <div
      style={{
        padding: "16px",
        backgroundColor: "#f5f5f5",
        borderRadius: "8px",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
      }}
    >

      <div style={{ marginBottom: "12px" }}>
        <label style={{ display: "block", marginBottom: "4px", fontWeight: "bold" }}>
          Destination
        </label>
        <select
          value={selectedShelter}
          onChange={(e) =>
            setSelectedShelter(
              e.target.value === "nearest"
                ? "nearest"
                : parseInt(e.target.value)
            )
          }
          style={{
            width: "100%",
            padding: "8px",
            borderRadius: "4px",
            border: "1px solid #ccc",
            boxSizing: "border-box",
          }}
        >
          <option value="nearest">📍 Nearest Shelter</option>
          {shelters.map((shelter) => (
            <option key={shelter.id} value={shelter.id}>
              {shelter.name}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div
          style={{
            padding: "8px",
            marginBottom: "12px",
            backgroundColor: "#fee",
            color: "#c33",
            borderRadius: "4px",
            fontSize: "12px",
          }}
        >
          {error}
        </div>
      )}

      <button
        onClick={handleRequestRoute}
        disabled={isLoading || !selectedLocation}
        style={{
          width: "100%",
          padding: "10px",
          marginBottom: "12px",
          backgroundColor: selectedLocation ? "#2196f3" : "#bbb",
          color: "white",
          border: "none",
          borderRadius: "4px",
          cursor: selectedLocation ? "pointer" : "not-allowed",
          fontWeight: "bold",
          fontSize: "14px",
        }}
      >
        {isLoading ? "Computing Route..." : "Get Safe Route"}
      </button>

      {route && (
        <div
          style={{
            padding: "12px",
            backgroundColor: "#fff",
            borderRadius: "4px",
            border: "1px solid #ddd",
          }}
        >
          <h4 style={{ marginTop: 0, marginBottom: "8px" }}>
            Route to {route.destination_shelter.name}
          </h4>

          <div style={{ marginBottom: "8px" }}>
            <div style={{ fontSize: "12px", color: "#666", marginBottom: "4px" }}>
              Risk Level
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <div
                style={{
                  width: "30px",
                  height: "20px",
                  backgroundColor: getRiskColor(route.risk_score),
                  borderRadius: "4px",
                }}
              />
              <span style={{ fontWeight: "bold" }}>
                {getRiskLevel(route.risk_score)}
              </span>
              <span style={{ fontSize: "12px", color: "#999" }}>
                ({(route.risk_score * 100).toFixed(1)}%)
              </span>
            </div>
          </div>

          <div style={{ marginBottom: "8px" }}>
            <div style={{ fontSize: "12px", color: "#666", marginBottom: "4px" }}>
              Route Explanation
            </div>
            <ul style={{ margin: 0, paddingLeft: "16px", fontSize: "12px" }}>
              {route.explanation.map((exp, i) => (
                <li key={i}>{exp}</li>
              ))}
            </ul>
          </div>

          <div style={{ fontSize: "12px", color: "#666" }}>
            <strong>Shelter:</strong> {route.destination_shelter.name}
            {route.destination_shelter.capacity && (
              <>
                <br />
                <strong>Capacity:</strong> {route.destination_shelter.capacity}
              </>
            )}
            {route.destination_shelter.description && (
              <>
                <br />
                <strong>Details:</strong> {route.destination_shelter.description}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default RoutePanel;
