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

    sorted.forEach(c => {
      const card = document.createElement('div');
      card.className = `contact-card imp-${c.importance}`;

      let actionsHTML = '';
      if(c.phone) actionsHTML += `<a href="tel:${c.phone}" class="action-icon tel"><i class="fas fa-phone"></i></a>`;
      if(c.email) actionsHTML += `<a href="mailto:${c.email}" class="action-icon email"><i class="fas fa-envelope"></i></a>`;
      if(c.whatsapp) actionsHTML += `<a href="https://wa.me/${c.whatsapp}" target="_blank" class="action-icon whatsapp"><i class="fab fa-whatsapp"></i></a>`;
      if(c.snap) actionsHTML += `<a href="https://www.snapchat.com/add/${c.snap}" target="_blank" class="action-icon snap"><i class="fab fa-snapchat-ghost"></i></a>`;
      if(c.insta) actionsHTML += `<a href="https://www.instagram.com/${c.insta}" target="_blank" class="action-icon insta"><i class="fab fa-instagram"></i></a>`;
      if(c.messenger) actionsHTML += `<a href="https://m.me/${c.messenger}" target="_blank" class="action-icon messenger"><i class="fab fa-facebook-messenger"></i></a>`;
      if(c.telegram) actionsHTML += `<a href="https://t.me/${c.telegram}" target="_blank" class="action-icon telegram"><i class="fab fa-telegram"></i></a>`;
      if(c.tiktok) actionsHTML += `<a href="https://www.tiktok.com/@${c.tiktok}" target="_blank" class="action-icon tiktok"><i class="fab fa-tiktok"></i></a>`;
      if(c.linkedin) actionsHTML += `<a href="https://www.linkedin.com/in/${c.linkedin}" target="_blank" class="action-icon linkedin"><i class="fab fa-linkedin"></i></a>`;
      if(c.twitter) actionsHTML += `<a href="https://x.com/${c.twitter}" target="_blank" class="action-icon twitter"><i class="fab fa-twitter"></i></a>`;
      if(c.website) actionsHTML += `<a href="${c.website}" target="_blank" class="action-icon website"><i class="fas fa-globe"></i></a>`;
      if(c.address) actionsHTML += `<a href="https://maps.google.com/?q=${encodeURIComponent(c.address)}" target="_blank" class="action-icon address"><i class="fas fa-map-marker-alt"></i></a>`;

      card.innerHTML = `
        <div class="card-header">
          <div>
            <h3>${c.name}</h3>
            <span class="relation-tag">${c.relation}</span>
          </div>
          <div class="actions-edit">
            <button class="btn btn-secondary btn-sm edit-btn" data-id="${c.id}"><i class="fas fa-pen"></i></button>
            <button class="btn btn-danger btn-sm del-btn" data-id="${c.id}"><i class="fas fa-trash"></i></button>
          </div>
        </div>
        <div class="card-actions">
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