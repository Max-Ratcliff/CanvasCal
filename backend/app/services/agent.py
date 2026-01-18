import google.generativeai as genai
from google.generativeai.types import FunctionDeclaration, Tool
from app.core.config import settings
from app.api.calendar import list_events, add_event, delete_event
from app.services.campus_logic import calculate_transit_time, check_availability
from app.schemas.event import EventSchema
from datetime import datetime
import json
import logging

logger = logging.getLogger(__name__)

# Configure Gemini
if settings.GEMINI_API_KEY:
    genai.configure(api_key=settings.GEMINI_API_KEY)

# Tool Wrappers for Gemini
# These functions must have clear docstrings for the model to understand them.

def get_calendar_events(start_time: str, end_time: str):
    """
    List events from the calendar between two ISO 8601 timestamps.
    Args:
        start_time: Start time string (ISO 8601)
        end_time: End time string (ISO 8601)
    """
    # We call the async function synchronously for the tool (limitation of some SDKs, 
    # but Gemini python SDK handles async tools if passed correctly. 
    # For simplicity in this service, we might need to handle async execution carefully.
    # However, standard python functions are easiest for the Tools API.
    # We will use a helper to run async code if needed, or better, 
    # utilize the fact that we are in FastAPI and can await the result if we structure it right.
    #
    # Actually, the Gemini SDK 'tools' argument expects synchronous functions mostly. 
    # We'll return a description of what to do, or try to run the DB query synchronously (not ideal for asyncpg/supabase).
    # A better pattern for this agent is: Model returns "Function Call" -> We execute it -> We feed result back.
    # But to use 'automatic' function calling, we provide the functions.
    # Let's try to wrap them.
    
    # NOTE: Since our DB access is async, and the genai SDK might block, 
    # we might need to separate "planning" (AI) from "execution" (DB).
    # But for this iteration, let's assume we can run them. 
    # If Supabase client is sync (which the `supabase` python client IS by default), we are good!
    # The `supabase` package is synchronous. `gotrue` etc are sync.
    
    # We'll reimplement the logic here using the DB client directly if the API functions are async.
    # Looking at `app/api/calendar.py`, they are `async def`. 
    # The `supabase` client itself is synchronous under the hood usually, unless using the async variant.
    # The code I wrote in `app/db.py` uses standard `create_client` which returns a sync client.
    # So I can just call the synchronous DB methods directly here.
    
    from app.db import get_db
    db = get_db()
    try:
        query = db.table("events").select("*").gte("start_time", start_time).lte("end_time", end_time)
        result = query.execute()
        return result.data
    except Exception as e:
        return {"error": str(e)}

def add_calendar_event(summary: str, start_time: str, end_time: str, description: str = "", location: str = "", event_type: str = "study", repeat_frequency: str = None, repeat_count: int = None, repeat_until: str = None):
    """
    Add a new event to the calendar. Can be a single event or a recurring series.
    Args:
        summary: Title of the event
        start_time: Start time (ISO 8601)
        end_time: End time (ISO 8601)
        description: Optional details
        location: Optional location
        event_type: Category (class, assignment, exam, study, travel)
        repeat_frequency: Optional. One of ['daily', 'weekly'].
        repeat_count: Optional. Number of times to repeat.
        repeat_until: Optional. ISO 8601 date string to repeat until (inclusive). Overrides repeat_count.
    """
    from app.db import get_db
    from datetime import datetime, timedelta
    
    db = get_db()
    created_events = []
    
    try:
        # Parse times
        # Handle simple ISO formats
        start_dt = datetime.fromisoformat(start_time.replace('Z', '+00:00'))
        end_dt = datetime.fromisoformat(end_time.replace('Z', '+00:00'))
        
        # Determine delta
        delta = None
        if repeat_frequency == 'daily':
            delta = timedelta(days=1)
        elif repeat_frequency == 'weekly':
            delta = timedelta(weeks=1)
            
        # Determine count
        count = 1
        if delta:
            if repeat_until:
                until_dt = datetime.fromisoformat(repeat_until.replace('Z', '+00:00'))
                # Calculate weeks/days between start and until
                # simple loop to find count is safer than math for mixed types
                temp_curr = start_dt
                temp_count = 0
                while temp_curr <= until_dt:
                    temp_count += 1
                    temp_curr += delta
                count = temp_count
            elif repeat_count:
                count = repeat_count
            else:
                count = 1 # Default to 1 if frequency set but no limit
        
        for i in range(count):
            current_start = start_dt + (delta * i) if delta else start_dt
            current_end = end_dt + (delta * i) if delta else end_dt
            
            event_data = {
                "summary": summary,
                "start_time": current_start.isoformat(),
                "end_time": current_end.isoformat(),
                "description": description,
                "location": location,
                "event_type": event_type
            }
            result = db.table("events").insert(event_data).execute()
            created_events.extend(result.data)
            
        return {"status": "success", "events_created": len(created_events), "first_event": created_events[0] if created_events else None}
    except Exception as e:
        return {"error": str(e)}

