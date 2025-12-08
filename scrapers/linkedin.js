const cheerio = require('cheerio');

async function scrapeLinkedIn(browser, query, location) {
    try {
        const page = await browser.newPage();

        const baseUrl = 'https://www.linkedin.com/jobs/search';
        const url = `${baseUrl}?keywords=${encodeURIComponent(query)}&location=${encodeURIComponent(location)}`;

        console.log(`[LinkedIn] Scraping: ${url}`);

        await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Safari/605.1.15');

        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

        const content = await page.content();
        await page.close(); // Close page

        const $ = cheerio.load(content);
        const jobs = [];

        $('.base-card').each((i, el) => {
            const $el = $(el);
            const title = $el.find('.base-search-card__title').text().trim();
            const company = $el.find('.base-search-card__subtitle').text().trim();
            const locationText = $el.find('.job-search-card__location').text().trim();
            const date = $el.find('time').text().trim();
            let link = $el.find('a.base-card__full-link').attr('href');

            if (title && link) {
                jobs.push({
                    source: 'LinkedIn',
                    title,
                    company,
                    location: locationText,
                    contract: "CDI", // Guess
                    date,
                    link
                });
            }
        });

        // Backup selector
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
    }
}

module.exports = scrapeLinkedIn;
