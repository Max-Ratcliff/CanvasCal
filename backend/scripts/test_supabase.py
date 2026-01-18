import sys
import os

# Add backend directory to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db import get_db

def test_connection():
    print("--- Testing Supabase Connection ---")
    
    supabase = get_db()
    
    if not supabase:
        print("Error: Could not initialize Supabase client. Check .env")
        return

    try:
        # Try a simple select. Even if table is empty/missing, we'll get a specific response.
        # If the table 'events' doesn't exist yet, this might throw a specific error we can catch.
        print("Attempting to select from 'events' table...")
        response = supabase.table("events").select("*").limit(1).execute()
        
        print("Connection Successful!")
        print(f"Data: {response.data}")
        
    except Exception as e:
        print(f"\n--- Connection Error ---")
        print(f"Details: {e}")
        print("\nNote: If the error is 'relation \"events\" does not exist', you need to run the SQL schema creation script in your Supabase Dashboard.")

if __name__ == "__main__":
    test_connection()
