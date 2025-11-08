# Configuration de la Sauvegarde Cloud

Ce document explique comment configurer la sauvegarde cloud pour l'application "Les Vagues du Cœur".

## Fonctionnalités Ajoutées

✅ **Sauvegarde locale** - Toutes les soumissions sont automatiquement sauvegardées dans localStorage
✅ **Sauvegarde cloud** - Synchronisation avec Firebase Realtime Database
✅ **Gestion des données** - Interface pour gérer les soumissions sauvegardées
✅ **Export JSON** - Exportez vos données en format JSON
✅ **Synchronisation** - Synchronisez manuellement les données non synchronisées

## Installation et Configuration

### 1. Installation des dépendances

Les dépendances Firebase ont déjà été installées. Vérifiez que `firebase` est dans votre `package.json`:

```bash
cd LesVaguesDuCoeurSite
npm install
```

### 2. Configurer Firebase

#### Étape A : Créer un projet Firebase

1. Allez sur [Firebase Console](https://console.firebase.google.com/)
2. Cliquez sur "Créer un projet"
3. Remplissez le nom du projet (ex: "Les-Vagues-du-Coeur")
4. Acceptez les conditions et créez le projet

#### Étape B : Configurer Realtime Database

1. Dans la console Firebase, allez à **Realtime Database**
2. Cliquez sur **Créer une base de données**
3. Choisissez la région (ex: `europe-west1`)
4. Choisissez le mode **Commencer en mode test** (pour le développement)

⚠️ **IMPORTANT**: En production, configurez les règles de sécurité appropriées.

#### Étape C : Obtenir vos identifiants

1. Allez aux **Paramètres du projet** (roue dentée en haut à gauche)
2. Allez à l'onglet **Votre application**
3. Sélectionnez votre application web
4. Copiez la configuration Firebase

### 3. Créer le fichier .env

1. Dans le dossier `LesVaguesDuCoeurSite`, créez un fichier `.env`:

```bash
cp .env.example .env
```

2. Ouvrez le fichier `.env` et remplacez les valeurs :

```
REACT_APP_FIREBASE_API_KEY=votre_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=votre_project.firebaseapp.com
REACT_APP_FIREBASE_DATABASE_URL=https://votre_project.firebasedatabase.app
REACT_APP_FIREBASE_PROJECT_ID=votre_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=votre_project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=votre_messaging_sender_id
REACT_APP_FIREBASE_APP_ID=votre_app_id
```

### 4. Lancer l'application

```bash
npm start
```

L'application devrait se charger sur `http://localhost:3000`

## Utilisation

### Soumettre un formulaire

1. Remplissez le formulaire "Faire une demande"
2. Cliquez sur "Envoyer"
3. La soumission est automatiquement sauvegardée localement et envoie un email via Formspree

### Gérer les sauvegardes

1. Cliquez sur **▶ Gestion des sauvegardes** pour ouvrir la section
2. Vous verrez :
   - Le nombre total de soumissions
   - Le nombre de soumissions non synchronisées
   - La liste de toutes les soumissions avec leur statut

### Synchroniser avec le cloud

- Cliquez sur **Synchroniser avec le cloud** pour envoyer les données à Firebase
- Le bouton est désactivé s'il n'y a aucune donnée à synchroniser
- Chaque soumission affiche un statut : ☁ **Synchronisé** ou ⚠ **Non synchronisé**

### Exporter les données

- Cliquez sur **Exporter en JSON** pour télécharger toutes vos soumissions en JSON
- Le fichier sera nommé `submissions_YYYY-MM-DD.json`

### Supprimer des données

- Cliquez sur **Supprimer** sur une soumission pour la supprimer localement
- Cliquez sur **Effacer toutes les données** pour effacer TOUTES les sauvegardes locales (⚠️ irréversible)

## Structure des fichiers

```
LesVaguesDuCoeurSite/
├── src/
│   ├── App.js                 # Composant principal avec la UI
│   ├── App.css                # Styles de l'application
│   ├── firebaseConfig.js      # Configuration Firebase
│   ├── backupService.js       # Service de sauvegarde cloud/local
│   ├── index.js               # Point d'entrée React
│   └── index.css              # Styles globaux
├── public/
│   └── index.html             # HTML principal
├── .env.example               # Modèle de configuration
├── .env                       # Configuration (à créer)
└── package.json               # Dépendances
```

## Architecture de la Sauvegarde

### localStorage
- **Avantage**: Pas besoin de configuration cloud, fonctionne hors ligne
- **Inconvénient**: Limité à ~5-10MB par domaine, uniquement local
- **Usage**: Cache local, première couche de sauvegarde

### Firebase Realtime Database
- **Avantage**: Sauvegarder définitivement, synchronisation en temps réel
- **Inconvénient**: Nécessite une configuration, compte gratuit limité
- **Usage**: Sauvegarde cloud, stockage centralisé

### Workflow
```
1. Utilisateur soumet le formulaire
2. saveSubmission() sauvegarde localement dans localStorage
3. saveSubmissionToCloud() envoie à Firebase
4. L'application marque l'élément comme synchronisé
5. Sync manuel disponible pour les éléments non synchronisés
```

## Dépannage

### Firebase n'est pas initialisé
- ✅ Vérifiez que le fichier `.env` existe et contient les bonnes valeurs
- ✅ Redémarrez l'application après avoir créé/modifié `.env`

### Les données ne se synchronisent pas
- ✅ Vérifiez les erreurs dans la console du navigateur (F12)
- ✅ Vérifiez que votre projet Firebase est créé et configuré
- ✅ Vérifiez que le Realtime Database est activé
- ✅ Vérifiez les règles de sécurité du Realtime Database

### Impossible de voir les données dans Firebase Console
- ✅ Allez à **Realtime Database** dans la console Firebase
- ✅ Vérifiez que vous êtes dans la bonne région
- ✅ Les données apparaissent sous **submissions > [timestamp]**

## Sécurité

⚠️ **Important pour la production**:

1. Ne pas partager votre fichier `.env`
2. Ajouter `.env` à votre `.gitignore`
3. Configurer les règles de sécurité Firebase :

```json
{
  "rules": {
    "submissions": {
      ".read": "auth != null",
      ".write": "auth != null"
    }
  }
}
```

## Support

Pour toute question ou problème, consultez :
- [Documentation Firebase](https://firebase.google.com/docs)
- [Documentation React](https://react.dev)
- [GitHub Issues](https://github.com/anthropics/claude-code/issues)
