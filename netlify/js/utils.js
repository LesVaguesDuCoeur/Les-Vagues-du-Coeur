function showToast(msg, type = 'info') {
  const t = document.createElement('div');
  t.className = `toast toast-${type}`;
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => {
    t.style.opacity = '0';
    setTimeout(() => t.remove(), 300);
  }, 3000);
}

function showModal(id) {
  const m = document.getElementById(id);
  if (m) m.classList.remove('hidden');
}

function hideModal(id) {
  const m = document.getElementById(id);
  if (m) m.classList.add('hidden');
}

async function getClientInfo() {
  const info = {
    userAgent: navigator.userAgent,
    ip: 'Inconnue',
    lat: null,
    lng: null
  };
  try {
    const res = await fetch('https://api.ipify.org?format=json');
    if (res.ok) {
      const data = await res.json();
      info.ip = data.ip;
    }
  } catch (e) {}

  if (navigator.geolocation) {
    try {
      const pos = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
      });
      info.lat = pos.coords.latitude;
      info.lng = pos.coords.longitude;
    } catch (e) {}
  }
  return info;
}

function getIconForRelation(rel) {
  return 'fa-user';
}

function buildSocialLink(type, val) {
  if (!val) return '';
  const v = encodeURIComponent(val);
  if (type === 'tel') return `tel:${val}`;
  if (type === 'email') return `mailto:${val}`;
  if (type === 'whatsapp') return `https://wa.me/${val.replace(/[^0-9]/g, '')}`;
  if (type === 'telegram') return `https://t.me/${v}`;
  if (type === 'snapchat') return `https://snapchat.com/add/${v}`;
  if (type === 'instagram') return `https://instagram.com/${v}`;
  if (type === 'messenger') return `https://m.me/${v}`;
  return '';
}

function getSocialIcon(type) {
  if (type === 'tel') return 'fas fa-phone';
  if (type === 'email') return 'fas fa-envelope';
  if (type === 'whatsapp') return 'fab fa-whatsapp';
  if (type === 'telegram') return 'fab fa-telegram';
  if (type === 'snapchat') return 'fab fa-snapchat-ghost';
  if (type === 'instagram') return 'fab fa-instagram';
  if (type === 'messenger') return 'fab fa-facebook-messenger';
  return 'fas fa-link';
}
