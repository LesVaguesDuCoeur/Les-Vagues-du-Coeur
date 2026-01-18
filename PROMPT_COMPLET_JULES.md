# PROMPT WHATSHAPPEN - VERSION COMPLETE POUR JULES

---

## CONTEXTE DU PROJET

WhatsHappen est une application de messagerie sécurisée et éphémère hébergée sur Netlify (frontend) avec un backend Google Apps Script.

**Architecture :**
- **Frontend** : HTML/CSS/JS statique sur Netlify
- **Backend** : Google Apps Script (Code.gs)
- **Base de données** : Fichiers JSON chiffrés sur Google Drive
- **Chiffrement** : Hash-Stream Cipher (v1) + fallback legacy XOR

---

## STRUCTURE DES FICHIERS

```
netlify/functions/ (ou racine)
├── index.html      # Page principale
├── style.css       # Styles (thème dark, gold)
├── app.js          # Logique frontend
├── logo.js         # Logo base64
└── Code.gs         # Backend Apps Script (sur Google)
```

**Fichiers de base de données (Drive) :**
- `Users.db` - Utilisateurs
- `Settings.db` - Paramètres
- `Subscriptions.db` - Abonnements
- `Invoices.db` - Factures
- `Alerts.db` - Alertes contenu illégal
- `Chats.db` - Index des conversations

---

## CONFIGURATION IMPORTANTE

### Admin Email
```
ADMIN_EMAIL = "chaouiengage@gmail.com"
```
**JAMAIS** `chaouiengage@icloud.com` !

### Encodage Legacy (NE PAS MODIFIER)
```javascript
const LEGACY_CONF = {
  folder: "MUlOMnBTSWhqVl8zRm4tQl9XTE1VZ05GY1FkTE9qYlly",
  admin: "Y2hhb3VpZW5nYWdlQGdtYWlsLmNvbQ==",
  key: "Q2hhb3VpU2VjcmV0S2V5VjJfTmF0aXZl"
};
```

---

# BUGS A CORRIGER IMPERATIVEMENT

---

## BUG 1 : DUREES 1H NE S'AFFICHE PAS SUR MOBILE

### Problème
Les chips de durée (1min, 5min, 10min, 1h, etc.) ne s'affichent pas correctement sur mobile.

### Cause
Le conteneur `.chips-row` n'a pas le bon style pour mobile (flex-wrap manquant).

### CORRECTION dans style.css

```css
.chips-row {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    justify-content: center;
    margin: 15px 0;
}

.chip {
    padding: 8px 16px;
    border: 1px solid var(--gold);
    border-radius: 20px;
    background: transparent;
    color: var(--gold);
    cursor: pointer;
    transition: all 0.3s;
    font-size: 0.85rem;
    white-space: nowrap;
}

.chip.selected {
    background: var(--gold);
    color: #000;
}

/* MOBILE FIX */
@media (max-width: 480px) {
    .chips-row {
        flex-wrap: wrap;
        gap: 6px;
    }

    .chip {
        padding: 6px 12px;
        font-size: 0.75rem;
    }
}
```

### VERIFICATION dans index.html
S'assurer que tous les chips sont présents :
```html
<div class="chips-row">
    <span class="chip" data-val="1min">1 MIN</span>
    <span class="chip" data-val="5min">5 MIN</span>
    <span class="chip" data-val="10min">10 MIN</span>
    <span class="chip" data-val="1h">1 H</span>
    <span class="chip" data-val="12h">12 H</span>
    <span class="chip selected" data-val="24h">24 H</span>
    <span class="chip" data-val="48h">48 H</span>
    <span class="chip" data-val="unlimited">∞</span>
</div>
```

### VERIFICATION dans Code.gs - apiCreateChat
```javascript
let expiresAt = null;
if (durationStr !== 'unlimited') {
    const now = new Date();
    let mins = 0;
    if (durationStr === '1min') mins = 1;
    else if (durationStr === '5min') mins = 5;
    else if (durationStr === '10min') mins = 10;
    else if (durationStr === '1h') mins = 60;        // <-- IMPORTANT
    else if (durationStr === '12h') mins = 12 * 60;
    else if (durationStr === '24h') mins = 24 * 60;
    else if (durationStr === '48h') mins = 48 * 60;
    else if (durationStr.endsWith('h')) mins = parseInt(durationStr) * 60;
    else if (durationStr.endsWith('m')) mins = parseInt(durationStr);
    if (mins > 0) expiresAt = new Date(now.getTime() + mins * 60000).toISOString();
}
```

