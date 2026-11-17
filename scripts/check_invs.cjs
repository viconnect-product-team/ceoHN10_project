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
  const invs = await client.query('SELECT count(*) FROM public.invoices');
  console.log('invoices count:', invs.rows[0]);
  const sampleInvs = await client.query('SELECT * FROM public.invoices LIMIT 5');
  console.log('sample invoices:', sampleInvs.rows);

  const mems = await client.query('SELECT id, name, code, contact, email, phone, fee_paid FROM public.members LIMIT 10');
  console.log('sample members:', mems.rows);

  const docs = await client.query('SELECT count(*) FROM public.documents');
  console.log('documents count:', docs.rows[0]);
  const sampleDocs = await client.query('SELECT id, title, file_url, category, created_at FROM public.documents LIMIT 5');
  console.log('sample documents:', sampleDocs.rows);

  await client.end();
}

main().catch(console.error);
