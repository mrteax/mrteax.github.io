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
  let mouseX = W/2, mouseY = H/2;
  document.addEventListener('mousemove', e => { mouseX = e.clientX; mouseY = e.clientY; });
  document.addEventListener('touchmove', e => { mouseX = e.touches[0].clientX; mouseY = e.touches[0].clientY; }, {passive:true});

  function drawP() {
    ctx.clearRect(0,0,W,H);
    const c = getComputedStyle(html).getPropertyValue('--accent').trim();
    dots.forEach(d => {
      const dx = mouseX - d.x, dy = mouseY - d.y;
      const dist = Math.sqrt(dx*dx + dy*dy);
      if (dist < 150) {
        d.x += dx * 0.003;
        d.y += dy * 0.003;
      }
      d.x += d.dx; d.y += d.dy;
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

  // ===== Greeting =====
  const greetMsg = document.getElementById('greetMsg');
  const greetSub = document.getElementById('greetSub');
  if (greetMsg) {
    const h = new Date().getHours();
    const day = new Date().getDay();
    const dn = ['周日','周一','周二','周三','周四','周五','周六'];
    const we = day === 0 || day === 6;
    const rnd = a => a[Math.floor(Math.random() * a.length)];

    const G = {
      0:['这个点还不睡，是和周公有仇吗 🌙','夜猫子集合！熬夜使我快乐，明天使我后悔','失眠的尽头是逛网页，欢迎对号入座','别刷了，再刷天就亮了'],
      6:['天还没亮就起，是要去抢菜吗','早起的鸟儿有虫吃，早起的我只想再睡五分钟','这么早醒，是梦想叫醒了你，还是膀胱'],
      8:[we?'周末还起这么早，时间管理大师本师 👏':`${dn[day]}早，又到了和闹钟搏斗的回合`,'早上好，今天也是被生活温柔摩擦的一天','咖啡已就位，灵魂还在路上 ☕'],
      11:['马上午饭了，“今天吃什么”世纪难题准时上线','上午的 KPI 完成了吗（指摸鱼进度）','越临近饭点，工作效率越高，这很科学'],
      12:['干饭时间到！碳水才是人类挚友 🍚','中午了，是干饭人就站起来','吃饱了才有力气继续发呆'],
      14:['下午犯困很正常，别自责，再续一杯 ☕',we?'周末下午，最适合什么正事都不干':'下午三点，离下班还有亿点点时间','困意来袭，建议假装在深度思考'],
      17:[we?'周末傍晚，岁月静好（指无所事事）':'下班倒计时，灵魂已经先溜出门了','夕阳无限好，可惜人还在工位','晚饭吃啥？比工作更难的题来了'],
      19:[we?'周末的夜晚，请尽情挥霍 ✨':'下班啦！这条命终于又支棱起来了','辛苦一天，给自己倒一杯，干了 🍸','晚上好，今天的班上得值不值？灵魂拷问'],
      22:['该睡了，再刷手机眼睛要罢工了','夜深了，明天还得早起当社畜呢','睡前立个flag：早点睡（然后逛到两点）'],
    };
    const keys = Object.keys(G).map(Number).sort((a, b) => a - b);
    let period = keys[0];
    for (const k of keys) { if (h >= k) period = k; }
    const pool = G[period];

    // Typewriter, like someone actually typing to you
    let typeTimer = null, lastIdx = -1;
    function typeOut(text) {
      clearTimeout(typeTimer);
      greetMsg.classList.add('typing');
      let i = 0;
      (function step() {
        greetMsg.textContent = text.slice(0, i);
        if (i++ <= text.length) typeTimer = setTimeout(step, 42 + Math.random() * 48);
        else greetMsg.classList.remove('typing');
      })();
    }
    function roll() {
      let i; do { i = Math.floor(Math.random() * pool.length); } while (pool.length > 1 && i === lastIdx);
      lastIdx = i;
      typeOut(pool[i]);
    }
    roll();
    greetMsg.style.cursor = 'pointer';
    greetMsg.title = '点我换一句';
    greetMsg.addEventListener('click', roll);

    const visits = parseInt(localStorage.getItem('teax_visits') || '0') + 1;
    localStorage.setItem('teax_visits', String(visits));
    greetSub.textContent = visits === 1
      ? '第一次来？欢迎欢迎，随便逛逛 🎉'
      : rnd([`这是你第 ${visits} 次来，缘分不浅啊`, `第 ${visits} 次光临，再来真要发会员卡了 😎`, `又来啦，第 ${visits} 次，这儿都快是你家了`]);

    const ambient = h < 6 ? 'night' : h < 12 ? 'morning' : h < 18 ? 'afternoon' : h < 22 ? 'evening' : 'night';
    document.body.classList.add(ambient);

    // ---- Weather-aware quip (reuses the visitor-map IP geolocation) ----
    let weatherDone = false;
    function weatherQuip(t, code, city) {
      t = Math.round(t);
      const C = city ? city + ' ' : '';
      let cond;
      if (code <= 1) cond = '大晴天 ☀️';
      else if (code <= 3) cond = '阴天 ☁️';
      else if (code === 45 || code === 48) cond = '有雾 🌫️';
      else if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) cond = '在下雨 🌧️';
      else if ((code >= 71 && code <= 77) || code === 85 || code === 86) cond = '在下雪 ❄️';
      else if (code >= 95) cond = '打雷下雨 ⛈️';
      else cond = '天气一般';
      let tail;
      if (t >= 33) tail = '，热到融化，空调和西瓜走起 🥵';
      else if (t >= 28) tail = '，有点热，短袖安排上';
      else if (t <= 3) tail = '，冷到原地结冰，秋裤别省 🥶';
      else if (t <= 12) tail = '，降温了，多穿件别硬撑';
      else tail = rnd(['，体感刚刚好', '，适合出门浪一圈', '，温度还算给面子']);
      return `${C}现在 ${t}°，${cond}${tail}`;
    }
    async function fetchWeather(geo) {
      if (weatherDone || !geo || geo.lat == null) return;
      weatherDone = true;
      try {
        const r = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${geo.lat}&longitude=${geo.lon}&current=temperature_2m,weather_code&timezone=auto`);
        const d = await r.json();
        const cur = d && d.current;
        if (cur && cur.temperature_2m != null && greetSub) {
          greetSub.textContent = weatherQuip(cur.temperature_2m, cur.weather_code, geo.city);
        }
      } catch (e) { weatherDone = false; }
    }
    try { const g = sessionStorage.getItem('teax_geo'); if (g) fetchWeather(JSON.parse(g)); } catch (e) {}
    window.addEventListener('teax:geo', e => fetchWeather(e.detail));
  }

  // ===== Daily item detail modal =====
  const dModal = document.getElementById('dModal');
  function fill(id, html) { const el = document.getElementById(id); if (el) el.innerHTML = html; }
  function fillText(id, txt) { const el = document.getElementById(id); if (el) el.textContent = txt; }
  function openDModal() {
    if (!dModal) return;
    dModal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }
  function closeDModal() {
    if (!dModal) return;
    dModal.classList.add('hidden');
    document.body.style.overflow = '';
  }
  if (dModal) {
    document.getElementById('dModalClose').addEventListener('click', closeDModal);
    dModal.addEventListener('click', e => { if (e.target === dModal) closeDModal(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeDModal(); });
  }

  function showCocktail(c) {
    const col = document.getElementById('dmColor');
    if (c.img) { col.style.background = `url(${c.img}) center/cover`; col.style.height = '180px'; }
    else { col.style.background = c.color; col.style.height = '90px'; }
    fillText('dmLabel', '🍸 每日一杯');
    fillText('dmName', c.name);
    fillText('dmZh', c.zh);
    fill('dmMeta', `<span>🥃 ${c.glass}</span><span>🔧 ${c.method}</span><span>${c.strength === 'strong' ? '🔥 高酒精' : c.strength === 'light' ? '🌿 低酒精' : '⚖️ 中等'}</span>`);
    fillText('dmDesc', c.desc);
    fill('dmList', (c.ingredients || []).map(i => `<li>${i}</li>`).join(''));
    document.getElementById('dmList').style.display = (c.ingredients && c.ingredients.length) ? '' : 'none';
    fill('dmTags', (c.flavor || []).map(f => `<span>${f}</span>`).join(''));
    const more = document.getElementById('dmMore');
    more.textContent = '查看全部鸡尾酒 →'; more.href = `/cocktails.html#${c.id}`;
    openDModal();
  }

  function showTea(t) {
    const col = document.getElementById('dmColor');
    col.style.background = t.color; col.style.height = '90px';
    fillText('dmLabel', '🍵 每日一茶');
    fillText('dmName', t.nameZh);
    fillText('dmZh', t.name);
    fill('dmMeta', [t.origin && `<span>📍 ${t.origin}</span>`, t.brewTemp && `<span>🌡️ ${t.brewTemp}</span>`, t.brewTime && `<span>⏱️ ${t.brewTime}</span>`].filter(Boolean).join(''));
    fillText('dmDesc', t.highlights);
    document.getElementById('dmList').style.display = 'none';
    fill('dmTags', (t.flavor || []).map(f => `<span>${f}</span>`).join(''));
    const more = document.getElementById('dmMore');
    more.textContent = '查看全部茶百科 →'; more.href = '/tea.html';
    openDModal();
  }

  // Daily cocktail
  const dayIdx = Math.floor((Date.now() - new Date(new Date().getFullYear(),0,0)) / 86400000);
  if (typeof COCKTAILS !== 'undefined') {
    const c = COCKTAILS[dayIdx % COCKTAILS.length];
    if (c.img) { $('#cColor').style.background = `url(${c.img}) center/cover`; }
    else { $('#cColor').style.background = c.color; }
    $('#cName').textContent = c.name;
    $('#cZh').textContent = c.zh;
    $('#cDesc').textContent = c.desc;
    const cm = $('#cMore'); if (cm) cm.href = `/cocktails.html#${c.id}`;
    const card = $('#dailyCocktail');
    if (card) {
      card.addEventListener('click', e => { if (!e.target.closest('.daily-more')) showCocktail(c); });
      card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); showCocktail(c); } });
    }
  }

  // Daily tea
  if (typeof TEAS !== 'undefined') {
    const t = TEAS[dayIdx % TEAS.length];
    $('#tColor').style.background = t.color;
    $('#tName').textContent = t.nameZh;
    $('#tZh').textContent = t.name;
    $('#tDesc').textContent = t.highlights;
    const card = $('#dailyTea');
    if (card) {
      card.addEventListener('click', e => { if (!e.target.closest('.daily-more')) showTea(t); });
      card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); showTea(t); } });
    }
  }

  // Daily tips
  if (typeof TRAILS !== 'undefined') { const t = TRAILS[dayIdx%TRAILS.length]; const el=$('#dTrail'); if(el) el.textContent=`今日: ${t.nameZh}`; }
  if (typeof EXERCISES !== 'undefined') { const e = EXERCISES[dayIdx%EXERCISES.length]; const el=$('#dExercise'); if(el) el.textContent=`今日: ${e.nameZh}`; }
  if (typeof TENNIS_TIPS !== 'undefined') { const t = TENNIS_TIPS[dayIdx%TENNIS_TIPS.length]; const el=$('#dTennis'); if(el) el.textContent=`今日: ${t.nameZh}`; }
  if (typeof SKI_RESORTS !== 'undefined') { const s = SKI_RESORTS[dayIdx%SKI_RESORTS.length]; const el=$('#dSki'); if(el) el.textContent=`推荐: ${s.nameZh}`; }
  if (typeof SURF_SPOTS !== 'undefined') { const s = SURF_SPOTS[dayIdx%SURF_SPOTS.length]; const el=$('#dSurf'); if(el) el.textContent=`推荐: ${s.nameZh}`; }

  // ===== Daily Quote =====
  const QUOTES = [
    {text:"每个人都有属于自己的一片森林。迷失的人迷失了，相逢的人会再相逢。",from:"村上春树「挪威的森林」"},
    {text:"我们都在阴沟里，但仍有人仰望星空。",from:"王尔德"},
    {text:"生活不是我们活过的日子，而是我们记住的日子。",from:"马尔克斯「活着为了讲述」"},
    {text:"人生如逆旅，我亦是行人。",from:"苏轼「临江仙」"},
    {text:"你要做一个不动声色的大人了。不准情绪化，不准偷偷想念，不准回头看。",from:"村上春树「挪威的森林」"},
    {text:"温柔的夜色里有温柔的你，温柔的黎明里有温柔的花。",from:"海子"},
    {text:"人生天地间，忽如远行客。",from:"「古诗十九首」"},
    {text:"黑夜无论怎样悠长，白昼总会到来。",from:"莎士比亚「麦克白」"},
    {text:"当你穿过了暴风雨，你就不再是原来那个人。",from:"村上春树「海边的卡夫卡」"},
    {text:"世界上只有一种真正的英雄主义，就是认清了生活的真相后还依然热爱它。",from:"罗曼·罗兰"},
    {text:"把每一个黎明看作生命的开始，把每一个黄昏看作生命的小结。",from:"约翰·罗斯金"},
    {text:"一个人知道自己为什么而活，就可以忍受任何一种生活。",from:"尼采"},
    {text:"既然选择了远方，便只顾风雨兼程。",from:"汪国真「热爱生命」"},
    {text:"我慢慢地、慢慢地了解到，所谓父女母子一场，只不过意味着，你和他的缘分就是今生今世不断地在目送他的背影渐行渐远。",from:"龙应台「目送」"},
    {text:"活着这件事本身，就是最了不起的才华。",from:"渡边淳一"},
    {text:"这世上的事情，没有比从容不迫地生活更好的了。",from:"蒙田"},
    {text:"我用什么才能留住你？我给你贫穷的街道、绝望的日落、破败郊区的月亮。我给你一个久久地望着孤月的人的悲哀。",from:"博尔赫斯"},
    {text:"你不愿意种花，你说，我不愿看见它一点点凋落。是的，为了避免结束，你避免了一切开始。",from:"顾城"},
    {text:"我来不及认真地年轻，待明白过来时，只能选择认真地老去。",from:"三毛"},
    {text:"向来缘浅，奈何情深。",from:"顾漫「何以笙箫默」"},
    {text:"愿你的生命中有够多的云翳，来造成一个美丽的黄昏。",from:"冰心 译 · 泰戈尔"},
    {text:"人生不过如此，且行且珍惜。",from:"林语堂「人生不过如此」"},
    {text:"只有流过血的手指，才能弹出世间的绝唱。",from:"泰戈尔"},
    {text:"不乱于心，不困于情。不畏将来，不念过往。如此，安好。",from:"丰子恺"},
    {text:"岁月极美，在于它必然的流逝。春花、秋月、夏日、冬雪。",from:"三毛"},
    {text:"万物皆有裂痕，那是光照进来的地方。",from:"莱昂纳德·科恩"},
    {text:"纵使黑夜吞噬了一切，太阳还可以重新回来。",from:"汪国真"},
    {text:"人的一切痛苦，本质上都是对自己无能的愤怒。",from:"王小波"},
    {text:"所有的大人都曾经是小孩，虽然只有少数人记得。",from:"圣-埃克苏佩里「小王子」"},
    {text:"最是人间留不住，朱颜辞镜花辞树。",from:"王国维「蝶恋花」"},

    {text:"山有木兮木有枝，心悦君兮君不知。",from:"「越人歌」"},
    {text:"长亭外，古道边，芳草碧连天。晚风拂柳笛声残，夕阳山外山。",from:"李叔同「送别」"},
    {text:"我有一瓢酒，可以慰风尘。",from:"韦应物"},
    {text:"醉后不知天在水，满船清梦压星河。",from:"唐温如"},
    {text:"此心安处是吾乡。",from:"苏轼「定风波」"},
    {text:"大闹一场，悄然离去。",from:"金庸"},
    {text:"人间烟火气，最抚凡人心。",from:"民谚"},
    {text:"掬水月在手，弄花香满衣。",from:"于良史"},
    {text:"从前的日色变得慢，车，马，邮件都慢，一生只够爱一个人。",from:"木心「从前慢」"},
    {text:"凡是过往，皆为序章。",from:"莎士比亚「暴风雨」"},
    {text:"人生得意须尽欢，莫使金樽空对月。",from:"李白「将进酒」"},
    {text:"不以物喜，不以己悲。",from:"范仲淹「岳阳楼记」"},
    {text:"生如夏花之绚烂，死如秋叶之静美。",from:"泰戈尔「飞鸟集」"},
    {text:"我只愿面朝大海，春暖花开。",from:"海子"},
    {text:"如果有来生，要做一棵树，站成永恒，没有悲欢的姿势。",from:"三毛"},
    {text:"你若爱，生活哪里都可爱。你若恨，生活哪里都可恨。",from:"丰子恺"},
    {text:"人的一生应当这样度过：当他回首往事的时候，不会因为碌碌无为而羞耻。",from:"奥斯特洛夫斯基"},
    {text:"故人入我梦，明我长相忆。",from:"杜甫"},
    {text:"人生到处知何似，应似飞鸿踏雪泥。",from:"苏轼「和子由渑池怀旧」"},
    {text:"有约不来过夜半，闲敲棋子落灯花。",from:"赵师秀「约客」"},
    {text:"你站在桥上看风景，看风景的人在楼上看你。明月装饰了你的窗子，你装饰了别人的梦。",from:"卞之琳「断章」"},
    {text:"但愿人长久，千里共婵娟。",from:"苏轼「水调歌头」"},
    {text:"若只如初见。",from:"纳兰性德「木兰花令」"},
    {text:"真正重要的东西，用眼睛是看不见的，要用心去感受。",from:"圣-埃克苏佩里「小王子」"},
    {text:"余生很贵，请勿浪费。",from:"民谚"},
    {text:"尽吾志也而不能至者，可以无悔矣。",from:"王安石「游褒禅山记」"},
    {text:"春风得意马蹄疾，一日看尽长安花。",from:"孟郊「登科后」"},
    {text:"浮生若梦，为欢几何。",from:"李白「春夜宴桃李园序」"},
    {text:"世事一场大梦，人生几度秋凉。",from:"苏轼「西江月」"},
    {text:"愿你出走半生，归来仍是少年。",from:"苏轼（后人集句）"},

    {text:"Not all those who wander are lost.",from:"J.R.R. Tolkien"},
    {text:"We are all in the gutter, but some of us are looking at the stars.",from:"Oscar Wilde"},
    {text:"For what it's worth: it's never too late to be whoever you want to be.",from:"F. Scott Fitzgerald"},
    {text:"And, when you want something, all the universe conspires in helping you to achieve it.",from:"Paulo Coelho, The Alchemist"},
    {text:"It is only with the heart that one can see rightly; what is essential is invisible to the eye.",from:"Antoine de Saint-Exupéry, The Little Prince"},
    {text:"The world breaks everyone, and afterward many are strong at the broken places.",from:"Ernest Hemingway"},
    {text:"I took a deep breath and listened to the old brag of my heart: I am, I am, I am.",from:"Sylvia Plath"},
    {text:"Whatever our souls are made of, his and mine are the same.",from:"Emily Brontë, Wuthering Heights"},
    {text:"Tomorrow is always fresh, with no mistakes in it yet.",from:"L.M. Montgomery"},
    {text:"Stars can't shine without darkness.",from:"D.H. Sidebottom"},
    {text:"Wherever you go, go with all your heart.",from:"Confucius"},
    {text:"The wound is the place where the Light enters you.",from:"Rumi"},
    {text:"We accept the love we think we deserve.",from:"Stephen Chbosky"},
    {text:"To live is the rarest thing in the world. Most people exist, that is all.",from:"Oscar Wilde"},
    {text:"What we know is a drop, what we don't know is an ocean.",from:"Isaac Newton"},
    {text:"In the middle of winter I at last discovered that there was in me an invincible summer.",from:"Albert Camus"},
    {text:"Do not go gentle into that good night.",from:"Dylan Thomas"},
    {text:"Hope is the thing with feathers that perches in the soul.",from:"Emily Dickinson"},
    {text:"Everything you can imagine is real.",from:"Pablo Picasso"},
    {text:"And still, after all this time, the sun never says to the earth, 'You owe me.'",from:"Hafiz"},
    {text:"The only way out is through.",from:"Robert Frost"},
    {text:"Two roads diverged in a wood, and I — I took the one less traveled by.",from:"Robert Frost"},
    {text:"Beauty begins the moment you decide to be yourself.",from:"Coco Chanel"},
    {text:"There is no greater agony than bearing an untold story inside you.",from:"Maya Angelou"},
    {text:"It does not do to dwell on dreams and forget to live.",from:"J.K. Rowling"},
    {text:"The night is darkest just before the dawn.",from:"Thomas Fuller"},
    {text:"We are such stuff as dreams are made on.",from:"William Shakespeare, The Tempest"},
    {text:"Live in the sunshine, swim the sea, drink the wild air.",from:"Ralph Waldo Emerson"},
    {text:"Nothing gold can stay.",from:"Robert Frost"},
    {text:"Time you enjoy wasting is not wasted time.",from:"Marthe Troly-Curtin"},
  ];

  // Interleave Chinese & English so they alternate instead of clustering
  (() => {
    const isCN = s => /[\u4e00-\u9fff]/.test(s);
    const cn = QUOTES.filter(q => isCN(q.text));
    const en = QUOTES.filter(q => !isCN(q.text));
    if (!cn.length || !en.length) return;
    const ratio = Math.max(1, Math.round(cn.length / en.length)); // ~CN per EN
    const mixed = [];
    let ci = 0, ei = 0, sinceEn = 0;
    while (ci < cn.length || ei < en.length) {
      if (ci < cn.length) { mixed.push(cn[ci++]); sinceEn++; }
      if (ei < en.length && (sinceEn >= ratio || ci >= cn.length)) { mixed.push(en[ei++]); sinceEn = 0; }
    }
    QUOTES.length = 0;
    QUOTES.push(...mixed);
  })();

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

  // ===== Console easter egg =====
  try {
    console.log('%c✨ Tea X', 'color:#b07d4f;font-size:22px;font-weight:900');
    console.log('%c嘿，被你抓到啦 👀 既然都打开控制台了，说明你也是同道中人。摸鱼愉快，别被老板发现～', 'color:#999;font-size:13px');
  } catch (e) {}

})();
