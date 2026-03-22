const adminKey = sessionStorage.getItem('adminKey');
let contacts = [];

if (!adminKey) {
  window.location.href = 'index.html';
}

document.addEventListener('DOMContentLoaded', async () => {
  const contactsContainer = document.getElementById('contacts-container');
  const searchInput = document.getElementById('search-input');
  const modal = document.getElementById('contact-modal');
  const closeBtn = document.querySelector('.close-btn');
  const form = document.getElementById('contact-form');
  const btnAdd = document.getElementById('btn-add-contact');
  const btnExport = document.getElementById('btn-export');
  const btnLogout = document.getElementById('btn-logout');

  // Load Contacts
  showLoader();
  const data = await fetchFromApi();
  hideLoader();

  if (data && data.contacts) {
    contacts = decryptData(data.contacts, adminKey) || [];
    renderContacts(contacts);
  }

  // Events
  searchInput.addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase();
    const filtered = contacts.filter(c => c.name.toLowerCase().includes(term));
    renderContacts(filtered);
  });

  const relationSelect = document.getElementById('contact-relation');
  const relationOtherInput = document.getElementById('contact-relation-other');

  relationSelect.addEventListener('change', (e) => {
    if (e.target.value === 'Autre') {
      relationOtherInput.classList.remove('hidden');
      relationOtherInput.required = true;
    } else {
      relationOtherInput.classList.add('hidden');
      relationOtherInput.required = false;
      relationOtherInput.value = '';
    }
  });

  btnAdd.addEventListener('click', () => {
    form.reset();
    document.getElementById('contact-id').value = '';
    document.getElementById('modal-title').innerText = 'Nouveau Contact';
    modal.classList.remove('hidden');
  });

  closeBtn.addEventListener('click', () => modal.classList.add('hidden'));

  window.addEventListener('click', (e) => {
    if (e.target === modal) modal.classList.add('hidden');
  });

  btnLogout.addEventListener('click', () => {
    sessionStorage.clear();
    window.location.href = 'index.html';
  });

  btnExport.addEventListener('click', () => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.text("Carnet de Contacts Sécurisé", 10, 10);

    let y = 20;
    contacts.sort((a,b) => a.importance - b.importance).forEach(c => {
      doc.text(`${c.name} - ${c.relation} (Niv ${c.importance})`, 10, y);
      if(c.phone) doc.text(`Tel: ${c.phone}`, 15, y+5);
      y += 15;
    });

    doc.save("Contacts_Urgence.pdf");
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const idInput = document.getElementById('contact-id').value;
    const relationVal = document.getElementById('contact-relation').value;
    const finalRelation = relationVal === 'Autre' ? document.getElementById('contact-relation-other').value : relationVal;

    const newContact = {
      id: idInput || Date.now().toString(),
      name: document.getElementById('contact-name').value,
      photo: document.getElementById('contact-photo') ? document.getElementById('contact-photo').value : '',
      relation: finalRelation,
      importance: parseInt(document.querySelector('input[name="importance"]:checked').value),
      phone: document.getElementById('contact-phone').value,
      email: document.getElementById('contact-email').value,
      whatsapp: document.getElementById('contact-whatsapp').value,
      snap: document.getElementById('contact-snap').value,
      insta: document.getElementById('contact-insta').value,
      messenger: document.getElementById('contact-messenger').value,
      telegram: document.getElementById('contact-telegram').value,
      tiktok: document.getElementById('contact-tiktok').value,
      linkedin: document.getElementById('contact-linkedin').value,
      twitter: document.getElementById('contact-twitter').value,
      website: document.getElementById('contact-website').value,
      address: document.getElementById('contact-address').value,
      notes: document.getElementById('contact-notes').value
    };

    if (idInput) {
      const idx = contacts.findIndex(c => c.id === idInput);
      if(idx > -1) contacts[idx] = newContact;
    } else {
      contacts.push(newContact);
    }

    modal.classList.add('hidden');
    renderContacts(contacts);

    // Save to server
    showLoader();
    const encryptedContacts = encryptData(contacts, adminKey);

    let emergencyKey = sessionStorage.getItem('knownEmergencyKey');
    if (!emergencyKey) {
      emergencyKey = prompt("Veuillez entrer le mot de passe d'urgence pour mettre à jour la vue urgence :");
      if (emergencyKey) {
        sessionStorage.setItem('knownEmergencyKey', emergencyKey);
      }
    }

    data.contacts = encryptedContacts;
    if (emergencyKey) {
      const emergencyContacts = contacts.map(c => ({
        id: c.id,
        name: c.name,
        photo: c.photo || '',
        relation: c.relation,
        importance: c.importance,
        phone: c.phone,
        email: c.email,
        whatsapp: c.whatsapp,
        snap: c.snap,
        insta: c.insta,
        messenger: c.messenger,
        telegram: c.telegram,
        tiktok: c.tiktok,
        linkedin: c.linkedin,
        twitter: c.twitter,
        website: c.website,
        address: c.address,
        notes: c.notes
      }));
      data.emergencyContacts = encryptData(emergencyContacts, emergencyKey);
    }

    await postToApi(data);
    hideLoader();
  });

  function renderContacts(list) {
    contactsContainer.innerHTML = '';

    const sorted = [...list].sort((a,b) => a.importance - b.importance);

    const linksDef = [
      { key: 'phone',     href: v => `tel:${v}`,                           icon: 'fa-phone',        color: '#4caf50' },
      { key: 'email',     href: v => `mailto:${v}`,                        icon: 'fa-envelope',     color: '#2196f3' },
      { key: 'whatsapp',  href: v => `https://wa.me/${v}`,                 icon: 'fab fa-whatsapp', color: '#25d366' },
      { key: 'messenger', href: v => `https://m.me/${v}`,                  icon: 'fab fa-facebook-messenger', color: '#0084ff' },
      { key: 'snap',      href: v => `https://snapchat.com/add/${v}`,      icon: 'fab fa-snapchat-ghost', color: '#fffc00', dark: true },
      { key: 'insta',     href: v => `https://instagram.com/${v}`,         icon: 'fab fa-instagram', color: '#e1306c' },
      { key: 'telegram',  href: v => `https://t.me/${v}`,                  icon: 'fab fa-telegram', color: '#229ed9' },
      { key: 'tiktok',    href: v => `https://tiktok.com/@${v}`,           icon: 'fab fa-tiktok',   color: '#fff' },
      { key: 'linkedin',  href: v => `https://linkedin.com/in/${v}`,       icon: 'fab fa-linkedin', color: '#0a66c2' },
      { key: 'twitter',   href: v => `https://x.com/${v}`,                 icon: 'fab fa-twitter',  color: '#1da1f2' },
      { key: 'website',   href: v => v,                                     icon: 'fa-globe',        color: '#9e9e9e' },
      { key: 'address',   href: v => `https://maps.google.com/?q=${encodeURIComponent(v)}`, icon: 'fa-map-marker-alt', color: '#f44336' },
    ];

    function escHtml(str) {
      if (!str) return '';
      return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    }

    sorted.forEach(c => {
      const card = document.createElement('div');
      card.className = `contact-card imp-${c.importance}`;

      let actionsHTML = '';
      linksDef.forEach(link => {
        if(c[link.key]) {
          const style = `color: ${link.dark ? '#000' : '#fff'}; background: ${link.color};`;
          actionsHTML += `<a href="${escHtml(link.href(c[link.key]))}" target="_blank" class="action-icon" style="${style}"><i class="fas ${link.icon}"></i></a>`;
        }
      });

      const photoHtml = c.photo ? `<img src="${escHtml(c.photo)}" alt="Photo" style="width:40px;height:40px;border-radius:50%;object-fit:cover;margin-right:10px;">` : '';

      card.innerHTML = `
        <div class="card-header">
          <div style="display:flex; align-items:center;">
            ${photoHtml}
            <div>
              <h3>${escHtml(c.name)}</h3>
              <span class="relation-tag">${escHtml(c.relation)}</span>
            </div>
          </div>
          <div class="actions-edit">
            <button class="btn btn-secondary btn-sm edit-btn" data-id="${escHtml(c.id)}"><i class="fas fa-pen"></i></button>
            <button class="btn btn-danger btn-sm del-btn" data-id="${escHtml(c.id)}"><i class="fas fa-trash"></i></button>
          </div>
        </div>
        <div class="card-actions" style="display:flex; flex-wrap:wrap; gap:8px;">
          ${actionsHTML}
        </div>
      `;

      contactsContainer.appendChild(card);
    });

    document.querySelectorAll('.edit-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        const contact = contacts.find(c => c.id === id);
        if(contact) {
          document.getElementById('contact-id').value = contact.id;
          document.getElementById('contact-name').value = contact.name;
          if (document.getElementById('contact-photo')) document.getElementById('contact-photo').value = contact.photo || '';

          const relationSelectOptions = Array.from(document.getElementById('contact-relation').options).map(o => o.value);
          if (relationSelectOptions.includes(contact.relation)) {
            document.getElementById('contact-relation').value = contact.relation;
            document.getElementById('contact-relation-other').classList.add('hidden');
          } else {
            document.getElementById('contact-relation').value = 'Autre';
            document.getElementById('contact-relation-other').value = contact.relation;
            document.getElementById('contact-relation-other').classList.remove('hidden');
          }

          document.querySelector(`input[name="importance"][value="${contact.importance}"]`).checked = true;
          document.getElementById('contact-phone').value = contact.phone || '';
          document.getElementById('contact-email').value = contact.email || '';
          document.getElementById('contact-whatsapp').value = contact.whatsapp || '';
          document.getElementById('contact-snap').value = contact.snap || '';
          document.getElementById('contact-insta').value = contact.insta || '';
          document.getElementById('contact-messenger').value = contact.messenger || '';
          document.getElementById('contact-telegram').value = contact.telegram || '';
          document.getElementById('contact-tiktok').value = contact.tiktok || '';
          document.getElementById('contact-linkedin').value = contact.linkedin || '';
          document.getElementById('contact-twitter').value = contact.twitter || '';
          document.getElementById('contact-website').value = contact.website || '';
          document.getElementById('contact-address').value = contact.address || '';
          document.getElementById('contact-notes').value = contact.notes || '';

          document.getElementById('modal-title').innerText = 'Modifier Contact';
          modal.classList.remove('hidden');
        }
      });
    });

    document.querySelectorAll('.del-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        if(confirm("Supprimer ce contact ?")) {
          const id = e.currentTarget.getAttribute('data-id');
          contacts = contacts.filter(c => c.id !== id);
          renderContacts(contacts);

          showLoader();
          data.contacts = encryptData(contacts, adminKey);
          await postToApi(data);
          hideLoader();
        }
      });
    });
  }
});