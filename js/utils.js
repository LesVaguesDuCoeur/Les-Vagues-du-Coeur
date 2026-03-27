function showToast(msg, type) {
  var d = document.createElement('div');
  d.className = 'toast ' + (type || 'info');
  d.textContent = msg;
  document.body.appendChild(d);
  setTimeout(function() {
    d.style.opacity = '0';
    d.style.transition = 'opacity 0.3s';
    setTimeout(function() { if (d.parentNode) d.parentNode.removeChild(d); }, 300);
  }, 3000);
}

async function getClientInfo() {
  var i = { ip: "?", userAgent: navigator.userAgent, lat: null, lng: null };
  try { var r = await fetch("https://api.ipify.org?format=json"); i.ip = (await r.json()).ip; } catch(e) {}
  return new Promise(function(ok) {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        function(p) { i.lat = p.coords.latitude; i.lng = p.coords.longitude; ok(i); },
        function() { ok(i); }, { timeout: 5000 }
      );
    } else ok(i);
  });
}

async function sendAlertThenRedirect(flag, url, extra) {
  var i = await getClientInfo();
  var p = { ip: i.ip, userAgent: i.userAgent, lat: i.lat, lng: i.lng };
  p[flag] = true;
  if (extra) { for (var k in extra) p[k] = extra[k]; }
  try { await postToApi(p); } catch(e) {}
  if (url) window.location.href = url;
}

function setupAutoLock(min) {
  var t;
  function r() {
    clearTimeout(t);
    t = setTimeout(function() {
      sessionStorage.clear();
      window.location.href = 'index.html';
    }, min * 60000);
  }
  window.addEventListener('mousemove', r);
  window.addEventListener('keypress', r);
  window.addEventListener('touchstart', r);
  r();
}

function openModal(html) {
  var d = document.createElement('div');
  d.id = 'dynamic-modal';
  d.className = 'modal-overlay';
  d.innerHTML = '<div class="modal-dialog">' + html + '</div>';
  d.addEventListener('click', function(e) {
    if (e.target === d) closeModal();
  });
  document.body.appendChild(d);
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  var d = document.getElementById('dynamic-modal');
  if (d && d.parentNode) {
    d.parentNode.removeChild(d);
    document.body.style.overflow = 'auto';
  }
}

function confirmDialog(msg) {
  return new Promise(function(resolve) {
    openModal('<div class="text-center"><h3 class="mb-4">' + escapeHtml(msg) + '</h3><div class="d-flex justify-between gap-3"><button id="btn-cancel" style="background:#555;">Annuler</button><button id="btn-confirm" class="danger">Confirmer</button></div></div>');
    var confirmed = false;
    var d = document.getElementById('dynamic-modal');
    document.getElementById('btn-confirm').addEventListener('click', function() { confirmed = true; closeModal(); resolve(true); });
    document.getElementById('btn-cancel').addEventListener('click', function() { closeModal(); resolve(false); });
    var origClose = window.closeModal;
    window.closeModal = function() {
      if (!confirmed) resolve(false);
      var d = document.getElementById('dynamic-modal');
      if (d && d.parentNode) d.parentNode.removeChild(d);
      document.body.style.overflow = 'auto';
      window.closeModal = origClose;
    };
  });
}

function formatDateFR(date) {
  if (!date) return '';
  var d = new Date(date);
  return ("0" + d.getDate()).slice(-2) + "/" + ("0" + (d.getMonth() + 1)).slice(-2) + "/" + d.getFullYear() + " à " + ("0" + d.getHours()).slice(-2) + "h" + ("0" + d.getMinutes()).slice(-2);
}

function copyToClipboard(text) {
  if (!text) return;
  navigator.clipboard.writeText(text).then(function() {
    showToast('Copié !', 'success');
  }).catch(function() {});
}

function toggleVisibility(btn, fieldId) {
  var f = document.getElementById(fieldId);
  if (!f) return;
  if (f.type === 'password') {
    f.type = 'text';
    btn.innerHTML = '<i class="fas fa-eye-slash"></i>';
  } else {
    f.type = 'password';
    btn.innerHTML = '<i class="fas fa-eye"></i>';
  }
}

function escapeHtml(str) {
  if (!str) return '';
  var d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}

function getLockout() {
  var l = JSON.parse(localStorage.getItem('lockout') || '{"count":0,"time":0}');
  if (Date.now() < l.time) return Math.ceil((l.time - Date.now()) / 1000);
  if (l.time > 0 && Date.now() >= l.time) {
    localStorage.removeItem('lockout');
    return 0;
  }
  return 0;
}

async function addLockout() {
  var l = JSON.parse(localStorage.getItem('lockout') || '{"count":0,"time":0}');
  if (l.time > 0 && Date.now() >= l.time) l.count = 0;
  l.count++;
  if (l.count >= 10) {
    l.time = Date.now() + 600000;
    var i = await getClientInfo();
    try { await postToApi({ suspiciousActivity: true, ip: i.ip, userAgent: i.userAgent, lat: i.lat, lng: i.lng }); } catch(e) {}
  }
  else if (l.count >= 5) l.time = Date.now() + 120000;
  else if (l.count >= 3) l.time = Date.now() + 30000;
  else l.time = 0;
  localStorage.setItem('lockout', JSON.stringify(l));
  return getLockout();
}