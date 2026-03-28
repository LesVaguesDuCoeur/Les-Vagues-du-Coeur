function hashPassword(p){
  return CryptoJS.SHA256(p).toString();
}
function encryptData(d, k){
  return CryptoJS.AES.encrypt(JSON.stringify(d), k).toString();
}
function decryptData(e, k){
  try{
    let bytes=CryptoJS.AES.decrypt(e, k);
    let str=bytes.toString(CryptoJS.enc.Utf8);
    if(!str)return null;
    return JSON.parse(str);
  }catch(err){
    return null;
  }
}
