# Agrégateur d'Offres d'Emploi

Site d'agrégation d'offres d'emploi (Alternance, Stage, CDI) spécialisé dans la comptabilité et finance.

## Fonctionnalités

*   **Agrégation Multi-sources** : Centralise les offres.
*   **Filtres Avancés** : Contrat, Localisation, Métier, Date.
*   **Exclusion Automatique** : Filtre les offres "fake" des écoles (ISCOD, Studi, etc.).
*   **Gestion de Candidatures** : Sauvegarde, Marquer comme postulé, Masquer.
*   **Persistance** : Sauvegarde des données sur Google Drive via Google Apps Script.
*   **Mode Sombre**.

## Installation et Démarrage

### 1. Backend (Google Apps Script)

Le backend utilise Google Apps Script pour stocker les préférences et favoris sur Google Drive.

1.  Allez sur [script.google.com](https://script.google.com/) et créez un nouveau projet.
2.  Copiez le contenu du fichier `Code.gs` (situé à la racine de ce projet) dans l'éditeur Apps Script.
3.  Modifiez la variable `FOLDER_ID` dans le script avec l'ID de votre dossier Google Drive (fourni dans le sujet ou créez-en un nouveau).
4.  Déployez le script en tant qu'application Web :
    *   Cliquez sur **Déployer** > **Nouveau déploiement**.
    *   Sélectionnez le type : **Application Web**.
    *   Description : "v1".
    *   Exécuter en tant que : **Moi** (votre compte Google).
    *   Qui peut accéder : **N'importe qui** (nécessaire pour que l'app React puisse l'appeler, ou restreindre si authentifié).
5.  Copiez l'URL de l'application Web générée.

### 2. Configuration Frontend

1.  Ouvrez `src/services/api.js`.
2.  Remplacez `GAS_URL` par l'URL de votre script déployé.
3.  Pour utiliser le backend réel, mettez `USE_MOCK = false`. (Par défaut à `true` pour le développement).

### 3. Lancer l'Application

```bash
npm install
npm run dev
```

### 4. Tests

Pour vérifier la logique de filtrage (exclusion des écoles, etc.) :

```bash
node test-filters.js
```

## Structure du Projet

*   `src/components/` : Composants React (JobCard, FilterSidebar...).
*   `src/services/` : Logique métier (API, Filtrage).
*   `src/data/` : Données de test (mockJobs.json).
*   `Code.gs` : Code backend pour Google Apps Script.
