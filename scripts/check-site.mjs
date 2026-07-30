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
for (const file of htmlFiles) {
  const source = read(file);
  const refs = [...source.matchAll(/(?:href|src)=["'](\/[^"'#?]+)(?:[?#][^"']*)?["']/g)];
  for (const match of refs) {
    check(fs.existsSync(path.join(root, match[1].slice(1))), `${file}: missing ${match[1]}`);
  }
  check((source.match(/href=["']\/css\/theme\.css(?:\?[^"']*)?["']/g) || []).length <= 1,
    `${file}: duplicate theme.css`);
}

for (const file of fs.readdirSync(path.join(root, 'js')).filter(file => file.endsWith('.js'))) {
  const result = spawnSync(process.execPath, ['--check', path.join(root, 'js', file)]);
  check(result.status === 0, `js/${file}: invalid JavaScript`);
}

const scanned = [
  ...htmlFiles,
  ...fs.readdirSync(path.join(root, 'js')).filter(file => file.endsWith('.js')).map(file => `js/${file}`),
  'AGENTS.md'
].map(file => [file, read(file)]);
for (const [file, source] of scanned) {
  check(!source.includes('\uFFFD'), `${file}: Unicode replacement character`);
  check(!source.includes('\\${'), `${file}: escaped template interpolation`);
  check(!source.includes('aiUsedInput'), `${file}: obsolete AI input id`);
}

const forbidden = ['trcetesyexopngcfrgck.supabase.co', 'ipwho.is', 'ipapi.co/json', 'visitor-map.js'];
for (const [file, source] of scanned) {
  for (const value of forbidden) {
    check(!source.includes(value), `${file}: production source contains ${value}`);
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
check(!/(?:TLScontact|签证中心)[\s\S]{0,200}[\u4e00-\u9fff]{2,12}(?:路|街|大道|巷)\s*\d+|\d+\s*号(?:楼|层)?/.test(franceWithoutUrls),
  'france guide: hard-coded TLScontact or visa-centre street address');
check(france.includes('noindex,nofollow'), 'france guide: missing noindex');
check(read('health.html').includes('noindex,nofollow'), 'health: missing noindex');

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
