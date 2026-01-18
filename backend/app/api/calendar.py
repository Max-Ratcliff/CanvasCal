from fastapi import APIRouter, HTTPException, Body
from typing import List, Optional
from app.schemas.response import APIResponse
from app.schemas.event import EventSchema, CalendarSyncRequest
from app.services.calendar_ops import CalendarService

router = APIRouter()

@router.get("/events", response_model=APIResponse[List[EventSchema]])
async def get_calendar_events():
    """
    Returns existing events from the calendar (local storage).
    """
    events = CalendarService.get_all_events()
    return APIResponse(success=True, message="Events fetched successfully", data=events)

@router.post("/events", response_model=APIResponse[EventSchema])
async def create_event(event: EventSchema):
    """
    Manually create a calendar event.
    """
    created = CalendarService.create_event(event)
    return APIResponse(success=True, message="Event created", data=created)

@router.put("/events/{event_id}", response_model=APIResponse[EventSchema])
async def update_event(event_id: str, updates: dict = Body(...)):
    """
    Update an existing event.
    """
    updated = CalendarService.update_event(event_id, updates)
    if not updated:
        raise HTTPException(status_code=404, detail="Event not found")
    return APIResponse(success=True, message="Event updated", data=updated)

@router.delete("/events/{event_id}", response_model=APIResponse[bool])
async def delete_event(event_id: str):
    """
    Delete an event.
    """
    success = CalendarService.delete_event(event_id)
    if not success:
        raise HTTPException(status_code=404, detail="Event not found")
    return APIResponse(success=True, message="Event deleted", data=True)

@router.post("/events/auto-schedule", response_model=APIResponse[EventSchema])
async def auto_schedule_study(assignment_id: str = Body(..., embed=True), duration: int = Body(60, embed=True)):
    """
    AI Power: Finds a slot and schedules a study session for an assignment.
    """
    new_event = CalendarService.auto_schedule_study_session(assignment_id, duration)
    if not new_event:
        raise HTTPException(status_code=400, detail="Could not find a valid slot or assignment not found")
    
    return APIResponse(success=True, message="Study session scheduled automatically", data=new_event)

from app.services.google_calendar import GoogleCalendarService

# ... imports ...

@router.post("/sync", response_model=APIResponse)
async def sync_calendar(request: CalendarSyncRequest):
    """
    Finalizes the JSON and pushes all events to G-Cal.
    """
    try:
        # 1. Load local events
        local_events = CalendarService.get_all_events()
        
        if not local_events:
            return APIResponse(success=True, message="No events to sync", data=None)

        # 2. Initialize Google Service
        g_service = GoogleCalendarService(token=request.google_token)
        
        # 3. Sync
        updated_events = g_service.sync_events(local_events)
        
        # 4. Save back to local (to persist Google IDs)
        CalendarService.bulk_update_events(updated_events)
        
        return APIResponse(success=True, message=f"Synced {len(updated_events)} events to Google Calendar", data=None)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))