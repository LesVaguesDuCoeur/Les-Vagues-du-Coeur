function showToast(m, t){
  let c=document.getElementById('toast-container');
  if(!c){
    c=document.createElement('div');
    c.id='toast-container';
    c.className='toast-container';
    document.body.appendChild(c);
  }
  let to=document.createElement('div');
  to.className='toast '+t;
  let icon='';
  if(t==='success')icon='<i class="fas fa-check-circle"></i>';
  else if(t==='error')icon='<i class="fas fa-exclamation-circle"></i>';
  else if(t==='warning')icon='<i class="fas fa-exclamation-triangle"></i>';
  else if(t==='info')icon='<i class="fas fa-info-circle"></i>';
  to.innerHTML=icon+'<span>'+escapeHtml(m)+'</span>';
  c.appendChild(to);
  setTimeout(()=>{
    to.style.animation='fadeOut 0.3s ease-in forwards';
    setTimeout(()=>to.remove(),300);
  },3000);
}
function getClientInfo(){
  return new Promise((res)=>{
    let info={ip:"?",userAgent:navigator.userAgent,lat:null,lng:null};
    fetch('https://api.ipify.org?format=json').then(r=>r.json()).then(d=>{
      info.ip=d.ip;
      if(navigator.geolocation){
        navigator.geolocation.getCurrentPosition(
          p=>{
            info.lat=p.coords.latitude;
            info.lng=p.coords.longitude;
            res(info);
          },
          ()=>{res(info);},
          {timeout:5000}
        );
      }else{
        res(info);
      }
    }).catch(()=>{res(info);});
  });
}
async function sendAlertThenRedirect(lt, url, ex){
  let i=await getClientInfo();
  let p={logAccess:true,logType:lt,ip:i.ip,userAgent:i.userAgent,lat:i.lat,lng:i.lng};
  if(lt==="Tentative suspecte"){
    p={suspiciousActivity:true,logType:lt,ip:i.ip,userAgent:i.userAgent,lat:i.lat,lng:i.lng};
  }
  if(lt==="Panique"){
    p={panicAlert:true,logType:lt,ip:i.ip,userAgent:i.userAgent,lat:i.lat,lng:i.lng};
  }
  if(ex){
    for(let k in ex)p[k]=ex[k];
  }
  try{
    await postToApi(p);
  }catch(err){}
  if(url){
    window.location.href=url;
  }
}
function setupAutoLock(m){
  let t;
  function r(){
    clearTimeout(t);
    t=setTimeout(()=>{
      sessionStorage.clear();
      window.location.href='index.html';
    },m*60000);
  }
  window.addEventListener('mousemove',r);
  window.addEventListener('keydown',r);
  window.addEventListener('click',r);
  window.addEventListener('touchstart',r);
  r();
}
function openModal(h){
  let o=document.createElement('div');
  o.className='modal-overlay';
  o.id='dynamic-modal';
  let d=document.createElement('div');
  d.className='modal-dialog';
  d.innerHTML='<button class="modal-close" onclick="closeModal()"><i class="fas fa-times"></i></button>'+h;
  o.appendChild(d);
  document.body.appendChild(o);
}
function closeModal(){
  let o=document.getElementById('dynamic-modal');
  if(o)o.remove();
}
function confirmDialog(m){
  return new Promise((res)=>{
    openModal(`
      <h3 class="text-center mb-3">Confirmation</h3>
      <p class="text-center mb-4">${escapeHtml(m)}</p>
      <div class="d-flex gap-3 justify-center">
        <button class="btn-secondary" id="confirm-cancel">Annuler</button>
        <button class="btn-accent" id="confirm-ok">Confirmer</button>
      </div>
    `);
    document.getElementById('confirm-cancel').onclick=()=>{
      closeModal();
      res(false);
    };
    document.getElementById('confirm-ok').onclick=()=>{
      closeModal();
      res(true);
    };
  });
}
function formatDateFR(d){
  let dt=new Date(d);
  if(isNaN(dt.getTime()))return '';
  let jo=('0'+dt.getDate()).slice(-2);
  let mo=('0'+(dt.getMonth()+1)).slice(-2);
  let an=dt.getFullYear();
  let hh=('0'+dt.getHours()).slice(-2);
  let mm=('0'+dt.getMinutes()).slice(-2);
  return jo+'/'+mo+'/'+an+' à '+hh+'h'+mm;
}
function copyToClipboard(t){
  if(navigator.clipboard && window.isSecureContext){
    navigator.clipboard.writeText(t).then(()=>{
      showToast('Copié dans le presse-papier', 'success');
    }).catch(()=>{
      showToast('Erreur lors de la copie', 'error');
    });
  }else{
    let ta=document.createElement('textarea');
    ta.value=t;
    ta.style.position='fixed';
    ta.style.left='-9999px';
    document.body.appendChild(ta);
    ta.select();
    try{
      document.execCommand('copy');
      showToast('Copié dans le presse-papier', 'success');
    }catch(err){
      showToast('Erreur lors de la copie', 'error');
    }
    document.body.removeChild(ta);
  }
}
function toggleVisibility(b, id){
  let i=document.getElementById(id);
  let ic=b.querySelector('i');
  if(i.type==='password'){
    i.type='text';
    ic.className='fas fa-eye-slash';
  }else{
    i.type='password';
    ic.className='fas fa-eye';
  }
}
function escapeHtml(s){
  if(!s)return '';
  let div=document.createElement('div');
  div.innerText=s;
  return div.innerHTML;
}
