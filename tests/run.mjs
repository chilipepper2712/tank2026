// Headless regression suite: `npm test` builds, serves dist on a spare port and runs tests/cases/*.mjs
// in Chromium at a phone landscape size (844×390, touch). `npm test -- air night` runs only cases
// whose file name contains one of the words; `--no-build` skips the build.
import { spawn, execSync } from 'node:child_process';
import { readdirSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';

const args = process.argv.slice(2), only = args.filter((a) => !a.startsWith('--'));
const root = fileURLToPath(new URL('..', import.meta.url)), PORT = 4180, base = `http://localhost:${PORT}/`;

async function loadPlaywright() {
  for (const m of [process.env.PLAYWRIGHT_MODULE, 'playwright', '/opt/node-tools/node_modules/playwright/index.mjs']) {
    if (!m) continue;
    try { return await import(m.startsWith('/') ? pathToFileURL(m).href : m); } catch { /* try the next one */ }
  }
  throw new Error('Playwright not found: install it (npm i -D playwright) or set PLAYWRIGHT_MODULE');
}

if (!args.includes('--no-build')) execSync('npm run build', { cwd: root, stdio: 'ignore' });
const server = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort'], { cwd: root, stdio: 'ignore' });
const stop = () => { try { server.kill(); } catch { /* gone */ } };
process.on('exit', stop);
for (let k = 0; k < 60; k++) { try { if ((await fetch(base)).ok) break; } catch { /* not up yet */ } await new Promise((r) => setTimeout(r, 250)); }

const { chromium } = await loadPlaywright();
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'] });

/** a phone-sized page; page errors are collected and fail the test */
async function open(path = '', { settings, storage = {}, scale = 1 } = {}) {
  const ctx = await browser.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: scale, hasTouch: true, isMobile: true });
  const page = await ctx.newPage();
  page.errors = [];
  page.on('pageerror', (e) => page.errors.push(e.message));
  await page.goto(base);
  await page.evaluate(([s, st]) => {
    localStorage.clear();
    localStorage.setItem('tank2026.hudTips', '9');
    localStorage.setItem('tank2026.noTitle', '1');
    if (s) localStorage.setItem('tank2026.settings', JSON.stringify({ v: 4, ...s }));
    for (const [k, v] of Object.entries(st)) localStorage.setItem(k, v);
  }, [settings, storage]);
  if (path) { await page.goto(base + path); await page.waitForTimeout(1200); }
  return page;
}

class Fail extends Error {}
const assert = (ok, msg) => { if (!ok) throw new Fail(msg); };

const files = readdirSync(new URL('./cases/', import.meta.url)).filter((f) => f.endsWith('.mjs') && (!only.length || only.some((w) => f.includes(w)))).sort();
let failed = 0;
for (const f of files) {
  const mod = await import(new URL(`./cases/${f}`, import.meta.url).href), t0 = Date.now();
  const log = [];
  try {
    await mod.default({ open, assert, log: (...a) => log.push(a.join(' ')) });
    console.log(`  ok   ${f.padEnd(18)} ${((Date.now() - t0) / 1000).toFixed(1)}s  ${log.join(' | ')}`);
  } catch (e) {
    failed++;
    console.log(`  FAIL ${f.padEnd(18)} ${e instanceof Fail ? e.message : e.stack}  ${log.join(' | ')}`);
  }
}
await browser.close(); stop();
console.log(failed ? `${failed} of ${files.length} failed` : `all ${files.length} passed`);
process.exit(failed ? 1 : 0);
