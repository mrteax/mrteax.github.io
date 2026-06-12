(() => {
  const PACK_FAVICON = '/pack-preview.png';
  const PAGE_ICONS = {
    portal: '⌂', health: '♡', tools: '⚙', games: '♟', cocktails: '♧',
    tea: '◌', coffee: '◍', hiking: '△', fitness: '◇', tennis: '◐',
    skiing: '⌁', surfing: '∿', billiards: '●', visitors: '◇', france: '✈',
    cursor: 'AI', index: 'TX'
  };

  const path = location.pathname.split('/').pop() || 'index.html';
  const pageKey = path
    .replace('.html', '')
    .replace(/france-schengen-2026$/, 'france')
    .replace(/cursor-usage-bookmarklet$/, 'cursor') || 'index';
  const pageIcon = PAGE_ICONS[pageKey] || '•';

  function stripLeadingIcon(text) {
    return String(text || '').replace(/^[\p{Emoji_Presentation}\p{Extended_Pictographic}\uFE0F\u200D#*0-9]+\s*/u, '').trim();
  }

  function ensureFavicon() {
    let link = document.querySelector('link[rel="icon"]');
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.href = PACK_FAVICON;
    link.type = 'image/png';
  }

  function makeIcon(label, cls = 'page-theme-mark') {
    const span = document.createElement('span');
    span.className = cls;
    span.setAttribute('aria-hidden', 'true');
    span.textContent = label;
    return span;
  }

  function enhanceNavHome() {
    document.querySelectorAll('.nav-home').forEach(el => {
      if (el.dataset.iconified === '1') return;
      const text = stripLeadingIcon(el.textContent) || 'Tea X';
      el.textContent = '';
      el.append(makeIcon('TX', 'site-mark'), Object.assign(document.createElement('span'), { textContent: text }));
      el.dataset.iconified = '1';
    });
  }

  function enhanceBrandIcons() {
    document.querySelectorAll('.brand-icon').forEach(el => {
      el.classList.remove('brand-icon-pack');
      el.classList.add('site-mark');
      if (el.tagName.toLowerCase() === 'img') return;
      el.textContent = 'TX';
      el.setAttribute('aria-hidden', 'true');
    });
    document.querySelectorAll('.footer-brand').forEach(el => {
      if (el.dataset.iconified === '1') return;
      const labelText = stripLeadingIcon(el.textContent) || 'Tea X';
      el.textContent = '';
      el.append(Object.assign(document.createElement('span'), { textContent: labelText }));
      el.dataset.iconified = '1';
    });
  }

  function enhanceTitles() {
    document.querySelectorAll('.nav-title').forEach(el => {
      const clean = stripLeadingIcon(el.textContent);
      el.textContent = '';
      el.append(makeIcon(pageIcon), document.createTextNode(' ' + clean));
    });
    document.querySelectorAll('.daily-label').forEach(el => {
      el.textContent = stripLeadingIcon(el.textContent);
    });
  }

  function enhanceIconBuckets() {
    document.querySelectorAll('.theme-emoji, .tool-icon').forEach(el => {
      const clean = stripLeadingIcon(el.textContent);
      el.classList.remove('theme-pack-icon', 'tool-icon-pack');
      el.textContent = clean;
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    ensureFavicon();
    document.documentElement.dataset.theme = document.documentElement.dataset.theme || 'light';
    enhanceNavHome();
    enhanceBrandIcons();
    enhanceTitles();
    enhanceIconBuckets();
  });
})();
