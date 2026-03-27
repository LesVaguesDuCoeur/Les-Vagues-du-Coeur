import React, { useState } from 'react';
import { Upload, FileText } from 'lucide-react';
import { api } from '../api';

function ImportPanel({ onUpdate, onError }) {
  const [loading, setLoading] = useState(false);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target.result;
        // Try to parse JSON. Prompt says "txt file" but formatted as JSON.
        // We should be robust.
        let json;
        try {
          json = JSON.parse(text);
        } catch (err) {
            // Attempt to clean markdown code blocks if Gemini added them
            const cleaned = text.replace(/```json/g, '').replace(/```/g, '');
            json = JSON.parse(cleaned);
        }

        if (!Array.isArray(json)) throw new Error("Le fichier ne contient pas une liste de recettes (Tableau JSON attendu).");

        const result = await api.importRecipes(json);
        onUpdate(result);
        alert(`${json.length} recettes importées avec succès !`);
        e.target.value = null; // Reset input
      } catch (err) {
        onError("Erreur d'import : " + err.message);
      } finally {
        setLoading(false);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="bg-indigo-50 p-6 rounded-lg border border-indigo-100">
      <h2 className="font-semibold text-indigo-900 mb-4 flex items-center gap-2">
        <Upload className="w-5 h-5" /> Importer
      </h2>
      <label className="block w-full cursor-pointer bg-white border-2 border-dashed border-indigo-300 rounded-lg p-6 text-center hover:border-indigo-500 transition-colors">
        <input
          type="file"
          accept=".txt,.json"
          className="hidden"
          onChange={handleFileUpload}
          disabled={loading}
        />
        <div className="flex flex-col items-center gap-2 text-indigo-600">
          {loading ? (
             <span>Importation...</span>
          ) : (
            <>
             <FileText className="w-8 h-8 opacity-50" />
             <span className="text-sm font-medium">Glissez un fichier .txt ou cliquez ici</span>
            </>
          )}
        </div>
      </label>
      <p className="text-xs text-indigo-400 mt-2 text-center">
        Format attendu : Liste JSON générée par Gemini/ChatGPT.
      </p>
    </div>
  );
}

export default ImportPanel;