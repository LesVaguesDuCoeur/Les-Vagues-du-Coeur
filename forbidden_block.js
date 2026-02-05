    renderForbidden: function(searchQuery = '') {
        const container = document.getElementById('forbidden-list');
        if (!container) return;
        container.innerHTML = '';

        const forbiddenData = this.state.forbidden;
        if (!forbiddenData) return;

        const q = searchQuery.toLowerCase();

        Object.values(forbiddenData).forEach(group => {
            // Filter logic
            const matchesGroup = group.titre.toLowerCase().includes(q);
            const matchingAliments = group.aliments.filter(a => a.toLowerCase().includes(q));

            if (!matchesGroup && matchingAliments.length === 0 && searchQuery) return;

            const alimentsToShow = searchQuery ? matchingAliments : group.aliments;
            if (searchQuery && matchingAliments.length === 0 && matchesGroup) {
                 // If group matches, show all
            } else if (searchQuery && !matchesGroup) {
                 // If only aliments match, show them
            }

            // Simplification: Always show full group if any match, or just matching items?
            // Let's show full group if title matches, or matching items if items match.

            let itemsHtml = '';
            if (matchesGroup) {
                itemsHtml = group.aliments.map(a => `<span class="inline-block bg-red-50 text-red-700 px-2 py-1 rounded-md text-sm border border-red-100">${a}</span>`).join('');
            } else {
                itemsHtml = matchingAliments.map(a => `<span class="inline-block bg-red-50 text-red-700 px-2 py-1 rounded-md text-sm border border-red-100">${a}</span>`).join('');
            }

            // If we are searching and found nothing in this group (and title didn't match), skip
            if (searchQuery && !matchesGroup && matchingAliments.length === 0) return;

            // If not searching, show all
            if (!searchQuery) {
                itemsHtml = group.aliments.map(a => `<span class="inline-block bg-red-50 text-red-700 px-2 py-1 rounded-md text-sm border border-red-100">${a}</span>`).join('');
            }

            container.innerHTML += `
                <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                    <h3 class="font-bold text-gray-800 mb-2 flex items-center gap-2">
                        <i data-lucide="ban" class="text-red-500 w-5 h-5"></i>
                        ${group.titre}
                    </h3>
                    <p class="text-sm text-gray-500 mb-4 italic">${group.raison}</p>

                    <div class="flex flex-wrap gap-2 mb-4">
                        ${itemsHtml}
                    </div>

                    <div class="bg-green-50 rounded-lg p-3 border border-green-100">
                        <div class="text-xs font-bold text-green-800 uppercase mb-2 flex items-center gap-1">
                            <i data-lucide="check-circle" class="w-3 h-3"></i> Alternatives
                        </div>
                        <div class="flex flex-wrap gap-2">
                            ${group.alternatives.map(alt => `
                                <span class="text-xs text-green-700 bg-white px-2 py-1 rounded border border-green-100 shadow-sm">${alt}</span>
                            `).join('')}
                        </div>
                    </div>
                </div>
            `;
        });
        lucide.createIcons();
    },
