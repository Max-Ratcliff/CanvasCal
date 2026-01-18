-- Create a table for storing calendar events
-- Run this in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS events (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  summary text NOT NULL,
  description text,
  start_time timestamp with time zone NOT NULL,
  end_time timestamp with time zone NOT NULL,
  location text,
  event_type text NOT NULL, -- 'class', 'assignment', 'exam', 'study', 'travel'
  weight float,
  google_event_id text, -- ID of the event in Google Calendar
  user_id uuid DEFAULT auth.uid(), -- Optional: link to Supabase Auth user
  
  -- Metadata for UX
  course_id text,
  source text DEFAULT 'manual', -- 'ai', 'canvas', 'manual'
  verified boolean DEFAULT false,
  color_hex text
);

-- Table for secure storage of third-party integration tokens
CREATE TABLE IF NOT EXISTS user_integrations (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  
  -- Canvas Integration (Encrypted)
  canvas_base_url text,
  canvas_access_token text,
  canvas_refresh_token text,
  canvas_token_expires_at timestamp with time zone,
  
  -- Google Integration (Encrypted)
  google_access_token text,
  google_refresh_token text,
  google_calendar_id text DEFAULT 'primary',
  
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_integrations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Events
CREATE POLICY "Users can manage their own events"
ON events
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- RLS Policies for Integrations
CREATE POLICY "Users can manage their own integrations"
ON user_integrations
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Function to handle updated_at
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for updated_at
CREATE TRIGGER update_user_integrations_updated_at
  BEFORE UPDATE ON user_integrations
  FOR EACH ROW
  EXECUTE PROCEDURE handle_updated_at();
