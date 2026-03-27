var gD = null;
var gK = { a: null, u: null, v: null, t: null };
var gQ = null;

document.addEventListener('DOMContentLoaded', async function() {
  setupAutoLock(30);

  var ak = sessionStorage.getItem('ak');
  if (!ak) { window.location.href = 'index.html'; return; }
  gK.a = ak;

  document.getElementById('btn-logout').addEventListener('click', function() {
    sessionStorage.clear();
    window.location.href = 'index.html';
  });

  document.getElementById('c-rel').addEventListener('change', function() {
    var a = document.getElementById('c-rel-autre');
    if (this.value === 'Autre') a.classList.remove('hidden');
    else a.classList.add('hidden');
  });

  document.querySelectorAll('.tab-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.tab-btn').forEach(function(b) { b.classList.remove('active'); });
      this.classList.add('active');
      document.querySelectorAll('.tab-content').forEach(function(c) { c.classList.add('hidden'); });
      document.getElementById('tab-' + this.dataset.tab).classList.remove('hidden');
      if (this.dataset.tab === 'testament' && !gQ) initTestament();
    });
  });

  try {
    gD = await loadData();
    if (!gD.isSetup) { window.location.href = 'setup.html'; return; }

    gK.u = decryptData(gD.encryptedEmergencyPassword, gK.a);
    gK.v = decryptData(gD.encryptedVaultPassword, gK.a);
    gK.t = decryptData(gD.encryptedTestamentPassword, gK.a);

    if (!gK.u || !gK.v || !gK.t) {
      showToast('Clé admin invalide', 'error');
      setTimeout(function() { window.location.href = 'index.html'; }, 1000);
      return;
    }

    renderContacts();
    renderVault();
    renderTestament();
    renderSettings();
  } catch (e) {
    showToast('Erreur de chargement', 'error');
  }
});

function initTestament() {
  if (gQ) return;
  gQ = new Quill('#quill-container', {
    theme: 'snow',
    modules: { toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'color': [] }, { 'background': [] }],
      ['clean']
    ]}
  });
  var td = decryptData(gD.testamentData, gK.t) || { content: '' };
  gQ.root.innerHTML = td.content;
}

function renderContacts() {
  var cs = decryptData(gD.contacts, gK.a) || [];
  var html = '';
  cs.forEach(function(c, i) {
    var rel = c.relation === 'Autre' ? c.relationAutre : c.relation;
    html += '<div class="contact-item" data-imp="'+c.importance+'">';
    html += '<div class="contact-header">';
    html += '<div><div class="contact-name">'+escapeHtml(c.nom)+'</div><div class="contact-relation">'+escapeHtml(rel)+'</div></div>';
    html += '<button onclick="deleteContact('+i+')" class="danger" style="width:auto; padding:6px 12px;"><i class="fas fa-trash"></i></button>';
    html += '</div>';
    html += '<div class="contact-actions">';
    if (c.tel) html += '<a href="tel:'+escapeHtml(c.tel)+'" class="link-icon link-phone"><i class="fas fa-phone"></i></a>';
    if (c.mail) html += '<a href="mailto:'+escapeHtml(c.mail)+'" class="link-icon link-email"><i class="fas fa-envelope"></i></a>';
    if (c.wa) html += '<a href="https://wa.me/'+escapeHtml(c.wa)+'" target="_blank" class="link-icon link-whatsapp"><i class="fab fa-whatsapp"></i></a>';
    if (c.tg) html += '<a href="https://t.me/'+escapeHtml(c.tg)+'" target="_blank" class="link-icon link-telegram"><i class="fab fa-telegram-plane"></i></a>';
    if (c.snap) html += '<a href="https://www.snapchat.com/add/'+escapeHtml(c.snap)+'" target="_blank" class="link-icon link-snap"><i class="fab fa-snapchat-ghost"></i></a>';
    if (c.ig) html += '<a href="https://www.instagram.com/'+escapeHtml(c.ig)+'" target="_blank" class="link-icon link-insta"><i class="fab fa-instagram"></i></a>';
    if (c.msg) html += '<a href="https://m.me/'+escapeHtml(c.msg)+'" target="_blank" class="link-icon link-messenger"><i class="fab fa-facebook-messenger"></i></a>';
    html += '</div></div>';
  });
  document.getElementById('contacts-list').innerHTML = html;

  document.getElementById('btn-save-contact').onclick = async function() {
    var n = document.getElementById('c-nom').value;
    if (!n) return showToast('Nom requis', 'error');
    var imp = document.querySelector('input[name="c-imp"]:checked').value;
    var nc = {
      nom: n,
      relation: document.getElementById('c-rel').value,
      relationAutre: document.getElementById('c-rel-autre').value,
      importance: imp,
      tel: document.getElementById('c-tel').value,
      mail: document.getElementById('c-mail').value,
      wa: document.getElementById('c-wa').value,
      tg: document.getElementById('c-tg').value,
      snap: document.getElementById('c-snap').value,
      ig: document.getElementById('c-ig').value,
      msg: document.getElementById('c-msg').value,
      notes: document.getElementById('c-notes').value
    };
    cs.push(nc);
    gD.contacts = encryptData(cs, gK.a);
    gD.emergencyContacts = encryptData(cs, gK.u);
    await postToApi({ action: 'save', data: gD });
    showToast('Contact ajouté', 'success');
    renderContacts();
  };
}

