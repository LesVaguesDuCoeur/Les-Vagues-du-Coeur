const puppeteer = require('puppeteer');

const pagesToTest = ['index.html', 'setup.html', 'admin.html', 'emergency.html', 'vault.html', 'testament.html'];

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });

  for (const pageName of pagesToTest) {
      const page = await browser.newPage();
      page.on('console', msg => {
          if (msg.type() === 'error') {
              console.log(`[${pageName}] ERROR:`, msg.text());
          }
      });
      page.on('pageerror', error => {
          console.log(`[${pageName}] PAGE ERROR:`, error.message);
      });

      try {
          await page.goto(`http://localhost:8000/${pageName}`, { waitUntil: 'networkidle0' });
          console.log(`[${pageName}] OK`);
      } catch (e) {
          console.log(`[${pageName}] FAILED TO LOAD:`, e);
      }
      await page.close();
  }

  await browser.close();
})();
