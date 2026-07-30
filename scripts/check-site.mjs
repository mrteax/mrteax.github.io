import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const failures = [];
let checks = 0;
const check = (condition, message) => {
  checks += 1;
  if (!condition) failures.push(message);
};
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

const htmlFiles = fs.readdirSync(root).filter(file => file.endsWith('.html'));
const jsFiles = fs.readdirSync(path.join(root, 'js'))
  .filter(file => file.endsWith('.js'))
  .map(file => `js/${file}`);
const cssFiles = fs.readdirSync(path.join(root, 'css'))
  .filter(file => file.endsWith('.css'))
  .map(file => `css/${file}`);

const ignoredReference = value => {
  const trimmed = value.trim();
  return !trimmed
    || trimmed.startsWith('#')
    || trimmed.startsWith('//')
    || /^[a-z][a-z\d+.-]*:/i.test(trimmed);
};

const resolveLocalReference = (file, value) => {
  const clean = value.trim().split(/[?#]/, 1)[0];
  if (!clean) return null;
  return clean.startsWith('/')
    ? path.resolve(root, clean.slice(1))
    : path.resolve(root, path.dirname(file), clean);
};

for (const file of htmlFiles) {
  const source = read(file);
  const refs = [...source.matchAll(/\b(?:href|src)\s*=\s*["']([^"']+)["']/gi)];
  for (const match of refs) {
    const value = match[1];
    if (ignoredReference(value)) continue;
    const target = resolveLocalReference(file, value);
    check(target && fs.existsSync(target), `${file}: missing ${value}`);
  }
  check((source.match(/href=["']\/css\/theme\.css(?:\?[^"']*)?["']/g) || []).length <= 1,
    `${file}: duplicate theme.css`);
}

for (const file of cssFiles) {
  const source = read(file);
  const refs = [...source.matchAll(/url\(\s*(["']?)(.*?)\1\s*\)/gi)];
  for (const match of refs) {
    const value = match[2];
    if (ignoredReference(value)) continue;
    const target = resolveLocalReference(file, value);
    check(target && fs.existsSync(target), `${file}: missing ${value}`);
  }
}

for (const file of jsFiles) {
  const result = spawnSync(process.execPath, ['--check', path.join(root, file)]);
  check(result.status === 0, `${file}: invalid JavaScript`);
}

const scanned = [
  ...htmlFiles,
  ...jsFiles,
  ...cssFiles,
  'AGENTS.md'
].map(file => [file, read(file)]);
for (const [file, source] of scanned) {
  check(!source.includes('\uFFFD'), `${file}: Unicode replacement character`);
  check(!source.includes('\\${'), `${file}: escaped template interpolation`);
  check(!source.includes('aiUsedInput'), `${file}: obsolete AI input id`);
}

const forbidden = [
  [/\b[a-z\d-]+\.supabase\.co\b/i, 'Supabase endpoint'],
  [/\bapi\.open-meteo\.com\b/i, 'Open-Meteo endpoint'],
  [/\bapikey\b["']?\s*[:=]/i, 'apikey credential'],
  [/\beyJ[A-Za-z\d_-]{10,}\.[A-Za-z\d_-]{10,}\.[A-Za-z\d_-]{10,}\b/, 'JWT-shaped credential'],
  [/\bipwho\.is\b/i, 'ipwho.is'],
  [/\bipapi\.co\/json\b/i, 'ipapi.co/json'],
  [/\bvisitor-map\.js\b/i, 'visitor-map.js']
];
for (const [file, source] of scanned) {
  for (const [pattern, label] of forbidden) {
    check(!pattern.test(source), `${file}: production source contains ${label}`);
  }
}

const portal = read('portal.html');
check(portal.includes('34 条经典路线'), 'portal: hiking count is not 34');
check(portal.includes('42 个训练动作'), 'portal: fitness count is not 42');
check(portal.includes('国际象棋'), 'portal: game summary omits chess');
check(!portal.includes('/js/coffee-data.js'), 'portal: unused coffee data script');

const france = read('france-schengen-2026.html');
for (const text of ['最后更新：2026-07-30', '递签城市：武汉', '8 月底', '摩纳哥',
  'https://france-visas.gouv.fr/', 'https://home-affairs.ec.europa.eu/']) {
  check(france.includes(text), `france guide: missing ${text}`);
}
check(!france.includes('尽量 6 月内递签'), 'france guide: stale June deadline');
check(france.includes('11 个酒店夜晚全部在法国'), 'france guide: missing 11 hotel nights in France statement');
check(france.includes('摩纳哥可从尼斯乘区域列车往返'),
  'france guide: missing Monaco same-day return from Nice statement');
const franceWithoutUrls = france.replace(/https?:\/\/[^\s"'<>]+/g, '');
const visaCentreHardcodedAddress = /(?:TLScontact|签证中心)[\s\S]{0,200}(?:[\u4e00-\u9fff]{2,12}(?:路|街|大道|巷)\s*\d+|\d+\s*号(?:楼|层)?)/;
check(!visaCentreHardcodedAddress.test(franceWithoutUrls),
  'france guide: hard-coded TLScontact or visa-centre street address');
const itinerary = france.match(/<section class="card" id="itinerary">([\s\S]*?)<\/section>/);
check(Boolean(itinerary), 'france guide: missing itinerary section');
if (itinerary) {
  const dateCells = [...itinerary[1].matchAll(/<tr>\s*<td>([^<]+)<\/td>/g)];
  check(dateCells.length > 0, 'france guide: itinerary has no date rows');
  const weekdayLabels = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  for (const [, cell] of dateCells) {
    const parsed = cell.trim().match(/^(\d{1,2})\.(\d{1,2})\s+(周[一二三四五六日天])$/);
    check(Boolean(parsed), `france guide: invalid itinerary date/weekday cell "${cell.trim()}"`);
    if (!parsed) continue;
    const month = Number(parsed[1]);
    const day = Number(parsed[2]);
    const date = new Date(Date.UTC(2026, month - 1, day));
    const validDate = date.getUTCFullYear() === 2026
      && date.getUTCMonth() === month - 1
      && date.getUTCDate() === day;
    check(validDate, `france guide: invalid 2026 itinerary date ${month}.${day}`);
    if (!validDate) continue;
    const expected = weekdayLabels[date.getUTCDay()];
    check(parsed[3].replace('周天', '周日') === expected,
      `france guide: ${month}.${day} says ${parsed[3]}; expected ${expected} for 2026`);
  }
}
check(france.includes('noindex,nofollow'), 'france guide: missing noindex');
check(read('health.html').includes('noindex,nofollow'), 'health: missing noindex');

const games = read('games.html');
check(!/<html\b[^>]*\bdata-theme=["']dark["']/i.test(games), 'games: fixed dark theme');
const themeIcons = read('js/theme-icons.js');
const sharedThemeFallback = /localStorage\.getItem\('theme'\)\s*\|\|\s*\(matchMedia\('\(prefers-color-scheme: dark\)'\)\.matches \? 'dark' : 'light'\)/;
check(sharedThemeFallback.test(themeIcons),
  'theme icons: missing localStorage then system fallback');

const datasets = [
  ['js/hiking-data.js', 'TRAILS', 34],
  ['js/fitness-data.js', 'EXERCISES', 42],
  ['js/tennis-data.js', 'TENNIS_TIPS', 30],
  ['js/skiing-data.js', 'SKI_RESORTS', 25],
  ['js/surfing-data.js', 'SURF_SPOTS', 26],
  ['js/billiards-data.js', 'BILLIARDS_TIPS', 30],
  ['js/tea-data.js', 'TEAS', 30],
  ['js/coffee-data.js', 'COFFEES', 40],
  ['js/cocktails-data.js', 'COCKTAILS', 46]
];
for (const [file, name, expected] of datasets) {
  const context = {};
  vm.createContext(context);
  vm.runInContext(`${read(file)}; this.value = ${name};`, context);
  check(Array.isArray(context.value) && context.value.length === expected,
    `${file}: expected ${expected} records`);
}

for (const obsolete of ['visitors.html', 'js/visitor-map.js', 'js/main.js', 'css/style.css',
  'reference-beside-me-renote.jpg']) {
  check(!fs.existsSync(path.join(root, obsolete)), `${obsolete}: obsolete file still exists`);
}

if (failures.length) {
  console.error(failures.map(failure => `FAIL ${failure}`).join('\n'));
  process.exit(1);
}
console.log(`Site checks passed (${checks} checks).`);
