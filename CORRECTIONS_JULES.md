# CORRECTIONS URGENTES - WHATSHAPPEN

Ce document contient les corrections exactes à faire. **Ne touche à rien d'autre.**

---

## TACHE 0 : CREER LE FICHIER RAPPORT

**Jules, tu dois créer un fichier `RAPPORT_CODE.md` qui documente le code.**

### Comment faire :

1. **Créer le fichier** `RAPPORT_CODE.md` dans le projet

2. **Pour chaque fichier (Code.gs, app.js, style.css, index.html)**, documenter :
   - Le nom du fichier
   - Pour chaque fonction/section importante : expliquer en 1-2 phrases ce qu'elle fait
   - Exemple de format :

```markdown
# RAPPORT CODE - WHATSHAPPEN

## Code.gs

### Fonctions d'authentification
- `doPost(e)` : Point d'entrée principal. Reçoit les requêtes HTTP POST et les route vers la bonne fonction API.
- `validateUser(token, email)` : Vérifie que le token JWT est valide et correspond à l'email. Retourne l'utilisateur ou throw une erreur.
- `apiLogin(email, password)` : Authentifie un utilisateur. Vérifie le hash du mot de passe et retourne un token JWT.

### Fonctions de messagerie
- `apiSendMessage(...)` : Envoie un message dans une conversation. Gère texte, images, audio.
- `apiCreateChat(...)` : Crée une nouvelle conversation avec durée d'expiration.

### Fonctions d'abonnement
- `apiGetSubscriptionCode(...)` : Génère un code d'abonnement pour un utilisateur.
- `apiSubmitSubscription(...)` : Soumet une transaction PayPal pour validation.

## app.js

### Initialisation
- `init()` : Initialise l'application au chargement de la page.
- `checkAuth()` : Vérifie si l'utilisateur est connecté via le token stocké.

### Interface utilisateur
- `showSection(name)` : Affiche une section et cache les autres.
- `toggleLoader(show)` : Affiche ou cache le loader de chargement.

(etc...)
```

3. **Ce rapport est à faire UNE SEULE FOIS.** Ensuite, pour les futures modifications, tu mettras à jour uniquement les lignes modifiées.

---

## BUG 1 : FACTURE INTROUVABLE

### Problème
Quand on clique "Envoyer facture", erreur "Facture introuvable pour chaouiengage@gmail.com"

### Cause
Dans `apiSendInvoiceEmail`, la variable `senderEmail` n'existe pas (c'est `email`).

### CORRECTION dans Code.gs - Ligne ~680

**AVANT :**
```javascript
function apiSendInvoiceEmail(token, email, invoiceId, targetEmail) {
    const user = validateUser(token, senderEmail);  // BUG ICI
```

**APRES :**
```javascript
function apiSendInvoiceEmail(token, email, invoiceId, targetEmail) {
    const user = validateUser(token, email);  // CORRIGE
```

---

## BUG 2 : EMAIL CUSTOM - MESSAGE NE S'AFFICHE PAS

### Problème
Dans la section "Emails", quand on envoie un email, l'objet et la PJ fonctionnent mais le message (body) n'apparaît pas sous "WHATSHAPPEN".

### Cause
Le template `getEmailBaseTemplate` attend du HTML structuré avec `<tr><td>`, pas du texte brut.

### CORRECTION dans Code.gs - Fonction apiAdminSendCustomEmail

**REMPLACER :**
```javascript
htmlBody: getEmailBaseTemplate(body.replace(/\n/g, '<br>'))
```

**PAR :**
```javascript
htmlBody: getEmailBaseTemplate(`<tr><td align="center" style="padding:20px;"><p style="color:#fff;font-size:14px;line-height:1.6;">${body.replace(/\n/g, '<br>')}</p></td></tr>`)
```

---

## BUG 3 : LIEN INVITATION INCORRECT

### Problème
Quand on invite quelqu'un qui n'est pas inscrit, le lien envoyé est `whatshappen-v5.netlify.app` au lieu de `chaouiengage.netlify.app`