async function deleteContact(idx) {
  if (!await confirmDialog('Supprimer ce contact ?')) return;
  var cs = decryptData(gD.contacts, gK.a) || [];
  cs.splice(idx, 1);
  gD.contacts = encryptData(cs, gK.a);
  gD.emergencyContacts = encryptData(cs, gK.u);
  await postToApi({ action: 'save', data: gD });
  renderContacts();
}

var gVCats = [
  { id: 'identite', icon: 'fa-user', name: 'État civil / Mon identité', fields: ['Nom', 'Prénom', 'Date naissance', 'Lieu', 'Nationalité', 'Adresse', 'Notes'] },
  { id: 'login', icon: 'fa-key', name: 'Identifiants & MDP', fields: ['Service', 'URL', 'Identifiant', 'MDP', 'Notes'] },
  { id: 'cb', icon: 'fa-credit-card', name: 'Cartes bancaires', fields: ['Banque', 'Nom carte', 'Numéro', 'Expiration', 'CVV', 'PIN', 'Plafond', 'Notes'] },
  { id: 'docs', icon: 'fa-id-card', name: 'Documents', fields: ['Type', 'Numéro', 'Dates', 'Lieu', 'Notes'] },
  { id: 'comptes', icon: 'fa-university', name: 'Comptes bancaires', fields: ['Banque', 'Titulaire', 'IBAN', 'BIC', 'N°', 'Agence', 'Notes'] },
  { id: 'codes', icon: 'fa-lock', name: 'Codes & PIN', fields: ['Nom', 'Code', 'Notes'] },
  { id: 'medical', icon: 'fa-heartbeat', name: 'Infos médicales', fields: ['Groupe sanguin', 'Allergies', 'Traitements', 'Médecin', 'N° Sécu', 'Mutuelle', 'N° adhérent', 'Notes'] },
  { id: 'assurances', icon: 'fa-shield-alt', name: 'Assurances', fields: ['Type', 'Compagnie', 'N° contrat', 'Tél', 'Échéance', 'Notes'] },
  { id: 'licences', icon: 'fa-barcode', name: 'Licences', fields: ['Service', 'Clé', 'Email', 'Renouvellement', 'Notes'] },
  { id: 'notes', icon: 'fa-sticky-note', name: 'Notes libres', fields: ['Titre', 'Contenu'] }
];
var gCurVCat = 'identite';

