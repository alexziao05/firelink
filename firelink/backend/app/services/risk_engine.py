"""
Risk engine for computing evacuation risk scores and risk grids.
"""
from typing import List, Tuple
from sqlalchemy.orm import Session
from ..models import Report, ReportType
import math


class RiskEngine:
    """Computes risk scores for locations based on nearby hazards."""
    
    # Risk parameters
    FIRE_RADIUS_KM = 2.0  # Fire affects area within 2km
    BLOCKED_ROAD_RADIUS_KM = 1.5  # Blocked roads affect 1.5km radius
    SMOKE_RADIUS_KM = 1.0  # Smoke affects 1km radius
    
    # Risk weights (0-1 scale)
    FIRE_RISK_WEIGHT = 1.0
    BLOCKED_ROAD_RISK_WEIGHT = 0.8
    SMOKE_RISK_WEIGHT = 0.5
    
    @staticmethod
    def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """
        Calculate distance between two points in kilometers using Haversine formula.
        """
        R = 6371  # Earth radius in km
        lat1_rad = math.radians(lat1)
        lat2_rad = math.radians(lat2)
        delta_lat = math.radians(lat2 - lat1)
        delta_lon = math.radians(lon2 - lon1)
        
        a = (math.sin(delta_lat / 2) ** 2 +
             math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(delta_lon / 2) ** 2)
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        distance = R * c
        
        return distance
    
    @staticmethod
    def compute_risk_at_location(
        db: Session,
        latitude: float,
        longitude: float
    ) -> float:
        """
        Compute risk score at a given location (0-1 scale).
        Considers proximity to fires, blocked roads, and smoke reports.
        """
        risk_score = 0.0
        
        # Get all active reports
        reports = db.query(Report).filter(Report.is_resolved == 0).all()
        
        for report in reports:
            distance = RiskEngine.haversine_distance(
                latitude, longitude,
                report.latitude, report.longitude
            )
            
            if report.report_type == ReportType.FIRE_SEEN:
                if distance <= RiskEngine.FIRE_RADIUS_KM:
                    # Risk decreases with distance
                    proximity_factor = 1.0 - (distance / RiskEngine.FIRE_RADIUS_KM)
                    risk_score += proximity_factor * RiskEngine.FIRE_RISK_WEIGHT
            
            elif report.report_type == ReportType.BLOCKED_ROAD:
                if distance <= RiskEngine.BLOCKED_ROAD_RADIUS_KM:
                    proximity_factor = 1.0 - (distance / RiskEngine.BLOCKED_ROAD_RADIUS_KM)
                    risk_score += proximity_factor * RiskEngine.BLOCKED_ROAD_RISK_WEIGHT
            
            elif report.report_type == ReportType.HEAVY_SMOKE:
                if distance <= RiskEngine.SMOKE_RADIUS_KM:
                    proximity_factor = 1.0 - (distance / RiskEngine.SMOKE_RADIUS_KM)
                    risk_score += proximity_factor * RiskEngine.SMOKE_RISK_WEIGHT
        
        # Cap risk score at 1.0
        return min(risk_score, 1.0)
    
    @staticmethod
    def compute_risk_grid(
        db: Session,
        min_lat: float,
        max_lat: float,
        min_lon: float,
        max_lon: float,
        grid_step: float = 0.01  # ~1km at equator
    ) -> List[Tuple[float, float, float]]:
        """
        Compute a risk grid for visualization.
        Returns list of (latitude, longitude, risk_score).
        """
        risk_cells = []
        
        lat = min_lat
        while lat <= max_lat:
            lon = min_lon
            while lon <= max_lon:
                risk = RiskEngine.compute_risk_at_location(db, lat, lon)
                if risk > 0:  # Only include cells with risk > 0
                    risk_cells.append((lat, lon, risk))
                lon += grid_step
            lat += grid_step
        
        return risk_cells
