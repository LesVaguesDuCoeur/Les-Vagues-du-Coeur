async function getClientInfo() {
  var i = { ip: "?", userAgent: navigator.userAgent, lat: null, lng: null };
  try {
    var r = await fetch("https://ipapi.co/json/");
    var d = await r.json();
    if (d.ip) i.ip = d.ip;
    if (d.latitude) i.lat = d.latitude;
    if (d.longitude) i.lng = d.longitude;
  } catch(e) {
    try {
      var r2 = await fetch("https://api.ipify.org?format=json");
      i.ip = (await r2.json()).ip;
    } catch(e2) {}
  }
  return i;
}

async function sendAlertThenRedirect(flag, url, extra) {
  var i = await getClientInfo();
  var p = { ip: i.ip, userAgent: i.userAgent, lat: i.lat, lng: i.lng };
  p[flag] = true;
  if (extra) { for (var k in extra) p[k] = extra[k]; }
  try { await postToApi(p); } catch(e) {}
  if (url) window.location.href = url;
}

function showToast(msg, type) {
  var t = document.createElement('div');
  t.className = 'toast toast-' + (type || 'info');
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(function() {
    t.classList.add('toast-show');
  }, 10);
  setTimeout(function() {
    t.classList.remove('toast-show');
    setTimeout(function() {
      if (t.parentNode) t.parentNode.removeChild(t);
    }, 300);
  }, 3000);
}

function openModal(html) {
  var m = document.getElementById('modal-container');
  if (!m) {
    m = document.createElement('div');
    m.id = 'modal-container';
    m.className = 'modal-overlay';
    document.body.appendChild(m);
  }
  m.innerHTML = '<div class="modal-dialog">' + html + '</div>';
  m.style.display = 'flex';
}

function closeModal() {
  var m = document.getElementById('modal-container');
  if (m) m.style.display = 'none';
}

function confirmDialog(msg) {
  return new Promise(function(resolve) {
    var h = '<h3>Confirmation</h3><p>' + escapeHtml(msg) + '</p><div class="flex gap-4 mt-6"><button id="btn-cancel" class="btn btn-secondary flex-1">Annuler</button><button id="btn-confirm" class="btn btn-primary flex-1">Confirmer</button></div>';
    openModal(h);
    document.getElementById('btn-cancel').onclick = function() {
      closeModal();
      resolve(false);
    };
    document.getElementById('btn-confirm').onclick = function() {
      closeModal();
      resolve(true);
    };
  });
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
  document.addEventListener('mousemove', r);
  document.addEventListener('keypress', r);
  document.addEventListener('touchstart', r);
  r();
}

function formatDateFR(dateStr) {
  if (!dateStr) return '';
  var d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  var dFR = ("0" + d.getDate()).slice(-2) + "/" + ("0" + (d.getMonth() + 1)).slice(-2) + "/" + d.getFullYear();
  var hFR = ("0" + d.getHours()).slice(-2) + "h" + ("0" + d.getMinutes()).slice(-2);
  return dFR + " à " + hFR;
}

function copyToClipboard(text) {
  if (!navigator.clipboard) {
    var ta = document.createElement("textarea");
    ta.value = text;
    ta.style.top = "0";
    ta.style.left = "0";
    ta.style.position = "fixed";
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    try {
      document.execCommand('copy');
      showToast("Copié !", "success");
    } catch (err) {
      showToast("Erreur copie", "error");
    }
    document.body.removeChild(ta);
    return;
  }
  navigator.clipboard.writeText(text).then(function() {
    showToast("Copié !", "success");
  }, function(err) {
    showToast("Erreur copie", "error");
  });
}

function toggleVisibility(btn, fieldId) {
  var f = document.getElementById(fieldId);
  if (!f) return;
  var ic = btn.querySelector('i');
  if (f.type === "password") {
    f.type = "text";
    if (ic) {
      ic.classList.remove('fa-eye');
      ic.classList.add('fa-eye-slash');
    }
  } else {
    f.type = "password";
    if (ic) {
      ic.classList.remove('fa-eye-slash');
      ic.classList.add('fa-eye');
    }
  }
}

function escapeHtml(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/[&<>"']/g, function(m) {
    switch (m) {
      case '&': return '&amp;';
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '"': return '&quot;';
      case "'": return '&#039;';
      default: return m;
    }
  });
}
