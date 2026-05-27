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

  // AI News (latest story in theme card)
  (async () => {
    const el = $('#aiLive');
    if (!el) return;
    try {
      const res = await fetch('https://hn.algolia.com/api/v1/search_by_date?query=AI+LLM+GPT+OpenAI+Claude+Gemini&tags=story&hitsPerPage=5');
      const data = await res.json();
      const stories = (data.hits||[]).filter(h=>h.title && (h.points||0) >= 1);
      if (stories.length) {
        const s = stories[0];
        const url = s.url || 'https://news.ycombinator.com/item?id='+s.objectID;
        el.textContent = s.title.length > 50 ? s.title.substring(0,50)+'\u2026' : s.title;
        const link = $('#aiTheme');
        if (link) link.href = url;
      } else {
        el.textContent = 'HN \u6700\u65b0 AI \u8d44\u8baf \u2192';
      }
    } catch(e) {
      el.textContent = 'HN \u6700\u65b0 AI \u8d44\u8baf \u2192';
    }
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

  // ===== Daily Quote =====
  const QUOTES = [
    {text:"每个人都有属于自己的一片森林，也许我们从来不曾去过，但它一直在那里，总会在那里。迷失的人迷失了，相逢的人会再相逢。",from:"村上春树「挪威的森林」"},
    {text:"不要同情自己，同情自己是卑劣懦夫干的勾当。",from:"村上春树「挪威的森林」"},
    {text:"死并非生的对立面，而作为生的一部分永存。",from:"村上春树「挪威的森林」"},
    {text:"哪里会有人喜欢孤独，不过是不喜欢失望罢了。",from:"村上春树「挪威的森林」"},
    {text:"不管全世界所有人怎么说，我都认为自己的感受才是正确的。无论别人怎么看，我绝不打乱自己的节奏。",from:"村上春树「挪威的森林」"},
    {text:"如果你掉进了黑暗里，你能做的，不过是静心等待，直到你的双眼适应黑暗。",from:"村上春树「挪威的森林」"},
    {text:"我们的正常之处，就在于自己懂得自己的不正常。",from:"村上春树「挪威的森林」"},
    {text:"少年时我们追求激情，成熟后却迷恋平庸，在我们寻找、伤害、背离之后，还能一如既往地相信爱情，这是一种勇气。",from:"村上春树「挪威的森林」"},
    {text:"世上有可以挽回的和不可挽回的事，而时间经过就是一种不可挽回的事。",from:"村上春树「挪威的森林」"},
    {text:"你要做一个不动声色的大人了。不准情绪化，不准偷偷想念，不准回头看。去过自己另外的生活。你要听话，不是所有的鱼都会生活在同一片海里。",from:"村上春树「挪威的森林」"},
    {text:"纵令听其自然，世事的长河也还是要流往其应流的方向，而即使再竭尽人力，该受伤害的人也无由幸免。",from:"村上春树「挪威的森林」"},
    {text:"希望你下辈子不要改名，这样我会好找你一点。",from:"村上春树「挪威的森林」"},
    {text:"我一直以为人是慢慢变老的，其实不是，人是一瞬间变老的。",from:"村上春树「舞！舞！舞！」"},
    {text:"当暴风雨结束，你不会记得自己是怎样活下来的，你甚至不确定暴风雨真的结束了。但有一件事是确定的——当你穿过了暴风雨，你就不再是原来那个人。",from:"村上春树「海边的卡夫卡」"},
    {text:"若什么都不舍弃，便什么都不能获取。",from:"村上春树「1Q84」"},
    {text:"孤独一人也没关系，只要能发自内心地爱着一个人，人生就会有救。哪怕不能和他生活在一起。",from:"村上春树「1Q84」"},
    {text:"不必太纠结于当下，也不必太忧虑未来，当你经历过一些事情的时候，眼前的风景已经和从前不一样了。",from:"村上春树「1Q84」"},
    {text:"于是我关闭我的语言，关闭我的心，深沉地悲伤就此溶入了无言的寂静里。",from:"村上春树「且听风吟」"},
    {text:"所谓完美的文章并不存在，就像完美的绝望不存在一样。",from:"村上春树「且听风吟」"},
    {text:"人不是慢慢变老的，而是一瞬变老的。",from:"村上春树「舞！舞！舞！」"},
    {text:"我渐渐能意会到，深刻并不等于接近事实。",from:"村上春树「挪威的森林」"},
    {text:"刚刚好，看见你幸福的样子，于是幸福着你的幸福。",from:"村上春树「国境以南 太阳以西」"},
    {text:"鱼说，你看不到我眼中的泪，因为我在水中。水说，我能感觉到你的泪，因为你在我心中。",from:"村上春树「奇鸟行状录」"},
    {text:"有些东西，不是说全无意义，它在某个特定的时间里会发挥作用，就像下雨天的伞。",from:"村上春树「世界尽头与冷酷仙境」"},
    {text:"我或许败北，或许迷失自己，或许哪里也抵达不了，或许我已失去一切，任凭怎么挣扎也只是徒劳，或许我只是徒然掬一把废墟灰烬。但也要姑且向前走，向那无人之境。",from:"村上春树「海边的卡夫卡」"},
    {text:"世间万物无一不是隐喻。",from:"村上春树「海边的卡夫卡」"},
    {text:"从沙尘暴中逃出的你，已不再是跨入沙尘暴时的你了。",from:"村上春树「海边的卡夫卡」"},
    {text:"用自己的眼去看，用自己的心去感受。凡事只要看得淡些，就没有什么可忧虑的了。",from:"村上春树"},
    {text:"痛苦对每个人而言，只有自己才能体味其中的苦涩。我们不过是满怀各自的痛苦在这世上走一遭罢了。",from:"村上春树「斯普特尼克恋人」"},
    {text:"最好不要对距离那些人太近。不必太近，也不必太远，只要能感受到彼此的温暖，这样就够了。",from:"村上春树"},
  ];

  const quoteEl = document.getElementById('dailyQuote');
  const quoteFrom = document.getElementById('quoteFrom');
  const quoteBox = document.getElementById('quoteBox');
  let quoteIdx = dayIdx % QUOTES.length;

  function showQuote(idx) {
    const q = QUOTES[idx];
    if (!quoteEl || !quoteFrom) return;
    quoteEl.style.opacity = 0;
    quoteFrom.style.opacity = 0;
    setTimeout(() => {
      quoteEl.textContent = q.text;
      quoteFrom.textContent = '—— ' + q.from;
      quoteEl.style.opacity = 1;
      quoteFrom.style.opacity = 1;
    }, 200);
  }

  if (quoteBox) {
    showQuote(quoteIdx);
    quoteBox.addEventListener('click', () => {
      quoteIdx = (quoteIdx + 1) % QUOTES.length;
      showQuote(quoteIdx);
    });
  }

})();
