from typing import List, Optional, Dict
from datetime import datetime, timedelta
import uuid
from app.schemas.event import EventSchema
from app.services import storage

class CalendarService:
    """
    Service layer for calendar operations (CRUD + Smart Scheduling).
    """

    @staticmethod
    def get_all_events() -> List[EventSchema]:
        return storage.load_events()

    @staticmethod
    def get_event_by_id(event_id: str) -> Optional[EventSchema]:
        events = storage.load_events()
        for event in events:
            if event.id == event_id:
                return event
        return None

    @staticmethod
    def create_event(event_data: EventSchema) -> EventSchema:
        """
        Adds a new event to the calendar.
        """
        # Ensure it has an ID
        if not event_data.id:
            event_data.id = str(uuid.uuid4())
            
        events = storage.load_events()
        events.append(event_data)
        storage.save_events_replace(events) # We need a replace method in storage, or careful usage of save_events
        return event_data

    @staticmethod
    def update_event(event_id: str, updates: Dict) -> Optional[EventSchema]:
        """
        Updates an existing event.
        """
        events = storage.load_events()
        updated_event = None
        
        for i, event in enumerate(events):
            if event.id == event_id:
                # Apply updates
                data = event.model_dump()
                data.update(updates)
                updated_event = EventSchema(**data)
                events[i] = updated_event
                break
        
        if updated_event:
            storage.save_events_replace(events)
            
        return updated_event

    @staticmethod
    def delete_event(event_id: str) -> bool:
        """
        Removes an event by ID.
        """
        events = storage.load_events()
        original_count = len(events)
        events = [e for e in events if e.id != event_id]
        
        if len(events) < original_count:
            storage.save_events_replace(events)
            return True
        return False

    @staticmethod
    def bulk_update_events(events: List[EventSchema]):
        """
        Replaces the entire event list in storage.
        """
        storage.save_events_replace(events)

    @staticmethod
    def find_free_slots(
        date: datetime, 
        duration_minutes: int, 
        start_hour: int = 8, 
        end_hour: int = 22
    ) -> List[datetime]:
        """
        Finds available start times for a given duration on a specific date.
        """
        events = storage.load_events()
        day_start = date.replace(hour=start_hour, minute=0, second=0, microsecond=0)
        day_end = date.replace(hour=end_hour, minute=0, second=0, microsecond=0)
        
        # Filter events for this day
        days_events = []
        for e in events:
            # Check overlap logic
            if e.end_time > day_start and e.start_time < day_end:
                days_events.append(e)
        
        # Sort by start time
        days_events.sort(key=lambda x: x.start_time)
        
        free_slots = []
        current_time = day_start
        
        while current_time + timedelta(minutes=duration_minutes) <= day_end:
            slot_end = current_time + timedelta(minutes=duration_minutes)
            is_conflict = False
            
            for e in days_events:
                # If slot overlaps with event
                if (current_time < e.end_time and slot_end > e.start_time):
                    is_conflict = True
                    # Jump to end of this event to save checks
                    if e.end_time > current_time:
                         current_time = e.end_time
                    break
            
            if not is_conflict:
                free_slots.append(current_time)
                # Advance by 30 mins or duration to find next option
                current_time += timedelta(minutes=30) 
            # If conflict was found, current_time was already advanced inside loop (mostly)
            # but strict logic needs careful stepping. 
            # Simplified: just step 15-30 mins if no optimization jump.
            
        return free_slots

    @staticmethod
    def auto_schedule_study_session(
        assignment_id: str, 
        duration_minutes: int = 60
    ) -> Optional[EventSchema]:
        """
        AI Helper: Finds a slot before the deadline and books a study session.
        """
        # 1. Find the assignment
        target_event = CalendarService.get_event_by_id(assignment_id)
        if not target_event:
            return None
            
        deadline = target_event.start_time # or start_time/due_at
        
        # 2. Look backwards from deadline
        # Try finding a slot in the 3 days prior
        for day_offset in range(1, 4):
            check_date = deadline - timedelta(days=day_offset)
            slots = CalendarService.find_free_slots(check_date, duration_minutes)
            
            if slots:
                # Pick the first one (or random/latest)
                chosen_time = slots[0]
                
                study_session = EventSchema(
                    summary=f"Study: {target_event.summary}",
                    description=f"Preparation for {target_event.summary}",
                    start_time=chosen_time,
                    end_time=chosen_time + timedelta(minutes=duration_minutes),
                    event_type="study",
                    location="Library/Home"
                )
                return CalendarService.create_event(study_session)
                
        return None
