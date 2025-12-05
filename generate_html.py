import json

def generate_html():
    with open('db.json', 'r', encoding='utf-8') as f:
        data = f.read()

    html_content = r"""<!DOCTYPE html>
<html lang="fr" class="h-full bg-slate-900">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Explorateur PCG 2025</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        /* Custom Scrollbar */
        ::-webkit-scrollbar {
            width: 8px;
            height: 8px;
        }
        ::-webkit-scrollbar-track {
            background: #1e293b;
        }
        ::-webkit-scrollbar-thumb {
            background: #475569;
            border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb:hover {
            background: #64748b;
        }

        /* Tree View Lines */
        .tree-line {
            position: absolute;
            left: 0;
            top: 0;
            bottom: 0;
            width: 1px;
            background-color: #334155;
        }

        /* Mobile Slide Animation */
        .slide-in {
            transform: translateX(0%);
        }
        .slide-out {
            transform: translateX(100%);
        }
    </style>
</head>
<body class="h-full text-slate-200 overflow-hidden flex flex-col md:flex-row font-sans">

    <!-- Mobile Header -->
    <div class="md:hidden bg-slate-800 p-4 border-b border-slate-700 flex justify-between items-center z-20">
        <h1 class="text-xl font-bold text-blue-400">PCG 2025</h1>
        <button id="mobile-menu-btn" class="text-slate-300 hover:text-white">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
        </button>
    </div>

    <!-- Sidebar / List View -->
    <aside id="sidebar" class="w-full md:w-1/3 lg:w-1/4 bg-slate-900 border-r border-slate-700 flex flex-col h-full md:relative absolute inset-0 z-10 transition-transform duration-300 transform md:translate-x-0">

        <!-- Search -->
        <div class="p-4 bg-slate-900 border-b border-slate-700 sticky top-0 z-10">
            <div class="relative">
                <input type="text" id="search-input" placeholder="Rechercher un compte..."
                    class="w-full bg-slate-800 border border-slate-600 rounded-lg py-2 px-4 pl-10 text-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-slate-500 absolute left-3 top-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
            </div>
        </div>

        <!-- Tree Container -->
        <div id="tree-container" class="flex-1 overflow-y-auto p-2 space-y-1">
            <!-- Tree items injected here -->
        </div>
    </aside>

    <!-- Main Content / Detail View -->
    <main id="main-content" class="w-full md:w-2/3 lg:w-3/4 bg-slate-800 h-full overflow-y-auto relative transform transition-transform duration-300 translate-x-full md:translate-x-0 absolute md:relative inset-0 z-20">

        <!-- Mobile Back Button -->
        <button id="back-btn" class="md:hidden absolute top-4 left-4 p-2 bg-slate-700 rounded-full text-white shadow-lg hover:bg-slate-600 z-30">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
        </button>

        <div id="empty-state" class="flex flex-col items-center justify-center h-full text-slate-500 p-8 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-24 w-24 mb-4 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <p class="text-xl font-medium">Sélectionnez un compte pour voir les détails</p>
            <p class="text-sm mt-2">Utilisez la recherche ou naviguez dans l'arborescence.</p>
        </div>

        <div id="detail-view" class="hidden min-h-full">
            <!-- Header -->
            <div class="bg-slate-900 p-8 pb-12 shadow-lg relative overflow-hidden">
                <div class="absolute top-0 right-0 w-64 h-64 bg-blue-500 opacity-5 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>

                <span id="detail-class-badge" class="inline-block px-3 py-1 bg-blue-900/50 text-blue-300 text-xs font-bold uppercase tracking-wider rounded-full mb-4 border border-blue-700/50">Classe X</span>

                <h2 class="text-4xl md:text-5xl font-bold text-white mb-2 tracking-tight">
                    <span id="detail-id" class="text-blue-400"></span>
                    <span id="detail-label"></span>
                </h2>
            </div>

            <div class="p-8 max-w-4xl mx-auto -mt-8 relative z-10 space-y-8">

                <!-- Definition Card -->
                <div class="bg-slate-700/50 backdrop-blur-sm border border-slate-600 rounded-xl p-6 shadow-xl">
                    <h3 class="text-lg font-semibold text-slate-200 mb-4 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Définition & Fonctionnement
                    </h3>
                    <div id="detail-description" class="text-slate-300 leading-relaxed whitespace-pre-wrap"></div>
                </div>

                <!-- Example Card -->
                <div class="bg-slate-700/50 backdrop-blur-sm border border-slate-600 rounded-xl p-6 shadow-xl">
                    <h3 class="text-lg font-semibold text-slate-200 mb-4 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                        Exemple d'écriture
                    </h3>
                    <p id="example-desc" class="text-slate-400 text-sm mb-4 italic"></p>

                    <div class="overflow-x-auto rounded-lg border border-slate-600">
                        <table class="w-full text-left border-collapse">
                            <thead>
                                <tr class="bg-slate-800 text-slate-400 text-sm uppercase">
                                    <th class="p-3 border-b border-slate-600 w-1/2">Compte / Libellé</th>
                                    <th class="p-3 border-b border-slate-600 text-right w-1/4">Débit</th>
                                    <th class="p-3 border-b border-slate-600 text-right w-1/4">Crédit</th>
                                </tr>
                            </thead>
                            <tbody id="example-rows" class="bg-slate-700/30 divide-y divide-slate-600">
                                <!-- Rows injected via JS -->
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </div>
    </main>

    <script>
        // Data Injection
        const ACCOUNTS = {{DATA_PLACEHOLDER}};

        // State
        const state = {
            searchQuery: '',
            expanded: new Set(), // Set of IDs
            selectedId: null
        };

        // DOM Elements
        const treeContainer = document.getElementById('tree-container');
        const searchInput = document.getElementById('search-input');
        const mainContent = document.getElementById('main-content');
        const emptyState = document.getElementById('empty-state');
        const detailView = document.getElementById('detail-view');
        const detailId = document.getElementById('detail-id');
        const detailLabel = document.getElementById('detail-label');
        const detailDesc = document.getElementById('detail-description');
        const detailClassBadge = document.getElementById('detail-class-badge');
        const exampleDesc = document.getElementById('example-desc');
        const exampleRows = document.getElementById('example-rows');
        const backBtn = document.getElementById('back-btn');
        const mobileMenuBtn = document.getElementById('mobile-menu-btn');
        const sidebar = document.getElementById('sidebar');

        // Helpers
        function getChildren(id) {
            return ACCOUNTS.filter(a => a.parent === id);
        }

        function getAccount(id) {
            return ACCOUNTS.find(a => a.id === id);
        }

        function getRootAccounts() {
            return ACCOUNTS.filter(a => !a.parent);
        }

        function toggleNode(id) {
            if (state.expanded.has(id)) {
                state.expanded.delete(id);
            } else {
                state.expanded.add(id);
            }
            renderTree();
        }

        function selectAccount(id) {
            // Find account. If not found (e.g. from a link inside text), try finding it
            const account = getAccount(id);

            if (!account) {
               console.warn("Account not found:", id);
               return;
            }

            state.selectedId = id;

            // Expand parent path in tree
            let curr = account.parent;
            while(curr) {
                state.expanded.add(curr);
                const p = getAccount(curr);
                curr = p ? p.parent : null;
            }
            renderTree();

            renderDetail();

            // Mobile: slide in detail
            if (window.innerWidth < 768) {
                mainContent.classList.remove('translate-x-full');
            }

            // Highlight in tree
            document.querySelectorAll('.tree-node-content').forEach(el => {
                el.classList.remove('bg-blue-600', 'text-white');
                el.classList.add('hover:bg-slate-800');
            });
            const selectedEl = document.getElementById(`node-content-${id}`);
            if (selectedEl) {
                selectedEl.classList.add('bg-blue-600', 'text-white');
                selectedEl.classList.remove('hover:bg-slate-800');
            }

            // Scroll tree to element
            setTimeout(() => {
                const el = document.getElementById(`node-content-${id}`);
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 100);
        }

        // Search Logic
        function handleSearch(e) {
            const query = e.target.value.toLowerCase();
            state.searchQuery = query;

            if (query) {
                // Find all matches
                const matches = ACCOUNTS.filter(a =>
                    a.id.toLowerCase().includes(query) ||
                    a.label.toLowerCase().includes(query)
                );

                // Expand all parents of matches
                const toExpand = new Set();
                matches.forEach(m => {
                    let curr = m;
                    while (curr.parent) {
                        toExpand.add(curr.parent);
                        curr = getAccount(curr.parent);
                        if (!curr) break;
                    }
                });
                state.expanded = toExpand;
            } else {
                state.expanded.clear();
            }
            renderTree();
        }

        // Rendering
        function renderTree() {
            treeContainer.innerHTML = '';

            const roots = getRootAccounts();

            function renderNode(account, level = 0) {
                const children = getChildren(account.id);
                const hasChildren = children.length > 0;

                const selfMatches = account.id.toLowerCase().includes(state.searchQuery) ||
                                  account.label.toLowerCase().includes(state.searchQuery);

                const childMatches = hasMatchingDescendant(account.id);

                if (state.searchQuery && !selfMatches && !childMatches) {
                    return; // Skip rendering
                }

                const div = document.createElement('div');
                div.className = 'select-none';

                // Node Content
                const content = document.createElement('div');
                content.id = `node-content-${account.id}`;
                content.className = `tree-node-content flex items-center py-2 px-2 cursor-pointer rounded-md transition-colors ${state.selectedId === account.id ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`;
                content.style.paddingLeft = `${level * 12 + 8}px`; // Indentation

                // Toggle Icon
                const icon = document.createElement('span');
                icon.className = `w-4 h-4 mr-2 flex-shrink-0 text-slate-500 transition-transform duration-200 ${state.expanded.has(account.id) ? 'transform rotate-90' : ''}`;
                if (hasChildren) {
                    icon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" /></svg>`;
                    icon.onclick = (e) => {
                        e.stopPropagation();
                        toggleNode(account.id);
                    };
                } else {
                    icon.innerHTML = `<span class="inline-block w-2 h-2 rounded-full bg-slate-600 ml-1"></span>`; // Leaf dot
                }

                // Label
                const label = document.createElement('span');
                label.className = 'truncate text-sm font-medium';
                // Highlight match
                if (state.searchQuery && selfMatches) {
                    label.innerHTML = `<span class="text-blue-400 font-bold">${account.id}</span> - ${account.label}`;
                } else {
                    label.textContent = `${account.id} - ${account.label}`;
                }

                content.onclick = () => {
                    selectAccount(account.id);
                    if (hasChildren && !state.expanded.has(account.id)) {
                        toggleNode(account.id); // Auto expand on click
                    }
                };

                content.appendChild(icon);
                content.appendChild(label);
                div.appendChild(content);

                // Render Children
                if (hasChildren && state.expanded.has(account.id)) {
                    const childrenContainer = document.createElement('div');
                    children.forEach(child => {
                        const childNode = renderNode(child, level + 1);
                        if (childNode) childrenContainer.appendChild(childNode);
                    });
                    div.appendChild(childrenContainer);
                }

                return div;
            }

            roots.forEach(root => {
                const node = renderNode(root);
                if (node) treeContainer.appendChild(node);
            });
        }

        function hasMatchingDescendant(id) {
            if (!state.searchQuery) return true;
            const children = getChildren(id);
            for (let child of children) {
                if (child.id.toLowerCase().includes(state.searchQuery) || child.label.toLowerCase().includes(state.searchQuery)) return true;
                if (hasMatchingDescendant(child.id)) return true;
            }
            return false;
        }

        function makeClickableLinks(text) {
             // Regex to find potential account numbers (start of string or space, 1-9 followed by digits, end of word)
             // We use a stricter regex to avoid linking amounts like "1000" if they look like accounts.
             // But in descriptions, usually "compte 401" or just "401".
             // Let's assume any standalone number > 2 digits starting with 1-8 is an account candidate.

             return text.replace(/\b([1-8]\d{2,})\b/g, (match) => {
                 // Check if account actually exists
                 if (getAccount(match)) {
                     return `<a href="#" onclick="selectAccount('${match}'); return false;" class="text-blue-400 hover:underline font-bold">${match}</a>`;
                 }
                 return match;
             });
        }

        function renderDetail() {
            const account = getAccount(state.selectedId);
            if (!account) return;

            emptyState.classList.add('hidden');
            detailView.classList.remove('hidden');

            detailId.textContent = account.id;
            detailLabel.textContent = account.label;

            // Format description
            let desc = account.description;
            if (desc.startsWith('(Définition')) {
                const firstNewline = desc.indexOf('\n\n');
                if (firstNewline !== -1) {
                   const header = desc.substring(0, firstNewline);
                   const rest = desc.substring(firstNewline + 2);

                   if (header.includes('(Définition')) {
                       desc = `<span class="text-blue-400 font-semibold italic block mb-4 p-2 bg-slate-800/50 rounded border border-blue-900/30">${header}</span>${rest}`;
                   }
                }
            }

            // Make definition links clickable
            desc = makeClickableLinks(desc);
            detailDesc.innerHTML = desc;

            // Badge logic
            detailClassBadge.textContent = `Classe ${account.id.charAt(0)}`;

            // Example
            exampleDesc.textContent = account.example.description;
            exampleRows.innerHTML = '';
            account.example.rows.forEach(row => {
                const tr = document.createElement('tr');

                // Make account column clickable
                let accHtml = row.account;
                accHtml = accHtml.replace(/\b([1-8]\d{2,})\b/g, (match) => {
                     if (getAccount(match)) {
                         return `<a href="#" onclick="selectAccount('${match}'); return false;" class="text-blue-400 hover:underline font-bold">${match}</a>`;
                     }
                     return match;
                });

                tr.innerHTML = `
                    <td class="p-3 border-b border-slate-600 font-mono text-slate-300">${accHtml}</td>
                    <td class="p-3 border-b border-slate-600 text-right font-mono text-emerald-400">${row.debit}</td>
                    <td class="p-3 border-b border-slate-600 text-right font-mono text-emerald-400">${row.credit}</td>
                `;
                exampleRows.appendChild(tr);
            });
        }

        // Event Listeners
        searchInput.addEventListener('input', handleSearch);

        backBtn.addEventListener('click', () => {
            mainContent.classList.add('translate-x-full');
        });

        mobileMenuBtn.addEventListener('click', () => {
             sidebar.classList.toggle('-translate-x-full');
        });

        // Initialize
        renderTree();

    </script>
</body>
</html>
"""

    # Inject data
    final_html = html_content.replace('{{DATA_PLACEHOLDER}}', data)

    with open('index.html', 'w', encoding='utf-8') as f:
        f.write(final_html)

if __name__ == '__main__':
    generate_html()
