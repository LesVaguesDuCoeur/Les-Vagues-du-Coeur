document.addEventListener('DOMContentLoaded', async () => {
    const testamentKey = sessionStorage.getItem('testamentKey');
    const emergencyKey = sessionStorage.getItem('emergencyKey'); // Double verification logic implies both are present in session

    if (!testamentKey || !emergencyKey) {
        window.location.href = 'index.html';
        return;
    }

    setupAutoLock(15); // 15 minutes timeout

    try {
        const encryptedPayload = await api.load();
        if (!encryptedPayload.isSetup) throw new Error("App not setup");

        const testamentData = decryptData(encryptedPayload.testamentData, testamentKey) || "Aucun testament n'a été rédigé pour le moment.";
        document.getElementById('testamentContent').innerText = testamentData;
    } catch (e) {
        console.error(e);
        showAlert("Erreur de déchiffrement. Clé incorrecte.");
        sessionStorage.clear();
        setTimeout(() => window.location.href = 'index.html', 2000);
        return;
    }

    document.getElementById('logoutBtn').addEventListener('click', () => {
        sessionStorage.clear();
        window.location.href = 'index.html';
    });
});