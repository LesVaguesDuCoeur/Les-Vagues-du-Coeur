// src/services/jobService.js
import mockJobs from '../data/mockJobs.json' with { type: "json" };
import { api } from './api.js';

const SCHOOL_KEYWORDS = [
  "ISCOD", "Studi", "OpenClassrooms", "iCademie", "AFTEC", "Pigier",
  "ENACO", "Comptalia", "Formation", "Alternance Academy", "MyDigitalSchool"
];

const SUSPICIOUS_TERMS = [
  "formation gratuite",
  "nous recherchons une entreprise pour vous",
  "accompagnement placement",
  "intègre notre école",
  "rejoins notre formation",
  "coût de la formation pris en charge",
  "aucun frais pour l'étudiant"
];

export const jobService = {
  async getJobs() {
    // In a real app, this would fetch from aggregated sources or the backend
    // Here we use mockJobs as the "live" feed
    const userData = await api.getUserData();

    // Merge user state (applied, saved, hidden) into the job objects
    // But typically we keep the feed separate and just check IDs.
    // Let's return both or return enhanced objects.

    // We will return the raw jobs and the user data separately to the component,
    // or return enhanced jobs. Let's return enhanced jobs.

    const favoritesMap = new Set(userData.data.favorites?.map(f => f.id) || []);
    const appliedMap = new Map(userData.data.applied?.map(a => [a.id, a.date]) || []);
    const hiddenMap = new Set(userData.data.hidden?.map(h => h.id) || []);

    const enhancedJobs = mockJobs.map(job => ({
      ...job,
      isSaved: favoritesMap.has(job.id),
      isApplied: appliedMap.has(job.id),
      appliedDate: appliedMap.get(job.id),
      isHidden: hiddenMap.has(job.id)
    }));

    return {
      jobs: enhancedJobs,
      userData: userData.data
    };
  },

  filterJobs(jobs, filters, excludeSchools) {
    return jobs.filter(job => {
      // 1. Hidden check
      if (job.isHidden) return false;

      // 2. School Exclusion
      if (excludeSchools) {
        const textToSearch = (job.company + " " + job.title + " " + job.description).toLowerCase();

        // Check Company Name
        const companyMatch = SCHOOL_KEYWORDS.some(school =>
          job.company.toLowerCase().includes(school.toLowerCase())
        );
        if (companyMatch) return false;

        // Check Suspicious Terms
        const termMatch = SUSPICIOUS_TERMS.some(term =>
          textToSearch.includes(term.toLowerCase())
        );
        if (termMatch) return false;
      }

      // 3. Standard Filters
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matches =
          job.title.toLowerCase().includes(searchLower) ||
          job.company.toLowerCase().includes(searchLower) ||
          job.description.toLowerCase().includes(searchLower);
        if (!matches) return false;
      }

      if (filters.contract && filters.contract !== 'Tous') {
        if (job.contract !== filters.contract) return false;
      }

      if (filters.category && filters.category !== 'Toutes') {
        if (job.category !== filters.category) return false;
      }

      if (filters.location && filters.location !== 'Toutes') {
        // Simple string match for now
        if (!job.location.toLowerCase().includes(filters.location.toLowerCase())) return false;
      }

      if (filters.studyLevel && filters.studyLevel !== 'Tous') {
         if (job.studyLevel !== filters.studyLevel) return false;
      }

      return true;
    });
  },

  sortJobs(jobs, sortBy) {
    const sorted = [...jobs];
    switch (sortBy) {
        case 'recent':
            return sorted.sort((a, b) => new Date(b.date) - new Date(a.date));
        case 'company':
            return sorted.sort((a, b) => a.company.localeCompare(b.company));
        // Add more sorts
        default:
            return sorted;
    }
  }
};
