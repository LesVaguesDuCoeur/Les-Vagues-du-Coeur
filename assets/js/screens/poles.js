window.renderScreen4 = () => {
  const content = createEl('div', { style: 'width: 100%;' }, [
    createEl('h2', { textContent: 'Les 11 pôles et leurs adresses officielles', style: 'text-align: center; margin-bottom: 16px;' }),
    createEl('p', {
      textContent: 'Chaque dossier est partagé avec l\'adresse de son pôle. Un nouveau bénévole ajouté au groupe accède automatiquement aux fichiers.',
      style: 'text-align: center; max-width: 800px; margin: 0 auto 32px;'
    }),

    createEl('div', {
      style: 'background: var(--color-bg-secondary); border: 1px solid var(--color-brand-secondary); border-radius: var(--radius-lg); padding: 16px; margin-bottom: 32px; display: flex; align-items: flex-start; gap: 16px;'
    }, [
      createEl('i', { className: 'fa-solid fa-lightbulb', style: 'color: var(--color-brand-secondary); font-size: 24px;' }),
      createEl('p', {
        textContent: 'Le principe clé : partager le dossier avec le groupe email du pôle = tout membre ajouté au groupe accède automatiquement. Aucun partage manuel individuel.',
        style: 'margin: 0; font-weight: 500;'
      })
    ]),

    createEl('div', { className: 'poles-grid' }, AppData.POLES.map(pole => {
      const emailEl = createEl('div', {
        className: 'pole-email',
        role: 'button',
        tabindex: 0,
        'aria-label': `Copier l'adresse email de ${pole.name}`,
        onClick: () => {
          copyToClipboard(pole.email).then(success => {
            if (success) showToast('Adresse copiée', 'success');
          });
        },
        onKeydown: (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            copyToClipboard(pole.email).then(success => {
              if (success) showToast('Adresse copiée', 'success');
            });
          }
        }
      }, [
        createEl('span', { textContent: pole.email }),
        createEl('i', { className: 'fa-regular fa-copy', style: 'margin-left: 8px;' })
      ]);

      return createEl('div', { className: 'card pole-card' }, [
        createEl('i', { className: `fa-solid ${pole.icon} pole-icon` }),
        createEl('h3', { textContent: pole.name }),
        emailEl,
        createEl('div', { className: 'badge badge-info', style: 'margin-top: 8px;' }, [
          createEl('i', { className: 'fa-solid fa-shield-halved', style: 'margin-right: 4px;' }),
          createEl('span', { textContent: 'Accès Éditeur' })
        ])
      ]);
    }))
  ]);

  return Promise.resolve(content);
};
