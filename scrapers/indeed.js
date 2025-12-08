const puppeteer = require('puppeteer');
const cheerio = require('cheerio');

async function scrapeIndeed(query, location) {
    let browser;
    try {
        browser = await puppeteer.launch({
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();

        // Indeed France URL
        // https://fr.indeed.com/emplois?q=Comptable&l=Toulouse
        const baseUrl = 'https://fr.indeed.com/emplois';
        const url = `${baseUrl}?q=${encodeURIComponent(query)}&l=${encodeURIComponent(location)}`;

        console.log(`[Indeed] Scraping: ${url}`);

        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36');

        // Indeed has strong anti-bot. We might get a Cloudflare challenge.
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });

        // Check title
        const title = await page.title();
        console.log(`[Indeed] Title: ${title}`);

        if (title.includes("Just a moment") || title.includes("Vérification")) {
            console.log("[Indeed] Blocked by Cloudflare.");
            return [];
        }

        const content = await page.content();
        const $ = cheerio.load(content);
        const jobs = [];

        // Indeed structure (mosaic or vjs)
        // Main container: #mosaic-provider-jobcards
        // Cards: .job_seen_beacon or .result

        $('.job_seen_beacon, .result').each((i, el) => {
            const $el = $(el);
            const titleElement = $el.find('h2.jobTitle span[title]');

            if (titleElement.length > 0) {
                const title = titleElement.text().trim();
                let link = $el.find('a.jcs-JobTitle').attr('href') || $el.find('a').attr('href');

                if (link && !link.startsWith('http')) {
                    link = "https://fr.indeed.com" + link;
                }

                const company = $el.find('[data-testid="company-name"]').text().trim();
                const locationText = $el.find('[data-testid="text-location"]').text().trim();
                const metadata = $el.find('.job-snippet').text().trim(); // Or metadata tags

                let contract = "CDI";
                // Indeed puts contract types in various places, hard to scrape reliably without full parsing

                if (title && link) {
                    jobs.push({
                        source: 'Indeed',
                        title,
                        company,
                        location: locationText,
                        contract,
                        date: "Récent",
                        link
                    });
                }
            }
        });

        return jobs;

    } catch (error) {
        console.error('[Indeed] Error:', error);
        return [];
    } finally {
        if (browser) await browser.close();
    }
}

module.exports = scrapeIndeed;
