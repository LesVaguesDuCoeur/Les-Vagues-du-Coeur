window.setupNavigation = () => {
  const titles = [
    "Accueil", "Avant / Après", "Drive Simulé", "Les Pôles",
    "Emails", "Google Chat", "Étapes", "Bilan"
  ];

  const progressContainer = document.getElementById('progress-bar-container');
  if (progressContainer) {
    progressContainer.innerHTML = '';
    for (let i = 1; i <= Router.totalScreens; i++) {
      const segment = createEl('div', {
        className: 'progress-segment',
        'data-tooltip': titles[i-1],
        role: 'button',
        'aria-label': `Aller à l'écran ${i}: ${titles[i-1]}`,
        tabindex: 0,
        onClick: () => Router.goTo(i),
        onKeydown: (e) => { if (e.key === 'Enter' || e.key === ' ') Router.goTo(i); }
      });
      progressContainer.appendChild(segment);
    }
  }

  document.getElementById('prev-btn')?.addEventListener('click', () => Router.prev());
  document.getElementById('next-btn')?.addEventListener('click', () => Router.next());

  document.addEventListener('keydown', (e) => {
    const tag = document.activeElement?.tagName.toLowerCase();
    if (tag === 'input' || tag === 'textarea') return;

    if (e.key === 'ArrowRight') Router.next();
    if (e.key === 'ArrowLeft') Router.prev();
    if (e.key === 'Home') Router.goTo(1);
    if (e.key === 'End') Router.goTo(Router.totalScreens);

    const num = parseInt(e.key);
    if (!isNaN(num) && num >= 1 && num <= Router.totalScreens) {
      Router.goTo(num);
    }

    if (e.key === 'f' || e.key === 'F') {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
      } else {
        document.exitFullscreen();
      }
    }
  });

  const mainContent = document.getElementById('main-content');
  if (mainContent) {
    window.onSwipe(mainContent, {
      left: () => {
        if (Router.currentScreen !== 3) Router.next();
      },
      right: () => {
        if (Router.currentScreen !== 3) Router.prev();
      }
    });
  }
};
