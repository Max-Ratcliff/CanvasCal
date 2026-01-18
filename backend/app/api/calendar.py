from fastapi import APIRouter, HTTPException, Depends, Body
from typing import List, Optional
from datetime import datetime
from app.schemas.response import APIResponse
from app.schemas.event import EventSchema
from app.db import get_db
from app.services.google_calendar import get_calendar_service
from app.core.security import get_current_user
from pydantic import BaseModel

router = APIRouter()

@router.post("/sync", response_model=APIResponse)
async def sync_to_google(user = Depends(get_current_user)):
    """
    Pushes all unsynced events for the authenticated user to Google Calendar.
    """
    db = get_db()
    try:
        # 1. Fetch unsynced events for this user
        result = db.table("events") \
            .select("*") \
            .eq("user_id", user.id) \
            .is_("google_event_id", "null") \
            .execute()
        
        events = result.data
        if not events:
            return APIResponse(success=True, message="No new events to sync", data={"synced": 0})

        # 2. Trigger Sync Service
        service = get_calendar_service(user.id)
        count = service.sync_events(events)

        return APIResponse(success=True, message=f"Successfully synced {count} events", data={"synced": count})
    except Exception as e:
        return APIResponse(success=False, message=str(e), data=None)

@router.get("/events", response_model=APIResponse)
async def list_events(
    start: Optional[datetime] = None, 
    end: Optional[datetime] = None,
    user = Depends(get_current_user)
):
    """
    Returns existing events from Supabase for the authenticated user.
    """
    db = get_db()
    if not db:
        return APIResponse(success=False, message="Database not connected", data=[])
    try:
        query = db.table("events").select("*").eq("user_id", user.id)
        
        if start:
            query = query.gte("start_time", start.isoformat())
        if end:
            query = query.lte("end_time", end.isoformat())
            
        result = query.execute()
        events = result.data
        return APIResponse(success=True, message="Events fetched successfully", data=events)
    except Exception as e:
        print(f"Error fetching events: {e}")
        return APIResponse(success=False, message=str(e), data=[])

@router.post("/events", response_model=APIResponse)
async def add_event(event: EventSchema, user = Depends(get_current_user)):
    """
    Adds a new event to Supabase for the authenticated user.
    """
    db = get_db()
    if not db:
        return APIResponse(success=False, message="Database not connected", data=None)
    try:
        # Convert schema to dict, exclude None to let DB defaults work if any
        event_data = event.model_dump(mode='json')
        # Inject user_id
        event_data["user_id"] = user.id
        
        result = db.table("events").insert(event_data).execute()
        return APIResponse(success=True, message="Event created successfully", data=result.data)
    except Exception as e:
        print(f"Error creating event: {e}")
        return APIResponse(success=False, message=str(e), data=None)

@router.delete("/events/{event_id}", response_model=APIResponse)
async def delete_event(event_id: str, user = Depends(get_current_user)):
    """
    Deletes an event from Supabase (ensuring it belongs to the user).
    """
    db = get_db()
    if not db:
        return APIResponse(success=False, message="Database not connected", data=None)
    try:
        result = db.table("events") \
            .delete() \
            .eq("id", event_id) \
            .eq("user_id", user.id) \
            .execute()
        return APIResponse(success=True, message="Event deleted successfully", data=result.data)
    except Exception as e:
        print(f"Error deleting event: {e}")
        return APIResponse(success=False, message=str(e), data=None)
