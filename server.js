const express = require('express');
const cors = require('cors');
const smartParse = require('./utils/smartParser');

// Import Scrapers
const scrapeHelloWork = require('./scrapers/hellowork');
const scrapeFranceTravail = require('./scrapers/francetravail');
const scrapeLinkedIn = require('./scrapers/linkedin');
// WTTJ and Indeed are unreliable/blocked, but we can include them optionally or comment out
// const scrapeWTTJ = require('./scrapers/wttj');
// const scrapeIndeed = require('./scrapers/indeed');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.static('public'));
app.use(express.json());

// Search API
app.get('/api/search', async (req, res) => {
    const { q, location } = req.query; // Raw user input

    console.log(`[API] Received search: q='${q}', location='${location}'`);

    // 1. Smart Parse
    // If the user typed "Alternance comptable Toulouse" in the main box, `q` has it all.
    // If they used filters, `location` might be set separately.

    // Combine for parsing
    const fullQuery = (q || "") + " " + (location || "");
    const parsed = smartParse(fullQuery);

    console.log(`[API] Parsed intent:`, parsed);

    // If we have explicit location from params, override parsed
    const searchLocation = location || parsed.location || "France";
    const searchKeywords = parsed.keywords || q || "Offre";

    // 2. Launch Scrapers in Parallel
    // We run them concurrently to save time
    const results = await Promise.all([
        scrapeHelloWork(searchKeywords, searchLocation).catch(e => []),
        scrapeFranceTravail(searchKeywords, searchLocation).catch(e => []),
        scrapeLinkedIn(searchKeywords, searchLocation).catch(e => [])
    ]);

    // 3. Flatten and Sort
    let allJobs = results.flat();

    // Filter by contract if detected (Optional: Strict or Loose?)
    // User asked for filters.
    if (parsed.contract.length > 0) {
        // Simple filter: Check if job contract string contains one of the requested types
        const targetContracts = parsed.contract; // e.g. ['alternance']

        allJobs = allJobs.filter(job => {
            if (!job.contract) return false;
            // Flexible matching
            const jobContractLower = job.contract.toLowerCase();
            return targetContracts.some(target => jobContractLower.includes(target.toLowerCase()));
        });
    }

    // Sort by date (heuristic) or relevance
    // Since dates are strings like "2 weeks ago", exact sorting is hard.
    // We'll shuffle or keep source order.

    // Dedup (by link)
    const uniqueJobs = [];
    const seenLinks = new Set();

    for (const job of allJobs) {
        if (!seenLinks.has(job.link)) {
            seenLinks.add(job.link);
            uniqueJobs.push(job);
        }
    }

    res.json({
        metadata: {
            keywords: searchKeywords,
            location: searchLocation,
            detected_contract: parsed.contract
        },
        count: uniqueJobs.length,
        jobs: uniqueJobs
    });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
