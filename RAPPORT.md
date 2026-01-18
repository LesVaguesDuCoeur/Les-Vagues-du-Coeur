# RAPPORT DE MODIFICATIONS - PROJET WHATSHAPPEN V7

Ce document détaille l'ensemble des modifications apportées au projet pour la version V7, incluant les corrections de sécurité, les nouvelles fonctionnalités d'administration, et les améliorations de l'expérience utilisateur.

## 🚨 SÉCURITÉ CRITIQUE & MIGRATION

### 1. Protection du Chiffrement Legacy
**Fichier : `Code.gs`**
- **Ajout** de `LEGACY_CONF` (Lignes 1-5) : Restauration de la configuration de secours encodée en Base64 pour garantir l'accès même si les Script Properties sont vides.
- **Modification** de `getConfig()` (Lignes 7-21) : Implémentation d'une logique de fallback. Si une propriété n'existe pas, elle est initialisée avec la valeur legacy.
- **Restauration** de `decryptLegacyXor()` (Lignes 850+) : Fonction indispensable pour lire les anciennes bases de données chiffrées en XOR simple.
- **Mise à jour** de `_xDec()` (Lignes 835-848) : La fonction de déchiffrement détecte désormais automatiquement le format. Si le préfixe `v1:` est présent, elle utilise le nouveau chiffrement (Hash-Stream). Sinon, elle bascule sur `decryptLegacyXor`.

### 2. Système de Bannissement (Ban System)
**Fichier : `Code.gs`**
- **Ajout** de `BLACKLIST_DB_FILENAME = "Blacklist.db"` (Ligne 39).
- **Mise à jour** de `initializeDatabase()` (Ligne 130) : Création automatique du fichier `Blacklist.db`.
- **Ajout** de `checkBlacklist(email, ip)` (Ligne 305) : Vérifie si l'Email ou l'IP est dans la liste noire avant toute connexion ou inscription.
- **Mise à jour** de `apiLogin` et `apiRegister` : Appel systématique de `checkBlacklist`.
- **Ajout** des actions API :
    - `apiAdminGetBans` : Récupère la liste des bannissements.
    - `apiAdminBanUser` : Ajoute un bannissement (Email ou IP).
    - `apiAdminUnbanUser` : Supprime un bannissement.

## 🛠️ NOUVELLES FONCTIONNALITÉS ADMIN

### 1. Visibilité des IP
**Fichier : `Code.gs`**
- **Correction** de `apiAdminGetUsers` (Ligne 951) : Le champ `firstIp` est désormais renvoyé correctement pour tous les utilisateurs lorsque le demandeur est Admin (`u.firstIp || "Unknown"`).

**Fichier : `netlify/app.js`**
- **Mise à jour** de `loadAdminUsers` (Ligne 672) : Affichage de l'adresse IP sous l'email de l'utilisateur.

### 2. Gestion des Factures
**Fichier : `Code.gs`**
- **Correction** de `apiSendInvoiceEmail` (Ligne 1400+) :
    - Envoie désormais l'email au **propriétaire de la facture** (`invoice.email`) et non plus à l'admin qui a cliqué sur le bouton.
    - Utilise le prénom du client (`invoice.firstName`) dans le template.
    - Supporte l'envoi par ID de facture ou par Email (envoi de la dernière facture).

**Fichier : `netlify/app.js`**
- **Ajout** du bouton "📩 Email" dans l'onglet Abonnements (`loadAdminSubscriptions`, Ligne 782).
- **Implémentation** de `sendInvoiceEmail` (Ligne 796) pour déclencher l'envoi manuel.

### 3. Interface de Bannissement
**Fichier : `netlify/index.html`**
- **Ajout** de l'onglet "🚫 Bans" (Ligne 177).
- **Ajout** de la section `#admin-bans` (Ligne 193) contenant le formulaire d'ajout (Type, Cible, Raison) et la liste des bannis.

**Fichier : `netlify/app.js`**
- **Ajout** de la gestion de l'onglet 'bans' dans `switchAdminTab`.
- **Implémentation** de `loadAdminBans`, `addBan`, `quickBan` (bannissement rapide depuis la liste utilisateurs), et `adminUnban`.

## 📱 AMÉLIORATIONS UTILISATEUR

### 1. Durées de Conversation
**Fichier : `Code.gs`**
- **Mise à jour** de `apiCreateChat` (Ligne 600+) : Prise en charge des durées '1min' et '5min'.

**Fichier : `netlify/index.html`**
- **Ajout** des chips "1 min" et "5 min" dans la vue de création de chat.
- **Ajustement CSS** : Utilisation de `flex-wrap` pour que les chips s'affichent correctement sur mobile.

### 2. Téléchargement Factures Mobile
**Fichier : `netlify/app.js`**
- **Mise à jour** de `generateInvoice` (Ligne 1150+) :
    - Détection du User Agent mobile.
    - Sur mobile, ouverture du PDF via une `data URI` dans une iframe ou un nouvel onglet, contournant les restrictions de téléchargement direct de certains navigateurs mobiles.
    - Passage du fond de la facture en **Blanc** (Light Mode) pour conformité et lisibilité.

## 📋 CHECKLIST DE VALIDATION

- [x] **Legacy Support** : Les anciens fichiers chiffrés sont lisibles.
- [x] **Config Fallback** : Le backend fonctionne même sans Script Properties manuelles.
- [x] **Bans** : Impossible de se connecter/inscrire si IP ou Email banni.
- [x] **Admin IP** : Les admins voient les IP des utilisateurs.
- [x] **Email Facture** : L'admin peut renvoyer une facture par email au client.
- [x] **Mobile** : Les factures s'affichent sur mobile.
- [x] **Durées** : Les chats de 1min et 5min expirent correctement (géré par `apiExpireChat` et `cleanUpExpiredChats`).

---
**Généré par Jules - Ingénieur Logiciel**
