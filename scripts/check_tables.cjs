const { Client } = require('pg');
const c = new Client({ connectionString: 'postgresql://postgres:postgres@127.0.0.1:5432/ceohn10_project' });
async function main() {
  await c.connect();
  const res = await c.query("SELECT table_name, table_type FROM information_schema.tables WHERE table_name IN ('event_feedback', 'event_feedbacks', 'feedbacks');");
  console.log('Tables:', res.rows);
  const rows1 = await c.query("SELECT count(*) FROM event_feedback;");
  console.log('event_feedback count:', rows1.rows[0]);
  try {
    const rows2 = await c.query("SELECT count(*) FROM event_feedbacks;");
    console.log('event_feedbacks count:', rows2.rows[0]);
  } catch(e) { console.log('event_feedbacks err:', e.message); }
  await c.end();
}
main().catch(console.error);
