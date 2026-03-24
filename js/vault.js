document.addEventListener('DOMContentLoaded', async function() {
  setupAutoLock(15);
  var vk = sessionStorage.getItem('vk');
  var ek = sessionStorage.getItem('ek');
  if (!vk || !ek) { window.location.href = 'index.html'; return; }

  var d = null, cv = [];
  var cats = ["État civil / Mon identité", "Identifiants & MDP", "Cartes bancaires", "Documents", "Comptes bancaires", "Codes & PIN", "Infos médicales", "Assurances", "Licences", "Notes libres"];
  var catsFa = ["fa-user", "fa-key", "fa-credit-card", "fa-id-card", "fa-university", "fa-lock", "fa-heartbeat", "fa-shield-alt", "fa-barcode", "fa-sticky-note"];
  var cvCat = 0;

  try {
    d = await loadData();
    var h = await hashPassword(vk);
    var he = await hashPassword(ek);
    if (h !== d.vaultHash || he !== d.emergencyHash) { sessionStorage.clear(); window.location.href = 'index.html'; return; }
    cv = decryptData(d.vaultData, vk) || [];
    renderVSidebar();
    renderVList();
  } catch (e) {
    showToast("Erreur init vault", "error");
  }

  document.getElementById('btn-logout-v').addEventListener('click', function() {
    sessionStorage.clear();
    window.location.href = 'index.html';
  });

  document.getElementById('search-v').addEventListener('input', renderVList);

  function renderVSidebar() {
    var hc = '';
    cats.forEach(function(c, i) {
      var act = i === cvCat ? ' active' : '';
      hc += '<div class="nav-item' + act + '" data-vcat="' + i + '"><i class="fas ' + catsFa[i] + '" style="width:24px;"></i> ' + c + '</div>';
    });
    document.getElementById('v-cats').innerHTML = hc;
    document.querySelectorAll('.nav-item[data-vcat]').forEach(function(n) {
      n.addEventListener('click', function() {
        cvCat = parseInt(n.getAttribute('data-vcat'));
        document.getElementById('v-title').textContent = cats[cvCat];
        renderVSidebar();
        renderVList();
      });
    });
    document.getElementById('v-title').textContent = cats[cvCat];
  }

  function renderVList() {
    var v = document.getElementById('search-v').value.toLowerCase();
    var l = document.getElementById('list-v-items');
    var fc = cv.filter(function(x) { return x.cat === cvCat; });
    if (v) {
      fc = fc.filter(function(x) { return JSON.stringify(x).toLowerCase().includes(v); });
    }
    l.innerHTML = '';
    if (fc.length === 0) {
      l.innerHTML = '<div class="text-sm text-gray">Aucun élément dans cette catégorie.</div>';
      return;
    }

    fc.forEach(function(x) {
      var d = document.createElement('div');
      d.className = 'bg-card p-4 rounded-lg mb-4';
      var h = '<div class="flex justify-between items-center mb-4"><div style="font-weight:600;">' + escapeHtml(x.titre || x.f1 || 'Élément') + '</div></div>';

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
});
