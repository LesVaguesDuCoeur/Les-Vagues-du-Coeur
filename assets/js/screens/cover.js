window.renderScreen1 = () => {
  const container = document.createDocumentFragment();

  const content = createEl('div', { className: 'screen-cover', style: 'display: flex; flex-direction: column;' }, [
    createEl('img', {
      src: '/assets/img/logo.png',
      alt: 'Logo En Faim Sans Fil',
      className: 'cover-logo',
      onError: (e) => {
        const span = createEl('span', {
          textContent: 'En Faim Sans Fil',
          style: 'font-size: 32px; font-weight: bold; color: var(--color-brand-primary); margin-bottom: 24px;'
        });
        e.target.parentNode.replaceChild(span, e.target);
      }
    }),
    createEl('h1', { textContent: 'Réorganiser le Drive partagé', style: 'margin-bottom: 16px;' }),
    createEl('p', {
      textContent: 'Une proposition d\'organisation gratuite, sécurisée et évolutive pour tous les pôles.',
      style: 'font-size: 18px; max-width: 600px; margin: 0 auto;'
    }),

    createEl('div', { className: 'cover-features' }, [
      { icon: 'fa-lock', text: 'Accès sécurisé par pôle' },
      { icon: 'fa-users', text: 'Collaboration fluide' },
      { icon: 'fa-piggy-bank', text: 'Zéro outil externe' },
      { icon: 'fa-rocket', text: 'Accueil automatique des nouveaux bénévoles' }
    ].map((f, i) => createEl('div', {
      className: 'card',
      style: `animation: screenEnter 0.35s ${i * 0.1}s backwards; display: flex; align-items: center; gap: 16px;`
    }, [
      createEl('i', { className: `fa-solid ${f.icon}`, style: 'font-size: 24px; color: var(--color-brand-primary);' }),
      createEl('span', { textContent: f.text, style: 'font-weight: 500;' })
    ]))),

    createEl('button', {
      className: 'btn btn-primary',
      textContent: 'Commencer la présentation',
      onClick: () => Router.next()
    }),

    createEl('p', {
      textContent: 'Naviguez avec les flèches ← → ou cliquez sur la barre de progression.',
      style: 'font-size: 14px; color: var(--color-text-tertiary); margin-top: 32px;'
    })
  ]);

  container.appendChild(content);
  return Promise.resolve(content);
};
