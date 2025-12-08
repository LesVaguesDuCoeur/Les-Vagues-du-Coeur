/**
 * Parses a relative date string into a number of days ago.
 * @param {string} dateStr - The date string (e.g., "2 weeks ago", "il y a 3 jours").
 * @returns {number} - Number of days ago (0 for today/recent).
 */
function parseDateToDays(dateStr) {
    if (!dateStr) return 999; // Unknown date, treat as old
    const lower = dateStr.toLowerCase();

    // "Récent" or "New" -> 0 days
    if (lower.includes('récent') || lower.includes('new') || lower.includes("aujourd'hui") || lower.includes("today")) {
        return 0;
    }

    // Regex for numbers
    const match = lower.match(/(\d+)/);
    const value = match ? parseInt(match[0], 10) : 0;

    // Detect unit
    if (lower.includes('mois') || lower.includes('month')) {
        return value * 30;
    }
    if (lower.includes('semaine') || lower.includes('week')) {
        return value * 7;
    }
    if (lower.includes('jour') || lower.includes('day')) {
        return value;
    }
    if (lower.includes('heure') || lower.includes('hour') || lower.includes('minute')) {
        return 0; // Less than a day
    }

    // Fallback if we see a number but no unit (unlikely but possible)
    // Or if it's a specific date "01/01/2024" (Need simpler parsing or just ignore)

    // Attempt simple DD/MM/YYYY
    // France Travail sometimes sends specific dates
    // But for this MVP, regex heuristic is safer for mixed inputs.

    return 999;
}

module.exports = parseDateToDays;
