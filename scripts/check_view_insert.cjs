const { Client } = require('pg');
const c = new Client({ connectionString: 'postgresql://postgres:postgres@127.0.0.1:5432/ceohn10_project' });
async function main() {
  await c.connect();
  const v = await c.query("SELECT definition FROM pg_views WHERE viewname = 'event_feedbacks';");
  console.log('View definition:', v.rows[0]?.definition);
  try {
    await c.query(`INSERT INTO public.event_feedbacks (id, event_id, member_name, user_name, comment, rating, created_at) VALUES ('test-v-1', 'EVT-PAID-2026', 'Test', 'Test', 'Great event', 5, now());`);
    console.log('Insert into view SUCCESS!');
    await c.query("DELETE FROM event_feedback WHERE id = 'test-v-1';");
  } catch(e) {
    console.error('Insert into view FAILED:', e.message);
  }
  await c.end();
}
main().catch(console.error);
