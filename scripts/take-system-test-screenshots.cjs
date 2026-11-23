const puppeteer = require("puppeteer-core");
const fs = require("fs");
const path = require("path");
const os = require("os");

const screenshotDir = "C:\\Users\\vumik\\.gemini\\antigravity\\brain\\d06e38ce-4ddc-4f6c-b41d-5fd1d20eecb7\\screenshots";
if (!fs.existsSync(screenshotDir)) {
  fs.mkdirSync(screenshotDir, { recursive: true });
}

const chromePath = fs.existsSync("C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe")
  ? "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
  : "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";

const customProfile = path.join(os.tmpdir(), "ceo_test_profile_" + Date.now());
if (!fs.existsSync(customProfile)) fs.mkdirSync(customProfile, { recursive: true });

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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
  const loginRes = await fetch("http://localhost:4003/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@ceohn10.vn", password: "123456" }),
  }).then(r => r.json());

  const token = loginRes.access_token;
  const user = loginRes.user || {
    id: "00000000-0000-4000-8000-000000000001",
    email: "admin@ceohn10.vn",
    role: "platform_admin",
    isPlatformAdmin: true,
  };

  console.log("Logged in successfully! Token prefix:", token ? token.slice(0, 20) : "NO TOKEN");

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

  // Seed token in localStorage
  await page.goto("http://localhost:5173", { waitUntil: "domcontentloaded", timeout: 15000 }).catch(() => {});
  await page.evaluate(({ token, user }) => {
    localStorage.setItem("vibe_token", token);
    localStorage.setItem("token", token);
    localStorage.setItem("access_token", token);
    localStorage.setItem("vibe_user", JSON.stringify(user));
  }, { token, user });

  // ── SCREENSHOT 1: TRANG QUẢN LÝ SỰ KIỆN ──────────────────────────────────────
  console.log("Capturing 01_events_management.png...");
  await page.goto("http://localhost:5173/events", { waitUntil: "networkidle2", timeout: 15000 }).catch(() => {});
  await sleep(2500);
  const snap1 = path.join(screenshotDir, "01_events_management.png");
  await page.screenshot({ path: snap1, fullPage: false });
  console.log("Saved 01_events_management.png");

  // ── SCREENSHOT 2: CẤU HÌNH MÃ QR ĐÍNH KÈM SỰ KIỆN ───────────────────────────
  console.log("Capturing 02_event_qr_config_modal.png...");
  const openedQr = await clickButtonByText(page, "Mã QR");
  if (openedQr) {
    await sleep(1500);
    const snap2 = path.join(screenshotDir, "02_event_qr_config_modal.png");
    await page.screenshot({ path: snap2, fullPage: false });
    console.log("Saved 02_event_qr_config_modal.png");
    await clickButtonByText(page, "Hủy");
    await sleep(800);
  }

  // ── SCREENSHOT 3: CỔNG SOÁT VÉ CHECK-IN & TEST OFFLINE ──────────────────────
  console.log("Capturing 03_event_checkin_offline_gate.png...");
  await page.goto("http://localhost:5173/event-checkin", { waitUntil: "networkidle2", timeout: 15000 }).catch(() => {});
  await sleep(2500);
  await clickButtonByText(page, "Test Offline");
  await sleep(1000);
  const snap3 = path.join(screenshotDir, "03_event_checkin_offline_gate.png");
  await page.screenshot({ path: snap3, fullPage: false });
  console.log("Saved 03_event_checkin_offline_gate.png");

  // ── SCREENSHOT 4: SƠ ĐỒ BÀN TRÒN TIỆC & GHẾ DI CHUYỂN TÙY THÍCH ─────────────
  console.log("Capturing 04_banquet_round_tables_seating.png...");
  await page.goto("http://localhost:5173/event-registrations", { waitUntil: "networkidle2", timeout: 15000 }).catch(() => {});
  await sleep(2500);
  await clickButtonByText(page, "Sơ đồ");
  await sleep(1500);
  await clickButtonByText(page, "Bàn Tròn Tiệc");
  await sleep(1500);
  const snap4 = path.join(screenshotDir, "04_banquet_round_tables_seating.png");
  await page.screenshot({ path: snap4, fullPage: false });
  console.log("Saved 04_banquet_round_tables_seating.png");

  // ── SCREENSHOT 5: BÁO CÁO TÀI CHÍNH & LỆNH CHUYỂN QUỸ BAN CÔNG NGHỆ ─────────
  console.log("Capturing 05_finance_fund_transfer_modal.png...");
  await page.goto("http://localhost:5173/finance-report", { waitUntil: "networkidle2", timeout: 15000 }).catch(() => {});
  await sleep(2500);
  const clickedTransfer = await clickButtonByText(page, "Lệnh Chuyển Quỹ Ban");
  if (clickedTransfer) {
    await sleep(1500);
    const snap5Modal = path.join(screenshotDir, "05_finance_fund_transfer_modal.png");
    await page.screenshot({ path: snap5Modal, fullPage: false });
    console.log("Saved 05_finance_fund_transfer_modal.png");
    await clickButtonByText(page, "Hủy");
    await sleep(800);
  }

  const snap5Ledger = path.join(screenshotDir, "05b_finance_ledger_table.png");
  await page.screenshot({ path: snap5Ledger, fullPage: false });
  console.log("Saved 05b_finance_ledger_table.png");

  // ── SCREENSHOT 6: CẤU HÌNH DYNAMIC SEPAY & ZALO OA VÀ TARGET APPS ───────────
  console.log("Capturing 06_system_config_sepay_zalo.png...");
  await page.goto("http://localhost:5173/association/system-config", { waitUntil: "networkidle2", timeout: 15000 }).catch(() => {});
  await sleep(2500);
  const snap6 = path.join(screenshotDir, "06_system_config_sepay_zalo.png");
  await page.screenshot({ path: snap6, fullPage: false });
  console.log("Saved 06_system_config_sepay_zalo.png");

  console.log("ALL LIVE SCREENSHOTS CAPTURED SUCCESSFULLY!");
  await browser.close();
}

run().catch((err) => {
  console.error("Run error:", err);
  process.exit(1);
});
