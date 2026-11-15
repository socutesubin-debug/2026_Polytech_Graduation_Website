// WebGL 인트로 미리보기 검사: node tests/intro-webgl.cjs [출력폴더]
// 서버 없이 Playwright가 파일을 직접 건네줘요. 인터넷(CDN)이 막힌 곳이면 CDN_DIR에 three@0.160.0, gsap@3.12.5를 풀어 두세요 (tests/cdn-route.cjs 참고).
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const cdn = require('./cdn-route.cjs');
const ROOT = path.resolve(__dirname, '..');
const OUT = process.argv[2] || path.join(ROOT, 'tests', 'out-intro-webgl');
fs.mkdirSync(OUT, { recursive: true });
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.png': 'image/png' };

async function run(name, ctxOpts, extra = '') {
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const ctx = await browser.newContext(ctxOpts);
  if (process.env.CDN_DIR) await cdn(ctx, process.env.CDN_DIR);
  await ctx.route('http://iw.local/**', (r) => {
    const u = new URL(r.request().url()); const f = path.join(ROOT, decodeURIComponent(u.pathname));
    if (!fs.existsSync(f)) return r.fulfill({ status: 404, body: 'nf' });
    r.fulfill({ path: f, contentType: TYPES[path.extname(f)] || 'application/octet-stream' });
  });
  const page = await ctx.newPage();
  const errors = [], failed = [];
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errors.push(m.type() + ': ' + m.text()); });
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  page.on('requestfailed', (r) => failed.push(r.url()));
  page.on('response', (r) => { if (r.status() >= 400) failed.push(r.status() + ' ' + r.url()); });
  await page.goto('http://iw.local/intro-webgl.html' + extra);
  await page.waitForFunction(() => window.__iw || window.__iwFailed, null, { timeout: 60000 });
  const failedInit = await page.evaluate(() => !!window.__iwFailed);
  if (failedInit) { console.log(name, 'INIT FAILED', errors, failed); await browser.close(); return { name, ok: false }; }
  const res = { name, shots: [], checks: [] };

  // 1) 진행률별 장면 (멈춰 놓고 몇 프레임 진행)
  const P = [0, 0.1, 0.27, 0.4, 0.55, 0.65, 0.8, 0.84, 0.87, 0.9, 0.95, 1];
  for (const p of P) {
    await page.evaluate(async (p) => { window.__iw.freeze(p); await new Promise((r) => setTimeout(r, 450)); }, p);
    const info = await page.evaluate(() => window.__iw.info());
    const f = path.join(OUT, `${name}-p${String(p).replace('.', '')}.png`);
    await page.screenshot({ path: f });
    res.shots.push({ p, f, ndc: info.bflyNDC.map((v) => +v.toFixed(2)), cam: info.cam.map((v) => +v.toFixed(2)), fps: +info.fps.toFixed(1) });
  }
  // 2) 나비가 화면 안에 있는지 (p 0.09 ~ 0.84), 카메라가 벽 앞에 있는지
  const miss = await page.evaluate(() => {
    const out = [];
    for (let i = 0; i <= 60; i++) {
      const p = 0.09 + (0.845 - 0.09) * i / 60; window.__iw.freeze(p); window.__iw.step(1 / 60);
      const n = window.__iw.info();
      if (Math.abs(n.bflyNDC[0]) > 0.92 || Math.abs(n.bflyNDC[1]) > 0.92 || n.bflyNDC[2] > 1) out.push([+p.toFixed(3), n.bflyNDC.map((v) => +v.toFixed(2))]);
      if (n.cam[2] < 0.3) out.push(['wall', p, n.cam]);
    }
    return out;
  });
  res.checks.push({ butterflyOffscreen: miss });
  // 3) 실제 스크롤: 빠른 전진·후진 → 진행률이 따라가고 잔상이 정리되는지
  await page.evaluate(() => window.__iw.freeze(null));
  const scrollTest = await page.evaluate(async () => {
    const H = document.documentElement.scrollHeight - innerHeight, wait = (ms) => new Promise((r) => setTimeout(r, ms)), log = [];
    for (const y of [0.5, 0.05, 1, 0, 0.8, 0.3, 1]) {
      window.scrollTo(0, H * y); await wait(1600);
      const n = window.__iw.info(); log.push({ y, p: +n.p.toFixed(3), target: +n.target.toFixed(3), entered: n.entered });
    }
    return { log, jumps: window.__iw.info().jumps, listeners: window.__iw.info().listeners };
  });
  res.checks.push({ scroll: scrollTest });
  await page.screenshot({ path: path.join(OUT, `${name}-end-screen.png`) });
  // 4) 키보드: Tab으로 버튼에 갈 수 있는지
  const focus = await page.evaluate(() => { const b = document.querySelector('.iw-enter-btn'); b.focus(); return document.activeElement === b; });
  res.checks.push({ enterButtonFocusable: focus });
  // 5) 수면 파문: 연못 위 포인터 → 파문 생김 (p=0.6 장면에서 화면 아래쪽)
  await page.evaluate(() => window.__iw.freeze(0.6));
  await page.waitForTimeout(300);
  const vp = page.viewportSize();
  await page.mouse.move(vp.width * 0.4, vp.height * 0.93); await page.mouse.move(vp.width * 0.6, vp.height * 0.95, { steps: 6 });
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(OUT, `${name}-ripple.png`) });
  // 6) 정리(dispose) 뒤 남는 것이 없는지
  const disp = await page.evaluate(() => { const before = window.__iw.info(); window.__iw.dispose(); return { listenersBefore: before.listeners, geometries: before.geometries, textures: before.textures, rootEmpty: document.getElementById('intro-webgl').children.length === 0 }; });
  res.checks.push({ dispose: disp });
  res.errors = errors; res.failed = failed;
  await browser.close();
  return res;
}

(async () => {
  const results = [];
  results.push(await run('desktop', { viewport: { width: 1280, height: 720 } }));
  results.push(await run('mobile', { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true }));
  results.push(await run('reduced', { viewport: { width: 1280, height: 800 }, reducedMotion: 'reduce' }));
  fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(results, null, 1));
  for (const r of results) {
    console.log('==', r.name, 'errors:', r.errors && r.errors.length, 'failed requests:', r.failed && r.failed.length);
    (r.errors || []).slice(0, 8).forEach((e) => console.log('  ', e.slice(0, 300)));
    (r.failed || []).slice(0, 8).forEach((e) => console.log('   failed', e));
    console.log('  ', JSON.stringify(r.checks).slice(0, 1500));
    (r.shots || []).forEach((s) => console.log('   p', s.p, 'ndc', s.ndc.join(','), 'cam', s.cam.join(',')));
  }
})();
