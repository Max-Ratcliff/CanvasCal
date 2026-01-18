-- Create a table for storing calendar events
create table events (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  summary text not null,
  description text,
  start_time timestamp with time zone not null,
  end_time timestamp with time zone not null,
  location text,
  event_type text not null, -- 'class', 'assignment', 'exam', 'study', 'travel'
  weight float,
  user_id uuid default auth.uid() -- Optional: link to Supabase Auth user
);

-- Enable Row Level Security (RLS)
alter table events enable row level security;

-- Create a policy that allows anyone to read/write (for this demo)
-- In production, you'd restrict this to authenticated users
create policy "Enable all users to view/edit events"
on events
for all
using (true)
with check (true);
