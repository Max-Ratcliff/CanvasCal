from typing import List, Optional, Dict
from app.db import get_service_db
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
    def load_events(user_id: str = None) -> List[EventSchema]:
        supabase = get_service_db()
        if not supabase:
            return []
        
        try:
            query = supabase.table("events").select("*")
            if user_id:
                query = query.eq("user_id", user_id)
            
            response = query.execute()
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
        supabase = get_service_db()
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
        supabase = get_service_db()
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
        supabase = get_service_db()
        if not supabase:
            return False
        try:
            supabase.table("events").delete().eq("id", event_id).execute()
            return True
        except Exception as e:
            logger.error(f"Error deleting event {event_id}: {e}")
            return False

    @staticmethod
    def save_syllabus(user_id: str, course_name: str, raw_text: str, insights: Dict, pdf_url: str = None):
        supabase = get_service_db()
        if not supabase: return
        try:
            data = {
                "user_id": user_id,
                "course_name": course_name,
                "raw_text": raw_text,
                "ai_insights": insights,
                "updated_at": "now()"
            }
            if pdf_url:
                data["pdf_url"] = pdf_url
            # Use upsert on composite key (user_id, course_name)
            supabase.table("syllabi").upsert(data, on_conflict="user_id,course_name").execute()
        except Exception as e:
            logger.error(f"Error saving syllabus: {e}")

    @staticmethod
    def upload_syllabus_pdf(user_id: str, course_name: str, pdf_content: bytes) -> Optional[str]:
        """
        Uploads a PDF to Supabase Storage bucket 'syllabi'.
        Returns the public URL.
        """
        supabase = get_service_db()
        if not supabase: return None
        
        try:
            from app.core.config import settings
            # Ensure safe filename
            safe_name = "".join(c for c in course_name if c.isalnum() or c in (' ', '-', '_')).strip()
            file_path = f"{user_id}/{safe_name}.pdf"
            
            # Upload (using service role typically needed for storage)
            # Try to create bucket if not exists (might fail if not admin, but usually handled in UI)
            try:
                supabase.storage.create_bucket('syllabi', options={"public": True})
            except:
                pass

            supabase.storage.from_('syllabi').upload(
                path=file_path,
                file=pdf_content,
                file_options={"content-type": "application/pdf", "upsert": "true"}
            )
            
            # Get Public URL
            res = supabase.storage.from_('syllabi').get_public_url(file_path)
            return res
        except Exception as e:
            logger.error(f"Error uploading PDF to storage: {e}")
            return None

    @staticmethod
    def get_syllabi(user_id: str):
        supabase = get_service_db()
        if not supabase: return []
        try:
            res = supabase.table("syllabi").select("*").eq("user_id", user_id).execute()
            return res.data
        except Exception as e:
            logger.error(f"Error fetching syllabi: {e}")
            return []
