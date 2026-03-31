// API communication with Google Apps Script

// Set this to your actual deployed GAS script URL
const GAS_URL = 'http://localhost:8000/api'; // Mocking for local tests, will need to be replaced.

/**
 * Send a POST request to the Google Apps Script backend
 * @param {object} payload
 * @returns {Promise<any>}
 */
async function postToApi(payload) {
  try {
    let finalPayload = payload;

    // As per specs:
    // If payload.action === 'emergencyAccess' -> send directly
    // Otherwise -> wrap in { action: 'save', data: payload }
    if (payload.action !== 'emergencyAccess' && payload.action !== 'setup') {
        finalPayload = {
            action: 'save',
            data: payload
        };
    }

    const response = await fetch(GAS_URL, {
      method: 'POST',
      body: JSON.stringify(finalPayload),
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    if (result.status === 'error') {
        throw new Error(result.message || 'Erreur inconnue du serveur');
    }

    return result;
  } catch (error) {
    console.error('API Error:', error);
    showToast('Erreur de communication avec le serveur', 'error');
    throw error;
  }
}

/**
 * Fetch all data from the Google Apps Script backend
 * @returns {Promise<any>}
 */
async function loadFromApi() {
  try {
    const response = await fetch(GAS_URL, {
        method: 'POST',
        body: JSON.stringify({ action: 'load' }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Load Error:', error);
    showToast('Erreur lors du chargement des données', 'error');
    throw error;
  }
}
