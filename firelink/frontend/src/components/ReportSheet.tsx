import React, { useEffect, useState } from "react";
import ReportForm from "./ReportForm";
import { ReportCreate } from "../types";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  selectedLocation: { lat: number; lng: number } | null;
  setSelectedLocation: (loc: { lat: number; lng: number } | null) => void;
  onSubmit: (report: ReportCreate) => Promise<void>;
  isLoading?: boolean;
}

const ReportSheet: React.FC<Props> = ({
  isOpen,
  onClose,
  selectedLocation,
  setSelectedLocation,
  onSubmit,
  isLoading = false,
}) => {
  const [localLat, setLocalLat] = useState<string>("");
  const [localLng, setLocalLng] = useState<string>("");

  useEffect(() => {
    if (selectedLocation) {
      setLocalLat(selectedLocation.lat.toString());
      setLocalLng(selectedLocation.lng.toString());
    } else {
      setLocalLat("");
      setLocalLng("");
    }
  }, [selectedLocation, isOpen]);

  const applyLocationEdits = () => {
    const lat = parseFloat(localLat);
    const lng = parseFloat(localLng);
    if (!isNaN(lat) && !isNaN(lng)) {
      setSelectedLocation({ lat, lng });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="bottom-sheet" onClick={(e) => e.stopPropagation()}>
        <div style={{ padding: 12 }}>
          <h3 style={{ marginTop: 0 }}>Report Incident</h3>

          <div style={{ marginBottom: 8 }}>
            <label style={{ display: "block", fontSize: 12, color: "#666" }}>
              Confirm Location
            </label>
            <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
              <input
                value={localLat}
                onChange={(e) => setLocalLat(e.target.value)}
                placeholder="lat"
                style={{ flex: 1, padding: 8, borderRadius: 4, border: "1px solid #ccc" }}
              />
              <input
                value={localLng}
                onChange={(e) => setLocalLng(e.target.value)}
                placeholder="lng"
                style={{ flex: 1, padding: 8, borderRadius: 4, border: "1px solid #ccc" }}
              />
            </div>
            <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
              <button onClick={applyLocationEdits} style={{ padding: 8, borderRadius: 4 }}>
                Apply
              </button>
              <button onClick={() => setSelectedLocation(null)} style={{ padding: 8, borderRadius: 4 }}>
                Clear
              </button>
            </div>
          </div>

          <ReportForm
            selectedLocation={selectedLocation}
            onSubmit={onSubmit}
            isLoading={isLoading}
          />

          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
            <button onClick={onClose} style={{ padding: 8, borderRadius: 4 }}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportSheet;
