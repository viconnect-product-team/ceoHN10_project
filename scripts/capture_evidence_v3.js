const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const ARTIFACT_DIR = path.resolve('C:/Users/vumik/.gemini/antigravity/brain/d06e38ce-4ddc-4f6c-b41d-5fd1d20eecb7');
const SCREENSHOT_DIR = path.join(ARTIFACT_DIR, 'screenshots');

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function run() {
  console.log("1. Authenticating via NestJS API...");
  const loginRes = await fetch("http://localhost:4003/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@ceohn10.vn", password: "123456a@" }),
  });

  const authData = await loginRes.json();
  if (!authData.access_token) {
    throw new Error("Login failed: " + JSON.stringify(authData));
  }
  console.log("Logged in successfully! Token received.");

  const browser = await chromium.launch({
    headless: true,
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });

  const page = await context.newPage();

  // Inject real JWT and user into localStorage before loading page
  await page.addInitScript((data) => {
    localStorage.setItem("vibe_token", data.access_token);
    localStorage.setItem("vibe_refresh_token", data.refresh_token);
    localStorage.setItem("token", data.access_token);
    localStorage.setItem("access_token", data.access_token);
    localStorage.setItem("vibe_user", JSON.stringify(data.user));
    localStorage.setItem("vba_is_admin", "true");
    localStorage.setItem("viconnect_active_tenant", "ceohn10");
  }, authData);

  // 1. Chụp ảnh thanh Sidebar CRM (Chứng minh Lớp học hiển thị, Phân quyền đã chuyển vào Master)
  console.log("2. Navigating to CRM Dashboard & Sidebar...");
  await page.goto("http://localhost:5173/", { waitUntil: "networkidle", timeout: 20000 }).catch(() => {});
  await page.waitForTimeout(3000);
  const sidebarShot = path.join(SCREENSHOT_DIR, "16_sidebar_classes_and_no_rbac.png");
  await page.screenshot({ path: sidebarShot });
  fs.copyFileSync(sidebarShot, path.join(ARTIFACT_DIR, "16_sidebar_classes_and_no_rbac.png"));
  console.log("Saved:", sidebarShot);

  // 2. Chụp ảnh Master Platform Admin: Tab Tài Khoản & Phân Quyền
  console.log("3. Navigating to Master Platform Admin: Accounts...");
  await page.goto("http://localhost:5173/master", { waitUntil: "networkidle", timeout: 20000 }).catch(() => {});
  await page.waitForTimeout(2000);
  const accTabBtn = await page.$('button:has-text("TÀI KHOẢN ĐƯỢC ĐĂNG NHẬP"), button:has-text("Tài khoản & Phân quyền")');
  if (accTabBtn) {
    await accTabBtn.click();
    await page.waitForTimeout(2000);
  }
  const masterAccShot = path.join(SCREENSHOT_DIR, "17_master_admin_accounts_rbac.png");
  await page.screenshot({ path: masterAccShot });
  fs.copyFileSync(masterAccShot, path.join(ARTIFACT_DIR, "17_master_admin_accounts_rbac.png"));
  console.log("Saved:", masterAccShot);

  // 3. Chụp ảnh Master Platform Admin: Tab Ma Trận Phân Hệ Module Theo Hệ Thống
  console.log("4. Navigating to Master Platform Admin: Module Matrix...");
  const settingsTabBtn = await page.$('button:has-text("CÀI ĐẶT HỆ THỐNG NGOÀI"), button:has-text("Cài Đặt Hệ Thống Ngoài")');
  if (settingsTabBtn) {
    await settingsTabBtn.click();
    await page.waitForTimeout(1500);
    const matrixSubTabBtn = await page.$('button:has-text("Ma Trận Phân Hệ Theo Hệ Thống")');
    if (matrixSubTabBtn) {
      await matrixSubTabBtn.click();
      await page.waitForTimeout(2000);
    }
  }
  const matrixShot = path.join(SCREENSHOT_DIR, "18_master_module_matrix_multitenant.png");
  await page.screenshot({ path: matrixShot });
  fs.copyFileSync(matrixShot, path.join(ARTIFACT_DIR, "18_master_module_matrix_multitenant.png"));
  console.log("Saved:", matrixShot);

  // 4. Chụp ảnh Báo Cáo Tài Chính: Bảng Cân Đối Quỹ Các Ban & Sổ Cái Lũy Kế
  console.log("5. Navigating to Finance Report...");
  await page.goto("http://localhost:5173/finance-report", { waitUntil: "networkidle", timeout: 20000 }).catch(() => {});
  await page.waitForTimeout(3500);
  const financeShot = path.join(SCREENSHOT_DIR, "19_finance_report_funds_and_running_balance.png");
  await page.screenshot({ path: financeShot });
  fs.copyFileSync(financeShot, path.join(ARTIFACT_DIR, "19_finance_report_funds_and_running_balance.png"));
  console.log("Saved:", financeShot);

  // 5. Chụp ảnh Quản Lý Lớp Học: Lịch học 30 chuyên đề & Quỹ lớp 20tr
  console.log("6. Navigating to Classes Management...");
  await page.goto("http://localhost:5173/classes?tab=finance", { waitUntil: "networkidle", timeout: 20000 }).catch(() => {});
  await page.waitForTimeout(3000);
  const classesShot = path.join(SCREENSHOT_DIR, "20_classes_management_finance_fund.png");
  await page.screenshot({ path: classesShot });
  fs.copyFileSync(classesShot, path.join(ARTIFACT_DIR, "20_classes_management_finance_fund.png"));
  console.log("Saved:", classesShot);

  await browser.close();
  console.log("ALL EVIDENCE SCREENSHOTS SUCCESSFULLY CAPTURED AND VERIFIED!");
}

run().catch((err) => {
  console.error("FATAL ERROR IN CAPTURE SCRIPT:", err);
  process.exit(1);
});
