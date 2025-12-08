const puppeteer = require('puppeteer');
const cheerio = require('cheerio');

async function scrapeLinkedIn(query, location) {
    let browser;
    try {
        browser = await puppeteer.launch({
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();

        // LinkedIn Guest Search URL
        // https://www.linkedin.com/jobs/search?keywords=Comptable&location=Toulouse
        const baseUrl = 'https://www.linkedin.com/jobs/search';
        const url = `${baseUrl}?keywords=${encodeURIComponent(query)}&location=${encodeURIComponent(location)}`;

        console.log(`[LinkedIn] Scraping: ${url}`);

        await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Safari/605.1.15');

        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

        // Check for auth wall
        const title = await page.title();
        if (title.includes("Login") || title.includes("S’identifier")) {
            console.log("[LinkedIn] Hit Auth Wall.");
            // We can try to extract from the public page if it loaded partially,
            // but usually it redirects.
            return [];
        }

        const content = await page.content();
        const $ = cheerio.load(content);
        const jobs = [];

        // LinkedIn Public Job Search classes
        // Job card: div.base-card or li
        // Title: h3.base-search-card__title
        // Company: h4.base-search-card__subtitle
        // Link: a.base-card__full-link

        $('.base-card').each((i, el) => {
            const $el = $(el);
            const title = $el.find('.base-search-card__title').text().trim();
            const company = $el.find('.base-search-card__subtitle').text().trim();
            const locationText = $el.find('.job-search-card__location').text().trim();
            const date = $el.find('time').text().trim();
            let link = $el.find('a.base-card__full-link').attr('href');

            // Metadata inference
            let contract = "CDI"; // LinkedIn public view rarely shows contract type in the card list easily

            if (title && link) {
                jobs.push({
                    source: 'LinkedIn',
                    title,
                    company,
                    location: locationText,
                    contract, // Placeholder
                    date,
                    link
                });
            }
        });

        // Backup selector strategy if classes changed
        if (jobs.length === 0) {
             $('li h3').each((i, el) => {
                 const title = $(el).text().trim();
                 const $li = $(el).closest('li');
                 const link = $li.find('a').attr('href');
                 if (title && link) {
                     jobs.push({
                         source: 'LinkedIn',
                         title,
                         company: "LinkedIn Job",
                         location: location,
                         contract: "Voir annonce",
                         date: "",
                         link
                     });
                 }
             });
        }

        return jobs;

    } catch (error) {
        console.error('[LinkedIn] Error:', error);
        return [];
    } finally {
        if (browser) await browser.close();
    }
}

module.exports = scrapeLinkedIn;
