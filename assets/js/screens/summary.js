window.renderScreen8 = () => {
  const content = createEl('div', { style: 'width: 100%; text-align: center;' }, [
    createEl('h2', { textContent: 'Bilan de la proposition', style: 'margin-bottom: 40px;' }),

    createEl('div', { className: 'summary-stats' }, [
      createEl('div', { className: 'card stat-card' }, [
        createEl('i', { className: 'fa-solid fa-piggy-bank stat-icon' }),
        createEl('h3', { textContent: 'Coût' }),
        createEl('p', { textContent: '0 €', style: 'font-size: 24px; font-weight: bold; color: var(--color-success); margin: 8px 0;' }),
        createEl('p', { textContent: 'Inclus dans l\'abonnement Workspace existant', style: 'font-size: 14px; margin: 0;' })
      ]),
      createEl('div', { className: 'card stat-card' }, [
        createEl('i', { className: 'fa-solid fa-stopwatch stat-icon' }),
        createEl('h3', { textContent: 'Durée de mise en place' }),
        createEl('p', { textContent: '2 à 3 heures', style: 'font-size: 24px; font-weight: bold; color: var(--color-info); margin: 8px 0;' }),
        createEl('p', { textContent: 'Une transition rapide et accompagnée', style: 'font-size: 14px; margin: 0;' })
      ]),
      createEl('div', { className: 'card stat-card' }, [
        createEl('i', { className: 'fa-solid fa-chart-line stat-icon' }),
        createEl('h3', { textContent: 'Gain immédiat' }),
        createEl('p', { textContent: 'Sécurité & Fluidité', style: 'font-size: 20px; font-weight: bold; color: var(--color-brand-primary); margin: 8px 0;' }),
        createEl('p', { textContent: 'Onboarding automatique, patrimoine sécurisé', style: 'font-size: 14px; margin: 0;' })
      ])
    ]),

    createEl('div', { style: 'margin: 60px auto 40px; max-width: 600px;' }, [
      createEl('h3', { textContent: 'Merci de votre attention', style: 'margin-bottom: 16px;' }),
      createEl('p', { textContent: 'Cette organisation vous permettra de gagner du temps, de sécuriser vos données et de faciliter l\'intégration de chaque nouveau bénévole.' }),
      createEl('div', { style: 'margin-top: 32px; display: flex; justify-content: center;' }, [
        createEl('img', {
          src: '/assets/img/logo.png',
          alt: 'Logo En Faim Sans Fil',
          style: 'max-height: 80px;',
          onError: (e) => e.target.style.display = 'none'
        })
      ])
    ]),

    createEl('button', {
      className: 'btn btn-primary',
      textContent: 'Revenir au début',
      onClick: () => Router.goTo(1)
    }),

    createEl('p', {
      textContent: 'Les prénoms de bénévoles utilisés dans cette présentation sont fictifs et à remplacer avant toute présentation officielle.',
      style: 'font-size: 12px; color: var(--color-text-tertiary); margin-top: 60px;'
    })
  ]);

  return Promise.resolve(content);
};
