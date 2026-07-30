import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const failures = [];
let tests = 0;

function test(name, run) {
  tests += 1;
  try {
    run();
    console.log(`PASS ${name}`);
  } catch (error) {
    failures.push(`${name}: ${error.message}`);
    console.error(`FAIL ${name}: ${error.message}`);
  }
}

function makeFixture() {
  const fixture = fs.mkdtempSync(path.join(os.tmpdir(), 'tea-x-site-check-'));
  fs.cpSync(projectRoot, fixture, {
    recursive: true,
    filter(source) {
      const topLevel = path.relative(projectRoot, source).split(path.sep)[0];
      return !['.git', '.superpowers'].includes(topLevel);
    }
  });
  return fixture;
}

function mutateFile(fixture, file, mutate) {
  const target = path.join(fixture, file);
  const source = fs.readFileSync(target, 'utf8');
  const mutated = mutate(source);
  if (mutated === source) throw new Error(`${file} mutation did not change the fixture`);
  fs.writeFileSync(target, mutated);
}

function runChecker(fixture) {
  return spawnSync(process.execPath, ['scripts/check-site.mjs'], {
    cwd: fixture,
    encoding: 'utf8'
  });
}

function assertRejected(name, file, mutate, expectedMessage) {
  test(name, () => {
    const fixture = makeFixture();
    try {
      mutateFile(fixture, file, mutate);
      const result = runChecker(fixture);
      const output = `${result.stdout}${result.stderr}`;
      if (result.status === 0) throw new Error('checker accepted the mutation');
      if (!output.includes(expectedMessage)) {
        throw new Error(`missing failure message "${expectedMessage}" in: ${output.trim()}`);
      }
    } finally {
      fs.rmSync(fixture, { recursive: true, force: true });
    }
  });
}

test('production baseline permits approved external resources and official links', () => {
  const fixture = makeFixture();
  try {
    const result = runChecker(fixture);
    if (result.status !== 0) {
      throw new Error(`${result.stdout}${result.stderr}`.trim());
    }
  } finally {
    fs.rmSync(fixture, { recursive: true, force: true });
  }
});

assertRejected(
  'rejects any Supabase project endpoint',
  'js/home.js',
  source => `${source}\nfetch('https://different-project.supabase.co/rest/v1/health');\n`,
  'Supabase endpoint'
);

assertRejected(
  'rejects a bare Supabase project hostname',
  'AGENTS.md',
  source => `${source}\nLegacy endpoint: another-project.supabase.co\n`,
  'Supabase endpoint'
);

assertRejected(
  'rejects the Open-Meteo API endpoint',
  'portal.html',
  source => source.replace('</body>', '<script src="https://api.open-meteo.com/v1/forecast"></script>\n</body>'),
  'Open-Meteo endpoint'
);

assertRejected(
  'rejects an apikey credential header',
  'js/home.js',
  source => `${source}\nconst leakedHeaders = { apikey: 'public-but-sensitive-key' };\n`,
  'apikey credential'
);

assertRejected(
  'rejects a JWT-shaped credential',
  'js/home.js',
  source => `${source}\nconst leakedToken = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ0ZXN0LXVzZXIifQ.signaturevalue12345';\n`,
  'JWT-shaped credential'
);

assertRejected(
  'rejects a missing document-relative HTML link',
  'portal.html',
  source => source.replace('</main>', '<a href="deleted-page.html">Deleted page</a>\n</main>'),
  'portal.html: missing deleted-page.html'
);

assertRejected(
  'rejects a missing CSS url asset',
  'css/home.css',
  source => `${source}\n.missing-asset { background-image: url('../images/deleted-asset.svg'); }\n`,
  'css/home.css: missing ../images/deleted-asset.svg'
);

assertRejected(
  'rejects an incorrect 2026 France itinerary weekday',
  'france-schengen-2026.html',
  source => source.replace('9.25 周五', '9.25 周四'),
  'expected 周五'
);

assertRejected(
  'rejects games being fixed to dark',
  'games.html',
  source => source.includes('<html lang="zh-CN" data-theme="dark">')
    ? `${source}\n<!-- fixed-dark mutation fixture -->\n`
    : source.replace('<html lang="zh-CN">', '<html lang="zh-CN" data-theme="dark">'),
  'games: fixed dark theme'
);

assertRejected(
  'rejects removal of the shared localStorage then system theme fallback',
  'js/theme-icons.js',
  source => source.replace(
    /localStorage\.getItem\('theme'\)\s*\|\|\s*\(matchMedia\('\(prefers-color-scheme: dark\)'\)\.matches \? 'dark' : 'light'\)/,
    "'light'"
  ),
  'theme icons: missing localStorage then system fallback'
);

if (failures.length) {
  console.error(`\n${failures.length} of ${tests} site checker tests failed.`);
  process.exit(1);
}

console.log(`\nSite checker tests passed (${tests} tests).`);
