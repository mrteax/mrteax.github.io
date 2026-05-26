(() => {
  'use strict';

  // Theme
  const html = document.documentElement;
  const themeBtn = document.getElementById('themeToggle');
  const saved = localStorage.getItem('theme') || (matchMedia('(prefers-color-scheme:dark)').matches ? 'dark' : 'light');
  html.dataset.theme = saved;
  themeBtn.textContent = saved === 'dark' ? '☀️' : '🌙';
  themeBtn.addEventListener('click', () => {
    const next = html.dataset.theme === 'dark' ? 'light' : 'dark';
    html.dataset.theme = next;
    localStorage.setItem('theme', next);
    themeBtn.textContent = next === 'dark' ? '☀️' : '🌙';
  });

  // Build base filter buttons from data
  const baseFilters = document.getElementById('baseFilters');
  const bases = [...new Set(COCKTAILS.map(c => c.base))];
  bases.forEach(b => {
    const btn = document.createElement('button');
    btn.className = 'base-tag';
    btn.dataset.base = b;
    btn.textContent = `${BASE_EMOJI[b] || '🍹'} ${BASE_LABELS[b] || b}`;
    baseFilters.appendChild(btn);
  });

  // State
  let activeBase = 'all';
  let activeFlavors = new Set();
  let searchQuery = '';

  // Filter & Render
  function getFiltered() {
    return COCKTAILS.filter(c => {
      if (activeBase !== 'all' && c.base !== activeBase) return false;
      if (activeFlavors.size > 0 && ![...activeFlavors].some(f => c.flavor.some(fl => fl.includes(f)))) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const haystack = `${c.name} ${c.zh} ${c.base} ${c.ingredients.join(' ')} ${c.flavor.join(' ')} ${c.desc}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }

  const grid = document.getElementById('grid');
  const countEl = document.getElementById('resultCount');

  function render() {
    const results = getFiltered();
    countEl.textContent = results.length;

    if (results.length === 0) {
      grid.innerHTML = '<div class="no-results">没有找到匹配的鸡尾酒 🍸</div>';
      return;
    }

    grid.innerHTML = results.map((c, i) => `
      <div class="cocktail-card" data-id="${c.id}" style="animation-delay:${Math.min(i * 0.03, 0.5)}s">
        ${c.img ? `<img class="card-img" src="${c.img}" alt="${c.name}" loading="lazy">` : `<div class="card-color" style="background:${c.color}"></div>`}
        <div class="card-body">
          <div class="card-emoji">${BASE_EMOJI[c.base] || '🍹'}</div>
          <div class="card-name">${c.name}</div>
          <div class="card-zh">${c.zh}</div>
          <p class="card-desc">${c.desc}</p>
          <div class="card-footer">
            <span class="card-badge">${c.method}</span>
            <span class="card-badge">${c.glass}</span>
            ${c.strength === 'strong' ? '<span class="card-badge">🔥 烈</span>' : ''}
          </div>
        </div>
      </div>
    `).join('');

    grid.querySelectorAll('.cocktail-card').forEach(card => {
      card.addEventListener('click', () => openModal(card.dataset.id));
    });
  }

  // Base filter
  baseFilters.addEventListener('click', (e) => {
    const btn = e.target.closest('.base-tag');
    if (!btn) return;
    activeBase = btn.dataset.base;
    baseFilters.querySelectorAll('.base-tag').forEach(b => b.classList.toggle('active', b.dataset.base === activeBase));
    render();
  });

  // Flavor filter
  document.getElementById('flavorFilters').addEventListener('click', (e) => {
    const btn = e.target.closest('.flav-tag');
    if (!btn) return;
    const f = btn.dataset.flavor;
    if (activeFlavors.has(f)) { activeFlavors.delete(f); btn.classList.remove('active'); }
    else { activeFlavors.add(f); btn.classList.add('active'); }
    render();
  });

  // Search
  let searchTimer;
  document.getElementById('searchInput').addEventListener('input', (e) => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      searchQuery = e.target.value.trim();
      render();
    }, 200);
  });

  // Modal
  const modal = document.getElementById('modal');

  function openModal(id) {
    const c = COCKTAILS.find(x => x.id === id);
    if (!c) return;
    if (c.img) {
      document.getElementById('modalColor').style.background = `url(${c.img}) center/cover`;
      document.getElementById('modalColor').style.height = '200px';
    } else {
      document.getElementById('modalColor').style.background = c.color;
      document.getElementById('modalColor').style.height = '80px';
    }
    document.getElementById('modalName').textContent = c.name;
    document.getElementById('modalZh').textContent = c.zh;
    document.getElementById('modalMeta').innerHTML = `
      <span>🍸 ${c.glass}</span>
      <span>🔧 ${c.method}</span>
      <span>${c.strength === 'strong' ? '🔥 高酒精' : c.strength === 'light' ? '🌿 低酒精' : '⚖️ 中等'}</span>
      <span>${BASE_EMOJI[c.base]} ${BASE_LABELS[c.base]}</span>
    `;
    document.getElementById('modalDesc').textContent = c.desc;
    document.getElementById('modalIngredients').innerHTML = c.ingredients.map(i => `<li>${i}</li>`).join('');
    document.getElementById('modalTags').innerHTML = c.flavor.map(f => `<span>${f}</span>`).join('');
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    modal.classList.add('hidden');
    document.body.style.overflow = '';
  }

  document.getElementById('modalClose').addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });

  // Deep link: open cocktail if hash matches
  if (location.hash) {
    const id = location.hash.slice(1);
    setTimeout(() => openModal(id), 300);
  }

  render();
})();
