const { Client } = require('pg');

const connectionString = 'postgresql://postgres:Suchitra@0422@db.vrzjkxkkmbaxixzkirbi.supabase.co:5432/postgres';

const sql = `
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create daily_snapshots table
CREATE TABLE IF NOT EXISTS daily_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE UNIQUE NOT NULL,
  data JSONB NOT NULL,
  user_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create expenses table
CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  category TEXT NOT NULL,
  date DATE NOT NULL,
  notes TEXT,
  user_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);
CREATE INDEX IF NOT EXISTS idx_snapshots_date ON daily_snapshots(date);

-- Enable RLS (though for now we might not enforce users till auth is set)
ALTER TABLE daily_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- Simple policies (allow all for now to make it work, or restrict by user_id if we want)
-- Note: In a real app, you'd want auth.uid() = user_id
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public access') THEN
        CREATE POLICY "Allow public access" ON daily_snapshots FOR ALL USING (true);
        CREATE POLICY "Allow public access" ON expenses FOR ALL USING (true);
    END IF;
END $$;
`;

async function init() {
  const client = new Client({
    connectionString: connectionString,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('Connecting to Supabase Database...');
    await client.connect();
    console.log('Connected successfully. Executing schema...');
    await client.query(sql);
    console.log('Database schema initialized successfully!');
  } catch (err) {
    console.error('Error initializing database:', err);
  } finally {
    await client.end();
  }
}

init();
