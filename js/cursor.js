/* 나비 커서 — Intro를 지나면 마우스 커서 대신 Intro의 금빛 나비가 마우스를 따라다님 (2026-11-16)
   - Intro와 같은 나비(js/butterfly-gl.js)를 화면 전체를 덮는 투명 캔버스에 그림. 누르기는 그대로 아래 화면이 받음
   - 가만히 있으면 제자리에서 날갯짓, 움직이면 날갯짓이 빨라지고 빛가루가 뒤로 날림. 가는 쪽으로 몸이 살짝 기욺
   - 누를 수 있는 곳(버튼·링크·석고상) 위에서는 조금 커지고 더 빨리 날갯짓
   - 켜지는 때: body에 bf-cursor가 붙어 있을 때 (js/screens.js의 go()가 Intro가 아닌 화면에서 붙임)
   - 마우스가 없는 기기(휴대폰·태블릿), 움직임 줄이기, WebGL2가 안 되는 브라우저에서는 원래 커서 그대로
   숫자를 바꾸고 싶으면 아래 BF_CURSOR만 고치면 됩니다 */
const BF_CURSOR = {
  size: 24,        // 나비 크기 (클수록 큼. 날개 폭이 대략 이 값의 2.2배 px)
  hot: 1.3,        // 누를 수 있는 곳 위에서 몇 배로 커질지
  dust: 0.03,      // 가만히 있을 때 빛가루 양
  dustMove: 0.55,  // 빨리 움직일 때 더해지는 빛가루 양
  fast: 900,       // 이 속도(px/초)부터 '빨리 움직임'으로 봄
  lean: 0.55,      // 가는 쪽으로 기우는 정도
  maxDpr: 1,       // 선명도 상한 (화면 전체를 그리므로 너무 높이면 무거움)
};
const BF_HOT = 'a[href],button:not(:disabled):not(.no-detail),[role="button"],label,select,summary,.is-hot';
(() => {
  if (!matchMedia('(pointer:fine)').matches || reduce || typeof createButterflyGL !== 'function') return;
  const C = BF_CURSOR, m = { x: 0, y: 0, px: 0, py: 0, v: 0, vx: 0, hot: 0, hotT: 0, a: 0, inside: false };
  let cv = null, GL = null, B = null, raf = 0, last = 0, on = false, dead = false;

  function make() {
    cv = document.createElement('canvas'); cv.className = 'bf-cursor-gl'; cv.setAttribute('aria-hidden', 'true'); document.body.appendChild(cv);
    GL = createButterflyGL(cv, { sky: true, dense: 1, maxDpr: C.maxDpr });
    if (!GL) { cv.remove(); cv = null; dead = true; return; }
    B = GL.butterflies[0];
    cv.addEventListener('webglcontextlost', () => { dead = true; sync(); }); // 3D가 끊기면 원래 커서로
  }
  function frame(t) {
    raf = requestAnimationFrame(frame);
    const dt = Math.min(0.05, Math.max(0.001, (t - last) / 1000)); last = t;
    if (document.hidden) return;
    GL.resize();
    const dx = m.x - m.px, dy = m.y - m.py; m.px = m.x; m.py = m.y;
    const k = 1 - Math.exp(-dt * 8);
    m.v += (Math.min(1, Math.hypot(dx, dy) / dt / C.fast) - m.v) * k;      // 0~1: 얼마나 빨리 움직이는지
    m.vx += (Math.max(-1, Math.min(1, dx / dt / C.fast)) - m.vx) * k;        // -1~1: 왼쪽·오른쪽
    m.hot += (m.hotT - m.hot) * k;
    m.a += ((m.inside ? 1 : 0) - m.a) * (1 - Math.exp(-dt * 12));
    const w = GL.toWorld(m.x, m.y), u = GL.unitsPerPx();
    B.pose = { x: w[0], y: w[1], z: 0, scale: C.size * u * (1 + (C.hot - 1) * m.hot), yaw: -m.vx * 0.5, pitch: 0.2, roll: -m.vx * C.lean };
    B.hzMul = 1 + 1.3 * m.v + 0.5 * m.hot;
    B.dust = m.a > 0.5 ? C.dust + C.dustMove * m.v : 0;
    cv.style.opacity = m.a.toFixed(3);
    if (!m.inside && m.a < 0.01) return; // 마우스가 창 밖이면 그리지 않음 (배터리 아낌)
    GL.simulate(dt); GL.draw();
  }
  // body.bf-cursor가 붙었다 떨어졌다 할 때 켜고 끔
  function sync() {
    on = document.body.classList.contains('bf-cursor') && !dead;
    if (on && !GL) make();
    on = on && !!GL;
    document.body.classList.toggle('bf-gl', on); // css/common.css: 원래 커서를 숨김
    cancelAnimationFrame(raf); raf = 0;
    if (on) { last = performance.now(); raf = requestAnimationFrame(frame); }
    else if (cv) { cv.style.opacity = 0; m.a = 0; m.inside = false; }
  }
  addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    if (!m.inside) { m.px = e.clientX; m.py = e.clientY; if (GL) GL.clearDust(); } // 처음 들어올 때 먼 곳에서 끌려오지 않게
    m.x = e.clientX; m.y = e.clientY; m.inside = true;
    m.hotT = e.target && e.target.closest && e.target.closest(BF_HOT) ? 1 : 0;
  }, { passive: true });
  document.documentElement.addEventListener('pointerleave', () => { m.inside = false; });
  addEventListener('blur', () => { m.inside = false; });
  new MutationObserver(sync).observe(document.body, { attributes: true, attributeFilter: ['class'] });
  sync();
})();
