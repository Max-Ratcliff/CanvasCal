from typing import List, Optional, Dict
from app.db import get_db
from app.schemas.event import EventSchema
import logging

logger = logging.getLogger("SupabaseStorage")

def get_color_for_course(course_id: str) -> str:
    """
    Returns a deterministic color for a given course ID.
    """
    if not course_id:
        return "#F4B400" # Default Yellow
    colors = ["#3B82F6", "#10B981", "#8B5CF6", "#F59E0B", "#EC4899", "#6366F1"]
    index = sum(ord(c) for c in str(course_id)) % len(colors)
    return colors[index]

class SupabaseStorage:
    @staticmethod
    def load_events() -> List[EventSchema]:
        supabase = get_db()
        if not supabase:
            return []
        
        try:
            response = supabase.table("events").select("*").execute()
            # Convert DB rows to EventSchema objects
            return [EventSchema(**item) for item in response.data]
        except Exception as e:
            logger.error(f"Error loading events from Supabase: {e}")
            return []

    @staticmethod
    def save_events(new_events: List[EventSchema], user_id: str = None):
        """
        Inserts multiple events into the DB.
        """
        supabase = get_db()
        if not supabase or not new_events:
            return

        try:
            # Convert models to dicts and add colors
            data_to_insert = []
            for e in new_events:
                d = e.model_dump(mode='json')
                if user_id:
                    d['user_id'] = user_id
                if d.get('course_id') and not d.get('color_hex'):
                    d['color_hex'] = get_color_for_course(d['course_id'])
                data_to_insert.append(d)

            supabase.table("events").insert(data_to_insert).execute()
        except Exception as e:
            logger.error(f"Error saving events to Supabase: {e}")

    @staticmethod
    def update_event(event_id: str, updates: Dict) -> bool:
        supabase = get_db()
        if not supabase:
            return False
        try:
            supabase.table("events").update(updates).eq("id", event_id).execute()
            return True
        except Exception as e:
            logger.error(f"Error updating event {event_id}: {e}")
            return False

    @staticmethod
    def delete_event(event_id: str) -> bool:
        supabase = get_db()
        if not supabase:
            return False
        try:
            supabase.table("events").delete().eq("id", event_id).execute()
            return True
        except Exception as e:
            logger.error(f"Error deleting event {event_id}: {e}")
            return False
