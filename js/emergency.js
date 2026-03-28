let _e=sessionStorage.getItem('ek');
if(!_e)window.location.href='index.html';
setupAutoLock(10);
let _d=null;
let _c=[];
window.onload=async()=>{
  try{
    _d=await loadData();
    document.getElementById('loader-box').classList.add('hidden');
    document.getElementById('main-content-box').classList.remove('hidden');
    _c=decryptData(_d.emergencyContacts, _e) || [];
    let msg=decryptData(_d.emergencyMessageForEmergency, _e);
    if(msg){
      document.getElementById('urg-msg-box').classList.remove('hidden');
      document.getElementById('urg-msg-text').innerText=msg;
    }
    renderContacts();
  }catch(err){
    document.getElementById('loader-box').classList.add('hidden');
    document.getElementById('main-content-box').classList.remove('hidden');
    showToast('Erreur de chargement', 'error');
  }
};
document.getElementById('btn-logout').onclick=()=>{
  sessionStorage.clear();
  window.location.href='index.html';
};
document.getElementById('btn-panic').onclick=async()=>{
  if(await confirmDialog('Déclencher l\'alerte panique ? Cela enregistrera cet événement dans les logs en tant qu\'urgence vitale.')){
    await sendAlertThenRedirect("Panique", null);
    showToast('Alerte panique déclenchée. Log enregistré.', 'error');
  }
};
function renderContacts(){
  let l=document.getElementById('contacts-list');
  l.innerHTML='';
  let s=document.getElementById('search-contacts').value.toLowerCase();
  _c.filter(c=>c.nom.toLowerCase().includes(s)).forEach(c=>{
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
    h+=`</div>`;
    d.innerHTML=h;
    l.appendChild(d);
  });
}
document.getElementById('search-contacts').oninput=renderContacts;
