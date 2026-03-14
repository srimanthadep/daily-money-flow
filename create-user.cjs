const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
// Use the provided service role key for admin privileges
const supabaseServiceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZyempreGtrbWJheGl4emtpcmJpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzA2ODEwMywiZXhwIjoyMDg4NjQ0MTAzfQ.4i4zs_4et3uFW04NEWkK1DsJK55JVHkDZThXPht5C2Q";

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createAndMigrate() {
  const email = "gunduupender8@gmai.com"; // Note: User typo "gmai.com" kept verbatim
  const password = "123456";

  console.log("Creating user via Admin API...");
  
  // Create user directly, bypassing email confirmation
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: email,
    password: password,
    email_confirm: true // Force confirm
  });

  let user;

  if (authError) {
    if (authError.code === "email_exists") {
      console.log("User already exists. Fetching user ID...");
      // List users to find the ID (since admin API doesn't return user on existing signup error like public API sometimes does)
      const { data: users, error: listError } = await supabase.auth.admin.listUsers();
      if (listError) throw listError;
      user = users.users.find(u => u.email === email);
      if (!user) throw new Error("Could not find existing user ID.");
      
      // Update the user to confirm email just in case
      await supabase.auth.admin.updateUserById(user.id, { email_confirm: true });
    } else {
      console.error("Auth Admin Error:", authError);
      return;
    }
  } else {
    user = authData.user;
    console.log("User successfully created.");
  }

  console.log("User ID:", user.id);
  console.log("Fetching existing unassigned or old data...");

  // Since we are using the Service Role Key, RLS is bypassed. 
  // We can see and update ALL data.
  
  // 1. Daily Snapshots
  let { data: snaps, error: snapErr } = await supabase.from('daily_snapshots').select('*');
  if (snapErr) console.error("Snap fetch error:", snapErr);
  else {
    let migratedCount = 0;
    for (const snap of snaps) {
      if (snap.user_id !== user.id) {
        await supabase.from('daily_snapshots').update({ user_id: user.id }).eq('date', snap.date); 
        migratedCount++;
      }
    }
    console.log(`Migrated ${migratedCount} out of ${snaps.length} daily snapshots.`);
  }

  // 2. Expenses
  let { data: expenses, error: expErr } = await supabase.from('expenses').select('*');
  if (expErr) console.error("Exp fetch error:", expErr);
  else {
    let migratedCount = 0;
    for (const exp of expenses) {
      if (exp.user_id !== user.id) {
        await supabase.from('expenses').update({ user_id: user.id }).eq('id', exp.id);
        migratedCount++;
      }
    }
    console.log(`Migrated ${migratedCount} out of ${expenses.length} expenses.`);
  }

  // 3. Unlocked Dates
  let { data: unlocked, error: unlErr } = await supabase.from('unlocked_dates').select('*');
  if (unlErr) console.error("Unlock fetch error:", unlErr);
  else {
    let migratedCount = 0;
    for (const unl of unlocked) {
      if (unl.user_id !== user.id) {
        await supabase.from('unlocked_dates').update({ user_id: user.id }).eq('date', unl.date);
        migratedCount++;
      }
    }
    console.log(`Migrated ${migratedCount} out of ${unlocked.length} unlocked dates.`);
  }

  console.log("Migration finished successfully!");
}

createAndMigrate();
