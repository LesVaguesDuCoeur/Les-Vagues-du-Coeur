var _f=0;
document.addEventListener('DOMContentLoaded',async function(){
  try{
    var d=await loadData();
    if(!d.isSetup){window.location.href='setup.html';return;}
    sessionStorage.setItem('appData',JSON.stringify(d));
    var b=document.getElementById('login-btn');
    var p=document.getElementById('password-input');
    b.addEventListener('click',function(){_l(p.value,d);});
    p.addEventListener('keypress',function(e){if(e.key==='Enter')_l(p.value,d);});
  }catch(e){showToast('Erreur chargement','error');}
});
async function _l(p,d){
  if(!p)return;
  var h=hashPassword(p);
  if(h===d.adminHash){
    sessionStorage.setItem('k',p);
    sessionStorage.setItem('role','admin');
    window.location.href='admin.html';
  }else if(h===d.emergencyHash){
    sessionStorage.setItem('k',p);
    sessionStorage.setItem('role','emergency');
    var i=await getClientInfo();
    await postToApi({emergencyAccess:true,ip:i.ip,userAgent:i.userAgent,lat:i.lat,lng:i.lng});
    window.location.href='emergency.html';
  }else if(h===d.vaultHash){
    _a(p,d,'vault');
  }else if(h===d.testamentHash){
    _a(p,d,'testament');
  }else{
    _f++;
    showToast('Mot de passe incorrect','error');
    var bl=document.getElementById('login-btn');
    var pl=document.getElementById('password-input');
    if(_f>=10){
      var i=await getClientInfo();
      await postToApi({suspiciousActivity:true,ip:i.ip,userAgent:i.userAgent,lat:i.lat,lng:i.lng});
      document.body.innerHTML='<div style="color:red;text-align:center;margin-top:20vh;font-size:2rem;">Accès bloqué.</div>';
    }else if(_f>=5){
      bl.disabled=true;pl.disabled=true;
      setTimeout(function(){bl.disabled=false;pl.disabled=false;},120000);
      showToast('Bloqué 2min','error');
    }else if(_f>=3){
      bl.disabled=true;pl.disabled=true;
      setTimeout(function(){bl.disabled=false;pl.disabled=false;},30000);
      showToast('Bloqué 30s','error');
    }
  }
}
function _a(p,d,t){
  var m='<h3 class="modal-title">Double Authentification</h3><div class="form-group"><label>Mot de passe Urgence requis</label><input type="password" id="m-pwd"></div><button id="m-btn" class="btn btn-primary" style="width:100%">Valider</button>';
  openModal(m);
  document.getElementById('m-btn').onclick=async function(){
    var up=document.getElementById('m-pwd').value;
    if(hashPassword(up)===d.emergencyHash){
      sessionStorage.setItem('k',p);
      sessionStorage.setItem('role',t);
      var i=await getClientInfo();
      var nm="Inconnu";
      try{
        var td=decryptData(d.testamentData,decryptData(d.encryptedTestamentPassword,p));
        if(td&&td.identity&&td.identity.nom)nm=td.identity.prenom+" "+td.identity.nom;
      }catch(e){}
      var o=t==='vault'?{vaultAccess:true,ip:i.ip,userAgent:i.userAgent,lat:i.lat,lng:i.lng,nomComplet:nm}:{testamentAccess:true,ip:i.ip,userAgent:i.userAgent,lat:i.lat,lng:i.lng,nomComplet:nm};
      await postToApi(o);
      window.location.href=t+'.html';
    }else{
      showToast('Erreur','error');
      closeModal();
    }
  };
}