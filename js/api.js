var _u="https://script.google.com/macros/s/AKfycbxYb9MYC8yySuT64ecUtBczMWATJTGk5eIXreKhM09MK4ZzMJOhxy1YQ1n-eQ7FN580/exec";
async function loadData(){try{var r=await fetch(_u);return await r.json();}catch(e){showToast("Erreur de chargement","error");return null;}}
async function postToApi(p){try{var r=await fetch(_u,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify(p)});return await r.json();}catch(e){showToast("Erreur de sauvegarde","error");throw e;}}