function renderVault() {
  var sb = '';
  gVCats.forEach(function(c) {
    var a = c.id === gCurVCat ? ' active' : '';
    sb += '<button class="cat-btn'+a+'" onclick="setVCat(\''+c.id+'\')"><i class="fas '+c.icon+'"></i> '+c.name+'</button>';
  });
  document.getElementById('vault-sidebar').innerHTML = sb;

  var cat = gVCats.find(function(c) { return c.id === gCurVCat; });
  document.getElementById('vault-cat-title').textContent = cat.name;

  var vd = decryptData(gD.vaultData, gK.v) || [];
  var items = vd.filter(function(i) { return i.cat === gCurVCat; });

  var html = '';
  items.forEach(function(it, idx) {
    html += '<div class="item-row" id="vi-'+it.id+'">';
    html += '<div class="d-flex justify-between mb-2"><strong>'+escapeHtml(it.data[cat.fields[0]]||'Élément');
    if (it.isLocked) html += ' <i class="fas fa-lock" style="color:#fca311;"></i>';
    html += '</strong>';
    var acts = '';
    if (it.isLocked && !it.unlocked) acts += '<button onclick="unlockVaultItem('+it.id+')" class="warning" style="padding:4px 8px; width:auto; margin-right:8px;"><i class="fas fa-unlock"></i></button>';
    if (gCurVCat !== 'identite') acts += '<button onclick="deleteVaultItem('+it.id+')" class="danger" style="padding:4px 8px; width:auto;"><i class="fas fa-trash"></i></button>';
    html += '<div>'+acts+'</div></div>';

    if (it.isLocked && !it.unlocked) {
      html += '<div style="color:#aaa; font-style:italic;">Contenu verrouillé</div></div>';
      return;
    }

    cat.fields.forEach(function(f) {
      if (f === cat.fields[0] || !it.data[f]) return;
      var val = escapeHtml(it.data[f]);
      html += '<div class="mb-2"><span style="color:#aaa; font-size:0.85rem;">'+f+':</span> ';
      if (f === 'MDP' || f === 'CVV' || f === 'PIN' || f === 'Code' || f === 'Clé') {
        var hid = 'v-f-'+it.id+'-'+f;
        html += '<span id="'+hid+'" style="filter:blur(4px); cursor:pointer;" onclick="this.style.filter=\'none\'">'+val+'</span> ';
        html += '<button onclick="copyToClipboard(\''+val+'\')" style="width:auto; padding:2px 6px; background:transparent; color:#457b9d;"><i class="fas fa-copy"></i></button>';
      } else if (f === 'URL') {
        html += '<a href="'+val+'" target="_blank" style="color:#457b9d;">'+val+'</a>';
      } else if (f === 'Notes' || f === 'Contenu') {
        html += '<div style="background:rgba(0,0,0,0.2); padding:8px; border-radius:4px; margin-top:4px;">'+val.replace(/\n/g, '<br>')+'</div>';
      } else {
        html += val;
        html += ' <button onclick="copyToClipboard(\''+val+'\')" style="width:auto; padding:2px 6px; background:transparent; color:#457b9d;"><i class="fas fa-copy"></i></button>';
      }
      html += '</div>';
    });
    html += '</div>';
  });

  document.getElementById('vault-items-list').innerHTML = html;

  document.getElementById('btn-add-vault-item').onclick = function() {
    var c = gVCats.find(function(x) { return x.id === gCurVCat; });
    var mh = '<div class="card"><h3>Nouveau : '+c.name+'</h3><div id="v-form">';
    c.fields.forEach(function(f) {
      if (f === 'Type' && c.id === 'docs') {
        mh += '<label>Type</label><select id="vf-Type"><option>CNI</option><option>Passeport</option><option>Permis</option><option>Autre</option></select>';
      } else if (f === 'Groupe sanguin') {
        mh += '<label>Groupe sanguin</label><select id="vf-Groupe sanguin"><option>A+</option><option>A-</option><option>B+</option><option>B-</option><option>AB+</option><option>AB-</option><option>O+</option><option>O-</option><option>Inconnu</option></select>';
      } else if (f === 'Notes' || f === 'Contenu' || f === 'Adresse') {
        mh += '<label>'+f+'</label><textarea id="vf-'+f+'" rows="3"></textarea>';
      } else if (f === 'MDP' || f === 'CVV' || f === 'PIN' || f === 'Code' || f === 'Clé') {
        mh += '<label>'+f+'</label><div class="input-with-icon"><input type="password" id="vf-'+f+'"><button class="input-icon-btn" onclick="toggleVisibility(this, \'vf-'+f+'\')"><i class="fas fa-eye"></i></button></div>';
      } else {
        mh += '<label>'+f+'</label><input type="text" id="vf-'+f+'">';
      }
    });
    mh += '<div class="mt-3" style="background:rgba(0,0,0,0.2); padding:12px; border-radius:8px;"><label style="display:flex; align-items:center; gap:8px; cursor:pointer;"><input type="checkbox" id="v-is-locked" style="width:auto; margin:0;"> <strong>Verrouiller cet élément</strong></label><div id="v-lock-fields" class="hidden mt-2"><input type="text" id="v-lock-name" placeholder="Prénom requis"><input type="password" id="v-lock-pwd" placeholder="Mot de passe requis"></div></div>';
    mh += '</div><div class="d-flex gap-2 mt-3"><button id="btn-save-v" class="success">Ajouter</button><button id="btn-cancel-v" class="danger">Annuler</button></div></div>';
    openModal(mh);

    var lcb = document.getElementById('v-is-locked');
    if (lcb) {
      lcb.onchange = function() {
        if (this.checked) document.getElementById('v-lock-fields').classList.remove('hidden');
        else document.getElementById('v-lock-fields').classList.add('hidden');
      };
    }

    document.getElementById('btn-cancel-v').onclick = closeModal;
    document.getElementById('btn-save-v').onclick = async function() {
      var nd = {};
      c.fields.forEach(function(f) {
        var el = document.getElementById('vf-'+f);
        if (el) nd[f] = el.value;
      });
      if (!nd[c.fields[0]]) return showToast('Le premier champ est requis', 'error');

      var isLock = document.getElementById('v-is-locked') && document.getElementById('v-is-locked').checked;
      var ln = document.getElementById('v-lock-name') ? document.getElementById('v-lock-name').value : '';
      var lp = document.getElementById('v-lock-pwd') ? document.getElementById('v-lock-pwd').value : '';
      if (isLock && (!ln || !lp)) return showToast('Prénom et mot de passe requis', 'error');

      var d = decryptData(gD.vaultData, gK.v) || [];
      var o = { id: Date.now(), cat: gCurVCat, data: nd };
      if (isLock) { o.lockName = hashPassword(ln); o.lockPwd = hashPassword(lp); o.isLocked = true; o.lockedData = encryptData(nd, lp); o.data = { [c.fields[0]]: nd[c.fields[0]] }; }
      d.push(o);
      gD.vaultData = encryptData(d, gK.v);
      await postToApi({ action: 'save', data: gD });
      closeModal();
      renderVault();
      showToast('Ajouté', 'success');
    };
  };
}

