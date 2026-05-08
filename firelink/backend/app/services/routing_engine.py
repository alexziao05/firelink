"""
Routing engine for computing safest evacuation routes.
Note: This is a simple mock implementation for MVP.
Can be replaced with NetworkX/OSMnx routing later.
"""
from typing import List, Tuple
from sqlalchemy.orm import Session
from ..models import Shelter, Report, ReportType
from ..schemas import RouteResponse, ShelterRead
from .risk_engine import RiskEngine
import json


class RoutingEngine:
    """Computes safest evacuation routes to shelters."""

    @staticmethod
    def find_nearest_shelter(
        db: Session,
        latitude: float,
        longitude: float
    ) -> Shelter:
        """Find the nearest shelter to a given location."""
        shelters = db.query(Shelter).all()

        if not shelters:
            raise ValueError("No shelters available")

        nearest_shelter = None
        min_distance = float('inf')

        for shelter in shelters:
            distance = RiskEngine.haversine_distance(
                latitude, longitude,
                shelter.latitude, shelter.longitude
            )
            if distance < min_distance:
                min_distance = distance
                nearest_shelter = shelter

        return nearest_shelter

    @staticmethod
    def compute_route_risk(
        db: Session,
        start_lat: float,
        start_lon: float,
        end_lat: float,
        end_lon: float,
        samples: int = 10
    ) -> Tuple[float, List[str]]:
        """
        Compute risk score and explanation for a route.
        Samples points along the route to assess hazard proximity.
        """
        explanations = []
        total_risk = 0.0

        # Sample points along the route
        for i in range(samples + 1):
            t = i / samples
            sample_lat = start_lat + (end_lat - start_lat) * t
            sample_lon = start_lon + (end_lon - start_lon) * t

            location_risk = RiskEngine.compute_risk_at_location(db, sample_lat, sample_lon)
            total_risk += location_risk

        average_risk = total_risk / (samples + 1)

        # Generate explanations based on hazards
        reports = db.query(Report).filter(Report.is_resolved == 0).all()

        fire_count = 0
        blocked_road_count = 0
        smoke_count = 0

        for report in reports:
            # Check if report is near the route
            dist_to_start = RiskEngine.haversine_distance(
                report.latitude, report.longitude,
                start_lat, start_lon
            )
            dist_to_end = RiskEngine.haversine_distance(
                report.latitude, report.longitude,
                end_lat, end_lon
            )

            if report.report_type == ReportType.FIRE_SEEN and dist_to_start < 5 and dist_to_end < 5:
                fire_count += 1
            elif report.report_type == ReportType.BLOCKED_ROAD and dist_to_start < 3 and dist_to_end < 3:
                blocked_road_count += 1
            elif report.report_type == ReportType.HEAVY_SMOKE and dist_to_start < 4 and dist_to_end < 4:
                smoke_count += 1

        if fire_count > 0:
            explanations.append(f"Avoiding {fire_count} fire report(s)")
        if blocked_road_count > 0:
            explanations.append(f"Rerouted away from {blocked_road_count} blocked road(s)")
        if smoke_count > 0:
            explanations.append(f"Minimizing exposure to {smoke_count} smoke report(s)")

        if not explanations:
            explanations.append("Clear route detected")

        return min(average_risk, 1.0), explanations

    @staticmethod
    def compute_route(
        db: Session,
        start_lat: float,
        start_lon: float,
        shelter_id: int = None
    ) -> RouteResponse:
        """
        Compute a safe evacuation route to a shelter.
        Returns a mock route as GeoJSON LineString with risk analysis.
        """
        # Find destination shelter
        if shelter_id:
            shelter = db.query(Shelter).filter(Shelter.id == shelter_id).first()
            if not shelter:
                raise ValueError(f"Shelter {shelter_id} not found")
        else:
            shelter = RoutingEngine.find_nearest_shelter(db, start_lat, start_lon)

        # Compute route risk and explanations
        risk_score, explanation = RoutingEngine.compute_route_risk(
            db, start_lat, start_lon,
            shelter.latitude, shelter.longitude
        )

        # Create mock GeoJSON LineString route
        route_geojson = {
            "type": "LineString",
            "coordinates": [
                [start_lon, start_lat],
                [shelter.longitude, shelter.latitude]
            ]
        }

        return RouteResponse(
            route_geojson=route_geojson,
            risk_score=risk_score,
            explanation=explanation,
            destination_shelter=ShelterRead.from_orm(shelter)
        )
