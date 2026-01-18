from fastapi import APIRouter, HTTPException
from app.schemas.response import APIResponse
from app.schemas.event import CalendarSyncRequest

router = APIRouter()

@router.get("/events", response_model=APIResponse)
async def get_calendar_events():
    """
    Returns existing events from the calendar.
    """
    # TODO: Implement actual fetch from DB or Google Calendar
    return APIResponse(success=True, message="Events fetched successfully", data=[])

@router.post("/sync", response_model=APIResponse)
async def sync_calendar(request: CalendarSyncRequest):
    """
    Finalizes the JSON and pushes all events to G-Cal.
    """
    # TODO: Implement Google Calendar sync logic
    return APIResponse(success=True, message="Not implemented", data=None)
