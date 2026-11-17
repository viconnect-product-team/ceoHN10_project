const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function exportPdf() {
  const rootDir = path.resolve(__dirname, '..');
  const htmlPath = path.join(rootDir, 'document', 'SLIDE_TRINH_BAY_PHAN_MEM_CEOHN10.html');
  const pdfPath = path.join(rootDir, 'document', 'SLIDE_TRINH_BAY_PHAN_MEM_CEOHN10.pdf');

  console.log(`Exporting ${htmlPath} to ${pdfPath}...`);

  let browser;
  try {
    browser = await chromium.launch({
      executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      headless: true
    });
  } catch (err) {
    console.log('Falling back to bundled chromium...');
    browser = await chromium.launch({ headless: true });
  }

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 2
  });

  const page = await context.newPage();
  const fileUrl = 'file:///' + htmlPath.replace(/\\/g, '/');
  
  await page.goto(fileUrl, { waitUntil: 'networkidle' });

  // Wait a short moment to ensure images and fonts are fully settled
  await page.waitForTimeout(1000);

  await page.pdf({
    path: pdfPath,
    format: 'A4',
    landscape: true,
    printBackground: true,
    margin: { top: 0, bottom: 0, left: 0, right: 0 }
  });

  await browser.close();

  const stats = fs.statSync(pdfPath);
  console.log(`✅ Xuất thành công Slide PDF CEO HN10: ${pdfPath} (${(stats.size / 1024).toFixed(1)} KB)`);
}

exportPdf().catch((err) => {
  console.error('Lỗi khi xuất PDF:', err);
  process.exit(1);
});
