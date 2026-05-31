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

  // Stable anonymous id per browser (for new vs returning stats)
  function getVid() {
    try {
      let v = localStorage.getItem('teax_vid');
      if (!v) { v = (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : (Date.now().toString(36) + Math.random().toString(16).slice(2)); localStorage.setItem('teax_vid', v); }
      return v;
    } catch (e) { return null; }
  }

  // ---- Storage adapters ----
  async function loadVisitors() {
    if (useRemote) {
      const hdr = { apikey: SUPABASE.key, Authorization: `Bearer ${SUPABASE.key}` };
      const url = c => `${SUPABASE.url}/rest/v1/${SUPABASE.table}?select=${c}&order=created_at.desc&limit=5000`;
      try {
        // Try with vid; gracefully fall back if that column doesn't exist yet.
        let r = await fetch(url('lat,lon,city,country,code,created_at,vid'), { headers: hdr });
        if (!r.ok) r = await fetch(url('lat,lon,city,country,code,created_at'), { headers: hdr });
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

    const vid = getVid();
    if (useRemote) {
      const base = { lat: v.lat, lon: v.lon, city: v.city, country: v.country, code: v.code };
      const post = body => fetch(`${SUPABASE.url}/rest/v1/${SUPABASE.table}`, {
        method: 'POST',
        headers: { apikey: SUPABASE.key, Authorization: `Bearer ${SUPABASE.key}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
        body: JSON.stringify(body),
      }).then(r => r.ok).catch(() => false);
      try {
        const ok = vid ? await post({ ...base, vid }) : await post(base);
        if (!ok && vid) await post(base); // retry without vid if column missing
      } catch (e) {}
      return true;
    }
    try {
      const list = JSON.parse(localStorage.getItem('teax_visitors') || '[]');
      list.push({ lat: v.lat, lon: v.lon, city: v.city, country: v.country, code: v.code, vid, created_at: new Date().toISOString() });
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

  let _storedAll = [], _citiesAll = [], _you = null, _mapWin = 'all';

  function drawMap() {
    let list = _storedAll;
    if (_mapWin !== 'all') {
      const now = Date.now();
      list = _storedAll.filter(v => v.created_at && (now - new Date(v.created_at)) < _mapWin * 86400000);
    }
    const cities = aggregate(list);
    pinsG.innerHTML = '';
    cities.forEach(c => {
      const [x, y] = project(c.lat, c.lon);
      const isYou = _you && Math.round(c.lat) === Math.round(_you.lat) && Math.round(c.lon) === Math.round(_you.lon);
      const label = [c.city, c.country].filter(Boolean).join(', ') + (c.count > 1 ? ` · ${c.count}` : '');
      addPin(x, y, { r: Math.min(8, 3 + Math.log2(c.count + 1) * 1.6), you: isYou, label });
    });
  }

  async function render(you) {
    const stored = await loadVisitors();
    _storedAll = stored; _you = you; _citiesAll = aggregate(stored);
    drawMap();

    const countries = new Set(stored.map(v => v.country).filter(Boolean)).size;
    if (statEl) statEl.textContent = `${stored.length} 次到访 · ${countries} 个国家/地区`;
    if (greetEl) greetEl.textContent = useRemote ? '全站访客足迹（仅你可见）' : '本机访客足迹';
    if (noteEl) {
      noteEl.textContent = useRemote
        ? '所有访客的真实落点，圆点越大到访越多'
        : '当前仅记录本机足迹，配置 Supabase 后显示全站访客（见 js/visitor-map.js）';
    }
    if (listEl) {
      const top = _citiesAll.slice().sort((a, b) => b.count - a.count).slice(0, 20);
      listEl.innerHTML = top.map(c => {
        const flag = flagFromCode(c.code);
        const place = [c.city, c.country].filter(Boolean).join(', ') || '未知';
        return `<li><span>${flag ? flag + ' ' : ''}${place}</span><b>${c.count}</b></li>`;
      }).join('') || '<li><span>还没人来过，可能大家都在忙着上班 🫠</span><b>0</b></li>';
    }

    renderDashboard(stored, _citiesAll);
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
  const PALETTE = ['#b07d4f', '#d4a574', '#8c6239', '#c98a5e', '#e0b483', '#9aa0a6'];
  function donutSVG(slices) {
    const total = slices.reduce((s, x) => s + x.value, 0) || 1;
    const R = 15.915, C = 2 * Math.PI * R;
    let off = 0;
    const arcs = slices.map(s => {
      const len = s.value / total * C;
      const el = `<circle cx="21" cy="21" r="${R}" fill="none" stroke="${s.color}" stroke-width="7" stroke-dasharray="${len.toFixed(2)} ${(C - len).toFixed(2)}" stroke-dashoffset="${(-off).toFixed(2)}" transform="rotate(-90 21 21)"><title>${s.label}：${s.value}（${Math.round(s.value / total * 100)}%）</title></circle>`;
      off += len;
      return el;
    }).join('');
    return `<svg class="vdonut" viewBox="0 0 42 42">${arcs}<text x="21" y="20.5" text-anchor="middle" class="vdonut-c">${total}</text><text x="21" y="25" text-anchor="middle" class="vdonut-cs">到访</text></svg>`;
  }

  let _stored = [];
  let _trendWin = 30;
  let _wired = false;
  let _tableRows = [], _retVids = new Set(), _tablePage = 0, _tableQuery = '', _compareWin = 7;
  const TABLE_PAGE = 15;

  function fmtDateTime(ts) {
    const d = new Date(ts);
    return `${localDay(ts)} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  }

  function renderTable() {
    const body = document.getElementById('vtBody');
    if (!body) return;
    const q = _tableQuery.trim().toLowerCase();
    let rows = _tableRows;
    if (q) rows = rows.filter(r => ((r.city || '') + ' ' + (r.country || '')).toLowerCase().includes(q));
    const pages = Math.max(1, Math.ceil(rows.length / TABLE_PAGE));
    if (_tablePage >= pages) _tablePage = pages - 1;
    if (_tablePage < 0) _tablePage = 0;
    const slice = rows.slice(_tablePage * TABLE_PAGE, (_tablePage + 1) * TABLE_PAGE);
    body.innerHTML = slice.map(r => {
      const flag = flagFromCode(r.code);
      const place = [r.city, r.country].filter(Boolean).join(', ') || '未知';
      const ret = r.vid && _retVids.has(r.vid);
      const badge = ret ? '<span class="vt-badge ret">回访</span>' : '<span class="vt-badge new">新</span>';
      return `<tr><td>${fmtDateTime(r.created_at)}</td><td>${flag ? flag + ' ' : ''}${place}</td><td>${badge}</td></tr>`;
    }).join('') || '<tr><td colspan="3" class="vmuted">无匹配记录</td></tr>';
    const info = document.getElementById('vtInfo');
    if (info) info.textContent = `${rows.length} 条 · 第 ${_tablePage + 1}/${pages} 页`;
  }

  function renderCompare() {
    const el = document.getElementById('visitorCompare');
    if (!el) return;
    const withTime = _stored.filter(v => v.created_at);
    const now = Date.now(), dayMs = 86400000, W = _compareWin;
    const inWin = (lo, hi) => withTime.filter(v => { const a = now - new Date(v.created_at); return a >= lo * dayMs && a < hi * dayMs; });
    const cur = inWin(0, W), prev = inWin(W, 2 * W);
    const uniq = a => new Set(a.map(v => v.vid).filter(Boolean)).size;
    const ctry = a => new Set(a.map(v => v.country).filter(Boolean)).size;
    const row = (l, c, p) => {
      const d = c - p, cls = d > 0 ? 'up' : d < 0 ? 'down' : 'flat', a = d > 0 ? '↑' : d < 0 ? '↓' : '→';
      const pct = p > 0 ? Math.abs(Math.round((c - p) / p * 100)) + '%' : (c > 0 ? '新增' : '—');
      return `<div class="vcmp-row"><span class="vcmp-l">${l}</span><b>${c}</b><span class="vcmp-p">前期 ${p}</span><span class="vcmp-d ${cls}">${a}${pct}</span></div>`;
    };
    el.innerHTML = row('到访', cur.length, prev.length) + row('独立访客', uniq(cur), uniq(prev)) + row('国家/地区', ctry(cur), ctry(prev));
  }

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

    // Returning-visitor set (vid seen on >=2 distinct days) + table source
    const byVidDays = {};
    withTime.forEach(v => { if (v.vid) (byVidDays[v.vid] || (byVidDays[v.vid] = new Set())).add(localDay(v.created_at)); });
    _retVids = new Set(Object.keys(byVidDays).filter(k => byVidDays[k].size > 1));
    _tableRows = withTime;
    renderTable();
    renderCompare();

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
        const wk = withTime.filter(v => now - new Date(v.created_at) < 7 * dayMs).length;
        const pw = withTime.filter(v => { const d = now - new Date(v.created_at); return d >= 7 * dayMs && d < 14 * dayMs; }).length;
        let wow = '';
        if (pw > 0) { const p = Math.round((wk - pw) / pw * 100); wow = `📈 本周较上周 <b>${p >= 0 ? '↑' : '↓'}${Math.abs(p)}%</b>`; }
        else if (wk > 0) wow = `📈 本周 <b>${wk}</b> 次到访`;
        insEl.innerHTML = [
          `🕒 高峰时段 <b>${peakHour}:00</b> 左右`,
          `📅 最活跃 <b>${busyWd}</b>`,
          topC ? `🌍 主要来自 <b>${topC[0]}</b>（${share}%）` : '',
          wow,
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

    // Source composition (donut + legend)
    const cEl = document.getElementById('visitorCountries');
    if (cEl) {
      const byC = {}, codeOf = {};
      stored.forEach(v => { const c = v.country || '未知'; byC[c] = (byC[c] || 0) + 1; if (v.code) codeOf[c] = v.code; });
      const sorted = Object.entries(byC).sort((a, b) => b[1] - a[1]);
      if (!sorted.length) { cEl.innerHTML = '<p class="vmuted">暂无数据</p>'; }
      else {
        const topN = sorted.slice(0, 5);
        const otherVal = sorted.slice(5).reduce((s, x) => s + x[1], 0);
        const slices = topN.map(([c, n], i) => ({ label: c, value: n, code: codeOf[c], color: PALETTE[i] }));
        if (otherVal) slices.push({ label: '其他', value: otherVal, code: '', color: PALETTE[5] });
        const total = stored.length || 1;
        const legend = slices.map(s => {
          const flag = flagFromCode(s.code);
          return `<div class="vlg"><i style="background:${s.color}"></i><span>${flag ? flag + ' ' : ''}${s.label}</span><b>${Math.round(s.value / total * 100)}%</b></div>`;
        }).join('');
        cEl.innerHTML = `<div class="vdonut-wrap">${donutSVG(slices)}<div class="vdonut-legend">${legend}</div></div>`;
      }
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

    // New vs returning visitors (needs the vid column + repeat visits)
    const retEl = document.getElementById('visitorRetention');
    if (retEl) {
      const vids = withTime.filter(v => v.vid);
      if (vids.length >= 2) {
        const byVid = {};
        vids.forEach(v => { (byVid[v.vid] || (byVid[v.vid] = new Set())).add(localDay(v.created_at)); });
        const uniq = Object.keys(byVid).length;
        const ret = Object.values(byVid).filter(s => s.size > 1).length;
        const nw = uniq - ret;
        const rate = uniq ? Math.round(ret / uniq * 100) : 0;
        const total = (nw + ret) || 1;
        retEl.innerHTML =
          `<div class="vret-rate">${rate}%<small>回访率</small></div>` +
          `<div class="vret-bar"><i class="vret-new" style="width:${(nw / total * 100).toFixed(1)}%"></i><i class="vret-ret" style="width:${(ret / total * 100).toFixed(1)}%"></i></div>` +
          `<div class="vret-legend"><span><i class="vdot vdot-new"></i>新访客 ${nw}</span><span><i class="vdot vdot-ret"></i>回访 ${ret}</span></div>`;
      } else {
        retEl.innerHTML = '<p class="vmuted">数据积累中（需多日回访才能统计）</p>';
      }
    }

    // Weekly trend (last 8 weeks)
    const wkEl = document.getElementById('visitorWeekly');
    if (wkEl) {
      const weeks = 8, counts = Array(weeks).fill(0), nowt = Date.now();
      withTime.forEach(v => { const w = Math.floor((nowt - new Date(v.created_at)) / (7 * dayMs)); if (w >= 0 && w < weeks) counts[weeks - 1 - w]++; });
      const labels = counts.map((_, i) => { const ago = weeks - 1 - i; return ago === 0 ? '本周' : ago + ' 周前'; });
      wkEl.innerHTML = withTime.length ? barsSVG(counts, labels) : '<p class="vmuted">暂无数据</p>';
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
      const mr = document.getElementById('mapRangeBtns');
      if (mr) mr.addEventListener('click', e => {
        const b = e.target.closest('button[data-mwin]');
        if (!b) return;
        _mapWin = b.dataset.mwin === 'all' ? 'all' : parseInt(b.dataset.mwin, 10);
        mr.querySelectorAll('button').forEach(x => x.classList.toggle('active', x === b));
        drawMap();
      });
      const ex = document.getElementById('exportCsv');
      if (ex) ex.addEventListener('click', exportCsv);
      const cmp = document.getElementById('compareBtns');
      if (cmp) cmp.addEventListener('click', e => {
        const b = e.target.closest('button[data-cw]');
        if (!b) return;
        _compareWin = parseInt(b.dataset.cw, 10);
        cmp.querySelectorAll('button').forEach(x => x.classList.toggle('active', x === b));
        renderCompare();
      });
      const search = document.getElementById('vtSearch');
      if (search) search.addEventListener('input', () => { _tableQuery = search.value; _tablePage = 0; renderTable(); });
      const prev = document.getElementById('vtPrev'), next = document.getElementById('vtNext');
      if (prev) prev.addEventListener('click', () => { _tablePage--; renderTable(); });
      if (next) next.addEventListener('click', () => { _tablePage++; renderTable(); });
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
