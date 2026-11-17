const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://app1:5%5ES0CEpvYwC1%28%23YN1UoJ@113.20.107.184:6432/ceohn10_project?sslmode=disable'
});

async function run() {
  try {
    await client.connect();

    console.log('--- ALL vione_users ---');
    const users = await client.query(`
      SELECT id, email, username, name, LEFT(password, 15) as pass_prefix
      FROM vione_users
    `);
    console.log(users.rows);

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

run();
