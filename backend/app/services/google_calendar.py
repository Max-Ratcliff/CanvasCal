from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request
from googleapiclient.discovery import build
from app.core.config import settings
from app.services.crypto import crypto
from app.db import get_service_db
import logging

logger = logging.getLogger(__name__)

class GoogleCalendarService:
    def __init__(self, user_id: str):
        self.user_id = user_id
        self.db = get_service_db()
        self.creds = self._get_user_credentials()
        # We build the service immediately to fail fast if creds are bad
        self.service = build('calendar', 'v3', credentials=self.creds)
        
        # Ensure we have a target calendar
        self.calendar_id = self._get_or_create_calendar()

    def _get_user_credentials(self):
        """Fetches and decrypts user credentials from Supabase."""
        logger.info(f"Fetching credentials for user_id: {self.user_id}")
        # Query Real Supabase
        result = self.db.table("user_integrations").select("*").eq("user_id", self.user_id).execute()
        
        if not result.data:
            logger.error(f"No integration record found for user_id: {self.user_id}")
            raise Exception("User has not connected Google Calendar")

        integration = result.data[0]
        enc_access = integration.get("google_access_token")
        enc_refresh = integration.get("google_refresh_token")

        if not enc_access or not enc_refresh:
            raise Exception("Incomplete Google Calendar tokens")

        # Decrypt
        creds = Credentials(
            token=crypto.decrypt(enc_access),
            refresh_token=crypto.decrypt(enc_refresh),
            token_uri="https://oauth2.googleapis.com/token",
            client_id=settings.GOOGLE_CLIENT_ID,
            client_secret=settings.GOOGLE_CLIENT_SECRET,
            scopes=['https://www.googleapis.com/auth/calendar.events']
        )

        # Auto-Refresh if expired
        if creds.expired and creds.refresh_token:
            try:
                creds.refresh(Request())
                # Update Real Supabase
                self.db.table("user_integrations").update({
                    "google_access_token": crypto.encrypt(creds.token),
                    "updated_at": "now()"
                }).eq("user_id", self.user_id).execute()
            except Exception as e:
                logger.error(f"Failed to refresh token: {e}")
                # We might want to re-raise or let it fail later
                pass

        return creds

    def _get_or_create_calendar(self):
        """
        Logic:
        1. Check DB for 'google_calendar_id'.
        2. If missing, list Google Calendars to see if 'CanvasCal' exists.
        3. If not exists, create it.
        4. Save ID to DB.
        """
        # 1. Check DB
        result = self.db.table("user_integrations").select("google_calendar_id").eq("user_id", self.user_id).execute()
        stored_id = result.data[0].get("google_calendar_id")
        
        # If we have a stored ID that isn't 'primary', assume it's valid for now
        # (A more robust check would be to try getting it from API, but that costs latency)
        if stored_id and stored_id != 'primary':
            return stored_id

        # 2. List Calendars (Slow, but necessary if ID missing)
        try:
            page_token = None
            while True:
                calendar_list = self.service.calendarList().list(pageToken=page_token).execute()
                for calendar_list_entry in calendar_list['items']:
                    if calendar_list_entry['summary'] == 'CanvasCal':
                        found_id = calendar_list_entry['id']
                        self._update_calendar_id_in_db(found_id)
                        return found_id
                page_token = calendar_list.get('nextPageToken')
                if not page_token:
                    break
        except Exception as e:
            logger.warning(f"Error listing calendars: {e}")

        # 3. Create New
        try:
            calendar = {
                'summary': 'CanvasCal',
                'timeZone': 'UTC'
            }
            created_calendar = self.service.calendars().insert(body=calendar).execute()
            new_id = created_calendar['id']
            self._update_calendar_id_in_db(new_id)
            return new_id
        except Exception as e:
            logger.error(f"Error creating calendar: {e}")
            return 'primary' # Fallback

    def _update_calendar_id_in_db(self, calendar_id):
        self.db.table("user_integrations").update({
            "google_calendar_id": calendar_id
        }).eq("user_id", self.user_id).execute()

    def sync_events(self, events: list):
        """
        Syncs a list of events to Google Calendar.
        Supports:
        - CREATE (if google_event_id is null)
        - UPDATE (if google_event_id is set)
        """
        synced_count = 0

        for event in events:
            gcal_event = {
                'summary': event['summary'],
                'location': event.get('location', ''),
                'description': event.get('description', ''),
                'start': {'dateTime': event['start_time'], 'timeZone': 'UTC'},
                'end': {'dateTime': event['end_time'], 'timeZone': 'UTC'},
            }

            try:
                if event.get("google_event_id"):
                    # UPDATE
                    self.service.events().update(
                        calendarId=self.calendar_id,
                        eventId=event['google_event_id'],
                        body=gcal_event
                    ).execute()
                else:
                    # CREATE
                    created_event = self.service.events().insert(
                        calendarId=self.calendar_id,
                        body=gcal_event
                    ).execute()
                    
                    # Update Real Supabase with the new Google ID
                    self.db.table("events").update({
                        "google_event_id": created_event['id']
                    }).eq("id", event["id"]).execute()
                
                synced_count += 1
            except Exception as e:
                logger.error(f"Failed to sync event {event['id']}: {e}")

        return synced_count

    def delete_event(self, google_event_id: str):
        """
        Deletes an event from Google Calendar.
        """
        try:
            self.service.events().delete(
                calendarId=self.calendar_id,
                eventId=google_event_id
            ).execute()
            return True
        except Exception as e:
            logger.error(f"Failed to delete event {google_event_id}: {e}")
            return False

def get_calendar_service(user_id: str):
    return GoogleCalendarService(user_id)
