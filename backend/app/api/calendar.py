from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
from datetime import datetime
from app.schemas.response import APIResponse
from app.schemas.event import EventSchema
from app.db import get_db, Client

router = APIRouter()

@router.get("/events", response_model=APIResponse)
async def list_events(start: Optional[datetime] = None, end: Optional[datetime] = None):
    """
    Returns existing events from Supabase.
    """
    db = get_db()
    try:
        query = db.table("events").select("*")
        
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
async def add_event(event: EventSchema):
    """
    Adds a new event to Supabase.
    """
    db = get_db()
    try:
        # Convert schema to dict, exclude None to let DB defaults work if any
        event_data = event.model_dump(mode='json')
        result = db.table("events").insert(event_data).execute()
        return APIResponse(success=True, message="Event created successfully", data=result.data)
    except Exception as e:
        print(f"Error creating event: {e}")
        return APIResponse(success=False, message=str(e), data=None)

@router.delete("/events/{event_id}", response_model=APIResponse)
async def delete_event(event_id: str):
    """
    Deletes an event from Supabase.
    """
    db = get_db()
    try:
        result = db.table("events").delete().eq("id", event_id).execute()
        return APIResponse(success=True, message="Event deleted successfully", data=result.data)
    except Exception as e:
        print(f"Error deleting event: {e}")
        return APIResponse(success=False, message=str(e), data=None)
