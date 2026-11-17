const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const EVIDENCE_DIR = path.join(__dirname, '../test_evidence');
if (!fs.existsSync(EVIDENCE_DIR)) {
  fs.mkdirSync(EVIDENCE_DIR, { recursive: true });
}

const DB_CONN = 'postgresql://app1:5%5ES0CEpvYwC1%28%23YN1UoJ@113.20.107.184:6432/ceohn10_project?sslmode=disable';

async function queryDB(sql, params = []) {
  const client = new Client({ connectionString: DB_CONN });
  try {
    await client.connect();
    const res = await client.query(sql, params);
    return res.rows;
  } finally {
    await client.end().catch(() => {});
  }
}

async function runStep1() {
  console.log('--- KHỞI ĐỘNG PLAYWRIGHT VỚI GOOGLE CHROME ---');
  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: ['--ignore-certificate-errors', '--no-sandbox', '--disable-setuid-sandbox']
  });

  const context = await browser.newContext({
    ignoreHTTPSErrors: true,
    viewport: { width: 1440, height: 900 }
  });

  const page = await context.newPage();

  // Test 1: Đăng nhập admini@connect.vn
  console.log('[TEST 1] Đăng nhập Admin: admini@connect.vn');
  await page.goto('https://14.225.217.232:10443/auth', { waitUntil: 'networkidle', timeout: 30000 });
  await page.screenshot({ path: path.join(EVIDENCE_DIR, '01_login_page_admin.png'), fullPage: true });

  await page.fill('input[autoComplete="username"]', 'admini@connect.vn');
  await page.fill('input[type="password"]', '123456a@');
  await page.screenshot({ path: path.join(EVIDENCE_DIR, '02_admin_credentials_entered.png') });

  await page.click('button#crm-login-submit, button.ceo-login-submit, button[type="submit"]');
  await page.waitForNavigation({ waitUntil: 'networkidle', timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(3000);

  const currentUrl = page.url();
  console.log('Current URL after login:', currentUrl);
  await page.screenshot({ path: path.join(EVIDENCE_DIR, '03_admin_dashboard_home.png'), fullPage: true });

  await browser.close();
}

runStep1().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
