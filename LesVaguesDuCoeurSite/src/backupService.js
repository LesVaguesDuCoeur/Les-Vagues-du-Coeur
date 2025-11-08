import { ref, push, get, update } from "firebase/database";
import { database } from "./firebaseConfig";

const STORAGE_KEY = "les_vagues_submissions";
const SUBMISSIONS_DB_PATH = "submissions";

/**
 * Service de sauvegarde cloud pour l'application
 * Gère la sauvegarde des soumissions de formulaires dans Firebase et localStorage
 */

// Sauvegarder une soumission localement dans localStorage
export const saveSubmissionLocally = (submission) => {
  try {
    const submissions = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    const newSubmission = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      synced: false,
      ...submission
    };
    submissions.push(newSubmission);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(submissions));
    return newSubmission;
  } catch (error) {
    console.error("Erreur lors de la sauvegarde locale:", error);
    return null;
  }
};

// Sauvegarder une soumission sur Firebase
export const saveSubmissionToCloud = async (submission) => {
  try {
    if (!database) {
      console.warn("Firebase n'est pas initialisé. Sauvegarde locale uniquement.");
      return null;
    }

    const submissionsRef = ref(database, SUBMISSIONS_DB_PATH);
    const newSubmissionRef = await push(submissionsRef, {
      ...submission,
      timestamp: new Date().toISOString(),
      cloudId: null
    });

    return {
      id: newSubmissionRef.key,
      ...submission
    };
  } catch (error) {
    console.error("Erreur lors de la sauvegarde cloud:", error);
    return null;
  }
};

// Sauvegarder une soumission (localement ET sur cloud)
export const saveSubmission = async (submission) => {
  // Sauvegarde locale
  const localSubmission = saveSubmissionLocally(submission);

  // Sauvegarde cloud
  try {
    const cloudSubmission = await saveSubmissionToCloud(submission);
    if (cloudSubmission && localSubmission) {
      // Marquer la soumission comme synchronisée
      markAssynced(localSubmission.id);
    }
  } catch (error) {
    console.warn("Impossible de synchroniser avec le cloud:", error);
  }

  return localSubmission;
};

// Récupérer toutes les soumissions locales
export const getLocalSubmissions = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch (error) {
    console.error("Erreur lors de la lecture des soumissions locales:", error);
    return [];
  }
};

// Récupérer les soumissions non synchronisées
export const getUnsyncedSubmissions = () => {
  const submissions = getLocalSubmissions();
  return submissions.filter(sub => !sub.synced);
};

// Marquer une soumission comme synchronisée
export const markAssynced = (submissionId) => {
  try {
    const submissions = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    const updatedSubmissions = submissions.map(sub =>
      sub.id === submissionId ? { ...sub, synced: true } : sub
    );
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedSubmissions));
  } catch (error) {
    console.error("Erreur lors de la mise à jour du statut de synchronisation:", error);
  }
};

// Récupérer toutes les soumissions du cloud
export const getCloudSubmissions = async () => {
  try {
    if (!database) {
      console.warn("Firebase n'est pas initialisé.");
      return [];
    }

    const submissionsRef = ref(database, SUBMISSIONS_DB_PATH);
    const snapshot = await get(submissionsRef);

    if (snapshot.exists()) {
      const data = snapshot.val();
      return Object.keys(data).map(key => ({
        cloudId: key,
        ...data[key]
      }));
    }
    return [];
  } catch (error) {
    console.error("Erreur lors de la récupération des soumissions cloud:", error);
    return [];
  }
};

// Synchroniser les soumissions non synchronisées
export const syncUnsyncedSubmissions = async () => {
  const unsyncedSubmissions = getUnsyncedSubmissions();

  for (const submission of unsyncedSubmissions) {
    try {
      const cloudSubmission = await saveSubmissionToCloud(submission);
      if (cloudSubmission) {
        markAssynced(submission.id);
      }
    } catch (error) {
      console.error(`Erreur lors de la synchronisation de la soumission ${submission.id}:`, error);
    }
  }
};

// Supprimer une soumission locale
export const deleteLocalSubmission = (submissionId) => {
  try {
    const submissions = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    const filteredSubmissions = submissions.filter(sub => sub.id !== submissionId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredSubmissions));
  } catch (error) {
    console.error("Erreur lors de la suppression de la soumission:", error);
  }
};

// Effacer tous les données locales (développement/debug)
export const clearLocalData = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
    console.log("Données locales effacées");
  } catch (error) {
    console.error("Erreur lors de l'effacement des données:", error);
  }
};

// Exporter les soumissions en JSON
export const exportSubmissionsAsJSON = () => {
  const submissions = getLocalSubmissions();
  const dataStr = JSON.stringify(submissions, null, 2);
  const dataBlob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `submissions_${new Date().toISOString().split('T')[0]}.json`;
  link.click();
  URL.revokeObjectURL(url);
};