def delete_calendar_event(event_id: str):
    """
    Delete an event by ID.
    Args:
        event_id: The UUID of the event to remove.
    """
    from app.db import get_db
    db = get_db()
    try:
        result = db.table("events").delete().eq("id", event_id).execute()
        return {"status": "success", "deleted": result.data}
    except Exception as e:
        return {"error": str(e)}

def check_calendar_availability(start_time: str, end_time: str):
    """
    Check if the user is free between the given times. Returns True (Free) or False (Busy).
    Args:
        start_time: Start time (ISO 8601)
        end_time: End time (ISO 8601)
    """
    from app.db import get_db
    db = get_db()
    try:
        query = db.table("events").select("id").lte("start_time", end_time).gte("end_time", start_time)
        data = query.execute().data
        is_free = len(data) == 0
        return {"available": is_free, "conflicting_events": len(data)}
    except Exception as e:
        return {"error": str(e)}

def get_transit_time(origin: str, destination: str):
    """
    Calculate transit time between two locations in minutes.
    """
    return {"minutes": calculate_transit_time(origin, destination)}


# List of tools to provide to Gemini
agent_tools = [
    get_calendar_events,
    add_calendar_event,
    delete_calendar_event,
    check_calendar_availability,
    get_transit_time
]

def chat_with_agent(message: str, history: list = None):
    """
    Sends a message to the Gemini Agent with access to tools.
    """
    try:
        current_date = datetime.now()
        system_instruction = f"""
        You are an intelligent Academic Calendar Assistant.
        Current Date: {current_date.strftime('%A, %Y-%m-%d')}
        Current Year: {current_date.year}
        
        Your Goal:
        Help the user manage their schedule. Be fast, concise, and smart.
        
        Rules:
        1. INFER information whenever possible. Do not ask for the year if it's 2026. Do not ask for the date if the user says "Tuesday" (calculate the next Tuesday).
        2. If the user gives a range ("until end of Feb"), calculate the `repeat_until` date and use it.
        3. For "classes", assume they are weekly unless specified otherwise.
        4. When the user asks to add an event, just do it. Don't confirm every little detail unless it's critical.
        5. If the user provides a time range "2pm-3pm", parse it to ISO format for the tool.
        
        Do not be annoying. Be helpful and action-oriented.
        """
        
        model = genai.GenerativeModel(
            model_name='gemini-2.0-flash',
            tools=agent_tools,
            system_instruction=system_instruction
        )
        
        # Start a chat session (stateless for now, or passing history if we had it structure right)
        # For simplicity, we just send the message with automatic function calling enabled.
        chat = model.start_chat(enable_automatic_function_calling=True)
        
        # If history exists, we could preload it, but let's keep it simple for MVP
        
        response = chat.send_message(message)
        return response.text
    except Exception as e:
        logger.error(f"Agent Error: {e}")
        return f"I encountered an error: {str(e)}"
