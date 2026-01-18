from fastapi import APIRouter, HTTPException
from app.schemas.response import APIResponse
from app.schemas.event import CalendarSyncRequest
from app.services import storage

router = APIRouter()

@router.get("/events", response_model=APIResponse)
async def get_calendar_events():
    """
    Returns existing events from the calendar (local storage).
    """
    events = storage.load_events()
    return APIResponse(success=True, message="Events fetched successfully", data=events)

@router.post("/sync", response_model=APIResponse)
async def sync_calendar(request: CalendarSyncRequest):
    """
    Finalizes the JSON and pushes all events to G-Cal.
    """
    # TODO: Implement Google Calendar sync logic
    return APIResponse(success=True, message="Not implemented", data=None)
