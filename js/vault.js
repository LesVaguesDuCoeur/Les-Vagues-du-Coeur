let _vk=sessionStorage.getItem('vk');
if(!_vk)window.location.href='index.html';
setupAutoLock(15);
let _v={};
window.onload=async()=>{
  try{
    let d=await loadData();
    document.getElementById('loader-box').classList.add('hidden');
    document.getElementById('main-content-box').classList.remove('hidden');
    _v=decryptData(d.vaultData, _vk) || {};
    renderVault();
  }catch(e){
    document.getElementById('loader-box').classList.add('hidden');
    document.getElementById('main-content-box').classList.remove('hidden');
    showToast('Erreur de chargement', 'error');
  }
};
document.getElementById('btn-logout').onclick=()=>{
  sessionStorage.clear();
  window.location.href='index.html';
};
document.querySelectorAll('.vault-cat').forEach(c=>{
  c.onclick=()=>{
    document.querySelectorAll('.vault-cat').forEach(i=>i.classList.remove('active'));
    c.classList.add('active');
    renderVault();
  };
});
window.unlockItem=(a, i)=>{
  openModal(`
    <h3 class="mb-3 text-center">Déverrouillage</h3>
    <form id="ul-form">
      <div class="form-group"><input type="text" id="ul-nom" placeholder="Prénom" required></div>
      <div class="form-group mb-4">
        <div class="input-wrapper">
          <input type="password" id="ul-pass" placeholder="Mot de passe" required>
          <button type="button" class="input-icon-btn" onclick="toggleVisibility(this, 'ul-pass')"><i class="fas fa-eye"></i></button>
        </div>
      </div>
      <button type="submit" class="btn-accent w-100">Valider</button>
    </form>
  `);
  document.getElementById('ul-form').onsubmit=(e)=>{
    e.preventDefault();
    let n=document.getElementById('ul-nom').value.trim().toLowerCase();
    let p=document.getElementById('ul-pass').value;
    let it=_v[a][i];
    if(it.lockName!==n || it.lockHash!==hashPassword(p)){
      showToast('Informations incorrectes', 'error');
      closeModal();
      return;
    }
    it.unlocked=true;
    closeModal();
    renderVault();
  };
};
function renderVault(){
  let a=document.querySelector('.vault-cat.active').dataset.cat;
  let t=document.querySelector('.vault-cat.active').innerHTML;
  document.getElementById('vault-cat-title').innerHTML=t;
  let g=document.getElementById('vault-items-grid');
  g.innerHTML='';
  let it=_v[a]||[];
  it.forEach((item, i)=>{
    let d=document.createElement('div');
    d.className='vault-item';
    let lkIcon=item.locked?' <i class="fas fa-lock text-warning"></i>':'';
    let h=`<div class="vault-item-header"><div class="vault-item-title">${escapeHtml(item.t||'Item')}${lkIcon}</div></div>`;
    if(item.locked && !item.unlocked){
      h+=`<div class="text-center mt-3"><button class="btn-accent" onclick="unlockItem(${a}, ${i})"><i class="fas fa-unlock"></i> Déverrouiller</button></div>`;
    }else{
      for(let k in item.f){
        let p=item.f[k];
        let val=p.v;
        let mask=p.m?'<span class="vault-field-value masked">***</span>':(p.p?'<span class="vault-field-value masked">***'+escapeHtml(val.slice(-4))+'</span>':`<span class="vault-field-value">${escapeHtml(val)}</span>`);
        let act='';
        if(p.m)act+=`<button onclick="this.parentElement.previousElementSibling.innerText='${escapeHtml(val).replace(/'/g,"\\'")}'"><i class="fas fa-eye"></i></button>`;
        if(p.c)act+=`<button onclick="copyToClipboard('${escapeHtml(val).replace(/'/g,"\\'")}')"><i class="fas fa-copy"></i></button>`;
        if(p.l)act+=`<button onclick="window.open('${escapeHtml(val).replace(/'/g,"\\'")}')"><i class="fas fa-external-link-alt"></i></button>`;
        if(p.t)act+=`<button onclick="window.open('tel:${escapeHtml(val).replace(/'/g,"\\'")}')"><i class="fas fa-phone"></i></button>`;
        h+=`<div class="vault-field"><div class="vault-field-label">${escapeHtml(k)}</div><div class="d-flex align-center justify-between"><div>${mask}</div><div class="field-actions">${act}</div></div></div>`;
      }
    }
    d.innerHTML=h;
    g.appendChild(d);
  });
}
