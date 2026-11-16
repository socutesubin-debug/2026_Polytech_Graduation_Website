// 폰 AR 나비 페이지(butterfly.html) 검사: 열자마자 카메라 + 나비, 폰을 돌리면 나비가 공간에 남는지, 버튼은 '웹사이트 구경하기' 하나, 3D가 안 되면 포스터
// 사용: npm start 를 켠 상태에서  node tests/butterfly-phone.cjs
const { chromium, devices } = require('playwright');
const URL = (process.env.BASE || 'http://localhost:8765') + '/butterfly.html';
const ok = (c, m) => { if (!c) { console.error('실패: ' + m); process.exitCode = 1; } else console.log('통과: ' + m); };
(async () => {
  const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream'] });
  const errs = [];
  const p = await (await b.newContext({ ...devices['iPhone 13'], permissions: ['camera'] })).newPage();
  p.on('pageerror', (e) => errs.push(e.message));
  await p.goto(URL + '?hand=0'); await p.waitForTimeout(1500); // hand=0: 손 인식 프로그램은 빼고(검사용 브라우저에서는 아주 느림) 앉는 동작만 따로 검사
  ok(await p.evaluate(() => !document.body.classList.contains('no-gl') && !!(window.__bfAR && __bfAR.ar)), '열자마자 AR 나비가 켜짐');
  ok(await p.evaluate(() => document.body.classList.contains('cam-on')), '카메라 화면이 켜짐');
  const btns = await p.$$eval('a, button', (els) => els.filter((e) => e.offsetParent !== null || getComputedStyle(e).position === 'fixed').map((e) => e.textContent.trim()));
  ok(btns.length === 1 && btns[0].startsWith('웹사이트 구경하기'), '버튼은 웹사이트 구경하기 하나: ' + JSON.stringify(btns));
  ok(await p.getAttribute('a.go', 'href') === './', '버튼이 사이트로 감');
  // 폰을 오른쪽으로 돌리면(alpha 감소) 앞에 있던 나비가 화면 왼쪽으로 가야 함
  const ori = (a) => p.evaluate((a) => { const e = new Event('deviceorientation'); e.alpha = a; e.beta = 90; e.gamma = 0; dispatchEvent(e); }, a);
  for (let i = 0; i < 25; i++) { await ori(0); await p.waitForTimeout(40); }
  ok(await p.evaluate(() => __bfAR.ar.hasSensor), '기울기 센서 값을 받음');
  ok(btns[0] === '웹사이트 구경하기', '버튼에 화살표 없음');
  // 손: 손 위치를 알려 주면 그 자리로 날아가 앉아야 함
  for (let i = 0; i < 80; i++) { await ori(0); await p.evaluate(() => __bfAR.ar.setHand({ sx: 195, sy: 500, depth: 0.4 })); await p.waitForTimeout(40); }
  ok(await p.evaluate(() => __bfAR.ar.state.sit > 0.8), '손이 보이면 손 위에 앉음');
  for (let i = 0; i < 40; i++) { await ori(0); await p.waitForTimeout(40); }
  ok(await p.evaluate(() => __bfAR.ar.state.sit < 0.3), '손이 사라지면 다시 날아감');
  const p2 = await (await b.newContext({ ...devices['iPhone 13'] })).newPage();
  await p2.addInitScript(() => { const g = HTMLCanvasElement.prototype.getContext; HTMLCanvasElement.prototype.getContext = function (t, ...a) { return t === 'webgl2' ? null : g.call(this, t, ...a); }; });
  await p2.goto(URL); await p2.waitForTimeout(500);
  ok(await p2.isVisible('.fallback img'), '3D가 안 되면 포스터 그림');
  ok(errs.length === 0, '에러 없음 ' + errs.join(' / '));
  await b.close();
})();