### CORRECTION dans Code.gs - Fonction getInvitationEmailTemplate

**REMPLACER :**
```javascript
<a href="https://whatshappen-v5.netlify.app"
```

**PAR :**
```javascript
<a href="https://chaouiengage.netlify.app"
```

---

## BUG 4 : FACTURE PDF NON ENVOYEE A LA VALIDATION

### Problème
Quand on valide un abonnement, le message dit "facture envoyée" mais aucun email n'est reçu.

### Cause
La fonction `sendInvoiceWithPdf` essaie de convertir HTML en PDF mais Google Apps Script ne peut pas convertir HTML en PDF directement de cette façon.

### CORRECTION dans Code.gs - Remplacer sendInvoiceWithPdf

```javascript
function sendInvoiceWithPdf(recipientEmail, firstName, invoice) {
    // Créer le PDF avec Google Docs (méthode fiable)
    const folder = getFolder();

    // Créer un document temporaire
    const doc = DocumentApp.create('Facture_' + invoice.reference);
    const body = doc.getBody();

    // Style du document
    body.setMarginTop(40);
    body.setMarginBottom(40);
    body.setMarginLeft(50);
    body.setMarginRight(50);

    // Titre
    const title = body.appendParagraph('WHATSHAPPEN');
    title.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
    title.setFontSize(24);
    title.setForegroundColor('#D4AF37');
    title.setBold(true);

    const subtitle = body.appendParagraph('Messagerie Premium');
    subtitle.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
    subtitle.setFontSize(12);
    subtitle.setForegroundColor('#888888');

    body.appendParagraph('').appendHorizontalRule();

    // FACTURE
    const factureTitle = body.appendParagraph('FACTURE');
    factureTitle.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
    factureTitle.setFontSize(18);
    factureTitle.setBold(true);

    body.appendParagraph('');

    // Infos
    body.appendParagraph('Référence : ' + invoice.reference);
    body.appendParagraph('Date : ' + new Date(invoice.issuedAt).toLocaleDateString('fr-FR'));
    body.appendParagraph('');
    body.appendParagraph('Facturé à : ' + firstName + ' (' + invoice.email + ')');
    body.appendParagraph('');

    // Détail
    const detail = body.appendParagraph('Abonnement Premium - 1 an : ' + invoice.amount + ' EUR');
    detail.setBold(true);

    body.appendParagraph('').appendHorizontalRule();

    // Total
    const total = body.appendParagraph('TOTAL : ' + invoice.amount + ' EUR');
    total.setAlignment(DocumentApp.HorizontalAlignment.RIGHT);
    total.setFontSize(14);
    total.setBold(true);
    total.setForegroundColor('#D4AF37');

    body.appendParagraph('');

    const paid = body.appendParagraph('PAYEE');
    paid.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
    paid.setForegroundColor('#00AA00');
    paid.setBold(true);

    // Sauvegarder
    doc.saveAndClose();

    // Convertir en PDF
    const docFile = DriveApp.getFileById(doc.getId());
    const pdfBlob = docFile.getAs(MimeType.PDF).setName('Facture_' + invoice.reference + '.pdf');

    // Envoyer l'email
    MailApp.sendEmail({
        to: recipientEmail,
        subject: 'Votre facture WhatsHappen ' + invoice.reference,
        htmlBody: getInvoiceEmailTemplate(firstName, invoice),
        attachments: [pdfBlob]
    });

    // Supprimer le document temporaire
    docFile.setTrashed(true);
}
```

---

## AJOUT 1 : DEUX BLACKLISTS SEPAREES

Il faut **DEUX blacklists distinctes** :
- `Blacklist.db` : Pour bloquer les utilisateurs (ban général - déjà existant)
- `SubscriptionBlacklist.db` : Pour bloquer les abonnements uniquement (NOUVEAU)

### ETAPE 1 : Créer les fonctions pour SubscriptionBlacklist.db

**AJOUTER dans Code.gs :**

