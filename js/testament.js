let _tk=sessionStorage.getItem('tk')||sessionStorage.getItem('ak');
if(!_tk)window.location.href='index.html';
setupAutoLock(15);
let _t={identity:{},content:'',lastModified:null};
window.onload=async()=>{
  try{
    let d=await loadData();
    document.getElementById('loader-box').classList.add('hidden');
    document.getElementById('main-content-box').classList.remove('hidden');
    let k=_tk;
    if(sessionStorage.getItem('ak')){
      k=decryptData(d.encryptedTestamentPassword, sessionStorage.getItem('ak'));
    }
    _t=decryptData(d.testamentData, k) || {identity:{},content:'',lastModified:null};
    renderTestament();
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
function renderTestament(){
  let i=_t.identity||{};
  let h=`<table style="width:100%">`;
  h+=`<tr><td style="width:150px"><strong>Nom :</strong></td><td>${escapeHtml(i.nom||'')}</td></tr>`;
  h+=`<tr><td><strong>Prénom :</strong></td><td>${escapeHtml(i.prenom||'')}</td></tr>`;
  h+=`<tr><td><strong>Né(e) le :</strong></td><td>${escapeHtml(i.dnaiss||'')}</td></tr>`;
  h+=`<tr><td><strong>Lieu :</strong></td><td>${escapeHtml(i.lnaiss||'')}</td></tr>`;
  h+=`<tr><td><strong>Nationalité :</strong></td><td>${escapeHtml(i.nat||'')}</td></tr>`;
  h+=`<tr><td><strong>Adresse :</strong></td><td>${escapeHtml(i.adr||'')}</td></tr>`;
  h+=`</table>`;
  document.getElementById('id-bloc').innerHTML=h;
  if(_t.lastModified){
    let dt=new Date(_t.lastModified);
    document.getElementById('last-mod').innerText=('0'+dt.getDate()).slice(-2)+'/'+('0'+(dt.getMonth()+1)).slice(-2)+'/'+dt.getFullYear()+' à '+('0'+dt.getHours()).slice(-2)+'h'+('0'+dt.getMinutes()).slice(-2);
  }
  document.getElementById('test-body').innerHTML=_t.content||'<p>Aucun contenu.</p>';
  let dn=new Date();
  document.getElementById('pdf-footer').innerText=`Document généré le ${('0'+dn.getDate()).slice(-2)}/${('0'+(dn.getMonth()+1)).slice(-2)}/${dn.getFullYear()} — Utilitaire`;
}
document.getElementById('btn-pdf').onclick=()=>{
  let e=document.getElementById('pdf-container');
  let o={
    margin:10,
    filename:'Testament.pdf',
    image:{type:'jpeg',quality:0.98},
    html2canvas:{scale:2},
    jsPDF:{unit:'mm',format:'a4',orientation:'portrait'}
  };
  html2pdf().set(o).from(e).save();
};
