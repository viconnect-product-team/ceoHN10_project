const { Client } = require('pg');
const c = new Client({ connectionString: 'postgresql://postgres:postgres@127.0.0.1:5432/ceohn10_project' });
async function main() {
  await c.connect();
  const cols = await c.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'event_feedback';");
  console.log('event_feedback columns:', cols.rows);
  const evCols = await c.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'events' AND column_name IN ('id', 'name', 'title');");
  console.log('events columns:', evCols.rows);
  const rows = await c.query("SELECT * FROM event_feedback LIMIT 5;");
  console.log('event_feedback rows count:', rows.rows.length, rows.rows);
  await c.end();
}
main().catch(console.error);
