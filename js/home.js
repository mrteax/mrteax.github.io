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
    const we = day===0||day===6;
    const G = {
      0:['夜深了，早点休息','晚安，明天见','深夜还在逛？注意身体'],
      6:['这么早就醒了？','清晨的空气最好','早起的人运气好'],
      8:[`${dn[day]}早，今天有什么计划？`,'早上好，新的一天','阳光正好，适合出门'],
      11:['离午饭不远了','上午好，效率最高的时段',`${dn[day]}上午，状态怎么样？`],
      12:['午饭时间到了','中午了，吃点好的','午休一下也不错'],
      14:['下午好，来杯咖啡吧 ☕',`${dn[day]}下午，继续加油`,'下午的阳光很温柔'],
      17:[we?'周末的傍晚最惬意':'快下班了，再坚持一下','夕阳很美的时候','晚饭想吃什么？'],
      19:[we?'周末夜晚，放松一下':'下班了，做点喜欢的事','适合喝一杯的时间 🍸','晚上好，辛苦一天了'],
      22:['夜深了，早点休息','晚安，明天见','深夜还在逛？注意身体'],
    };
    const keys = Object.keys(G).map(Number).sort((a,b)=>a-b);
    let period = keys[0];
    for (const k of keys) { if (h >= k) period = k; }
    const pool = G[period];
    greetMsg.textContent = pool[Math.floor(Math.random()*pool.length)];

    let visits = parseInt(localStorage.getItem('teax_visits')||'0')+1;
    localStorage.setItem('teax_visits', String(visits));
    greetSub.textContent = `第 ${visits} 次来到 Tea X`;

    const ambient = h<6?'night':h<12?'morning':h<18?'afternoon':h<22?'evening':'night';
    document.body.classList.add(ambient);
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
