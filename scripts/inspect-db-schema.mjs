import pg from 'pg';
const { Client } = pg;

async function main() {
  const client = new Client({ connectionString: 'postgresql://app1:5%5ES0CEpvYwC1%28%23YN1UoJ@127.0.0.1:5432/ceohn10_project' });
  await client.connect();

  const tables = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name");
  console.log('--- ALL TABLES ---');
  console.log(tables.rows.map(r => r.table_name).join(', '));

  async function showCols(table) {
    const cols = await client.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_schema='public' AND table_name=$1 ORDER BY ordinal_position", [table]);
    console.log(`\nColumns of ${table}:`);
    console.log(cols.rows.map(c => `${c.column_name} (${c.data_type})`).join(', '));
  }

  const checkTables = ['events', 'event_registrations', 'members', 'training_sessions', 'accounts', 'app_users', 'users', 'moments', 'feedbacks', 'reviews'];
  for (const t of checkTables) {
    if (tables.rows.some(r => r.table_name === t)) {
      await showCols(t);
    } else {
      console.log(`\nTable ${t}: DOES NOT EXIST`);
    }
  }

  await client.end();
}

main().catch(console.error);
