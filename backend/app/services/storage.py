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
            return [EventSchema(**item) for item in data]
    except Exception:
        return []

def save_events(new_events: List[EventSchema]):
    existing = load_events()
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
    
    # Convert to dict for JSON serialization
    data = [e.model_dump() for e in events]
    
    with open(DATA_FILE, "w") as f:
        json.dump(data, f, default=str, indent=4)

def clear_events():
    if os.path.exists(DATA_FILE):
        os.remove(DATA_FILE)
