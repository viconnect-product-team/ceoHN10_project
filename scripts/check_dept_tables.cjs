const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://app1:5%5ES0CEpvYwC1%28%23YN1UoJ@113.20.107.184:6432/ceohn10_project?sslmode=disable'
});

async function run() {
  try {
    await client.connect();
    const res = await client.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_name ILIKE ANY(ARRAY['%dept%', '%department%', '%role%', '%permission%', '%ban%'])
    `);
    console.log('Dept/Role/Permission tables:', res.rows);

    const memDepts = await client.query(`
      SELECT DISTINCT department FROM ceohn10_members WHERE department IS NOT NULL
    `);
    console.log('Distinct ceohn10_members departments:', memDepts.rows);

    const memRoles = await client.query(`
      SELECT DISTINCT executive_role FROM ceohn10_members WHERE executive_role IS NOT NULL
    `);
    console.log('Distinct ceohn10_members executive_roles:', memRoles.rows);

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

run();
