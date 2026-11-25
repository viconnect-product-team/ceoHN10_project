const { Client } = require('pg');

async function main() {
  const client = new Client({ connectionString: 'postgresql://postgres:postgres@127.0.0.1:5432/ceohn10_project' });
  await client.connect();
  const tables = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name");
  console.log('Tables:', tables.rows.map(t => t.table_name));

  // Check users table columns
  for (const t of ['vione_users', 'users', 'accounts']) {
    if (tables.rows.some(r => r.table_name === t)) {
      const cols = await client.query(`SELECT column_name FROM information_schema.columns WHERE table_name='${t}'`);
      console.log(`${t} columns:`, cols.rows.map(c => c.column_name));
      const sample = await client.query(`SELECT * FROM ${t} LIMIT 3`);
      console.log(`${t} sample:`, sample.rows);
    }
  }

  // Check distinct executive_role and department in members
  const roles = await client.query("SELECT DISTINCT executive_role FROM members");
  console.log('members executive_roles:', roles.rows.map(r => r.executive_role));
  const depts = await client.query("SELECT DISTINCT department FROM members");
  console.log('members departments:', depts.rows.map(r => r.department));

  await client.end();
}
main().catch(console.error);
