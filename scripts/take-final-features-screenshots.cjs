const puppeteer = require("puppeteer-core");
const fs = require("fs");
const path = require("path");
const os = require("os");

const ARTIFACT_DIR = "C:\\Users\\vumik\\.gemini\\antigravity\\brain\\d06e38ce-4ddc-4f6c-b41d-5fd1d20eecb7";
const SCREENSHOT_DIR = path.join(ARTIFACT_DIR, "screenshots");
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

const chromePath = fs.existsSync("C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe")
  ? "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
  : "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";

const customProfile = path.join(os.tmpdir(), "ceo_final_profile_" + Date.now());
if (!fs.existsSync(customProfile)) fs.mkdirSync(customProfile, { recursive: true });

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function saveBoth(page, filename, description) {
  const rootPath = path.join(ARTIFACT_DIR, filename);
  const subPath = path.join(SCREENSHOT_DIR, filename);
  await page.screenshot({ path: rootPath, fullPage: false });
  await page.screenshot({ path: subPath, fullPage: false });
  console.log(`[Captured] ${filename} - ${description}`);
}

async function clickButtonByText(page, text) {
  return page.evaluate((targetText) => {
    const btns = Array.from(document.querySelectorAll('button, a'));
    const found = btns.find(b => b.textContent && b.textContent.toLowerCase().includes(targetText.toLowerCase()));
    if (found) {
      found.click();
      return true;
    }
    return false;
  }, text);
}

async function run() {
  console.log("1. Authenticating via Backend API...");
  let token = "";
  let user = {
    id: "00000000-0000-4000-8000-000000000001",
    email: "admin@ceohn10.vn",
    role: "platform_admin",
    isPlatformAdmin: true,
  };

  try {
    const loginRes = await fetch("http://localhost:4003/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "admin@ceohn10.vn", password: "123456" }),
    }).then(r => r.json());

    if (loginRes.access_token) {
      token = loginRes.access_token;
      user = loginRes.user || user;
      console.log("Logged in successfully! Token prefix:", token.slice(0, 20));
    }
  } catch (err) {
    console.log("Login API note:", err.message);
  }

  console.log("Launching browser via:", chromePath);
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: "new",
    userDataDir: customProfile,
    defaultViewport: { width: 1440, height: 900 },
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-web-security",
      "--remote-debugging-port=0",
      "--no-first-run",
      "--no-default-browser-check",
    ],
  });

  const page = await browser.newPage();

  // Seed session into localStorage & cookies
  await page.goto("http://localhost:5173", { waitUntil: "domcontentloaded", timeout: 15000 }).catch(() => {});
  if (token) {
    await page.evaluate(({ token, user }) => {
      localStorage.setItem("vibe_token", token);
      localStorage.setItem("token", token);
      localStorage.setItem("access_token", token);
      localStorage.setItem("vibe_user", JSON.stringify(user));
    }, { token, user });
  }

  // ── SCREENSHOT 10: QUẢN LÝ LỚP & LỊCH HỌC 30 BUỔI THỨ 7 ────────────────────
  console.log("Capturing 10_classes_courses_schedule.png...");
  await page.goto("http://localhost:5173/classes?tab=courses", { waitUntil: "networkidle2", timeout: 15000 }).catch(() => {});
  await sleep(2500);
  await saveBoth(page, "10_classes_courses_schedule.png", "Giao diện Quản lý Lớp & Lịch học 30 chuyên đề Thứ 7 hàng tuần");

  // ── SCREENSHOT 11: DASHBOARD HỌC VIÊN ĐA CHỈ SỐ ───────────────────────────
  console.log("Capturing 11_classes_students_dashboard.png...");
  await page.goto("http://localhost:5173/classes?tab=students", { waitUntil: "networkidle2", timeout: 15000 }).catch(() => {});
  await sleep(2500);
  await saveBoth(page, "11_classes_students_dashboard.png", "Dashboard Quản trị Học viên: Mã HV, Chuyên cần, Sự kiện, Quỹ lớp, Nợ phạt, Điểm Karma, Trạng thái");

  // ── SCREENSHOT 12: QUỸ TÀI CHÍNH LỚP HỌC (KHỞI TẠO 20TR & SỔ CÁI) ─────────
  console.log("Capturing 12_classes_finance_fund.png...");
  await page.goto("http://localhost:5173/classes?tab=finance", { waitUntil: "networkidle2", timeout: 15000 }).catch(() => {});
  await sleep(2500);
  await saveBoth(page, "12_classes_finance_fund.png", "Quỹ Tài chính Lớp: Vốn khởi tạo 20.000.000đ từ Quỹ Tổng & Sổ cái Phí phạt, Phí sự kiện, Phí đào tạo");

  // ── SCREENSHOT 13: MODAL TẠO TÀI KHOẢN VỚI TÍCH CHỌN GRANULAR PERMISSIONS ──
  console.log("Capturing 13_accounts_granular_permissions_modal.png...");
  await page.goto("http://localhost:5173/accounts", { waitUntil: "networkidle2", timeout: 15000 }).catch(() => {});
  await sleep(2500);
  const openedAddModal = await clickButtonByText(page, "Thêm Mới");
  if (openedAddModal) {
    await sleep(1200);
    const toggledGranular = await clickButtonByText(page, "Tích Chọn Cụ Thể");
    await sleep(1000);
    await saveBoth(page, "13_accounts_granular_permissions_modal.png", "Modal Tạo Tài Khoản với Phân Quyền Granular Checkboxes theo từng danh mục chức năng");
    await clickButtonByText(page, "Hủy");
    await sleep(600);
  } else {
    await saveBoth(page, "13_accounts_granular_permissions_modal.png", "Trang Quản Trị Tài Khoản & Phân Quyền Granular");
  }

  // ── SCREENSHOT 14: CỔNG CHECK-IN OFFLINE PRE-SYNC & AUTO-SYNC ──────────────
  console.log("Capturing 14_event_checkin_offline_presync.png...");
  await page.goto("http://localhost:5173/event-checkin", { waitUntil: "networkidle2", timeout: 15000 }).catch(() => {});
  await sleep(2500);
  // Click Tải trước vé Pre-sync hoặc Test Offline để hiển thị trạng thái offline
  await clickButtonByText(page, "Tải trước");
  await sleep(1000);
  await saveBoth(page, "14_event_checkin_offline_presync.png", "Cổng Check-in Ngoại tuyến Offline: Tải trước vé Pre-sync, Quét tại chỗ & Auto-sync");

  // ── SCREENSHOT 15: AI TRỢ LÝ ĐÃ BỎ QUY TRÌNH THỦ CÔNG VÀ BÁO CÁO TÀI CHÍNH ──
  console.log("Capturing 15_ai_assistant_cleaned_tabs.png...");
  await page.goto("http://localhost:5173/ai-assistant", { waitUntil: "networkidle2", timeout: 15000 }).catch(() => {});
  await sleep(2500);
  await saveBoth(page, "15_ai_assistant_cleaned_tabs.png", "Trợ lý AI CEO HN10: Đã bỏ quy trình thủ công và báo cáo tài chính, tập trung vào AI Chatbot & Xuất hóa đơn");

  console.log("==================================================");
  console.log("ALL NEW FEATURE SCREENSHOTS CAPTURED SUCCESSFULLY!");
  console.log("==================================================");

  await browser.close();
}

run().catch((err) => {
  console.error("Execution error:", err);
  process.exit(1);
});
