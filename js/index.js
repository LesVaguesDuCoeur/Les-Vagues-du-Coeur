let _d=null;
let _l=0;
let _lt=0;
window.onload=async()=>{
  try{
    _d=await loadData();
    document.getElementById('loader-box').classList.add('hidden');
    document.getElementById('main-content-box').classList.remove('hidden');
    if(!_d.isSetup){
      window.location.href='setup.html';
      return;
    }
  }catch(e){
    document.getElementById('loader-box').classList.add('hidden');
    document.getElementById('main-content-box').classList.remove('hidden');
    document.getElementById('error-msg').innerText="Erreur de connexion";
    document.getElementById('error-msg').classList.remove('hidden');
  }
};
document.getElementById('login-form').onsubmit=async(e)=>{
  e.preventDefault();
  let now=Date.now();
  if(_lt>now){
    return;
  }
  let c=document.getElementById('access-code').value;
  let h=hashPassword(c);
  if(h===_d.adminHash){
    sessionStorage.setItem('ak', c);
    window.location.href='admin.html';
  }else if(h===_d.emergencyHash){
    sessionStorage.setItem('ek', c);
    await sendAlertThenRedirect("Urgence", "emergency.html");
  }else if(h===_d.vaultHash){
    showDoubleAuthModal('Vault', c, _d.vaultHash);
  }else if(h===_d.testamentHash){
    showDoubleAuthModal('Testament', c, _d.testamentHash);
  }else{
    _l++;
    handleLockout();
  }
};
function handleLockout(){
  let s=0;
  if(_l===3)s=30;
  else if(_l===5)s=120;
  else if(_l>=10){
    s=600;
    sendAlertThenRedirect("Tentative suspecte", null);
  }
  if(s>0){
    _lt=Date.now()+s*1000;
    let b=document.getElementById('btn-login');
    let m=document.getElementById('lockout-msg');
    let t=document.getElementById('lockout-time');
    let er=document.getElementById('error-msg');
    b.disabled=true;
    er.classList.add('hidden');
    m.classList.remove('hidden');
    let int=setInterval(()=>{
      let r=Math.ceil((_lt-Date.now())/1000);
      if(r<=0){
        clearInterval(int);
        b.disabled=false;
        m.classList.add('hidden');
      }else{
        t.innerText=r;
      }
    },1000);
  }else{
    let er=document.getElementById('error-msg');
    er.innerText="Code incorrect";
    er.classList.remove('hidden');
    setTimeout(()=>er.classList.add('hidden'),3000);
  }
}
function showDoubleAuthModal(t, c, h){
  openModal(`
    <h3 class="text-center mb-3">Identité requise</h3>
    <form id="da-form">
      <div class="form-group">
        <input type="text" id="da-nom" placeholder="Nom complet" required>
      </div>
      <div class="form-group mb-4">
        <div class="input-wrapper">
          <input type="password" id="da-urg" placeholder="Code Urgence" required>
          <button type="button" class="input-icon-btn" onclick="toggleVisibility(this, 'da-urg')"><i class="fas fa-eye"></i></button>
        </div>
      </div>
      <div id="da-err" class="text-danger mb-3 hidden">Code incorrect.</div>
      <button type="submit" class="btn-accent w-100" id="da-btn">Valider</button>
    </form>
  `);
  document.getElementById('da-form').onsubmit=async(e)=>{
    e.preventDefault();
    let n=document.getElementById('da-nom').value;
    let u=document.getElementById('da-urg').value;
    if(hashPassword(u)!==_d.emergencyHash){
      let er=document.getElementById('da-err');
      er.classList.remove('hidden');
      setTimeout(()=>er.classList.add('hidden'),3000);
      _l++;
      if(_l>=10){
        closeModal();
        handleLockout();
      }
      return;
    }
    document.getElementById('da-btn').disabled=true;
    if(t==='Vault'){
      sessionStorage.setItem('vk', c);
      await sendAlertThenRedirect("Vault", "vault.html", {nomComplet:n});
    }else{
      sessionStorage.setItem('tk', c);
      await sendAlertThenRedirect("Testament", "testament.html", {nomComplet:n});
    }
  };
}
