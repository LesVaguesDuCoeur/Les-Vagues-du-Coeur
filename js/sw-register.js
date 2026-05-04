if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
      })
      .catch(error => {
        console.warn('ServiceWorker registration failed: ', error);
      });
  });
}