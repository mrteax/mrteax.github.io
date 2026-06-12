(() => {
  const PACK_FAVICON = '/pack-favicon.svg';
  const PACK_LABELS = {
    portal: 'HOME', health: 'HLTH', tools: 'UTIL', games: 'PLAY', cocktails: 'BAR',
    tea: 'TEA', coffee: 'BREW', hiking: 'TRAIL', fitness: 'MOVE', tennis: 'TENNIS',
    skiing: 'SKI', surfing: 'SURF', billiards: 'POOL', visitors: 'MAP', france: 'TRIP',
    cursor: 'AI', index: 'TX'
  };

  const path = location.pathname.split('/').pop() || 'index.html';
  const pageKey = path.replace('.html', '').replace(/-usage-bookmarklet$/, '').replace(/france-schengen-2026$/, 'france').replace(/cursor-usage-bookmarklet$/, 'cursor');
  const pageLabel = PACK_LABELS[pageKey] || 'TX';

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
    link.type = 'image/svg+xml';
  }

  function makeMark(label, cls = 'pack-mark') {
    const span = document.createElement('span');
    span.className = cls;
    span.setAttribute('aria-hidden', 'true');
    span.textContent = label;
    return span;
  }

  function enhanceNavHome() {
    document.querySelectorAll('.nav-home').forEach(el => {
      if (el.dataset.packified === '1') return;
      const text = stripLeadingIcon(el.textContent) || 'Tea X';
      el.textContent = '';
      el.append(makeMark('TX', 'page-icon-pack'), Object.assign(document.createElement('span'), { className: 'pack-wordmark', textContent: text }));
      el.dataset.packified = '1';
    });
  }

  function enhanceBrandIcons() {
    document.querySelectorAll('.brand-icon').forEach(el => {
      el.classList.add('brand-icon-pack');
      el.textContent = 'TX';
      el.setAttribute('aria-hidden', 'true');
    });
    document.querySelectorAll('.footer-brand').forEach(el => {
      if (el.dataset.packified === '1') return;
      const labelText = stripLeadingIcon(el.textContent) || 'Tea X';
      el.textContent = '';
      el.append(makeMark('TX', 'footer-brand-icon brand-icon-pack'), Object.assign(document.createElement('span'), { textContent: labelText }));
      el.dataset.packified = '1';
    });
  }

  function enhanceTitles() {
    document.querySelectorAll('.nav-title').forEach(el => {
      const clean = stripLeadingIcon(el.textContent);
      el.textContent = clean;
    });
    document.querySelectorAll('.daily-label').forEach(el => {
      const clean = stripLeadingIcon(el.textContent);
      el.textContent = '';
      el.append(makeMark('WARN', 'pack-mini-chip'), document.createTextNode(' ' + clean));
    });
  }

  function enhanceIconBuckets() {
    document.querySelectorAll('.theme-emoji, .tool-icon').forEach((el, idx) => {
      const clean = stripLeadingIcon(el.textContent) || ['LAB', 'TAG', 'PAGE', 'CTRL'][idx % 4];
      el.classList.add(el.classList.contains('tool-icon') ? 'tool-icon-pack' : 'theme-pack-icon');
      el.textContent = clean.slice(0, 6).toUpperCase();
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    ensureFavicon();
    document.documentElement.dataset.theme = document.documentElement.dataset.theme || 'dark';
    enhanceNavHome();
    enhanceBrandIcons();
    enhanceTitles();
    enhanceIconBuckets();
    document.body.dataset.packPage = pageLabel;
  });
})();