window.setVCat = function(id) {
  gCurVCat = id;
  renderVault();
};

window.deleteVaultItem = async function(id) {
  if (!await confirmDialog('Supprimer cet élément ?')) return;
  var d = decryptData(gD.vaultData, gK.v) || [];
  d = d.filter(function(i) { return i.id !== id; });
  gD.vaultData = encryptData(d, gK.v);
  await postToApi({ action: 'save', data: gD });
  renderVault();
};

window.unlockVaultItem = async function(id) {
  openModal('<div class="text-center"><h3 class="mb-4"><i class="fas fa-lock"></i> Déverrouiller</h3><input type="text" id="u-nom" placeholder="Prénom" class="mb-3"><input type="password" id="u-pwd" placeholder="Mot de passe" class="mb-4"><div class="d-flex justify-between gap-3"><button id="btn-cancel" style="background:#555;">Annuler</button><button id="btn-confirm" class="success">Valider</button></div></div>');
  document.getElementById('btn-cancel').onclick = closeModal;
  document.getElementById('btn-confirm').onclick = function() {
    var n = document.getElementById('u-nom').value;
    var p = document.getElementById('u-pwd').value;
    if (!n || !p) return showToast('Champs requis', 'error');

    var d = decryptData(gD.vaultData, gK.v) || [];
    var item = d.find(function(i) { return i.id === id; });
    if (!item || !item.isLocked) return;

    if (hashPassword(n) === item.lockName && hashPassword(p) === item.lockPwd) {
      var ud = decryptData(item.lockedData, p);
      if (ud) {
        item.data = ud;
        item.unlocked = true;
        gD.vaultData = encryptData(d, gK.v);
        closeModal();
        renderVault();
        showToast('Déverrouillé', 'success');
      } else {
        showToast('Erreur de déchiffrement', 'error');
      }
    } else {
      showToast('Prénom ou mot de passe incorrect', 'error');
    }
  };
};

