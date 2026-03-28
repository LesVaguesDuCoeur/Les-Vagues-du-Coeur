let _a=sessionStorage.getItem('ak');
if(!_a)window.location.href='index.html';
setupAutoLock(30);
let _d=null;
let _c=[];
let _v={};
let _t={identity:{},content:'',lastModified:null};
let _q=null;
let _u=null;
let _vk=null;
let _tk=null;
window.onload=async()=>{
  try{
    _d=await loadData();
    document.getElementById('loader-box').classList.add('hidden');
    document.getElementById('main-content-box').classList.remove('hidden');
    _u=decryptData(_d.encryptedEmergencyPassword, _a);
    _vk=decryptData(_d.encryptedVaultPassword, _a);
    _tk=decryptData(_d.encryptedTestamentPassword, _a);
    _c=decryptData(_d.contacts, _a) || [];
    _v=decryptData(_d.vaultData, _vk) || {};
    _t=decryptData(_d.testamentData, _tk) || {identity:{},content:'',lastModified:null};
    if(_d.publicAccessLogs.length>0 && _d.publicAccessLogs[0].type==='Tentative suspecte'){
      document.getElementById('admin-icon').className='fas fa-user-shield header-lock red';
    }
    renderContacts();
    renderVault();
    renderTestament();
    renderSettings();
  }catch(e){
    document.getElementById('loader-box').classList.add('hidden');
    document.getElementById('main-content-box').classList.remove('hidden');
    showToast('Erreur de chargement', 'error');
  }
};
document.querySelectorAll('.nav-item').forEach(n=>{
  n.onclick=()=>{
    document.querySelectorAll('.nav-item').forEach(i=>i.classList.remove('active'));
    n.classList.add('active');
    document.querySelectorAll('.tab-content').forEach(c=>c.classList.add('hidden'));
    document.getElementById('tab-'+n.dataset.tab).classList.remove('hidden');
    if(n.dataset.tab==='testament' && !_q){
      _q=new Quill('#editor-container',{theme:'snow',modules:{toolbar:[[{header:[1,2,3,false]}],['bold','italic','underline'],[{list:'ordered'},{list:'bullet'}],[{color:[]}],['clean']]}});
      _q.root.innerHTML=_t.content||'';
      setInterval(async()=>{
        if(_q.root.innerHTML!==_t.content){
          _t.content=_q.root.innerHTML;
          _t.lastModified=new Date().toISOString();
          await saveData();
          showToast('Sauvegarde auto','success');
        }
      },30000);
    }
  };
});
document.getElementById('btn-logout').onclick=()=>{
  sessionStorage.clear();
  window.location.href='index.html';
};
function renderContacts(){
  let l=document.getElementById('contacts-list');
  l.innerHTML='';
  let s=document.getElementById('search-contacts').value.toLowerCase();
  _c.filter(c=>c.nom.toLowerCase().includes(s)).forEach((c,i)=>{
    let d=document.createElement('div');
    d.className='contact-card';
    d.dataset.imp=c.importance||3;
    let h=`<div class="contact-info"><div class="contact-name">${escapeHtml(c.nom)}</div><div class="contact-rel">${escapeHtml(c.relation)}</div></div><div class="contact-links">`;
    if(c.tel)h+=`<a href="tel:${escapeHtml(c.tel)}" class="link-icon link-phone" target="_blank"><i class="fas fa-phone"></i></a>`;
    if(c.email)h+=`<a href="mailto:${escapeHtml(c.email)}" class="link-icon link-email" target="_blank"><i class="fas fa-envelope"></i></a>`;
    if(c.wa)h+=`<a href="https://wa.me/${escapeHtml(c.wa)}" class="link-icon link-whatsapp" target="_blank"><i class="fab fa-whatsapp"></i></a>`;
    if(c.tg)h+=`<a href="https://t.me/${escapeHtml(c.tg)}" class="link-icon link-telegram" target="_blank"><i class="fab fa-telegram"></i></a>`;
    if(c.snap)h+=`<a href="https://www.snapchat.com/add/${escapeHtml(c.snap)}" class="link-icon link-snap" target="_blank"><i class="fab fa-snapchat-ghost"></i></a>`;
    if(c.ig)h+=`<a href="https://www.instagram.com/${escapeHtml(c.ig)}" class="link-icon link-insta" target="_blank"><i class="fab fa-instagram"></i></a>`;
    if(c.ms)h+=`<a href="https://m.me/${escapeHtml(c.ms)}" class="link-icon link-messenger" target="_blank"><i class="fab fa-facebook-messenger"></i></a>`;
    h+=`</div><div class="contact-actions"><button class="btn-icon" onclick="editContact(${i})"><i class="fas fa-edit"></i></button><button class="btn-icon text-danger" onclick="delContact(${i})"><i class="fas fa-trash"></i></button></div>`;
    d.innerHTML=h;
    l.appendChild(d);
  });
}
document.getElementById('search-contacts').oninput=renderContacts;
document.getElementById('btn-add-contact').onclick=()=>openContactModal();
function openContactModal(i=null){
  let c=i!==null?_c[i]:{};
  let r=['Mère','Père','Frère','Sœur','Demi-frère','Demi-sœur','Grand-père','Grand-mère','Oncle','Tante','Cousin(e)','Fils','Fille','Conjoint(e)','Ex-conjoint(e)','Ami(e) proche','Meilleur(e) ami(e)','Connaissance','Collègue','Patron/Manager','Associé(e)','Client','Médecin','Avocat','Notaire','Comptable','Banquier','Assureur','Voisin(e)','Propriétaire/Bailleur','Professeur','Famille éloignée','Autre'];
  let opts=r.map(o=>`<option value="${o}" ${c.relation===o?'selected':''}>${o}</option>`).join('');
  let imp=c.importance||3;
  openModal(`
    <h3 class="mb-4">${i!==null?'Modifier':'Ajouter'} un contact</h3>
    <form id="contact-form">
      <div class="form-group"><input type="text" id="c-nom" placeholder="Nom" value="${escapeHtml(c.nom||'')}" required></div>
      <div class="form-group"><select id="c-rel">${opts}</select></div>
      <div class="form-group" id="c-rel-autre" style="display:none;"><input type="text" id="c-rel-txt" placeholder="Préciser" value="${escapeHtml(c.relation||'')}"></div>
      <div class="form-group"><label>Importance</label>
        <div class="importance-selector">
          ${[1,2,3,4,5].map(v=>`<label class="imp-btn" data-value="${v}"><input type="radio" name="c-imp" value="${v}" ${imp==v?'checked':''}><span>${v}</span></label>`).join('')}
        </div>
      </div>
      <div class="form-group"><input type="tel" id="c-tel" placeholder="Téléphone" value="${escapeHtml(c.tel||'')}"></div>
      <div class="form-group"><input type="email" id="c-eml" placeholder="Email" value="${escapeHtml(c.email||'')}"></div>
      <div class="form-group"><input type="text" id="c-wa" placeholder="WhatsApp (Numéro)" value="${escapeHtml(c.wa||'')}"></div>
      <div class="form-group"><input type="text" id="c-tg" placeholder="Telegram (Username)" value="${escapeHtml(c.tg||'')}"></div>
      <div class="form-group"><input type="text" id="c-sn" placeholder="Snapchat (Username)" value="${escapeHtml(c.snap||'')}"></div>
      <div class="form-group"><input type="text" id="c-ig" placeholder="Instagram (Username)" value="${escapeHtml(c.ig||'')}"></div>
      <div class="form-group"><input type="text" id="c-ms" placeholder="Messenger (ID)" value="${escapeHtml(c.ms||'')}"></div>
      <div class="form-group"><textarea id="c-not" placeholder="Notes" rows="3">${escapeHtml(c.notes||'')}</textarea></div>
      <button type="submit" class="btn-accent w-100">Sauvegarder</button>
    </form>
  `);
  document.getElementById('c-rel').onchange=(e)=>{
    document.getElementById('c-rel-autre').style.display=e.target.value==='Autre'?'block':'none';
  };
  if(c.relation&&!r.includes(c.relation)){
    document.getElementById('c-rel').value='Autre';
    document.getElementById('c-rel-autre').style.display='block';
    document.getElementById('c-rel-txt').value=c.relation;
  }
  document.getElementById('contact-form').onsubmit=async(e)=>{
    e.preventDefault();
    let rel=document.getElementById('c-rel').value;
    if(rel==='Autre')rel=document.getElementById('c-rel-txt').value;
    let nc={
      nom:document.getElementById('c-nom').value,
      relation:rel,
      importance:parseInt(document.querySelector('input[name="c-imp"]:checked').value),
      tel:document.getElementById('c-tel').value,
      email:document.getElementById('c-eml').value,
      wa:document.getElementById('c-wa').value,
      tg:document.getElementById('c-tg').value,
      snap:document.getElementById('c-sn').value,
      ig:document.getElementById('c-ig').value,
      ms:document.getElementById('c-ms').value,
      notes:document.getElementById('c-not').value
    };
    if(i!==null)_c[i]=nc;else _c.push(nc);
    closeModal();
    renderContacts();
    await saveData();
  };
}
window.editContact=openContactModal;
window.delContact=async(i)=>{
  if(await confirmDialog('Supprimer ce contact ?')){
    _c.splice(i,1);
    renderContacts();
    await saveData();
  }
};
async function saveData(){
  _d.contacts=encryptData(_c, _a);
  _d.emergencyContacts=encryptData(_c, _u);
  _d.vaultData=encryptData(_v, _vk);
  _d.testamentData=encryptData(_t, _tk);
  await postToApi({action:'save',data:_d});
  showToast('Sauvegardé', 'success');
}
function renderVault(){
  let a=document.querySelector('.vault-cat.active').dataset.cat;
  let t=document.querySelector('.vault-cat.active').innerHTML;
  document.getElementById('vault-cat-title').innerHTML=t;
  if(a==='1'){
    document.getElementById('btn-add-vault').style.display='none';
  }else{
    document.getElementById('btn-add-vault').style.display='inline-block';
  }
  let g=document.getElementById('vault-items-grid');
  g.innerHTML='';
  let it=_v[a]||[];
  it.forEach((item,i)=>{
    let d=document.createElement('div');
    d.className='vault-item';
    let lkIcon=item.locked?' <i class="fas fa-lock text-warning"></i>':'';
    let h=`<div class="vault-item-header"><div class="vault-item-title">${escapeHtml(item.t||'Item')}${lkIcon}</div><div class="field-actions">`;
    if(!(a==='1' && i===0))h+=`<button class="text-danger" onclick="delVault(${a},${i})"><i class="fas fa-trash"></i></button>`;
    h+=`<button onclick="editVault(${a},${i})"><i class="fas fa-edit"></i></button></div></div>`;
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
    d.innerHTML=h;
    g.appendChild(d);
  });
}
document.querySelectorAll('.vault-cat').forEach(c=>{
  c.onclick=()=>{
    document.querySelectorAll('.vault-cat').forEach(i=>i.classList.remove('active'));
    c.classList.add('active');
    renderVault();
  };
});
document.getElementById('btn-add-vault').onclick=()=>{
  let a=document.querySelector('.vault-cat.active').dataset.cat;
  openVaultModal(a);
};
function openVaultModal(cat, idx=null){
  let it=idx!==null?_v[cat][idx]:{f:{}};
  let h=`<h3 class="mb-4">${idx!==null?'Modifier':'Ajouter'}</h3><form id="vault-form">`;
  if(cat==='1'){
    h+=fg('Nom',it.f.Nom?.v,'text')+fg('Prénom',it.f['Prénom']?.v,'text')+fg('Date de naissance',it.f['Date de naissance']?.v,'text')+fg('Lieu de naissance',it.f['Lieu de naissance']?.v,'text')+fg('Nationalité',it.f['Nationalité']?.v,'text')+fg('Adresse',it.f.Adresse?.v,'text')+fg('Notes',it.f.Notes?.v,'textarea');
  }else if(cat==='2'){
    h+=fg('Service',it.t,'text')+fg('URL',it.f.URL?.v,'text')+fg('Identifiant',it.f.Identifiant?.v,'text')+fg('MDP',it.f.MDP?.v,'password')+fg('Notes',it.f.Notes?.v,'textarea');
  }else if(cat==='3'){
    h+=fg('Banque',it.t,'text')+fg('Nom sur la carte',it.f['Nom sur la carte']?.v,'text')+fg('Numéro',it.f['Numéro']?.v,'text',true)+fg('Expiration',it.f.Expiration?.v,'text')+fg('CVV',it.f.CVV?.v,'password')+fg('PIN',it.f.PIN?.v,'password')+fg('Plafond',it.f.Plafond?.v,'text')+fg('Notes',it.f.Notes?.v,'textarea');
  }else if(cat==='4'){
    h+=fgs('Type',it.t,['CNI','Passeport','Permis','Titre de séjour','Autre'])+fg('Numéro',it.f['Numéro']?.v,'text')+fg('Date d\'émission',it.f['Date d\'émission']?.v,'text')+fg('Date d\'expiration',it.f['Date d\'expiration']?.v,'text')+fg('Lieu d\'émission',it.f['Lieu d\'émission']?.v,'text')+fg('Notes',it.f.Notes?.v,'textarea');
  }else if(cat==='5'){
    h+=fg('Banque',it.t,'text')+fg('Titulaire',it.f.Titulaire?.v,'text')+fg('IBAN',it.f.IBAN?.v,'password')+fg('BIC',it.f.BIC?.v,'text')+fg('Numéro de compte',it.f['Numéro de compte']?.v,'text')+fg('Agence',it.f.Agence?.v,'text')+fg('Notes',it.f.Notes?.v,'textarea');
  }else if(cat==='6'){
    h+=fg('Nom/Description',it.t,'text')+fg('Code',it.f.Code?.v,'password')+fg('Notes',it.f.Notes?.v,'textarea');
  }else if(cat==='7'){
    h+=fg('Titre',it.t||'Infos Médicales','text')+fgs('Groupe sanguin',it.f['Groupe sanguin']?.v,['A+','A-','B+','B-','AB+','AB-','O+','O-'])+fg('Allergies',it.f.Allergies?.v,'text')+fg('Traitements en cours',it.f['Traitements en cours']?.v,'text')+fg('Médecin traitant',it.f['Médecin traitant']?.v,'text')+fg('N° Sécurité Sociale',it.f['N° Sécurité Sociale']?.v,'text')+fg('Mutuelle',it.f.Mutuelle?.v,'text')+fg('N° adhérent mutuelle',it.f['N° adhérent mutuelle']?.v,'text')+fg('Notes',it.f.Notes?.v,'textarea');
  }else if(cat==='8'){
    h+=fgs('Type',it.t,['Auto','Habitation','Santé','Vie','Responsabilité civile','Autre'])+fg('Compagnie',it.f.Compagnie?.v,'text')+fg('N° de contrat',it.f['N° de contrat']?.v,'text')+fg('Téléphone',it.f['Téléphone']?.v,'text')+fg('Date d\'échéance',it.f['Date d\'échéance']?.v,'text')+fg('Notes',it.f.Notes?.v,'textarea');
  }else if(cat==='9'){
    h+=fg('Service/Logiciel',it.t,'text')+fg('Clé de licence',it.f['Clé de licence']?.v,'password')+fg('Email associé',it.f['Email associé']?.v,'text')+fg('Date de renouvellement',it.f['Date de renouvellement']?.v,'text')+fg('Notes',it.f.Notes?.v,'textarea');
  }else if(cat==='10'){
    h+=fg('Titre',it.t,'text')+fg('Contenu',it.f.Contenu?.v,'textarea',false,true);
  }
  if(cat!=='1'){
    let checked=it.locked?'checked':'';
    h+=`<div class="form-group mb-4" style="border:1px solid var(--border);padding:12px;border-radius:8px;">
          <label style="display:flex;align-items:center;gap:8px;cursor:pointer;color:var(--text);font-size:1rem;margin-bottom:0;">
            <input type="checkbox" id="vf-locked" ${checked} onchange="document.getElementById('lock-opts').style.display=this.checked?'block':'none'" style="width:auto;"> Verrouillage individuel
          </label>
          <div id="lock-opts" style="display:${checked?'block':'none'};margin-top:12px;">
            <div class="form-group"><input type="text" id="vl-nom" placeholder="Prénom requis" value="${escapeHtml(it.lockName||'')}"></div>
            <div class="form-group">
              <div class="input-wrapper">
                <input type="password" id="vl-pass" placeholder="${checked?'Nouveau mot de passe (laisser vide pour garder l\\'ancien)':'Mot de passe requis'}">
                <button type="button" class="input-icon-btn" onclick="toggleVisibility(this, 'vl-pass')"><i class="fas fa-eye"></i></button>
              </div>
            </div>
          </div>
        </div>`;
  }
  h+=`<button type="submit" class="btn-accent w-100">Sauvegarder</button></form>`;
  openModal(h);
  document.getElementById('vault-form').onsubmit=async(e)=>{
    e.preventDefault();
    let ni={f:{},t:''};
    let fi=document.getElementById('vault-form').elements;
    for(let i=0;i<fi.length;i++){
      let el=fi[i];
      if(el.tagName==='BUTTON' || el.id==='vf-locked' || el.id==='vl-nom' || el.id==='vl-pass')continue;
      let id=el.id.replace('vf-','');
      let val=el.value;
      if(id==='Nom'||id==='Service'||id==='Banque'||id==='Type'||id==='Nom/Description'||id==='Titre'||id==='Service/Logiciel'){
        ni.t=val;
      }
      if(val){
        let type=el.type;
        let c=false,m=false,l=false,t=false,p=false;
        if(id==='URL')l=true;
        if(id==='Téléphone')t=true;
        if(id==='Identifiant'||id==='Numéro'||id==='BIC'||id==='N° Sécurité Sociale'||id==='N° de contrat')c=true;
        if(type==='password'){m=true;c=true;}
        if(id==='Numéro' && cat==='3')p=true;
        ni.f[id]={v:val,m:m,c:c,l:l,t:t,p:p};
      }
    }
    let lk=document.getElementById('vf-locked');
    if(lk && lk.checked){
      let ln=document.getElementById('vl-nom').value.trim().toLowerCase();
      let lp=document.getElementById('vl-pass').value;
      if(!ln || (!lp && (!it.lockHash))){
        showToast('Nom et mot de passe requis pour le verrou', 'error');
        return;
      }
      ni.locked=true;
      ni.lockName=ln;
      if(lp)ni.lockHash=hashPassword(lp);
      else ni.lockHash=it.lockHash;
    }
    if(!_v[cat])_v[cat]=[];
    if(idx!==null)_v[cat][idx]=ni;else _v[cat].push(ni);
    closeModal();
    renderVault();
    await saveData();
  };
}
function fg(l,v,t,p=false,ta=false){
  v=v||'';
  if(t==='textarea'){
    let s=ta?' style="height:200px;"':'';
    return `<div class="form-group"><label>${l}</label><textarea id="vf-${l}" rows="3"${s}>${escapeHtml(v)}</textarea></div>`;
  }
  return `<div class="form-group"><label>${l}</label><div class="input-wrapper"><input type="${t}" id="vf-${l}" value="${escapeHtml(v)}">${t==='password'?`<button type="button" class="input-icon-btn" onclick="toggleVisibility(this, 'vf-${l}')"><i class="fas fa-eye"></i></button>`:''}</div></div>`;
}
function fgs(l,v,opts){
  let os=opts.map(o=>`<option value="${o}" ${v===o?'selected':''}>${o}</option>`).join('');
  return `<div class="form-group"><label>${l}</label><select id="vf-${l}">${os}</select></div>`;
}
window.editVault=(cat,idx)=>openVaultModal(cat.toString(),idx);
window.delVault=async(cat,idx)=>{
  if(await confirmDialog('Supprimer cet élément ?')){
    _v[cat].splice(idx,1);
    renderVault();
    await saveData();
  }
};
function renderTestament(){
  if(_t.identity){
    document.getElementById('t-nom').value=_t.identity.nom||'';
    document.getElementById('t-prenom').value=_t.identity.prenom||'';
    document.getElementById('t-dnaiss').value=_t.identity.dnaiss||'';
    document.getElementById('t-lnaiss').value=_t.identity.lnaiss||'';
    document.getElementById('t-nat').value=_t.identity.nat||'';
    document.getElementById('t-adr').value=_t.identity.adr||'';
  }
}
document.getElementById('btn-save-testament').onclick=async()=>{
  _t.identity={
    nom:document.getElementById('t-nom').value,
    prenom:document.getElementById('t-prenom').value,
    dnaiss:document.getElementById('t-dnaiss').value,
    lnaiss:document.getElementById('t-lnaiss').value,
    nat:document.getElementById('t-nat').value,
    adr:document.getElementById('t-adr').value
  };
  _t.content=_q.root.innerHTML;
  _t.lastModified=new Date().toISOString();
  await saveData();
};
document.getElementById('btn-pdf-testament').onclick=()=>{
  let w=window.open('testament.html','_blank');
  w.onload=()=>{
    setTimeout(()=>w.document.getElementById('btn-pdf').click(),1000);
  };
};
function renderSettings(){
  document.getElementById('s-urg-msg').value=decryptData(_d.emergencyMessage, _a)||'';
  let t=document.getElementById('logs-table').querySelector('tbody');
  t.innerHTML='';
  let logs=_d.publicAccessLogs||[];
  logs.forEach(l=>{
    t.innerHTML+=`<tr><td>${escapeHtml(l.date)}</td><td>${escapeHtml(l.type)}</td><td>${escapeHtml(l.ip)}</td><td>${escapeHtml(l.nom)}</td></tr>`;
  });
}
document.getElementById('btn-save-urgmsg').onclick=async()=>{
  let m=document.getElementById('s-urg-msg').value;
  _d.emergencyMessage=encryptData(m, _a);
  _d.emergencyMessageForEmergency=encryptData(m, _u);
  await postToApi({action:'save',data:_d});
  showToast('Message sauvegardé', 'success');
};
['admin','urg','vault','test'].forEach(k=>{
  document.getElementById('btn-change-'+k).onclick=async()=>{
    let o=document.getElementById('s-'+k+'-old').value;
    let n=document.getElementById('s-'+k+'-new').value;
    let c=document.getElementById('s-'+k+'-conf').value;
    if(n!==c){showToast('Codes non identiques','error');return;}
    let h=hashPassword(o);
    let oh=k==='admin'?_d.adminHash:k==='urg'?_d.emergencyHash:k==='vault'?_d.vaultHash:_d.testamentHash;
    if(h!==oh){showToast('Ancien code incorrect','error');return;}
    if(k==='admin'){
      _d.adminHash=hashPassword(n);
      _a=n;
      _d.encryptedEmergencyPassword=encryptData(_u, _a);
      _d.encryptedVaultPassword=encryptData(_vk, _a);
      _d.encryptedTestamentPassword=encryptData(_tk, _a);
      _d.contacts=encryptData(_c, _a);
      _d.emergencyMessage=encryptData(document.getElementById('s-urg-msg').value, _a);
    }else if(k==='urg'){
      _d.emergencyHash=hashPassword(n);
      _u=n;
      _d.encryptedEmergencyPassword=encryptData(_u, _a);
      _d.emergencyContacts=encryptData(_c, _u);
      _d.emergencyMessageForEmergency=encryptData(document.getElementById('s-urg-msg').value, _u);
    }else if(k==='vault'){
      _d.vaultHash=hashPassword(n);
      _vk=n;
      _d.encryptedVaultPassword=encryptData(_vk, _a);
      _d.vaultData=encryptData(_v, _vk);
    }else if(k==='test'){
      _d.testamentHash=hashPassword(n);
      _tk=n;
      _d.encryptedTestamentPassword=encryptData(_tk, _a);
      _d.testamentData=encryptData(_t, _tk);
    }
    await postToApi({action:'save',data:_d});
    showToast('Code modifié','success');
    if(k==='admin')sessionStorage.setItem('ak',n);
    ['old','new','conf'].forEach(x=>document.getElementById('s-'+k+'-'+x).value='');
  };
});
document.getElementById('btn-test-log').onclick=async()=>{
  await sendAlertThenRedirect("Test", null);
  showToast('Log de test envoyé', 'info');
};
document.getElementById('btn-reset-all').onclick=async()=>{
  if(await confirmDialog('ATTENTION : Voulez-vous vraiment effacer TOUTES les données ? Cette action est irréversible.')){
    if(await confirmDialog('Êtes-vous ABSOLUMENT SÛR de vouloir tout supprimer ?')){
      _d={isSetup:false};
      await postToApi({action:'save',data:_d});
      sessionStorage.clear();
      window.location.href='index.html';
    }
  }
};
