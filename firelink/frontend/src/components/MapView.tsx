/**
 * MapView Component - Interactive map display using Leaflet
 */
import React, { useEffect, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Report, Shelter, RiskCell, RouteResponse } from "../types";

interface MapViewProps {
  reports: Report[];
  shelters: Shelter[];
  riskCells: RiskCell[];
  selectedLocation: { lat: number; lng: number } | null;
  route: RouteResponse | null;
  onLocationSelect: (lat: number, lng: number) => void;
  selectionMode?: boolean;
}

interface MapInstance {
  current: L.Map | null;
}

/**
 * MapView Component
 * Displays an interactive Leaflet map with:
 * - Shelter markers (blue)
 * - Fire/incident reports (colored by type)
 * - Risk heatmap (red overlay for high-risk areas)
 * - Selected location marker
 * - Evacuation route (if computed)
 */
const MapView: React.FC<MapViewProps> = ({
  reports,
  shelters,
  riskCells,
  selectedLocation,
  route,
  onLocationSelect,
}) => {
  const mapRef = React.useRef<HTMLDivElement>(null);
  const mapInstance: MapInstance = { current: null };
  const [markersLayer, setMarkersLayer] = useState<L.LayerGroup | null>(null);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    // Default center: San Diego area
    const map = L.map(mapRef.current).setView([32.7157, -117.1611], 11);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "© OpenStreetMap contributors",
    }).addTo(map);

    mapInstance.current = map;

    // Click handler for location selection
    map.on("click", (e: L.LeafletMouseEvent) => {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    });

    // Create markers layer
    const markers = L.layerGroup().addTo(map);
    setMarkersLayer(markers);

    return () => {
      map.remove();
      mapInstance.current = null;
    };
  }, [onLocationSelect]);

  // Update markers for shelters
  useEffect(() => {
    if (!markersLayer) return;

    markersLayer.clearLayers();

    // Add shelter markers
    shelters.forEach((shelter) => {
      const marker = L.marker([shelter.latitude, shelter.longitude], {
        icon: L.icon({
          iconUrl:
            "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
        }),
      }).bindPopup(`<strong>${shelter.name}</strong><br/>${shelter.description || ""}`);

      markersLayer.addLayer(marker);
    });

    // Add report markers
    reports.forEach((report) => {
      let color = "red";
      let icon = "🔴";

      if (report.report_type === "blocked_road") {
        color = "orange";
        icon = "🛑";
      } else if (report.report_type === "heavy_smoke") {
        color = "gray";
        icon = "💨";
      } else if (report.report_type === "assistance_needed") {
        color = "purple";
        icon = "🆘";
      }

      const marker = L.circleMarker(
        [report.latitude, report.longitude],
        {
          radius: 6,
          fillColor: color,
          color: "darkred",
          weight: 1,
          opacity: 1,
          fillOpacity: 0.7,
        }
      ).bindPopup(
        `<strong>${report.report_type}</strong><br/>${report.note || "No details"}`
      );

      markersLayer.addLayer(marker);
    });

    // Add selected location marker
    if (selectedLocation) {
      const marker = L.marker([selectedLocation.lat, selectedLocation.lng], {
        icon: L.icon({
          iconUrl:
            "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
        }),
      }).bindPopup("Selected Location");

      markersLayer.addLayer(marker);
    }

    // Add route if available
    if (route) {
      const routeLine = L.polyline(
        route.route_geojson.coordinates.map((coord: [number, number]) => [
          coord[1],
          coord[0],
        ]),
        { color: "green", weight: 3, opacity: 0.8 }
      );

      markersLayer.addLayer(routeLine);
    }

    // Add risk heatmap
    riskCells.forEach((cell) => {
      const opacity = Math.min(cell.risk_score, 1.0);
      const circle = L.circleMarker([cell.latitude, cell.longitude], {
        radius: 3,
        fillColor: "red",
        color: "darkred",
        weight: 0,
        opacity: 0,
        fillOpacity: opacity * 0.3,
      });

      markersLayer.addLayer(circle);
    });
  }, [markersLayer, reports, shelters, selectedLocation, route, riskCells]);

  return (
    <div
      ref={mapRef}
      style={{
        width: "100%",
        height: "100%",
        borderRadius: "8px",
      }}
    />
  );
};

export default MapView;
