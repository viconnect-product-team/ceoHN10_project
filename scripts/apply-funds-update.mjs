import pg from 'pg';
const { Client } = pg;
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const remoteDbUrl = "postgresql://app1:5%5ES0CEpvYwC1%28%23YN1UoJ@113.20.107.184:6432/ceohn10_project?sslmode=disable";
const localDbUrl = "postgresql://app1:5%5ES0CEpvYwC1%28%23YN1UoJ@127.0.0.1:5432/ceohn10_project";

async function executeFundsUpdate(connectionString, label) {
  console.log(`\n======================================================`);
  console.log(`Đang kết nối tới ${label}...`);
  const client = new Client({
    connectionString,
    connectionTimeoutMillis: 7000,
  });

  try {
    await client.connect();
    console.log(`✓ Kết nối thành công tới ${label}!`);

    const sqlPath = path.resolve(__dirname, 'update-funds-structure-and-balances.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log(`>>> Đang thực thi cập nhật 8 Quỹ & Dòng tiền Vào/Ra trên ${label}...`);
    await client.query(sql);

    console.log(`>>> Kiểm tra xác nhận dữ liệu trên ${label}:`);
    const fundsRes = await client.query(`SELECT code, name, current_balance FROM public.financial_funds ORDER BY current_balance DESC`);
    const trfRes = await client.query(`SELECT transfer_id, amount, status FROM public.financial_transfers`);
    const obRes = await client.query(`SELECT period_code, total_amount, status FROM public.financial_opening_balances`);

    console.log(`✓ Danh sách các Quỹ sau cập nhật:`);
    for (const f of fundsRes.rows) {
      console.log(`   - ${f.name} (${f.code}): ${Number(f.current_balance).toLocaleString('vi-VN')} VNĐ`);
    }
    console.log(`✓ Lệnh điều chuyển nội bộ:`, trfRes.rows);
    console.log(`✓ Số dư đầu kỳ khởi tạo:`, obRes.rows);
    console.log(`>>> HOÀN TẤT THÀNH CÔNG TRÊN ${label}!`);
    return true;
  } catch (err) {
    console.warn(`⚠️ Không thể kết nối hoặc thực thi trên ${label}:`, err.message || err);
    return false;
  } finally {
    try { await client.end(); } catch {}
  }
}

async function main() {
  const remoteOk = await executeFundsUpdate(remoteDbUrl, 'CSDL CHÍNH THỨC (113.20.107.184:6432)');
  const localOk = await executeFundsUpdate(localDbUrl, 'CSDL LOCALHOST (127.0.0.1:5432)');

  if (!remoteOk && !localOk) {
    throw new Error('Cả máy chủ CSDL chính thức và local đều không thể thực thi.');
  }
}

main().catch((e) => {
  console.error('❌ Lỗi kết thúc:', e.message);
  process.exit(1);
});
