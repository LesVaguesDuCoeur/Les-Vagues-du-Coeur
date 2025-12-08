const express = require('express');
const cors = require('cors');
const puppeteer = require('puppeteer');
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

// Global Browser Instance
let browser;

async function initBrowser() {
    // If browser exists but is disconnected, kill it and reset
    if (browser && !browser.isConnected()) {
        console.warn("[Browser] Instance disconnected. Restarting...");
        try { await browser.close(); } catch(e) {}
        browser = null;
    }

    if (!browser) {
        console.log("[Browser] Launching Singleton Instance...");
        try {
            browser = await puppeteer.launch({
                headless: 'new',
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-gpu',
                    '--single-process' // Helps in resource-constrained envs
                ]
            });
            console.log("[Browser] Launched successfully.");
        } catch (error) {
            console.error("[Browser] Failed to launch:", error);
            throw error;
        }
    }
    return browser;
}

// Timeout Wrapper
const withTimeout = (promise, ms = 20000, name = 'Task') => {
    let timer;
    const timeoutPromise = new Promise((_, reject) => {
        timer = setTimeout(() => {
            reject(new Error(`Timeout: ${name} took longer than ${ms}ms`));
        }, ms);
    });

    return Promise.race([
        promise.then(res => {
            clearTimeout(timer);
            return res;
        }),
        timeoutPromise
    ]).catch(err => {
        console.error(`[API] Error in ${name}:`, err.message);
        return [];
    });
};

// Search API
app.get('/api/search', async (req, res) => {
    try {
        const { q, location, days, sort } = req.query;
        console.log(`[API] Request: q='${q}', loc='${location}'`);

        const fullQuery = (q || "") + " " + (location || "");
        const parsed = smartParse(fullQuery);

        const searchLocation = location || parsed.location || "France";
        const searchKeywords = parsed.keywords || q || "Offre";

        // Use singleton browser (Self-Healing)
        let browserInstance;
        try {
            browserInstance = await initBrowser();
        } catch (e) {
            console.error("[API] Critical: Could not init browser", e);
            return res.status(503).json({ error: "Service Unavailable (Browser Failed)" });
        }

        // Launch Scrapers
        const results = await Promise.all([
            withTimeout(scrapeHelloWork(browserInstance, searchKeywords, searchLocation), 25000, 'HelloWork'),
            withTimeout(scrapeFranceTravail(browserInstance, searchKeywords, searchLocation), 25000, 'FranceTravail'),
            withTimeout(scrapeLinkedIn(browserInstance, searchKeywords, searchLocation), 25000, 'LinkedIn')
        ]);

        let allJobs = results.flat();

        // Filter by Contract
        if (parsed.contract.length > 0) {
            const targetContracts = parsed.contract;
            allJobs = allJobs.filter(job => {
                if (!job.contract) return false;
                const jobContractLower = job.contract.toLowerCase();
                return targetContracts.some(target => jobContractLower.includes(target.toLowerCase()));
            });
        }

        // Filter by Date
        if (days && days !== 'all') {
            const limit = parseInt(days, 10);
            if (!isNaN(limit)) {
                allJobs = allJobs.filter(job => {
                    const jobDays = parseDateToDays(job.date);
                    return jobDays <= limit;
                });
            }
        }

        // Sort
        if (sort === 'date') {
            allJobs.sort((a, b) => parseDateToDays(a.date) - parseDateToDays(b.date));
        }

        // Dedup
        const uniqueJobs = [];
        const seenLinks = new Set();

        for (const job of allJobs) {
            if (!seenLinks.has(job.link)) {
                seenLinks.add(job.link);
                uniqueJobs.push(job);
            }
        }

        console.log(`[API] Returning ${uniqueJobs.length} jobs.`);
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
        if (!res.headersSent) {
            res.header('Content-Type', 'application/json');
            res.status(500).json({ error: "Internal Server Error", details: error.message });
        }
    }
});

// Process Safety
process.on('uncaughtException', (err) => {
    console.error('[Fatal] Uncaught Exception:', err);
    // Don't exit, try to keep running
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('[Fatal] Unhandled Rejection at:', promise, 'reason:', reason);
});

// Global Error Handler
app.use((err, req, res, next) => {
    console.error('[Global Handler]', err);
    if (res.headersSent) return next(err);
    res.header('Content-Type', 'application/json');
    res.status(500).json({ error: "Something went wrong!", details: err.message });
});

// 404
app.use((req, res) => {
    res.header('Content-Type', 'application/json');
    res.status(404).json({ error: "Route not found" });
});

// Graceful Shutdown
process.on('SIGINT', async () => {
    console.log("Shutting down...");
    if (browser) await browser.close();
    process.exit();
});

app.listen(PORT, async () => {
    console.log(`Server running on http://localhost:${PORT}`);
    await initBrowser().catch(e => console.error("Initial browser launch failed:", e));
});
