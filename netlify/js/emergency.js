const emergencyKey = sessionStorage.getItem('emergencyKey');
let contacts = [];

if (!emergencyKey) {
  window.location.href = 'index.html';
}

document.addEventListener('DOMContentLoaded', async () => {
  const contactsContainer = document.getElementById('contacts-container');
  const btnLogout = document.getElementById('btn-logout');
  const btnPanic = document.getElementById('btn-panic');
  const emergencyMessage = document.getElementById('emergency-message');

  // Load Contacts
  showLoader();
  const data = await fetchFromApi();
  hideLoader();

  // The emergency contacts should be decrypted using the emergency password
  if (data && data.emergencyContacts) {
    contacts = decryptData(data.emergencyContacts, emergencyKey) || [];
    renderContacts(contacts);
  } else {
    // Fallback if no specific emergency contacts are found
    emergencyMessage.textContent = "Aucun contact d'urgence configuré.";
    emergencyMessage.classList.remove('hidden');
  }

  // Events
  btnLogout.addEventListener('click', () => {
    sessionStorage.clear();
    window.location.href = 'index.html';
  });

  btnPanic.addEventListener('click', async () => {
    if (confirm("Êtes-vous sûr de vouloir alerter tous les contacts de niveau 1 ?")) {
      const level1Contacts = contacts.filter(c => c.importance === 1);

      // Send an alert request to the backend for level 1
      showLoader();
      await postToApi({
        emergencyAccess: true,
        panicAlert: true,
        level1Count: level1Contacts.length
      });
      hideLoader();

      alert("Alerte envoyée.");
    }
  });

  function renderContacts(list) {
    contactsContainer.innerHTML = '';

    const sorted = [...list].sort((a,b) => a.importance - b.importance);

    sorted.forEach(c => {
      const card = document.createElement('div');
      card.className = `contact-card imp-${c.importance}`;

      let actionsHTML = '';
      if(c.phone) actionsHTML += `<a href="tel:${c.phone}" class="action-icon tel"><i class="fas fa-phone"></i></a>`;
      if(c.snap) actionsHTML += `<a href="https://www.snapchat.com/add/${c.snap}" target="_blank" class="action-icon snap"><i class="fab fa-snapchat-ghost"></i></a>`;
      if(c.insta) actionsHTML += `<a href="https://www.instagram.com/${c.insta}" target="_blank" class="action-icon insta"><i class="fab fa-instagram"></i></a>`;

      card.innerHTML = `
        <div class="card-header">
          <div>
            <h3>${c.name}</h3>
            <span class="relation-tag">${c.relation}</span>
          </div>
          <div class="importance-badge">Niv ${c.importance}</div>
        </div>
        ${c.notes ? `<div class="contact-notes"><small>${c.notes}</small></div>` : ''}
        <div class="card-actions">
          ${actionsHTML}
        </div>
      `;

      contactsContainer.appendChild(card);
    });
  }

  // Timeout d'inactivité
  let timeoutId;
  function resetTimeout() {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      sessionStorage.clear();
      window.location.href = 'index.html';
    }, 10 * 60 * 1000); // 10 minutes
  }

  ['mousemove', 'keydown', 'scroll', 'click'].forEach(event => {
    window.addEventListener(event, resetTimeout);
  });
  resetTimeout();
});