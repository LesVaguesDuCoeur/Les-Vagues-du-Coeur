const API_URL = 'https://script.google.com/macros/s/AKfycbxYb9MYC8yySuT64ecUtBczMWATJTGk5eIXreKhM09MK4ZzMJOhxy1YQ1n-eQ7FN580/exec';

async function postToApi(payload) {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(payload)
  });
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return await response.json();
}

async function loadData() {
  try {
    const response = await postToApi({ action: 'load' });
    if (response.status === 'success') {
      return response.data;
    }
    throw new Error('Failed to load data');
  } catch (e) {
    console.error("Load error:", e);
    return null;
  }
}

async function saveData(data) {
  try {
    const response = await postToApi({ action: 'save', data: data });
    return response.status === 'success';
  } catch (e) {
    console.error("Save error:", e);
    return false;
  }
}
