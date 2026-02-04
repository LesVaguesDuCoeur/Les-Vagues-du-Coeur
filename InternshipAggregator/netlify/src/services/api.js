// src/services/api.js

const GAS_URL = 'https://script.google.com/macros/s/AKfycbyIiI3-Gq5r4CVw85dxBOTu7K1Ex4zrQY-2r4HYc7wcPTGjVsxb1IwMIOBpOumNpCmNwg/exec'; // User provided URL
const USE_MOCK = true; // Set to false to use real GAS

// Mock User Data Storage (in memory for session)
let mockStorage = {
  favorites: [],
  applied: [],
  hidden: [],
  preferences: {}
};

export const api = {
  async getUserData() {
    if (USE_MOCK) {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 500));
      // Load from localStorage if available for persistence in dev
      const local = localStorage.getItem('mockUserStorage');
      if (local) mockStorage = JSON.parse(local);

      return {
        status: 'success',
        data: { ...mockStorage }
      };
    }

    try {
      // JSONP or CORS might be an issue with simple fetch from browser to GAS
      // Usually fetch with method: 'POST' and body stringified works best for GAS web apps
      // For GET, we use query params.
      // However, GAS 'doGet' outputting JSON often runs into CORS if not handled perfectly.
      // We will use POST for everything to carry payloads easier or fetch.
      const response = await fetch(`${GAS_URL}?action=getUserData`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("API Error:", error);
      return { status: 'error', message: error.message };
    }
  },

  async saveAction(action, payload) {
    if (USE_MOCK) {
      await new Promise(resolve => setTimeout(resolve, 300));

      switch (action) {
        case 'saveJob':
          if (!mockStorage.favorites.find(f => f.id === payload.id)) {
            mockStorage.favorites.push(payload);
          }
          break;
        case 'removeSavedJob':
            mockStorage.favorites = mockStorage.favorites.filter(f => f.id !== payload.id);
            break;
        case 'markApplied':
          // Update if exists or push
           const idx = mockStorage.applied.findIndex(a => a.id === payload.id);
           if (idx >= 0) mockStorage.applied[idx] = payload;
           else mockStorage.applied.push(payload);
          break;
        case 'hideJob':
           if (!mockStorage.hidden.find(h => h.id === payload.id)) {
            mockStorage.hidden.push(payload);
           }
          break;
        case 'savePreferences':
          mockStorage.preferences = payload;
          break;
      }

      localStorage.setItem('mockUserStorage', JSON.stringify(mockStorage));
      return { status: 'success', data: mockStorage };
    }

    // Real Call
    try {
      // sending as text/plain to avoid preflight options request which GAS doesn't handle well
      const response = await fetch(GAS_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify({ action, payload })
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("API Error:", error);
      return { status: 'error', message: error.message };
    }
  }
};