function renderTestament() {
  var td = decryptData(gD.testamentData, gK.t) || { identity: {}, content: '', lastModified: null };
  document.getElementById('t-nom').value = td.identity.nom || '';
  document.getElementById('t-prenom').value = td.identity.prenom || '';
  document.getElementById('t-dateN').value = td.identity.dateNaissance || '';
  document.getElementById('t-lieuN').value = td.identity.lieuNaissance || '';
  document.getElementById('t-nat').value = td.identity.nationalite || '';
  document.getElementById('t-adresse').value = td.identity.adresse || '';
  if (td.lastModified) document.getElementById('t-status').textContent = 'Dernière modif: ' + td.lastModified;

  document.getElementById('btn-save-test').onclick = async function() {
    var nd = {
      identity: {
        nom: document.getElementById('t-nom').value,
        prenom: document.getElementById('t-prenom').value,
        dateNaissance: document.getElementById('t-dateN').value,
        lieuNaissance: document.getElementById('t-lieuN').value,
        nationalite: document.getElementById('t-nat').value,
        adresse: document.getElementById('t-adresse').value
      },
      content: gQ.root.innerHTML,
      lastModified: formatDateFR(new Date())
    };
    gD.testamentData = encryptData(nd, gK.t);
    await postToApi({ action: 'save', data: gD });
    document.getElementById('t-status').textContent = 'Dernière modif: ' + nd.lastModified;
    showToast('Testament sauvegardé', 'success');
  };

  document.getElementById('btn-pdf-test').onclick = function() {
    var c = gQ.root.innerHTML;
    var d = document.createElement('div');
    d.innerHTML = '<div style="padding:40px; background:#fff; color:#000;">' +
      '<h2 style="text-align:center; text-decoration:underline; margin-bottom:40px;">TESTAMENT — DERNIÈRES VOLONTÉS</h2>' +
      '<div style="margin-bottom:30px;">Je soussigné(e) <strong>' + document.getElementById('t-nom').value + ' ' + document.getElementById('t-prenom').value + '</strong>,<br>' +
      'Né(e) le ' + document.getElementById('t-dateN').value + ' à ' + document.getElementById('t-lieuN').value + '<br>' +
      'De nationalité ' + document.getElementById('t-nat').value + '<br>' +
      'Demeurant au ' + document.getElementById('t-adresse').value + '<br><br>' +
      'Rédige les présentes volontés librement, le <strong>' + formatDateFR(new Date()) + '</strong>.</div>' +
      '<div style="margin-bottom:50px;">' + c + '</div>' +
      '<div style="text-align:right;">Signature :<br><div style="width:200px; height:80px; border-bottom:1px dashed #000; display:inline-block;"></div></div>' +
      '</div>';
    html2pdf().from(d).save('Testament.pdf');
  };

  setInterval(function() {
    if (document.getElementById('tab-testament').classList.contains('hidden')) return;
    document.getElementById('btn-save-test').click();
  }, 30000);
}

