const adminKey = sessionStorage.getItem('adminKey');
let vaultKey = sessionStorage.getItem('vaultKey');

if (!adminKey) {
  window.location.href = 'index.html';
}

document.addEventListener('DOMContentLoaded', async () => {
  const loginView = document.getElementById('vault-login');
  const dataView = document.getElementById('vault-data');
  const vaultAccessInput = document.getElementById('vault-access-code');
  const btnVaultLogin = document.getElementById('btn-vault-login');
  const errorMsg = document.getElementById('vault-error');
  const btnLogout = document.getElementById('btn-logout');
  const btnSave = document.getElementById('btn-save');
  const modal = document.getElementById('vault-modal');
  const closeBtn = document.querySelector('.close-btn');
  const vaultForm = document.getElementById('vault-form');
  const dynamicFormFields = document.getElementById('dynamic-form-fields');
  const itemLockedCheckbox = document.getElementById('item-locked');
  const lockOptions = document.getElementById('lock-options');

  let fullData = null;
  let vaultData = { a: [], b: [], c: [], d: '' };
  let isAdminMaster = false;

  showLoader('loader');
  fullData = await fetchFromApi();
  hideLoader('loader');

  if (fullData && fullData.lockedItems === undefined) {
      fullData.lockedItems = {};
  }

  btnLogout.addEventListener('click', () => {
    sessionStorage.clear();
    window.location.href = 'index.html';
  });

  // Try admin master key bypass on load
  if (adminKey) {
      if (fullData && fullData.vaultKeyEncrypted) {
          const decryptedVaultKey = decryptData(fullData.vaultKeyEncrypted, adminKey);
          if (decryptedVaultKey) {
              vaultKey = decryptedVaultKey;
          } else {
              vaultKey = adminKey; // Fallback
          }
      } else {
          vaultKey = adminKey; // Fallback
      }

      document.getElementById('vault-login').classList.add('hidden');
      document.getElementById('vault-data').classList.remove('hidden');
      isAdminMaster = true;
      loadVaultData();
  }

  const attemptUnlock = async () => {
    // Si on est admin, on passe directement (click listener)
    if (adminKey && fullData && fullData.adminHash === hashPassword(adminKey)) {
      if (fullData.vaultKeyEncrypted) {
          const decryptedVaultKey = decryptData(fullData.vaultKeyEncrypted, adminKey);
          if (decryptedVaultKey) {
              vaultKey = decryptedVaultKey;
              isAdminMaster = true;
              loadVaultData();
              return;
          }
      } else {
          vaultKey = adminKey;
          isAdminMaster = true;
          loadVaultData();
          return;
      }
    }

    const vaultPwd = vaultAccessInput.value.trim();
    const emergencyPwd = document.getElementById('vault-emergency-code').value.trim();

    if (!vaultPwd || !emergencyPwd) return;

    const vaultHash = hashPassword(vaultPwd);
    const emergencyHash = hashPassword(emergencyPwd);

    const isVaultPassword = (fullData && vaultHash === fullData.vaultHash);
    const isEmergencyPassword = (fullData && emergencyHash === fullData.emergencyHash);
    const isAdminPassword = (fullData && vaultHash === fullData.adminHash);

    // Si on rentre l'admin, ça bypasse le mot de passe urgence (on ne checke pas isEmergencyPassword)
    if (isAdminPassword) {
      // Decode vault key with admin password
      if (fullData.vaultKeyEncrypted) {
        const decryptedVaultKey = decryptData(fullData.vaultKeyEncrypted, vaultPwd);
        if (decryptedVaultKey) {
            vaultKey = decryptedVaultKey;
            isAdminMaster = true;
            if (!sessionStorage.getItem('adminKey')) sessionStorage.setItem('adminKey', vaultPwd);
            loadVaultData();
        } else {
            errorMsg.classList.remove('hidden');
        }
      } else {
          vaultKey = vaultPwd;
          isAdminMaster = true;
          loadVaultData();
      }
    } else if (isVaultPassword && isEmergencyPassword) {
      vaultKey = vaultPwd;
      sessionStorage.setItem('vaultKey', vaultPwd);
      loadVaultData();
    } else {
      errorMsg.classList.remove('hidden');
    }
  };

  btnVaultLogin.addEventListener('click', attemptUnlock);

  if (vaultKey && !isAdminMaster) {
     loadVaultData();
  }

  function loadVaultData() {
    loginView.classList.add('hidden');
    dataView.classList.remove('hidden');

    if (fullData && fullData.vaultData) {
         try {
             const raw = decryptData(fullData.vaultData, vaultKey);
             if (raw) {
                 vaultData = raw;
             } else {
                 console.log("Failed to decrypt vault data, using empty default");
             }
         } catch (e) {
             console.error(e);
         }
    }

    document.getElementById('section-d-textarea').value = vaultData.d || '';

    renderSection('a');
    renderSection('b');
    renderSection('c');
  }

  btnSave.addEventListener('click', async () => {
      showLoader();
      vaultData.d = document.getElementById('section-d-textarea').value;
      fullData.vaultData = encryptData(vaultData, vaultKey);
      await postToApi(fullData);
      hideLoader();
      alert("Enregistré");
  });

  // Modal logic
  const sectionsConfig = {
      'a': [
          { id: 'a_name', label: "Nom de l'app/service *", type: 'text', required: true },
          { id: 'a_url', label: 'URL du service', type: 'url' },
          { id: 'a_id', label: 'Identifiant / Email', type: 'text' },
          { id: 'a_pwd', label: 'Mot de passe', type: 'text' }, // Should be password UI, but text for easy copy in normal view
          { id: 'a_note', label: 'Note (optionnelle)', type: 'text' }
      ],
      'b': [
          { id: 'b_bank', label: 'Banque / Établissement *', type: 'text', required: true },
          { id: 'b_card', label: 'Numéro de carte', type: 'text' },
          { id: 'b_pin', label: 'Code PIN CB', type: 'text' },
          { id: 'b_app', label: "Code d'accès application bancaire", type: 'text' },
          { id: 'b_iban', label: 'IBAN', type: 'text' },
          { id: 'b_contact', label: 'Nom du conseiller + contact', type: 'text' },
          { id: 'b_note', label: 'Note', type: 'text' }
      ],
      'c': [
          { id: 'c_cat', label: 'Catégorie *', type: 'text', required: true, placeholder: 'Ex: Assurance, Passeport...' },
          { id: 'c_name', label: 'Nom du document', type: 'text' },
          { id: 'c_ref', label: 'Numéro / Référence', type: 'text' },
          { id: 'c_org', label: 'Organisme + contact', type: 'text' },
          { id: 'c_date', label: "Date d'expiration", type: 'date' },
          { id: 'c_note', label: 'Note', type: 'text' }
      ]
  };

  itemLockedCheckbox.addEventListener('change', (e) => {
      if (e.target.checked) {
          lockOptions.classList.remove('hidden');
          document.getElementById('item-auth-name').required = true;
          document.getElementById('item-pwd').required = true;
      } else {
          lockOptions.classList.add('hidden');
          document.getElementById('item-auth-name').required = false;
          document.getElementById('item-pwd').required = false;
      }
  });

  ['a', 'b', 'c'].forEach(sec => {
      document.getElementById(`btn-add-${sec}`).addEventListener('click', () => openModal(sec));
  });

  closeBtn.addEventListener('click', () => modal.classList.add('hidden'));

  function openModal(secId, item = null) {
      vaultForm.reset();
      document.getElementById('vault-section-id').value = secId;
      document.getElementById('vault-item-id').value = item ? item.id : '';
      dynamicFormFields.innerHTML = '';

      sectionsConfig[secId].forEach(field => {
          const div = document.createElement('div');
          div.className = 'form-group';
          div.innerHTML = `
              <label>${field.label}</label>
              <input type="${field.type}" id="${field.id}" ${field.required ? 'required' : ''} placeholder="${field.placeholder || ''}">
          `;
          dynamicFormFields.appendChild(div);
      });

      if (item) {
          sectionsConfig[secId].forEach(field => {
              document.getElementById(field.id).value = item[field.id] || '';
          });

          if (item.locked) {
              itemLockedCheckbox.checked = true;
              itemLockedCheckbox.dispatchEvent(new Event('change'));
              // We can't auto-fill the password, it's hashed.
              // Just require it again if they want to keep it locked, or assume they are modifying the data inside.
              // To simplify, if they edit a locked item, they must provide the password again.
          }
      } else {
          itemLockedCheckbox.checked = false;
          itemLockedCheckbox.dispatchEvent(new Event('change'));
      }

      modal.classList.remove('hidden');
  }

  vaultForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const secId = document.getElementById('vault-section-id').value;
      const itemId = document.getElementById('vault-item-id').value || Date.now().toString();
      const isLocked = itemLockedCheckbox.checked;

      const itemData = { id: itemId, locked: isLocked };
      sectionsConfig[secId].forEach(f => {
          itemData[f.id] = document.getElementById(f.id).value;
      });

      if (isLocked) {
          const authName = document.getElementById('item-auth-name').value;
          const pwd = document.getElementById('item-pwd').value;
          if (pwd) {
              const hash = hashPassword(pwd);
              // Store in lockedItems
              fullData.lockedItems[itemId] = {
                  lockHash: hash,
                  authorizedName: authName,
                  dataEncryptedByItemPassword: encryptData(itemData, pwd),
                  dataEncryptedByAdminPassword: encryptData(itemData, adminKey)
              };
              // Only keep minimal info in vaultData array
              vaultData[secId] = vaultData[secId].filter(i => i.id !== itemId);
              vaultData[secId].push({ id: itemId, locked: true, name: itemData[`${secId}_name`] || itemData[`${secId}_bank`] || itemData[`${secId}_cat`] });
          }
      } else {
          // Unlocked item
          if (fullData.lockedItems[itemId]) delete fullData.lockedItems[itemId];
          vaultData[secId] = vaultData[secId].filter(i => i.id !== itemId);
          vaultData[secId].push(itemData);
      }

      modal.classList.add('hidden');
      renderSection(secId);
  });

  function renderSection(secId) {
      const container = document.getElementById(`section-${secId}-items`);
      container.innerHTML = '';

      vaultData[secId].forEach(item => {
          const div = document.createElement('div');
          div.className = 'vault-item';
          div.style.background = 'rgba(255,255,255,0.05)';
          div.style.padding = '10px';
          div.style.marginBottom = '10px';
          div.style.borderRadius = 'var(--border-radius)';
          div.style.borderLeft = '3px solid var(--primary-color)';

          if (item.locked) {
              const lockedItemDetails = fullData.lockedItems[item.id];
              const authName = lockedItemDetails ? lockedItemDetails.authorizedName : 'Inconnu';
              div.innerHTML = `
                  <div style="display:flex; justify-content:space-between; align-items:center;">
                      <strong>🔒 Verrouillé (${authName})</strong>
                      <button class="btn btn-secondary btn-sm unlock-btn" data-id="${item.id}" data-sec="${secId}">Déverrouiller</button>
                  </div>
              `;
          } else {
              let html = `<div style="display:flex; justify-content:space-between; align-items:flex-start;">`;
              html += `<div>`;
              sectionsConfig[secId].forEach(f => {
                  if (item[f.id]) {
                      const val = f.type === 'text' && (f.id.endsWith('pwd') || f.id.endsWith('card') || f.id.endsWith('pin')) ? '••••••••' : item[f.id];
                      html += `<div><small style="color:var(--text-muted)">${f.label}:</small> ${val}</div>`;
                  }
              });
              html += `</div>`;
              html += `<div>
                  <button class="btn btn-secondary btn-sm edit-item-btn" data-id="${item.id}" data-sec="${secId}"><i class="fas fa-pen"></i></button>
                  <button class="btn btn-danger btn-sm del-item-btn" data-id="${item.id}" data-sec="${secId}"><i class="fas fa-trash"></i></button>
              </div>`;
              html += `</div>`;
              div.innerHTML = html;
          }
          container.appendChild(div);
      });

      document.querySelectorAll(`.edit-item-btn[data-sec="${secId}"]`).forEach(btn => {
          btn.addEventListener('click', (e) => {
              const id = e.currentTarget.getAttribute('data-id');
              const item = vaultData[secId].find(i => i.id === id);
              if (item) openModal(secId, item);
          });
      });

      document.querySelectorAll(`.del-item-btn[data-sec="${secId}"]`).forEach(btn => {
          btn.addEventListener('click', (e) => {
              if (confirm('Supprimer cet élément ?')) {
                  const id = e.currentTarget.getAttribute('data-id');
                  vaultData[secId] = vaultData[secId].filter(i => i.id !== id);
                  if (fullData.lockedItems[id]) delete fullData.lockedItems[id];
                  renderSection(secId);
              }
          });
      });

      document.querySelectorAll(`.unlock-btn[data-sec="${secId}"]`).forEach(btn => {
          btn.addEventListener('click', (e) => {
              const id = e.currentTarget.getAttribute('data-id');

              if (isAdminMaster) {
                  // Admin can decrypt with adminKey
                  const lockedData = fullData.lockedItems[id];
                  if (lockedData && lockedData.dataEncryptedByAdminPassword) {
                      const decrypted = decryptData(lockedData.dataEncryptedByAdminPassword, adminKey);
                      if (decrypted) {
                          // Replace in local view (temporarily or permanently unlocked)
                          vaultData[secId] = vaultData[secId].map(i => i.id === id ? decrypted : i);
                          renderSection(secId);
                          return;
                      }
                  }
              }

              // Prompt for specific item password
              const pwd = prompt("Mot de passe de cet élément :");
              if (pwd) {
                  const lockedData = fullData.lockedItems[id];
                  if (lockedData && lockedData.lockHash === hashPassword(pwd)) {
                      const decrypted = decryptData(lockedData.dataEncryptedByItemPassword, pwd);
                      if (decrypted) {
                          vaultData[secId] = vaultData[secId].map(i => i.id === id ? decrypted : i);
                          renderSection(secId);
                      } else {
                          alert("Erreur de déchiffrement.");
                      }
                  } else {
                      alert("Mot de passe incorrect.");
                  }
              }
          });
      });
  }

});
