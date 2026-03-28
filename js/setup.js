window.onload=async()=>{
  let d=await loadData();
  if(d.isSetup){
    window.location.href='index.html';
  }
};
function checkStrength(i, e){
  let v=i.value;
  let s=0;
  if(v.length>0)s=25;
  if(v.length>5)s=50;
  if(v.length>7)s=75;
  if(/[A-Z]/.test(v) && /[a-z]/.test(v) && /[0-9]/.test(v) && /[^A-Za-z0-9]/.test(v))s=100;
  let b=document.getElementById(e);
  b.className='pw-strength';
  if(s===25)b.classList.add('pw-weak');
  if(s===50)b.classList.add('pw-fair');
  if(s===75)b.classList.add('pw-good');
  if(s===100)b.classList.add('pw-strong');
}
document.getElementById('setup-form').onsubmit=async(e)=>{
  e.preventDefault();
  let a=document.getElementById('admin-code').value;
  let ac=document.getElementById('admin-conf').value;
  let u=document.getElementById('urg-code').value;
  let uc=document.getElementById('urg-conf').value;
  let v=document.getElementById('vault-code').value;
  let vc=document.getElementById('vault-conf').value;
  let t=document.getElementById('test-code').value;
  let tc=document.getElementById('test-conf').value;
  let m=document.getElementById('urg-msg').value;
  if(a!==ac || u!==uc || v!==vc || t!==tc){
    showToast('Les mots de passe ne correspondent pas', 'error');
    return;
  }
  let s=new Set([a,u,v,t]);
  if(s.size!==4){
    showToast('Les 4 codes doivent être différents', 'error');
    return;
  }
  let b=document.getElementById('btn-setup');
  b.disabled=true;
  b.innerHTML='<i class="fas fa-spinner fa-spin"></i> Configuration...';
  let d={
    isSetup:true,
    adminHash:hashPassword(a),
    emergencyHash:hashPassword(u),
    vaultHash:hashPassword(v),
    testamentHash:hashPassword(t),
    encryptedEmergencyPassword:encryptData(u, a),
    encryptedVaultPassword:encryptData(v, a),
    encryptedTestamentPassword:encryptData(t, a),
    contacts:encryptData([], a),
    emergencyContacts:encryptData([], u),
    vaultData:encryptData({}, v),
    testamentData:encryptData({identity:{},content:'',lastModified:new Date().toISOString()}, t),
    emergencyMessage:encryptData(m, a),
    emergencyMessageForEmergency:encryptData(m, u),
    accessLogs:encryptData([], a),
    publicAccessLogs:[]
  };
  try{
    let res=await postToApi({action:'setup',data:d});
    if(res.status==='success'){
      showToast('Configuration terminée', 'success');
      setTimeout(()=>{window.location.href='index.html';},2000);
    }else{
      showToast('Erreur serveur', 'error');
      b.disabled=false;
      b.innerText='Configurer';
    }
  }catch(err){
    showToast('Erreur réseau', 'error');
    b.disabled=false;
    b.innerText='Configurer';
  }
};
