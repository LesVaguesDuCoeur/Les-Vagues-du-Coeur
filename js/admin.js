document.addEventListener('DOMContentLoaded', async function() {
  setupAutoLock(30);
  var ak = sessionStorage.getItem('ak');
  if (!ak) { window.location.href = 'index.html'; return; }

  var d = null, ek = null, vk = null, tk = null;
  var c = [], cv = [], t = null, al = [];
  var cats = ["État civil / Mon identité", "Identifiants & MDP", "Cartes bancaires", "Documents", "Comptes bancaires", "Codes & PIN", "Infos médicales", "Assurances", "Licences", "Notes libres"];
  var catsFa = ["fa-user", "fa-key", "fa-credit-card", "fa-id-card", "fa-university", "fa-lock", "fa-heartbeat", "fa-shield-alt", "fa-barcode", "fa-sticky-note"];
  var q = null;
  var lastSave = 0;
  var cvCat = 0;

  try {
    d = await loadData();
    var oh = await hashPassword(ak);
    if (oh !== d.adminHash) { sessionStorage.clear(); window.location.href = 'index.html'; return; }
    ek = decryptData(d.encryptedEmergencyPassword, ak);
    vk = decryptData(d.encryptedVaultPassword, ak);
    tk = decryptData(d.encryptedTestamentPassword, ak);
    c = decryptData(d.contacts, ak) || [];
    cv = decryptData(d.vaultData, vk) || [];
    t = decryptData(d.testamentData, tk) || { identity: {}, content: '', lastModified: null };
    al = decryptData(d.accessLogs, ak) || [];

    document.getElementById('set-msg').value = decryptData(d.emergencyMessage, ak) || "";

    var ci = await getClientInfo();
    al.unshift({ type: "🔐 Admin", date: formatDateFR(new Date()), ip: ci.ip, nom: "Admin" });
    if (al.length > 50) al.length = 50;

    d.accessLogs = encryptData(al, ak);
    await postToApi({ action: 'save', data: d });

    renderContacts();
    renderVaultSidebar();
    renderVaultList();
    renderLogs();

    document.getElementById('t-nom').value = t.identity.nom || "";
    document.getElementById('t-prenom').value = t.identity.prenom || "";
    document.getElementById('t-date').value = t.identity.dateNaissance || "";
    document.getElementById('t-lieu').value = t.identity.lieuNaissance || "";
    document.getElementById('t-nat').value = t.identity.nationalite || "";
    document.getElementById('t-addr').value = t.identity.adresse || "";
  } catch (e) {
    showToast("Erreur init admin", "error");
  }

  document.querySelectorAll('.nav-item[data-tab]').forEach(function(n) {
    n.addEventListener('click', function() {
      document.querySelectorAll('.nav-item[data-tab]').forEach(function(nn) { nn.classList.remove('active'); });
      n.classList.add('active');
      document.querySelectorAll('.tab-content').forEach(function(tc) { tc.classList.remove('active'); });
      var tId = n.getAttribute('data-tab');
      document.getElementById(tId).classList.add('active');
      if (tId === 'tab-testament' && !q) {
        q = new Quill('#quill-editor', { theme: 'snow', modules: { toolbar: [ [{ header: [1, 2, false] }], ['bold', 'italic', 'underline'], [{ list: 'ordered' }, { list: 'bullet' }], ['clean'] ] } });
        if (t.content) { q.root.innerHTML = t.content; }
        q.on('text-change', function() {
          var now = Date.now();
          if (now - lastSave > 30000) { saveTestament(); }
        });
      }
    });
  });

  document.getElementById('btn-logout').addEventListener('click', function() {
    sessionStorage.clear();
    window.location.href = 'index.html';
  });

  document.getElementById('search-contacts').addEventListener('input', renderContacts);
  document.getElementById('btn-add-contact').addEventListener('click', function() { editContact(); });

  function renderContacts() {
    var v = document.getElementById('search-contacts').value.toLowerCase();
    var l = document.getElementById('list-contacts');
    var fc = c.filter(function(x) {
      return (x.nom || "").toLowerCase().includes(v) || (x.relation || "").toLowerCase().includes(v) || (x.tel || "").toLowerCase().includes(v);
    });
    fc.sort(function(a, b) { return (a.importance || 5) - (b.importance || 5); });
    document.getElementById('count-contacts').textContent = fc.length;
    l.innerHTML = '';
    fc.forEach(function(x) {
      var d = document.createElement('div');
      d.className = 'contact-item imp-' + (x.importance || 5) + ' flex justify-between items-center';
      var ic = '';
      if (x.tel) ic += '<a href="tel:' + escapeHtml(x.tel) + '" class="link-icon link-phone"><i class="fas fa-phone"></i></a> ';
      if (x.email) ic += '<a href="mailto:' + escapeHtml(x.email) + '" class="link-icon link-email"><i class="fas fa-envelope"></i></a> ';
      if (x.wa) ic += '<a href="https://wa.me/' + escapeHtml(x.wa) + '" class="link-icon link-whatsapp" target="_blank"><i class="fab fa-whatsapp"></i></a> ';
      if (x.tg) ic += '<a href="https://t.me/' + escapeHtml(x.tg) + '" class="link-icon link-telegram" target="_blank"><i class="fab fa-telegram"></i></a> ';
      if (x.snap) ic += '<a href="https://www.snapchat.com/add/' + escapeHtml(x.snap) + '" class="link-icon link-snap" target="_blank"><i class="fab fa-snapchat-ghost"></i></a> ';
      if (x.insta) ic += '<a href="https://www.instagram.com/' + escapeHtml(x.insta) + '" class="link-icon link-insta" target="_blank"><i class="fab fa-instagram"></i></a> ';
      if (x.msn) ic += '<a href="https://m.me/' + escapeHtml(x.msn) + '" class="link-icon link-messenger" target="_blank"><i class="fab fa-facebook-messenger"></i></a> ';

      d.innerHTML = '<div style="flex:1;">' +
        '<div style="font-weight:600; font-size:1.1rem; color:#fff;">' + escapeHtml(x.nom) + '</div>' +
        '<div class="text-sm text-gray mb-2">' + escapeHtml(x.relation) + (x.relation === 'Autre' && x.relationDesc ? ' - ' + escapeHtml(x.relationDesc) : '') + '</div>' +
        '<div class="flex gap-2">' + ic + '</div>' +
        '</div>' +
        '<div class="flex gap-4">' +
        '<button class="btn btn-secondary btn-edit"><i class="fas fa-edit"></i></button>' +
        '<button class="btn btn-danger btn-del"><i class="fas fa-trash"></i></button>' +
        '</div>';

      d.querySelector('.btn-edit').onclick = function() { editContact(x.id); };
      d.querySelector('.btn-del').onclick = async function() {
        if (await confirmDialog("Supprimer " + x.nom + " ?")) {
          c = c.filter(function(i) { return i.id !== x.id; });
          await saveContacts();
        }
      };
      l.appendChild(d);
    });
  }

  function editContact(id) {
    var ex = c.find(function(x) { return x.id === id; }) || { id: Date.now().toString(), nom: '', relation: '', relationDesc: '', importance: '5', tel: '', email: '', wa: '', tg: '', snap: '', insta: '', msn: '', notes: '' };
    var rels = ["Mère", "Père", "Frère", "Sœur", "Demi-frère", "Demi-sœur", "Grand-père", "Grand-mère", "Oncle", "Tante", "Cousin(e)", "Fils", "Fille", "Conjoint(e)", "Ex-conjoint(e)", "Ami(e) proche", "Meilleur(e) ami(e)", "Connaissance", "Collègue", "Patron/Manager", "Associé(e)", "Client", "Médecin", "Avocat", "Notaire", "Comptable", "Banquier", "Assureur", "Voisin(e)", "Propriétaire/Bailleur", "Professeur", "Famille éloignée", "Autre"];
    var rs = '<select id="fc-rel" class="input-field mb-4"><option value="">-- Relation --</option>';
    rels.forEach(function(r) {
      rs += '<option value="' + r + '"' + (ex.relation === r ? ' selected' : '') + '>' + r + '</option>';
    });
    rs += '</select>';

    var h = '<h3>' + (id ? 'Éditer' : 'Nouveau') + ' contact</h3>' +
      '<input type="text" id="fc-nom" class="input-field mb-4" placeholder="Nom complet *" value="' + escapeHtml(ex.nom) + '">' +
      rs +
      '<input type="text" id="fc-reld" class="input-field mb-4" placeholder="Préciser la relation" value="' + escapeHtml(ex.relationDesc || '') + '" style="display:' + (ex.relation === 'Autre' ? 'block' : 'none') + ';">' +
      '<label class="text-sm text-gray" style="display:block; margin-bottom:4px;">Importance (1=Max, 5=Min)</label>' +
      '<div class="importance-selector mb-4">';
    for (var i = 1; i <= 5; i++) {
      h += '<label class="imp-btn" data-value="' + i + '"><input type="radio" name="fc-imp" value="' + i + '"' + (ex.importance == i ? ' checked' : '') + '><span>' + i + '</span></label>';
    }
    h += '</div>' +
      '<input type="tel" id="fc-tel" class="input-field mb-4" placeholder="Téléphone" value="' + escapeHtml(ex.tel) + '">' +
      '<input type="email" id="fc-email" class="input-field mb-4" placeholder="Email" value="' + escapeHtml(ex.email) + '">' +
      '<div class="grid grid-cols-2 gap-4 mb-4">' +
      '<input type="text" id="fc-wa" class="input-field" placeholder="Numéro WhatsApp (336...)" value="' + escapeHtml(ex.wa) + '">' +
      '<input type="text" id="fc-tg" class="input-field" placeholder="Username Telegram (sans @)" value="' + escapeHtml(ex.tg) + '">' +
      '<input type="text" id="fc-snap" class="input-field" placeholder="Username Snapchat" value="' + escapeHtml(ex.snap) + '">' +
      '<input type="text" id="fc-insta" class="input-field" placeholder="Username Instagram" value="' + escapeHtml(ex.insta) + '">' +
      '<input type="text" id="fc-msn" class="input-field" placeholder="Username Messenger" value="' + escapeHtml(ex.msn) + '">' +
      '</div>' +
      '<textarea id="fc-notes" class="input-field mb-4" rows="3" placeholder="Notes (allergies, adresses, etc)">' + escapeHtml(ex.notes) + '</textarea>' +
      '<div class="flex gap-4 mt-6"><button id="fc-cancel" class="btn btn-secondary flex-1">Annuler</button><button id="fc-save" class="btn btn-primary flex-1">Enregistrer</button></div>';

    openModal(h);

    document.getElementById('fc-rel').onchange = function(e) {
      document.getElementById('fc-reld').style.display = e.target.value === 'Autre' ? 'block' : 'none';
    };

    document.getElementById('fc-cancel').onclick = function() { closeModal(); };
    document.getElementById('fc-save').onclick = async function() {
      var n = document.getElementById('fc-nom').value;
      if (!n) { showToast("Nom obligatoire", "error"); return; }
      var im = 5;
      document.querySelectorAll('input[name="fc-imp"]').forEach(function(r) { if (r.checked) im = r.value; });
      ex.nom = n;
      ex.relation = document.getElementById('fc-rel').value;
      ex.relationDesc = document.getElementById('fc-reld').value;
      ex.importance = im;
      ex.tel = document.getElementById('fc-tel').value;
      ex.email = document.getElementById('fc-email').value;
      ex.wa = document.getElementById('fc-wa').value;
      ex.tg = document.getElementById('fc-tg').value;
      ex.snap = document.getElementById('fc-snap').value;
      ex.insta = document.getElementById('fc-insta').value;
      ex.msn = document.getElementById('fc-msn').value;
      ex.notes = document.getElementById('fc-notes').value;

      var idx = c.findIndex(function(x) { return x.id === id; });
      if (idx >= 0) c[idx] = ex; else c.push(ex);

      closeModal();
      await saveContacts();
    };
  }

  async function saveContacts() {
    d.contacts = encryptData(c, ak);
    d.emergencyContacts = encryptData(c, ek);
    await postToApi({ action: 'save', data: d });
    renderContacts();
    showToast("Contacts sauvegardés", "success");
  }

  document.getElementById('btn-add-vault').addEventListener('click', function() { editVault(); });
  document.getElementById('search-vault').addEventListener('input', renderVaultList);

  function renderVaultSidebar() {
    var hc = '';
    cats.forEach(function(c, i) {
      var act = i === cvCat ? ' active' : '';
      hc += '<div class="nav-item' + act + '" data-vcat="' + i + '"><i class="fas ' + catsFa[i] + '" style="width:24px;"></i> ' + c + '</div>';
    });
    document.getElementById('vault-categories').innerHTML = hc;
    document.querySelectorAll('.nav-item[data-vcat]').forEach(function(n) {
      n.addEventListener('click', function() {
        cvCat = parseInt(n.getAttribute('data-vcat'));
        renderVaultSidebar();
        renderVaultList();
      });
    });
  }

  function renderVaultList() {
    var v = document.getElementById('search-vault').value.toLowerCase();
    var l = document.getElementById('list-vault');
    var fc = cv.filter(function(x) { return x.cat === cvCat; });
    if (v) {
      fc = fc.filter(function(x) {
        return JSON.stringify(x).toLowerCase().includes(v);
      });
    }
    l.innerHTML = '';
    if (fc.length === 0) {
      l.innerHTML = '<div class="text-sm text-gray">Aucun élément dans cette catégorie.</div>';
      return;
    }
    fc.forEach(function(x) {
      var d = document.createElement('div');
      d.className = 'bg-card p-4 rounded-lg mb-4';
      var h = '<div class="flex justify-between items-center mb-4"><div style="font-weight:600;">' + escapeHtml(x.titre || x.f1 || 'Élément') + '</div><div class="flex gap-4"><button class="btn btn-secondary btn-edit"><i class="fas fa-edit"></i></button>';
      if (cvCat !== 0) {
        h += '<button class="btn btn-danger btn-del"><i class="fas fa-trash"></i></button>';
      }
      h += '</div></div>';

      var b = '';
      if (cvCat === 0) {
        b += pF("Nom", x.f1) + pF("Prénom", x.f2) + pF("Date naissance", x.f3) + pF("Lieu", x.f4) + pF("Nationalité", x.f5) + pF("Adresse", x.f6) + pF("Notes", x.f7);
      } else if (cvCat === 1) {
        b += pF("URL", x.f2, true) + pF("Identifiant", x.f3, false, true) + pSec("MDP", x.id, x.f4) + pF("Notes", x.f5);
      } else if (cvCat === 2) {
        b += pF("Nom carte", x.f2) + pSec("Numéro", x.id+"_n", x.f3, true) + pF("Expiration", x.f4) + pSec("CVV", x.id+"_c", x.f5) + pSec("PIN", x.id+"_p", x.f6) + pF("Plafond", x.f7) + pF("Notes", x.f8);
      } else if (cvCat === 3) {
        b += pF("Type", x.f1) + pF("Numéro", x.f2, false, true) + pF("Dates", x.f3) + pF("Lieu", x.f4) + pF("Notes", x.f5);
      } else if (cvCat === 4) {
        b += pF("Titulaire", x.f2) + pSec("IBAN", x.id+"_i", x.f3) + pF("BIC", x.f4, false, true) + pF("N°", x.f5) + pF("Agence", x.f6) + pF("Notes", x.f7);
      } else if (cvCat === 5) {
        b += pSec("Code", x.id, x.f2) + pF("Notes", x.f3);
      } else if (cvCat === 6) {
        b += pF("Groupe sanguin", x.f1) + pF("Allergies", x.f2) + pF("Traitements", x.f3) + pF("Médecin", x.f4) + pSec("N° Sécu", x.id+"_s", x.f5) + pF("Mutuelle", x.f6) + pF("N° adhérent", x.f7) + pF("Notes", x.f8);
      } else if (cvCat === 7) {
        b += pF("Compagnie", x.f2) + pF("N° contrat", x.f3, false, true) + pF("Tél", x.f4) + pF("Échéance", x.f5) + pF("Notes", x.f6);
      } else if (cvCat === 8) {
        b += pSec("Clé", x.id, x.f2) + pF("Email", x.f3) + pF("Renouvellement", x.f4) + pF("Notes", x.f5);
      } else if (cvCat === 9) {
        b += '<div style="white-space:pre-wrap; color:#ccc;">' + escapeHtml(x.f2) + '</div>';
      }

      d.innerHTML = h + '<div class="grid grid-cols-2 gap-4">' + b + '</div>';
      d.querySelector('.btn-edit').onclick = function() { editVault(x.id); };
      var del = d.querySelector('.btn-del');
      if (del) del.onclick = async function() {
        if (await confirmDialog("Supprimer cet élément ?")) {
          cv = cv.filter(function(i) { return i.id !== x.id; });
          await saveVault();
        }
      };

      d.querySelectorAll('.fa-eye').forEach(function(ic) {
        ic.parentNode.onclick = function() { toggleVisibility(ic.parentNode, ic.parentNode.previousElementSibling.id); };
      });
      d.querySelectorAll('.fa-copy').forEach(function(ic) {
        ic.parentNode.onclick = function() { copyToClipboard(ic.getAttribute('data-v')); };
      });
      l.appendChild(d);
    });
  }

  function pF(l, v, isU, isC) {
    if (!v) return '';
    var r = '<div><span class="text-sm text-gray" style="display:block; margin-bottom:4px;">' + l + '</span><div class="flex items-center gap-2">';
    if (isU) r += '<a href="' + escapeHtml(v) + '" target="_blank" class="text-sm" style="color:#457b9d;">' + escapeHtml(v) + '</a>';
    else r += '<span style="color:#fff;">' + escapeHtml(v) + '</span>';
    if (isC) r += '<button class="btn-icon" title="Copier"><i class="fas fa-copy" data-v="' + escapeHtml(v) + '"></i></button>';
    return r + '</div></div>';
  }

  function pSec(l, i, v, mask4) {
    if (!v) return '';
    var d = mask4 ? (v.length > 4 ? "****" + v.slice(-4) : v) : v;
    var t = mask4 ? 'text' : 'password';
    var ro = mask4 ? 'readonly' : 'readonly';
    return '<div><span class="text-sm text-gray" style="display:block; margin-bottom:4px;">' + l + '</span><div class="input-group" style="background:transparent;"><input type="' + t + '" id="' + i + '" value="' + escapeHtml(d) + '" ' + ro + ' style="background:transparent; border:none; color:#fff; width:100px; outline:none;" data-real="' + escapeHtml(v) + '"><button class="btn-icon" title="Voir/Cacher"><i class="fas fa-eye"></i></button><button class="btn-icon" title="Copier"><i class="fas fa-copy" data-v="' + escapeHtml(v) + '"></i></button></div></div>';
  }

  function editVault(id) {
    var ex = cv.find(function(x) { return x.id === id; }) || { id: Date.now().toString(), cat: cvCat, f1: '', f2: '', f3: '', f4: '', f5: '', f6: '', f7: '', f8: '' };
    var t = 'Nouvel élément';
    if (id) t = 'Éditer élément';
    if (cvCat === 0 && !id) t = 'Créer État civil';
    var h = '<h3>' + t + '</h3>';

    if (cvCat === 0) {
      h += iF("f1", "Nom", ex.f1) + iF("f2", "Prénom", ex.f2) + '<input type="date" id="vf3" class="input-field mb-4" value="' + escapeHtml(ex.f3) + '">' + iF("f4", "Lieu", ex.f4) + iF("f5", "Nationalité", ex.f5) + iF("f6", "Adresse", ex.f6) + tA("f7", "Notes", ex.f7);
    } else if (cvCat === 1) {
      h += iF("f1", "Service", ex.f1) + iF("f2", "URL", ex.f2) + iF("f3", "Identifiant", ex.f3) + iF("f4", "Mot de passe", ex.f4) + tA("f5", "Notes", ex.f5);
    } else if (cvCat === 2) {
      h += iF("f1", "Banque", ex.f1) + iF("f2", "Nom carte", ex.f2) + iF("f3", "Numéro", ex.f3) + iF("f4", "Expiration", ex.f4) + iF("f5", "CVV", ex.f5) + iF("f6", "PIN", ex.f6) + iF("f7", "Plafond", ex.f7) + tA("f8", "Notes", ex.f8);
    } else if (cvCat === 3) {
      var ts = ["CNI", "Passeport", "Permis", "Titre de séjour", "Autre"];
      var ss = '<select id="vf1" class="input-field mb-4">';
      ts.forEach(function(o) { ss += '<option value="' + o + '"' + (ex.f1 === o ? ' selected' : '') + '>' + o + '</option>'; });
      ss += '</select>';
      h += ss + iF("f2", "Numéro", ex.f2) + iF("f3", "Dates (ex: 01/20-01/30)", ex.f3) + iF("f4", "Lieu d'émission", ex.f4) + tA("f5", "Notes", ex.f5);
    } else if (cvCat === 4) {
      h += iF("f1", "Banque", ex.f1) + iF("f2", "Titulaire", ex.f2) + iF("f3", "IBAN", ex.f3) + iF("f4", "BIC", ex.f4) + iF("f5", "N° compte", ex.f5) + iF("f6", "Agence", ex.f6) + tA("f7", "Notes", ex.f7);
    } else if (cvCat === 5) {
      h += iF("f1", "Nom (ex: Alarme, Tel)", ex.f1) + iF("f2", "Code/PIN", ex.f2) + tA("f3", "Notes", ex.f3);
    } else if (cvCat === 6) {
      var bg = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "Inconnu"];
      var sb = '<select id="vf1" class="input-field mb-4">';
      bg.forEach(function(o) { sb += '<option value="' + o + '"' + (ex.f1 === o ? ' selected' : '') + '>' + o + '</option>'; });
      sb += '</select>';
      h += sb + iF("f2", "Allergies", ex.f2) + iF("f3", "Traitements", ex.f3) + iF("f4", "Médecin", ex.f4) + iF("f5", "N° Sécurité Sociale", ex.f5) + iF("f6", "Mutuelle", ex.f6) + iF("f7", "N° Adhérent", ex.f7) + tA("f8", "Notes", ex.f8);
    } else if (cvCat === 7) {
      var as = ["Auto", "Habitation", "Santé", "Vie", "RC", "Autre"];
      var sa = '<select id="vf1" class="input-field mb-4">';
      as.forEach(function(o) { sa += '<option value="' + o + '"' + (ex.f1 === o ? ' selected' : '') + '>' + o + '</option>'; });
      sa += '</select>';
      h += sa + iF("f2", "Compagnie", ex.f2) + iF("f3", "N° contrat", ex.f3) + iF("f4", "Téléphone assistance", ex.f4) + iF("f5", "Échéance", ex.f5) + tA("f6", "Notes", ex.f6);
    } else if (cvCat === 8) {
      h += iF("f1", "Service / Logiciel", ex.f1) + iF("f2", "Clé / Licence", ex.f2) + iF("f3", "Email lié", ex.f3) + iF("f4", "Date de renouvellement", ex.f4) + tA("f5", "Notes", ex.f5);
    } else if (cvCat === 9) {
      h += iF("f1", "Titre", ex.f1) + '<textarea id="vf2" class="input-field mb-4" rows="10" placeholder="Contenu">' + escapeHtml(ex.f2) + '</textarea>';
    }

    h += '<div class="flex gap-4 mt-6"><button id="v-cancel" class="btn btn-secondary flex-1">Annuler</button><button id="v-save" class="btn btn-primary flex-1">Enregistrer</button></div>';

    openModal(h);

    document.getElementById('v-cancel').onclick = function() { closeModal(); };
    document.getElementById('v-save').onclick = async function() {
      if (cvCat === 0) { ex.titre = "Mon identité"; ex.f1 = gV('vf1'); ex.f2 = gV('vf2'); ex.f3 = gV('vf3'); ex.f4 = gV('vf4'); ex.f5 = gV('vf5'); ex.f6 = gV('vf6'); ex.f7 = gV('vf7'); }
      else if (cvCat === 1) { ex.titre = gV('vf1'); ex.f1 = gV('vf1'); ex.f2 = gV('vf2'); ex.f3 = gV('vf3'); ex.f4 = gV('vf4'); ex.f5 = gV('vf5'); }
      else if (cvCat === 2) { ex.titre = gV('vf1') + " " + gV('vf2'); ex.f1 = gV('vf1'); ex.f2 = gV('vf2'); ex.f3 = gV('vf3'); ex.f4 = gV('vf4'); ex.f5 = gV('vf5'); ex.f6 = gV('vf6'); ex.f7 = gV('vf7'); ex.f8 = gV('vf8'); }
      else if (cvCat === 3) { ex.titre = gV('vf1'); ex.f1 = gV('vf1'); ex.f2 = gV('vf2'); ex.f3 = gV('vf3'); ex.f4 = gV('vf4'); ex.f5 = gV('vf5'); }
      else if (cvCat === 4) { ex.titre = gV('vf1'); ex.f1 = gV('vf1'); ex.f2 = gV('vf2'); ex.f3 = gV('vf3'); ex.f4 = gV('vf4'); ex.f5 = gV('vf5'); ex.f6 = gV('vf6'); ex.f7 = gV('vf7'); }
      else if (cvCat === 5) { ex.titre = gV('vf1'); ex.f1 = gV('vf1'); ex.f2 = gV('vf2'); ex.f3 = gV('vf3'); }
      else if (cvCat === 6) { ex.titre = "Infos " + gV('vf1'); ex.f1 = gV('vf1'); ex.f2 = gV('vf2'); ex.f3 = gV('vf3'); ex.f4 = gV('vf4'); ex.f5 = gV('vf5'); ex.f6 = gV('vf6'); ex.f7 = gV('vf7'); ex.f8 = gV('vf8'); }
      else if (cvCat === 7) { ex.titre = gV('vf1') + " " + gV('vf2'); ex.f1 = gV('vf1'); ex.f2 = gV('vf2'); ex.f3 = gV('vf3'); ex.f4 = gV('vf4'); ex.f5 = gV('vf5'); ex.f6 = gV('vf6'); }
      else if (cvCat === 8) { ex.titre = gV('vf1'); ex.f1 = gV('vf1'); ex.f2 = gV('vf2'); ex.f3 = gV('vf3'); ex.f4 = gV('vf4'); ex.f5 = gV('vf5'); }
      else if (cvCat === 9) { ex.titre = gV('vf1'); ex.f1 = gV('vf1'); ex.f2 = gV('vf2'); }

      var idx = cv.findIndex(function(x) { return x.id === id; });
      if (idx >= 0) cv[idx] = ex; else cv.push(ex);

      closeModal();
      await saveVault();
    };
  }

  function iF(id, p, v) { return '<input type="text" id="v' + id + '" class="input-field mb-4" placeholder="' + p + '" value="' + escapeHtml(v) + '">'; }
  function tA(id, p, v) { return '<textarea id="v' + id + '" class="input-field mb-4" rows="3" placeholder="' + p + '">' + escapeHtml(v) + '</textarea>'; }
  function gV(id) { var el = document.getElementById(id); return el ? el.value : ''; }

  async function saveVault() {
    d.vaultData = encryptData(cv, vk);
    await postToApi({ action: 'save', data: d });
    renderVaultList();
    showToast("Coffre-fort mis à jour", "success");
  }

  document.getElementById('btn-testament-save').addEventListener('click', saveTestament);
  document.getElementById('btn-testament-pdf').addEventListener('click', generatePDF);

  async function saveTestament() {
    var nb = document.getElementById('btn-testament-save');
    nb.disabled = true;
    nb.innerHTML = '<i class="fas fa-spinner fa-spin mr-2" style="margin-right:8px;"></i> Enregistrement...';

    t.identity.nom = document.getElementById('t-nom').value;
    t.identity.prenom = document.getElementById('t-prenom').value;
    t.identity.dateNaissance = document.getElementById('t-date').value;
    t.identity.lieuNaissance = document.getElementById('t-lieu').value;
    t.identity.nationalite = document.getElementById('t-nat').value;
    t.identity.adresse = document.getElementById('t-addr').value;
    t.content = q.root.innerHTML;
    t.lastModified = new Date().toISOString();

    d.testamentData = encryptData(t, tk);
    await postToApi({ action: 'save', data: d });

    lastSave = Date.now();
    nb.disabled = false;
    nb.innerHTML = '<i class="fas fa-save mr-2" style="margin-right:8px;"></i> Sauvegarder';
    showToast("Testament sauvegardé", "success");
  }

  function generatePDF() {
    var pdf = new window.jspdf.jsPDF();
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(18);
    pdf.text("TESTAMENT — DERNIÈRES VOLONTÉS", 105, 20, null, null, "center");

    pdf.setFontSize(12);
    pdf.setFont("helvetica", "normal");
    var y = 40;
    var ni = t.identity;
    var ds = "";
    if (ni.dateNaissance) { var d=new Date(ni.dateNaissance); ds = ("0"+d.getDate()).slice(-2)+"/"+("0"+(d.getMonth()+1)).slice(-2)+"/"+d.getFullYear(); }

    pdf.text("Je soussigné(e), " + (ni.prenom||"") + " " + (ni.nom||"") + ",", 20, y); y += 10;
    pdf.text("Né(e) le " + ds + " à " + (ni.lieuNaissance||"") + ", de nationalité " + (ni.nationalite||"") + ",", 20, y); y += 10;
    pdf.text("Résidant au : " + (ni.adresse||"") + ",", 20, y); y += 15;
    pdf.text("Déclare formuler mes dernières volontés comme suit :", 20, y); y += 15;

    pdf.setFont("helvetica", "bold");
    pdf.text("DISPOSITIONS", 20, y); y += 10;
    pdf.setFont("helvetica", "normal");

    var lines = pdf.splitTextToSize(q.getText(), 170);
    pdf.text(lines, 20, y);

    var lc = lines.length;
    y += (lc * 7) + 20;

    if (y > 270) { pdf.addPage(); y = 30; }

    var fd = new Date();
    var fds = ("0"+fd.getDate()).slice(-2)+"/"+("0"+(fd.getMonth()+1)).slice(-2)+"/"+fd.getFullYear();
    pdf.text("Fait le " + fds, 130, y); y += 10;
    pdf.text("Signature :", 130, y);

    pdf.save("Testament_" + (ni.nom||"") + ".pdf");
  }

  document.getElementById('btn-change-pwd').addEventListener('click', async function() {
    var ca = document.getElementById('c-admin').value;
    var cu = document.getElementById('c-urg').value;
    var cvd = document.getElementById('c-vault').value;
    var ct = document.getElementById('c-test').value;
    if (!ca || !cu || !cvd || !ct) { showToast("Tous les champs sont requis", "error"); return; }
    if (ca.length < 8) { showToast("Admin min 8 chars", "error"); return; }
    if (cu.length < 6 || cvd.length < 6 || ct.length < 6) { showToast("Autres min 6 chars", "error"); return; }

    var s = new Set([ca, cu, cvd, ct]);
    if (s.size !== 4) { showToast("Les 4 doivent être différents", "error"); return; }

    if (!await confirmDialog("Vous allez rechiffrer tout le coffre. Êtes-vous sûr ?")) return;

    var b = document.getElementById('btn-change-pwd');
    b.disabled = true;
    b.textContent = "Rechiffrement en cours...";

    var ha = await hashPassword(ca);
    var hu = await hashPassword(cu);
    var hv = await hashPassword(cvd);
    var hte = await hashPassword(ct);

    d.adminHash = ha;
    d.emergencyHash = hu;
    d.vaultHash = hv;
    d.testamentHash = hte;

    d.encryptedEmergencyPassword = encryptData(cu, ca);
    d.encryptedVaultPassword = encryptData(cvd, ca);
    d.encryptedTestamentPassword = encryptData(ct, ca);

    d.contacts = encryptData(c, ca);
    d.emergencyContacts = encryptData(c, cu);
    d.vaultData = encryptData(cv, cvd);
    d.testamentData = encryptData(t, ct);

    var msg = document.getElementById('set-msg').value;
    d.emergencyMessage = encryptData(msg, ca);
    d.emergencyMessageForEmergency = encryptData(msg, cu);
    d.accessLogs = encryptData(al, ca);

    await postToApi({ action: 'save', data: d });

    sessionStorage.setItem('ak', ca);
    ak = ca;
    ek = cu;
    vk = cvd;
    tk = ct;

    b.disabled = false;
    b.textContent = "Appliquer les nouveaux mots de passe";

    document.getElementById('c-admin').value = '';
    document.getElementById('c-urg').value = '';
    document.getElementById('c-vault').value = '';
    document.getElementById('c-test').value = '';

    showToast("Mots de passe changés et données rechiffrées", "success");
  });

  document.getElementById('btn-save-msg').addEventListener('click', async function() {
    var msg = document.getElementById('set-msg').value;
    d.emergencyMessage = encryptData(msg, ak);
    d.emergencyMessageForEmergency = encryptData(msg, ek);
    await postToApi({ action: 'save', data: d });
    showToast("Message enregistré", "success");
  });

  function renderLogs() {
    var pL = d.publicAccessLogs || [];
    var a = [].concat(al, pL);
    a.sort(function(x, y) {
      function pD(s) {
        if (!s) return 0;
        var p = s.split(' à ');
        if (p.length !== 2) return 0;
        var d = p[0].split('/');
        var h = p[1].replace('h', ':').split(':');
        return new Date(d[2], d[1]-1, d[0], h[0], h[1]).getTime();
      }
      return pD(y.date) - pD(x.date);
    });

    var l = document.getElementById('list-logs');
    l.innerHTML = '';
    a.slice(0, 50).forEach(function(x) {
      var n = document.createElement('div');
      n.className = 'text-sm mb-2 pb-2';
      n.style.borderBottom = '1px solid rgba(255,255,255,0.05)';
      var tp = x.type || 'Inconnu';
      var c = '#fff';
      if (tp.includes('Admin')) c = '#06d6a0';
      if (tp.includes('Panique')) c = '#e63946';
      if (tp.includes('Urgence')) c = '#fca311';
      if (tp.includes('suspecte')) c = '#e63946';

      n.innerHTML = '<div style="color:' + c + '; font-weight:600;">' + escapeHtml(tp) + '</div><div style="color:#aaa;">' + escapeHtml(x.date) + ' — IP: ' + escapeHtml(x.ip || '?') + (x.nom ? ' — Nom: ' + escapeHtml(x.nom) : '') + '</div>';
      l.appendChild(n);
    });
  }
});
