(() => {
  'use strict';
  const $ = s => document.querySelector(s);

  // Theme
  const html = document.documentElement;
  const saved = localStorage.getItem('theme') || (matchMedia('(prefers-color-scheme:dark)').matches ? 'dark' : 'light');
  html.dataset.theme = saved;
  $('#themeToggle').addEventListener('click', () => {
    const n = html.dataset.theme === 'dark' ? 'light' : 'dark';
    html.dataset.theme = n;
    localStorage.setItem('theme', n);
  });

  // Particles
  const canvas = $('#particles'), ctx = canvas.getContext('2d');
  let W, H, dots = [];
  function initP() {
    W = canvas.width = innerWidth; H = canvas.height = innerHeight;
    dots = Array.from({ length: 30 }, () => ({
      x: Math.random()*W, y: Math.random()*H, r: Math.random()*2+.5,
      dx: (Math.random()-.5)*.25, dy: (Math.random()-.5)*.25, o: Math.random()*.4+.15
    }));
  }
  function drawP() {
    ctx.clearRect(0,0,W,H);
    const c = getComputedStyle(html).getPropertyValue('--accent').trim();
    dots.forEach(d => {
      d.x+=d.dx; d.y+=d.dy;
      if(d.x<0)d.x=W; if(d.x>W)d.x=0; if(d.y<0)d.y=H; if(d.y>H)d.y=0;
      ctx.beginPath(); ctx.arc(d.x,d.y,d.r,0,Math.PI*2);
      ctx.fillStyle=c; ctx.globalAlpha=d.o; ctx.fill();
    });
    ctx.globalAlpha=1; requestAnimationFrame(drawP);
  }
  initP(); drawP(); addEventListener('resize', initP);

  // Clock
  const WK = ['日','一','二','三','四','五','六'];
  function tick() {
    const d = new Date();
    $('#clockTime').textContent = `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
    $('#clockSec').textContent = String(d.getSeconds()).padStart(2,'0');
    $('#clockDate').textContent = `${d.getFullYear()}/${d.getMonth()+1}/${d.getDate()} 星期${WK[d.getDay()]}`;
    document.querySelectorAll('.wc b').forEach(el => {
      try { el.textContent = d.toLocaleTimeString('en-GB',{timeZone:el.dataset.tz,hour:'2-digit',minute:'2-digit',hour12:false}); } catch(e){}
    });
  }
  tick(); setInterval(tick, 1000);

  // AI News
  (async () => {
    const body = $('#aiBody');
    try {
      const res = await fetch('https://hn.algolia.com/api/v1/search_by_date?query=AI+LLM+GPT+OpenAI+Claude+Gemini&tags=story&hitsPerPage=20');
      const data = await res.json();
      const stories = (data.hits||[]).filter(h=>h.title).sort((a,b)=>(b.points||0)-(a.points||0));
      if (stories.length) {
        const s = stories[0];
        const url = s.url || `https://news.ycombinator.com/item?id=${s.objectID}`;
        const hrs = Math.floor((Date.now()/1000 - s.created_at_i)/3600);
        const ago = hrs<24 ? `${hrs}h` : `${Math.floor(hrs/24)}d`;
        body.innerHTML = `<div class="ai-title"><a href="${url}" target="_blank">${s.title}</a></div><div class="ai-meta"><span>🔥 ${s.points}</span><span>💬 ${s.num_comments}</span><span>${ago} ago</span><a class="ai-source" href="https://news.ycombinator.com/item?id=${s.objectID}" target="_blank">HN →</a></div>`;
      } else body.innerHTML = '<span class="ai-loading">暂无最新动态</span>';
    } catch(e) { body.innerHTML = '<span class="ai-loading">加载失败</span>'; }
  })();

  // Daily cocktail
  const dayIdx = Math.floor((Date.now() - new Date(new Date().getFullYear(),0,0)) / 86400000);
  if (typeof COCKTAILS !== 'undefined') {
    const c = COCKTAILS[dayIdx % COCKTAILS.length];
    if (c.img) { $('#cColor').style.background = `url(${c.img}) center/cover`; }
    else { $('#cColor').style.background = c.color; }
    $('#cName').textContent = c.name;
    $('#cZh').textContent = c.zh;
    $('#cDesc').textContent = c.desc;
    $('#dailyCocktail').href = `/cocktails.html#${c.id}`;
  }

  // Daily tea
  if (typeof TEAS !== 'undefined') {
    const t = TEAS[dayIdx % TEAS.length];
    $('#tColor').style.background = t.color;
    $('#tName').textContent = t.nameZh;
    $('#tZh').textContent = t.name;
    $('#tDesc').textContent = t.highlights;
    $('#dailyTea').href = `/tea.html`;
  }

  // Daily tips
  if (typeof TRAILS !== 'undefined') { const t = TRAILS[dayIdx%TRAILS.length]; const el=$('#dTrail'); if(el) el.textContent=`今日: ${t.nameZh}`; }
  if (typeof EXERCISES !== 'undefined') { const e = EXERCISES[dayIdx%EXERCISES.length]; const el=$('#dExercise'); if(el) el.textContent=`今日: ${e.nameZh}`; }
  if (typeof TENNIS_TIPS !== 'undefined') { const t = TENNIS_TIPS[dayIdx%TENNIS_TIPS.length]; const el=$('#dTennis'); if(el) el.textContent=`今日: ${t.nameZh}`; }
  if (typeof SKI_RESORTS !== 'undefined') { const s = SKI_RESORTS[dayIdx%SKI_RESORTS.length]; const el=$('#dSki'); if(el) el.textContent=`推荐: ${s.nameZh}`; }
  if (typeof SURF_SPOTS !== 'undefined') { const s = SURF_SPOTS[dayIdx%SURF_SPOTS.length]; const el=$('#dSurf'); if(el) el.textContent=`推荐: ${s.nameZh}`; }
})();