```javascript
// ========== SUBSCRIPTION BLACKLIST ==========

function readSubscriptionBlacklistDb() {
    const folder = getFolder();
    const files = folder.getFilesByName('SubscriptionBlacklist.db');
    if (files.hasNext()) {
        const content = files.next().getBlob().getDataAsString();
        return JSON.parse(decryptData(content));
    }
    return { bans: [] };
}

function writeSubscriptionBlacklistDb(data) {
    const folder = getFolder();
    const files = folder.getFilesByName('SubscriptionBlacklist.db');
    const content = encryptData(JSON.stringify(data));
    if (files.hasNext()) {
        files.next().setContent(content);
    } else {
        folder.createFile('SubscriptionBlacklist.db', content, MimeType.PLAIN_TEXT);
    }
}

// Admin : Ajouter un ban d'abonnement
function apiAdminAddSubscriptionBan(token, email, type, target, reason) {
    const user = validateUser(token, email);
    if (!user.isAdmin) throw new Error("Admin only");

    const blacklist = readSubscriptionBlacklistDb();

    if (blacklist.bans.some(b => b.type === type && b.target === target)) {
        throw new Error("Déjà dans la blacklist abonnements.");
    }

    blacklist.bans.push({
        type: type,
        target: target,
        reason: reason || '',
        addedBy: email,
        addedAt: new Date().toISOString()
    });

    writeSubscriptionBlacklistDb(blacklist);
    return { success: true };
}

// Admin : Retirer un ban d'abonnement
function apiAdminRemoveSubscriptionBan(token, email, type, target) {
    const user = validateUser(token, email);
    if (!user.isAdmin) throw new Error("Admin only");

    const blacklist = readSubscriptionBlacklistDb();
    const idx = blacklist.bans.findIndex(b => b.type === type && b.target === target);

    if (idx < 0) throw new Error("Non trouvé dans la blacklist.");

    blacklist.bans.splice(idx, 1);
    writeSubscriptionBlacklistDb(blacklist);
    return { success: true };
}

// Admin : Lister les bans d'abonnement
function apiAdminGetSubscriptionBlacklist(token, email) {
    const user = validateUser(token, email);
    if (!user.isAdmin) throw new Error("Admin only");

    return { success: true, bans: readSubscriptionBlacklistDb().bans };
}
```

### ETAPE 2 : Ajouter les cases dans doPost

**AJOUTER dans doPost :**

```javascript
case 'adminAddSubscriptionBan':
    result = apiAdminAddSubscriptionBan(request.token, request.email, request.type, request.target, request.reason);
    break;
case 'adminRemoveSubscriptionBan':
    result = apiAdminRemoveSubscriptionBan(request.token, request.email, request.type, request.target);
    break;
case 'adminGetSubscriptionBlacklist':
    result = apiAdminGetSubscriptionBlacklist(request.token, request.email);
    break;
```

### ETAPE 3 : Vérifier la blacklist abonnement dans apiGetSubscriptionCode

**MODIFIER dans Code.gs - Fonction apiGetSubscriptionCode (ajouter au début) :**

```javascript
function apiGetSubscriptionCode(token, email) {
    const user = validateUser(token, email);

    // Vérifier si banni des abonnements
    const subBlacklist = readSubscriptionBlacklistDb();
    const userDb = readUsersDbCached();
    const currentUser = userDb.users.find(u => u.email === email);
    const userIp = currentUser ? currentUser.firstIp : null;

    if (subBlacklist.bans.some(b => b.type === 'email' && b.target === email)) {
        throw new Error("Vous êtes bloqué pour les abonnements.");
    }
    if (userIp && subBlacklist.bans.some(b => b.type === 'ip' && b.target === userIp)) {
        throw new Error("Vous êtes bloqué pour les abonnements.");
    }

    // ... reste du code existant
```

### ETAPE 4 : Interface admin pour gérer la blacklist abonnements (app.js)

**AJOUTER dans app.js :**

