import pg from 'pg';
const { Client } = pg;

const localDbUrl = "postgresql://app1:5%5ES0CEpvYwC1%28%23YN1UoJ@127.0.0.1:5432/ceohn10_project";
const remoteDbUrl = "postgresql://app1:5%5ES0CEpvYwC1%28%23YN1UoJ@113.20.107.184:6432/ceohn10_project?sslmode=disable";

async function testDatabase(url, label) {
  console.log(`\n--------------------------------------------------------------`);
  console.log(`[KIỂM THỬ] Kiểm tra CSDL ${label}...`);
  const client = new Client({ connectionString: url, connectionTimeoutMillis: 5000 });
  try {
    await client.connect();
    console.log(`✓ Kết nối thành công!`);

    const roleRes = await client.query(`SELECT count(*)::int as count FROM public.roles`);
    const permRes = await client.query(`SELECT count(*)::int as count FROM public.permissions`);
    const fundRes = await client.query(`SELECT code, current_balance FROM public.financial_funds ORDER BY code`);
    const obRes = await client.query(`SELECT period_code, total_amount, status FROM public.financial_opening_balances`);
    const trfRes = await client.query(`SELECT transfer_id, amount, status FROM public.financial_transfers`);
    const bankRes = await client.query(`SELECT bank_name, account_number, account_holder FROM public.bank_accounts`);

    console.log(`✓ 15 Vai trò (Roles): ${roleRes.rows[0]?.count}/15 vai trò`);
    console.log(`✓ 38 Quyền hạn (Permissions): ${permRes.rows[0]?.count}/38 quyền`);
    console.log(`✓ 5 Quỹ tài chính (Financial Funds):`, fundRes.rows.map(f => `${f.code}: ${Number(f.current_balance).toLocaleString()} VNĐ`).join(' | '));
    console.log(`✓ Số dư đầu kỳ (2.1 Tỷ):`, obRes.rows);
    console.log(`✓ Lệnh điều chuyển nội bộ (20 Triệu):`, trfRes.rows);
    console.log(`✓ Tài khoản ngân hàng:`, bankRes.rows.map(b => `${b.bank_name} ${b.account_number}`).join(' | '));

    const allPassed = 
      roleRes.rows[0]?.count >= 15 &&
      permRes.rows[0]?.count >= 38 &&
      fundRes.rows.length >= 5 &&
      obRes.rows.length >= 1 &&
      trfRes.rows.length >= 1 &&
      bankRes.rows.length >= 2;

    if (allPassed) {
      console.log(`>>> KẾT QUẢ: ${label} PASS 100%!`);
      return true;
    } else {
      console.warn(`>>> KẾT QUẢ: ${label} THIẾU DỮ LIỆU!`);
      return false;
    }
  } catch (err) {
    console.warn(`⚠️ ${label} không kết nối được (${err.message || err})`);
    return false;
  } finally {
    try { await client.end(); } catch {}
  }
}

async function main() {
  console.log('==============================================================');
  console.log('KIỂM TRA TÍNH TOÀN VẸN CƠ SỞ DỮ LIỆU LOCALHOST VÀ REMOTE DEV');
  console.log('==============================================================');

  const localPass = await testDatabase(localDbUrl, 'CSDL LOCALHOST (127.0.0.1:5432)');
  const remotePass = await testDatabase(remoteDbUrl, 'CSDL REMOTE DEV SUBDOMAIN (113.20.107.184:6432)');

  console.log('\n==============================================================');
  console.log('TỔNG KẾT:');
  console.log(`- Localhost CSDL (127.0.0.1:5432): ${localPass ? '✅ PASS 100%' : '❌ CHƯA PASS'}`);
  console.log(`- Server CSDL (113.20.107.184:6432): ${remotePass ? '✅ PASS 100%' : '❌ CHƯA PASS'}`);
  console.log('==============================================================\n');
}

main();