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


  })();
