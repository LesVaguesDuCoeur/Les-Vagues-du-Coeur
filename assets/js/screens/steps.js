window.renderScreen7 = () => {
  const content = createEl('div', { style: 'width: 100%;' }, [
    createEl('h2', { textContent: 'Mise en place en 6 étapes', style: 'text-align: center;' }),
    createEl('p', {
      textContent: 'Une transition fluide estimée entre 2 et 3 heures maximum.',
      style: 'text-align: center; color: var(--color-text-secondary); margin-bottom: 40px;'
    }),

    createEl('div', { className: 'timeline' }, AppData.STEPS.map((step, index) => {
      const stepNum = index + 1;
      const itemEl = createEl('div', { className: 'timeline-item' }, [
        createEl('div', { className: 'timeline-marker' }, [stepNum]),
        createEl('div', {
          className: 'timeline-content',
          role: 'button',
          tabindex: 0,
          'aria-expanded': 'false',
          onClick: (e) => toggleTimelineItem(itemEl),
          onKeydown: (e) => { if (e.key === 'Enter' || e.key === ' ') toggleTimelineItem(itemEl); }
        }, [
          createEl('div', { style: 'display: flex; justify-content: space-between; align-items: center; gap: 16px;' }, [
            createEl('h3', { textContent: `Étape ${stepNum} — ${step.title}`, style: 'font-size: 18px; margin: 0;' }),
            createEl('span', { className: 'badge badge-info' }, [
              createEl('i', { className: 'fa-regular fa-clock', style: 'margin-right: 4px;' }),
              createEl('span', { textContent: step.duration })
            ])
          ]),
          createEl('div', { className: 'timeline-body' }, [
            createEl('p', { textContent: step.content, style: 'margin: 0;' })
          ])
        ])
      ]);
      return itemEl;
    }))
  ]);

  function toggleTimelineItem(itemEl) {
    const isActive = itemEl.classList.contains('active');
    document.querySelectorAll('.timeline-item').forEach(el => {
      el.classList.remove('active');
      el.querySelector('.timeline-content').setAttribute('aria-expanded', 'false');
    });
    if (!isActive) {
      itemEl.classList.add('active');
      itemEl.querySelector('.timeline-content').setAttribute('aria-expanded', 'true');
    }
  }

  return Promise.resolve(content);
};
