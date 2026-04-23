window.renderScreen2 = () => {
  const content = createEl('div', { style: 'width: 100%;' }, [
    createEl('h2', { textContent: 'Où sont les fichiers aujourd\'hui ?', style: 'text-align: center;' }),

    createEl('div', { className: 'chaos-animation' }, [
      createEl('div', { className: 'chaos-center', textContent: 'Patrimoine de l\'association' }),
      ...['WhatsApp', 'Drives personnels', 'Trello', 'Notion', 'Pièces jointes email', 'Notes locales'].map((text, i) => {
        const angle = (i / 6) * Math.PI * 2;
        const radius = 120;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        return createEl('div', {
          className: 'chaos-bubble',
          textContent: text,
          style: `transform: translate(${x}px, ${y}px); animation-delay: ${i * 0.5}s;`
        });
      })
    ]),

    createEl('p', {
      textContent: 'Les documents importants sont dispersés sur de multiples plateformes privées, rendant la collaboration difficile et risquant la perte d\'informations au départ d\'un bénévole.',
      style: 'text-align: center; max-width: 800px; margin: 0 auto 40px;'
    }),

    createEl('h2', { textContent: 'Avant vs Après', style: 'text-align: center;' }),

    createEl('div', { className: 'before-after-grid' }, [
      createEl('div', { className: 'ba-column before' }, [
        createEl('h3', { textContent: 'Avant', style: 'color: var(--color-error); margin-bottom: 24px; display: flex; align-items: center; gap: 8px;' }, [
          createEl('i', { className: 'fa-solid fa-xmark' })
        ]),
        ...[
          'Fichiers dispersés sur 5 outils différents',
          'Partage manuel fichier par fichier',
          'Nouveau bénévole = tout à reconfigurer',
          'Départ d\'un bénévole = fichiers perdus',
          'Confidentialité entre pôles difficile',
          'Outils externes payants ou risqués'
        ].map(t => createEl('div', { className: 'ba-item' }, [
          createEl('i', { className: 'fa-solid fa-xmark', style: 'color: var(--color-error); margin-top: 4px;' }),
          createEl('span', { textContent: t })
        ]))
      ]),
      createEl('div', { className: 'ba-column after' }, [
        createEl('h3', { textContent: 'Après', style: 'color: var(--color-success); margin-bottom: 24px; display: flex; align-items: center; gap: 8px;' }, [
          createEl('i', { className: 'fa-solid fa-check' })
        ]),
        ...[
          'Tout centralisé sur Google Drive',
          'Partage automatique par groupe email de pôle',
          'Ajout au groupe = accès instantané',
          'Patrimoine numérique conservé',
          'Cloisonnement natif par dossier',
          '100 % Google Workspace, 0 € supplémentaire'
        ].map(t => createEl('div', { className: 'ba-item' }, [
          createEl('i', { className: 'fa-solid fa-check', style: 'color: var(--color-success); margin-top: 4px;' }),
          createEl('span', { textContent: t })
        ]))
      ])
    ])
  ]);

  return Promise.resolve(content);
};
