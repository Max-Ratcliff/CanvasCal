import os
from supabase import create_client, Client
from app.core.config import settings

class Database:
    client: Client = None
    service_client: Client = None

    def __init__(self):
        url = settings.SUPABASE_URL
        key = settings.SUPABASE_KEY
        service_key = settings.SUPABASE_SERVICE_ROLE_KEY
        
        if url and key:
            self.client = create_client(url, key)
        else:
            print("Warning: Supabase credentials not found in environment variables.")
            
        if url and service_key:
            self.service_client = create_client(url, service_key)
        else:
            print("Warning: Supabase service key not found. Admin operations will fail.")

db = Database()

def get_db() -> Client:
    return db.client

def get_service_db() -> Client:
    return db.service_client
