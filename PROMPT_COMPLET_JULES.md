# PROMPT POUR JULES - WHATSHAPPEN V7

---

# ⛔ RÈGLE ABSOLUE ⛔

**LE SITE FONCTIONNE. TU AJOUTES/CORRIGES UNIQUEMENT CE QUI EST LISTÉ CI-DESSOUS.**

---

# ✅ CE QUI FONCTIONNE - NE TOUCHE À RIEN

- Authentification (login, register, forgot password)
- Emails automatiques (bienvenue, récupération, notification)
- Chiffrement (v1 + legacy fallback)
- Conversations (création, messages, expiration)
- Interface admin (utilisateurs, abonnements)
- Détection contenu illégal (alertes créées)
- Envoi code email pour alertes
- Factures PDF (design Dark Mode OK)

---

# 🔴 BUGS À CORRIGER

## BUG 1 : Backup conversation mal formaté

**Problème :** La modale "Conversation Signalée" affiche "Participants: N/A" et "Aucun message".

**Cause :** `backupFlaggedConversation` stocke `meta` mais le frontend attend `chat` et `participants`.

**CORRECTION dans Code.gs :**

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

  // ✅ FORMAT CORRECT - avec "chat" et "participants" séparés
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

---

## BUG 2 : "Toutes les Conversations" vide

**Problème :** Le bouton affiche "Aucune conversation" même s'il y en a.

**Cause :** `apiSuperAdminGetAllConversations` appelle `apiGetMessages` qui vérifie si l'admin est participant. L'admin n'est pas forcément participant de toutes les convs.

**CORRECTION dans Code.gs :**

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
            // ✅ LIRE DIRECTEMENT le document sans vérifier les participants
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
            // Conversation supprimée ou inaccessible, on ignore
        }
    });

    return { success: true, conversations: allConversations };
}
```

---

## BUG 3 : IP toujours "Unknown"

**Problème :** L'IP n'est pas collectée au moment du message.

**Cause :** Le frontend n'envoie pas l'IP dans la requête sendMessage.

**CORRECTION dans app.js - fonction sendPayload :**

```javascript
sendPayload: async function(content, type, replyTo, clientInfo) {
    // ✅ Ajouter ip et userAgent dans la requête
    await this.api('sendMessage', {
        chatId: this.currentChatId,
        content: content,
        type: type,
        replyTo: replyTo,
        ip: clientInfo.ip,           // ✅ AJOUTER
        location: clientInfo.location, // ✅ AJOUTER
        userAgent: clientInfo.userAgent // ✅ AJOUTER
    });
    await this.loadMessages(this.currentChatId);
}
```

**CORRECTION dans Code.gs - fonction createIllegalContentAlert :**

```javascript
function createIllegalContentAlert(senderId, chatId, messageContent, detectedKeywords, metadata) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
    const alertsDb = readAlertsDb();
    const db = readUsersDb();
    const user = db.users.find(u => u.email === senderId);

    const alert = {
      id: Utilities.getUuid(),
      timestamp: Date.now(),
      status: 'new',
      sender: {
        email: user ? user.email : senderId,
        firstName: user ? user.firstName : 'Unknown',
        ip: metadata.ip || 'Unknown',           // ✅ Stocker l'IP
        location: metadata.location || 'Unknown', // ✅ Stocker la location
        userAgent: metadata.userAgent || 'Unknown'
      },
      chat: { id: chatId },
      detection: {
        keywords: detectedKeywords,
        messagePreview: messageContent.substring(0, 500)
      },
      conversationBackupId: backupFlaggedConversation(chatId)
    };

    alertsDb.alerts.push(alert);
    writeAlertsDb(alertsDb);
  } finally {
    lock.releaseLock();
  }
}
```

**CORRECTION dans Code.gs - fonction apiSendMessage (récupérer les métadonnées) :**

```javascript
function apiSendMessage(token, email, chatId, content, type, replyTo, metadata) {
  const user = validateUser(token, email);
  // ... code existant ...

  // ✅ Utiliser les métadonnées passées en paramètre
  const clientMetadata = {
    ip: metadata.ip || 'Unknown',
    location: metadata.location || 'Unknown',
    userAgent: metadata.userAgent || 'Unknown'
  };

  // Illegal Content Check
  if (type === 'text') {
      const detected = detectIllegalContent(content);
      if (detected) {
          createIllegalContentAlert(email, chatId, content, detected, clientMetadata);
      }
  }
  // ... reste du code ...
}
```

**ET dans doPost, passer les métadonnées à apiSendMessage :**

```javascript
case 'sendMessage':
  // ✅ Passer ip, location, userAgent comme métadonnées
  result = apiSendMessage(
    request.token,
    request.email,
    request.chatId,
    request.content,
    request.type,
    request.replyTo,
    {
      ip: request.ip || 'Unknown',
      location: request.location || 'Unknown',
      userAgent: request.userAgent || 'Unknown'
    }
  );
  break;
