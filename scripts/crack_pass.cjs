const bcrypt = require('bcrypt');
const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://app1:5%5ES0CEpvYwC1%28%23YN1UoJ@113.20.107.184:6432/ceohn10_project?sslmode=disable'
});

async function run() {
  await client.connect();
  const res = await client.query(`
    SELECT email, password FROM vione_users 
    WHERE email IN ('admin@connect.vn', 'vumikasa6@gmail.com')
  `);
  
  const wordlist = [
    '123456a@', '123456', 'admin', 'admin123', 'Admin@123', 'admini@connect.vn',
    'admin@connect.vn', 'Connect@123', 'Connect123', 'viconnect', 'viconnect123',
    'Viconnect@123', 'Ceohn10@2026', 'Ceohn10@2025', 'ceohn10', '12345678', 'password',
    'Admin123@', 'admin@123', 'Admin@2024', 'Admin@2025', 'Admin@2026', '12345678a@',
    'Viconnect2026@', 'HanoiBA@2026'
  ];

  for (const row of res.rows) {
    let matched = null;
    for (const w of wordlist) {
      if (bcrypt.compareSync(w, row.password)) {
        matched = w;
        break;
      }
    }
    console.log(`User ${row.email}: MATCH = ${matched}`);
    if (!matched) {
      console.log(`User ${row.email} full hash:`, row.password);
    }
  }

  await client.end();
}

run();
