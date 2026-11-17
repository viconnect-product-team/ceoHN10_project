const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function renderVoaImage() {
  console.log('Rendering assets/voa_ceohn10.html to PNG and JPG...');
  
  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: ['--ignore-certificate-errors', '--disable-web-security', '--allow-file-access-from-files']
  });

  const page = await browser.newPage({
    viewport: { width: 1440, height: 2200 },
    deviceScaleFactor: 2
  });

  const htmlPath = path.resolve(__dirname, '..', 'assets', 'voa_ceohn10.html');
  const fileUrl = 'file:///' + htmlPath.replace(/\\/g, '/');

  console.log('Navigating to:', fileUrl);
  await page.goto(fileUrl, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2000);

  const pngPath = path.resolve(__dirname, '..', 'assets', 'voa_ceohn10.png');
  const jpgPath = path.resolve(__dirname, '..', 'assets', 'voa_ceohn10.jpg');

  // Screenshot full page
  await page.screenshot({
    path: pngPath,
    fullPage: true
  });
  console.log(`Saved PNG: ${pngPath} (${fs.statSync(pngPath).size} bytes)`);

  await page.screenshot({
    path: jpgPath,
    quality: 95,
    type: 'jpeg',
    fullPage: true
  });
  console.log(`Saved JPG: ${jpgPath} (${fs.statSync(jpgPath).size} bytes)`);

  await browser.close();
  console.log('Rendering completed successfully!');
}

renderVoaImage().catch(err => {
  console.error('Error rendering VOA image:', err);
  process.exit(1);
});