```

---

## BUG 4 : Rapport PDF incomplet

**Problème :** Le rapport PDF n'affiche pas la conversation ni la localisation.

**CORRECTION dans app.js - fonction downloadAlertReport :**

Le code actuel est correct mais il dépend des données de `backupFlaggedConversation`. Une fois le BUG 1 corrigé, le rapport fonctionnera.

---

# 🟡 AJOUTS DEMANDÉS

## AJOUT 1 : Durée 1 heure

**Dans index.html, le chip 1h est déjà présent :**
```html
<span class="chip" data-val="1h">1 H</span>
```

**Dans Code.gs - apiCreateChat, vérifier que 1h est géré :**
```javascript
else if (durationStr === '1h') mins = 60;
```

✅ Déjà fait dans le code fourni.

---

## AJOUT 2 : Facture fond blanc (normes FR)

**CORRECTION dans app.js - fonction generateInvoice :**

```javascript
generateInvoice: async function(invoiceId, email) {
    try {
        this.toggleLoader(true);
        const targetEmail = email || this.user.email;
        const res = await this.api('adminGetInvoices', { targetEmail: targetEmail });

        const inv = res.invoices[res.invoices.length-1];
        if (!inv) throw new Error("Aucune facture.");

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        // ✅ FOND BLANC (normes françaises)
        doc.setFillColor(255, 255, 255);
        doc.rect(0, 0, 210, 297, 'F');

        // Titre
        doc.setFontSize(28);
        doc.setTextColor(212, 175, 55); // Or
        doc.text("WHATSHAPPEN", 105, 30, { align: 'center' });

        doc.setFontSize(12);
        doc.setTextColor(100);
        doc.text("Messagerie Premium", 105, 40, { align: 'center' });

        // Cadre
        doc.setDrawColor(212, 175, 55);
        doc.setLineWidth(0.5);
        doc.roundedRect(20, 55, 170, 180, 5, 5);

        // Titre facture
        doc.setFontSize(20);
        doc.setTextColor(0); // Noir
        doc.text("FACTURE", 105, 70, { align: 'center' });

        // Numéro et date
        doc.setFontSize(10);
        doc.setTextColor(80);
        doc.text(`N° ${inv.reference}`, 30, 85);
        doc.text(`Date: ${new Date(inv.issuedAt).toLocaleDateString('fr-FR')}`, 140, 85);

        // Ligne
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

        doc.setFillColor(245, 245, 245); // Gris clair
        doc.roundedRect(30, 150, 150, 30, 3, 3, 'F');

        doc.setTextColor(0);
        doc.text("Abonnement Premium - 1 mois", 35, 162);
        doc.setTextColor(212, 175, 55);
        doc.text(`${inv.amount} €`, 160, 162, { align: 'right' });

        // Total
        doc.setDrawColor(212, 175, 55);
        doc.line(30, 195, 180, 195);

        doc.setFontSize(16);
        doc.setTextColor(0);
        doc.text("TOTAL:", 30, 210);
        doc.setTextColor(212, 175, 55);
        doc.text(`${inv.amount} €`, 160, 210, { align: 'right' });

        // Statut
        doc.setFontSize(14);
        doc.setTextColor(0, 150, 0); // Vert
        doc.text("✓ PAYÉE", 105, 230, { align: 'center' });

        // Footer
        doc.setFontSize(8);
        doc.setTextColor(100);
        doc.text("WhatsHappen - Messagerie Premium Sécurisée", 105, 270, { align: 'center' });

        // Télécharger
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        if (isMobile) {
            const pdfData = doc.output('datauristring');
            const win = window.open();
            win.document.write('<iframe width="100%" height="100%" src="' + pdfData + '"></iframe>');
        } else {
            doc.save(`Facture_${inv.reference}.pdf`);
        }
    } catch(e) {
        this.showError(e.message);
    } finally {
        this.toggleLoader(false);
    }
}
```

---

## AJOUT 3 : Envoi facture par email automatique

Déjà implémenté dans `apiAdminValidateSubscription`. Quand tu valides un abonnement, la facture est créée.

Pour l'envoyer automatiquement par email, ajouter à la fin de `apiAdminValidateSubscription` :

```javascript
// Après writeUsersDb(usersDb);
try {
    MailApp.sendEmail({
        to: targetEmail,
        subject: "Votre facture WhatsHappen " + invoice.reference,
        htmlBody: getInvoiceEmailTemplate(sub.firstName, invoice)
    });
} catch(e) {}

return { success: true, invoice: invoice };
```

---

# ❌ CE QU'IL NE FAUT PAS FAIRE

1. ❌ Utiliser `chaouiengage@icloud.com` - L'admin est `chaouiengage@gmail.com`
2. ❌ Supprimer `LEGACY_CONF`, `decryptLegacyXor()`, ou le fallback legacy
3. ❌ Modifier le système de chiffrement
4. ❌ Casser les emails (templates HTML)
5. ❌ Retourner un simple message au lieu des données demandées
6. ❌ Oublier de passer les métadonnées (ip, location) dans les fonctions

---

# 📋 CHECKLIST

Avant de livrer :

- [ ] `backupFlaggedConversation` retourne le bon format (chat, participants, messages)
- [ ] `apiSuperAdminGetAllConversations` lit directement les docs sans vérifier les participants
- [ ] `sendPayload` envoie ip, location, userAgent
- [ ] `apiSendMessage` reçoit et utilise les métadonnées
- [ ] Facture PDF avec fond blanc
- [ ] Durée 1h fonctionne
- [ ] Rien d'autre n'est cassé

---

# 📁 FICHIERS À LIVRER

1. **Code.gs** - Avec les corrections ci-dessus
2. **app.js** - Avec les corrections ci-dessus
3. **index.html** - Inchangé (1h déjà présent)
4. **style.css** - Inchangé
5. **logo.js** - Inchangé
