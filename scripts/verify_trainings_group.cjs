const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function main() {
  console.log('Testing and capturing screenshots for Training Group Menu Tree...');
  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: ['--ignore-certificate-errors', '--disable-web-security']
  });

  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 }
  });

  const evidenceDir = path.resolve(__dirname, '..', 'test_evidence');

  // Đăng nhập admin
  console.log('Logging in admin...');
  await page.goto('https://14.225.217.232:10443/auth', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2000);

  const emailInputs = await page.$$('input[type="email"], input[name="email"], input[placeholder*="email" i], input[type="text"]');
  if (emailInputs.length > 0) {
    await emailInputs[0].fill('admini@connect.vn');
  }
  const passwordInputs = await page.$$('input[type="password"]');
  if (passwordInputs.length > 0) {
    await passwordInputs[0].fill('123456a@');
  }
  const submitBtns = await page.$$('button[type="submit"], button:has-text("Đăng nhập")');
  if (submitBtns.length > 0) {
    await submitBtns[0].click();
    await page.waitForTimeout(4000);
  }

  // 1. Kiểm tra Tab 1: Tất cả lớp học & Khóa học (/trainings?tab=all)
  console.log('Navigating to /trainings?tab=all...');
  await page.goto('https://14.225.217.232:10443/trainings?tab=all', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(3000);
  await page.screenshot({ path: path.join(evidenceDir, '31_trainings_tab_all_courses.png'), fullPage: false });
  console.log('Saved 31_trainings_tab_all_courses.png');

  // 2. Kiểm tra Tab 2: Xem & Thiết lập buổi học (/trainings?tab=sessions)
  console.log('Navigating to /trainings?tab=sessions...');
  await page.goto('https://14.225.217.232:10443/trainings?tab=sessions', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(3000);
  await page.screenshot({ path: path.join(evidenceDir, '32_trainings_tab_sessions_setup.png'), fullPage: false });
  console.log('Saved 32_trainings_tab_sessions_setup.png');

  // 3. Kiểm tra Tab 3: Nhật ký khóa học đã diễn ra (/trainings?tab=history)
  console.log('Navigating to /trainings?tab=history...');
  await page.goto('https://14.225.217.232:10443/trainings?tab=history', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(3000);
  await page.screenshot({ path: path.join(evidenceDir, '33_trainings_tab_history_logs.png'), fullPage: false });
  console.log('Saved 33_trainings_tab_history_logs.png');

  await browser.close();
  console.log('✅ Hoàn tất kiểm thử và chụp ảnh nhóm chức năng Lớp học & Đào tạo!');
}

main().catch(console.error);
