from typing import List
from datetime import datetime
from app.schemas.event import EventSchema
from app.db import get_db

def add_travel_buffers(events: List[EventSchema]) -> List[EventSchema]:
    """
    Injects travel buffer events between back-to-back classes in different locations.
    """
    # TODO: Implement UCSC specific location logic
    pass

def calculate_transit_time(origin: str, destination: str) -> int:
    """
    Returns estimated transit time in minutes.
    """
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

def check_availability(start_time: str, end_time: str) -> bool:
    """
    Checks if there are any events overlapping with the given time range.
    Returns True if free, False if busy.
    
    Args:
        start_time: ISO 8601 string
        end_time: ISO 8601 string
    """
    db = get_db()
    if not db:
        # If DB not connected, default to free or handle error
        return True
        
    try:
        # Query for any event that overlaps
        # Overlap logic: (StartA <= EndB) and (EndA >= StartB)
        query = db.table("events").select("id").lte("start_time", end_time).gte("end_time", start_time)
        result = query.execute()
        
        # If any events found, user is not free
        if result.data and len(result.data) > 0:
            return False
        return True
    except Exception as e:
        print(f"Error checking availability: {e}")
        # Fail safe: assume busy if error? or free? Let's say busy to avoid double booking
        return False