let activeModals = [];

window.openModal = (contentEl, options = {}) => {
  const container = document.getElementById('modal-container');
  if (!container) return;

  const modalId = `modal-${Date.now()}`;
  const titleId = `modal-title-${Date.now()}`;

  const modalWrap = createEl('div', {
    className: 'modal-content',
    role: 'dialog',
    'aria-modal': 'true',
    'aria-labelledby': titleId,
    id: modalId
  });

  const header = createEl('div', { className: 'modal-header' }, [
    createEl('h3', { id: titleId }, [options.title instanceof Node ? options.title : createEl('span', { textContent: options.title || '' })]),
    createEl('button', {
      className: 'icon-btn',
      'aria-label': 'Fermer',
      onClick: () => closeModal(modalId)
    }, [createEl('i', { className: 'fa-solid fa-xmark' })])
  ]);

  const body = createEl('div', { className: 'modal-body' }, [contentEl]);

  modalWrap.appendChild(header);
  modalWrap.appendChild(body);

  if (options.footer) {
    const footer = createEl('div', { className: 'modal-footer' }, options.footer.map(btn => {
      return createEl('button', {
        className: `btn ${btn.primary ? 'btn-primary' : 'btn-secondary'}`,
        textContent: btn.label,
        onClick: (e) => {
          if (btn.onClick) btn.onClick(e, () => closeModal(modalId));
        }
      });
    }));
    modalWrap.appendChild(footer);
  }

  container.innerHTML = '';
  const overlay = createEl('div', {
    className: 'modal-overlay',
    onClick: () => closeModal(modalId)
  });

  container.appendChild(overlay);
  container.appendChild(modalWrap);
  container.classList.add('active');

  activeModals.push(modalId);
  window.trapFocus(modalWrap);

  return modalId;
};

window.closeModal = (id) => {
  const container = document.getElementById('modal-container');
  if (!container) return;

  container.classList.remove('active');
  setTimeout(() => {
    container.innerHTML = '';
    activeModals = activeModals.filter(m => m !== id);
  }, 200);
};

window.confirmDialog = (title, message) => {
  return new Promise((resolve) => {
    const content = createEl('p', { textContent: message });
    openModal(content, {
      title,
      footer: [
        { label: 'Annuler', onClick: (e, close) => { close(); resolve(false); } },
        { label: 'Confirmer', primary: true, onClick: (e, close) => { close(); resolve(true); } }
      ]
    });
  });
};

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && activeModals.length > 0) {
    closeModal(activeModals[activeModals.length - 1]);
  }
});
