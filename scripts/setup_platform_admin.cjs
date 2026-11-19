const { Client } = require('pg');
const bcrypt = require('bcrypt');

const client = new Client({
  connectionString: 'postgresql://app1:5%5ES0CEpvYwC1%28%23YN1UoJ@113.20.107.184:6432/ceohn10_project?sslmode=disable'
});

async function main() {
  await client.connect();
  console.log('Connected to PostgreSQL 113.20.107.184:6432 (ceohn10_project)');

  const passwordHash = await bcrypt.hash('123456', 10);
  console.log('Generated bcrypt hash for 123456:', passwordHash);

  const adminUserId = '00000000-0000-4000-8000-000000000001';
  const adminEmail = 'admin@ceohn10.vn';
  const adminName = 'Master Platform Admin';
  const assocId = 'c1983000-0000-4000-8000-000000001983';

  // 1. Upsert in public.vione_users
  await client.query(`
    INSERT INTO public.vione_users (id, username, email, name, password, email_verified, created_at, updated_at)
    VALUES ($1, $2, $3, $4, $5, true, NOW(), NOW())
    ON CONFLICT (id) DO UPDATE
    SET username = EXCLUDED.username,
        email = EXCLUDED.email,
        name = EXCLUDED.name,
        password = EXCLUDED.password,
        email_verified = true,
        updated_at = NOW();
  `, [adminUserId, adminEmail, adminEmail, adminName, passwordHash]);
  console.log('Upserted admin@ceohn10.vn in public.vione_users');

  // 2. Upsert in public.members
  await client.query(`
    INSERT INTO public.members (
      id, user_id, email, name, code, executive_role, department, status, association_id, created_at, updated_at
    )
    VALUES ($1, $2, $3, $4, 'HN10-000', 'platform_admin', 'Ban Quản Trị Hệ Thống', 'active', $5, NOW(), NOW())
    ON CONFLICT (id) DO UPDATE
    SET user_id = EXCLUDED.user_id,
        email = EXCLUDED.email,
        name = EXCLUDED.name,
        executive_role = 'platform_admin',
        department = 'Ban Quản Trị Hệ Thống',
        status = 'active',
        association_id = EXCLUDED.association_id,
        updated_at = NOW();
  `, [adminUserId, adminUserId, adminEmail, adminName, assocId]);
  console.log('Upserted admin@ceohn10.vn in public.members');

  // 3. User roles
  await client.query('DELETE FROM public.user_roles WHERE user_id = $1::uuid', [adminUserId]);
  await client.query(`
    INSERT INTO public.user_roles (user_id, role, created_at)
    VALUES ($1::uuid, 'platform_admin', NOW())
  `, [adminUserId]);
  console.log('Updated user_roles for admin@ceohn10.vn');

  // 4. Memberships
  await client.query(
    'DELETE FROM public.memberships WHERE user_id = $1::uuid AND association_id = $2::uuid',
    [adminUserId, assocId]
  );
  await client.query(`
    INSERT INTO public.memberships (user_id, association_id, role, is_default, created_at, updated_at)
    VALUES ($1::uuid, $2::uuid, 'platform_admin', true, NOW(), NOW())
  `, [adminUserId, assocId]);
  console.log('Updated memberships for admin@ceohn10.vn');

  // 5. Test password verification
  const testMatch = await bcrypt.compare('123456', passwordHash);
  console.log('Bcrypt test match with 123456:', testMatch);

  // 6. Verify full account details
  const userCheck = await client.query('SELECT id, username, email, name FROM public.vione_users WHERE email = $1', [adminEmail]);
  const memberCheck = await client.query('SELECT id, user_id, email, name, executive_role, status FROM public.members WHERE email = $1', [adminEmail]);
  const roleCheck = await client.query('SELECT * FROM public.user_roles WHERE user_id = $1::uuid', [adminUserId]);
  const msCheck = await client.query('SELECT * FROM public.memberships WHERE user_id = $1::uuid', [adminUserId]);

  console.log('Verification:');
  console.log('- User:', userCheck.rows[0]);
  console.log('- Member:', memberCheck.rows[0]);
  console.log('- Roles:', roleCheck.rows);
  console.log('- Memberships:', msCheck.rows);

  await client.end();
  console.log('SUCCESS: Platform Admin admin@ceohn10.vn / 123456 is fully active in database 113.20.107.184:6432!');
}

main().catch(err => {
  console.error('Setup error:', err);
  process.exit(1);
});
