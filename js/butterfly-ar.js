/* AR 나비 — 폰 카메라 화면 위에 금빛 나비가 '진짜 방 안에' 떠 있는 것처럼 보이게 함 (2026-11-16, butterfly.html에서 씀)
   어떻게 하나요?
   - 뒤 카메라 영상을 화면 가득 깔고, 그 위에 투명한 나비 그림(js/butterfly-gl.js)을 겹쳐요
   - 폰의 기울기 센서로 '폰이 어느 쪽을 보고 있는지' 알아내요. 나비는 내 주위 1m 안팎의 공간에 자리를 갖고 날아다니고,
     폰을 돌리면 그만큼 반대로 화면에서 움직여서 공간에 떠 있는 것처럼 보여요
   - 가까우면 크게, 멀면 작게. 나비 몸의 방향도 3D로 계산해서 옆모습·뒷모습·앞모습이 다 보여요
   - 화면을 톡 치면 나비가 내 앞으로 가까이 날아와요. 화면 밖으로 나가면 가장자리에 '나비는 이쪽' 화살표
   - 아이폰·안드로이드 모두 되는 방식(카메라 + 기울기 센서). 카메라는 https 주소에서만 켜져요
   숫자를 바꾸고 싶으면 아래 BF_AR만 고치면 됩니다 */
const BF_AR = {
  span: 0.18,        // 나비 날개 폭 (m). 클수록 큰 나비
  fov: 62,           // 폰 카메라가 위아래로 보는 각도(도). 나비가 공간에 붙어 있지 않고 미끄러지는 느낌이면 55~70 사이로 조절
  near: 0.25,        // 이보다 가까이는 안 옴 (m)
  dist: [0.55, 1.2], // 혼자 날 때 나와의 거리 (가까울 때, 멀 때) (m)
  height: 0.3,       // 위아래로 오르내리는 폭 (m)
  wander: 0.5,       // 좌우로 돌아다니는 폭 (라디안. 0.5면 화면 밖으로 살짝 나갔다 들어옴, 1.57이면 양옆 90도까지 — 폰 세로 화면은 좌우로 좁게 보여서 크게 하면 자주 안 보임)
  speed: 0.17,       // 돌아다니는 빠르기
  pull: 1.35,        // 가려는 곳으로 끌리는 힘
  comeClose: 0.42,   // 톡 치면 내 앞 몇 m까지 오는지
  comeTime: 2.6,     // 가까이 와서 머무는 시간 (초)
  dust: 0.12,        // 가만히 있을 때 빛가루 양 (웹사이트 커서는 0.03. 카메라 화면 위라 더 많이)
  dustMove: 1.0,     // 빨리 날 때 더해지는 빛가루 양 (커서는 0.55)
  dustBright: 2.0,   // 빛가루 밝기 (1 = 웹사이트 커서와 같음)
  dustSize: 1.35,    // 빛가루 알갱이 크기 (1 = 커서와 같음)
  dustLife: 1.7,     // 지나간 자리에 빛가루 잔상이 남는 시간 (1 = 커서와 같음, 클수록 꼬리가 길게)
  glow: 2.2,         // 나비 둘레 빛남 세기 (1 = 커서와 같음)
  fast: 900,         // 화면에서 이 속도(px/초)부터 '빨리 움직임'으로 봄 (커서와 같은 값)
  showBack: 0.45,    // 나비 등을 나 쪽으로 살짝 돌려서 날개가 잘 보이게 (0 = 진짜 방향 그대로, 1 = 늘 등을 보여 줌)
  followCam: 1.3,    // 카메라가 보는 쪽을 따라오는 빠르기 (클수록 바로 따라옴, 0이면 처음 본 쪽에만 머묾)
  handPull: 3.2,     // 손을 보면 손 쪽으로 끌리는 힘
  handSit: 0.07,     // 손에 이만큼(m) 가까워지면 '앉은' 것으로 봄
  sitFlap: 0.28,     // 앉아 있을 때 날갯짓 빠르기 (평소의 몇 배)
  smooth: 14,        // 센서 흔들림 줄이기 (클수록 즉각, 작을수록 부드러움)
};

