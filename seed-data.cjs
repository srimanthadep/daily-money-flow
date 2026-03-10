const fs = require('fs');
const csv = require('csv-parser');
const { Client } = require('pg');

const connectionString = 'postgresql://postgres:Suchitra@0422@db.vrzjkxkkmbaxixzkirbi.supabase.co:5432/postgres';

async function seed() {
  const entries = [];
  
  await new Promise((resolve, reject) => {
    fs.createReadStream('data.csv')
      .pipe(csv())
      .on('data', (row) => {
        // Try all possible capitalizations and trimmed versions
        const name = row.Name || row.name || row['Name '] || Object.values(row)[0];
        const amount = parseFloat(row.Amount || row.amount || row['Amount '] || Object.values(row)[1]);
        const status = row.Status || row.status || 'Pending';
        const notes = row.Notes || row.notes || '';
        const order = parseInt(row.Order || row.order || 0);

        if (name && name.trim()) {
           entries.push({
             id: Math.random().toString(36).substr(2, 9),
             name: name.trim(),
             amount: isNaN(amount) ? 0 : amount,
             status: status.trim() || 'Pending',
             notes: notes.trim(),
             order: isNaN(order) ? 0 : order,
             createdAt: new Date().toISOString(),
             updatedAt: new Date().toISOString()
           });
        }
      })
      .on('end', () => {
        console.log(`CSV file successfully processed. Found ${entries.length} entries.`);
        resolve();
      })
      .on('error', reject);
  });

  if (entries.length === 0) {
    console.error('No valid entries found in CSV');
    return;
  }

  const client = new Client({
    connectionString: connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected to DB');

    const date = '2026-03-09';
    await client.query('INSERT INTO daily_snapshots (date, data) VALUES ($1, $2) ON CONFLICT (date) DO UPDATE SET data = $2', [date, JSON.stringify(entries)]);
    console.log(`Snapshot for ${date} updated.`);

    const today = '2026-03-10';
    await client.query('INSERT INTO daily_snapshots (date, data) VALUES ($1, $2) ON CONFLICT (date) DO NOTHING', [today, JSON.stringify(entries)]);
    console.log(`Snapshot for ${today} ensured.`);

  } catch (err) {
    console.error('Error seeding DB:', err);
  } finally {
    await client.end();
  }
}

seed();
