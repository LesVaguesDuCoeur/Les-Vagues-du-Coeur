const puppeteer = require('puppeteer');
const cheerio = require('cheerio');

async function scrapeHelloWork(query, location) {
    let browser;
    try {
        browser = await puppeteer.launch({
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1920,1080']
        });
        const page = await browser.newPage();

        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36');

        const baseUrl = 'https://www.hellowork.com/fr-fr/emploi/recherche.html';
        const url = `${baseUrl}?k=${encodeURIComponent(query)}&l=${encodeURIComponent(location)}`;

        console.log(`[HelloWork] Scraping: ${url}`);

        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });

        // Wait a bit for JS to populate
        try {
            await page.waitForSelector('h3', { timeout: 10000 });
        } catch(e) {}

        const content = await page.content();
        const $ = cheerio.load(content);
        const jobs = [];

        // Back to the selector that worked: $('li') and finding h3
        $('li').each((i, el) => {
            const $el = $(el);
            const titleElement = $el.find('h3');
            if (titleElement.length === 0) return;

            const title = titleElement.text().trim();
            const linkTag = $el.find('a').first(); // Usually the first link in the card is the offer link
            let link = linkTag.attr('href');

            if (link && !link.startsWith('http')) {
                link = "https://www.hellowork.com" + link;
            }

            // heuristic metadata extraction
            const textContent = $el.text();
            let contract = "CDI";
            if (textContent.toLowerCase().includes("alternance")) contract = "Alternance";
            else if (textContent.toLowerCase().includes("stage")) contract = "Stage";
            else if (textContent.toLowerCase().includes("cdd")) contract = "CDD";

            const company = $el.find('p').first().text().trim() || "Entreprise";

            if (title && link) {
                jobs.push({
                    source: 'HelloWork',
                    title,
                    company,
                    location: location, // Use search location as default if not found
                    contract,
                    date: "Récent",
                    link
                });
            }
        });

        return jobs;

    } catch (error) {
        console.error('[HelloWork] Error:', error);
        return [];
    } finally {
        if (browser) await browser.close();
    }
}

module.exports = scrapeHelloWork;
