from typing import List
from datetime import datetime, timedelta
from app.schemas.event import EventSchema
from app.db import get_db

def calculate_transit_time(origin: str, destination: str) -> int:
    """
    Returns estimated transit time in minutes.
    In a real app, this would use Google Maps API.
    """
    # Simple logic for demo purposes
    if not origin or not destination:
        return 0
        
    origin = origin.lower()
    destination = destination.lower()
    
    if origin == destination:
        return 0
        
    # Example UCSC locations
    if "science hill" in origin and "oakes" in destination:
        return 20
    if "kresge" in origin and "cowell" in destination:
        return 15
        
    # Default buffer for unknown locations
    return 10

def check_availability(start_time: datetime, end_time: datetime) -> bool:
    """
    Checks if there are any events overlapping with the given time range.
    Returns True if free, False if busy.
    """
    db = get_db()
    try:
        # Query for any event that overlaps
        # (StartA <= EndB) and (EndA >= StartB)
        query = db.table("events").select("id").lte("start_time", end_time.isoformat()).gte("end_time", start_time.isoformat())
        result = query.execute()
        
        # If any events found, user is not free
        if result.data and len(result.data) > 0:
            return False
        return True
    except Exception as e:
        print(f"Error checking availability: {e}")
        # Fail safe: assume busy if error, or free? strict = busy
        return False
