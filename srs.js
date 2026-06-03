// SECTION: Spaced Repetition System (SM-2)
const srs = {
  processAnswer: (card, grade) => {
    let { interval = 0, repetition = 0, efactor = 2.5 } = card;
    if (grade >= 3) { if (repetition === 0) { interval = 1; } else if (repetition === 1) { interval = 6; } else { interval = Math.round(interval * efactor); } repetition += 1; } else { repetition = 0; interval = 1; }
    efactor = efactor + (0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02));
    if (efactor < 1.3) efactor = 1.3;
    const now = Date.now();
    const msPerDay = 24 * 60 * 60 * 1000;
    const nextReview = now + (interval * msPerDay);
    return { ...card, interval, repetition, efactor, nextReview, lastReviewed: now };
  },
  getDueCards: (allCards) => {
    const now = Date.now();
    return allCards.filter(card => !card.nextReview || card.nextReview <= now).sort((a, b) => (a.nextReview || 0) - (b.nextReview || 0));
  }
};
window.srs = srs;
