window.renderScreen5 = () => {
  const content = createEl('div', { style: 'width: 100%;' }, [
    createEl('h2', { textContent: 'Envoyer des emails depuis l\'adresse officielle', style: 'text-align: center;' }),
    createEl('p', {
      textContent: 'Grâce à la délégation Gmail, chaque bénévole peut envoyer et recevoir depuis l\'adresse de son pôle directement depuis sa boîte Gmail personnelle. Aucun changement de compte.',
      style: 'text-align: center; max-width: 800px; margin: 0 auto 40px;'
    }),

    createEl('div', { style: 'display: flex; justify-content: center; align-items: center; gap: 32px; margin-bottom: 48px; flex-wrap: wrap;' }, [
      createEl('div', { className: 'card', style: 'text-align: center; width: 200px;' }, [
        createEl('i', { className: 'fa-regular fa-user', style: 'font-size: 32px; color: var(--color-trust-blue); margin-bottom: 16px;' }),
        createEl('div', { textContent: 'yasmine.aouf@gmail.com', style: 'font-size: 14px; word-break: break-all;' })
      ]),
      createEl('div', { style: 'animation: pulse 2s infinite; color: var(--color-brand-primary); font-size: 24px;' }, [
        createEl('i', { className: 'fa-solid fa-link' })
      ]),
      createEl('div', { className: 'card', style: 'text-align: center; width: 200px; background: var(--color-bg-secondary);' }, [
        createEl('i', { className: 'fa-solid fa-bullhorn', style: 'font-size: 32px; color: var(--color-brand-primary); margin-bottom: 16px;' }),
        createEl('div', { textContent: 'communication@enfaimsansfil.org', style: 'font-size: 14px; word-break: break-all;' })
      ])
    ]),

    createEl('div', { style: 'display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 24px; margin-bottom: 40px;' }, [
      { icon: 'fa-cogs', text: 'L\'administrateur configure la délégation dans les paramètres Gmail du compte officiel et ajoute l\'adresse du bénévole.' },
      { icon: 'fa-envelope-open-text', text: 'Le bénévole reçoit une invitation qu\'il accepte en un clic.' },
      { icon: 'fa-paper-plane', text: 'Dans sa boîte Gmail, il bascule entre son adresse perso et l\'adresse officielle via le sélecteur "De :".' }
    ].map(item => createEl('div', { className: 'card', style: 'display: flex; flex-direction: column; align-items: center; text-align: center; gap: 16px;' }, [
      createEl('i', { className: `fa-solid ${item.icon}`, style: 'font-size: 32px; color: var(--color-brand-secondary);' }),
      createEl('p', { textContent: item.text, style: 'margin: 0;' })
    ]))),

    createEl('div', { style: 'background: #FEF2F2; border: 1px solid #FECACA; border-radius: var(--radius-lg); padding: 16px; display: flex; align-items: flex-start; gap: 16px;' }, [
      createEl('i', { className: 'fa-solid fa-triangle-exclamation', style: 'color: var(--color-error); font-size: 24px;' }),
      createEl('p', {
        textContent: 'La délégation Gmail ne coûte rien, est réversible à tout moment et ne donne pas accès aux mots de passe des comptes officiels.',
        style: 'margin: 0; font-weight: 500; color: #991B1B;'
      })
    ])
  ]);

  return Promise.resolve(content);
};
