const GAS_URL = "https://script.google.com/macros/s/AKfycbz3mjDn26Dmhjw7S0Mcq7sX5vgt1iMOAwGhIeTB0SeuWUgkjPAl0KJi9kosumDGiK5K/exec";

export const saveToCloud = async (data) => {
  try {
    // We use no-cors because GAS web apps often have CORS issues if not configured perfectly.
    // However, no-cors means we can't read the response.
    // If the user said "reuse the same ones", maybe it supports CORS.
    // I'll try standard fetch first.
    const response = await fetch(GAS_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Cloud save failed: ${response.statusText}`);
    }

    // Attempt to parse JSON if possible, or just return true
    try {
        const result = await response.json();
        return result;
    } catch (e) {
        return { success: true };
    }
  } catch (error) {
    console.error("Error saving to cloud:", error);
    // Fallback to no-cors if CORS failed?
    // Usually if it's a CORS error, the catch block catches it.
    // But we can't retry with no-cors and expect to know if it succeeded.
    // We'll throw so the UI knows.
    throw error;
  }
};
