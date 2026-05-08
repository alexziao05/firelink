/**
 * RiskLegend Component - Visual legend for risk scores and incident types
 */
import React from "react";

interface RiskLegendProps {}

/**
 * RiskLegend Component
 * Displays legend for:
 * - Risk score colors (low, medium, high)
 * - Incident type icons
 * - Shelter markers
 */
const RiskLegend: React.FC<RiskLegendProps> = () => {
  return (
    <div
      style={{
        padding: "12px",
        backgroundColor: "#fff",
        borderRadius: "8px",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        fontSize: "12px",
      }}
    >
      <h4 style={{ marginTop: 0, marginBottom: "8px" }}>Legend</h4>

      <div style={{ marginBottom: "8px" }}>
        <h5 style={{ margin: 0, marginBottom: "4px", fontSize: "11px" }}>
          Risk Level
        </h5>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
          <div
            style={{
              width: "16px",
              height: "16px",
              backgroundColor: "#4caf50",
              borderRadius: "2px",
            }}
          />
          <span>Low Risk</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
          <div
            style={{
              width: "16px",
              height: "16px",
              backgroundColor: "#ff9800",
              borderRadius: "2px",
            }}
          />
          <span>Medium Risk</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div
            style={{
              width: "16px",
              height: "16px",
              backgroundColor: "#f44336",
              borderRadius: "2px",
            }}
          />
          <span>High Risk</span>
        </div>
      </div>

      <div style={{ marginBottom: "8px" }}>
        <h5 style={{ margin: 0, marginBottom: "4px", fontSize: "11px" }}>
          Incident Types
        </h5>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
          <span>🔥</span>
          <span>Fire Seen</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
          <span>🛑</span>
          <span>Blocked Road</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
          <span>💨</span>
          <span>Heavy Smoke</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
          <span>🆘</span>
          <span>Assistance Needed</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span>🏢</span>
          <span>Evacuation Shelter</span>
        </div>
      </div>

      <div style={{ fontSize: "10px", color: "#999", marginTop: "8px", lineHeight: "1.4" }}>
        <p style={{ margin: "0 0 4px 0" }}>
          📍 Green marker = Your selected location
        </p>
        <p style={{ margin: "0 0 4px 0" }}>
          🟢 Blue marker = Evacuation shelter
        </p>
        <p style={{ margin: "0" }}>
          🟢 Green line = Safest evacuation route
        </p>
      </div>
    </div>
  );
};

export default RiskLegend;
