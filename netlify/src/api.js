// Remplacez cette URL par l'URL de votre déploiement Web App Google Apps Script
export const API_URL = "https://script.google.com/macros/s/AKfycbx_PLACEHOLDER_YOUR_ID_HERE/exec";

export const api = {
  async getRecipes() {
    const response = await fetch(API_URL);
    if (!response.ok) throw new Error("Erreur chargement");
    return response.json();
  },

  async importRecipes(newRecipes) {
    return this.sendAction("import_recipes", newRecipes);
  },

  async deleteRecipe(id) {
    return this.sendAction("delete_recipe", { id });
  },

  async bulkDelete(ingredient) {
    return this.sendAction("bulk_delete_ingredient", { ingredient });
  },

  async toggleFavorite(id) {
    return this.sendAction("toggle_favorite", { id });
  },

  async sendAction(action, payload) {
    // Important: Content-Type text/plain pour éviter CORS Preflight (OPTIONS)
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain;charset=utf-8",
      },
      body: JSON.stringify({ action, payload }),
    });
    if (!response.ok) throw new Error("Erreur réseau");
    const data = await response.json();
    if (data.error) throw new Error(data.error);
    return data;
  }
};