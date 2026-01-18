import json
import os
from typing import List
from app.schemas.event import EventSchema

DATA_FILE = "backend/data/events.json"

def load_events() -> List[EventSchema]:
    if not os.path.exists(DATA_FILE):
        return []
    try:
        with open(DATA_FILE, "r") as f:
            data = json.load(f)
            # Handle potential schema changes gracefully by allowing extra fields
            return [EventSchema(**item) for item in data]
    except Exception:
        return []

def get_color_for_course(course_id: str) -> str:
    """
    Returns a deterministic color for a given course ID.
    Blue (CSE), Green (Math), Purple (History), Orange (Other)
    """
    if not course_id:
        return "#F4B400" # Default Yellow
        
    # Simple consistent hashing
    colors = [
        "#3B82F6", # Blue
        "#10B981", # Green
        "#8B5CF6", # Purple
        "#F59E0B", # Orange
        "#EC4899", # Pink
        "#6366F1", # Indigo
    ]
    
    # Use a simple hash of the string to pick a color
    index = sum(ord(c) for c in str(course_id)) % len(colors)
    return colors[index]

def save_events(new_events: List[EventSchema]):
    existing = load_events()
    
    # Enrichment: Ensure every new event has a color if it has a course_id
    for e in new_events:
        if e.course_id and not e.color_hex:
            e.color_hex = get_color_for_course(e.course_id)
            
    # Merge events (simple append for now, could dedup later)
    # Convert to dict for JSON serialization
    all_events = [e.model_dump() for e in existing] + [e.model_dump() for e in new_events]
    
    save_events_replace([EventSchema(**e) for e in all_events])

def save_events_replace(events: List[EventSchema]):
    """
    Overwrites the JSON file with the provided list of events.
    """
    # Ensure the directory exists
    os.makedirs(os.path.dirname(DATA_FILE), exist_ok=True)
    
    # Enrichment for replacements too
    for e in events:
        if e.course_id and not e.color_hex:
            e.color_hex = get_color_for_course(e.course_id)

    # Convert to dict for JSON serialization
    data = [e.model_dump() for e in events]
    
    with open(DATA_FILE, "w") as f:
        json.dump(data, f, default=str, indent=4)

def clear_events():
    if os.path.exists(DATA_FILE):
        os.remove(DATA_FILE)