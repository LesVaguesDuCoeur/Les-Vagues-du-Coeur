const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  let errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push({url: page.url(), text: msg.text()});
    }
  });

  page.on('pageerror', error => {
    errors.push({url: page.url(), text: error.message});
  });

  // Block fonts to avoid timeout
  await page.route('**/*.{ttf,woff,woff2}', route => route.abort());

  // Also block some cdns to avoid net::ERR_FAILED if network is weird
  // Actually we shouldn't block them if we want to test JS compilation
  // Let's just catch them.

  const urls = [
    'http://localhost:8000/index.html',
    'http://localhost:8000/setup.html',
    'http://localhost:8000/admin.html',
    'http://localhost:8000/emergency.html',
    'http://localhost:8000/vault.html',
    'http://localhost:8000/testament.html',
  ];

  for (const url of urls) {
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 10000 });
      console.log(`Visited: ${url}`);
      // Wait a bit to let JS run
      await page.waitForTimeout(500);
    } catch (e) {
      console.error(`Failed to visit ${url}: ${e.message}`);
      errors.push({url: url, text: `Failed to visit ${url}: ${e.message}`});
    }
  }

  await browser.close();

  // Filter out ERR_FAILED for external resources as we might not have internet in sandbox
  const realErrors = errors.filter(e => !e.text.includes('net::ERR_FAILED') && !e.text.includes('Failed to load resource'));

  if (realErrors.length > 0) {
    console.error('Console errors found:');
    realErrors.forEach(e => console.error(`${e.url}: ${e.text}`));
    process.exit(1);
  } else {
    console.log('No console errors found. Success!');
    process.exit(0);
  }
})();