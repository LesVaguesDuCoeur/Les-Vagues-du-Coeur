/**
 * API communication module for the frontend to talk to Google Apps Script.
 */

const api = {
  /**
   * Retrieves the API URL from localStorage or a global override.
   * @returns {string|null} The API URL or null if not set.
   */
  getApiUrl() {
    return window._API_URL_OVERRIDE || localStorage.getItem('apiUrl');
  },

  /**
   * Sends a POST request to the API.
   * Automatically wraps regular payloads in { action: 'save', data: ... }
   * but sends special actions ('setup', 'load', 'emergencyAccess') as-is.
   * @param {Object} payload The data to send.
   * @returns {Promise<Object>} The JSON response from the server.
   */
  async postToApi(payload) {
    const url = this.getApiUrl();
    if (!url) {
      throw new Error("L'URL de l'API n'est pas configuree.");
    }

    // Determine if payload needs wrapping
    let finalPayload = payload;
    const specialActions = ['setup', 'load', 'emergencyAccess'];
    if (!payload.action || !specialActions.includes(payload.action)) {
      finalPayload = { action: 'save', data: payload };
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain' // Required by GAS to avoid CORS preflight
        },
        body: JSON.stringify(finalPayload),
        redirect: 'follow'
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.error) {
        throw new Error(result.error);
      }

      return result;
    } catch (error) {
      console.error("API Request failed", error);
      throw error;
    }
  },

  /**
   * Loads all data from the API.
   * @returns {Promise<Object>} The data object.
   */
  async loadFromApi() {
    return this.postToApi({ action: 'load' });
  }
};

window.api = api;
