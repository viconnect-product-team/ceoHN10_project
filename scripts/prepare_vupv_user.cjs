const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://app1:5%5ES0CEpvYwC1%28%23YN1UoJ@113.20.107.184:6432/ceohn10_project?sslmode=disable'
});

async function run() {
  try {
    await client.connect();
    const vupId = '00000000-0000-4000-8000-000000000005';

    const getAssoc = await client.query(`SELECT association_id FROM members WHERE association_id IS NOT NULL LIMIT 1`);
    const assocId = getAssoc.rows[0]?.association_id || '00000000-0000-4000-8000-000000000001';

    // Insert into members
    const checkMem = await client.query(`SELECT * FROM members WHERE email = 'vupv090120@gmail.com'`);
    if (checkMem.rows.length === 0) {
      await client.query(`
        INSERT INTO members (id, code, association_id, user_id, name, email, phone, status, department, executive_role, created_at, updated_at)
        VALUES ('mem-vupv090120', 'HN10-099', $1, $2, 'Vũ Phan Vũ', 'vupv090120@gmail.com', '0912345678', 'active', 'Ban Học tập', 'hoi_vien', NOW(), NOW())
      `, [assocId, vupId]);
      console.log('Inserted into members');
    }

    // Insert into ceohn10_members
    const checkCeoMem = await client.query(`SELECT * FROM ceohn10_members WHERE email = 'vupv090120@gmail.com'`);
    if (checkCeoMem.rows.length === 0) {
      await client.query(`
        INSERT INTO ceohn10_members (id, code, association_id, user_id, name, email, phone, status, department, executive_role, created_at, updated_at)
        VALUES ('ceomem-vupv090120', 'HN10-099', $1, $2, 'Vũ Phan Vũ', 'vupv090120@gmail.com', '0912345678', 'active', 'Ban Học tập', 'hoi_vien', NOW(), NOW())
      `, [assocId, vupId]);
      console.log('Inserted into ceohn10_members');
    }

    console.log('Completed successfully!');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

run();
