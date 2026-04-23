window.renderScreen3 = () => {
  const content = createEl('div', { className: 'drive-app' });

  const banner = createEl('div', { className: 'drive-demo-banner' }, [
    createEl('div', { style: 'display: flex; align-items: center; gap: 12px;' }, [
      createEl('i', { className: 'fa-regular fa-lightbulb', style: 'color: #1A73E8;' }),
      createEl('span', { textContent: 'Démo interactive — cliquez sur les dossiers et testez le bouton Partager pour voir comment fonctionnerait l\'organisation réelle.', style: 'color: #1A73E8; font-weight: 500;' })
    ]),
    createEl('button', {
      className: 'icon-btn',
      onClick: (e) => e.target.closest('.drive-demo-banner').style.display = 'none'
    }, [createEl('i', { className: 'fa-solid fa-xmark', style: 'color: #1A73E8;' })])
  ]);
  content.appendChild(banner);

  const header = createEl('header', { className: 'drive-header' }, [
    createEl('div', { className: 'drive-logo-area' }, [
      createEl('button', { className: 'icon-btn', id: 'drive-menu-btn', onClick: toggleSidebar }, [
        createEl('span', { className: 'material-symbols-outlined', textContent: 'menu' })
      ]),
      createEl('svg', { viewBox: '0 0 40 40', style: 'width: 40px; height: 40px;' }, [
        createEl('path', { d: 'M13.1,29.3l-6.4-11L18,29.3H13.1z', fill: '#0F9D58' }),
        createEl('path', { d: 'M6.7,18.3h9.8L21.4,2h-9.8L6.7,18.3z', fill: '#FFC107' }),
        createEl('path', { d: 'M21.4,2l6.4,11L23,29.3H33l-6.4-11L21.4,2z', fill: '#4285F4' })
      ]),
      createEl('span', { className: 'drive-logo-text', textContent: 'Drive' })
    ]),
    createEl('div', { className: 'drive-search-area' }, [
      createEl('div', { className: 'drive-search' }, [
        createEl('span', { className: 'material-symbols-outlined', style: 'color: var(--color-drive-icon);', textContent: 'search' }),
        createEl('input', { type: 'text', placeholder: 'Rechercher dans Drive', onFocus: () => showToast('Recherche désactivée dans la démo', 'info') }),
        createEl('button', { className: 'icon-btn', onClick: () => showToast('Recherche désactivée dans la démo', 'info') }, [
          createEl('span', { className: 'material-symbols-outlined', textContent: 'tune' })
        ])
      ])
    ]),
    createEl('div', { className: 'drive-header-actions' }, [
      createEl('button', { className: 'icon-btn' }, [createEl('span', { className: 'material-symbols-outlined', textContent: 'help' })]),
      createEl('button', { className: 'icon-btn' }, [createEl('span', { className: 'material-symbols-outlined', textContent: 'settings' })]),
      createEl('button', { className: 'icon-btn' }, [createEl('span', { className: 'material-symbols-outlined', textContent: 'apps' })]),
      createEl('div', { style: 'width: 32px; height: 32px; border-radius: 50%; background: var(--color-trust-blue); color: white; display: flex; align-items: center; justify-content: center; font-weight: 500;' }, ['A'])
    ])
  ]);
  content.appendChild(header);

  const body = createEl('div', { className: 'drive-body' });

  const sidebar = createEl('nav', { className: 'drive-sidebar', id: 'drive-sidebar' }, [
    createEl('button', { className: 'drive-new-btn' }, [
      createEl('span', { className: 'material-symbols-outlined', style: 'color: red; font-size: 28px; margin-left: -8px;', textContent: 'add' }),
      createEl('span', { textContent: 'Nouveau' })
    ]),
    ...[
      { icon: 'home', text: 'Accueil' },
      { icon: 'add_to_drive', text: 'Mon Drive', active: true },
      { icon: 'devices', text: 'Ordinateurs' },
      { icon: 'group', text: 'Partagés avec moi' },
      { icon: 'schedule', text: 'Récents' },
      { icon: 'star', text: 'Suivis' },
      { icon: 'report', text: 'Spam' },
      { icon: 'delete', text: 'Corbeille' },
      { icon: 'cloud', text: 'Stockage' }
    ].map(item => createEl('div', { className: `drive-nav-item ${item.active ? 'active' : ''}` }, [
      createEl('span', { className: 'material-symbols-outlined', textContent: item.icon }),
      createEl('span', { textContent: item.text })
    ])),
    createEl('div', { style: 'padding: 16px 24px; margin-top: auto;' }, [
      createEl('div', { style: 'height: 4px; background: #E0E0E0; border-radius: 2px; margin-bottom: 8px;' }, [
        createEl('div', { style: 'height: 100%; width: 14%; background: var(--color-drive-active); border-radius: 2px;' })
      ]),
      createEl('div', { style: 'font-size: 13px; color: var(--color-drive-text); margin-bottom: 12px;' }, ['4,2 Go utilisés sur 30 Go']),
      createEl('button', {
        style: 'background: white; border: 1px solid var(--color-drive-border); border-radius: 4px; padding: 6px 16px; color: var(--color-drive-active); font-weight: 500; font-size: 14px; cursor: pointer;',
        onClick: () => showToast('Non disponible en démo', 'info'),
        textContent: 'Acheter plus de stockage'
      })
    ])
  ]);
  body.appendChild(sidebar);

  const main = createEl('main', { className: 'drive-main' });

  const toolbar = createEl('div', { className: 'drive-toolbar' }, [
    createEl('div', { className: 'drive-breadcrumb', id: 'drive-breadcrumb' }, [
      createEl('span', { className: 'drive-breadcrumb-item', textContent: 'Mon Drive', onClick: () => renderDriveView('root') })
    ]),
    createEl('div', { style: 'margin-left: auto; display: flex; gap: 8px;' }, [
      createEl('button', { className: 'icon-btn' }, [createEl('span', { className: 'material-symbols-outlined', textContent: 'grid_view' })]),
      createEl('button', { className: 'icon-btn', onClick: () => showToast('Panneau d\'information non disponible', 'info') }, [
        createEl('span', { className: 'material-symbols-outlined', textContent: 'info' })
      ])
    ])
  ]);
  main.appendChild(toolbar);

  const contentArea = createEl('div', { className: 'drive-content', id: 'drive-content-area' });
  main.appendChild(contentArea);

  body.appendChild(main);
  content.appendChild(body);

  let currentPath = [{ id: 'root', name: 'Mon Drive' }];

  function toggleSidebar() {
    sidebar.classList.toggle('open');
  }

  function updateBreadcrumb() {
    const breadcrumb = document.getElementById('drive-breadcrumb');
    if (!breadcrumb) return;
    breadcrumb.innerHTML = '';
    currentPath.forEach((step, index) => {
      const isLast = index === currentPath.length - 1;
      const item = createEl('span', {
        className: 'drive-breadcrumb-item',
        textContent: step.name,
        onClick: () => {
          if (!isLast) {
            currentPath = currentPath.slice(0, index + 1);
            renderDriveView(step.id);
          }
        }
      });
      breadcrumb.appendChild(item);
      if (!isLast) {
        breadcrumb.appendChild(createEl('span', { className: 'material-symbols-outlined drive-breadcrumb-separator', textContent: 'chevron_right' }));
      }
    });
  }

  function getFolderColor(colorName) {
    const colors = {
      blue: '#8AB4F8',
      yellow: '#FDE293',
      red: '#F28B82',
      gray: '#DADCE0'
    };
    return colors[colorName] || colors.gray;
  }

  function renderDriveView(viewId) {
    updateBreadcrumb();
    const area = document.getElementById('drive-content-area');
    if (!area) return;
    area.innerHTML = '';

    const grid = createEl('div', { className: 'drive-grid' });

    let itemsToRender = [];

    if (viewId === 'root') {
      itemsToRender = AppData.DRIVE.roots.map(root => ({
        ...root,
        onClick: () => handleItemClick(root)
      }));
    } else if (viewId === 'root-poles') {
      itemsToRender = AppData.POLES.map(pole => ({
        id: `pole-${pole.id}`,
        name: pole.name,
        type: 'folder',
        icon: 'folder_shared',
        color: 'blue',
        onClick: () => {
          currentPath.push({ id: `pole-${pole.id}`, name: pole.name });
          renderDriveView(`pole-${pole.id}`);
        }
      }));
    } else if (viewId === 'root-collab') {
      itemsToRender = AppData.DRIVE.mockItems.collab.map(item => ({
        ...item,
        onClick: () => showToast('Aperçu non disponible en démo', 'info')
      }));
    } else if (viewId === 'root-volunteers') {
      itemsToRender = AppData.FICTIVE_VOLUNTEERS.map(vol => ({
        id: `vol-${vol.id}`,
        name: vol.name,
        type: 'folder',
        icon: 'folder',
        color: 'gray',
        onClick: () => showToast('Accès restreint au bénévole concerné', 'error')
      }));
    } else if (viewId === 'root-admin') {
      itemsToRender = AppData.DRIVE.mockItems.admin.map(item => ({
        ...item,
        onClick: () => showToast('Aperçu non disponible en démo', 'info')
      }));
    } else if (viewId.startsWith('pole-')) {
      const poleId = viewId.replace('pole-', '');
      const items = AppData.DRIVE.mockItems[poleId] || AppData.DRIVE.mockItems.comm;
      itemsToRender = items.map(item => ({
        ...item,
        onClick: () => showToast('Aperçu non disponible en démo', 'info')
      }));
    }

    itemsToRender.forEach(item => {
      const isFolder = item.type === 'folder';
      const card = createEl('div', {
        className: 'drive-card',
        tabindex: 0,
        onClick: (e) => {
          document.querySelectorAll('.drive-card.selected').forEach(c => c.classList.remove('selected'));
          e.currentTarget.classList.add('selected');
        },
        onDblclick: item.onClick,
        onKeydown: (e) => {
          if (e.key === 'Enter') item.onClick();
        },
        onContextmenu: (e) => {
          e.preventDefault();
          document.querySelectorAll('.drive-card.selected').forEach(c => c.classList.remove('selected'));
          e.currentTarget.classList.add('selected');
          showContextMenu(e.clientX, e.clientY, item);
        }
      }, [
        createEl('div', { className: 'drive-card-icon' }, [
          createEl('span', {
            className: `material-symbols-outlined ${isFolder ? 'folder-icon' : ''}`,
            style: isFolder ? `color: ${getFolderColor(item.color)};` : '',
            textContent: item.icon
          })
        ]),
        createEl('div', { className: 'drive-card-name' }, [item.name])
      ]);
      grid.appendChild(card);
    });

    area.appendChild(grid);
  }

  function handleItemClick(item) {
    if (item.access === 'bureau') {
      showToast('Accès restreint au Bureau', 'error');
      return;
    }
    currentPath.push({ id: item.id, name: item.name });
    renderDriveView(item.id);
  }

  function showContextMenu(x, y, item) {
    const existing = document.getElementById('drive-context-menu');
    if (existing) existing.remove();

    const menu = createEl('div', { className: 'context-menu', id: 'drive-context-menu', style: `left: ${x}px; top: ${y}px;` }, [
      { icon: 'open_in_new', label: 'Ouvrir', action: () => showToast('Aperçu non disponible', 'info') },
      { icon: 'person_add', label: 'Partager', action: () => openShareModal(item) },
      { icon: 'link', label: 'Obtenir le lien', action: () => { showToast('Lien copié dans le presse-papier (démo)', 'success'); } },
      { icon: 'drive_file_move', label: 'Organiser', action: () => showToast('Non disponible', 'info') },
      { icon: 'info', label: 'Informations', action: () => showToast('Non disponible', 'info') },
      { icon: 'delete', label: 'Supprimer', action: () => showToast('Non disponible', 'info') }
    ].map(mi => createEl('div', {
      className: 'context-menu-item',
      onClick: () => {
        menu.remove();
        mi.action();
      }
    }, [
      createEl('span', { className: 'material-symbols-outlined', textContent: mi.icon, style: 'color: var(--color-drive-icon);' }),
      createEl('span', { textContent: mi.label })
    ])));

    document.body.appendChild(menu);

    const rect = menu.getBoundingClientRect();
    if (rect.right > window.innerWidth) menu.style.left = `${window.innerWidth - rect.width - 8}px`;
    if (rect.bottom > window.innerHeight) menu.style.top = `${window.innerHeight - rect.height - 8}px`;

    const closeMenu = (e) => {
      if (!menu.contains(e.target)) {
        menu.remove();
        document.removeEventListener('click', closeMenu);
        document.removeEventListener('contextmenu', closeMenu);
      }
    };

    setTimeout(() => {
      document.addEventListener('click', closeMenu);
      document.addEventListener('contextmenu', closeMenu);
    }, 0);
  }

  function openShareModal(item) {
    let accessEmail = 'groupe@enfaimsansfil.org';
    if (item.name === 'Pôles' || currentPath.some(p => p.id === 'root-poles')) {
      const pole = AppData.POLES.find(p => p.name === item.name);
      if (pole) accessEmail = pole.email;
    } else if (item.name === 'Espace Collaboratif') {
      accessEmail = 'tous@enfaimsansfil.org';
    }

    const content = createEl('div', {}, [
      createEl('div', { className: 'share-input-area' }, [
        createEl('div', { className: 'share-input-box' }, [
          createEl('span', { className: 'material-symbols-outlined', style: 'color: var(--color-drive-icon);', textContent: 'person_add' }),
          createEl('input', { type: 'text', placeholder: 'Ajouter des personnes, des groupes et des événements...' })
        ])
      ]),
      createEl('h4', { textContent: 'Personnes ayant accès', style: 'margin-bottom: 16px; font-size: 14px; font-weight: 500;' }),
      createEl('div', { className: 'share-list-item' }, [
        createEl('div', { className: 'share-avatar' }, ['A']),
        createEl('div', { style: 'flex: 1;' }, [
          createEl('div', { textContent: 'Admin (vous)', style: 'font-weight: 500; font-size: 14px;' }),
          createEl('div', { textContent: 'admin@enfaimsansfil.org', style: 'font-size: 12px; color: var(--color-drive-icon);' })
        ]),
        createEl('div', { style: 'color: var(--color-drive-icon); font-size: 14px;' }, ['Propriétaire'])
      ]),
      createEl('div', { className: 'share-list-item' }, [
        createEl('div', { className: 'share-avatar', style: 'background: var(--color-brand-secondary);' }, [
          createEl('span', { className: 'material-symbols-outlined', style: 'font-size: 18px;', textContent: 'group' })
        ]),
        createEl('div', { style: 'flex: 1;' }, [
          createEl('div', { textContent: `Groupe ${item.name}`, style: 'font-weight: 500; font-size: 14px;' }),
          createEl('div', { textContent: accessEmail, style: 'font-size: 12px; color: var(--color-drive-icon);' })
        ]),
        createEl('select', { style: 'border: none; background: transparent; color: var(--color-drive-icon); font-size: 14px; outline: none; cursor: pointer;' }, [
          createEl('option', { value: 'editor', textContent: 'Éditeur', selected: true }),
          createEl('option', { value: 'commenter', textContent: 'Commentateur' }),
          createEl('option', { value: 'reader', textContent: 'Lecteur' })
        ])
      ]),
      createEl('h4', { textContent: 'Accès général', style: 'margin: 24px 0 16px; font-size: 14px; font-weight: 500;' }),
      createEl('div', { className: 'share-list-item' }, [
        createEl('div', { style: 'width: 32px; height: 32px; border-radius: 50%; background: #F1F3F4; display: flex; align-items: center; justify-content: center;' }, [
          createEl('span', { className: 'material-symbols-outlined', style: 'font-size: 18px; color: var(--color-drive-icon);', textContent: 'lock' })
        ]),
        createEl('div', { style: 'flex: 1;' }, [
          createEl('select', { style: 'border: none; background: transparent; font-weight: 500; font-size: 14px; outline: none; cursor: pointer; padding: 0;' }, [
            createEl('option', { value: 'restricted', textContent: 'Limité', selected: true }),
            createEl('option', { value: 'anyone', textContent: 'Tous les utilisateurs disposant du lien' })
          ]),
          createEl('div', { textContent: 'Seules les personnes ayant accès peuvent ouvrir avec le lien', style: 'font-size: 12px; color: var(--color-drive-icon);' })
        ])
      ])
    ]);

    const titleDiv = createEl('div', { style: 'display: flex; align-items: center; gap: 12px;' }, [
      createEl('span', { className: 'material-symbols-outlined', textContent: item.type === 'folder' ? 'folder' : 'description' }),
      createEl('span', { textContent: `Partager « ${item.name} »` })
    ]);

    const modalId = openModal(content, {
      title: titleDiv,
      footer: [
        { label: '🔗 Copier le lien', onClick: (e) => { e.preventDefault(); showToast('Lien copié dans le presse-papier (démo)', 'success'); } },
        { label: 'OK', primary: true, onClick: (e, close) => { close(); showToast('Modifications enregistrées (démo)', 'success'); } }
      ]
    });

    const header = document.querySelector(`#${modalId} .modal-header`);
    if (header) {
      const settingsBtn = createEl('button', {
        className: 'icon-btn',
        style: 'margin-left: auto; margin-right: 8px;',
        onClick: openSettingsModal
      }, [createEl('span', { className: 'material-symbols-outlined', textContent: 'settings' })]);
      header.insertBefore(settingsBtn, header.lastChild);
    }
  }

  function openSettingsModal() {
    const content = createEl('div', {}, [
      createEl('div', { style: 'margin-bottom: 16px; display: flex; align-items: flex-start; gap: 12px;' }, [
        createEl('input', { type: 'checkbox', id: 'setting1', checked: true, style: 'margin-top: 4px;' }),
        createEl('label', { htmlFor: 'setting1', textContent: 'Les éditeurs peuvent modifier les autorisations et partager.' })
      ]),
      createEl('div', { style: 'display: flex; align-items: flex-start; gap: 12px;' }, [
        createEl('input', { type: 'checkbox', id: 'setting2', checked: true, style: 'margin-top: 4px;' }),
        createEl('label', { htmlFor: 'setting2', textContent: 'Les lecteurs et les commentateurs peuvent voir l\'option de téléchargement et d\'impression.' })
      ])
    ]);
    openModal(content, {
      title: 'Paramètres',
      footer: [{ label: 'OK', primary: true, onClick: (e, close) => close() }]
    });
  }

  setTimeout(() => renderDriveView('root'), 0);

  return Promise.resolve(content);
};
