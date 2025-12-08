async function searchJobs() {
    const query = document.getElementById('searchInput').value;
    const btn = document.getElementById('searchBtn');
    const loader = document.getElementById('loader');
    const btnText = document.getElementById('btnText');
    const container = document.getElementById('jobsContainer');
    const detectedFilters = document.getElementById('detected-filters');
    const iaBadge = document.getElementById('ia-badge');

    if (!query) return;

    // UI Loading State
    btn.disabled = true;
    loader.style.display = 'block';
    btnText.style.display = 'none';
    container.innerHTML = '<div class="empty-state">Recherche en cours sur tous les sites... Cela peut prendre quelques secondes.</div>';

    try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data = await response.json();

        // Show detected AI filters
        detectedFilters.innerHTML = '';
        if (data.metadata.location || data.metadata.detected_contract.length > 0) {
            iaBadge.style.display = 'inline-block';
            let html = '';
            if (data.metadata.location) html += `<span class="filter-tag">📍 ${data.metadata.location}</span>`;
            data.metadata.detected_contract.forEach(c => {
                html += `<span class="filter-tag">📄 ${c.toUpperCase()}</span>`;
            });
            detectedFilters.innerHTML = html;
        } else {
            iaBadge.style.display = 'none';
        }

        renderJobs(data.jobs);

    } catch (error) {
        container.innerHTML = `<div class="empty-state">Erreur lors de la recherche: ${error.message}</div>`;
    } finally {
        btn.disabled = false;
        loader.style.display = 'none';
        btnText.style.display = 'block';
    }
}

function renderJobs(jobs) {
    const container = document.getElementById('jobsContainer');
    const title = document.getElementById('resultsTitle');

    title.textContent = `Résultats (${jobs.length})`;
    container.innerHTML = '';

    if (jobs.length === 0) {
        container.innerHTML = '<div class="empty-state">Aucune offre trouvée pour cette recherche. Essayez d\'autres mots-clés.</div>';
        return;
    }

    jobs.forEach(job => {
        const card = document.createElement('div');
        card.className = 'job-card';

        let sourceClass = 'source-other';
        if (job.source === 'LinkedIn') sourceClass = 'source-linkedin';
        if (job.source === 'HelloWork') sourceClass = 'source-hellowork';
        if (job.source === 'France Travail') sourceClass = 'source-francetravail';

        card.innerHTML = `
            <div class="card-header">
                <span class="source-badge ${sourceClass}">${job.source}</span>
                <span class="job-date">${job.date || 'Récent'}</span>
            </div>
            <h3 class="job-title">${escapeHtml(job.title)}</h3>
            <div class="job-company">${escapeHtml(job.company)}</div>

            <div class="job-tags">
                <span class="tag">📍 ${escapeHtml(job.location || 'France')}</span>
                <span class="tag">💼 ${escapeHtml(job.contract || 'Offre')}</span>
            </div>

            <a href="${job.link}" target="_blank" class="apply-btn">Voir l'offre</a>
        `;

        container.appendChild(card);
    });
}

function escapeHtml(text) {
    if (!text) return '';
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Trigger search on Enter
document.getElementById('searchInput').addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        searchJobs();
    }
});
