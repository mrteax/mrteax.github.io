(() => {
  'use strict';

  // Theme
  const html = document.documentElement;
  const themeBtn = document.getElementById('themeToggle');
  const saved = localStorage.getItem('theme') ||
    (matchMedia('(prefers-color-scheme:dark)').matches ? 'dark' : 'light');
  html.dataset.theme = saved;
  themeBtn.textContent = saved === 'dark' ? '☀️' : '🌙';

  themeBtn.addEventListener('click', () => {
    const next = html.dataset.theme === 'dark' ? 'light' : 'dark';
    html.dataset.theme = next;
    localStorage.setItem('theme', next);
    themeBtn.textContent = next === 'dark' ? '☀️' : '🌙';
  });

  // Active nav day on scroll
  const dayEls = document.querySelectorAll('.day, #prep');
  const navDays = document.querySelectorAll('.nav-day');
  const sections = new Map();
  dayEls.forEach(el => sections.set(el.id, el));

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        navDays.forEach(n => {
          n.classList.toggle('active', n.dataset.day === id);
        });
      }
    });
  }, { rootMargin: '-30% 0px -60% 0px' });

  dayEls.forEach(el => observer.observe(el));

  // Smooth scroll for nav links
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const target = document.querySelector(a.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });

  // Checklist persistence
  const checks = document.querySelectorAll('.check-item input');
  const savedChecks = JSON.parse(localStorage.getItem('teax_travel_checks') || '{}');

  checks.forEach((cb, i) => {
    cb.checked = !!savedChecks[i];
    cb.addEventListener('change', () => {
      const state = {};
      checks.forEach((c, idx) => { if (c.checked) state[idx] = true; });
      localStorage.setItem('teax_travel_checks', JSON.stringify(state));
    });
  });
})();
