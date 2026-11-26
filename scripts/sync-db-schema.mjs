#!/usr/bin/env node
/**
 * Đồng bộ CHỈ CẤU TRÚC BẢNG & CỘT (Schema-Only, tuyệt đối không copy dữ liệu)
 * từ Server Subdomain (REMOTE_DATABASE_URL) -> Localhost (LOCAL_DATABASE_URL).
 *
 * Dùng:
 *   node scripts/sync-db-schema.mjs          # Kiểm tra & tự tạo bảng/cột còn thiếu ở Localhost
 *   node scripts/sync-db-schema.mjs --diff   # Chỉ xem bảng/cột lệch nhau giữa Server và Local
 */
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { Client } = require('pg');

function loadEnv(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const out = {};
  for (const line of fs.readFileSync(filePath, 'utf-8').split(/\r?\n/)) {
    const m = line.match(/^\s*([\w.-]+)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    let v = (m[2] || '').trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    out[m[1]] = v;
  }
  return out;
}

const rootEnv = loadEnv(path.resolve('.env'));
const beEnv = loadEnv(path.resolve('apps/ceohn10_app_be/.env.local'));
const remoteUrl =
  process.env.REMOTE_DATABASE_URL ||
  beEnv.REMOTE_DATABASE_URL ||
  rootEnv.REMOTE_DATABASE_URL ||
  'postgresql://app1:5%5ES0CEpvYwC1%28%23YN1UoJ@113.20.107.184:6432/ceohn10_project?pgbouncer=true';
const localUrl =
  process.env.LOCAL_DATABASE_URL ||
  beEnv.LOCAL_DATABASE_URL ||
  rootEnv.LOCAL_DATABASE_URL ||
  'postgresql://app1:5%5ES0CEpvYwC1%28%23YN1UoJ@127.0.0.1:5432/ceohn10_project';

const diffOnly = process.argv.includes('--diff');

async function getSchemaMap(client) {
  const { rows } = await client.query(`
    SELECT
      c.table_name,
      c.column_name,
      c.data_type,
      c.udt_name,
      c.is_nullable,
      c.column_default
    FROM information_schema.columns c
    JOIN information_schema.tables t
      ON t.table_schema = c.table_schema AND t.table_name = c.table_name
    WHERE c.table_schema = 'public' AND t.table_type = 'BASE TABLE'
    ORDER BY c.table_name, c.ordinal_position
  `);
  const map = new Map();
  for (const r of rows) {
    if (!map.has(r.table_name)) map.set(r.table_name, []);
    map.get(r.table_name).push(r);
  }
  return map;
}

function sqlType(col) {
  if (col.data_type === 'ARRAY') {
    const base = col.udt_name.startsWith('_') ? col.udt_name.slice(1) : col.udt_name;
    return `${base}[]`;
  }
  if (col.data_type === 'USER-DEFINED') return col.udt_name;
  return col.data_type;
}

async function main() {
  const remote = new Client({ connectionString: remoteUrl });
  const local = new Client({ connectionString: localUrl });

  await remote.connect();
  await local.connect();

  const remoteMap = await getSchemaMap(remote);
  const localMap = await getSchemaMap(local);

  let missingTables = 0;
  let missingCols = 0;

  for (const [table, rCols] of remoteMap.entries()) {
    const lCols = localMap.get(table);
    if (!lCols) {
      missingTables++;
      console.log(`[MISSING TABLE ở Local] public.${table} (${rCols.length} cột)`);
      if (!diffOnly) {
        const colDefs = rCols
          .map((c) => `"${c.column_name}" ${sqlType(c)}${c.is_nullable === 'NO' && c.column_default ? ' NOT NULL' : ''}`)
          .join(', ');
        await local.query(`CREATE TABLE IF NOT EXISTS public."${table}" (${colDefs});`).catch((e) => {
          console.warn(`  -> Bỏ qua tạo bảng ${table}: ${e.message}`);
        });
      }
      continue;
    }

    const lSet = new Set(lCols.map((c) => c.column_name));
    for (const c of rCols) {
      if (!lSet.has(c.column_name)) {
        missingCols++;
        console.log(`[MISSING COL ở Local] public.${table}.${c.column_name} (${sqlType(c)})`);
        if (!diffOnly) {
          await local
            .query(`ALTER TABLE public."${table}" ADD COLUMN IF NOT EXISTS "${c.column_name}" ${sqlType(c)};`)
            .catch((e) => {
              console.warn(`  -> Bỏ qua cột ${table}.${c.column_name}: ${e.message}`);
            });
        }
      }
    }
  }

  for (const [table, lCols] of localMap.entries()) {
    if (!remoteMap.has(table)) {
      console.log(`[CHỈ CÓ Ở LOCAL] public.${table} (${lCols.length} cột) — nhớ thêm vào SchemaSyncService / Prisma schema để deploy lên Server!`);
    }
  }

  console.log(`\nHoàn tất: ${missingTables} bảng thiếu, ${missingCols} cột thiếu ở Local.`);
  await remote.end();
  await local.end();
}

main().catch((err) => {
  console.error('Lỗi đồng bộ schema:', err.message);
  process.exit(1);
});
