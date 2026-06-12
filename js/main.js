(() => {
  'use strict';
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];

  // ===== Theme =====
  const html = document.documentElement;
  const saved = localStorage.getItem('theme') || (matchMedia('(prefers-color-scheme:dark)').matches ? 'dark' : 'light');
  html.dataset.theme = saved;
  $('#themeToggle').addEventListener('click', () => {
    const next = html.dataset.theme === 'dark' ? 'light' : 'dark';
    html.dataset.theme = next;
    localStorage.setItem('theme', next);
  });

  // ===== Particles =====
  const canvas = $('#particles');
  const ctx = canvas.getContext('2d');
  let W, H, dots = [];

  function initParticles() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
    dots = Array.from({ length: 40 }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      r: Math.random() * 2 + 1,
      dx: (Math.random() - 0.5) * 0.3,
      dy: (Math.random() - 0.5) * 0.3,
      o: Math.random() * 0.5 + 0.2,
    }));
  }

  function drawParticles() {
    ctx.clearRect(0, 0, W, H);
    const style = getComputedStyle(document.documentElement);
    const color = style.getPropertyValue('--accent').trim();
    dots.forEach(d => {
      d.x += d.dx; d.y += d.dy;
      if (d.x < 0) d.x = W; if (d.x > W) d.x = 0;
      if (d.y < 0) d.y = H; if (d.y > H) d.y = 0;
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.globalAlpha = d.o;
      ctx.fill();
    });
    ctx.globalAlpha = 1;
    requestAnimationFrame(drawParticles);
  }

  initParticles();
  drawParticles();
  window.addEventListener('resize', initParticles);

  // ===== Clock =====
  const WEEK = ['日','一','二','三','四','五','六'];
  function tickClock() {
    const d = new Date();
    $('#clockTime').textContent = String(d.getHours()).padStart(2,'0') + ':' + String(d.getMinutes()).padStart(2,'0');
    $('#clockSeconds').textContent = String(d.getSeconds()).padStart(2,'0');
    $('#clockDate').textContent = `${d.getFullYear()}/${d.getMonth()+1}/${d.getDate()} 星期${WEEK[d.getDay()]}`;
  }
  tickClock(); setInterval(tickClock, 1000);

  // ===== World Clock =====
  function tickWorldClocks() {
    document.querySelectorAll('.wc-time').forEach(el => {
      const tz = el.dataset.tz;
      try {
        const t = new Date().toLocaleTimeString('en-GB', { timeZone: tz, hour: '2-digit', minute: '2-digit', hour12: false });
        el.textContent = t;
      } catch(e) { el.textContent = '--:--'; }
    });
  }
  tickWorldClocks(); setInterval(tickWorldClocks, 1000);

  // ===== Greeting =====
  const h = new Date().getHours();
  const greets = [[6,'早上好 ☀️','☀️'],[9,'上午好','🌤️'],[12,'中午好','🌞'],[14,'下午好','☕'],[18,'傍晚好','🌅'],[22,'晚上好','🌙'],[24,'夜深了','🌙']];
  for (const [t, text, icon] of greets) {
    if (h < t) { $('#greetText').textContent = text; $('#greetIcon').textContent = icon; break; }
  }

  // ===== Daily Cocktail =====
  if (typeof COCKTAILS !== 'undefined') {
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(),0,0)) / 86400000);
    const c = COCKTAILS[dayOfYear % COCKTAILS.length];
    if (c.img) {
      $('#cocktailColor').style.background = `url(${c.img}) center/cover`;
      $('#cocktailColor').style.height = '140px';
    } else {
      $('#cocktailColor').style.background = c.color;
    }
    $('#cocktailName').textContent = c.name;
    $('#cocktailZh').textContent = c.zh;
    $('#cocktailDesc').textContent = c.desc;
    $('#cocktailRecipe').innerHTML = c.ingredients.map(i => `<span>${i}</span>`).join('');
    $('#cocktailTags').innerHTML = c.flavor.map(f => `<span>${f}</span>`).join('') +
      `<span>${c.method}</span><span>${c.glass}</span>`;
    $('#cocktailCount').textContent = COCKTAILS.length;
    $('.cocktail-more').href = `/cocktails.html#${c.id}`;
  }

  // ===== Timer =====
  const CIRC = 2 * Math.PI * 90;
  let tmDur = 300, tmRem = 300, tmInt = null, tmOn = false;
  function fmtT(s) { return String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0'); }
  function updTm() { $('#timerNum').textContent = fmtT(tmRem); }

  $$('.tp').forEach(b => b.addEventListener('click', () => {
    if (tmOn) { clearInterval(tmInt); tmInt = null; tmOn = false; $('#tmPause').classList.add('hidden'); $('#tmStart').classList.remove('hidden'); }
    $$('.tp').forEach(x => x.classList.remove('active')); b.classList.add('active');
    tmDur = tmRem = +b.dataset.s; updTm();
  }));

  $('#tmStart').addEventListener('click', () => {
    if (tmRem <= 0) return; tmOn = true;
    $('#tmStart').classList.add('hidden'); $('#tmPause').classList.remove('hidden');
    tmInt = setInterval(() => { tmRem--; updTm(); if (tmRem <= 0) { clearInterval(tmInt); tmOn = false; $('#tmPause').classList.add('hidden'); $('#tmStart').classList.remove('hidden'); try { const cx = new AudioContext(); [523,659,784].forEach((f,i) => { const o=cx.createOscillator(),g=cx.createGain(); o.frequency.value=f; g.gain.setValueAtTime(.12,cx.currentTime+i*.2); g.gain.exponentialRampToValueAtTime(.001,cx.currentTime+i*.2+.4); o.connect(g); g.connect(cx.destination); o.start(cx.currentTime+i*.2); o.stop(cx.currentTime+i*.2+.4); }); } catch(e){} }}, 1000);
  });
  $('#tmPause').addEventListener('click', () => { clearInterval(tmInt); tmOn = false; $('#tmPause').classList.add('hidden'); $('#tmStart').classList.remove('hidden'); });
  $('#tmReset').addEventListener('click', () => { clearInterval(tmInt); tmOn = false; tmRem = tmDur; updTm(); $('#tmPause').classList.add('hidden'); $('#tmStart').classList.remove('hidden'); });
  updTm();

  // ===== Notes =====
  const notes = $('#notesArea');
  notes.value = localStorage.getItem('teax_notes') || '';
  notes.addEventListener('input', () => { clearTimeout(notes._t); notes._t = setTimeout(() => localStorage.setItem('teax_notes', notes.value), 600); });

  // ===== JSON =====
  $('#jsonFmt').addEventListener('click', () => { try { $('#jsonInput').value = JSON.stringify(JSON.parse($('#jsonInput').value), null, 2); } catch(e) { alert('JSON 格式错误'); } });
  $('#jsonMin').addEventListener('click', () => { try { $('#jsonInput').value = JSON.stringify(JSON.parse($('#jsonInput').value)); } catch(e) { alert('JSON 格式错误'); } });

  // ===== Base64 =====
  $('#b64Enc').addEventListener('click', () => { try { $('#b64Out').value = btoa(unescape(encodeURIComponent($('#b64In').value))); } catch(e) { $('#b64Out').value = '编码错误'; } });
  $('#b64Dec').addEventListener('click', () => { try { $('#b64Out').value = decodeURIComponent(escape(atob($('#b64In').value.trim()))); } catch(e) { $('#b64Out').value = '解码错误'; } });

  // ===== Color =====
  function hexToRgb(h){h=h.replace('#','');if(h.length===3)h=h.split('').map(c=>c+c).join('');const n=parseInt(h,16);return[(n>>16)&255,(n>>8)&255,n&255]}
  function rgbToHex(r,g,b){return'#'+[r,g,b].map(v=>Math.max(0,Math.min(255,Math.round(v))).toString(16).padStart(2,'0')).join('')}
  function setColor(hex){hex=hex.startsWith('#')?hex:'#'+hex;const[r,g,b]=hexToRgb(hex);$('#colorPick').value=hex;$('#colorSw').style.background=hex;$('#cHex').value=hex;$('#cRgb').value=`${r}, ${g}, ${b}`}
  $('#colorPick').addEventListener('input',()=>setColor($('#colorPick').value));
  $('#cHex').addEventListener('change',()=>{if(/^#?[0-9a-fA-F]{3,6}$/.test($('#cHex').value.trim()))setColor($('#cHex').value.trim())});
  $('#cRgb').addEventListener('change',()=>{const p=$('#cRgb').value.split(/[\s,]+/).map(Number);if(p.length>=3&&p.every(n=>!isNaN(n)))setColor(rgbToHex(p[0],p[1],p[2]))});
  setColor('#ffe000');

  // ===== Password =====
  const CHARS='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  function genPw(){const len=+$('#pwLen').value;const a=new Uint32Array(len);crypto.getRandomValues(a);$('#pwOut').value=[...a].map(v=>CHARS[v%CHARS.length]).join('')}
  $('#pwLen').addEventListener('input',()=>{$('#pwLenV').textContent=$('#pwLen').value});
  $('#pwGen').addEventListener('click',genPw);
  $('#pwCopy').addEventListener('click',()=>navigator.clipboard.writeText($('#pwOut').value));
  genPw();

  // ===== Timestamp =====
  function tickTs(){$('#tsNow').textContent=Math.floor(Date.now()/1000)}
  tickTs(); setInterval(tickTs,1000);
  $('#tsCp').addEventListener('click',()=>navigator.clipboard.writeText($('#tsNow').textContent));
  $('#tsIn').addEventListener('input',e=>{let v=+e.target.value.trim();if(isNaN(v)){$('#tsOut').textContent='—';return}if(v<1e12)v*=1000;const d=new Date(v);$('#tsOut').textContent=isNaN(d)?'无效':d.toLocaleString('zh-CN')});

  // ===== Hash =====
  $('#hashIn').addEventListener('input',async()=>{const t=$('#hashIn').value;if(!t){$('#hSha256').textContent='—';return}const buf=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(t));$('#hSha256').textContent=[...new Uint8Array(buf)].map(b=>b.toString(16).padStart(2,'0')).join('')});
  $('#hSha256').addEventListener('click',()=>{if($('#hSha256').textContent!=='—')navigator.clipboard.writeText($('#hSha256').textContent)});

  // ===== Regex =====
  function testRx(){const p=$('#rxPat').value,f=$('#rxFlg').value,t=$('#rxText').value;if(!p||!t){$('#rxResult').textContent='0 个匹配';$('#rxResult').className='rx-result';return}try{const re=new RegExp(p,f);const m=t.match(re);$('#rxResult').textContent=`${m?m.length:0} 个匹配`;$('#rxResult').className='rx-result'}catch(e){$('#rxResult').textContent='错误: '+e.message;$('#rxResult').className='rx-result has-error'}}
  $('#rxPat').addEventListener('input',testRx);$('#rxFlg').addEventListener('input',testRx);$('#rxText').addEventListener('input',testRx);

  // ===== URL =====
  $('#urlEnc').addEventListener('click',()=>{try{$('#urlOut').value=encodeURIComponent($('#urlIn').value)}catch(e){$('#urlOut').value='错误'}});
  $('#urlDec').addEventListener('click',()=>{try{$('#urlOut').value=decodeURIComponent($('#urlIn').value.trim())}catch(e){$('#urlOut').value='解码错误'}});

  // ===== Text =====
  $('#textIn').addEventListener('input',()=>{const t=$('#textIn').value;$('#textStat').textContent=`${t.length}字 · ${t.trim()?t.trim().split(/\s+/).length:0}词 · ${t?t.split('\n').length:0}行`});
  $$('#toolText .tb').forEach(b=>b.addEventListener('click',()=>{let t=$('#textIn').value;switch(b.dataset.act){case'upper':t=t.toUpperCase();break;case'lower':t=t.toLowerCase();break;case'dedupe':t=[...new Set(t.split('\n'))].join('\n');break;case'sort':t=t.split('\n').sort((a,b)=>a.localeCompare(b,'zh')).join('\n');break}$('#textIn').value=t;$('#textIn').dispatchEvent(new Event('input'))}));


  // ===== AI News (HackerNews Algolia API) =====
  async function fetchAINews() {
    const body = document.getElementById('aiNewsBody');
    try {
      const res = await fetch('https://hn.algolia.com/api/v1/search_by_date?query=AI+LLM+GPT+OpenAI+Claude+Gemini&tags=story&hitsPerPage=20');
      const data = await res.json();
      const stories = (data.hits || []).filter(h => h.title && (h.points || 0) > 2).sort((a, b) => (b.points||0) - (a.points||0));
      if (stories.length > 0) {
        const top = stories[0];
        const url = top.url || `https://news.ycombinator.com/item?id=${top.objectID}`;
        const hrs = Math.floor((Date.now() / 1000 - top.created_at_i) / 3600);
        const ago = hrs < 24 ? `${hrs}h ago` : `${Math.floor(hrs/24)}d ago`;
        body.innerHTML = `<div class="ai-headline"><a href="${url}" target="_blank" rel="noopener">${top.title}</a></div><div class="ai-meta"><span>🔥 ${top.points} points</span><span>💬 ${top.num_comments} comments</span><span>${ago}</span><a class="ai-source" href="https://news.ycombinator.com/item?id=${top.objectID}" target="_blank">HN →</a></div>`;
      } else {
        body.innerHTML = '<div class="ai-loading">暂无最新 AI 动态</div>';
      }
    } catch (e) {
      body.innerHTML = '<div class="ai-loading">加载失败，请稍后刷新</div>';
    }
  }
  fetchAINews();

  // ===== Daily Theme Tips =====
  const dayIdx = Math.floor((Date.now() - new Date(new Date().getFullYear(),0,0)) / 86400000);

  if (typeof TRAILS !== 'undefined' && TRAILS.length) {
    const t = TRAILS[dayIdx % TRAILS.length];
    const el = document.getElementById('dailyTrail');
    if (el) el.textContent = `今日: ${t.nameZh}`;
  }

  if (typeof EXERCISES !== 'undefined' && EXERCISES.length) {
    const e = EXERCISES[dayIdx % EXERCISES.length];
    const el = document.getElementById('dailyExercise');
    if (el) el.textContent = `今日: ${e.nameZh}`;
  }

  if (typeof TENNIS_TIPS !== 'undefined' && TENNIS_TIPS.length) {
    const t = TENNIS_TIPS[dayIdx % TENNIS_TIPS.length];
    const el = document.getElementById('dailyTennis');
    if (el) el.textContent = `今日: ${t.nameZh}`;
  }

})();
