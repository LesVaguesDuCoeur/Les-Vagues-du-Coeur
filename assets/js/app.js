document.addEventListener('DOMContentLoaded', () => {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch(error => {
        console.error(error);
      });
    });
  }

  Router.register(1, window.renderScreen1);
  Router.register(2, window.renderScreen2);
  Router.register(3, window.renderScreen3);
  Router.register(4, window.renderScreen4);
  Router.register(5, window.renderScreen5);
  Router.register(6, window.renderScreen6);
  Router.register(7, window.renderScreen7);
  Router.register(8, window.renderScreen8);

  Router.init();
  setupNavigation();

  window.addEventListener('error', (e) => {
    console.error(e);
    showToast('Une erreur est survenue.', 'error');
  });

  window.addEventListener('unhandledrejection', (e) => {
    console.error(e);
    showToast('Une erreur est survenue.', 'error');
  });
});
