import pg from 'pg';

const connectionString = 'postgresql://postgres:Suchitra@0422@db.vrzjkxkkmbaxixzkirbi.supabase.co:5432/postgres';
const targetUserId = 'user_3AvV9Tsyah9j5VGwpzb0kFYk3x0';
const sourceUserId = 'ca5385a4-9549-4492-983b-3bd42d82a07';

async function migrate() {
  const client = new pg.Client({ connectionString });
  try {
    console.log('Connecting to database...');
    await client.connect();
    console.log('Connected successfully.');

    // Step 1: Drop Constraints
    console.log('Dropping foreign key constraints...');
    await client.query('ALTER TABLE unlocked_dates DROP CONSTRAINT IF EXISTS unlocked_dates_user_id_fkey');
    await client.query('ALTER TABLE expenses DROP CONSTRAINT IF EXISTS expenses_user_id_fkey');
    await client.query('ALTER TABLE daily_snapshots DROP CONSTRAINT IF EXISTS daily_snapshots_user_id_fkey');

    // Step 2: Alter Columns
    console.log('Altering column types to TEXT...');
    await client.query('ALTER TABLE daily_snapshots ALTER COLUMN user_id TYPE TEXT');
    await client.query('ALTER TABLE expenses ALTER COLUMN user_id TYPE TEXT');
    await client.query('ALTER TABLE unlocked_dates ALTER COLUMN user_id TYPE TEXT');

    // Step 3: Migrate Data
    console.log(`Migrating data from ${sourceUserId} and 'local' to ${targetUserId}...`);
    
    const res1 = await client.query('UPDATE daily_snapshots SET user_id = $1 WHERE user_id = $2 OR user_id = \'local\' OR user_id IS NULL', [targetUserId, sourceUserId]);
    console.log(`Snapshots updated: ${res1.rowCount}`);

    const res2 = await client.query('UPDATE expenses SET user_id = $1 WHERE user_id = $2 OR user_id = \'local\' OR user_id IS NULL', [targetUserId, sourceUserId]);
    console.log(`Expenses updated: ${res2.rowCount}`);

    const res3 = await client.query('UPDATE unlocked_dates SET user_id = $1 WHERE user_id = $2 OR user_id = \'local\' OR user_id IS NULL', [targetUserId, sourceUserId]);
    console.log(`Unlocked dates updated: ${res3.rowCount}`);

    console.log('Migration completed successfully!');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await client.end();
  }
}

migrate();
