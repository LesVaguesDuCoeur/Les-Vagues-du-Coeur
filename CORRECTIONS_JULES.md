# CORRECTIONS URGENTES - WHATSHAPPEN

Ce document contient les corrections exactes à faire. **Ne touche à rien d'autre.**

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

## AJOUT 1 : BLOQUER ABONNEMENT PAR EMAIL/IP

Le système de ban existe déjà dans `Blacklist.db`. Il faut juste vérifier lors de la demande d'abonnement.

### CORRECTION dans Code.gs - Fonction apiGetSubscriptionCode (ajouter au début)

```javascript
function apiGetSubscriptionCode(token, email) {
    const user = validateUser(token, email);

    // AJOUTER : Vérifier si banni
    const blacklist = readBlacklistDb();
    const userDb = readUsersDbCached();
    const currentUser = userDb.users.find(u => u.email === email);
    const userIp = currentUser ? currentUser.firstIp : null;

    if (blacklist.bans.some(b => b.type === 'email' && b.target === email)) {
        throw new Error("Vous êtes bloqué pour les abonnements.");
    }
    if (userIp && blacklist.bans.some(b => b.type === 'ip' && b.target === userIp)) {
        throw new Error("Vous êtes bloqué pour les abonnements.");
    }

    // ... reste du code existant
```

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
| Code.gs | apiSendInvoiceEmail | Corriger `senderEmail` → `email` |
| Code.gs | apiAdminSendCustomEmail | Ajouter structure HTML au body |
| Code.gs | getInvitationEmailTemplate | Changer URL vers `chaouiengage.netlify.app` |
| Code.gs | sendInvoiceWithPdf | Remplacer par version Google Docs |
| Code.gs | apiGetSubscriptionCode | Ajouter vérification blacklist |
| Code.gs | apiSubmitSubscription | Ajouter isSubscriber = true |
| Code.gs | NOUVEAU | Ajouter apiAdminRejectSubscription |
| Code.gs | doPost | Ajouter case 'adminRejectSubscription' |
| app.js | loadAdminSubscriptions | Ajouter bouton Refuser |
| app.js | NOUVEAU | Ajouter fonction rejectSub |

---

## CHECKLIST

- [ ] Facture s'envoie par email à la validation
- [ ] Email custom affiche le message sous WHATSHAPPEN
- [ ] Lien invitation pointe vers chaouiengage.netlify.app
- [ ] Utilisateur banni ne peut pas demander d'abonnement
- [ ] Rôle subscriber donné à la soumission (pas seulement validation)
- [ ] Admin peut refuser un abonnement
- [ ] Fichiers inutiles supprimés
