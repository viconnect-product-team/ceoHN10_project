import pg from 'pg';
const { Client } = pg;
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// STRICT DATABASE LAW: 113.20.107.184:6432
const remoteDbUrl = "postgresql://app1:5%5ES0CEpvYwC1%28%23YN1UoJ@113.20.107.184:6432/ceohn10_project?sslmode=disable";
const localDbUrl = "postgresql://app1:5%5ES0CEpvYwC1%28%23YN1UoJ@127.0.0.1:5432/ceohn10_project";

async function executeMigrationWithUrl(connectionString, label) {
  console.log(`\n======================================================`);
  console.log(`Đang kết nối tới ${label}...`);
  const client = new Client({
    connectionString,
    connectionTimeoutMillis: 7000,
  });

  try {
    await client.connect();
    console.log(`✓ Đã kết nối thành công tới ${label}!`);

    console.log('>>> [1/3] Đang đọc tệp migration scripts/migrate-rbac-and-finance.sql...');
    const sqlPath = path.resolve(__dirname, 'migrate-rbac-and-finance.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log(`>>> [2/3] Đang thực thi DDL Migration và Seeding trên ${label}...`);
    await client.query(sql);

    console.log(`>>> [3/3] Kiểm tra xác nhận dữ liệu trên ${label}:`);
    const roleCount = await client.query(`SELECT count(*)::int as count FROM public.roles`);
    const permCount = await client.query(`SELECT count(*)::int as count FROM public.permissions`);
    const fundCount = await client.query(`SELECT count(*)::int as count FROM public.financial_funds`);
    const obRows = await client.query(`SELECT period_code, total_amount, status FROM public.financial_opening_balances`);
    const trfRows = await client.query(`SELECT transfer_id, amount, status FROM public.financial_transfers`);
    const bankRows = await client.query(`SELECT bank_name, account_number, account_holder FROM public.bank_accounts`);

    console.log(`✓ Roles: ${roleCount.rows[0]?.count} vai trò`);
    console.log(`✓ Permissions: ${permCount.rows[0]?.count} quyền hạn`);
    console.log(`✓ Financial Funds: ${fundCount.rows[0]?.count} quỹ tài chính`);
    console.log(`✓ Opening Balances:`, obRows.rows);
    console.log(`✓ Financial Transfers (20M):`, trfRows.rows);
    console.log(`✓ Bank Accounts:`, bankRows.rows);
    console.log(`>>> HOÀN TẤT THÀNH CÔNG TRÊN ${label}!`);
    return true;
  } catch (err) {
    console.warn(`⚠️ Không thể kết nối hoặc thực thi trên ${label}:`, err.message || err);
    return false;
  } finally {
    try {
      await client.end();
    } catch {}
  }
}

async function main() {
  // 1. Thử trên CSDL chuẩn 113.20.107.184:6432
  const remoteOk = await executeMigrationWithUrl(remoteDbUrl, 'CSDL CHÍNH THỨC (113.20.107.184:6432)');
  
  // 2. Chạy trên CSDL Localhost
  const localOk = await executeMigrationWithUrl(localDbUrl, 'CSDL LOCALHOST (127.0.0.1:5432)');

  if (!remoteOk && !localOk) {
    throw new Error('Cả máy chủ CSDL chính thức và local đều không thể kết nối.');
  }
}

main().catch((e) => {
  console.error('❌ Lỗi kết thúc:', e.message);
  process.exit(1);
});
