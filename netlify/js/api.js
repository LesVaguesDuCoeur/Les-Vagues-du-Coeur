// api.js - Wrapper for Google Apps Script requests

const API_URL = "https://script.google.com/macros/s/AKfycbxYb9MYC8yySuT64ecUtBczMWATJTGk5eIXreKhM09MK4ZzMJOhxy1YQ1n-eQ7FN580/exec";

const ApiClient = {
  /**
   * Fetch data from the Google Apps Script backend
   * @returns {Promise<object>} The JSON response
   */
  get: async () => {
    try {
      const response = await fetch(`${API_URL}?action=load`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const text = await response.text();
      try {
        return JSON.parse(text);
      } catch (e) {
        console.error("Failed to parse JSON response:", text);
        throw new Error("Invalid response format from server.");
      }
    } catch (error) {
      console.error("GET Request failed:", error);
      throw error;
    }
  },

  /**
   * Post data to the Google Apps Script backend
   * Handles wrapping all normal save actions with {action: 'save', data: payload}
   * and sends special actions directly.
   * @param {object} payload - The data payload or direct action
   * @returns {Promise<object>} The JSON response
   */
  post: async (payload) => {
    try {
      // Determine if this is a direct action (like emergencyAccess, setup) or a standard save
      let requestBody = payload;
      if (!payload.action) {
        requestBody = { action: 'save', data: payload };
      }

      const response = await fetch(API_URL, {
        method: "POST",
        mode: "no-cors", // Google Apps script specific
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      // With no-cors, we can't read the response. We assume success.
      return { success: true };
    } catch (error) {
      console.error("POST Request failed:", error);
      throw error;
    }
  }
};

window.fetchData = ApiClient.get;
window.postToApi = ApiClient.post;
