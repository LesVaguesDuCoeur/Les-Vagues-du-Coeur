// utils/smartParser.js

// Keywords lists for detection
const LOCATIONS = [
    'paris', 'lyon', 'marseille', 'toulouse', 'bordeaux', 'nantes', 'lille', 'strasbourg', 'montpellier', 'rennes',
    'nice', 'grenoble', 'rouen', 'toulon', 'angers', 'dijon', 'brest', 'le mans', 'clermont-ferrand', 'aix-en-provence'
];

const CONTRACTS = [
    { key: 'alternance', terms: ['alternance', 'apprentissage', 'contrat pro', 'professionnalisation'] },
    { key: 'stage', terms: ['stage', 'stagiaire', 'internship'] },
    { key: 'cdi', terms: ['cdi', 'indetermine', 'permanent'] },
    { key: 'cdd', terms: ['cdd', 'determine', 'fixed term'] },
    { key: 'interim', terms: ['interim', 'temporaire'] }
];

const JOB_FIELDS = [
    'comptable', 'comptabilité', 'révision', 'contrôle de gestion', 'audit', 'finance', 'fiscalité',
    'juriste', 'rh', 'ressources humaines', 'marketing', 'communication', 'informatique', 'développeur',
    'commercial', 'vente', 'ingénieur', 'consultant'
];

/**
 * Parses a natural language query string into structured filters.
 * @param {string} query - The user's input string (e.g., "alternance comptable toulouse").
 * @returns {Object} - { location, contract, keywords }
 */
function smartParse(query) {
    if (!query) return { location: '', contract: [], keywords: '' };

    const lowerQuery = query.toLowerCase();
    const result = {
        location: '',
        contract: [],
        keywords: ''
    };

    // 1. Detect Location
    // Simple match against our top cities list.
    // In a real app, this would use a Geo API, but this covers the requirement "Boosted by IA" logic.
    for (const city of LOCATIONS) {
        if (lowerQuery.includes(city)) {
            result.location = city;
            break; // Assuming one location for now
        }
    }

    // 2. Detect Contract Type
    for (const type of CONTRACTS) {
        for (const term of type.terms) {
            if (lowerQuery.includes(term)) {
                if (!result.contract.includes(type.key)) {
                    result.contract.push(type.key);
                }
            }
        }
    }

    // 3. Extract Keywords (The "Rest")
    // We remove the detected location and contract terms from the query to find the "core" subject
    let cleanQuery = lowerQuery;

    if (result.location) {
        cleanQuery = cleanQuery.replace(result.location, '');
    }

    CONTRACTS.forEach(type => {
        type.terms.forEach(term => {
            cleanQuery = cleanQuery.replace(term, '');
        });
    });

    // Clean up extra spaces
    result.keywords = cleanQuery.split(' ').filter(w => w.trim().length > 0).join(' ');

    // If keywords are empty, check if we have recognized job fields in the original query
    // This is a fallback if the user just typed "comptable" and it wasn't stripped out,
    // or if we want to enforce specific categories.
    // For now, the "remaining string" approach is good for general search.

    return result;
}

module.exports = smartParse;
