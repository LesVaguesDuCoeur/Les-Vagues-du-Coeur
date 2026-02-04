// test-filters.js
import { jobService } from './src/services/jobService.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const mockJobs = JSON.parse(fs.readFileSync(path.join(__dirname, 'src/data/mockJobs.json'), 'utf8'));

// Mocking API and localStorage for Node environment
global.localStorage = {
  getItem: () => null,
  setItem: () => {}
};

console.log("Running Filter Tests...");

const allJobs = mockJobs.map(j => ({ ...j, isHidden: false })); // Add isHidden default

// Test 1: School Exclusion
const jobsWithoutSchools = jobService.filterJobs(allJobs, {}, true);
const schoolsFound = jobsWithoutSchools.filter(j =>
  ['ISCOD', 'Studi', 'AFTEC'].some(s => j.company.includes(s))
);

if (schoolsFound.length === 0) {
  console.log("✅ School Exclusion Test Passed: No schools found.");
} else {
  console.error("❌ School Exclusion Test Failed: Found schools:", schoolsFound.map(j => j.company));
}

// Test 2: Contract Filtering
const filtersContract = { contract: 'Alternance', category: 'Toutes', studyLevel: 'Tous' };
const alternanceJobs = jobService.filterJobs(allJobs, filtersContract, false);
const nonAlternance = alternanceJobs.filter(j => j.contract !== 'Alternance');

if (nonAlternance.length === 0 && alternanceJobs.length > 0) {
  console.log("✅ Contract Filter Test Passed: Only Alternance jobs found.");
} else {
  console.error("❌ Contract Filter Test Failed.");
}

// Test 3: Location Filtering
const filtersLoc = { location: 'Paris', contract: 'Tous', category: 'Toutes', studyLevel: 'Tous' };
const parisJobs = jobService.filterJobs(allJobs, filtersLoc, false);
const nonParis = parisJobs.filter(j => !j.location.includes('Paris'));

if (nonParis.length === 0 && parisJobs.length > 0) {
  console.log("✅ Location Filter Test Passed: Only Paris jobs found.");
} else {
  console.error("❌ Location Filter Test Failed. Found:", nonParis.map(j => j.location));
}

// Test 4: Combined Filters + Exclusion
const filtersComplex = { contract: 'Alternance', location: 'Paris', category: 'Toutes', studyLevel: 'Tous' };
const complexJobs = jobService.filterJobs(allJobs, filtersComplex, true);
const complexErrors = complexJobs.filter(j =>
  j.contract !== 'Alternance' ||
  !j.location.includes('Paris') ||
  ['ISCOD', 'Studi'].some(s => j.company.includes(s))
);

if (complexErrors.length === 0 && complexJobs.length > 0) {
  console.log("✅ Combined Filter Test Passed.");
} else {
  console.error("❌ Combined Filter Test Failed.", complexErrors);
}
