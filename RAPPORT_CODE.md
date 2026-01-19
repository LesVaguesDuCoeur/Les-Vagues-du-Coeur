# RAPPORT CODE - WHATSHAPPEN

## Code.gs

### Configuration et Initialisation
- `getConfig(key, legacyVal)` : Récupère les configurations depuis les propriétés du script ou utilise une valeur par défaut.
- `decodeLegacy(str)` : Décode les valeurs encodées en Base64.
- `doPost(e)` : Point d'entrée principal. Reçoit les requêtes HTTP POST, initialise la base de données et route vers la fonction API appropriée.
- `doGet(e)` : Retourne un message simple indiquant que le service est en ligne.
- `initializeDatabase()` : Vérifie et crée les fichiers de base de données manquants sur Google Drive.

### Fonctions Utilitaires
- `createJSONOutput(data)` : Formate la réponse en JSON pour l'API.
- `getFolder()` : Récupère le dossier racine Google Drive de l'application.
- `_xEnc(text)` / `_xDec(cipher)` : Fonctions de chiffrement et déchiffrement des données.

### Base de Données
- `readDb(filename, defaultData)` : Lit et déchiffre un fichier de base de données.
- `writeDb(filename, data)` : Chiffre et écrit des données dans un fichier.
- `readUsersDbCached()` : Version mise en cache de la lecture de la base utilisateurs pour optimiser les performances.

### Authentification
- `apiLogin(email, code, ip)` : Authentifie un utilisateur, vérifie le code et génère un token de session.
- `apiRegister(...)` : Crée un nouveau compte utilisateur.
- `validateUser(token, email)` : Vérifie la validité de la session (token).
- `apiChangePassword(...)` : Change le code d'accès de l'utilisateur.
- `apiForgotPassword(...)` / `apiVerifyResetCode(...)` / `apiResetPassword(...)` : Gestion de la réinitialisation de mot de passe.

### Messagerie
- `apiGetConversations(...)` : Récupère la liste des conversations actives de l'utilisateur.
- `apiCreateChat(...)` : Crée une nouvelle conversation, invite les participants et initialise le fichier Google Doc associé.
- `apiSendMessage(...)` : Ajoute un message chiffré dans le document de la conversation. Gère la détection de contenu illégal.
- `apiGetMessages(...)` : Récupère et déchiffre les messages d'une conversation.
- `apiExpireChat(...)` : Supprime une conversation (soft delete) et met à jour les références utilisateurs.
- `cleanUpExpiredChats()` : Fonction de maintenance pour supprimer définitivement les conversations expirées.

### Gestion Admin
- `apiAdminGetUsers(...)` : Liste tous les utilisateurs avec leurs rôles.
- `apiAdminUpdateUser(...)` : Modifie les rôles d'un utilisateur (Admin, Créateur, Abonné).
- `apiAdminBanUser(...)` / `apiAdminUnbanUser(...)` : Gestion des bannissements (Blacklist).
- `apiAdminGetAlerts(...)` : Récupère les alertes de contenu illégal.
- `apiRequestConversationAccess(...)` / `apiVerifyConversationAccess(...)` : Processus sécurisé pour qu'un admin accède à une conversation signalée.

### Abonnements
- `apiGetSubscriptionCode(...)` : Génère un code unique pour l'abonnement PayPal.
- `apiSubmitSubscription(...)` : Soumet une transaction PayPal pour validation.
- `apiAdminValidateSubscription(...)` : Valide un abonnement, active le statut "isSubscriber" et génère une facture.
- `sendInvoiceWithPdf(...)` : Génère et envoie la facture PDF par email.

## app.js

### Initialisation
- `init()` : Initialise l'application, configure les écouteurs d'événements et vérifie la session locale.
- `setupListeners()` : Attache les actions aux boutons et éléments de l'interface (connexion, envoi message, navigation).
- `api(action, payload)` : Fonction centrale pour effectuer les appels fetch vers le backend Google Apps Script.

### Authentification
- `doLogin()` : Gère le processus de connexion côté client.
- `doRegister()` : Gère l'inscription.
- `checkPasswordStrength(password)` : Affiche la force du mot de passe en temps réel.

### Interface Utilisateur
- `showView(viewId)` : Gère la navigation entre les différentes vues (Auth, Dashboard, Chat, Admin).
- `toggleLoader(show)` : Affiche ou cache l'indicateur de chargement.
- `showModal(...)` : Affiche des boîtes de dialogue personnalisées (alerte, confirmation, prompt).

### Messagerie
- `loadConversations()` : Charge et affiche la liste des conversations. Gère le tri et l'affichage des statuts (non lu, épinglé).
- `enterChat(chatId)` : Ouvre une conversation spécifique et lance le polling des messages.
- `loadMessages(chatId)` : Récupère et affiche les messages. Gère l'affichage différentié (moi/autre, système, images).
- `sendMessage()` : Envoie un message texte ou image.
- `startTimer()` : Gère le compte à rebours pour les conversations éphémères.

### Admin
- `switchAdminTab(tab)` : Gère les onglets de l'interface d'administration (Utilisateurs, Abonnements, Alertes, etc.).
- `loadAdminUsers()` / `loadAdminSubscriptions()` : Charge les données pour les tableaux d'administration.
- `generateInvoice(...)` : Génère un PDF de facture côté client (fallback/mobile) via jsPDF.

## index.html

### Structure Générale
- Conteneur principal `.glass-container` pour l'effet de verre.
- Différentes sections (`#view-auth`, `#view-dashboard`, `#view-chat`, `#view-admin`) affichées conditionnellement.

### Composants
- Modales personnalisées pour les confirmations, les images et les formulaires d'édition.
- Loader global.
- Interface de chat avec zone de messages et barre d'entrée.

## style.css

### Thème
- Définition des variables CSS pour les couleurs (Noir, Or `#D4AF37`, Gris).
- Styles pour le "Glassmorphism" (transparence, flou).

### Mise en page
- Styles pour la responsivité (mobile-first).
- Styles spécifiques pour les cartes de conversation, les bulles de messages (`.msg.me`, `.msg.other`) et les éléments d'administration.
