const cheerio = require('cheerio');

async function scrapeHelloWork(browser, query, location) {
    try {
        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36');

        const baseUrl = 'https://www.hellowork.com/fr-fr/emploi/recherche.html';
        const url = `${baseUrl}?k=${encodeURIComponent(query)}&l=${encodeURIComponent(location)}`;

        console.log(`[HelloWork] Scraping: ${url}`);

        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

        try {
            await page.waitForSelector('h3', { timeout: 5000 });
        } catch(e) {}

        const content = await page.content();
        await page.close(); // Important: Close the page to free memory

        const $ = cheerio.load(content);
        const jobs = [];

        $('li').each((i, el) => {
            const $el = $(el);
            const titleElement = $el.find('h3');
            if (titleElement.length === 0) return;

            const title = titleElement.text().trim();
            const linkTag = $el.find('a').first();
            let link = linkTag.attr('href');

            if (link && !link.startsWith('http')) {
                link = "https://www.hellowork.com" + link;
            }

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
                    location: location,
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
    }
}

module.exports = scrapeHelloWork;
