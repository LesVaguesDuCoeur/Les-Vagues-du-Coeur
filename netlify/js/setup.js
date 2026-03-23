document.addEventListener('DOMContentLoaded',async function(){
  var d=await loadData();
  if(d.isSetup){window.location.href='index.html';return;}
  document.getElementById('setup-btn').addEventListener('click',async function(){
    var a=document.getElementById('admin-pwd').value;
    var u=document.getElementById('emergency-pwd').value;
    var v=document.getElementById('vault-pwd').value;
    var t=document.getElementById('testament-pwd').value;
    if(!a||!u||!v||!t){showToast('Remplissez tous les champs','error');return;}
    var j={
      isSetup:true,
      adminHash:hashPassword(a),
      emergencyHash:hashPassword(u),
      vaultHash:hashPassword(v),
      testamentHash:hashPassword(t),
      encryptedEmergencyPassword:encryptData(u,a),
      encryptedVaultPassword:encryptData(v,a),
      encryptedTestamentPassword:encryptData(t,a),
      contacts:encryptData([],a),
      emergencyContacts:encryptData([],u),
      vaultData:encryptData([],v),
      testamentData:encryptData({identity:{nom:'',prenom:'',dateNaissance:'',lieuNaissance:'',nationalite:'',adresse:''},content:'',lastModified:null},t),
      emergencyMessage:encryptData('',a),
      emergencyMessageForEmergency:encryptData('',u),
      accessLogs:encryptData([],a),
      publicAccessLogs:[]
    };
    try{
      var r=await postToApi({action:'setup',data:j});
      if(r.status==='success'){
        showToast('Initialisation terminée','success');
        setTimeout(function(){window.location.href='index.html';},2000);
      }else{showToast('Erreur serveur','error');}
    }catch(e){showToast('Erreur connexion','error');}
  });
});