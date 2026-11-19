const { Client } = require('pg');
const bcrypt = require('bcrypt');

const client = new Client({
  connectionString: 'postgresql://app1:5%5ES0CEpvYwC1%28%23YN1UoJ@113.20.107.184:6432/ceohn10_project?sslmode=disable'
});

async function main() {
  await client.connect();
  console.log('Testing authentication directly against 113.20.107.184:6432...');

  // 1. Fetch admin@ceohn10.vn
  const res = await client.query("SELECT id, username, email, password FROM public.vione_users WHERE email = 'admin@ceohn10.vn'");
  if (res.rows.length === 0) {
    throw new Error('admin@ceohn10.vn not found in vione_users!');
  }
  const user = res.rows[0];
  console.log('Found user:', user.email, 'ID:', user.id);

  // 2. Validate password 123456
  const match = await bcrypt.compare('123456', user.password);
  console.log('Password 123456 matches bcrypt hash:', match);
  if (!match) {
    throw new Error('Password mismatch!');
  }

  // 3. Check role in members
  const mem = await client.query("SELECT id, user_id, email, executive_role, department, status FROM public.members WHERE email = 'admin@ceohn10.vn'");
  console.log('Member record:', mem.rows[0]);

  // 4. Check user_roles
  const roles = await client.query("SELECT * FROM public.user_roles WHERE user_id = $1::uuid", [user.id]);
  console.log('User roles:', roles.rows.map(r => r.role));

  // 5. Check memberships
  const ms = await client.query("SELECT * FROM public.memberships WHERE user_id = $1::uuid", [user.id]);
  console.log('Memberships:', ms.rows.map(r => r.role));

  await client.end();
  console.log('ALL VERIFICATIONS PASSED SUCCESSFULLY!');
}

main().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
