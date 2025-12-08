const express = require('express');
const cors = require('cors');
const smartParse = require('./utils/smartParser');
const parseDateToDays = require('./utils/dateHelper');

// Import Scrapers
const scrapeHelloWork = require('./scrapers/hellowork');
const scrapeFranceTravail = require('./scrapers/francetravail');
const scrapeLinkedIn = require('./scrapers/linkedin');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.static('public'));
app.use(express.json());

// Search API
app.get('/api/search', async (req, res) => {
    try {
        const { q, location, days, sort } = req.query; // Added days and sort

        console.log(`[API] Received search: q='${q}', location='${location}', days='${days}', sort='${sort}'`);

        // 1. Smart Parse
        const fullQuery = (q || "") + " " + (location || "");
        const parsed = smartParse(fullQuery);

        // If we have explicit location from params, override parsed
        const searchLocation = location || parsed.location || "France";
        const searchKeywords = parsed.keywords || q || "Offre";

        // 2. Launch Scrapers in Parallel
        const results = await Promise.all([
            scrapeHelloWork(searchKeywords, searchLocation).catch(e => { console.error('HW Error', e); return []; }),
            scrapeFranceTravail(searchKeywords, searchLocation).catch(e => { console.error('FT Error', e); return []; }),
            scrapeLinkedIn(searchKeywords, searchLocation).catch(e => { console.error('LI Error', e); return []; })
        ]);

        // 3. Flatten
        let allJobs = results.flat();

        // 4. Filter by Contract (Smart Parse)
        if (parsed.contract.length > 0) {
            const targetContracts = parsed.contract;
            allJobs = allJobs.filter(job => {
                if (!job.contract) return false;
                const jobContractLower = job.contract.toLowerCase();
                return targetContracts.some(target => jobContractLower.includes(target.toLowerCase()));
            });
        }

        // 5. Filter by Date (Dropdown)
        if (days && days !== 'all') {
            const limit = parseInt(days, 10);
            if (!isNaN(limit)) {
                allJobs = allJobs.filter(job => {
                    const jobDays = parseDateToDays(job.date);
                    return jobDays <= limit;
                });
            }
        }

        // 6. Sort
        if (sort === 'date') {
            allJobs.sort((a, b) => parseDateToDays(a.date) - parseDateToDays(b.date));
        } else {
            // Default: Relevance (Mixed)
            // We can just shuffle or keep them mixed.
            // Scrapers return most relevant first usually, so keeping order is okay.
        }

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

    } catch (error) {
        console.error('[API] Critical Error:', error);
        res.status(500).json({ error: "Internal Server Error", details: error.message });
    }
});

// Global Error Handler for JSON parsing or other middleware errors
app.use((err, req, res, next) => {
    console.error('[Global Handler]', err);
    res.status(500).json({ error: "Something went wrong!", details: err.message });
});

// 404 Handler (must be last) - Returns JSON instead of HTML
app.use((req, res) => {
    res.status(404).json({ error: "Route not found" });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
