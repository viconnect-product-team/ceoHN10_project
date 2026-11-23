const { Client } = require('pg');
async function testPort(port) {
  const client = new Client({
    host: '113.20.107.184',
    port: port,
    user: 'app1',
    password: '5^S0CEpvYwC1(#YN1UoJ',
    database: 'ceohn10_project',
    ssl: false,
    connectionTimeoutMillis: 3000
  });
  try {
    await client.connect();
    console.log(`Port ${port} CONNECTED!`);
    const res = await client.query('SELECT 1 as val');
    console.log(`Port ${port} query OK:`, res.rows);
    await client.end();
  } catch (e) {
    console.log(`Port ${port} failed:`, e.message);
  }
}
async function run() {
  await testPort(6432);
  await testPort(5432);
}
run();
