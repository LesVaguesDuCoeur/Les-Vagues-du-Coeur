// URL fournie par l'utilisateur
export const API_URL = "https://script.google.com/macros/s/AKfycbyErNnaIpoo_fdnxZpz7ol3NHgutd9DmvsNddiddqGkF7-pV-XjkiDMvRyUsXhiWQ1_/exec";

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

  async toggleIngredientFavorite(ingredient) {
    return this.sendAction("toggle_ingredient_favorite", { ingredient });
  },

  async sendAction(action, payload) {
    // Important: Content-Type text/plain pour éviter CORS Preflight complexes avec Apps Script.
    // Bien que Code.gs gère maintenant OPTIONS, text/plain est le standard le plus robuste pour GAS.
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain;charset=utf-8",
      },
      body: JSON.stringify({ action, payload }),
    });

    if (!response.ok) throw new Error("Erreur réseau: " + response.status);

    const data = await response.json();
    if (data.error) throw new Error(data.error);
    return data;
  }
};
