const cheerio = require('cheerio');

async function scrapeFranceTravail(browser, query, location) {
    try {
        const page = await browser.newPage();

        const fullQuery = `${query} ${location}`;
        const url = `https://candidat.francetravail.fr/offres/recherche?motsCles=${encodeURIComponent(fullQuery)}&offresPartenaires=true&range=0-20&tri=0`;

        console.log(`[FT] Scraping: ${url}`);
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36');

        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

        try {
            await page.waitForSelector('.result', { timeout: 5000 });
        } catch(e) {}

        const content = await page.content();
        await page.close(); // Close page

        const $ = cheerio.load(content);
        const jobs = [];

        $('.result').each((i, el) => {
            const $el = $(el);
            const titleLink = $el.find('h2.media-heading-title, a.media-heading-title');

            let link = titleLink.attr('href') || $el.find('a[href^="/offres/recherche/detail"]').attr('href');

            if (link && !link.startsWith('http')) {
                link = "https://candidat.francetravail.fr" + link;
            }

            const title = titleLink.text().trim() || $el.find('h2').text().trim();
            const company = $el.find('.media-heading-sub').text().trim() || "Entreprise";
            const locationText = $el.find('.lieu').text().trim();
            const date = $el.find('.date').text().trim();
            const description = $el.find('.description').text().trim();

            let contract = "CDI";
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
                    link: link || url
                });
            }
        });

        return jobs;

    } catch (error) {
        console.error('[FT] Error:', error);
        return [];
    }
}

module.exports = scrapeFranceTravail;