```javascript
// Charger la blacklist abonnements
loadSubscriptionBlacklist: async function() {
    try {
        this.toggleLoader(true);
        const res = await this.api('adminGetSubscriptionBlacklist', {});
        const container = document.getElementById('subscription-blacklist-list');
        if (!container) return;

        if (res.bans.length === 0) {
            container.innerHTML = '<p style="color:#888;">Aucun ban d\'abonnement.</p>';
            return;
        }

        container.innerHTML = res.bans.map(b => `
            <div class="blacklist-item" style="display:flex;justify-content:space-between;align-items:center;padding:10px;border-bottom:1px solid #333;">
                <div>
                    <span style="color:${b.type === 'email' ? '#4a9eff' : '#ff9800'};">[${b.type.toUpperCase()}]</span>
                    <span style="color:#fff;">${b.target}</span>
                    ${b.reason ? `<span style="color:#888;font-size:0.8rem;"> - ${b.reason}</span>` : ''}
                </div>
                <button class="btn-red" style="font-size:0.7rem;padding:5px 10px;" onclick="app.removeSubscriptionBan('${b.type}', '${b.target}')">Retirer</button>
            </div>
        `).join('');
    } catch(e) { this.showError(e.message); } finally { this.toggleLoader(false); }
},

// Ajouter un ban d'abonnement
addSubscriptionBan: async function() {
    const type = document.getElementById('sub-ban-type').value;
    const target = document.getElementById('sub-ban-target').value.trim();
    const reason = document.getElementById('sub-ban-reason').value.trim();

    if (!target) { this.showError("Cible requise"); return; }

    try {
        this.toggleLoader(true);
        await this.api('adminAddSubscriptionBan', { type, target, reason });
        this.showSuccess("Ban ajouté.");
        document.getElementById('sub-ban-target').value = '';
        document.getElementById('sub-ban-reason').value = '';
        this.loadSubscriptionBlacklist();
    } catch(e) { this.showError(e.message); } finally { this.toggleLoader(false); }
},

// Retirer un ban d'abonnement
removeSubscriptionBan: async function(type, target) {
    if (!confirm(`Retirer le ban sur ${target} ?`)) return;
    try {
        this.toggleLoader(true);
        await this.api('adminRemoveSubscriptionBan', { type, target });
        this.showSuccess("Ban retiré.");
        this.loadSubscriptionBlacklist();
    } catch(e) { this.showError(e.message); } finally { this.toggleLoader(false); }
},
```

### ETAPE 5 : HTML pour la section blacklist abonnements (index.html)

**AJOUTER dans la section admin de index.html :**

```html
<!-- Blacklist Abonnements -->
<div class="admin-card">
    <h3>Blacklist Abonnements</h3>
    <p style="color:#888;font-size:0.8rem;">Bloquer des emails/IP pour les abonnements uniquement (séparé de la blacklist générale)</p>

    <div style="display:flex;gap:10px;margin:15px 0;flex-wrap:wrap;">
        <select id="sub-ban-type" style="padding:8px;background:#1a1a2e;color:#fff;border:1px solid #333;border-radius:5px;">
            <option value="email">Email</option>
            <option value="ip">IP</option>
        </select>
        <input type="text" id="sub-ban-target" placeholder="Email ou IP" style="flex:1;min-width:150px;padding:8px;background:#1a1a2e;color:#fff;border:1px solid #333;border-radius:5px;">
        <input type="text" id="sub-ban-reason" placeholder="Raison (optionnel)" style="flex:1;min-width:150px;padding:8px;background:#1a1a2e;color:#fff;border:1px solid #333;border-radius:5px;">
        <button class="btn-gold" onclick="app.addSubscriptionBan()">Bloquer</button>
    </div>

    <div id="subscription-blacklist-list"></div>
</div>
```

### RAPPEL : Blacklist.db vs SubscriptionBlacklist.db

| Fichier | Usage |
|---------|-------|
| `Blacklist.db` | Ban général des utilisateurs (inscription, connexion, messages) |
| `SubscriptionBlacklist.db` | Ban spécifique aux abonnements uniquement |

