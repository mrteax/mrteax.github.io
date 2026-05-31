/*
 * 真实访客地图 (Visitor Map)
 * ===========================================================================
 * 它做三件事：
 *   1. 用免费、免密钥的 IP 定位 API 拿到「当前访客」的大致城市/经纬度；
 *   2. 把访客落点存起来；
 *   3. 在主页的世界地图上把所有落点画成发光的圆点。
 *
 * 存储是「可插拔」的：
 *   - 默认用 localStorage —— 开箱即用，但只记录「本浏览器」的足迹，
 *     不会跨设备/跨访客共享（也就是说默认只能看到你自己来过的地方）。
 *   - 想要真正「全球访客」的地图，填好下面的 SUPABASE 配置即可（见说明），
 *     之后每位访客的落点都会写进同一张表，所有人看到的是同一张全球地图。
 *
 * --- 如何开启真正的全球地图（免费、无需自建服务器）---------------------------
 *   1) 到 https://supabase.com 新建一个免费项目。
 *   2) 在 SQL Editor 里执行：
 *        create table visitors (
 *          id bigint generated always as identity primary key,
 *          lat double precision, lon double precision,
 *          city text, country text, code text,
 *          created_at timestamptz default now()
 *        );
 *        alter table visitors enable row level security;
 *        create policy "anyone can read"   on visitors for select using (true);
 *        create policy "anyone can insert" on visitors for insert with check (true);
 *   3) 在 Project Settings → API 里复制 Project URL 和 anon public key，
 *      填到下面的 SUPABASE.url / SUPABASE.key。anon key 是设计来公开放在前端的，
 *      配合上面的 RLS 策略只能读/插入，安全可控。
 * ===========================================================================
 */
