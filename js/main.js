(() => {
  'use strict';

  // ===== Helpers =====
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

  function copyText(text, flashEl) {
    navigator.clipboard.writeText(text).then(() => {
      if (flashEl) {
        flashEl.classList.add('flash-copied');
        setTimeout(() => flashEl.classList.remove('flash-copied'), 500);
      }
    }).catch(() => {});
  }

  // ===== Theme Toggle =====
  const html = document.documentElement;
  const saved = localStorage.getItem('theme') ||
    (matchMedia('(prefers-color-scheme:dark)').matches ? 'dark' : 'light');
  html.dataset.theme = saved;

  $('#themeToggle').addEventListener('click', () => {
    const next = html.dataset.theme === 'dark' ? 'light' : 'dark';
    html.dataset.theme = next;
    localStorage.setItem('theme', next);
  });

  // ===== Clock =====
  const clockTimeEl = $('#clockTime');
  const clockDateEl = $('#clockDate');
  const WEEK = ['日', '一', '二', '三', '四', '五', '六'];

  function tickClock() {
    const d = new Date();
    clockTimeEl.textContent =
      String(d.getHours()).padStart(2, '0') + ':' +
      String(d.getMinutes()).padStart(2, '0') + ':' +
      String(d.getSeconds()).padStart(2, '0');
    clockDateEl.textContent =
      `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 星期${WEEK[d.getDay()]}`;
  }
  tickClock();
  setInterval(tickClock, 1000);

  // ===== Tea Timer =====
  const CIRC = 2 * Math.PI * 90;
  const ringProgress = $('.ring-progress');
  ringProgress.style.strokeDasharray = CIRC;

  let tmDuration = 300;
  let tmRemain = 300;
  let tmInterval = null;
  let tmRunning = false;

  const tmTimeEl = $('#timerTime');
  const tmStartBtn = $('#timerStart');
  const tmPauseBtn = $('#timerPause');
  const tmResetBtn = $('#timerReset');

  function fmtTime(s) {
    return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
  }

  function updateTimer() {
    tmTimeEl.textContent = fmtTime(tmRemain);
    const pct = 1 - tmRemain / tmDuration;
    ringProgress.style.strokeDashoffset = pct * CIRC;
  }

  function playChime() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      [523.25, 659.25, 783.99].forEach((f, i) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = 'sine'; o.frequency.value = f;
        g.gain.setValueAtTime(0.15, ctx.currentTime + i * .2);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * .2 + .5);
        o.connect(g); g.connect(ctx.destination);
        o.start(ctx.currentTime + i * .2);
        o.stop(ctx.currentTime + i * .2 + .5);
      });
    } catch (_) {}
  }

  function startTimer() {
    if (tmRemain <= 0) return;
    tmRunning = true;
    tmStartBtn.classList.add('hidden');
    tmPauseBtn.classList.remove('hidden');
    tmInterval = setInterval(() => {
      tmRemain--;
      updateTimer();
      if (tmRemain <= 0) {
        clearInterval(tmInterval); tmInterval = null; tmRunning = false;
        tmPauseBtn.classList.add('hidden');
        tmStartBtn.classList.remove('hidden');
        tmTimeEl.parentElement.parentElement.classList.add('timer-done');
        setTimeout(() => tmTimeEl.parentElement.parentElement.classList.remove('timer-done'), 600);
        playChime();
      }
    }, 1000);
  }

  function pauseTimer() {
    clearInterval(tmInterval); tmInterval = null; tmRunning = false;
    tmPauseBtn.classList.add('hidden');
    tmStartBtn.classList.remove('hidden');
  }

  function resetTimer() {
    pauseTimer();
    tmRemain = tmDuration;
    updateTimer();
  }

  $$('.preset').forEach(btn => {
    btn.addEventListener('click', () => {
      if (tmRunning) pauseTimer();
      $$('.preset').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      tmDuration = tmRemain = +btn.dataset.seconds;
      updateTimer();
    });
  });

  tmStartBtn.addEventListener('click', startTimer);
  tmPauseBtn.addEventListener('click', pauseTimer);
  tmResetBtn.addEventListener('click', resetTimer);
  updateTimer();

  // ===== Quick Notes =====
  const notesArea = $('#notesArea');
  const noteStatus = $('#noteStatus');
  const notesCount = $('#notesCount');
  let saveTimeout;

  notesArea.value = localStorage.getItem('teax_notes') || '';
  updateNotesCount();

  notesArea.addEventListener('input', () => {
    noteStatus.textContent = '输入中…';
    updateNotesCount();
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
      localStorage.setItem('teax_notes', notesArea.value);
      noteStatus.textContent = '已保存';
    }, 600);
  });

  $('#notesClear').addEventListener('click', () => {
    if (notesArea.value && confirm('确定清空所有内容？')) {
      notesArea.value = '';
      localStorage.setItem('teax_notes', '');
      noteStatus.textContent = '已清空';
      updateNotesCount();
    }
  });

  function updateNotesCount() {
    const len = notesArea.value.length;
    notesCount.textContent = `${len} 字`;
  }

  // ===== JSON Formatter =====
  const jsonInput = $('#jsonInput');
  const jsonOutput = $('#jsonOutput');
  const jsonMsg = $('#jsonMsg');

  function showJsonMsg(text, isError) {
    jsonMsg.textContent = text;
    jsonMsg.className = 'json-msg' + (isError ? ' error' : '');
    setTimeout(() => { jsonMsg.textContent = ''; }, 3000);
  }

  $('#jsonFormat').addEventListener('click', () => {
    try {
      const obj = JSON.parse(jsonInput.value);
      const formatted = JSON.stringify(obj, null, 2);
      jsonOutput.textContent = formatted;
      jsonOutput.classList.add('visible');
      jsonInput.value = formatted;
      showJsonMsg('格式化成功');
    } catch (e) {
      showJsonMsg('JSON 格式错误: ' + e.message, true);
    }
  });

  $('#jsonMinify').addEventListener('click', () => {
    try {
      const obj = JSON.parse(jsonInput.value);
      const minified = JSON.stringify(obj);
      jsonOutput.textContent = minified;
      jsonOutput.classList.add('visible');
      jsonInput.value = minified;
      showJsonMsg('压缩成功');
    } catch (e) {
      showJsonMsg('JSON 格式错误: ' + e.message, true);
    }
  });

  $('#jsonCopy').addEventListener('click', () => {
    const text = jsonOutput.textContent || jsonInput.value;
    copyText(text, $('#jsonCopy'));
    showJsonMsg('已复制');
  });

  // ===== Base64 =====
  $('#b64Encode').addEventListener('click', () => {
    try {
      const encoded = btoa(unescape(encodeURIComponent($('#b64Input').value)));
      $('#b64Output').value = encoded;
    } catch (e) {
      $('#b64Output').value = '编码错误: ' + e.message;
    }
  });

  $('#b64Decode').addEventListener('click', () => {
    try {
      const decoded = decodeURIComponent(escape(atob($('#b64Input').value.trim())));
      $('#b64Output').value = decoded;
    } catch (e) {
      $('#b64Output').value = '解码错误: 无效的 Base64 字符串';
    }
  });

  $('#b64Copy').addEventListener('click', () => {
    copyText($('#b64Output').value, $('#b64Copy'));
  });

  // ===== Timestamp =====
  const tsNowEl = $('#tsNow');

  function tickTimestamp() {
    tsNowEl.textContent = Math.floor(Date.now() / 1000);
  }
  tickTimestamp();
  setInterval(tickTimestamp, 1000);

  $('#tsCopyNow').addEventListener('click', () => {
    copyText(tsNowEl.textContent, $('#tsCopyNow'));
  });

  $('#tsToDateInput').addEventListener('input', (e) => {
    const val = e.target.value.trim();
    if (!val) { $('#tsToDateResult').textContent = '—'; return; }
    let ts = Number(val);
    if (isNaN(ts)) { $('#tsToDateResult').textContent = '无效时间戳'; return; }
    if (ts < 1e12) ts *= 1000;
    const d = new Date(ts);
    if (isNaN(d.getTime())) { $('#tsToDateResult').textContent = '无效时间戳'; return; }
    $('#tsToDateResult').textContent = d.toLocaleString('zh-CN', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
    });
  });

  const tsFromDateInput = $('#tsFromDateInput');
  const now = new Date();
  tsFromDateInput.value = now.getFullYear() + '-' +
    String(now.getMonth() + 1).padStart(2, '0') + '-' +
    String(now.getDate()).padStart(2, '0') + 'T' +
    String(now.getHours()).padStart(2, '0') + ':' +
    String(now.getMinutes()).padStart(2, '0');

  function updateFromDate() {
    const val = tsFromDateInput.value;
    if (!val) { $('#tsFromDateResult').textContent = '—'; return; }
    const d = new Date(val);
    if (isNaN(d.getTime())) { $('#tsFromDateResult').textContent = '—'; return; }
    $('#tsFromDateResult').textContent = Math.floor(d.getTime() / 1000);
  }
  tsFromDateInput.addEventListener('input', updateFromDate);
  updateFromDate();

  // ===== Color Converter =====
  const colorPicker = $('#colorPicker');
  const colorSwatch = $('#colorSwatch');
  const colorHex = $('#colorHex');
  const colorRgb = $('#colorRgb');
  const colorHsl = $('#colorHsl');

  function hexToRgb(hex) {
    hex = hex.replace('#', '');
    if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
    const n = parseInt(hex, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }

  function rgbToHex(r, g, b) {
    return '#' + [r, g, b].map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
  }

  function rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;
    if (max === min) { h = s = 0; }
    else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        case b: h = ((r - g) / d + 4) / 6; break;
      }
    }
    return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
  }

  function hslToRgb(h, s, l) {
    h /= 360; s /= 100; l /= 100;
    let r, g, b;
    if (s === 0) { r = g = b = l; }
    else {
      const hue2rgb = (p, q, t) => {
        if (t < 0) t += 1; if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
      };
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }
    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
  }

  function setColorFrom(hex) {
    hex = hex.startsWith('#') ? hex : '#' + hex;
    const [r, g, b] = hexToRgb(hex);
    const [h, s, l] = rgbToHsl(r, g, b);
    colorPicker.value = hex.length === 7 ? hex : rgbToHex(r, g, b);
    colorSwatch.style.background = hex;
    colorHex.value = hex;
    colorRgb.value = `${r}, ${g}, ${b}`;
    colorHsl.value = `${h}, ${s}%, ${l}%`;
  }

  colorPicker.addEventListener('input', () => setColorFrom(colorPicker.value));

  colorHex.addEventListener('change', () => {
    let v = colorHex.value.trim();
    if (/^#?[0-9a-fA-F]{3,6}$/.test(v)) setColorFrom(v);
  });

  colorRgb.addEventListener('change', () => {
    const parts = colorRgb.value.split(/[\s,]+/).map(Number);
    if (parts.length >= 3 && parts.every(n => !isNaN(n))) {
      setColorFrom(rgbToHex(parts[0], parts[1], parts[2]));
    }
  });

  colorHsl.addEventListener('change', () => {
    const parts = colorHsl.value.replace(/%/g, '').split(/[\s,]+/).map(Number);
    if (parts.length >= 3 && parts.every(n => !isNaN(n))) {
      const [r, g, b] = hslToRgb(parts[0], parts[1], parts[2]);
      setColorFrom(rgbToHex(r, g, b));
    }
  });

  setColorFrom('#b07d4f');

  // ===== Password Generator =====
  const pwOutput = $('#pwOutput');
  const pwLen = $('#pwLen');
  const pwLenVal = $('#pwLenVal');
  const pwStrength = $('#pwStrength');

  const CHARSETS = {
    upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    lower: 'abcdefghijklmnopqrstuvwxyz',
    digit: '0123456789',
    symbol: '!@#$%^&*()_+-=[]{}|;:,.<>?',
  };

  function generatePassword() {
    let chars = '';
    if ($('#pwUpper').checked) chars += CHARSETS.upper;
    if ($('#pwLower').checked) chars += CHARSETS.lower;
    if ($('#pwDigit').checked) chars += CHARSETS.digit;
    if ($('#pwSymbol').checked) chars += CHARSETS.symbol;
    if (!chars) { pwOutput.value = '请至少选择一种字符类型'; return; }

    const len = +pwLen.value;
    const arr = new Uint32Array(len);
    crypto.getRandomValues(arr);
    let pw = '';
    for (let i = 0; i < len; i++) pw += chars[arr[i] % chars.length];
    pwOutput.value = pw;
    updateStrength(pw);
  }

  function updateStrength(pw) {
    let score = 0;
    if (pw.length >= 8) score++;
    if (pw.length >= 12) score++;
    if (pw.length >= 20) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[a-z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;

    const levels = [
      [3, '弱', 'weak'],
      [5, '中等', 'medium'],
      [6, '强', 'strong'],
      [Infinity, '非常强', 'very-strong'],
    ];
    for (const [threshold, label, cls] of levels) {
      if (score <= threshold) {
        pwStrength.textContent = `强度: ${label}`;
        pwStrength.className = 'pw-strength ' + cls;
        break;
      }
    }
  }

  pwLen.addEventListener('input', () => { pwLenVal.textContent = pwLen.value; });

  $('#pwGenerate').addEventListener('click', generatePassword);
  $('#pwCopy').addEventListener('click', () => {
    copyText(pwOutput.value, $('#pwCopy'));
  });

  generatePassword();

  // ===== Text Tools =====
  const textInput = $('#textInput');
  const textStats = $('#textStats');

  function updateTextStats() {
    const text = textInput.value;
    const chars = text.length;
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const lines = text ? text.split('\n').length : 0;
    const bytes = new Blob([text]).size;
    const spans = textStats.querySelectorAll('strong');
    spans[0].textContent = chars;
    spans[1].textContent = words;
    spans[2].textContent = lines;
    spans[3].textContent = bytes;
  }

  textInput.addEventListener('input', updateTextStats);

  $$('.text-actions .btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const action = btn.dataset.action;
      let text = textInput.value;
      switch (action) {
        case 'uppercase': text = text.toUpperCase(); break;
        case 'lowercase': text = text.toLowerCase(); break;
        case 'trim': text = text.split('\n').map(l => l.trim()).join('\n').replace(/\n{3,}/g, '\n\n').trim(); break;
        case 'dedupe': text = [...new Set(text.split('\n'))].join('\n'); break;
        case 'sort': text = text.split('\n').sort((a, b) => a.localeCompare(b, 'zh')).join('\n'); break;
        case 'reverse': text = text.split('').reverse().join(''); break;
      }
      textInput.value = text;
      updateTextStats();
    });
  });

  // ===== URL Encode / Decode =====
  $('#urlEncode').addEventListener('click', () => {
    try {
      $('#urlOutput').value = encodeURIComponent($('#urlInput').value);
    } catch (e) {
      $('#urlOutput').value = '编码错误';
    }
  });

  $('#urlDecode').addEventListener('click', () => {
    try {
      $('#urlOutput').value = decodeURIComponent($('#urlInput').value.trim());
    } catch (e) {
      $('#urlOutput').value = '解码错误: 无效的编码字符串';
    }
  });

  $('#urlCopy').addEventListener('click', () => {
    copyText($('#urlOutput').value, $('#urlCopy'));
  });

  // ===== Hash Generator =====
  const hashInput = $('#hashInput');

  async function computeHash(algo, text) {
    const data = new TextEncoder().encode(text);
    const buf = await crypto.subtle.digest(algo, data);
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  async function updateHashes() {
    const text = hashInput.value;
    if (!text) {
      $('#hashMd5').textContent = '—';
      $('#hashSha1').textContent = '—';
      $('#hashSha256').textContent = '—';
      return;
    }
    try {
      const [sha1, sha256] = await Promise.all([
        computeHash('SHA-1', text),
        computeHash('SHA-256', text),
      ]);
      $('#hashSha1').textContent = sha1;
      $('#hashSha256').textContent = sha256;
      $('#hashMd5').textContent = '(浏览器不支持 MD5，请用 SHA)';
    } catch (_) {}
  }

  hashInput.addEventListener('input', updateHashes);

  $$('.hash-row .mono').forEach(el => {
    el.addEventListener('click', () => {
      if (el.textContent && el.textContent !== '—') copyText(el.textContent, el);
    });
  });

  // ===== Regex Tester =====
  const regexPattern = $('#regexPattern');
  const regexFlags = $('#regexFlags');
  const regexText = $('#regexText');
  const regexResult = $('#regexResult');
  const regexMatches = $('#regexMatches');

  function testRegex() {
    const pattern = regexPattern.value;
    const flags = regexFlags.value;
    const text = regexText.value;

    regexMatches.innerHTML = '';
    if (!pattern || !text) {
      regexResult.innerHTML = '<span class="regex-match-count">0 个匹配</span>';
      regexResult.className = 'regex-result';
      return;
    }

    try {
      const re = new RegExp(pattern, flags);
      const matches = [];
      let m;

      if (flags.includes('g')) {
        while ((m = re.exec(text)) !== null) {
          matches.push({ value: m[0], index: m.index });
          if (m.index === re.lastIndex) re.lastIndex++;
          if (matches.length > 200) break;
        }
      } else {
        m = re.exec(text);
        if (m) matches.push({ value: m[0], index: m.index });
      }

      regexResult.innerHTML = `<span class="regex-match-count">${matches.length} 个匹配</span>`;
      regexResult.className = 'regex-result';

      regexMatches.innerHTML = matches.slice(0, 50).map((mt, i) =>
        `<div class="regex-match"><span class="regex-match-idx">#${i + 1} [${mt.index}]</span>${escapeHtml(mt.value)}</div>`
      ).join('');
    } catch (e) {
      regexResult.innerHTML = `<span>错误: ${escapeHtml(e.message)}</span>`;
      regexResult.className = 'regex-result has-error';
    }
  }

  function escapeHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  regexPattern.addEventListener('input', testRegex);
  regexFlags.addEventListener('input', testRegex);
  regexText.addEventListener('input', testRegex);

})();
