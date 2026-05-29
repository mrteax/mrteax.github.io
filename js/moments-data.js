/*
 * 此刻动态 (Moments) — 让主页有「活人感」的核心数据。
 *
 * 想更新动态？只改这个文件就行：把最新的一条加到数组「最前面」。
 * 每条字段说明：
 *   time   - ISO 时间，如 '2026-05-28T20:30'，用来算「x 小时前」
 *   text   - 正文，一两句话，越生活化越好
 *   mood   - 可选，状态/心情，如 '🍸 微醺'、'☕ 续命中'
 *   place  - 可选，地点，如 '悉尼 · 家'
 *   tags   - 可选，话题标签数组，如 ['夜读','鸡尾酒']
 *   media  - 可选，配图色块（CSS background），用来代替真实图片
 *   link   - 可选，点击跳转的站内链接
 *   likes  - 可选，初始点赞数（访客点的赞会本地叠加）
 */
const MOMENTS = [
  {
    time: '2026-05-28T21:40',
    text: '调了一杯 Negroni，金巴利的苦回甘刚刚好。配着刚到的新书，周四的夜晚也可以很慢。',
    mood: '🍸 微醺',
    place: '悉尼 · 家',
    tags: ['鸡尾酒', '夜读'],
    media: 'linear-gradient(135deg,#b07d4f,#7a4a2a)',
    link: '/cocktails.html',
    likes: 18,
  },
  {
    time: '2026-05-28T07:15',
    text: '清晨沿着海边跑了 6 公里，海风很大但很清醒。今天的状态：满电出发 🔋',
    mood: '🏃 晨跑',
    place: 'Bondi Beach',
    tags: ['晨跑', '海边'],
    likes: 9,
  },
  {
    time: '2026-05-27T22:10',
    text: '在听 City Pop 歌单，竹内まりや 的《Plastic Love》单曲循环到第几遍已经数不清了。深夜适合 emo 也适合做梦。',
    mood: '🎧 单曲循环',
    tags: ['City Pop', '深夜'],
    media: 'linear-gradient(135deg,#6c5ce7,#341f6b)',
    likes: 27,
  },
  {
    time: '2026-05-26T18:30',
    text: '周末爬了一条新路线，山顶云海翻涌的那一刻，觉得所有的累都值了。把它加进了徒步清单。',
    mood: '🥾 在路上',
    place: 'Blue Mountains',
    tags: ['徒步', '周末'],
    media: 'linear-gradient(135deg,#4a7c59,#1f3d2a)',
    link: '/hiking.html',
    likes: 34,
  },
  {
    time: '2026-05-25T15:00',
    text: '下午手冲了一支耶加雪菲，柑橘和茉莉的香气一下子就上来了。咖啡这件事，越研究越上头。',
    mood: '☕ 续命中',
    tags: ['咖啡', '手冲'],
    link: '/coffee.html',
    likes: 15,
  },
];
