-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table (optional - for authenticated users)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create artifacts table
-- Note: No foreign key constraint on user_id to prevent timeout issues
CREATE TABLE IF NOT EXISTS artifacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  text TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  task TEXT,
  date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create todos table
-- Note: No foreign key constraint on user_id to prevent timeout issues
CREATE TABLE IF NOT EXISTS todos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  text TEXT NOT NULL,
  completed BOOLEAN DEFAULT false,
  category TEXT NOT NULL CHECK (category IN ('do', 'schedule', 'delegate', 'eliminate')),
  date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create settings table
-- Note: No foreign key constraint on user_id to prevent timeout issues
CREATE TABLE IF NOT EXISTS settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE,
  work_time INTEGER DEFAULT 25,
  short_break_time INTEGER DEFAULT 5,
  long_break_time INTEGER DEFAULT 15,
  long_break_interval INTEGER DEFAULT 4,
  auto_start_breaks BOOLEAN DEFAULT false,
  auto_start_pomodoros BOOLEAN DEFAULT false,
  sound_enabled BOOLEAN DEFAULT true,
  notifications_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_artifacts_user_date ON artifacts(user_id, date);
CREATE INDEX idx_todos_user_date ON todos(user_id, date);
CREATE INDEX idx_artifacts_date ON artifacts(date);
CREATE INDEX idx_todos_date ON todos(date);

-- CRITICAL: Add user_id indexes for RLS performance (prevents timeouts)
CREATE INDEX idx_artifacts_user_id ON artifacts USING btree (user_id);
CREATE INDEX idx_todos_user_id ON todos USING btree (user_id);
CREATE INDEX idx_settings_user_id ON settings USING btree (user_id);

-- Row Level Security (RLS) policies
ALTER TABLE artifacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE todos ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Create a function to get current user ID (more efficient than inline auth.uid())
CREATE OR REPLACE FUNCTION auth.user_id() 
RETURNS UUID 
LANGUAGE SQL 
STABLE
AS $$
  SELECT auth.uid()
$$;

-- Separate policies for different operations (more efficient than FOR ALL)
-- Artifacts policies
CREATE POLICY "Users can view own artifacts" ON artifacts
  FOR SELECT TO authenticated
  USING (user_id = auth.user_id());

CREATE POLICY "Users can insert own artifacts" ON artifacts
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.user_id());

CREATE POLICY "Users can update own artifacts" ON artifacts
  FOR UPDATE TO authenticated
  USING (user_id = auth.user_id());

CREATE POLICY "Users can delete own artifacts" ON artifacts
  FOR DELETE TO authenticated
  USING (user_id = auth.user_id());

-- Todos policies
CREATE POLICY "Users can view own todos" ON todos
  FOR SELECT TO authenticated
  USING (user_id = auth.user_id());

CREATE POLICY "Users can insert own todos" ON todos
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.user_id());

CREATE POLICY "Users can update own todos" ON todos
  FOR UPDATE TO authenticated
  USING (user_id = auth.user_id());

CREATE POLICY "Users can delete own todos" ON todos
  FOR DELETE TO authenticated
  USING (user_id = auth.user_id());

-- Settings policies
CREATE POLICY "Users can view own settings" ON settings
  FOR SELECT TO authenticated
  USING (user_id = auth.user_id());

CREATE POLICY "Users can insert own settings" ON settings
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.user_id());

CREATE POLICY "Users can update own settings" ON settings
  FOR UPDATE TO authenticated
  USING (user_id = auth.user_id());

CREATE POLICY "Users can delete own settings" ON settings
  FOR DELETE TO authenticated
  USING (user_id = auth.user_id());

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers
CREATE TRIGGER update_artifacts_updated_at BEFORE UPDATE ON artifacts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_todos_updated_at BEFORE UPDATE ON todos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();