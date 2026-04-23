window.$ = (selector, parent = document) => parent.querySelector(selector);
window.$$ = (selector, parent = document) => Array.from(parent.querySelectorAll(selector));

window.createEl = (tag, props = {}, children = []) => {
  const el = document.createElement(tag);
  Object.entries(props).forEach(([key, value]) => {
    if (key === 'className') {
      el.className = value;
    } else if (key === 'dataset') {
      Object.entries(value).forEach(([dataKey, dataVal]) => {
        el.dataset[dataKey] = dataVal;
      });
    } else if (key.startsWith('on') && typeof value === 'function') {
      el.addEventListener(key.substring(2).toLowerCase(), value);
    } else if (key === 'textContent' || key === 'innerHTML') {
      el[key] = value;
    } else {
      el.setAttribute(key, value);
    }
  });
  children.forEach(child => {
    if (child instanceof Node) {
      el.appendChild(child);
    } else if (typeof child === 'string' || typeof child === 'number') {
      el.appendChild(document.createTextNode(String(child)));
    }
  });
  return el;
};

window.sanitizeHTML = (str) => {
  const temp = document.createElement('div');
  temp.textContent = str;
  return temp.innerHTML;
};

window.debounce = (fn, delay) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), delay);
  };
};

window.throttle = (fn, delay) => {
  let lastCall = 0;
  return (...args) => {
    const now = new Date().getTime();
    if (now - lastCall < delay) return;
    lastCall = now;
    return fn(...args);
  };
};

window.copyToClipboard = async (text) => {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
    } else {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "absolute";
      textArea.style.left = "-999999px";
      document.body.prepend(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
      } finally {
        textArea.remove();
      }
    }
    return true;
  } catch (err) {
    console.error(err);
    return false;
  }
};

window.formatDate = (date, format = 'short') => {
  const options = format === 'short' ? { day: '2-digit', month: '2-digit', year: 'numeric' } : { dateStyle: 'long' };
  return new Intl.DateTimeFormat('fr-FR', options).format(date);
};

window.announce = (message) => {
  const announcer = document.getElementById('a11y-announcer');
  if (announcer) {
    announcer.textContent = message;
    setTimeout(() => { announcer.textContent = ''; }, 1000);
  }
};

window.trapFocus = (element) => {
  const focusableEls = element.querySelectorAll('a[href]:not([disabled]), button:not([disabled]), textarea:not([disabled]), input[type="text"]:not([disabled]), input[type="radio"]:not([disabled]), input[type="checkbox"]:not([disabled]), select:not([disabled])');
  const firstFocusableEl = focusableEls[0];
  const lastFocusableEl = focusableEls[focusableEls.length - 1];

  element.addEventListener('keydown', function(e) {
    const isTabPressed = (e.key === 'Tab' || e.keyCode === 9);
    if (!isTabPressed) return;
    if (e.shiftKey) {
      if (document.activeElement === firstFocusableEl) {
        lastFocusableEl.focus();
        e.preventDefault();
      }
    } else {
      if (document.activeElement === lastFocusableEl) {
        firstFocusableEl.focus();
        e.preventDefault();
      }
    }
  });

  if (firstFocusableEl) {
    firstFocusableEl.focus();
  }
};

window.onSwipe = (el, handlers) => {
  let touchstartX = 0;
  let touchendX = 0;

  el.addEventListener('touchstart', e => {
    touchstartX = e.changedTouches[0].screenX;
  }, { passive: true });

  el.addEventListener('touchend', e => {
    touchendX = e.changedTouches[0].screenX;
    handleSwipe();
  }, { passive: true });

  function handleSwipe() {
    if (touchendX < touchstartX - 50 && handlers.left) handlers.left();
    if (touchendX > touchstartX + 50 && handlers.right) handlers.right();
  }
};
