document.addEventListener('DOMContentLoaded', async () => {
  const kV = sessionStorage.getItem('k_vault');
  if (!kV) { window.location.href = 'index.html'; return; }

  const d = await loadData();
  const vd = decryptData(d.vaultData, kV) || [];

  setupAutoLock(15);

  const cats = [
    { id: 0, icon: 'fa-user', name: 'État civil / Mon identité' },
    { id: 1, icon: 'fa-key', name: 'Identifiants & MDP' },
    { id: 2, icon: 'fa-credit-card', name: 'Cartes bancaires' },
    { id: 3, icon: 'fa-id-card', name: 'Documents' },
    { id: 4, icon: 'fa-university', name: 'Comptes bancaires' },
    { id: 5, icon: 'fa-lock', name: 'Codes & PIN' },
    { id: 6, icon: 'fa-heartbeat', name: 'Infos médicales' },
    { id: 7, icon: 'fa-shield-alt', name: 'Assurances' },
    { id: 8, icon: 'fa-barcode', name: 'Licences' },
    { id: 9, icon: 'fa-sticky-note', name: 'Notes libres' }
  ];
  let curCat = 0;

  function renderSb() {
    const sb = document.getElementById('vaultSidebar');
    sb.innerHTML = cats.map(c => `
      <button class="vault-cat ${curCat === c.id ? 'active' : ''}" onclick="window.selCat(${c.id})">
        <i class="fas ${c.icon} w-6 text-center"></i> ${escapeHtml(c.name)}
      </button>
    `).join('');
    document.getElementById('vaultCatTitle').innerHTML = `<i class="fas ${cats[curCat].icon}"></i> ${escapeHtml(cats[curCat].name)}`;
    renderItms();
  }

  window.selCat = (id) => { curCat = id; renderSb(); };

  function renderItms() {
    const l = document.getElementById('vaultItemList');
    l.innerHTML = '';
    const itms = vd.filter(i => i.catId === curCat);

    if (itms.length === 0) {
      l.innerHTML = '<div class="text-center text-muted py-8">Aucun élément accessible</div>';
      return;
    }

    itms.forEach((i, idx) => {
      if (i.locked) {
        l.innerHTML += `<div class="bg-element p-4 rounded border flex justify-center items-center text-warning gap-2"><i class="fas fa-lock"></i> Contenu verrouillé</div>`;
        return;
      }

      const el = document.createElement('div');
      el.className = 'bg-element p-4 rounded border text-sm flex flex-col gap-2';

      let h = '';
      if (curCat === 0) {
        if(i.nom) h += `<div><span class="text-muted">Nom:</span> ${escapeHtml(i.nom)}</div>`;
        if(i.prenom) h += `<div><span class="text-muted">Prénom:</span> ${escapeHtml(i.prenom)}</div>`;
        if(i.date) h += `<div><span class="text-muted">Date Nais.:</span> ${escapeHtml(i.date)}</div>`;
        if(i.lieu) h += `<div><span class="text-muted">Lieu:</span> ${escapeHtml(i.lieu)}</div>`;
        if(i.natio) h += `<div><span class="text-muted">Nat.:</span> ${escapeHtml(i.natio)}</div>`;
        if(i.adr) h += `<div><span class="text-muted">Adr.:</span> ${escapeHtml(i.adr)}</div>`;
        if(i.notes) h += `<div><span class="text-muted">Notes:</span> ${escapeHtml(i.notes)}</div>`;
      } else if (curCat === 1) {
        h += `<div><span class="text-muted">Service:</span> ${escapeHtml(i.service)}</div>`;
        if(i.url) h += `<div><span class="text-muted">URL:</span> <a href="${i.url}" target="_blank" class="text-accent underline">${escapeHtml(i.url)}</a></div>`;
        if(i.id) h += `<div class="flex items-center justify-between"><span class="text-muted">ID:</span> <div>${escapeHtml(i.id)} <button class="action-btn inline-flex" onclick="copyToClipboard('${escapeHtml(i.id)}')"><i class="fas fa-copy"></i></button></div></div>`;
        if(i.pwd) h += `<div class="flex items-center justify-between"><span class="text-muted">MDP:</span> <div class="flex gap-2"><input type="password" value="${escapeHtml(i.pwd)}" id="p_${idx}" readonly class="bg-transparent border-none text-white w-32 p-0"><button class="action-btn inline-flex" onclick="toggleVisibility(this, 'p_${idx}')"><i class="fas fa-eye"></i></button><button class="action-btn inline-flex" onclick="copyToClipboard(document.getElementById('p_${idx}').value)"><i class="fas fa-copy"></i></button></div></div>`;
      } else if (curCat === 2) {
        h += `<div><span class="text-muted">Banque:</span> ${escapeHtml(i.banque)}</div>`;
        h += `<div><span class="text-muted">Nom:</span> ${escapeHtml(i.nom)}</div>`;
        if(i.num) h += `<div class="flex items-center justify-between"><span class="text-muted">N°:</span> <div>**** **** **** ${escapeHtml(i.num.slice(-4))} <button class="action-btn inline-flex" onclick="copyToClipboard('${escapeHtml(i.num)}')"><i class="fas fa-copy"></i></button></div></div>`;
        h += `<div><span class="text-muted">Exp:</span> ${escapeHtml(i.exp)}</div>`;
        if(i.cvv) h += `<div class="flex items-center justify-between"><span class="text-muted">CVV:</span> <div class="flex gap-2"><input type="password" value="${escapeHtml(i.cvv)}" id="c_${idx}" readonly class="bg-transparent border-none text-white w-16 p-0"><button class="action-btn inline-flex" onclick="toggleVisibility(this, 'c_${idx}')"><i class="fas fa-eye"></i></button></div></div>`;
        if(i.pin) h += `<div class="flex items-center justify-between"><span class="text-muted">PIN:</span> <div class="flex gap-2"><input type="password" value="${escapeHtml(i.pin)}" id="pi_${idx}" readonly class="bg-transparent border-none text-white w-16 p-0"><button class="action-btn inline-flex" onclick="toggleVisibility(this, 'pi_${idx}')"><i class="fas fa-eye"></i></button></div></div>`;
      } else if (curCat === 3) {
        h += `<div><span class="text-muted">Type:</span> ${escapeHtml(i.type)}</div>`;
        if(i.num) h += `<div class="flex items-center justify-between"><span class="text-muted">N°:</span> <div>${escapeHtml(i.num)} <button class="action-btn inline-flex" onclick="copyToClipboard('${escapeHtml(i.num)}')"><i class="fas fa-copy"></i></button></div></div>`;
        if(i.dates) h += `<div><span class="text-muted">Dates:</span> ${escapeHtml(i.dates)}</div>`;
      } else if (curCat === 4) {
        h += `<div><span class="text-muted">Banque:</span> ${escapeHtml(i.banque)}</div>`;
        if(i.iban) h += `<div class="flex items-center justify-between"><span class="text-muted">IBAN:</span> <div class="flex gap-2"><input type="password" value="${escapeHtml(i.iban)}" id="i_${idx}" readonly class="bg-transparent border-none text-white w-48 p-0"><button class="action-btn inline-flex" onclick="toggleVisibility(this, 'i_${idx}')"><i class="fas fa-eye"></i></button><button class="action-btn inline-flex" onclick="copyToClipboard(document.getElementById('i_${idx}').value)"><i class="fas fa-copy"></i></button></div></div>`;
        if(i.bic) h += `<div class="flex items-center justify-between"><span class="text-muted">BIC:</span> <div>${escapeHtml(i.bic)} <button class="action-btn inline-flex" onclick="copyToClipboard('${escapeHtml(i.bic)}')"><i class="fas fa-copy"></i></button></div></div>`;
      } else if (curCat === 5) {
        h += `<div><span class="text-muted">Nom:</span> ${escapeHtml(i.nom)}</div>`;
        if(i.code) h += `<div class="flex items-center justify-between"><span class="text-muted">Code:</span> <div class="flex gap-2"><input type="password" value="${escapeHtml(i.code)}" id="co_${idx}" readonly class="bg-transparent border-none text-white w-32 p-0"><button class="action-btn inline-flex" onclick="toggleVisibility(this, 'co_${idx}')"><i class="fas fa-eye"></i></button></div></div>`;
      } else if (curCat === 6) {
        h += `<div><span class="text-muted">Groupe:</span> ${escapeHtml(i.gs)}</div>`;
        h += `<div><span class="text-muted">Allergies:</span> ${escapeHtml(i.allergies)}</div>`;
        h += `<div><span class="text-muted">Médecin:</span> ${escapeHtml(i.medecin)}</div>`;
        if(i.secu) h += `<div class="flex items-center justify-between"><span class="text-muted">Sécu:</span> <div class="flex gap-2"><input type="password" value="${escapeHtml(i.secu)}" id="s_${idx}" readonly class="bg-transparent border-none text-white w-32 p-0"><button class="action-btn inline-flex" onclick="toggleVisibility(this, 's_${idx}')"><i class="fas fa-eye"></i></button></div></div>`;
      } else if (curCat === 7) {
        h += `<div><span class="text-muted">Type:</span> ${escapeHtml(i.type)}</div>`;
        h += `<div><span class="text-muted">Compagnie:</span> ${escapeHtml(i.compagnie)}</div>`;
        h += `<div class="flex items-center justify-between"><span class="text-muted">Contrat:</span> <div>${escapeHtml(i.contrat)} <button class="action-btn inline-flex" onclick="copyToClipboard('${escapeHtml(i.contrat)}')"><i class="fas fa-copy"></i></button></div></div>`;
      } else if (curCat === 8) {
        h += `<div><span class="text-muted">Service:</span> ${escapeHtml(i.service)}</div>`;
        if(i.cle) h += `<div class="flex items-center justify-between"><span class="text-muted">Clé:</span> <div class="flex gap-2"><input type="password" value="${escapeHtml(i.cle)}" id="k_${idx}" readonly class="bg-transparent border-none text-white w-48 p-0"><button class="action-btn inline-flex" onclick="toggleVisibility(this, 'k_${idx}')"><i class="fas fa-eye"></i></button><button class="action-btn inline-flex" onclick="copyToClipboard(document.getElementById('k_${idx}').value)"><i class="fas fa-copy"></i></button></div></div>`;
      } else if (curCat === 9) {
        h += `<div class="font-bold border-b pb-2 mb-2">${escapeHtml(i.titre)}</div>`;
        h += `<div style="white-space: pre-wrap;">${escapeHtml(i.content)}</div>`;
      }

      el.innerHTML = h;
      l.appendChild(el);
    });
  }

  renderSb();
});
