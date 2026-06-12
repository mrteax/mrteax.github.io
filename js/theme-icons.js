(() => {
  const PACK_FAVICON = '/pack-preview.png';
  const PACK_LOGO = PACK_FAVICON;
  const PACK_ALT = 'Beside Me 烟盒';
  let PACK_LOGO_DATA_URL = '';
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

  function applyPackLogo(el) {
    if (!el) return;
    const src = PACK_LOGO_DATA_URL || PACK_LOGO;
    el.style.backgroundImage = `url("${src}")`;
    el.style.backgroundColor = 'transparent';
    el.style.backgroundRepeat = 'no-repeat';
    el.style.backgroundSize = 'contain';
    el.style.backgroundPosition = 'center';
  }

  function preparePackLogo() {
    return new Promise(resolve => {
      if (PACK_LOGO_DATA_URL) return resolve(PACK_LOGO_DATA_URL);
      const img = new Image();
      img.decoding = 'async';
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = 88;
          canvas.height = 120;
          const ctx = canvas.getContext('2d');
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 250, 140, 300, 470, 0, 0, canvas.width, canvas.height);
          PACK_LOGO_DATA_URL = canvas.toDataURL('image/png');
          resolve(PACK_LOGO_DATA_URL);
        } catch (err) {
          resolve(PACK_LOGO);
        }
      };
      img.onerror = () => resolve(PACK_LOGO);
      img.src = PACK_LOGO;
    });
  }

  function makePackIcon(cls = 'site-mark') {
    const span = document.createElement('span');
    span.className = cls;
    span.setAttribute('aria-hidden', 'true');
    span.dataset.logoSrc = PACK_LOGO;
    applyPackLogo(span);
    return span;
  }

  function ensurePackImage(el) {
    if (!el || el.querySelector('.site-mark')) return;
    const cls = el.classList.contains('brand-icon') ? 'brand-icon site-mark' : 'site-mark';
    const icon = makePackIcon(cls);
    el.replaceWith(icon);
    return icon;
  }

  function enhanceNavHome() {
    document.querySelectorAll('.nav-home').forEach(el => {
      if (el.dataset.iconified === '1') return;
      if (el.querySelector('.site-mark')) return;
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
      if (el.classList.contains('site-mark')) {
        applyPackLogo(el);
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
      el.classList.remove('theme-pack-icon', 'tool-icon-pack', 'page-theme-mark');
    });
  }

  document.addEventListener('DOMContentLoaded', async () => {
    ensureFavicon();
    document.documentElement.dataset.theme = document.documentElement.dataset.theme || 'light';
    await preparePackLogo();
    enhanceNavHome();
    enhanceBrandIcons();
    document.querySelectorAll('.site-mark').forEach(applyPackLogo);
    enhanceTitles();
    enhanceIconBuckets();
  });
})();
