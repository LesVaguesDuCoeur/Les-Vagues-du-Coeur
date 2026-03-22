const API_URL = 'https://script.google.com/macros/s/AKfycbxYb9MYC8yySuT64ecUtBczMWATJTGk5eIXreKhM09MK4ZzMJOhxy1YQ1n-eQ7FN580/exec';

async function fetchFromApi() {
  try {
    const response = await fetch(API_URL);
    if (!response.ok) throw new Error('Network response was not ok');
    return await response.json();
  } catch (error) {
    console.error('Error fetching data:', error);
    return null;
  }
}

async function postToApi(payload) {
  // Si c'est une action spéciale (pas les données complètes)
  if (payload.action) {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload)
    });
    return response.json();
  }
  // Sinon : sauvegarde normale du JSON complet
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ action: 'save', data: payload })
  });
  return response.json();
}

function showLoader(elementId = 'loader') {
  const loader = document.getElementById(elementId);
  if (loader) loader.classList.remove('hidden');
}

function hideLoader(elementId = 'loader') {
  const loader = document.getElementById(elementId);
  if (loader) loader.classList.add('hidden');
}
