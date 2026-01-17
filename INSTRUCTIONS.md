# Instructions de Vérification et Déploiement V4

## 1. Déploiement Backend (Google Apps Script)

1.  Allez sur [script.google.com](https://script.google.com) et ouvrez votre projet "WhatsHappen".
2.  Copiez le contenu du fichier `Code.gs` (V4) dans l'éditeur.
3.  **Note importante** : Le code utilise une obfuscation pour les secrets. Assurez-vous que les variables `_0x`, `_0y`, `_0z` correspondent bien aux valeurs encodées de votre configuration (Folder ID, Admin Email, Secret Key).
    *   Si c'est une nouvelle installation, le code s'initialisera avec les valeurs par défaut.
    *   Si c'est une mise à jour, vos `Script Properties` existantes seront utilisées.
4.  Déployez une nouvelle version :
    *   Bouton "Déployer" > "Gérer les déploiements" > "Modifier" (crayon) > "Nouvelle version".
    *   Cliquez sur "Déployer".
    *   L'URL ne change pas si vous mettez à jour le déploiement existant.
5.  **Triggers (Déclencheurs)** :
    *   Vérifiez que le déclencheur `cleanUpExpiredChats` est toujours actif (toutes les 5-15 min).

## 2. Configuration Frontend

1.  Si l'URL de votre Web App a changé, encodez-la en Base64.
2.  Ouvrez `netlify/app.js`.
3.  Mettez à jour `_ENC_URL` si nécessaire.
4.  Déployez le dossier `netlify/` sur Netlify.

## 3. Tests de Vérification V4

### ⛔ RÈGLE D'OR : Non-régression
- [ ] **Connexion** : Connectez-vous avec un compte existant.
- [ ] **Anciens Chats** : Vos anciennes conversations doivent être lisibles (migration automatique si nécessaire).
- [ ] **Création Chat** : Créez une conversation classique (24h).

### 🚔 Alertes Contenu Illégal
- [ ] **Détection** : Dans une conversation, envoyez un message contenant un mot-clé (ex: "bombe", "viol"). *Note : C'est pour le test uniquement.*
- [ ] **Admin** : Connectez-vous en Admin (`chaouiengage@gmail.com` ou le nouvel email).
- [ ] **Onglet Alertes** : Allez dans l'onglet "🚨". Une nouvelle alerte doit apparaître.
- [ ] **Accès** : Cliquez sur "Voir". Confirmez l'envoi du code.
- [ ] **Email** : Vérifiez votre email pour le code d'accès. Entrez-le.
- [ ] **Preuve** : Le fichier de preuve (raw) doit se télécharger.

### 👁️ Accès Super Admin
- [ ] Connectez-vous avec `chaouiengage@icloud.com`.
- [ ] Allez dans les Paramètres Admin (⚙️).
- [ ] Cliquez sur "👁️ Accéder à TOUTES les conversations".
- [ ] Validez le code reçu par email.
- [ ] La liste de toutes les conversations actives doit s'afficher.

### 💬 Nouvelles Fonctionnalités Chat
- [ ] **Durées** : Testez la création d'un chat "1 min". Vérifiez qu'il expire vite.
- [ ] **Typing** : Tapez du texte, vérifiez si l'indicateur apparaît (si vous pouvez tester avec 2 comptes).
- [ ] **Réponse** : Cliquez sur un message reçu > "Répondre".
- [ ] **Suppression** : Cliquez sur un message envoyé > "Supprimer pour tous". Le message doit être remplacé par "🚫 Message supprimé".
- [ ] **Épingler** : Options > Épingler. Le chat doit remonter en haut avec une icône 📌.

### 📱 Mobile & Factures
- [ ] Allez dans l'onglet Admin > Abonnements (💳).
- [ ] Cliquez sur "📄 PDF". La facture doit s'ouvrir/se télécharger correctement (même sur mobile).
- [ ] Cliquez sur "✉️ Email". Vous devez recevoir la facture par email.

## Note sur la Base de Données
Le système créera automatiquement `FlaggedChats/` et `Alerts.db` sur votre Drive s'ils n'existent pas.
