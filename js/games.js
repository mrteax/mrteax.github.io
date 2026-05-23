(() => {
  'use strict';

  // ===== Tab Switching =====
  const tabs = document.querySelectorAll('.tab');
  const games = document.querySelectorAll('.game');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const target = tab.dataset.game;
      games.forEach(g => {
        g.classList.toggle('hidden', g.id !== `game-${target}`);
      });
    });
  });

  // ===== 🎲 Dice =====
  const DICE_FACES = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
  let diceCount = 1;

  document.querySelectorAll('.dice-num').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.dice-num').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      diceCount = +btn.dataset.count;
      document.getElementById('diceResult').innerHTML = Array(diceCount).fill('<span class="die">⚀</span>').join('');
      document.getElementById('diceTotal').textContent = '';
    });
  });

  document.getElementById('rollDice').addEventListener('click', () => {
    const container = document.getElementById('diceResult');
    const totalEl = document.getElementById('diceTotal');
    let total = 0;
    const results = [];

    for (let i = 0; i < diceCount; i++) {
      const val = Math.floor(Math.random() * 6);
      results.push(val);
      total += val + 1;
    }

    container.innerHTML = results.map(() => '<span class="die rolling">⚀</span>').join('');

    setTimeout(() => {
      container.innerHTML = results.map(v => `<span class="die">${DICE_FACES[v]}</span>`).join('');
      totalEl.textContent = diceCount > 1 ? `合计: ${total}` : '';
    }, 500);
  });

  // ===== 👆 Who Drinks =====
  document.getElementById('addPlayer').addEventListener('click', () => {
    const row = document.querySelector('.player-input-row');
    const count = row.querySelectorAll('.player-input').length;
    const input = document.createElement('input');
    input.className = 'player-input';
    input.placeholder = `玩家 ${count + 1}`;
    row.appendChild(input);
  });

  document.getElementById('pickPlayer').addEventListener('click', () => {
    const inputs = document.querySelectorAll('.player-input');
    const players = [];
    inputs.forEach((inp, i) => {
      const name = inp.value.trim() || inp.placeholder;
      players.push(name);
    });

    if (players.length < 2) return;

    const nameEl = document.querySelector('.picker-name');
    nameEl.classList.add('spinning');
    nameEl.classList.remove('picked');

    let spins = 0;
    const maxSpins = 20;
    const interval = setInterval(() => {
      nameEl.textContent = players[Math.floor(Math.random() * players.length)];
      spins++;
      if (spins >= maxSpins) {
        clearInterval(interval);
        const winner = players[Math.floor(Math.random() * players.length)];
        nameEl.textContent = winner + ' 🍺';
        nameEl.classList.remove('spinning');
        nameEl.classList.add('picked');
      }
    }, 80);
  });

  // ===== 💣 Number Bomb =====
  let bombNum, bombMin, bombMax;

  function resetBomb() {
    bombMin = 1;
    bombMax = 100;
    bombNum = Math.floor(Math.random() * 100) + 1;
    document.querySelector('.bomb-min').textContent = bombMin;
    document.querySelector('.bomb-max').textContent = bombMax;
    document.getElementById('bombInput').value = '';
    document.getElementById('bombInput').min = bombMin;
    document.getElementById('bombInput').max = bombMax;
    document.getElementById('bombMsg').textContent = '';
    document.getElementById('bombMsg').className = 'bomb-msg';
  }

  resetBomb();

  document.getElementById('bombGuess').addEventListener('click', () => {
    const input = document.getElementById('bombInput');
    const msg = document.getElementById('bombMsg');
    const guess = parseInt(input.value);

    if (isNaN(guess) || guess < bombMin || guess > bombMax) {
      msg.textContent = `请输入 ${bombMin} 到 ${bombMax} 之间的数字`;
      msg.className = 'bomb-msg';
      return;
    }

    if (guess === bombNum) {
      msg.textContent = `💥 BOOM！炸弹是 ${bombNum}！你喝！`;
      msg.className = 'bomb-msg boom';
      input.disabled = true;
    } else if (guess < bombNum) {
      bombMin = guess + 1;
      document.querySelector('.bomb-min').textContent = bombMin;
      msg.textContent = `安全 ✓ 大了点…下一位！`;
      msg.className = 'bomb-msg safe';
    } else {
      bombMax = guess - 1;
      document.querySelector('.bomb-max').textContent = bombMax;
      msg.textContent = `安全 ✓ 小了点…下一位！`;
      msg.className = 'bomb-msg safe';
    }

    input.value = '';
    input.min = bombMin;
    input.max = bombMax;
    input.placeholder = `${bombMin} - ${bombMax}`;
  });

  document.getElementById('bombInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') document.getElementById('bombGuess').click();
  });

  document.getElementById('bombReset').addEventListener('click', () => {
    document.getElementById('bombInput').disabled = false;
    resetBomb();
  });

  // ===== 🃏 King's Game =====
  const KING_COMMANDS = [
    '左边的人喝一杯',
    '右边的人喝一杯',
    '对面的人喝一杯',
    '最后一个举手的人喝一杯',
    '全桌干杯！',
    '选一个人跟你对饮',
    '你自己喝两杯',
    '出最新一张自拍给大家看',
    '模仿桌上某个人，被猜中的人喝',
    '讲一个冷笑话，没人笑你就喝',
    '向左边的人说一句土味情话',
    '闭眼喝完这杯',
    '和右边的人石头剪刀布，输的喝',
    '说出三个赞美对面那个人的词',
    '用日语说"干杯"（乾杯 / かんぱい）',
    '今晚不能说"我"，说了就喝一口',
    '大家投票：桌上谁最能喝？被选中的喝一杯',
    '讲出你手机里最后一条发出去的消息',
    '表演一个才艺（10秒内），不行就喝',
    '选两个人一起喝',
    '指定某人只能用左手喝酒，违反就罚',
    '给桌上某人取个绰号，今晚必须这么叫',
    '说出你此刻最想吃的东西',
    '最后把手放桌上的人喝一杯',
    '自选：喝一杯 或 发一条朋友圈',
    '唱一句歌，跑调了喝',
    '真心夸赞左边的人一句',
    '做10秒内最搞笑的表情，大家评判',
    '和全桌碰杯，每人抿一口',
    '分享一个你最近的尴尬经历',
  ];

  let lastKingIdx = -1;
  document.getElementById('drawKing').addEventListener('click', () => {
    const el = document.querySelector('.king-text');
    el.classList.remove('reveal');

    let idx;
    do { idx = Math.floor(Math.random() * KING_COMMANDS.length); } while (idx === lastKingIdx);
    lastKingIdx = idx;

    setTimeout(() => {
      el.textContent = KING_COMMANDS[idx];
      el.classList.add('reveal');
    }, 50);
  });

  // ===== 🤔 Truth or Dare =====
  let todMode = 'truth';

  const TRUTHS = [
    '你最近一次撒谎是什么时候？关于什么？',
    '你手机相册里最不想被别人看到的是什么？',
    '你暗恋过在座的某个人吗？',
    '你最丢脸的一次喝醉是什么样的？',
    '你做过最后悔的事是什么？',
    '如果只能留下一个app，你留哪个？',
    '你最近一次哭是因为什么？',
    '你觉得在座谁最好看？',
    '你最讨厌自己身上的一个缺点？',
    '你对现在的工作/生活满意吗？0-10打几分？',
    '你最近一次心动是因为谁/什么事？',
    '你手机里有多少未读消息？',
    '说出你最不想让父母知道的一件事',
    '你最想去的地方是哪里？为什么还没去？',
    '你觉得自己最大的优点是什么？',
    '你谈过几次恋爱？',
    '你对在座某人的第一印象是什么？',
    '你最近最开心的一件事是什么？',
    '你最怕什么？',
    '说出你最奇怪的一个习惯',
    '你这辈子做过最疯狂的事是什么？',
    '你最近在纠结什么事？',
    '你会因为什么理由跟一个人绝交？',
    '你觉得这桌谁最适合做你男/女朋友？',
    '坦白一个只有你知道的秘密',
  ];

  const DARES = [
    '给你最近一条微信消息的人发"我想你了"',
    '学一种动物叫，维持10秒',
    '倒着念你自己的名字三遍',
    '让左边的人喂你喝一口酒',
    '用屁股写你的名字',
    '对着手机前置摄像头做一个鬼脸并发朋友圈',
    '模仿一段广告台词',
    '选一个人给TA捏肩膀30秒',
    '学僵尸走路绕桌一圈',
    '打电话给你通讯录第一个人说"我爱你"',
    '闻一下左边那个人的脚',
    '用你的肘关节发一条消息给某人',
    '做20个深蹲',
    '含一口酒保持30秒不能咽',
    '让在座的人给你取外号，今晚必须答应',
    '靠墙做椅子姿势坚持20秒',
    '给对面的人比个心并说"你最可爱"',
    '用表情包演一段无声电影',
    '大声说出"我是酒桌之王"三遍',
    '闭眼转三圈，然后指向某人，那个人喝一杯',
    '唱一首歌的副歌部分',
    '让右边的人画花在你脸上',
    '站起来向全桌鞠躬说"大家辛苦了"',
    '大冒险中的大冒险：直接干一杯！',
    '用最搞笑的声音说"我今天心情很好"',
  ];

  document.getElementById('todTruth').addEventListener('click', () => {
    todMode = 'truth';
    document.getElementById('todTruth').classList.add('active');
    document.getElementById('todDare').classList.remove('active');
  });

  document.getElementById('todDare').addEventListener('click', () => {
    todMode = 'dare';
    document.getElementById('todDare').classList.add('active');
    document.getElementById('todTruth').classList.remove('active');
  });

  let lastTodIdx = -1;
  document.getElementById('drawTod').addEventListener('click', () => {
    const pool = todMode === 'truth' ? TRUTHS : DARES;
    const el = document.querySelector('.tod-text');
    el.classList.remove('reveal');

    let idx;
    do { idx = Math.floor(Math.random() * pool.length); } while (idx === lastTodIdx);
    lastTodIdx = idx;

    setTimeout(() => {
      el.textContent = pool[idx];
      el.classList.add('reveal');
    }, 50);
  });

})();
