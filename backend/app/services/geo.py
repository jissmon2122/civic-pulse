import math
from typing import Dict, List, Tuple


def haversine_distance_meters(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculates the great-circle distance between two geographic coordinates
    on Earth in meters using the Haversine formula.
    """
    R = 6371000.0  # Earth's radius in meters
    
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)
    
    a = (math.sin(delta_phi / 2.0) ** 2 +
         math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2)
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    
    return R * c


def anonymize_coordinates(lat: float, lon: float, precision_decimals: int = 3) -> Tuple[float, float]:
    """
    Rounds latitude and longitude to a coarser precision (approx. 110 meters)
    to protect citizen privacy on public feeds.
    """
    return round(lat, precision_decimals), round(lon, precision_decimals)


def compute_geospatial_hotspots(
    reports: List[Dict[str, float]], 
    grid_size_degrees: float = 0.005
) -> List[Dict]:
    """
    Aggregates reports into geospatial grid clusters to detect civic issue hotspots.
    Each cluster returns centroid coordinates, count, and severity summary.
    """
    grid: Dict[Tuple[int, int], List[Dict]] = {}
    
    for r in reports:
        lat = r["latitude"]
        lon = r["longitude"]
        cell_x = int(math.floor(lat / grid_size_degrees))
        cell_y = int(math.floor(lon / grid_size_degrees))
        key = (cell_x, cell_y)
        if key not in grid:
            grid[key] = []
        grid[key].append(r)
        
    hotspots = []
    for (cx, cy), items in grid.items():
        count = len(items)
        if count >= 1:
            avg_lat = sum(it["latitude"] for it in items) / count
            avg_lon = sum(it["longitude"] for it in items) / count
            avg_priority = sum(it.get("priority_score", 10.0) for it in items) / count
            hotspots.append({
                "center_lat": round(avg_lat, 5),
                "center_lon": round(avg_lon, 5),
                "count": count,
                "avg_priority": round(avg_priority, 1),
                "sample_report_ids": [it.get("id") for it in items[:5]]
            })
            
    hotspots.sort(key=lambda h: (h["count"], h["avg_priority"]), reverse=True)
    return hotspots