function renderSettings() {
  document.getElementById('s-msg-urg').value = decryptData(gD.emergencyMessage, gK.a) || '';

  document.getElementById('btn-save-msg').onclick = async function() {
    var m = document.getElementById('s-msg-urg').value;
    gD.emergencyMessage = encryptData(m, gK.a);
    gD.emergencyMessageForEmergency = encryptData(m, gK.u);
    await postToApi({ action: 'save', data: gD });
    showToast('Message sauvegardé', 'success');
  };

  document.getElementById('btn-change-pwd').onclick = async function() {
    var ty = document.getElementById('s-pwd-type').value;
    var n = document.getElementById('s-pwd-new').value;
    var c = document.getElementById('s-pwd-conf').value;
    if (n.length < 6 || (ty === 'admin' && n.length < 8)) return showToast('Trop court', 'error');
    if (n !== c) return showToast('Mots de passe !=', 'error');

    var h = hashPassword(n);
    if (ty === 'admin') {
      gD.adminHash = h;
      gK.a = n;
      gD.encryptedEmergencyPassword = encryptData(gK.u, n);
      gD.encryptedVaultPassword = encryptData(gK.v, n);
      gD.encryptedTestamentPassword = encryptData(gK.t, n);
      gD.contacts = encryptData(decryptData(gD.contacts, sessionStorage.getItem('ak')), n);
      gD.emergencyMessage = encryptData(decryptData(gD.emergencyMessage, sessionStorage.getItem('ak')), n);
      sessionStorage.setItem('ak', n);
    } else if (ty === 'urg') {
      gD.emergencyHash = h;
      gK.u = n;
      gD.encryptedEmergencyPassword = encryptData(n, gK.a);
      gD.emergencyContacts = encryptData(decryptData(gD.emergencyContacts, sessionStorage.getItem('ak') ? gK.u : null) || decryptData(gD.contacts, gK.a), n);
      gD.emergencyMessageForEmergency = encryptData(decryptData(gD.emergencyMessage, gK.a), n);
    } else if (ty === 'vault') {
      gD.vaultHash = h;
      var od = decryptData(gD.vaultData, gK.v);
      gK.v = n;
      gD.encryptedVaultPassword = encryptData(n, gK.a);
      gD.vaultData = encryptData(od, n);
    } else if (ty === 'test') {
      gD.testamentHash = h;
      var ot = decryptData(gD.testamentData, gK.t);
      gK.t = n;
      gD.encryptedTestamentPassword = encryptData(n, gK.a);
      gD.testamentData = encryptData(ot, n);
    }

    await postToApi({ action: 'save', data: gD });
    showToast('Mot de passe mis à jour', 'success');
    document.getElementById('s-pwd-new').value = '';
    document.getElementById('s-pwd-conf').value = '';
  };

  var lhtml = '';
  if (gD.publicAccessLogs && gD.publicAccessLogs.length > 0) {
    gD.publicAccessLogs.forEach(function(l) {
      lhtml += '<div style="padding:8px; border-bottom:1px solid rgba(255,255,255,0.1); font-size:0.9rem;">';
      lhtml += '<div><strong>'+escapeHtml(l.type)+'</strong> - <span style="color:#aaa;">'+escapeHtml(l.date)+'</span></div>';
      lhtml += '<div style="color:#888;">IP: '+escapeHtml(l.ip);
      if (l.nom) lhtml += ' | Nom: '+escapeHtml(l.nom);
      lhtml += '</div></div>';
    });
  } else {
    lhtml = '<div style="color:#aaa; text-align:center; padding:20px;">Aucun log</div>';
  }
  document.getElementById('logs-list').innerHTML = lhtml;

  document.getElementById('btn-clear-logs').onclick = async function() {
    if (!await confirmDialog('Vider l\'historique ?')) return;
    gD.publicAccessLogs = [];
    await postToApi({ action: 'save', data: gD });
    renderSettings();
  };
}