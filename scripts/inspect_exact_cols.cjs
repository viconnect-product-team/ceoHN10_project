const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://app1:5%5ES0CEpvYwC1%28%23YN1UoJ@113.20.107.184:6432/ceohn10_project?sslmode=disable'
});

async function run() {
  await client.connect();
  const tables = ['events', 'ceohn10_events', 'trainings', 'documents', 'tasks', 'ceohn10_transactions', 'notifications', 'event_feedbacks'];
  for (const t of tables) {
    const cols = await client.query(`SELECT column_name FROM information_schema.columns WHERE table_name = $1`, [t]);
    console.log(`Table [${t}] columns:`, cols.rows.map(r => r.column_name));
  }
  await client.end();
}

run();
