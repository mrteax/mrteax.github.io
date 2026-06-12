(() => {
  const PACK_FAVICON = '/pack-preview.png';
  const PACK_LOGO = '/pack-nav.svg';
  const PACK_ALT = 'Beside Me 烟盒';
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

  function makePackIcon(cls = 'site-mark') {
    const img = document.createElement('img');
    img.className = cls;
    img.src = PACK_LOGO;
    img.alt = '';
    img.setAttribute('aria-hidden', 'true');
    img.decoding = 'async';
    return img;
  }

  function ensurePackImage(el) {
    if (!el || el.querySelector('img.site-mark')) return;
    const cls = el.classList.contains('brand-icon') ? 'brand-icon site-mark' : 'site-mark';
    const img = makePackIcon(cls);
    el.replaceWith(img);
    return img;
  }

  function enhanceNavHome() {
    document.querySelectorAll('.nav-home').forEach(el => {
      if (el.dataset.iconified === '1') return;
      if (el.querySelector('img.site-mark')) return;
      const text = stripLeadingIcon(el.textContent) || 'Tea X';
      const label = document.createElement('span');
      label.textContent = text;
      el.textContent = '';
      el.append(makePackIcon('site-mark'), label);
      el.dataset.iconified = '1';
    });
  }

  function enhanceBrandIcons() {
    document.querySelectorAll('.brand-icon').forEach(el => {
      if (el.tagName.toLowerCase() === 'img') {
        el.classList.add('site-mark');
        el.src = PACK_LOGO;
        el.alt = el.alt || PACK_ALT;
        el.removeAttribute('style');
        return;
      }
      ensurePackImage(el);
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
      el.append(document.createTextNode(pageIcon + ' ' + clean));
    });
    document.querySelectorAll('.daily-label').forEach(el => {
      el.textContent = stripLeadingIcon(el.textContent);
    });
  }

  function enhanceIconBuckets() {
    document.querySelectorAll('.theme-emoji, .tool-icon, .page-theme-mark').forEach(el => {
      const clean = stripLeadingIcon(el.textContent);
      el.classList.remove('theme-pack-icon', 'tool-icon-pack', 'page-theme-mark');
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
