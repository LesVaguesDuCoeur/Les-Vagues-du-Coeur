# RAPPORT DÉTAILLÉ DU CODE - WHATSHAPPEN

Ce document explique en détail le fonctionnement de chaque fichier du projet, bloc par bloc, pour faciliter la maintenance et la compréhension globale.

---

## 1. Code.gs (Backend - Google Apps Script)

Ce fichier est le cœur du backend. Il gère la base de données (sur Google Drive), l'authentification, et toutes les actions de l'API.

### Configuration et Sécurité
*   **`_0x` et `_getS(i)`** : Un tableau et une fonction pour obscurcir les clés sensibles (ID du dossier Drive, Email Admin, Clé Secrète) dans le code source. Cela évite qu'elles soient lues trop facilement.
*   **`LEGACY_CONF`** : Un objet de secours contenant les configurations encodées en base64. Si `PropertiesService` échoue, on utilise ces valeurs.
*   **`getConfig(key, legacyVal)`** : Cette fonction tente de récupérer une configuration (comme l'ID du dossier) depuis les "Propriétés du Script" de Google. Si elle ne trouve rien, elle utilise la valeur de secours (`legacyVal`) et la sauvegarde pour la prochaine fois.
*   **`decodeLegacy(str)`** : Fonction utilitaire pour décoder les chaînes en Base64 (utilisée pour lire les configurations chiffrées).
*   **Constantes (`FOLDER_ID`, `ADMIN_EMAIL`, `SECRET_KEY`)** : Les variables globales utilisées partout dans le script, décodées au démarrage.
*   **Noms de Fichiers DB** : Constantes définissant les noms des fichiers `.db` sur Google Drive (`Users.db`, `Chats.db`, etc.).

### Point d'Entrée HTTP
*   **`doGet(e)`** : Fonction standard de Google Apps Script pour les requêtes HTTP GET. Elle retourne simplement un message JSON indiquant que le service est en ligne.
*   **`doPost(e)`** : **C'est la fonction principale.** Elle est déclenchée à chaque appel de l'application (Login, Envoi message, etc.).
    1.  `initializeDatabase()` : Vérifie d'abord que tous les fichiers nécessaires existent.
    2.  `LockService.getScriptLock()` : Verrouille le script pour éviter que deux requêtes simultanées ne corrompent les données.
    3.  `JSON.parse(e.postData.contents)` : Lit les données envoyées par le frontend.
    4.  `switch (action)` : Un grand "aiguillage" qui appelle la bonne fonction (`apiLogin`, `apiSendMessage`, etc.) selon l'action demandée.
    5.  `return createJSONOutput(result)` : Renvoie la réponse au frontend sous format JSON.

### Fonctions Utilitaires Backend
*   **`createJSONOutput(data)`** : Formate un objet JavaScript en réponse HTTP JSON valide.
*   **`getEncryptionKey()`** : Retourne la clé secrète pour le chiffrement.
*   **`getFolder()`** : Obtient l'objet `Folder` de Google Drive correspondant à `FOLDER_ID`. C'est là que tout est stocké.
*   **`getCacheFolder()`** : Récupère (ou crée) le sous-dossier "Cache" pour stocker les fichiers JSON temporaires des conversations.
*   **`initializeDatabase()`** : Parcourt la liste des fichiers DB requis. Pour chacun, vérifie s'il existe dans le dossier Drive. Sinon, le crée avec une structure vide par défaut chiffrée. Utilise `CacheService` pour ne pas faire cette vérification coûteuse à chaque appel.

### Gestion de la Base de Données (Lecture/Écriture)
*   **`readDb(filename, defaultData)`** :
    *   Cherche le fichier par son nom.
    *   S'il existe : Lit le contenu, le déchiffre (`_xDec`), et le parse en JSON. Si le format de chiffrement est ancien, il le met à jour automatiquement.
    *   S'il n'existe pas : Crée le fichier avec les données par défaut.
*   **`writeDb(filename, data)`** : Chiffre les données (`_xEnc`) et écrase le contenu du fichier sur Drive.
*   **`readUsersDbCached()`** : Optimisation cruciale. Au lieu de lire le fichier `Users.db` (lent) à chaque fois, elle essaie de lire dans le `CacheService` (mémoire rapide de Google). Si le cache est vide, elle lit le fichier et remplit le cache.
*   **`updateChatCache(chatId, data)`** : Écrit les données d'une conversation dans un fichier JSON dédié (`Cache/Cache_ID.json`) pour un accès rapide.
*   **`getChatFromCache(chatId)`** : Tente de lire une conversation depuis son fichier JSON de cache. Beaucoup plus rapide que d'ouvrir le Google Doc.
*   **`deleteChatCache(chatId)`** : Supprime le fichier cache d'une conversation (utilisé quand une conversation est supprimée ou modifiée structurellement).

### Logique Métier - Authentification
*   **`apiLogin(email, code, ip)`** :
    *   Vérifie si l'utilisateur est banni (`checkBlacklist`).
    *   Cherche l'utilisateur dans la DB.
    *   Vérifie le code d'accès.
    *   Si OK, met à jour `lastLogin` et génère un nouveau `token` de session.
*   **`apiRegister(...)`** : Crée un nouvel utilisateur dans `Users.db` si l'email n'existe pas déjà. Attribue automatiquement les droits Admin si l'email est `chaouiengage@gmail.com`.
*   **`validateUser(token, email)`** : Vérifie que le token envoyé correspond bien à celui stocké en base pour cet email. Sécurise toutes les autres fonctions.

### Logique Métier - Messagerie
*   **`apiGetConversations(...)`** : Liste les chats actifs de l'utilisateur. Vérifie si les fichiers existent encore (pas supprimés/expirés).
*   **`apiCreateChat(...)`** :
    *   Crée un nouveau Google Doc pour la conversation.
    *   Stocke les métadonnées (participants, expiration) dans l'en-tête du Doc.
    *   Ajoute l'ID du chat dans la liste `activeChats` de chaque participant dans `Users.db`.
    *   Envoie des emails d'invitation aux nouveaux utilisateurs.
*   **`apiSendMessage(...)`** :
    *   **Double Écriture** : Ajoute le message (chiffré) à la fin du Google Doc (stockage permanent) ET met à jour le fichier Cache JSON (lecture rapide).
    *   Déclenche la détection de contenu illégal (`detectIllegalContent`).
    *   Met à jour `lastMessage` dans `Users.db` pour l'affichage dans la liste des chats.
*   **`apiGetMessages(...)`** :
    *   **Stratégie de Cache** : Essaie d'abord de lire le fichier JSON de cache.
    *   Si le cache est absent, ouvre le Google Doc, parse tous les paragraphes pour reconstruire l'historique, met à jour le cache, et renvoie les messages.
*   **`apiExpireChat(...)`** : Supprime le fichier Drive (mis à la corbeille), supprime le cache associé, et retire le chat des listes des utilisateurs.

### Logique Métier - Administration & Abonnements
*   **`apiGetSubscriptionCode`** : Génère un code unique pour le paiement PayPal. Vérifie la `SubscriptionBlacklist` avant.
*   **`apiSubmitSubscription`** : Enregistre la transaction PayPal et donne immédiatement le rôle `isSubscriber` (statut 'pending').
*   **`apiAdminValidateSubscription`** : Confirme l'abonnement, génère une facture (PDF via Google Doc temporaire), et l'envoie par email (`sendInvoiceWithPdf`).
*   **`apiAdminRejectSubscription`** : Refuse un abonnement, retire le rôle, et notifie l'utilisateur.
*   **`apiAdminBanUser` / `apiAdminAddSubscriptionBan`** : Ajoute des entrées dans les fichiers `Blacklist.db` ou `SubscriptionBlacklist.db`.

### Chiffrement (`_xEnc`, `_xGen`, `_xDec`)
*   Implémente un chiffrement symétrique personnalisé.
*   `_xEnc` : Génère un vecteur d'initialisation (IV), crée un flux de clés basé sur `SECRET_KEY + IV`, et fait un XOR avec les données.
*   C'est ce qui garantit que les données stockées sur Drive sont illisibles sans la clé.

---

## 2. netlify/app.js (Frontend)

Ce fichier gère toute l'interactivité dans le navigateur de l'utilisateur.

### Initialisation
*   **`init()`** : Lancé au chargement de la page. Vérifie si un utilisateur est déjà connecté (`localStorage`), charge le logo, et affiche la bonne vue.
*   **`getApiUrl()`** : Décode l'URL de l'API Google Apps Script (cachée en base64).

### Communication API
*   **`api(action, payload)`** : Fonction générique pour envoyer des requêtes POST au backend. Elle ajoute automatiquement le token et l'email de l'utilisateur. Gère les erreurs de session (déconnexion auto).

### Interface Utilisateur (UI)
*   **`showView(viewId)`** : Système de navigation "Single Page App". Cache toutes les vues (`view-auth`, `view-dashboard`, etc.) et n'affiche que celle demandée.
*   **`showModal(...)`** : Affiche les popups personnalisées (alerte, confirmation, saisie) qui remplacent les `alert()` natifs du navigateur.
*   **`toggleLoader(show)`** : Affiche/Masque la roue de chargement.

### Messagerie (Côté Client)
*   **`loadConversations()`** : Récupère la liste des chats et génère le HTML pour les afficher. Trie par date du dernier message. Gère les badges "non lu".
*   **`enterChat(chatId)`** : Prépare la vue du chat, lance le minuteur d'expiration, et démarre le "polling" (récupération périodique) des messages.
*   **`loadMessages(chatId)`** :
    *   Appelle l'API `getMessages`.
    *   Génère le HTML pour chaque message (bulle droite/gauche, image, système).
    *   **Auto-Scroll** : Force la barre de défilement vers le bas (`area.scrollTop = area.scrollHeight`) pour afficher les derniers messages.
*   **`sendMessage()`** : Récupère le texte ou l'image, l'envoie au backend, et rafraîchit la vue.

### Administration Frontend
*   **`showAdmin()` / `switchAdminTab()`** : Gère l'affichage du panneau d'administration et de ses sous-onglets (Utilisateurs, Bans, Abonnements...).
*   **`generateInvoice(...)`** : Génère une facture PDF directement dans le navigateur avec la bibliothèque `jspdf` (utilisé pour la visualisation immédiate, contrairement à l'envoi email qui est fait par le backend).
*   **`loadSubscriptionBlacklist` / `addSubscriptionBan`** : Gère l'interface pour la nouvelle fonctionnalité de blacklist d'abonnements.

---

## 3. netlify/index.html (Structure)

La structure HTML de l'application.

*   **`<div class="glass-container">`** : Le conteneur principal qui crée l'effet visuel de "verre" (glassmorphism) centré sur l'écran.
*   **`id="view-auth"`** : Écran de connexion et d'inscription. Contient les formulaires.
*   **`id="view-dashboard"`** : Écran principal.
    *   En-tête avec avatar.
    *   `id="chat-list"` : Là où les conversations sont injectées dynamiquement.
    *   Boutons flottants (FAB) pour créer un chat ou s'abonner.
*   **`id="view-chat"`** : Interface de conversation.
    *   `id="messages-area"` : Zone de défilement des messages.
    *   `class="input-area"` : Champ de saisie et bouton d'envoi.
*   **`id="view-admin"`** : Panneau d'administration. Contient les div cachées pour chaque onglet (Users, Bans, Settings...).
*   **Modales** : À la fin du fichier, plusieurs `div` (`modal-overlay`) servent de modèles pour les popups (changement de mot de passe, paiement, visualisation d'image).

---

## 4. netlify/style.css (Design)

Définit l'apparence "Luxe/Sombre" de l'application.

*   **Variables CSS (`:root`)** : Définit les couleurs principales (Or `#D4AF37`, Noir, Transparence).
*   **`.glass-container`** : Utilise `backdrop-filter: blur(10px)` et des bordures semi-transparentes pour l'effet moderne.
*   **`.msg.me` / `.msg.other`** : Styles distincts pour les messages envoyés (Or, alignés à droite) et reçus (Gris, alignés à gauche).
*   **Animations** : `keyframes` pour l'apparition des modales (`modalAppear`) et le flottement des boutons (`float`).
*   **Responsive** : Media queries pour adapter la taille du conteneur sur mobile (100% hauteur) vs desktop (boîte centrée).

---

## 5. netlify/logo.js

*   Contient simplement une variable globale `window.LOGO_BASE64` avec l'image du logo encodée en Base64. Cela permet d'afficher le logo instantanément sans requête réseau supplémentaire.