function startButterflyAR(opt) {
  const C = BF_AR, GL = opt.GL, B = GL.butterflies[0];
  GL.glow = C.glow; GL.dustBright = C.dustBright; GL.dustSize = C.dustSize; GL.dustLife = C.dustLife; // 빛남·빛가루 세기 (위 BF_AR 숫자)
  const root = opt.root, video = opt.video, arrow = opt.arrow;
  let raf = 0, last = performance.now(), alive = true, stream = null, hasOri = false, oriRaw = null;
  /* ---- 3x3 행렬·벡터 (행 우선) ---- */
  const mul = (a, b) => { const o = new Array(9); for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) o[r*3+c] = a[r*3]*b[c] + a[r*3+1]*b[3+c] + a[r*3+2]*b[6+c]; return o; };
  const T = (a) => [a[0], a[3], a[6], a[1], a[4], a[7], a[2], a[5], a[8]];
  const app = (m, v) => [m[0]*v[0] + m[1]*v[1] + m[2]*v[2], m[3]*v[0] + m[4]*v[1] + m[5]*v[2], m[6]*v[0] + m[7]*v[1] + m[8]*v[2]];
  const rx = (a) => { const c = Math.cos(a), s = Math.sin(a); return [1, 0, 0, 0, c, -s, 0, s, c]; };
  const ry = (a) => { const c = Math.cos(a), s = Math.sin(a); return [c, 0, s, 0, 1, 0, -s, 0, c]; };
  const rz = (a) => { const c = Math.cos(a), s = Math.sin(a); return [c, -s, 0, s, c, 0, 0, 0, 1]; };
  const cross = (a, b) => [a[1]*b[2] - a[2]*b[1], a[2]*b[0] - a[0]*b[2], a[0]*b[1] - a[1]*b[0]];
  const norm = (a) => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0]/l, a[1]/l, a[2]/l]; };
  /* 행렬 ↔ 사원수 (부드럽게 섞으려고) */
  function toQ(m) {
    const t = m[0] + m[4] + m[8]; let q;
    if (t > 0) { const s = Math.sqrt(t + 1)*2; q = [(m[7] - m[5])/s, (m[2] - m[6])/s, (m[3] - m[1])/s, s/4]; }
    else if (m[0] > m[4] && m[0] > m[8]) { const s = Math.sqrt(1 + m[0] - m[4] - m[8])*2; q = [s/4, (m[1] + m[3])/s, (m[2] + m[6])/s, (m[7] - m[5])/s]; }
    else if (m[4] > m[8]) { const s = Math.sqrt(1 + m[4] - m[0] - m[8])*2; q = [(m[1] + m[3])/s, s/4, (m[5] + m[7])/s, (m[2] - m[6])/s]; }
    else { const s = Math.sqrt(1 + m[8] - m[0] - m[4])*2; q = [(m[2] + m[6])/s, (m[5] + m[7])/s, s/4, (m[3] - m[1])/s]; }
    return q;
  }
  function fromQ(q) {
    const [x, y, z, w] = q;
    return [1 - 2*(y*y + z*z), 2*(x*y - z*w), 2*(x*z + y*w), 2*(x*y + z*w), 1 - 2*(x*x + z*z), 2*(y*z - x*w), 2*(x*z - y*w), 2*(y*z + x*w), 1 - 2*(x*x + y*y)];
  }

  /* ---- 폰이 보는 방향 (세계: y = 위, 처음 폰이 본 쪽 ≈ -z) ---- */
  function oriMatrix(o) { // three.js DeviceOrientationControls와 같은 식
    const d = Math.PI/180, scr = ((screen.orientation && screen.orientation.angle) || window.orientation || 0)*d;
    return mul(mul(mul(mul(ry(o.alpha*d), rx(o.beta*d)), rz(-o.gamma*d)), rx(-Math.PI/2)), rz(-scr));
  }
  const onOri = (e) => { if (e.alpha == null && e.beta == null) return; oriRaw = { alpha: e.alpha || 0, beta: e.beta || 0, gamma: e.gamma || 0 }; hasOri = true; };
  addEventListener('deviceorientation', onOri);
  /* 센서가 없을 때(PC 등): 화면을 끌어서 둘러보기 */
  const look = { yaw: 0, pitch: 0 };
  let usedOri = false, camQ = null, cam = [1, 0, 0, 0, 1, 0, 0, 0, 1], camPrev = null, yaw0 = null;

  /* ---- 나비 상태 (m) ---- */
  const s = { mv: 0, lastS: null, F: null, hand: null, handT: -99, sit: 0, p: [0, 0.05, -1.1], v: [0, 0, 0], f: [1, 0, 0], bank: 0, t: 0, come: -99, now: 0 };

  function frame(t) {
    if (!alive) return;
    raf = requestAnimationFrame(frame);
    const dt = Math.min(0.05, Math.max(0.001, (t - last)/1000)); last = t; s.now = t/1000;
    if (document.hidden) return;
    GL.resize();
    const W = innerWidth, H = innerHeight;

    /* 1) 카메라 방향 (센서 → 부드럽게) */
    if (hasOri && !usedOri) { usedOri = true; camQ = null; yaw0 = null; s.v = [0, 0, 0]; } // 센서가 처음 들어오면 그때 폰이 보는 쪽 앞에 나비를 다시 놓음
    const raw = hasOri && oriRaw ? oriMatrix(oriRaw) : mul(ry(look.yaw), rx(look.pitch));
    const q = toQ(raw);
    if (!camQ) camQ = q;
    else {
      if (camQ[0]*q[0] + camQ[1]*q[1] + camQ[2]*q[2] + camQ[3]*q[3] < 0) q.forEach((v, i) => q[i] = -v);
      const k = 1 - Math.exp(-dt*C.smooth);
      camQ = norm4(camQ.map((v, i) => v + (q[i] - v)*k));
    }
    cam = fromQ(camQ);
    const view = T(cam);
    if (yaw0 === null) { const f0 = app(cam, [0, 0, -1]); yaw0 = Math.atan2(-f0[0], -f0[2]); s.p = [-Math.sin(yaw0)*1.1, 0.05, -Math.cos(yaw0)*1.1]; }

    { const fw0 = app(cam, [0, 0, -1]); if (!s.F) s.F = fw0; const a = 1 - Math.exp(-dt*C.followCam); s.F = norm([s.F[0] + (fw0[0] - s.F[0])*a, s.F[1] + (fw0[1] - s.F[1])*a, s.F[2] + (fw0[2] - s.F[2])*a]); }
    /* 2) 나비가 갈 곳: 내 주위를 천천히 돌아다니다가, 톡 치면 내 앞으로 */
    s.t += dt*C.speed*6;
    let goal;
    if (s.now - s.come < C.comeTime) {
      const fw = app(cam, [0, -0.08, -1]);
      goal = [fw[0]*C.comeClose, fw[1]*C.comeClose, fw[2]*C.comeClose];
    } else {
      /* 카메라가 보는 쪽(천천히 따라가는 방향 s.F)을 가운데로 삼아 그 둘레를 돌아다님 → 폰을 돌리면 나비가 따라옴 */
      const ph = Math.atan2(-s.F[0], -s.F[2]) + C.wander*(0.75*Math.sin(s.t*0.17) + 0.25*Math.sin(s.t*0.53 + 1.3));
      const r = C.dist[0] + (C.dist[1] - C.dist[0])*(0.5 + 0.5*Math.sin(s.t*0.31 + 2));
      const y = s.F[1]*r + 0.05 + C.height*Math.sin(s.t*0.41) + 0.06*Math.sin(s.t*1.3);
      const hr = Math.sqrt(Math.max(0.05, 1 - s.F[1]*s.F[1]))*r;
      goal = [-Math.sin(ph)*hr, y, -Math.cos(ph)*hr];
    }
    /* 손이 보이면: 손바닥 자리로 날아가서 앉음 */
    let pull = C.pull, sitting = false;
    const handOn = s.hand && s.now - s.handT < 0.6;
    if (handOn) {
      const fpx0 = H/2/Math.tan(C.fov*Math.PI/360), d = Math.max(C.near*0.8, Math.min(1.2, s.hand.depth));
      goal = app(cam, [(s.hand.sx - W/2)/fpx0*d, -(s.hand.sy - H/2)/fpx0*d + 0.015, -d]);
      const gd = Math.hypot(goal[0] - s.p[0], goal[1] - s.p[1], goal[2] - s.p[2]);
      sitting = gd < C.handSit; pull = sitting ? 9 : C.handPull;
    }
    s.sit += ((sitting ? 1 : 0) - s.sit)*(1 - Math.exp(-dt*5));
    const k = pull*pull, damp = 2*pull*(sitting ? 1 : 0.75);
    for (let i = 0; i < 3; i++) { s.v[i] += ((goal[i] - s.p[i])*k - s.v[i]*damp)*dt; s.p[i] += s.v[i]*dt; }
    const dl = Math.hypot(s.p[0], s.p[1], s.p[2]); // 너무 가까이 오지 않게
    if (dl < C.near && !handOn) for (let i = 0; i < 3; i++) s.p[i] *= C.near/dl;

    /* 3) 몸 방향: 날아가는 쪽으로 머리, 도는 쪽으로 몸을 기울임 */
    const sp = Math.hypot(s.v[0], s.v[1], s.v[2]);
    const fPrev = s.f;
    if (sp > 0.04) {
      const want = norm([s.v[0], Math.max(-0.5, Math.min(0.5, s.v[1]/(sp + 1e-6)))*sp*0.6, s.v[2]]);
      const a = 1 - Math.exp(-dt*(1.5 + 4*Math.min(1, sp)));
      s.f = norm([s.f[0] + (want[0] - s.f[0])*a, s.f[1] + (want[1] - s.f[1])*a, s.f[2] + (want[2] - s.f[2])*a]);
    }
    if (s.sit > 0.5) { const cu = app(cam, [0.15, 1, 0]), a = 1 - Math.exp(-dt*4); s.f = norm([s.f[0] + (cu[0] - s.f[0])*a, s.f[1] + (cu[1] - s.f[1])*a, s.f[2] + (cu[2] - s.f[2])*a]); } // 앉으면 머리를 위로
    const turn = Math.atan2(fPrev[0]*s.f[2] - fPrev[2]*s.f[0], fPrev[0]*s.f[0] + fPrev[2]*s.f[2])/dt;
    s.bank += (Math.max(-0.7, Math.min(0.7, turn*0.35)) - s.bank)*(1 - Math.exp(-dt*4));
    /* 등(날개 윗면)이 하늘 쪽 + 조금은 나 쪽을 보게: 옆에서 날개가 납작한 선으로만 보이는 때를 줄임 */
    const toMe = norm([-s.p[0], -s.p[1], -s.p[2]]);
    const upW = norm([toMe[0]*C.showBack, 1 + toMe[1]*C.showBack, toMe[2]*C.showBack]);
    let r = norm(cross(s.f, upW)), u = cross(r, s.f);
    const cb = Math.cos(s.bank), sb = Math.sin(s.bank); // 머리 축으로 기울이기
    [r, u] = [[r[0]*cb + u[0]*sb, r[1]*cb + u[1]*sb, r[2]*cb + u[2]*sb], [u[0]*cb - r[0]*sb, u[1]*cb - r[1]*sb, u[2]*cb - r[2]*sb]];
    const body = [r[0], s.f[0], u[0], r[1], s.f[1], u[1], r[2], s.f[2], u[2]]; // 나비의 x(날개)=r, y(머리)=f, z(등)=u

    /* 4) 화면에 옮기기 */
    const bob = 0.012*Math.sin(B.phase || 0);
    const pc = app(view, [s.p[0], s.p[1] + bob, s.p[2]]);
    const fpx = H/2/Math.tan(C.fov*Math.PI/360);
    const behind = pc[2] > -0.05;
    const depth = Math.max(0.05, -pc[2]);
    const sx = W/2 + fpx*pc[0]/depth, sy = H/2 - fpx*pc[1]/depth;
    const M = mul(view, body); // 카메라에서 본 나비 방향 → YXZ 각도로 나눔 (butterfly-gl의 ry·rx·rz 순서)
    const pitch = Math.asin(Math.max(-1, Math.min(1, -M[5])));
    let yaw, roll;
    if (Math.abs(M[5]) < 0.9999) { yaw = Math.atan2(M[2], M[8]); roll = Math.atan2(M[3], M[4]); } else { yaw = Math.atan2(-M[6], M[0]); roll = 0; }
    const u2 = GL.unitsPerPx(), wpt = GL.toWorld(sx, sy);
    const spanPx = Math.min(W*1.1, fpx*C.span/depth);
    B.pose = { x: wpt[0], y: wpt[1], z: 0, yaw, pitch, roll, scale: spanPx/2.2*u2 };
    B.hzMul = (1 + 0.8*Math.min(1, sp/0.8))*(1 - s.sit) + C.sitFlap*s.sit;
    /* 빛가루: 웹사이트 나비 커서와 같은 방식 — 화면에서 빨리 움직일수록 빛가루가 뒤로 흩날림, 가만히 있으면 아주 조금 */
    const scrV = s.lastS ? Math.min(1, Math.hypot(sx - s.lastS[0], sy - s.lastS[1])/dt/C.fast) : 0; s.lastS = [sx, sy];
    s.mv += (scrV - s.mv)*(1 - Math.exp(-dt*8));
    B.dust = behind || reduceMotion ? 0 : (C.dust + C.dustMove*s.mv)*(1 - 0.8*s.sit);
    /* 빛가루가 화면에 붙어 다니지 않고 공간에 남도록: 폰이 돈 만큼만 가루를 같이 밀어 줌 (나비가 움직인 몫은 빼고) */
    if (camPrev) {
      const pPrev = app(T(camPrev), s.p), d0 = Math.max(0.05, -pPrev[2]);
      const ox = W/2 + fpx*pPrev[0]/d0, oy = H/2 - fpx*pPrev[1]/d0;
      const nx = W/2 + fpx*pc[0]/depth, ny = H/2 - fpx*pc[1]/depth;
      GL.wind[0] = Math.max(-30, Math.min(30, (nx - ox)*u2/dt)); GL.wind[1] = Math.max(-30, Math.min(30, -(ny - oy)*u2/dt));
    }
    camPrev = cam;
    opt.canvas.style.opacity = behind ? '0' : '1';
    GL.simulate(dt); GL.draw();

    /* 5) 화면 밖이면 가장자리 화살표 */
    const off = behind || sx < -20 || sx > W + 20 || sy < -20 || sy > H + 20;
    arrow.classList.toggle('on', off);
    if (off) {
      let dx = pc[0], dy = -pc[1]; if (behind && Math.hypot(dx, dy) < 1e-3) dx = 1;
      const a = Math.atan2(dy, dx), m = 34;
      const ex = Math.cos(a), ey = Math.sin(a), tx = (W/2 - m)/Math.max(1e-6, Math.abs(ex)), ty = (H/2 - m)/Math.max(1e-6, Math.abs(ey)), tt = Math.min(tx, ty);
      arrow.style.transform = `translate(${W/2 + ex*tt}px, ${H/2 + ey*tt}px) rotate(${a}rad)`;
    }
  }
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  function norm4(q) { const l = Math.hypot(q[0], q[1], q[2], q[3]) || 1; return q.map(v => v/l); }

  /* 톡 치기 = 가까이 와 줘 / 끌기 = (센서 없을 때) 둘러보기 */
  let drag = null;
  const down = (e) => { drag = { x: e.clientX, y: e.clientY, yaw: look.yaw, pitch: look.pitch, moved: false }; };
  const move = (e) => {
    if (!drag) return;
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    if (Math.hypot(dx, dy) > 8) drag.moved = true;
    if (!hasOri) { look.yaw = drag.yaw + dx*0.005; look.pitch = Math.max(-1.2, Math.min(1.2, drag.pitch + dy*0.005)); }
  };
  const up = () => { if (drag && !drag.moved) s.come = s.now; drag = null; };
  root.addEventListener('pointerdown', down); root.addEventListener('pointermove', move);
  root.addEventListener('pointerup', up); root.addEventListener('pointercancel', () => { drag = null; });

  GL.clearDust();
  raf = requestAnimationFrame(frame);
  return {
    get hasSensor() { return hasOri; },
    state: s,
    /* 손 위치 알려 주기: { sx, sy } = 화면 px, depth = 손까지 거리(m). 손이 안 보이면 null */
    setHand(h) { if (h) { s.hand = h; s.handT = s.now; } else s.hand = null; },
    stop() {
      alive = false; cancelAnimationFrame(raf);
      removeEventListener('deviceorientation', onOri);
      root.removeEventListener('pointerdown', down); root.removeEventListener('pointermove', move); root.removeEventListener('pointerup', up);
      GL.wind[0] = GL.wind[1] = GL.wind[2] = 0; GL.clearDust();
      opt.canvas.style.opacity = '1';
    },
  };
}

/* 카메라·센서 허락받기. 반드시 '누르기' 안에서 불러야 함(아이폰 규칙).
   돌려주는 값: { stream } 또는 { error: '이유' } */
async function askButterflyAR(video) {
  if (!window.isSecureContext || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return { error: 'insecure' };
  // 아이폰: 기울기 센서 허락 (누른 순간 바로 물어야 해서 카메라보다 먼저 시작)
  let oriP = Promise.resolve('granted');
  try { if (window.DeviceOrientationEvent && typeof DeviceOrientationEvent.requestPermission === 'function') oriP = DeviceOrientationEvent.requestPermission().catch(() => 'denied'); } catch (e) { oriP = Promise.resolve('denied'); }
  const camP = navigator.mediaDevices.getUserMedia({ audio: false, video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } } });
  let stream;
  try { stream = await camP; } catch (e) { return { error: 'camera' }; }
  const ori = await oriP;
  video.srcObject = stream; video.muted = true; video.setAttribute('playsinline', '');
  try { await video.play(); } catch (e) {}
  return { stream, ori };
}
