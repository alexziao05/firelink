import React from "react";
import ReportForm from "./ReportForm";
import { ReportCreate } from "../types";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  selectedLocation: { lat: number; lng: number } | null;
  setSelectedLocation?: (loc: { lat: number; lng: number } | null) => void;
  setSelectionMode?: (v: boolean) => void;
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
  if (!isOpen) return null;

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="bottom-sheet" onClick={(e) => e.stopPropagation()}>
        <div style={{ padding: 12 }}>

          <ReportForm
            selectedLocation={selectedLocation}
            onSubmit={onSubmit}
            isLoading={isLoading}
          />

          <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginTop: 8 }}>
            <button
              onClick={() => {
                onClose();
                if (setSelectionMode) setSelectionMode(true);
              }}
              style={{ padding: 8, borderRadius: 4 }}
            >
              Change location
            </button>

            <div style={{ marginLeft: "auto" }}>
              <button onClick={onClose} style={{ padding: 8, borderRadius: 4 }}>
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportSheet;