---

## BUG 2 : IP TOUJOURS "UNKNOWN"

### Problème
L'adresse IP n'est plus collectée et affiche toujours "Unknown" dans les alertes et rapports.

### Cause
La chaîne de transmission IP est cassée :
1. `getClientInfo()` récupère l'IP mais...
2. `sendMessage()` ne passe pas les infos à `sendPayload()`
3. `sendPayload()` ne les envoie pas à l'API
4. `apiSendMessage()` ne les reçoit pas
5. `createIllegalContentAlert()` reçoit des valeurs vides

### CORRECTION COMPLETE

#### 1. Dans app.js - Fonction sendMessage (ligne ~350)
```javascript
sendMessage: async function() {
    const input = document.getElementById('message-input');
    const fileInput = document.getElementById('file-input');
    const btn = document.getElementById('btn-send');
    const text = input.value;
    const hasFile = fileInput.files.length > 0;
    if (!text.trim() && !hasFile) return;

    btn.disabled = true;
    btn.style.opacity = "0.5";

    // CRUCIAL: Récupérer les infos client AVANT d'envoyer
    const clientInfo = await this.getClientInfo();

    try {
        const replyId = this.replyingTo ? this.replyingTo.id : null;
        if (hasFile) {
            const file = fileInput.files[0];
            const reader = new FileReader();
            reader.onload = async (e) => {
                await this.sendPayload(e.target.result, 'image', replyId, clientInfo);
                fileInput.value = '';
            };
            reader.readAsDataURL(file);
        } else {
            await this.sendPayload(text, 'text', replyId, clientInfo);
            input.value = '';
        }
        this.cancelReply();
    } catch (e) {
        this.showError("Erreur envoi: " + e.message);
    } finally {
        btn.disabled = false;
        btn.style.opacity = "1";
        input.focus();
    }
}
```

#### 2. Dans app.js - Fonction sendPayload
```javascript
sendPayload: async function(content, type, replyTo, clientInfo) {
    await this.api('sendMessage', {
        chatId: this.currentChatId,
        content: content,
        type: type,
        replyTo: replyTo,
        ip: clientInfo.ip,
        location: clientInfo.location,
        userAgent: clientInfo.userAgent
    });
    await this.loadMessages(this.currentChatId);
}
```

#### 3. Dans Code.gs - doPost, case 'sendMessage'
```javascript
case 'sendMessage':
    const metadata = {
        ip: request.ip || 'Unknown',
        location: request.location || 'Unknown',
        userAgent: request.userAgent || 'Unknown',
        timestamp: Date.now()
    };
    result = apiSendMessage(request.token, request.email, request.chatId, request.content, request.type, request.replyTo, metadata);
    break;
```

#### 4. Dans Code.gs - Fonction apiSendMessage (signature avec metadata)
```javascript
function apiSendMessage(token, email, chatId, content, type, replyTo, metadata) {
    const user = validateUser(token, email);
    const doc = DocumentApp.openById(chatId);
    const body = doc.getBody();
    const metaEnc = body.getParagraphs()[0].getText();
    const meta = JSON.parse(_xDec(metaEnc));
    if (!meta.participants.includes(email)) throw new Error("Accès refusé");

    // UTILISER les métadonnées passées en paramètre
    const clientMetadata = {
        ip: metadata.ip || 'Unknown',
        location: metadata.location || 'Unknown',
        userAgent: metadata.userAgent || 'Unknown'
    };

    // Detection contenu illégal avec les vraies métadonnées
    if (type === 'text') {
        const detected = detectIllegalContent(content);
        if (detected) {
            createIllegalContentAlert(email, chatId, content, detected, clientMetadata);
        }
    }

    const msg = {
        id: Utilities.getUuid(),
        sender: email,
        senderName: user.firstName,
        content: content,
        type: type || 'text',
        timestamp: new Date().toISOString(),
        replyTo: replyTo || null,
        readBy: [],
        deliveredTo: []
    };

    const msgEnc = _xEnc(JSON.stringify(msg));
    body.appendParagraph(msgEnc);
    doc.saveAndClose();
    updateChatMetadata(chatId, msg, meta.participants);

    meta.participants.forEach(pEmail => {
        if (pEmail !== email) notifyInactiveUser(pEmail);
    });

    return { success: true };
}
```

