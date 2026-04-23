window.renderScreen6 = () => {
  const content = createEl('div', { style: 'width: 100%;' }, [
    createEl('h2', { textContent: 'Google Chat remplace WhatsApp', style: 'text-align: center;' }),
    createEl('p', {
      textContent: 'Pour les échanges rapides entre bénévoles, Google Chat est l\'outil adapté à une association.',
      style: 'text-align: center; max-width: 800px; margin: 0 auto 40px;'
    }),

    createEl('div', { style: 'display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 32px;' }, [
      createEl('div', { className: 'card' }, [
        createEl('table', { style: 'width: 100%; border-collapse: collapse;' }, [
          createEl('thead', {}, [
            createEl('tr', {}, [
              createEl('th', { style: 'text-align: left; padding: 12px; border-bottom: 2px solid var(--color-border);' }, ['Fonctionnalité']),
              createEl('th', { style: 'text-align: center; padding: 12px; border-bottom: 2px solid var(--color-border); width: 80px;' }, ['WhatsApp']),
              createEl('th', { style: 'text-align: center; padding: 12px; border-bottom: 2px solid var(--color-border); width: 80px;' }, ['Google Chat'])
            ])
          ]),
          createEl('tbody', {}, [
            ['Séparation vie perso / asso', false, true],
            ['Intégré à Drive, Meet', false, true],
            ['Historique accessible à l\'admin', false, true],
            ['Fichiers conservés au départ', false, true],
            ['Coût', 'Gratuit', 'Inclus Workspace']
          ].map(row => createEl('tr', { style: 'border-bottom: 1px solid var(--color-border);' }, [
            createEl('td', { style: 'padding: 12px;' }, [row[0]]),
            createEl('td', { style: 'text-align: center; padding: 12px;' }, [
              typeof row[1] === 'boolean'
                ? createEl('i', { className: row[1] ? 'fa-solid fa-check text-success' : 'fa-solid fa-xmark text-error', style: row[1] ? 'color: var(--color-success);' : 'color: var(--color-error);' })
                : createEl('span', { textContent: row[1], style: 'font-size: 14px;' })
            ]),
            createEl('td', { style: 'text-align: center; padding: 12px;' }, [
              typeof row[2] === 'boolean'
                ? createEl('i', { className: row[2] ? 'fa-solid fa-check text-success' : 'fa-solid fa-xmark text-error', style: row[2] ? 'color: var(--color-success);' : 'color: var(--color-error);' })
                : createEl('span', { textContent: row[2], style: 'font-size: 14px;' })
            ])
          ])))
        ])
      ]),

      createEl('div', { className: 'card', style: 'background: var(--color-bg-secondary);' }, [
        createEl('h3', { textContent: 'Avantages clés', style: 'margin-bottom: 24px;' }),
        createEl('ul', { style: 'display: flex; flex-direction: column; gap: 16px;' }, [
          { icon: 'fa-layer-group', text: 'Espaces par pôle' },
          { icon: 'fa-comments', text: 'Conversations directes' },
          { icon: 'fa-share-nodes', text: 'Partage Drive en un clic' },
          { icon: 'fa-video', text: 'Visio Meet intégrée' },
          { icon: 'fa-bell', text: 'Notifications paramétrables' }
        ].map(item => createEl('li', { style: 'display: flex; align-items: center; gap: 12px;' }, [
          createEl('i', { className: `fa-solid ${item.icon}`, style: 'color: var(--color-brand-primary); width: 24px; text-align: center;' }),
          createEl('span', { textContent: item.text })
        ])))
      ])
    ])
  ]);

  return Promise.resolve(content);
};
