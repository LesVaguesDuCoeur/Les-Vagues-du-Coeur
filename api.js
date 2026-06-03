// SECTION: API integration
// SECTION: Configuration
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxYb9MYC8yySuT64ecUtBczMWATJTGk5eIXreKhM09MK4ZzMJOhxy1YQ1n-eQ7FN580/exec';
const api = {
  _getUserId: () => { let uid = localStorage.getItem('userId'); if (!uid) { uid = app.generateId(); localStorage.setItem('userId', uid); } return uid; },
  _request: async (action, payload = {}) => {
    const userId = api._getUserId();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);
    try {
      if (!navigator.onLine) throw new Error("Offline");
      const reqPayload = { action, userId, payload };
      const res = await fetch(APPS_SCRIPT_URL, { method: 'POST', mode: 'cors', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(reqPayload), signal: controller.signal });
      clearTimeout(timeoutId);
      if (!res.ok) throw new Error('HTTP Error');
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Server logic error');
      return data.data;
    } catch (e) { clearTimeout(timeoutId); return null; }
  },
  saveProgress: async (data) => { storage.saveLocal('progress', data); const result = await api._request('saveProgress', data); if (!result) { app.showToast('Mode hors-ligne, progression sauvegardée localement.', 'warning', 4000); } return result !== null; },
  loadProgress: async () => { const serverData = await api._request('loadProgress'); const localData = storage.loadLocal('progress'); if (serverData && localData) { return (serverData.lastModified > (localData.lastModified || 0)) ? serverData : localData; } return serverData || localData || { xp: 0, streak: 0, completedLessons: [], lastModified: Date.now() }; },
  saveVocab: async (cards) => { storage.saveLocal('vocab', cards); return await api._request('saveVocab', cards); },
  loadVocab: async () => { return await api._request('loadVocab') || storage.loadLocal('vocab') || []; },
  savePlacementResult: async (result) => { storage.saveLocal('placement', result); return await api._request('savePlacementResult', result); },
  loadAllStats: async () => { return await api._request('loadAllStats') || { error: true }; },
  analyzeText: async (text) => { return await api._request('analyzeText', { text: text }); }
};
window.api = api;
