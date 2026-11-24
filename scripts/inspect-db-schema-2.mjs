import pg from 'pg';
const { Client } = pg;

async function main() {
  const client = new Client({ connectionString: 'postgresql://app1:5%5ES0CEpvYwC1%28%23YN1UoJ@127.0.0.1:5432/ceohn10_project' });
  await client.connect();

  async function showCols(table) {
    const cols = await client.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_schema='public' AND table_name=$1 ORDER BY ordinal_position", [table]);
    console.log(`\nColumns of ${table}:`);
    console.log(cols.rows.map(c => `${c.column_name} (${c.data_type})`).join(', '));
  }

  await showCols('ceohn10_users');
  await showCols('vione_users');
  await showCols('event_photos');
  await showCols('polls');
  await showCols('trainings');
  await showCols('event_feedbacks');

  const usersSample = await client.query("SELECT id, email, role, status FROM ceohn10_users LIMIT 5");
  console.log('\nSample users in ceohn10_users:');
  console.log(usersSample.rows);

  await client.end();
}

main().catch(console.error);