Les deux sont **indépendants**. Un utilisateur peut être banni des abonnements sans être banni de l'application.

---

## AJOUT 2 : ROLE SUBSCRIBER AUTOMATIQUE A LA SOUMISSION

Actuellement, le rôle `isSubscriber` n'est donné qu'à la validation. Tu veux qu'il soit donné à la soumission (quand l'utilisateur entre sa transaction PayPal).

### CORRECTION dans Code.gs - Fonction apiSubmitSubscription

```javascript
function apiSubmitSubscription(token, email, paypalTransaction) {
    validateUser(token, email);
    const subsDb = readSubscriptionsDb();
    const idx = subsDb.subscriptions.findIndex(s => s.email === email);
    if (idx < 0) throw new Error("Code introuvable.");

    subsDb.subscriptions[idx].paypalTransaction = paypalTransaction;
    subsDb.subscriptions[idx].status = 'pending';
    subsDb.subscriptions[idx].submittedAt = new Date().toISOString();
    writeSubscriptionsDb(subsDb);

    // AJOUTER : Donner le rôle subscriber immédiatement
    const usersDb = readUsersDb();
    const userIdx = usersDb.users.findIndex(u => u.email === email);
    if (userIdx >= 0) {
        usersDb.users[userIdx].isSubscriber = true;
        writeUsersDb(usersDb);
    }

    return { success: true, message: "Envoyé. Votre accès Premium est activé !" };
}
```

---

## AJOUT 3 : REFUSER UN ABONNEMENT (ADMIN)

Ajouter une fonction pour refuser et retirer le rôle subscriber.

### AJOUTER dans Code.gs - Nouvelle fonction

```javascript
function apiAdminRejectSubscription(token, email, targetEmail, reason) {
    const user = validateUser(token, email);
    if (!user.isAdmin) throw new Error("Admin only");

    const subsDb = readSubscriptionsDb();
    const idx = subsDb.subscriptions.findIndex(s => s.email === targetEmail);
    if (idx < 0) throw new Error("Abonnement non trouvé.");

    // Mettre le statut à rejected
    subsDb.subscriptions[idx].status = 'rejected';
    subsDb.subscriptions[idx].rejectedAt = new Date().toISOString();
    subsDb.subscriptions[idx].rejectionReason = reason || 'Non spécifié';
    writeSubscriptionsDb(subsDb);

    // Retirer le rôle subscriber
    const usersDb = readUsersDb();
    const userIdx = usersDb.users.findIndex(u => u.email === targetEmail);
    if (userIdx >= 0) {
        usersDb.users[userIdx].isSubscriber = false;
        writeUsersDb(usersDb);
    }

    // Envoyer email de notification
    try {
        MailApp.sendEmail({
            to: targetEmail,
            subject: "Abonnement WhatsHappen - Problème",
            htmlBody: getEmailBaseTemplate(`<tr><td align="center" style="padding:20px;"><p style="color:#ff4444;font-size:18px;margin-bottom:15px;">Abonnement non validé</p><p style="color:#ccc;font-size:14px;line-height:1.6;">Votre demande d'abonnement n'a pas pu être validée.</p><p style="color:#888;font-size:12px;margin-top:15px;">Raison : ${reason || 'Contactez le support'}</p></td></tr>`)
        });
    } catch(e) {}

    return { success: true };
}
```

### AJOUTER dans doPost - case pour reject

```javascript
case 'adminRejectSubscription':
    result = apiAdminRejectSubscription(request.token, request.email, request.targetEmail, request.reason);
    break;
```

---

## AJOUT 4 : BOUTON REFUSER DANS L'INTERFACE

### CORRECTION dans app.js - Fonction loadAdminSubscriptions

Dans le HTML généré pour chaque abonnement `pending`, ajouter un bouton "Refuser" :

