var gD = null;
var gK = null;

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

document.addEventListener('DOMContentLoaded', async function() {
  setupAutoLock(15);

  var vk = sessionStorage.getItem('vk');
  if (!vk) { window.location.href = 'index.html'; return; }
  gK = vk;

  document.getElementById('btn-logout').addEventListener('click', function() {
    sessionStorage.clear();
    window.location.href = 'index.html';
  });

  try {
    gD = await loadData();
    if (!gD.isSetup) { window.location.href = 'index.html'; return; }

    renderVault();
  } catch (e) {
    showToast('Erreur de chargement', 'error');
  }
});

function renderVault() {
  var sb = '';
  gVCats.forEach(function(c) {
    var a = c.id === gCurVCat ? ' active' : '';
    sb += '<button class="cat-btn'+a+'" onclick="setVCat(\''+c.id+'\')"><i class="fas '+c.icon+'"></i> '+c.name+'</button>';
  });
  document.getElementById('vault-sidebar').innerHTML = sb;

  var cat = gVCats.find(function(c) { return c.id === gCurVCat; });
  document.getElementById('vault-cat-title').textContent = cat.name;

  var vd = decryptData(gD.vaultData, gK) || [];
  var items = vd.filter(function(i) { return i.cat === gCurVCat; });

  var html = '';
  items.forEach(function(it) {
    html += '<div class="item-row" id="vi-'+it.id+'">';
    html += '<div class="d-flex justify-between mb-2"><strong>'+escapeHtml(it.data[cat.fields[0]]||'Élément');
    if (it.isLocked) html += ' <i class="fas fa-lock" style="color:#fca311;"></i>';
    html += '</strong>';
    var acts = '';
    if (it.isLocked && !it.unlocked) acts += '<button onclick="unlockVaultItem('+it.id+')" class="warning" style="padding:4px 8px; width:auto; margin-right:8px;"><i class="fas fa-unlock"></i></button>';
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

  if (items.length === 0) html = '<div style="color:#aaa; text-align:center;">Aucun élément</div>';
  document.getElementById('vault-items-list').innerHTML = html;
}

window.setVCat = function(id) {
  gCurVCat = id;
  renderVault();
};

window.unlockVaultItem = async function(id) {
  openModal('<div class="text-center"><h3 class="mb-4"><i class="fas fa-lock"></i> Déverrouiller</h3><input type="text" id="u-nom" placeholder="Prénom" class="mb-3"><input type="password" id="u-pwd" placeholder="Mot de passe" class="mb-4"><div class="d-flex justify-between gap-3"><button id="btn-cancel" style="background:#555;">Annuler</button><button id="btn-confirm" class="success">Valider</button></div></div>');
  document.getElementById('btn-cancel').onclick = closeModal;
  document.getElementById('btn-confirm').onclick = function() {
    var n = document.getElementById('u-nom').value;
    var p = document.getElementById('u-pwd').value;
    if (!n || !p) return showToast('Champs requis', 'error');

    var d = decryptData(gD.vaultData, gK) || [];
    var item = d.find(function(i) { return i.id === id; });
    if (!item || !item.isLocked) return;

    if (hashPassword(n) === item.lockName && hashPassword(p) === item.lockPwd) {
      var ud = decryptData(item.lockedData, p);
      if (ud) {
        item.data = ud;
        item.unlocked = true;
        gD.vaultData = encryptData(d, gK);
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