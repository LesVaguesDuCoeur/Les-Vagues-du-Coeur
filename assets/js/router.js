window.Router = {
  currentScreen: 1,
  totalScreens: 8,
  screens: {},
  isTransitioning: false,

  init() {
    this.parseHash();
    window.addEventListener('hashchange', () => this.parseHash());
    this.renderScreen(this.currentScreen);
    this.updateUI();
  },

  register(id, renderer) {
    this.screens[id] = renderer;
  },

  parseHash() {
    const hash = window.location.hash.replace('#', '');
    const num = parseInt(hash, 10);
    if (!isNaN(num) && num >= 1 && num <= this.totalScreens) {
      if (this.currentScreen !== num) {
        this.goTo(num);
      }
    } else {
      window.location.hash = `#${this.currentScreen}`;
    }
  },

  async goTo(num) {
    if (this.isTransitioning || num === this.currentScreen || num < 1 || num > this.totalScreens) return;
    this.isTransitioning = true;

    const oldScreenEl = document.getElementById(`screen-${this.currentScreen}`);
    if (oldScreenEl) {
      oldScreenEl.classList.remove('active');
    }

    this.currentScreen = num;
    window.location.hash = `#${num}`;

    await this.renderScreen(num);

    this.updateUI();
    setTimeout(() => { this.isTransitioning = false; }, 350);
  },

  async renderScreen(num) {
    const main = document.getElementById('main-content');
    let screenEl = document.getElementById(`screen-${num}`);

    if (!screenEl) {
      screenEl = createEl('div', {
        className: 'screen container',
        id: `screen-${num}`
      });
      main.appendChild(screenEl);

      if (this.screens[num]) {
        try {
          const content = await this.screens[num]();
          screenEl.appendChild(content);
        } catch (e) {
          console.error(e);
          screenEl.appendChild(createEl('p', { textContent: "Erreur de chargement de l'écran." }));
        }
      }
    }

    screenEl.classList.add('active');
    document.getElementById('screen-counter').textContent = `${num} / ${this.totalScreens}`;
    window.announce(`Écran ${num} sur ${this.totalScreens}`);

    setTimeout(() => {
      const firstFocusable = screenEl.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
      if (firstFocusable) firstFocusable.focus({ preventScroll: true });
    }, 100);
  },

  updateUI() {
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');

    if (prevBtn) prevBtn.style.visibility = this.currentScreen === 1 ? 'hidden' : 'visible';
    if (nextBtn) nextBtn.style.visibility = this.currentScreen === this.totalScreens ? 'hidden' : 'visible';

    const segments = document.querySelectorAll('.progress-segment');
    segments.forEach((seg, idx) => {
      const step = idx + 1;
      seg.classList.remove('active', 'past');
      if (step === this.currentScreen) {
        seg.classList.add('active');
      } else if (step < this.currentScreen) {
        seg.classList.add('past');
      }
    });

    const progressContainer = document.getElementById('progress-bar-container');
    if (progressContainer) {
      progressContainer.setAttribute('aria-valuenow', this.currentScreen);
    }
  },

  next() { this.goTo(this.currentScreen + 1); },
  prev() { this.goTo(this.currentScreen - 1); }
};
