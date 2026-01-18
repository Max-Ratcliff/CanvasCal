from pydantic import BaseModel, Field
from typing import Optional, List, Literal
from datetime import datetime
import uuid

class EventSchema(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), description="Unique local ID")
    google_event_id: Optional[str] = Field(None, description="ID of the synced Google Calendar event")
    summary: str = Field(..., description="Title of the event")
    description: Optional[str] = Field(None, description="Detailed description")
    start_time: datetime = Field(..., description="Start time in ISO format")
    end_time: datetime = Field(..., description="End time in ISO format")
    location: Optional[str] = Field(None, description="Physical location or URL")
    event_type: Literal["class", "assignment", "exam", "study", "travel"] = Field(..., description="Category of the event")
    weight: Optional[float] = Field(None, description="Weight of the assignment/exam if applicable")

class CalendarSyncRequest(BaseModel):
    events: List[EventSchema]
    google_token: str
