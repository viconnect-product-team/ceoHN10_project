const { Client } = require('pg');
const client = new Client({
  host: '113.20.107.184',
  port: 6432,
  user: 'app1',
  password: '5^S0CEpvYwC1(#YN1UoJ',
  database: 'ceohn10_project',
  ssl: false
});

async function main() {
  await client.connect();
  console.log('Connected to PostgreSQL successfully!');
  try {
    const r1 = await client.query('SELECT * FROM ceohn10_transactions LIMIT 5');
    console.log('ceohn10_transactions:', JSON.stringify(r1.rows, null, 2));
  } catch (e) {
    console.log('ceohn10_transactions error:', e.message);
  }
  try {
    const r2 = await client.query('SELECT * FROM transactions LIMIT 5');
    console.log('transactions:', JSON.stringify(r2.rows, null, 2));
  } catch (e) {
    console.log('transactions error:', e.message);
  }
  try {
    const r3 = await client.query('SELECT count(*) FROM members');
    console.log('members count:', r3.rows[0]);
    const r4 = await client.query('SELECT count(*) FROM member_dues');
    console.log('member_dues count:', r4.rows[0]);
    const r5 = await client.query('SELECT count(*) FROM documents');
    console.log('documents count:', r5.rows[0]);
  } catch (e) {
    console.log('counts error:', e.message);
  }
  await client.end();
}

main().catch(console.error);
