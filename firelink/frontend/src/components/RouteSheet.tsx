import React from "react";
import RoutePanel from "./RoutePanel";
import { RouteResponse, Shelter } from "../types";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  selectedLocation: { lat: number; lng: number } | null;
  shelters: Shelter[];
  onRouteRequest: (startLat: number, startLng: number, shelterId?: number) => Promise<void>;
  route: RouteResponse | null;
  isLoading?: boolean;
}

const RouteSheet: React.FC<Props> = ({
  isOpen,
  onClose,
  selectedLocation,
  shelters,
  onRouteRequest,
  route,
  isLoading = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="bottom-sheet" onClick={(e) => e.stopPropagation()}>
        <div style={{ padding: 12 }}>
          <h3 style={{ marginTop: 0 }}>Evacuation Route</h3>

          <RoutePanel
            selectedLocation={selectedLocation}
            shelters={shelters}
            onRouteRequest={onRouteRequest}
            route={route}
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

export default RouteSheet;
