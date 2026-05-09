/**
 * ReportForm Component - Form for creating new incident reports
 */
import React, { useState } from "react";
import { ReportType, ReportCreate } from "../types";

interface ReportFormProps {
  selectedLocation: { lat: number; lng: number } | null;
  onSubmit: (report: ReportCreate) => Promise<void>;
  isLoading?: boolean;
}

/**
 * ReportForm Component
 * Allows users to:
 * - Select report type (blocked road, fire, smoke, etc.)
 * - Add optional notes
 * - Confirm location (from map click)
 * - Submit report to backend
 */
const ReportForm: React.FC<ReportFormProps> = ({
  selectedLocation,
  onSubmit,
  isLoading = false,
}) => {
  const [reportType, setReportType] = useState<ReportType>("fire_seen");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const reportOptions: { value: ReportType; label: string; emoji: string }[] = [
    { value: "fire_seen", label: "Fire Seen", emoji: "🔥" },
    { value: "blocked_road", label: "Blocked Road", emoji: "🛑" },
    { value: "heavy_smoke", label: "Heavy Smoke", emoji: "💨" },
    { value: "assistance_needed", label: "Assistance Needed", emoji: "🆘" },
    { value: "power_outage", label: "Power Outage", emoji: "⚡" },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (!selectedLocation) {
      setError("Please select a location on the map first");
      return;
    }

    try {
      const report: ReportCreate = {
        report_type: reportType,
        latitude: selectedLocation.lat,
        longitude: selectedLocation.lng,
        note: note || undefined,
      };

      await onSubmit(report);
      setSuccess(true);
      setNote("");
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to submit report"
      );
    }
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
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: "12px" }}>
          <label style={{ display: "block", marginBottom: "8px", fontWeight: "bold" }}>
            Report Type
          </label>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "8px",
            }}
          >
            {reportOptions.map((opt) => {
              const selected = reportType === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setReportType(opt.value)}
                  aria-pressed={selected}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                    padding: "10px",
                    borderRadius: "8px",
                    border: selected ? "2px solid #c0392b" : "1px solid #ccc",
                    background: selected ? "#e74c3c" : "#fff",
                    color: selected ? "#fff" : "#222",
                    cursor: "pointer",
                    fontWeight: 600,
                    fontSize: "14px",
                    minHeight: "56px",
                  }}
                >
                  <span style={{ fontSize: 20 }}>{opt.emoji}</span>
                  <span style={{ fontSize: 12 }}>{opt.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ marginBottom: "12px" }}>
          <label style={{ display: "block", marginBottom: "4px", fontWeight: "bold" }}>
            Notes (Optional)
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Add details about the incident..."
            style={{
              width: "100%",
              padding: "8px",
              borderRadius: "4px",
              border: "1px solid #ccc",
              boxSizing: "border-box",
              fontFamily: "inherit",
              minHeight: "60px",
              resize: "vertical",
            }}
          />
        </div>

        <div style={{ marginBottom: "12px" }}>
          <label style={{ display: "block", marginBottom: "4px", fontWeight: "bold" }}>
            Location
          </label>
          <div
            style={{
              padding: "8px",
              backgroundColor: "#fff",
              borderRadius: "4px",
              border: "1px solid #ccc",
              fontSize: "12px",
            }}
          >
            {selectedLocation ? (
              <>
                Lat: {selectedLocation.lat.toFixed(4)}, Lon:{" "}
                {selectedLocation.lng.toFixed(4)}
              </>
            ) : (
              <span style={{ color: "#999" }}>
                Click on map to select location
              </span>
            )}
          </div>
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

        {success && (
          <div
            style={{
              padding: "8px",
              marginBottom: "12px",
              backgroundColor: "#efe",
              color: "#3c3",
              borderRadius: "4px",
              fontSize: "12px",
            }}
          >
            Report submitted successfully!
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading || !selectedLocation}
          style={{
            width: "100%",
            padding: "10px",
            backgroundColor: selectedLocation ? "#e74c3c" : "#bbb",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: selectedLocation ? "pointer" : "not-allowed",
            fontWeight: "bold",
            fontSize: "14px",
          }}
        >
          {isLoading ? "Submitting..." : "Submit Report"}
        </button>
      </form>
    </div>
  );
};

export default ReportForm;
