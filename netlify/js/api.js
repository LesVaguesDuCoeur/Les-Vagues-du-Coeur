var _u="https://script.google.com/macros/s/AKfycbxYb9MYC8yySuT64ecUtBczMWATJTGk5eIXreKhM09MK4ZzMJOhxy1YQ1n-eQ7FN580/exec";
async function postToApi(p){
  var r=await fetch(_u,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify(p)});
  return await r.json();
}
async function loadData(){
  return await postToApi({action:'load'});
}
