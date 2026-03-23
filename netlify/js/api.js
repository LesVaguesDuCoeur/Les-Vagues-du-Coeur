// netlify/js/api.js

const API_URL = "https://script.google.com/macros/s/AKfycbxYb9MYC8yySuT64ecUtBczMWATJTGk5eIXreKhM09MK4ZzMJOhxy1YQ1n-eQ7FN580/exec";

async function postToApi(payload) {
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify(payload)
        });
        return await response.json();
    } catch (e) {
        console.error("Erreur API", e);
        throw e;
    }
}

async function loadData() {
    try {
        const response = await postToApi({ action: 'load' });
        return response;
    } catch (e) {
        console.error("Erreur chargement données", e);
        return null;
    }
}
