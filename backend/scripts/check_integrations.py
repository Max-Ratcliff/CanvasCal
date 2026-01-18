import os
from supabase import create_client

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_KEY")
supabase = create_client(url, key)

print("--- Checking user_integrations ---")
res = supabase.table("user_integrations").select("*").execute()
if not res.data:
    print("NO INTEGRATIONS FOUND!")
else:
    for row in res.data:
        print(f"User ID: {row['user_id']}")
        print(f"  Canvas Token: {'YES' if row.get('canvas_access_token') else 'NO'}")
        print(f"  Google Access: {'YES' if row.get('google_access_token') else 'NO'}")
        print(f"  Google Refresh: {'YES' if row.get('google_refresh_token') else 'NO'}")
        print(f"  Calendar ID: {row.get('google_calendar_id')}")