---

## BUG 3 : "TOUTES LES CONVERSATIONS" AFFICHE "AUCUNE"

### Problème
Le bouton "Accès Toutes Conversations" du Super Admin affiche "Aucune conversation" même s'il y en a sur le Drive.

### Cause
La fonction `apiSuperAdminGetAllConversations` essaie d'appeler `apiGetMessages` qui vérifie si l'admin est participant. Comme l'admin n'est pas forcément participant de toutes les conversations, ça échoue.

### CORRECTION dans Code.gs

```javascript
function apiSuperAdminGetAllConversations(token, email, accessCode) {
    const user = validateUser(token, email);
    if (email !== ADMIN_EMAIL) throw new Error("Super Admin uniquement");

    const cache = CacheService.getScriptCache();
    const stored = cache.get('superadmin_access_' + email);
    if (!stored || JSON.parse(stored).code !== accessCode) throw new Error("Code invalide");

    const chatsDb = readChatsDb();
    const usersDb = readUsersDb();
    const allConversations = [];

    chatsDb.chats.forEach(c => {
        try {
            // LIRE DIRECTEMENT le document sans vérifier les participants
            const doc = DocumentApp.openById(c.id);
            const body = doc.getBody();
            const paras = body.getParagraphs();
            const metaEnc = paras[0].getText();
            const meta = JSON.parse(_xDec(metaEnc));

            // Récupérer les messages
            const messages = [];
            for (let i = 1; i < paras.length; i++) {
                const txt = paras[i].getText();
                if (!txt) continue;
                try {
                    const m = JSON.parse(_xDec(txt));
                    messages.push(m);
                } catch (e) {}
            }

            // Récupérer les infos des participants
            const participants = meta.participants.map(pEmail => {
                const u = usersDb.users.find(x => x.email === pEmail);
                return { email: pEmail, firstName: u ? u.firstName : pEmail };
            });

            allConversations.push({
                id: c.id,
                chat: {
                    id: c.id,
                    createdAt: meta.createdAt,
                    expiresAt: meta.expiresAt
                },
                participants: participants,
                messages: messages,
                names: meta.participantNames.join(', ')
            });
        } catch(e) {
            // Conversation supprimée ou inaccessible - ignorer silencieusement
        }
    });

    return { success: true, conversations: allConversations };
}
```

### CORRECTION dans app.js - displayAllConversationsModal

```javascript
displayAllConversationsModal: function(conversations) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.id = 'all-conv-modal';

    let html = '';
    if (conversations && conversations.length > 0) {
        conversations.forEach((conv, index) => {
            // Déterminer le nom des participants
            let parts = 'N/A';
            if (conv.participants && conv.participants.length > 0) {
                parts = conv.participants.map(p => p.firstName).join(', ');
            } else if (conv.names) {
                parts = conv.names;
            }

            const lastMsg = conv.messages && conv.messages.length > 0
                ? conv.messages[conv.messages.length - 1]
                : null;
            const lastMsgPreview = lastMsg
                ? (lastMsg.content.substring(0, 50) + '...')
                : 'Aucun message';
            const msgCount = conv.messages ? conv.messages.length : 0;
            const dateStr = conv.chat && conv.chat.createdAt
                ? new Date(conv.chat.createdAt).toLocaleString('fr-FR')
                : '';

            html += `
                <div class="conv-card" onclick="app.viewConversationDetail(${index})">
                    <div class="conv-header">
                        <strong>${parts}</strong>
                        <span class="msg-count">${msgCount} messages</span>
                    </div>
                    <div class="conv-preview">${lastMsgPreview}</div>
                    <div class="conv-date">${dateStr}</div>
                </div>`;
        });
    } else {
        html = '<p class="no-data">Aucune conversation trouvée.</p>';
    }

    modal.innerHTML = `
        <div class="modal-content large">
            <div class="modal-header">
                <h2>Toutes les Conversations</h2>
                <button class="close-btn" onclick="document.getElementById('all-conv-modal').remove()">X</button>
            </div>
            <div class="all-convs-container">${html}</div>
        </div>`;
    document.body.appendChild(modal);
    this.allConversationsCache = conversations;
}
```

