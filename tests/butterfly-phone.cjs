// 폰 나비 페이지(butterfly.html) 검사: 나비가 그려지는지, 만지면 손가락 쪽으로 오는지, 3D가 안 되면 포스터가 나오는지
// 사용: npm start 를 켠 상태에서  node tests/butterfly-phone.cjs
const { chromium, devices } = require('playwright');
const URL = (process.env.BASE || 'http://localhost:8765') + '/butterfly.html';
const ok = (c, m) => { if (!c) { console.error('실패: ' + m); process.exitCode = 1; } else console.log('통과: ' + m); };
(async () => {
  const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const errs = [];
  const p = await (await b.newContext({ ...devices['iPhone 13'] })).newPage();
  p.on('pageerror', (e) => errs.push(e.message));
  await p.goto(URL); await p.waitForTimeout(1500);
  ok(await p.evaluate(() => !document.body.classList.contains('no-gl') && !!window.__bf), '나비(3D)가 켜짐');
  await p.touchscreen.tap(300, 320); await p.waitForTimeout(1200);
  const s = await p.evaluate(() => ({ x: __bf.s.x, y: __bf.s.y }));
  ok(Math.hypot(s.x - 300, s.y - (320 - 70)) < 80, `톡 친 곳(손가락 조금 위)으로 날아옴 (${s.x | 0}, ${s.y | 0})`);
  ok(await p.getAttribute('a.go', 'href') === './', '사이트로 가는 버튼');
  const p2 = await (await b.newContext({ ...devices['iPhone 13'] })).newPage();
  await p2.addInitScript(() => { const g = HTMLCanvasElement.prototype.getContext; HTMLCanvasElement.prototype.getContext = function (t, ...a) { return t === 'webgl2' ? null : g.call(this, t, ...a); }; });
  await p2.goto(URL); await p2.waitForTimeout(500);
  ok(await p2.isVisible('.fallback img'), '3D가 안 되면 포스터 그림');
  ok(errs.length === 0, '에러 없음 ' + errs.join(' / '));
  await b.close();
})();
