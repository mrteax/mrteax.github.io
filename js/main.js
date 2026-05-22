(() => {
  'use strict';

  // ===== Theme Toggle =====
  const themeToggle = document.getElementById('themeToggle');
  const html = document.documentElement;

  function setTheme(theme) {
    html.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }

  const savedTheme = localStorage.getItem('theme') ||
    (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  setTheme(savedTheme);

  themeToggle.addEventListener('click', () => {
    const current = html.getAttribute('data-theme');
    setTheme(current === 'dark' ? 'light' : 'dark');
  });

  // ===== Navigation Scroll Effect =====
  const nav = document.getElementById('nav');
  const backToTop = document.getElementById('backToTop');

  function onScroll() {
    const scrollY = window.scrollY;
    nav.classList.toggle('scrolled', scrollY > 50);
    backToTop.classList.toggle('visible', scrollY > 600);
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  backToTop.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // ===== Dynamic Greeting =====
  const greetingEl = document.getElementById('heroGreeting');
  const hour = new Date().getHours();
  let greeting;
  if (hour < 6) greeting = '夜深了 🌙';
  else if (hour < 9) greeting = '早上好 ☀️';
  else if (hour < 12) greeting = '上午好 ☀️';
  else if (hour < 14) greeting = '中午好 🌤️';
  else if (hour < 18) greeting = '下午好 ☕';
  else if (hour < 22) greeting = '晚上好 🌙';
  else greeting = '夜深了 🌙';
  greetingEl.textContent = greeting;

  // ===== Typing Effect =====
  const typedEl = document.getElementById('typedText');
  const phrases = [
    '热爱代码与创造',
    '用技术解决问题',
    '一杯茶，一段代码',
    '探索无限可能',
    '保持好奇心',
  ];
  let phraseIndex = 0;
  let charIndex = 0;
  let isDeleting = false;
  let typingSpeed = 100;

  function typeEffect() {
    const currentPhrase = phrases[phraseIndex];

    if (isDeleting) {
      typedEl.textContent = currentPhrase.substring(0, charIndex - 1);
      charIndex--;
      typingSpeed = 50;
    } else {
      typedEl.textContent = currentPhrase.substring(0, charIndex + 1);
      charIndex++;
      typingSpeed = 120;
    }

    if (!isDeleting && charIndex === currentPhrase.length) {
      isDeleting = true;
      typingSpeed = 2000;
    } else if (isDeleting && charIndex === 0) {
      isDeleting = false;
      phraseIndex = (phraseIndex + 1) % phrases.length;
      typingSpeed = 400;
    }

    setTimeout(typeEffect, typingSpeed);
  }

  setTimeout(typeEffect, 1200);

  // ===== Scroll Reveal =====
  const revealElements = document.querySelectorAll(
    '.about-card, .tech-stack, .project-card, .timer-wrapper, .contact-card'
  );

  function addRevealClass() {
    revealElements.forEach(el => el.classList.add('reveal'));
  }

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

  addRevealClass();
  revealElements.forEach(el => revealObserver.observe(el));

  // ===== GitHub Projects =====
  const LANG_COLORS = {
    java: '#b07219',
    javascript: '#f1e05a',
    python: '#3572A5',
    shell: '#89e051',
    viml: '#199f4b',
    html: '#e34c26',
    css: '#563d7c',
  };

  async function fetchProjects() {
    const grid = document.getElementById('projectsGrid');
    try {
      const response = await fetch('https://api.github.com/users/mrteax/repos?sort=updated&per_page=30');
      if (!response.ok) throw new Error('API error');
      const repos = await response.json();

      const filtered = repos
        .filter(r => !r.fork && r.name !== 'mrteax.github.io')
        .sort((a, b) => {
          const starsA = a.stargazers_count || 0;
          const starsB = b.stargazers_count || 0;
          if (starsB !== starsA) return starsB - starsA;
          return new Date(b.updated_at) - new Date(a.updated_at);
        })
        .slice(0, 6);

      grid.innerHTML = filtered.map(repo => {
        const lang = (repo.language || '').toLowerCase();
        const langClass = LANG_COLORS[lang] ? lang : 'default';
        const desc = repo.description || '暂无描述';
        return `
          <a class="project-card reveal" href="${repo.html_url}" target="_blank" rel="noopener noreferrer">
            <div class="project-card-header">
              <div class="project-card-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                </svg>
              </div>
              <svg class="project-card-link" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                <polyline points="15 3 21 3 21 9"/>
                <line x1="10" y1="14" x2="21" y2="3"/>
              </svg>
            </div>
            <h3 class="project-card-name">${repo.name}</h3>
            <p class="project-card-desc">${desc}</p>
            <div class="project-card-meta">
              ${repo.language ? `
                <span class="project-card-lang">
                  <span class="lang-dot ${langClass}"></span>
                  ${repo.language}
                </span>
              ` : ''}
              ${repo.stargazers_count > 0 ? `
                <span class="project-card-stars">
                  <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                  ${repo.stargazers_count}
                </span>
              ` : ''}
            </div>
          </a>
        `;
      }).join('');

      grid.querySelectorAll('.project-card').forEach(el => {
        revealObserver.observe(el);
      });
    } catch (err) {
      grid.innerHTML = `
        <div class="project-card">
          <div class="project-card-header">
            <div class="project-card-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
              </svg>
            </div>
          </div>
          <h3 class="project-card-name">无法加载项目</h3>
          <p class="project-card-desc">请访问 <a href="https://github.com/mrteax" target="_blank" style="color:var(--color-accent)">GitHub</a> 查看所有项目</p>
        </div>
      `;
    }
  }

  fetchProjects();

  // ===== Tea Timer =====
  const CIRCUMFERENCE = 2 * Math.PI * 120;
  let timerDuration = 5 * 60;
  let timerRemaining = timerDuration;
  let timerInterval = null;
  let isTimerRunning = false;

  const timerTimeEl = document.getElementById('timerTime');
  const timerLabelEl = document.getElementById('timerLabel');
  const timerStartBtn = document.getElementById('timerStart');
  const timerPauseBtn = document.getElementById('timerPause');
  const timerResetBtn = document.getElementById('timerReset');
  const timerProgress = document.querySelector('.timer-ring-progress');
  const presetBtns = document.querySelectorAll('.timer-preset');

  const PRESET_LABELS = {
    5: '绿茶时间',
    10: '红茶时间',
    25: '专注时间',
    45: '深度时间',
  };

  function formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  function updateTimerDisplay() {
    timerTimeEl.textContent = formatTime(timerRemaining);
    const progress = 1 - timerRemaining / timerDuration;
    const offset = progress * CIRCUMFERENCE;
    timerProgress.style.strokeDashoffset = offset;
  }

  function startTimer() {
    if (timerRemaining <= 0) return;
    isTimerRunning = true;
    timerStartBtn.classList.add('hidden');
    timerPauseBtn.classList.remove('hidden');

    timerInterval = setInterval(() => {
      timerRemaining--;
      updateTimerDisplay();

      if (timerRemaining <= 0) {
        clearInterval(timerInterval);
        timerInterval = null;
        isTimerRunning = false;
        timerPauseBtn.classList.add('hidden');
        timerStartBtn.classList.remove('hidden');
        timerLabelEl.textContent = '时间到！🎉';

        const display = document.querySelector('.timer-display');
        display.classList.add('timer-complete');
        setTimeout(() => display.classList.remove('timer-complete'), 600);

        playNotification();
      }
    }, 1000);
  }

  function pauseTimer() {
    clearInterval(timerInterval);
    timerInterval = null;
    isTimerRunning = false;
    timerPauseBtn.classList.add('hidden');
    timerStartBtn.classList.remove('hidden');
  }

  function resetTimer() {
    clearInterval(timerInterval);
    timerInterval = null;
    isTimerRunning = false;
    timerRemaining = timerDuration;
    timerPauseBtn.classList.add('hidden');
    timerStartBtn.classList.remove('hidden');
    const activePreset = document.querySelector('.timer-preset.active');
    const minutes = parseInt(activePreset.dataset.minutes);
    timerLabelEl.textContent = PRESET_LABELS[minutes] || '茶歇时间';
    updateTimerDisplay();
  }

  function playNotification() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const notes = [523.25, 659.25, 783.99];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.15, ctx.currentTime + i * 0.2);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.2 + 0.5);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + i * 0.2);
        osc.stop(ctx.currentTime + i * 0.2 + 0.5);
      });
    } catch (e) {
      // Audio not supported
    }
  }

  presetBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      if (isTimerRunning) pauseTimer();
      presetBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const minutes = parseInt(btn.dataset.minutes);
      timerDuration = minutes * 60;
      timerRemaining = timerDuration;
      timerLabelEl.textContent = PRESET_LABELS[minutes] || '茶歇时间';
      updateTimerDisplay();
    });
  });

  timerStartBtn.addEventListener('click', startTimer);
  timerPauseBtn.addEventListener('click', pauseTimer);
  timerResetBtn.addEventListener('click', resetTimer);

  timerProgress.style.strokeDasharray = CIRCUMFERENCE;
  updateTimerDisplay();

  // ===== Footer Year =====
  document.getElementById('currentYear').textContent = new Date().getFullYear();

  // ===== Smooth Scroll for Nav Links =====
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const target = document.querySelector(anchor.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });
})();