**REMPLACER le bloc pour status === 'pending' :**
```javascript
${s.status === 'pending' ? `
    <div class="validation-form">
        <input type="date" id="start-${s.email}" value="${new Date().toISOString().split('T')[0]}">
        <input type="date" id="end-${s.email}" value="${new Date(new Date().setFullYear(new Date().getFullYear()+1)).toISOString().split('T')[0]}">
        <button class="btn-validate" onclick="app.validateSub('${s.email}')">Valider</button>
        <button class="btn-red" style="font-size:0.7rem;padding:5px 10px;" onclick="app.rejectSub('${s.email}')">Refuser</button>
    </div>
` : ''}
```

### AJOUTER dans app.js - Nouvelle fonction rejectSub

```javascript
rejectSub: async function(email) {
    const reason = await this.showPrompt("Raison du refus", "Motif (optionnel)");
    try {
        this.toggleLoader(true);
        await this.api('adminRejectSubscription', { targetEmail: email, reason: reason || '' });
        this.showSuccess("Abonnement refusé.");
        this.loadAdminSubscriptions();
    } catch(e) { this.showError(e.message); } finally { this.toggleLoader(false); }
},
```

---

## FICHIERS A SUPPRIMER

- `logo_b64.js` ou tout fichier similaire
- `instruction.md` ou tout fichier instruction
- `PROMPT_COMPLET_JULES.md` (ancien)
- `RAPPORT_VERIFICATION.md` (ancien)

---

## RESUME DES MODIFICATIONS

| Fichier | Fonction | Action |
|---------|----------|--------|
| NOUVEAU | RAPPORT_CODE.md | Créer le fichier de documentation du code |
| Code.gs | apiSendInvoiceEmail | Corriger `senderEmail` → `email` |
| Code.gs | apiAdminSendCustomEmail | Ajouter structure HTML au body |
| Code.gs | getInvitationEmailTemplate | Changer URL vers `chaouiengage.netlify.app` |
| Code.gs | sendInvoiceWithPdf | Remplacer par version Google Docs |
| Code.gs | NOUVEAU | Ajouter readSubscriptionBlacklistDb() |
| Code.gs | NOUVEAU | Ajouter writeSubscriptionBlacklistDb() |
| Code.gs | NOUVEAU | Ajouter apiAdminAddSubscriptionBan() |
| Code.gs | NOUVEAU | Ajouter apiAdminRemoveSubscriptionBan() |
| Code.gs | NOUVEAU | Ajouter apiAdminGetSubscriptionBlacklist() |
| Code.gs | apiGetSubscriptionCode | Ajouter vérification SubscriptionBlacklist |
| Code.gs | apiSubmitSubscription | Ajouter isSubscriber = true |
| Code.gs | NOUVEAU | Ajouter apiAdminRejectSubscription |
| Code.gs | doPost | Ajouter 4 nouveaux cases |
| app.js | loadAdminSubscriptions | Ajouter bouton Refuser |
| app.js | NOUVEAU | Ajouter rejectSub() |
| app.js | NOUVEAU | Ajouter loadSubscriptionBlacklist() |
| app.js | NOUVEAU | Ajouter addSubscriptionBan() |
| app.js | NOUVEAU | Ajouter removeSubscriptionBan() |
| index.html | Section admin | Ajouter section Blacklist Abonnements |

---

## CHECKLIST

- [ ] **RAPPORT** : Créer RAPPORT_CODE.md documentant chaque fonction
- [ ] Facture s'envoie par email à la validation
- [ ] Email custom affiche le message sous WHATSHAPPEN
- [ ] Lien invitation pointe vers chaouiengage.netlify.app
- [ ] **Blacklist.db** fonctionne pour les bans généraux (existant)
- [ ] **SubscriptionBlacklist.db** fonctionne pour les bans d'abonnement (NOUVEAU)
- [ ] Interface admin pour gérer la blacklist abonnements
- [ ] Rôle subscriber donné à la soumission (pas seulement validation)
- [ ] Admin peut refuser un abonnement
- [ ] Fichiers inutiles supprimés (logo_b64, instruction, etc.)
