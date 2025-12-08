const axios = require('axios');
const puppeteer = require('puppeteer');
const cheerio = require('cheerio');

async function scrapeFranceTravail(query, location) {
    let browser;
    try {
        browser = await puppeteer.launch({
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1920,1080']
        });
        const page = await browser.newPage();

        const fullQuery = `${query} ${location}`;
        const url = `https://candidat.francetravail.fr/offres/recherche?motsCles=${encodeURIComponent(fullQuery)}&offresPartenaires=true&range=0-20&tri=0`;

        console.log(`[FT] Scraping: ${url}`);
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36');

        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });

        // Wait for results
        try {
            await page.waitForSelector('.result', { timeout: 15000 });
        } catch(e) {}

        const content = await page.content();
        const $ = cheerio.load(content);
        const jobs = [];

        $('.result').each((i, el) => {
            const $el = $(el);
            // Link is often on the whole card or a specific button
            // Usually the title is a link
            const titleLink = $el.find('h2.media-heading-title, a.media-heading-title');

            // If the anchor is wrapping the h2 or inside it
            let link = titleLink.attr('href') || $el.find('a[href^="/offres/recherche/detail"]').attr('href');

            if (link && !link.startsWith('http')) {
                link = "https://candidat.francetravail.fr" + link;
            }

            const title = titleLink.text().trim() || $el.find('h2').text().trim();
            const company = $el.find('.media-heading-sub').text().trim() || "Entreprise";
            const locationText = $el.find('.lieu').text().trim();
            const date = $el.find('.date').text().trim();
            const description = $el.find('.description').text().trim();

            let contract = "CDI"; // Heuristic
            if (description.toLowerCase().includes('cdd')) contract = "CDD";
            else if (description.toLowerCase().includes('interim') || description.toLowerCase().includes('mission')) contract = "Intérim";
            else if (description.toLowerCase().includes('apprentissage') || description.toLowerCase().includes('pro')) contract = "Alternance";


            if (title) {
                jobs.push({
                    source: 'France Travail',
                    title,
                    company,
                    location: locationText,
                    contract,
                    date,
                    link: link || url // Fallback to search URL if detailed link missing
                });
            }
        });

        return jobs;

    } catch (error) {
        console.error('[FT] Error:', error);
        return [];
    } finally {
        if (browser) await browser.close();
    }
}

module.exports = scrapeFranceTravail;
