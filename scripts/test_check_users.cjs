const { Client } = require('pg');
const bcrypt = require('bcrypt');

const client = new Client({
  connectionString: 'postgresql://app1:5%5ES0CEpvYwC1%28%23YN1UoJ@113.20.107.184:6432/ceohn10_project?sslmode=disable'
});

async function run() {
  try {
    await client.connect();
    const res = await client.query(`
      SELECT id, email, username, name, password
      FROM ceohn10_users
    `);

    const candidatePasswords = [
      '123456a@',
      '123456',
      'admin123',
      'Admin@123',
      'Connect@123',
      'Ceohn10@2026',
      'viconnect@123',
      'password'
    ];

    for (const u of res.rows) {
      let matched = null;
      for (const p of candidatePasswords) {
        if (await bcrypt.compare(p, u.password)) {
          matched = p;
          break;
        }
      }
      console.log(`User: ${u.email} | matched password: ${matched}`);
    }

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

run();
