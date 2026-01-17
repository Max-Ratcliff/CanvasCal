import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_KEY")

class Database:
    client: Client = None

    def __init__(self):
        if url and key:
            self.client = create_client(url, key)
        else:
            print("Warning: Supabase credentials not found in environment variables.")

db = Database()

def get_db() -> Client:
    return db.client
