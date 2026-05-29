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
    url: '',   // 例：'https://abcd1234.supabase.co'
    key: '',   // anon public key
    table: 'visitors',
  };
  const useRemote = !!(SUPABASE.url && SUPABASE.key);

  const svg = document.getElementById('vmap');
  const pinsG = document.getElementById('vmapPins');
  const greetEl = document.getElementById('visitorGreet');
  const statEl = document.getElementById('mapStat');
  const noteEl = document.getElementById('visitorNote');
  if (!svg || !pinsG) return;

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
          `?select=lat,lon,city,country,code&order=created_at.desc&limit=1000`;
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
      list.push({ lat: v.lat, lon: v.lon, city: v.city, country: v.country, code: v.code });
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
    const all = you ? stored.concat([you]) : stored;
    const cities = aggregate(all);

    pinsG.innerHTML = '';
    cities.forEach(c => {
      const [x, y] = project(c.lat, c.lon);
      const isYou = you && Math.round(c.lat) === Math.round(you.lat) && Math.round(c.lon) === Math.round(you.lon);
      const label = [c.city, c.country].filter(Boolean).join(', ') + (c.count > 1 ? ` · ${c.count}` : '');
      addPin(x, y, { r: Math.min(8, 3 + Math.log2(c.count + 1) * 1.6), you: isYou, label });
    });

    const visits = all.length;
    const countries = new Set(all.map(v => v.country).filter(Boolean)).size;
    if (statEl) statEl.textContent = `${visits} 次到访 · ${countries} 个国家/地区`;
    if (noteEl) {
      noteEl.textContent = useRemote
        ? '地图上是来自世界各地访客的真实落点'
        : '当前仅记录你本机的足迹，配置后即可显示全球访客（见 js/visitor-map.js）';
    }
  }

  (async () => {
    const you = await geolocate();
    if (you && you.lat != null) {
      const flag = you.flag || flagFromCode(you.code);
      const place = [you.city, you.country].filter(Boolean).join(', ') || '某个角落';
      if (greetEl) greetEl.innerHTML = `👋 你好，来自 <b>${flag ? flag + ' ' : ''}${place}</b> 的朋友`;
      await saveVisitor(you);
    } else if (greetEl) {
      greetEl.textContent = '👋 你好，欢迎来到 Tea X';
    }
    await render(you);
  })();
})();
