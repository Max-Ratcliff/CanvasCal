from google import genai
from google.genai import types
from app.core.config import settings
from app.services.campus_logic import calculate_transit_time
from datetime import datetime, timedelta
from typing import Optional
import logging

logger = logging.getLogger(__name__)

def chat_with_agent(message: str, user_id: str, history: list = None, timezone: str = "UTC"):
    """
    Sends a message to the Gemini Agent with access to tools.
    The tools are defined locally to capture the user_id.
    """
    if not settings.GEMINI_API_KEY:
        return "Gemini API Key is not configured."

    # Define tools inside to capture user_id closure
    def get_calendar_events(start_time: str, end_time: str, keyword: Optional[str] = None):
        """
        List events from the calendar between two ISO 8601 timestamps.
        Optional 'keyword' filters events where the summary contains the given text (case-insensitive).
        """
        from app.db import get_db
        db = get_db()
        try:
            query = db.table("events").select("*").eq("user_id", user_id).gte("start_time", start_time).lte("end_time", end_time)
            
            if keyword:
                query = query.ilike("summary", f"%{keyword}%")
                
            result = query.execute()
            return result.data
        except Exception as e:
            return {"error": str(e)}

    def add_calendar_event(summary: str, start_time: str, end_time: str, description: Optional[str] = None, location: Optional[str] = None, event_type: Optional[str] = None, repeat_frequency: Optional[str] = None, repeat_count: Optional[int] = None, repeat_until: Optional[str] = None):
        """
        Add a new event to the calendar. Can be a single event or a recurring series.
        """
        from app.db import get_db
        db = get_db()
        created_events = []
        
        # Apply defaults manually since Gemini API schema doesn't support them in signature
        final_event_type = event_type or "study"
        
        try:
            start_dt = datetime.fromisoformat(start_time.replace('Z', '+00:00'))
            end_dt = datetime.fromisoformat(end_time.replace('Z', '+00:00'))
            
            delta = None
            if repeat_frequency == 'daily': delta = timedelta(days=1)
            elif repeat_frequency == 'weekly': delta = timedelta(weeks=1)
                
            count = 1
            if delta:
                if repeat_until:
                    until_dt = datetime.fromisoformat(repeat_until.replace('Z', '+00:00'))
                    temp_curr, temp_count = start_dt, 0
                    while temp_curr <= until_dt:
                        temp_count += 1
                        temp_curr += delta
                    count = temp_count
                elif repeat_count: count = repeat_count
            
            for i in range(count):
                current_start = start_dt + (delta * i) if delta else start_dt
                current_end = end_dt + (delta * i) if delta else end_dt
                
                event_data = {
                    "user_id": user_id,
                    "summary": summary,
                    "start_time": current_start.isoformat(),
                    "end_time": current_end.isoformat(),
                    "description": description or "",
                    "location": location or "",
                    "event_type": final_event_type,
                    "source": "ai"
                }
                result = db.table("events").insert(event_data).execute()
                created_events.extend(result.data)
                
            # Trigger background sync to Google
            try:
                from app.services.google_calendar import get_calendar_service
                service = get_calendar_service(user_id)
                service.sync_events(created_events)
            except Exception as e:
                logger.error(f"Failed to auto-sync agent events: {e}")

            return {"status": "success", "events_created": len(created_events)}
        except Exception as e:
            return {"error": str(e)}

    def delete_calendar_event(event_id: str):
        """Delete an event by ID."""
        from app.db import get_db
        from app.services.google_calendar import get_calendar_service
        
        db = get_db()
        try:
            # 1. Fetch event to check for Google ID
            event_res = db.table("events").select("google_event_id").eq("id", event_id).eq("user_id", user_id).execute()
            if not event_res.data:
                return {"error": "Event not found or access denied"}
            
            google_event_id = event_res.data[0].get("google_event_id")
            
            # 2. Delete from Google Calendar if exists
            if google_event_id:
                try:
                    service = get_calendar_service(user_id)
                    service.delete_event(google_event_id)
                except Exception as e:
                    logger.error(f"Failed to delete from Google Calendar: {e}")

            # 3. Delete from DB
            result = db.table("events").delete().eq("id", event_id).eq("user_id", user_id).execute()
            return {"status": "success", "deleted_count": len(result.data), "google_deleted": bool(google_event_id)}
        except Exception as e:
            return {"error": str(e)}

    def update_calendar_event(event_id: str, summary: Optional[str] = None, start_time: Optional[str] = None, end_time: Optional[str] = None, description: Optional[str] = None, location: Optional[str] = None):
        """
        Update an existing event. Only provided fields will be updated.
        """
        from app.db import get_db
        from app.services.google_calendar import get_calendar_service
        db = get_db()
        try:
            # 1. Prepare Update Data
            update_data = {}
            if summary: update_data["summary"] = summary
            if start_time: update_data["start_time"] = start_time
            if end_time: update_data["end_time"] = end_time
            if description: update_data["description"] = description
            if location: update_data["location"] = location
            
            if not update_data:
                return {"error": "No fields provided to update"}

            # 2. Update DB
            result = db.table("events").update(update_data).eq("id", event_id).eq("user_id", user_id).execute()
            if not result.data:
                return {"error": "Event not found or update failed"}
            
            updated_event = result.data[0]

            # 3. Sync to Google
            try:
                service = get_calendar_service(user_id)
                service.sync_events([updated_event])
            except Exception as e:
                logger.error(f"Failed to sync updated event: {e}")

            return {"status": "success", "event": updated_event}
        except Exception as e:
            return {"error": str(e)}

    def check_calendar_availability(start_time: str, end_time: str):
        """Check if the user is free between the given times."""
        from app.db import get_db
        db = get_db()
        try:
            query = db.table("events").select("id").eq("user_id", user_id).lte("start_time", end_time).gte("end_time", start_time)
            data = query.execute().data
            return {"available": len(data) == 0, "conflicting_events": len(data)}
        except Exception as e:
            return {"error": str(e)}

    def get_transit_time(origin: str, destination: str):
        """Calculate transit time between two locations in minutes."""
        return {"minutes": calculate_transit_time(origin, destination)}

    agent_tools = [
        get_calendar_events,
        add_calendar_event,
        delete_calendar_event,
        update_calendar_event,
        check_calendar_availability,
        get_transit_time
    ]

    try:
        # CONTEXT INJECTION: Fetch upcoming 7 days of events
        from app.db import get_db
        db = get_db()
        
        ctx_start = datetime.now()
        ctx_end = ctx_start + timedelta(days=7)
        
        try:
            ctx_res = db.table("events").select("id, summary, start_time, end_time, event_type") \
                .eq("user_id", user_id) \
                .gte("start_time", ctx_start.isoformat()) \
                .lte("end_time", ctx_end.isoformat()) \
                .execute()
            
            upcoming_events_text = "No upcoming events found."
            if ctx_res.data:
                lines = []
                for e in ctx_res.data:
                    # Include ID so agent can act immediately
                    try:
                        s = datetime.fromisoformat(e['start_time'].replace('Z', '+00:00'))
                        day_str = s.strftime('%A, %b %d @ %I:%M %p')
                        lines.append(f"- [{e['id']}] {day_str}: {e['summary']} ({e['event_type']})")
                    except:
                        continue
                upcoming_events_text = "\n".join(lines)
        except Exception as e:
            upcoming_events_text = f"Error loading context: {e}"

        client = genai.Client(api_key=settings.GEMINI_API_KEY)
        current_date = datetime.now()
        system_instruction = f"""
        You are an intelligent Academic Calendar Assistant.
        Current Date: {current_date.strftime('%A, %Y-%m-%d')}
        Current Year: {current_date.year}
        User ID: {user_id}
        User Timezone: {timezone}
        
        === YOUR CONTEXT (Next 7 Days) ===
        {upcoming_events_text}
        ==================================
        
        Your Goal: Help the user manage their schedule. Be fast, concise, and smart.
        1. YOU HAVE IDS: The IDs in brackets [like-this] are the database IDs. If the user asks to delete/update an event listed above, use that ID directly.
        2. INFER information. Calculate relative dates like 'next Tuesday'.
        3. Use tools to check availability before adding events if appropriate.
        4. TIMEZONE: The user is in {timezone}. When calling tools, generate ISO 8601 timestamps with the correct offset for this timezone.
        5. DELETING/UPDATING: If the event isn't in the context above, use `get_calendar_events` with the `keyword` to find it first.
        """

        # Construct full conversation history
        contents = []
        if history:
            for turn in history:
                # Ensure parts is a list of strings for now (simple text history)
                # If complex parts come in, we might need better parsing
                raw_parts = turn.get("parts", [])
                parts_list = []
                
                if isinstance(raw_parts, str):
                    parts_list.append(types.Part(text=raw_parts))
                elif isinstance(raw_parts, list):
                    for p in raw_parts:
                        # p could be a dict like {'text': '...'} or just a string if simplified
                        if isinstance(p, dict) and 'text' in p:
                            parts_list.append(types.Part(text=p['text']))
                        elif isinstance(p, str):
                            parts_list.append(types.Part(text=p))
                
                if parts_list:
                    contents.append(types.Content(
                        role=turn.get("role", "user"),
                        parts=parts_list
                    ))
        
        # Add current user message
        contents.append(types.Content(
            role="user",
            parts=[types.Part(text=message)]
        ))
        
        response = client.models.generate_content(
            model='gemini-2.0-flash',
            contents=contents,
            config=types.GenerateContentConfig(
                tools=agent_tools,
                system_instruction=system_instruction,
                automatic_function_calling=types.AutomaticFunctionCallingConfig(disable=False)
            )
        )
        return response.text
    except Exception as e:
        logger.error(f"Agent Error: {e}")
        return f"I encountered an error: {str(e)}"