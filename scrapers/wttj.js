const puppeteer = require('puppeteer');
const cheerio = require('cheerio');

async function scrapeWTTJ(query, location) {
    let browser;
    try {
        browser = await puppeteer.launch({
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();

        const baseUrl = 'https://www.welcometothejungle.com/fr/jobs';
        const url = `${baseUrl}?query=${encodeURIComponent(query)}&aroundQuery=${encodeURIComponent(location)}`;

        console.log(`[WTTJ] Scraping: ${url}`);

        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36');

        // WTTJ is heavy, give it time
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

        const title = await page.title();
        console.log(`[WTTJ] Title: ${title}`);

        const content = await page.content();
        const $ = cheerio.load(content);
        const jobs = [];

        // Generic search for job cards
        // They are usually <li> elements inside a list, or <div>s with specific attributes
        // We look for <a> tags that contain "/jobs/" which is the signature of a job offer link on WTTJ

        $('a[href*="/jobs/"]').each((i, el) => {
            const linkTag = $(el);
            let link = linkTag.attr('href');
            if (link && !link.startsWith('http')) {
                link = "https://www.welcometothejungle.com" + link;
            }

            // The title is usually text inside this link or a child h3/h4
            let title = linkTag.find('h3, h4').text().trim();
            if (!title) title = linkTag.text().trim(); // Fallback

            // Clean title (sometimes includes company name or metadata)
            // This is a "best effort" scrape

            // Try to find the parent container to get other details
            const container = linkTag.closest('li, div');
            const containerText = container.text();

            let contract = "CDI";
            if (containerText.toLowerCase().includes('alternance')) contract = "Alternance";
            else if (containerText.toLowerCase().includes('stage')) contract = "Stage";

            // If we have a valid looking link and title
            if (link && title.length > 5 && !jobs.some(j => j.link === link)) {
                jobs.push({
                    source: 'Welcome to the Jungle',
                    title: title.substring(0, 100), // Limit length
                    company: "WTTJ Search", // Hard to extract specific company reliably without classes
                    location: location,
                    contract,
                    date: "Récent",
                    link
                });
            }
        });

        return jobs;

    } catch (error) {
        console.error('[WTTJ] Error:', error);
        return [];
    } finally {
        if (browser) await browser.close();
    }
}

module.exports = scrapeWTTJ;