---

## BUG 4 : RAPPORT PDF INCOMPLET

### Problème
Le rapport PDF des alertes n'affiche pas la conversation ni les informations correctement.

### Cause
La fonction `backupFlaggedConversation` ne stocke pas les données dans le bon format attendu par le frontend.

### CORRECTION dans Code.gs - backupFlaggedConversation

```javascript
function backupFlaggedConversation(chatId) {
    const folder = getFolder();
    let flaggedFolder = getOrCreateFolder(folder, 'FlaggedChats');

    const doc = DocumentApp.openById(chatId);
    const body = doc.getBody();
    const paras = body.getParagraphs();
    const metaEnc = paras[0].getText();
    const meta = JSON.parse(_xDec(metaEnc));

    // Récupérer les messages
    const messages = [];
    for (let i = 1; i < paras.length; i++) {
        const txt = paras[i].getText();
        if (!txt) continue;
        try {
            const m = JSON.parse(_xDec(txt));
            messages.push(m);
        } catch (e) {}
    }

    // Récupérer les infos des participants depuis la DB
    const usersDb = readUsersDb();
    const participants = meta.participants.map(email => {
        const user = usersDb.users.find(u => u.email === email);
        return {
            email: email,
            firstName: user ? user.firstName : email
        };
    });

    // FORMAT CORRECT avec "chat" et "participants" séparés
    const backup = {
        chatId: chatId,
        backupDate: Date.now(),
        chat: {
            id: chatId,
            createdAt: meta.createdAt,
            expiresAt: meta.expiresAt,
            participantNames: meta.participantNames
        },
        participants: participants,
        messages: messages
    };

    const backupEncrypted = _xEnc(JSON.stringify(backup));
    const backupFileName = 'FLAGGED_' + chatId + '_' + Date.now() + '.backup';
    const backupFile = flaggedFolder.createFile(backupFileName, backupEncrypted, MimeType.PLAIN_TEXT);
    return backupFile.getId();
}
```

### VERIFICATION de getOrCreateFolder
```javascript
function getOrCreateFolder(parent, name) {
    const folders = parent.getFoldersByName(name);
    if (folders.hasNext()) return folders.next();
    return parent.createFolder(name);
}
```

---

## BUG 5 : FACTURE PAS AUX NORMES FR (FOND BLANC)

### Problème
La facture PDF a un fond noir au lieu d'un fond blanc requis par les normes françaises.

### CORRECTION dans app.js - generateInvoice

```javascript
generateInvoice: async function(invoiceId, email) {
    try {
        this.toggleLoader(true);
        const targetEmail = email || this.user.email;
        const res = await this.api('adminGetInvoices', { targetEmail: targetEmail });

        const inv = res.invoices[res.invoices.length - 1];
        if (!inv) throw new Error("Aucune facture.");

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        // FOND BLANC (OBLIGATOIRE normes FR)
        doc.setFillColor(255, 255, 255);
        doc.rect(0, 0, 210, 297, 'F');

        // Logo/Titre
        doc.setFontSize(28);
        doc.setTextColor(212, 175, 55);
        doc.text("WHATSHAPPEN", 105, 30, { align: 'center' });

        doc.setFontSize(12);
        doc.setTextColor(100);
        doc.text("Messagerie Premium", 105, 40, { align: 'center' });

        // Cadre principal
        doc.setDrawColor(212, 175, 55);
        doc.setLineWidth(0.5);
        doc.roundedRect(20, 55, 170, 180, 5, 5);

        // Titre FACTURE
        doc.setFontSize(20);
        doc.setTextColor(0);
        doc.text("FACTURE", 105, 70, { align: 'center' });

        // Numéro et date
        doc.setFontSize(10);
        doc.setTextColor(80);
        doc.text(`N° ${inv.reference}`, 30, 85);
        doc.text(`Date: ${new Date(inv.issuedAt).toLocaleDateString('fr-FR')}`, 140, 85);

        // Ligne de séparation
        doc.setDrawColor(212, 175, 55);
        doc.line(30, 92, 180, 92);

        // Infos client
        doc.setFontSize(12);
        doc.setTextColor(0);
        doc.text("Facturé à:", 30, 105);
        doc.setTextColor(50);
        doc.text(inv.firstName || 'Client', 30, 115);
        doc.text(inv.email, 30, 123);

        // Détail
        doc.setTextColor(0);
        doc.text("Détail:", 30, 145);

        // Zone détail gris clair
        doc.setFillColor(245, 245, 245);
        doc.roundedRect(30, 150, 150, 30, 3, 3, 'F');

        doc.setTextColor(0);
        doc.text("Abonnement Premium - 1 mois", 35, 162);
        doc.setTextColor(212, 175, 55);
        doc.text(`${inv.amount} EUR`, 160, 162, { align: 'right' });

        // Ligne total
        doc.setDrawColor(212, 175, 55);
        doc.line(30, 195, 180, 195);

        doc.setFontSize(16);
        doc.setTextColor(0);
        doc.text("TOTAL:", 30, 210);
        doc.setTextColor(212, 175, 55);
        doc.text(`${inv.amount} EUR`, 160, 210, { align: 'right' });

        // Statut payé
        doc.setFontSize(14);
        doc.setTextColor(0, 150, 0);
        doc.text("PAYEE", 105, 230, { align: 'center' });

        // Footer
        doc.setFontSize(8);
        doc.setTextColor(100);
        doc.text("WhatsHappen - Messagerie Premium Securisee", 105, 270, { align: 'center' });

        // Téléchargement adapté mobile
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        if (isMobile) {
            const pdfData = doc.output('datauristring');
            const win = window.open();
            win.document.write('<iframe width="100%" height="100%" src="' + pdfData + '"></iframe>');
        } else {
            doc.save(`Facture_${inv.reference}.pdf`);
        }
    } catch (e) {
        this.showError(e.message);
    } finally {
        this.toggleLoader(false);
    }
}
```