(() => {
  'use strict';

  const SUPABASE = {
    url: 'https://trcetesyexopngcfrgck.supabase.co',
    key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRyY2V0ZXN5ZXhvcG5nY2ZyZ2NrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAwMjIxNDYsImV4cCI6MjA5NTU5ODE0Nn0.ezCv2WcvJe7UjcLogSw96KTtL1HsBdnSytrbTuhDF2c',
    table: 'visitors',
  };
  const useRemote = !!(SUPABASE.url && SUPABASE.key);

  // On most pages we only *record* the visit silently. The map + stats are
  // rendered only where the SVG exists (the private /visitors.html page).
  const svg = document.getElementById('vmap');
  const pinsG = document.getElementById('vmapPins');
  const greetEl = document.getElementById('visitorGreet');
  const statEl = document.getElementById('mapStat');
  const noteEl = document.getElementById('visitorNote');
  const listEl = document.getElementById('visitorList');
  const showMap = !!(svg && pinsG);

  const SVGNS = 'http://www.w3.org/2000/svg';

  // Equirectangular projection onto the 800x400 hand-drawn map.
  function project(lat, lon) {
    const x = (Number(lon) + 180) / 360 * 800;
    const y = (90 - Number(lat)) / 180 * 400;
    return [x, y];
  }

  // ---- IP geolocation (free, no key). Try a couple of providers. ----
  async function geolocate() {
    try {
      const cached = sessionStorage.getItem('teax_geo');
      if (cached) return JSON.parse(cached);
    } catch (e) {}
    try {
      const r = await fetch('https://ipwho.is/');
      const d = await r.json();
      if (d && d.success !== false && d.latitude != null) {
        return {
          lat: d.latitude, lon: d.longitude,
          city: d.city || '', country: d.country || '', code: d.country_code || '',
          flag: (d.flag && d.flag.emoji) || '',
        };
      }
    } catch (e) {}
    try {
      const r = await fetch('https://ipapi.co/json/');
      const d = await r.json();
      if (d && d.latitude != null) {
        return {
          lat: d.latitude, lon: d.longitude,
          city: d.city || '', country: d.country_name || '', code: d.country_code || '',
          flag: '',
        };
      }
    } catch (e) {}
    return null;
  }

  function flagFromCode(code) {
    if (!code || code.length !== 2) return '';
    return code.toUpperCase().replace(/./g, c => String.fromCodePoint(127397 + c.charCodeAt(0)));
  }

  // ---- Storage adapters ----
  async function loadVisitors() {
    if (useRemote) {
      try {
        const url = `${SUPABASE.url}/rest/v1/${SUPABASE.table}` +
          `?select=lat,lon,city,country,code,created_at&order=created_at.desc&limit=5000`;
        const r = await fetch(url, { headers: { apikey: SUPABASE.key, Authorization: `Bearer ${SUPABASE.key}` } });
        if (r.ok) return await r.json();
      } catch (e) {}
      return [];
    }
    try { return JSON.parse(localStorage.getItem('teax_visitors') || '[]'); }
    catch (e) { return []; }
  }

  async function saveVisitor(v) {
    // Only record this browser once per day to avoid flooding.
    const today = new Date().toISOString().slice(0, 10);
    if (localStorage.getItem('teax_geo_day') === today) return false;
    localStorage.setItem('teax_geo_day', today);

    if (useRemote) {
      try {
        await fetch(`${SUPABASE.url}/rest/v1/${SUPABASE.table}`, {
          method: 'POST',
          headers: {
            apikey: SUPABASE.key, Authorization: `Bearer ${SUPABASE.key}`,
            'Content-Type': 'application/json', Prefer: 'return=minimal',
          },
          body: JSON.stringify({ lat: v.lat, lon: v.lon, city: v.city, country: v.country, code: v.code }),
        });
      } catch (e) {}
      return true;
    }
    try {
      const list = JSON.parse(localStorage.getItem('teax_visitors') || '[]');
      list.push({ lat: v.lat, lon: v.lon, city: v.city, country: v.country, code: v.code, created_at: new Date().toISOString() });
      localStorage.setItem('teax_visitors', JSON.stringify(list.slice(-500)));
    } catch (e) {}
    return true;
  }

  // ---- Rendering ----
  function addPin(x, y, { r = 4, you = false, label = '' } = {}) {
    const g = document.createElementNS(SVGNS, 'g');
    g.setAttribute('class', 'vpin' + (you ? ' vpin-you' : ''));

    const ring = document.createElementNS(SVGNS, 'circle');
    ring.setAttribute('cx', x); ring.setAttribute('cy', y);
    ring.setAttribute('r', r); ring.setAttribute('class', 'vpin-ring');
    g.appendChild(ring);

    const dot = document.createElementNS(SVGNS, 'circle');
    dot.setAttribute('cx', x); dot.setAttribute('cy', y);
    dot.setAttribute('r', Math.max(2, r * 0.55)); dot.setAttribute('class', 'vpin-dot');
    g.appendChild(dot);

    if (label) {
      const t = document.createElementNS(SVGNS, 'title');
      t.textContent = label;
      g.appendChild(t);
    }
    pinsG.appendChild(g);
  }

  function aggregate(list) {
    const map = new Map();
    list.forEach(l => {
      if (l.lat == null || l.lon == null) return;
      const k = (l.city || '') + '|' + (l.country || '') + '|' + Math.round(l.lat) + '|' + Math.round(l.lon);
      if (!map.has(k)) map.set(k, { ...l, count: 0 });
      map.get(k).count++;
    });
    return [...map.values()];
  }

  async function render(you) {
    const stored = await loadVisitors();
    const cities = aggregate(stored);

    pinsG.innerHTML = '';
    cities.forEach(c => {
      const [x, y] = project(c.lat, c.lon);
      const isYou = you && Math.round(c.lat) === Math.round(you.lat) && Math.round(c.lon) === Math.round(you.lon);
      const label = [c.city, c.country].filter(Boolean).join(', ') + (c.count > 1 ? ` · ${c.count}` : '');
      addPin(x, y, { r: Math.min(8, 3 + Math.log2(c.count + 1) * 1.6), you: isYou, label });
    });

    const visits = stored.length;
    const countries = new Set(stored.map(v => v.country).filter(Boolean)).size;
    if (statEl) statEl.textContent = `${visits} 次到访 · ${countries} 个国家/地区`;
    if (greetEl) {
      greetEl.textContent = useRemote ? '全站访客足迹（仅你可见）' : '本机访客足迹';
    }
    if (noteEl) {
      noteEl.textContent = useRemote
        ? '所有访客的真实落点，圆点越大到访越多'
        : '当前仅记录本机足迹，配置 Supabase 后显示全站访客（见 js/visitor-map.js）';
    }
    if (listEl) {
      const top = cities.slice().sort((a, b) => b.count - a.count).slice(0, 20);
      listEl.innerHTML = top.map(c => {
        const flag = flagFromCode(c.code);
        const place = [c.city, c.country].filter(Boolean).join(', ') || '未知';
        return `<li><span>${flag ? flag + ' ' : ''}${place}</span><b>${c.count}</b></li>`;
      }).join('') || '<li><span>还没人来过，可能大家都在忙着上班 🫠</span><b>0</b></li>';
    }

    renderDashboard(stored, cities);
  }

  // ---- Dashboard: KPIs, trends, breakdowns ----
  const localDay = ts => { const d = new Date(ts); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
  function relTime(ts) {
    const diff = Date.now() - new Date(ts).getTime();
    if (!(diff >= 0)) return '';
    const min = Math.floor(diff / 60000);
    if (min < 1) return '刚刚';
    if (min < 60) return `${min} 分钟前`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return `${hr} 小时前`;
    const day = Math.floor(hr / 24);
    if (day === 1) return '昨天';
    if (day < 30) return `${day} 天前`;
    return localDay(ts).slice(5);
  }
  function barsSVG(values, labels) {
    const n = values.length || 1, max = Math.max(1, ...values), bw = 100 / n;
    const rects = values.map((v, i) => {
      const h = v / max * 32, x = i * bw + bw * 0.15, w = bw * 0.7, y = 36 - h;
      const lab = labels && labels[i] != null ? labels[i] : '';
      return `<rect x="${x.toFixed(2)}" y="${y.toFixed(2)}" width="${w.toFixed(2)}" height="${Math.max(0.6, h).toFixed(2)}" rx="0.5"><title>${lab}：${v}</title></rect>`;
    }).join('');
    return `<svg class="vchart" viewBox="0 0 100 40" preserveAspectRatio="none">${rects}</svg>`;
  }

  let _stored = [];
  let _trendWin = 30;
  let _wired = false;

  function deltaHtml(cur, prev) {
    const d = cur - prev;
    if (!cur && !prev) return '';
    const cls = d > 0 ? 'up' : d < 0 ? 'down' : 'flat';
    const a = d > 0 ? '↑' : d < 0 ? '↓' : '→';
    return `<div class="vkpi-d ${cls}">${a}${Math.abs(d)} <span>较前期</span></div>`;
  }

  function renderTrendChart() {
    const trendEl = document.getElementById('visitorTrend');
    if (!trendEl) return;
    const withTime = _stored.filter(v => v.created_at);
    if (!withTime.length) { trendEl.innerHTML = '<p class="vmuted">暂无带时间的记录</p>'; return; }
    const now = new Date(), dayMs = 86400000;
    let win = _trendWin;
    if (win === 'all') {
      const earliest = withTime.reduce((m, v) => Math.min(m, new Date(v.created_at).getTime()), now.getTime());
      win = Math.min(365, Math.max(7, Math.ceil((now - earliest) / dayMs) + 1));
    }
    const days = [], counts = [], byDay = {};
    withTime.forEach(v => { const k = localDay(v.created_at); byDay[k] = (byDay[k] || 0) + 1; });
    for (let i = win - 1; i >= 0; i--) { const d = localDay(new Date(now - i * dayMs)); days.push(d); counts.push(byDay[d] || 0); }
    trendEl.innerHTML = barsSVG(counts, days.map(d => d.slice(5))) +
      `<div class="vchart-axis"><span>${days[0].slice(5)}</span><span>${days[days.length - 1].slice(5)}</span></div>`;
  }

  function exportCsv() {
    const head = ['created_at', 'city', 'country', 'code', 'lat', 'lon'];
    const esc = s => { s = s == null ? '' : String(s); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
    const csv = [head.join(',')].concat(_stored.map(r => head.map(k => esc(r[k])).join(','))).join('\n');
    const url = URL.createObjectURL(new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url; a.download = 'visitors-' + localDay(new Date()) + '.csv'; a.click();
    URL.revokeObjectURL(url);
  }

  function renderDashboard(stored, cities) {
    _stored = stored;
    const withTime = stored.filter(v => v.created_at);
    const now = new Date(), dayMs = 86400000, todayKey = localDay(now);

    // KPI cards (with day-over-day / week-over-week deltas)
    const kpiEl = document.getElementById('visitorKpis');
    if (kpiEl) {
      const countries = new Set(stored.map(v => v.country).filter(Boolean)).size;
      const today = withTime.filter(v => localDay(v.created_at) === todayKey).length;
      const yesterday = withTime.filter(v => localDay(v.created_at) === localDay(new Date(now - dayMs))).length;
      const week = withTime.filter(v => now - new Date(v.created_at) < 7 * dayMs).length;
      const prev7 = withTime.filter(v => { const d = now - new Date(v.created_at); return d >= 7 * dayMs && d < 14 * dayMs; }).length;
      const kpis = [
        ['总到访', stored.length, ''], ['国家/地区', countries, ''], ['城市', cities.length, ''],
        ['今日', today, deltaHtml(today, yesterday)], ['近 7 天', week, deltaHtml(week, prev7)],
      ];
      kpiEl.innerHTML = kpis.map(([l, v, d]) => `<div class="vkpi"><div class="vkpi-n">${v}</div><div class="vkpi-l">${l}</div>${d || ''}</div>`).join('');
    }

    // Quick insights
    const insEl = document.getElementById('visitorInsights');
    if (insEl) {
      if (!withTime.length) { insEl.innerHTML = ''; }
      else {
        const hours = Array(24).fill(0); withTime.forEach(v => hours[new Date(v.created_at).getHours()]++);
        const peakHour = hours.indexOf(Math.max(...hours));
        const wn = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
        const wd = Array(7).fill(0); withTime.forEach(v => { wd[(new Date(v.created_at).getDay() + 6) % 7]++; });
        const busyWd = wn[wd.indexOf(Math.max(...wd))];
        const byC = {}; stored.forEach(v => { const c = v.country || '未知'; byC[c] = (byC[c] || 0) + 1; });
        const topC = Object.entries(byC).sort((a, b) => b[1] - a[1])[0];
        const share = topC ? Math.round(topC[1] / stored.length * 100) : 0;
        insEl.innerHTML = [
          `🕒 高峰时段 <b>${peakHour}:00</b> 左右`,
          `📅 最活跃 <b>${busyWd}</b>`,
          topC ? `🌍 主要来自 <b>${topC[0]}</b>（${share}%）` : '',
        ].filter(Boolean).map(t => `<span class="vinsight">${t}</span>`).join('');
      }
    }

    renderTrendChart();

    // Day-of-week distribution
    const wdEl = document.getElementById('visitorWeekday');
    if (wdEl) {
      const names = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
      const wd = Array(7).fill(0); withTime.forEach(v => { wd[(new Date(v.created_at).getDay() + 6) % 7]++; });
      wdEl.innerHTML = withTime.length
        ? barsSVG(wd, names) + '<div class="vchart-axis">' + names.map(n => `<span>${n}</span>`).join('') + '</div>'
        : '<p class="vmuted">暂无数据</p>';
    }

    // Hour-of-day distribution
    const hoursEl = document.getElementById('visitorHours');
    if (hoursEl) {
      const hours = Array(24).fill(0);
      withTime.forEach(v => { hours[new Date(v.created_at).getHours()]++; });
      hoursEl.innerHTML = withTime.length
        ? barsSVG(hours, hours.map((_, i) => i + ':00')) + '<div class="vchart-axis"><span>0时</span><span>12时</span><span>23时</span></div>'
        : '<p class="vmuted">暂无数据</p>';
    }

    // Top countries (horizontal bars)
    const cEl = document.getElementById('visitorCountries');
    if (cEl) {
      const byC = {}, codeOf = {};
      stored.forEach(v => { const c = v.country || '未知'; byC[c] = (byC[c] || 0) + 1; if (v.code) codeOf[c] = v.code; });
      const top = Object.entries(byC).sort((a, b) => b[1] - a[1]).slice(0, 8);
      const max = top.length ? top[0][1] : 1;
      cEl.innerHTML = top.map(([c, n]) => {
        const flag = flagFromCode(codeOf[c]);
        return `<div class="vbar"><span class="vbar-l">${flag ? flag + ' ' : ''}${c}</span><div class="vbar-track"><i style="width:${(n / max * 100).toFixed(1)}%"></i></div><b>${n}</b></div>`;
      }).join('') || '<p class="vmuted">暂无数据</p>';
    }

    // Recent visitors
    const recentEl = document.getElementById('visitorRecent');
    if (recentEl) {
      const recent = withTime.slice(0, 12);
      recentEl.innerHTML = recent.map(v => {
        const flag = flagFromCode(v.code);
        const place = [v.city, v.country].filter(Boolean).join(', ') || '未知';
        return `<li><span>${flag ? flag + ' ' : ''}${place}</span><em>${relTime(v.created_at)}</em></li>`;
      }).join('') || '<li><span>还没有访客</span><em></em></li>';
    }

    // Wire interactive controls once
    if (!_wired) {
      _wired = true;
      const rt = document.getElementById('trendRangeBtns');
      if (rt) rt.addEventListener('click', e => {
        const b = e.target.closest('button[data-win]');
        if (!b) return;
        _trendWin = b.dataset.win === 'all' ? 'all' : parseInt(b.dataset.win, 10);
        rt.querySelectorAll('button').forEach(x => x.classList.toggle('active', x === b));
        renderTrendChart();
      });
      const ex = document.getElementById('exportCsv');
      if (ex) ex.addEventListener('click', exportCsv);
    }
  }

  (async () => {
    const you = await geolocate();
    if (you && you.lat != null) {
      // Share the location so other scripts (e.g. the weather greeting) can
      // reuse it without making another IP lookup.
      try { sessionStorage.setItem('teax_geo', JSON.stringify(you)); } catch (e) {}
      window.dispatchEvent(new CustomEvent('teax:geo', { detail: you }));
    }
    // Record real visits everywhere except the private stats page itself
    // (so the owner viewing their own dashboard doesn't pollute the data).
    if (you && you.lat != null && !showMap) await saveVisitor(you);
    if (showMap) await render(you);
  })();
})();
