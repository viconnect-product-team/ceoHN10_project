const { Client } = require('pg');
const client = new Client({
  host: '113.20.107.184',
  port: 6432,
  user: 'app1',
  password: '5^S0CEpvYwC1(#YN1UoJ',
  database: 'ceohn10_project',
  ssl: false
});
async function run() {
  await client.connect();
  const res = await client.query(`
    SELECT column_name, data_type, is_nullable, column_default 
    FROM information_schema.columns 
    WHERE table_name = 'event_registrations' 
    ORDER BY ordinal_position;
  `);
  console.log(JSON.stringify(res.rows, null, 2));

  const sampleRows = await client.query(`
    SELECT id, event_id, member_name, status, payment_status, is_walkin, registration_origin, created_at
    FROM public.event_registrations
    LIMIT 5;
  `);
  console.log('Sample rows:', JSON.stringify(sampleRows.rows, null, 2));

  await client.end();
}
run().catch(err => { console.error(err); process.exit(1); });