---

# AJOUTS DEMANDES

---

## AJOUT 1 : Envoi automatique facture par email

### Dans Code.gs - apiAdminValidateSubscription, ajouter à la fin :

```javascript
function apiAdminValidateSubscription(token, email, targetEmail, startDate, endDate) {
    // ... code existant jusqu'à writeUsersDb ...

    // ENVOI EMAIL AUTOMATIQUE
    try {
        MailApp.sendEmail({
            to: targetEmail,
            subject: "Votre facture WhatsHappen " + invoice.reference,
            htmlBody: getInvoiceEmailTemplate(sub.firstName, invoice)
        });
    } catch(e) {
        Logger.log("Erreur envoi email facture: " + e.message);
    }

    return { success: true, invoice: invoice };
}
```

---

# CE QUI FONCTIONNE - NE PAS TOUCHER

- Authentification (login, register, forgot password)
- Emails automatiques (bienvenue, récupération, notification)
- Chiffrement (v1 + legacy fallback)
- Conversations de base (création, messages, expiration)
- Interface admin (utilisateurs, abonnements)
- Détection contenu illégal (création des alertes)

---

# CE QU'IL NE FAUT JAMAIS FAIRE

1. NE JAMAIS utiliser `chaouiengage@icloud.com` - L'admin est `chaouiengage@gmail.com`
2. NE JAMAIS supprimer `LEGACY_CONF`, `decryptLegacyXor()`, ou le fallback legacy
3. NE JAMAIS modifier le système de chiffrement existant
4. NE JAMAIS casser les templates email HTML
5. NE JAMAIS retourner un simple message string au lieu de l'objet attendu
6. NE JAMAIS oublier de passer les métadonnées (ip, location, userAgent)

---

# CHECKLIST AVANT LIVRAISON

- [ ] Chips de durée visibles sur mobile (flex-wrap)
- [ ] 1h fonctionne dans apiCreateChat
- [ ] IP/Location transmises : sendMessage -> sendPayload -> api -> doPost -> apiSendMessage
- [ ] backupFlaggedConversation retourne le bon format (chat, participants, messages)
- [ ] apiSuperAdminGetAllConversations lit directement les documents
- [ ] Facture PDF avec fond BLANC
- [ ] Email facture envoyé automatiquement
- [ ] Rien d'autre n'est cassé

---

# FICHIERS A LIVRER

1. **Code.gs** - Backend complet corrigé
2. **app.js** - Frontend complet corrigé
3. **style.css** - Avec fix mobile pour chips
4. **index.html** - Avec tous les chips de durée
5. **logo.js** - Inchangé

---

# FIN DU PROMPT
