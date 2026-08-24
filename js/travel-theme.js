(() => {
  const root = document.documentElement;
  const toggle = document.getElementById('themeToggle');
  const systemPreference = window.matchMedia('(prefers-color-scheme: dark)');

  function storedTheme() {
    try {
      const saved = localStorage.getItem('theme');
      return saved === 'dark' || saved === 'light' ? saved : null;
    } catch (error) {
      return null;
    }
  }

  function applyTheme(theme) {
    root.dataset.theme = theme;
    if (!toggle) return;
    const dark = theme === 'dark';
    toggle.textContent = dark ? '☀️' : '🌙';
    toggle.setAttribute('aria-label', dark ? '切换到浅色主题' : '切换到深色主题');
    toggle.setAttribute('aria-pressed', String(dark));
  }

  applyTheme(storedTheme() || (systemPreference.matches ? 'dark' : 'light'));

  toggle?.addEventListener('click', () => {
    const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    try {
      localStorage.setItem('theme', next);
    } catch (error) {
      // The selected theme still applies for this visit if storage is unavailable.
    }
  });

  systemPreference.addEventListener?.('change', event => {
    if (!storedTheme()) applyTheme(event.matches ? 'dark' : 'light');
  });
})();
