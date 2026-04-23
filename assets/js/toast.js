window.showToast = (message, type = 'info') => {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = createEl('div', {
    className: `toast ${type}`,
    role: 'alert',
    'aria-live': 'assertive'
  }, [
    createEl('i', { className: getToastIcon(type) }),
    createEl('span', { textContent: message })
  ]);

  container.appendChild(toast);
  window.announce(message);

  if (container.children.length > 3) {
    container.removeChild(container.firstChild);
  }

  let isRemoving = false;
  const removeToast = () => {
    if (isRemoving) return;
    isRemoving = true;
    toast.style.animation = 'toastEnter 0.3s reverse forwards';
    setTimeout(() => {
      if (container.contains(toast)) {
        container.removeChild(toast);
      }
    }, 300);
  };

  setTimeout(removeToast, 3500);

  window.onSwipe(toast, {
    left: removeToast,
    right: removeToast
  });
};

function getToastIcon(type) {
  switch (type) {
    case 'success': return 'fa-solid fa-check-circle';
    case 'error': return 'fa-solid fa-exclamation-circle';
    case 'warning': return 'fa-solid fa-exclamation-triangle';
    default: return 'fa-solid fa-info-circle';
  }
}
