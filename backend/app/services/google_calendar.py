from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from app.schemas.event import EventSchema
from typing import List
import logging

logger = logging.getLogger("GoogleCalendarService")

class GoogleCalendarService:
    def __init__(self, token: str):
        # We assume the frontend passes a valid access token.
        # Scopes should have been handled by the frontend auth flow.
        self.creds = Credentials(token=token)
        self.service = build('calendar', 'v3', credentials=self.creds)

    def get_or_create_calendar(self, calendar_name: str = "CanvasCal") -> str:
        """
        Checks if a calendar exists, otherwise creates it. Returns Calendar ID.
        """
        try:
            # List calendars
            page_token = None
            while True:
                calendar_list = self.service.calendarList().list(pageToken=page_token).execute()
                for calendar_list_entry in calendar_list['items']:
                    if calendar_list_entry['summary'] == calendar_name:
                        return calendar_list_entry['id']
                page_token = calendar_list.get('nextPageToken')
                if not page_token:
                    break
            
            # If not found, create it
            calendar = {
                'summary': calendar_name,
                'timeZone': 'UTC' # Should ideally come from user prefs
            }
            created_calendar = self.service.calendars().insert(body=calendar).execute()
            return created_calendar['id']

        except Exception as e:
            logger.error(f"Error getting/creating calendar: {e}")
            raise e

    def sync_events(self, local_events: List[EventSchema]) -> List[EventSchema]:
        """
        Syncs local events to the Google Calendar.
        Returns the updated list of events (with Google IDs populated).
        """
        calendar_id = self.get_or_create_calendar()
        
        updated_events = []
        
        for event in local_events:
            # Clone event to avoid side effects if something fails mid-loop (optional, but good practice)
            # Actually we modify it in place for simplicity here.
            
            google_event_body = {
                'summary': event.summary,
                'description': event.description or "",
                'start': {
                    'dateTime': event.start_time.isoformat(),
                    'timeZone': 'UTC',
                },
                'end': {
                    'dateTime': event.end_time.isoformat(),
                    'timeZone': 'UTC',
                },
            }

            try:
                if event.google_event_id:
                    # Update existing
                    self.service.events().update(
                        calendarId=calendar_id, 
                        eventId=event.google_event_id, 
                        body=google_event_body
                    ).execute()
                else:
                    # Insert new
                    created_event = self.service.events().insert(
                        calendarId=calendar_id, 
                        body=google_event_body
                    ).execute()
                    
                    event.google_event_id = created_event['id']
                
                updated_events.append(event)
                
            except Exception as e:
                logger.error(f"Failed to sync event {event.summary}: {e}")
                # Keep the event locally even if sync failed
                updated_events.append(event)
                
        return updated_events
