const { chromium } = require('playwright');

async function testPlaywright() {
  console.log('Launching Chrome browser...');
  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: ['--ignore-certificate-errors', '--no-sandbox', '--disable-setuid-sandbox']
  });
  console.log('Browser launched successfully!');
  const context = await browser.newContext({
    ignoreHTTPSErrors: true,
    viewport: { width: 1440, height: 900 }
  });
  const page = await context.newPage();
  console.log('Navigating to https://14.225.217.232:10443/auth ...');
  await page.goto('https://14.225.217.232:10443/auth', { waitUntil: 'networkidle', timeout: 30000 });
  console.log('Page title:', await page.title());
  const fs = require('fs');
  fs.mkdirSync('test_evidence', { recursive: true });
  await page.screenshot({ path: 'test_evidence/00_auth_page.png' });
  console.log('Screenshot saved to test_evidence/00_auth_page.png');
  await browser.close();
}

testPlaywright().catch(err => {
  console.error('Playwright error:', err);
  process.exit(1);
});
