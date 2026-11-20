const { Client } = require('pg');

const client = new Client({
  host: '113.20.107.184',
  port: 6432,
  user: 'app1',
  password: '5^S0CEpvYwC1(#YN1UoJ',
  database: 'ceohn10_project',
  ssl: false,
});

async function main() {
  await client.connect();
  const memberCols = await client.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'members' 
    ORDER BY ordinal_position
  `);
  console.log('--- members ---');
  console.log(memberCols.rows.map(c => `${c.column_name} (${c.data_type})`).join(', '));

  const sample = await client.query(`SELECT id, code, name, phone, email, company_name FROM public.members LIMIT 3`);
  console.log('sample members:', sample.rows);

  await client.end();
}

main().catch(console.error);
