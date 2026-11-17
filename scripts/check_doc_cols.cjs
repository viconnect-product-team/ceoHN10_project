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
  const cols = await client.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'documents' 
    ORDER BY ordinal_position
  `);
  console.log('documents columns:', cols.rows);
  const sample = await client.query('SELECT * FROM public.documents LIMIT 2');
  console.log('sample row:', sample.rows);
  await client.end();
}

main().catch(console.error);
