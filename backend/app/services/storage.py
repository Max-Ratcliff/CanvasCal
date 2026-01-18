import json
import os
from typing import List, Dict
from app.schemas.event import EventSchema
from app.db import get_db
from app.services.storage_supabase import SupabaseStorage

DATA_FILE = "backend/data/events.json"

# Set to True to enable Supabase as primary storage
USE_SUPABASE = True

def load_events(user_id: str = None) -> List[EventSchema]:
    if USE_SUPABASE and get_db():
        return SupabaseStorage.load_events(user_id=user_id)
        
    if not os.path.exists(DATA_FILE):
        return []
    try:
        with open(DATA_FILE, "r") as f:
            data = json.load(f)
            return [EventSchema(**item) for item in data]
    except Exception:
        return []

def save_events(new_events: List[EventSchema], user_id: str = None):
    if USE_SUPABASE and get_db():
        SupabaseStorage.save_events(new_events, user_id=user_id)
        return

    # Fallback to JSON
    existing = load_events()
    all_events = [e.model_dump() for e in existing] + [e.model_dump() for e in new_events]
    os.makedirs(os.path.dirname(DATA_FILE), exist_ok=True)
    with open(DATA_FILE, "w") as f:
        json.dump(all_events, f, default=str, indent=4)

def update_event(event_id: str, updates: Dict) -> bool:
    if USE_SUPABASE and get_db():
        return SupabaseStorage.update_event(event_id, updates)
    # JSON update logic (simplified replacement)
    events = load_events()
    for i, e in enumerate(events):
        if e.id == event_id:
            data = e.model_dump()
            data.update(updates)
            events[i] = EventSchema(**data)
            _save_all_json(events)
            return True
    return False

def delete_event(event_id: str) -> bool:
    if USE_SUPABASE and get_db():
        return SupabaseStorage.delete_event(event_id)
    events = load_events()
    new_events = [e for e in events if e.id != event_id]
    if len(new_events) < len(events):
        _save_all_json(new_events)
        return True
    return False

def _save_all_json(events: List[EventSchema]):
    os.makedirs(os.path.dirname(DATA_FILE), exist_ok=True)
    with open(DATA_FILE, "w") as f:
        json.dump([e.model_dump() for e in events], f, default=str, indent=4)

def clear_events():
    if os.path.exists(DATA_FILE):
        os.remove(DATA_FILE)
    # Supabase clear not implemented for safety

def save_syllabus(user_id: str, course_name: str, raw_text: str, insights: Dict, pdf_url: str = None):
    if USE_SUPABASE and get_db():
        SupabaseStorage.save_syllabus(user_id, course_name, raw_text, insights, pdf_url=pdf_url)

def get_syllabi(user_id: str):
    if USE_SUPABASE and get_db():
        return SupabaseStorage.get_syllabi(user_id)
    return []