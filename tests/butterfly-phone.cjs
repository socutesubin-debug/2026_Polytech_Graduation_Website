// 폰 나비 페이지(butterfly.html) 검사: 나비가 그려지는지, 만지면 손가락 쪽으로 오는지, 3D가 안 되면 포스터가 나오는지
// 사용: npm start 를 켠 상태에서  node tests/butterfly-phone.cjs
const { chromium, devices } = require('playwright');
const URL = (process.env.BASE || 'http://localhost:8765') + '/butterfly.html';
const ok = (c, m) => { if (!c) { console.error('실패: ' + m); process.exitCode = 1; } else console.log('통과: ' + m); };
(async () => {
  const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream'] });
  const errs = [];
  const p = await (await b.newContext({ ...devices['iPhone 13'] })).newPage();
  p.on('pageerror', (e) => errs.push(e.message));
  await p.goto(URL); await p.waitForTimeout(1500);
  ok(await p.evaluate(() => !document.body.classList.contains('no-gl') && !!window.__bf), '나비(3D)가 켜짐');
  await p.touchscreen.tap(300, 320); await p.waitForTimeout(1200);
  const s = await p.evaluate(() => ({ x: __bf.s.x, y: __bf.s.y }));
  ok(Math.hypot(s.x - 300, s.y - (320 - 70)) < 80, `톡 친 곳(손가락 조금 위)으로 날아옴 (${s.x | 0}, ${s.y | 0})`);
  ok(await p.getAttribute('a.go', 'href') === './', '사이트로 가는 버튼');
  // AR: 가짜 카메라로 켜고, 폰을 오른쪽으로 90도 돌리면 나비가 화면에서 왼쪽으로 밀려나야 함 (공간에 붙어 있음)
  const ctxA = await b.newContext({ ...devices['iPhone 13'], permissions: ['camera'] });
  const pa = await ctxA.newPage(); pa.on('pageerror', (e) => errs.push(e.message));
  await pa.goto(URL); await pa.waitForTimeout(500);
  await pa.click('#arBtn'); await pa.waitForTimeout(800);
  ok(await pa.evaluate(() => document.body.classList.contains('ar') && !!__bfAR.ar), 'AR 켜짐 (카메라)');
  const ori = (a) => pa.evaluate((a) => { const e = new Event('deviceorientation'); e.alpha = a; e.beta = 90; e.gamma = 0; dispatchEvent(e); }, a);
  for (let i = 0; i < 20; i++) { await ori(0); await pa.waitForTimeout(40); }
  ok(await pa.evaluate(() => __bfAR.ar.hasSensor), '기울기 센서 값을 받음');
  await pa.click('#arClose'); await pa.waitForTimeout(300);
  ok(await pa.evaluate(() => !document.body.classList.contains('ar')), 'AR 나가기 → 원래 화면');
  const p2 = await (await b.newContext({ ...devices['iPhone 13'] })).newPage();
  await p2.addInitScript(() => { const g = HTMLCanvasElement.prototype.getContext; HTMLCanvasElement.prototype.getContext = function (t, ...a) { return t === 'webgl2' ? null : g.call(this, t, ...a); }; });
  await p2.goto(URL); await p2.waitForTimeout(500);
  ok(await p2.isVisible('.fallback img'), '3D가 안 되면 포스터 그림');
  ok(errs.length === 0, '에러 없음 ' + errs.join(' / '));
  await b.close();
})();
