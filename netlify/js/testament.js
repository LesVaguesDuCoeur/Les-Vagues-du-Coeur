document.addEventListener('DOMContentLoaded', async () => {
    const testamentKey = sessionStorage.getItem('testamentKey');

    if (!testamentKey) {
        window.location.href = 'index.html';
        return;
    }

    setupAutoLock(15); // 15 minutes auto lock

    document.getElementById('logoutBtn').addEventListener('click', () => {
        sessionStorage.clear();
        window.location.href = 'index.html';
    });

    try {
        const data = await api.load();

        let testamentData = { content: '', lastModified: null };
        if (data.testamentData) {
            testamentData = decryptData(data.testamentData, testamentKey) || testamentData;
        }

        const contentContainer = document.getElementById('testamentContent');

        if (testamentData.content) {
            contentContainer.innerHTML = testamentData.content;
            if (testamentData.lastModified) {
                const dateEl = document.createElement('div');
                dateEl.className = 'text-sm text-muted mt-6 text-right';
                dateEl.innerText = `Dernière mise à jour : ${formatDateFR(testamentData.lastModified)}`;
                contentContainer.appendChild(dateEl);
            }
        } else {
            contentContainer.innerHTML = `<div class="text-center text-muted italic p-8">Aucun testament rédigé.</div>`;
        }

    } catch (e) {
        showToast("Erreur de déchiffrement.", "error");
        setTimeout(() => {
            sessionStorage.clear();
            window.location.href = 'index.html';
        }, 2000);
    }
});