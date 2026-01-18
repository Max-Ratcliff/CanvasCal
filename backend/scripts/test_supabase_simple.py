import os
import sys
from dotenv import load_dotenv
from supabase import create_client

# Add backend to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

load_dotenv(".env")

def test():
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_KEY")
    
    if not url or not key:
        print("Missing credentials in .env")
        return

    print(f"Connecting to: {url}")
    try:
        supabase = create_client(url, key)
        # Try to list tables or check connection
        # Supabase doesn't have a simple 'ping', so we try to select from a non-existent table 
        # to see if we get a proper 'authenticated' error or a connection error.
        response = supabase.table("random_table_check").select("*").limit(1).execute()
        print("Authenticated successfully.")
    except Exception as e:
        if "PGRST204" in str(e) or "Could not find the table" in str(e):
            print("Authenticated successfully! (But 'events' table is missing, which is expected).")
        else:
            print(f"Connection failed: {e}")

if __name__ == "__main__":
    test()
