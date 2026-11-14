/* Project 방 (#project) — 작품 15개를 보는 방
   ① 첫 화면: 글자 없이 작품 썸네일만 공(구) 모양으로 떠다님. 순서는 들어올 때마다 랜덤. 마우스 쪽으로 기울고, 옆으로 빨리 움직이면 휙 돎
   ② 스크롤하면 카드들이 모여 도넛(고리) 모양이 됨
   ③ 도넛은 저절로 계속 돌고, 스크롤하면 더 돎. 카드는 평평한 판이 아니라 도넛을 따라 휘어진 종이처럼 보임
      (카드 한 장 = 세로로 자른 얇은 띠 여러 개를 둥글게 이어 붙인 것. 띠마다 밝기가 달라 휜 종이 느낌, 살짝 물결치듯 휨)
      카드를 누르거나 Enter 키(맨 앞 카드) = 작품 상세. ← → 키 = 한 장만큼 돌리기
   ④ 스크롤 끝에서도 도넛은 계속 돎 (작품 목록은 없음)
   ⑤ 작품을 누르면 작품 상세 (검은 화면): 왼쪽 제목·이름·설명·맨 아래 메일, 오른쪽 내려 보는 그림 (작품마다 14장 정도), 오른쪽 위 X 닫기
      만든 사람 이름을 누르면 Designer 방의 그 사람 석고상으로 감
   - 메일은 js/data.js 학생마다 email 칸 (비어 있으면 안 보임)
   - 작품 자료는 js/data.js의 work 칸: { src: 대표 그림, title, desc, images: [그림1, 그림2, …] }
     아직 없으면(null) 떠다니는 카드는 글자 없는 회색 임시 카드 (썸네일은 가로:세로 = 4:3이 가장 잘 맞음), 상세 그림도 회색 임시 칸으로 보여 줌
   - 움직임 줄이기: 카드가 저절로 떠다니거나 돌지 않음 (스크롤하면 자리만 바뀜)
   숫자를 바꾸고 싶으면 아래 PROJECT만 고치면 됩니다 (스크롤 길이는 화면 높이 1 = 한 화면) */
const PROJECT = {
  imageCount: 14,                 // 작품 상세의 그림 수 (work.images가 없을 때 보여 줄 임시 칸 수)
  hold: 0.35,                     // 공 모양으로 머무는 스크롤 길이
  gather: 1.0,                    // 공 → 도넛으로 바뀌는 스크롤 길이
  perCard: 0.45,                  // 도넛에서 작품 한 장을 넘기는 스크롤 길이
  focusScale: 1.25, focusOut: 0.45, // 맨 앞 작품: 크기, 앞으로 튀어나오는 정도 (도넛 반지름의 몇 배)
  spin: 7,                        // 공일 때 저절로 도는 속도 (도/초)
  float: 1,                       // 카드가 따로따로 둥둥 움직이는 정도 (0 = 안 움직임)
  ringSpin: 6,                    // 도넛이 저절로 계속 도는 속도 (도/초, 0 = 멈춤)
  strips: 10, stripsMobile: 7,    // 카드 한 장을 몇 개의 띠로 나눠 휘게 할지 (많을수록 매끄럽지만 무거움)
  paper: 1,                       // 종이가 물결치듯 휘는 정도 (0 = 도넛 모양대로만 휨)
  mouseTilt: 14, mouseSpin: 0.22, // 마우스 쪽으로 기우는 각도(도), 마우스를 움직일 때 휙 도는 힘
  // 도넛 보기 방식: 2 = 가까이에서 크게 (카드가 화면 가장자리까지 둘러쌈), 1 = 멀리서 작은 도넛 (예전)
  // 주소 끝에 ?v=1 을 붙이면 (예: index.html?v=1#project) 예전 버전으로 비교해 볼 수 있음
  version: 2,
  near: {                         // 버전 2 숫자 (화면 너비 W에 대한 비율)
    radius: 0.62, radiusMobile: 1.2,  // 도넛 반지름
    card: 0.19, cardMobile: 0.4,      // 도넛일 때 카드 너비
    camera: 0.6,                      // 도넛 안쪽으로 다가가는 정도 (클수록 가까움)
    perspective: 1000,                // 원근 (작을수록 가까운 카드가 더 크게 휘어 보임)
    tilt: -12, roll: -5,              // 위에서 내려다보는 각도, 비스듬히 기울인 각도
    lift: 0.14,                       // 도넛을 위로 올리는 정도 (화면 높이 비율)
  },
};
const pj = {
  root: $('#project'), track: $('#pj-track'), hero: $('#pj-hero'), scene: $('#pj-hero .pj-scene'), space: $('#pj-space'), cloud: $('#pj-cloud'),
  live: $('#pj-live'), view: $('#pj-detail'),
  cards: [], built: false, angle: 0, vel: 0, lastT: 0, mx: 0, my: 0, tmx: 0, tmy: 0, at: -1, back: null,
  u: 0, k: 0, ringBase: 0, front: -1, auto: 0, frontIdx: 0,
  ver: /[?&]v=1\b/.test(location.search) ? 1 : PROJECT.version,
};
const pjSmooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const pjLerp = (a, b, t) => a + (b - a) * t;

// 썸네일이 아직 없을 때의 회색 임시 카드 (사람마다 밝기만 조금 다름)
function pjTempBg(s) { const l = 74 + ((s.no * 7) % 5) * 3; return `linear-gradient(160deg,hsl(36 10% ${l}%),hsl(32 6% ${l - 18}%))`; }
const pjTitle = (s) => (s.work && s.work.title) || '작품 제목 준비 중';

/* 스크롤 자리 (화면 높이 단위): 도넛이 시작되는 곳, k번째 작품이 맨 앞에 오는 곳, 도넛이 끝나는 곳 */
const pjRingAt = () => PROJECT.hold + PROJECT.gather;
const pjCardAt = (k) => pjRingAt() + k * PROJECT.perCard;
const pjEndAt = () => pjCardAt(STUDENTS.length - 1); // 마지막 작품이 맨 앞에 오면 스크롤 끝

/* 떠다니는 카드 + 아래 작품 목록 만들기 (처음 들어올 때 한 번) */
function pjBuild() {
  if (pj.built) return; pj.built = true;
  const n = STUDENTS.length, deg = 180 / Math.PI;
  const order = STUDENTS.map((_, i) => i);                                   // 카드 순서를 랜덤으로 섞기
  for (let j = n - 1; j > 0; j--) { const r = Math.floor(Math.random() * (j + 1)); [order[j], order[r]] = [order[r], order[j]]; }
  const K = pj.K = Math.max(2, innerWidth < 760 ? PROJECT.stripsMobile : PROJECT.strips);
  pj.cloud.innerHTML = order.map((i) => {
    const s = STUDENTS[i], bg = s.work && s.work.src ? `url("${s.work.src}")` : pjTempBg(s); // 썸네일 (없으면 회색 임시)
    const strips = Array.from({ length: K }, () => `<span class="pj-strip" style='background-image:${bg}'></span>`).join('');
    return `<button class="pj-card" type="button" tabindex="-1" aria-hidden="true" data-i="${i}">${strips}</button>`;
  }).join('');
  pj.cards = $$('.pj-card', pj.cloud).map((el, i) => {                       // i = 도넛 위 자리, s = 학생 번호
    const y = 1 - (2 * (i + 0.5)) / n; // 공 위에 골고루 퍼지는 자리 (나선)
    return { el, i, s: +el.dataset.i, th: (i * 137.508) % 360, ph: Math.asin(y) * deg * 0.92, tr: (i * 360) / n, // tr = 도넛 위 자리
      sz: 0.72 + ((i * 7) % 5) * 0.14, f1: 0.5 + ((i * 3) % 7) * 0.09, f2: 0.4 + ((i * 5) % 6) * 0.11, p1: i * 1.7, p2: i * 2.9,
      strips: $$('.pj-strip', el), face: -1 };
  });
  pj.cloud.addEventListener('click', (e) => { const b = e.target.closest('.pj-card'); if (b) pjOpen(+b.dataset.i, b); });
  pjSize();
}
function pjSize() { pj.track.style.height = `${((pjEndAt() + 1) * pj.root.clientHeight).toFixed(0)}px`; }
function pjScrollToU(u, instant) { pj.root.scrollTo({ top: u * pj.root.clientHeight, behavior: instant || reduce ? 'auto' : 'smooth' }); }
/* 도넛에서 k번째 작품을 맨 앞으로 */
function pjGotoCard(k) { pjScrollToU(pjCardAt(clamp(k, 0, STUDENTS.length - 1))); }
function pjFrontNow() { return pj.frontIdx; } // 지금 맨 앞에 가장 가까운 카드 (도넛 위 자리)
const pjInRing = () => pj.u > pjRingAt() - 0.3;

/* 작품 상세 */
function pjOpen(i, from) {
  const s = STUDENTS[i]; pj.at = i; pj.back = from || pj.back;
  const imgs = (s.work && s.work.images && s.work.images.length) ? s.work.images : null;
  const count = imgs ? imgs.length : PROJECT.imageCount;
  $('#pj-d-title').textContent = pjTitle(s);
  $('#pj-d-desc').textContent = (s.work && s.work.desc) || '작품 설명은 자료를 받으면 채워져요.';
  const who = $('#pj-d-who'); who.textContent = s.name; who.setAttribute('aria-label', `${s.name} 디자이너 보기`);
  const mail = $('#pj-d-mail'); mail.hidden = !s.email; mail.textContent = s.email || ''; if (s.email) mail.href = `mailto:${s.email}`; else mail.removeAttribute('href');
  $('#pj-d-images').innerHTML = Array.from({ length: count }, (_, k) => imgs
    ? `<figure class="pj-shot"><img src="${imgs[k]}" alt="${pjTitle(s)} 그림 ${k + 1}" loading="lazy" decoding="async"></figure>`
    : `<figure class="pj-shot pj-shot-temp"><span>그림 ${pad(k + 1)} / ${pad(count)}</span></figure>`).join('');
  pj.view.hidden = false; pj.root.classList.add('reading'); document.body.classList.add('pj-reading'); // 위 메뉴 숨김
  pj.view.scrollTop = 0;
  cancelAnimationFrame(pj.raf); pj.raf = requestAnimationFrame(() => pj.view.classList.add('on'));
  $('#pj-d-close').focus({ preventScroll: true });
}
function pjClose() {
  if (pj.view.hidden) return false;
  cancelAnimationFrame(pj.raf); pj.view.classList.remove('on'); pj.root.classList.remove('reading'); document.body.classList.remove('pj-reading');
  setTimeout(() => { if (!pj.view.classList.contains('on')) pj.view.hidden = true; }, reduce ? 0 : 320);
  pj.root.focus({ preventScroll: true });
  pj.at = -1; return true;
}
function pjStep(d) { if (pj.at >= 0) pjOpen((pj.at + d + STUDENTS.length) % STUDENTS.length); }

/* 매 프레임: 카드 자리 계산 (공 ↔ 도넛, 도넛 돌리기) */
function renderProject(t) {
  if (!pj.built) return;
  const C = PROJECT, W = pj.hero.clientWidth, H = pj.hero.clientHeight, n = STUDENTS.length; if (!W || !H) return;
  const dt = Math.min(64, t - (pj.lastT || t)); pj.lastT = t;
  if (pj.root.classList.contains('reading')) return;
  pj.u = pj.root.scrollTop / H;
  const a = pjSmooth(C.hold, pjRingAt(), pj.u);                                 // 0 = 공, 1 = 도넛
  const kTarget = clamp((pj.u - pjRingAt()) / C.perCard, 0, n - 1);            // 맨 앞에 올 작품 번호 (소수)
  pj.k += (kTarget - pj.k) * (reduce ? 1 : 1 - Math.exp(-dt / 120));

  const live = !reduce, ease = 1 - Math.exp(-dt / 260);
  pj.mx += (pj.tmx - pj.mx) * ease; pj.my += (pj.tmy - pj.my) * ease;
  if (live) { pj.angle += (C.spin * (1 - a) + pj.vel) * dt / 1000; pj.vel *= Math.exp(-dt / 700); pj.auto += C.ringSpin * a * dt / 1000; }
  if (a < 0.01) { pj.ringBase = 360 * Math.round(pj.angle / 360); pj.auto = 0; } // 도넛으로 바뀌기 시작할 때의 기준 각도
  const step = 360 / n, mt = C.mouseTilt * (1 - 0.7 * a);
  const spinY = pjLerp(pj.angle, pj.ringBase - pj.k * step - pj.auto, a) + pj.mx * mt; // 도넛: 스크롤만큼 + 저절로 계속 돎
  const V2 = pj.ver === 2, N = C.near, mob = W < 760;
  const cw = mob ? clamp(W * 0.22, 72, 104) : clamp(W * 0.12, 104, 190), rad = Math.PI / 180, ts = t / 1000, wob = live ? C.float * (1 - 0.85 * a) : 0;
  if (cw !== pj.cw) { pj.cw = cw; pj.hero.style.setProperty('--cw', cw.toFixed(0) + 'px'); }
  // 도넛일 때의 모양: 버전 1 = 멀리서 작은 도넛, 버전 2 = 가까이에서 크게
  const ring = V2
    ? { R: W * (mob ? N.radiusMobile : N.radius), z: -(mob ? 0.55 : N.camera), tilt: N.tilt, roll: N.roll, persp: mob ? 760 : N.perspective,
        y: -H * (mob ? 0.04 : N.lift), sc: (W * (mob ? N.cardMobile : N.card)) / cw, fs: 1.05, fo: 0.06, dimBack: 0.35, dimSide: 0.08 }
    : { R: mob ? W * 0.4 : Math.min(W * 0.36, H * 0.46), y: 0, z: -0.35, tilt: -13, roll: 0, persp: 1400, sc: 0.9, fs: C.focusScale, fo: C.focusOut, dimBack: 0.55, dimSide: 0.25 };
  const Rs = Math.max(Math.min(W * 0.5, H * 0.62), H * 0.4);
  const R = pjLerp(Rs, ring.R, a);
  const tilt = pjLerp(-6, ring.tilt, a) - pj.my * mt * 0.7;
  const persp = pjLerp(1400, ring.persp, a);
  if (Math.abs(persp - (pj.persp || 0)) > 0.5) { pj.persp = persp; pj.scene.style.perspective = persp.toFixed(0) + 'px'; }
  pj.space.style.transform = `translate3d(0,${(ring.y * a).toFixed(1)}px,${(R * pjLerp(-0.35, ring.z, a)).toFixed(1)}px)`;
  pj.cloud.style.transform = `rotateZ(${(ring.roll * a).toFixed(2)}deg) rotateX(${tilt.toFixed(2)}deg) rotateY(${spinY.toFixed(2)}deg)`;
  const K = pj.K, mid = (K - 1) / 2, pap = live ? C.paper : 0;
  if (cw !== pj.sw) { pj.sw = cw; pj.hero.style.setProperty('--sw', (cw / K).toFixed(2) + 'px'); }
  let best = 999;
  for (const c of pj.cards) {
    const th = pjLerp(c.th, c.tr, a) + Math.sin(ts * c.f1 + c.p1) * 6 * wob;
    const ph = pjLerp(c.ph, 0, a) + Math.cos(ts * c.f2 + c.p2) * 5 * wob;
    const r = R * (1 + Math.sin(ts * c.f2 + c.p1) * 0.07 * wob);
    const ang = ((th + spinY) % 360 + 540) % 360 - 180;                       // 맨 앞에서 얼마나 돌아가 있는지 (-180~180도)
    if (Math.abs(ang) < best) { best = Math.abs(ang); pj.frontIdx = c.i; }
    const near = Math.max(0, 1 - Math.abs(ang) / step) * a;                    // 맨 앞 작품일수록 1
    const back = Math.cos(ang * rad) < 0, face = back ? 180 : 0;              // 뒤쪽 카드는 뒤집어서 그림이 거꾸로 보이지 않게
    if (c.face !== face) {                                                     // 뒤집히면 띠 순서도 거꾸로 (그림이 좌우로 뒤바뀌지 않게)
      c.face = face;
      c.strips.forEach((el, j) => { const k = back ? K - 1 - j : j; el.style.backgroundPosition = `${(k / (K - 1) * 100).toFixed(2)}% 50%`;
        el.classList.toggle('l', k === 0); el.classList.toggle('r', k === K - 1); });
    }
    const sc = pjLerp(c.sz, ring.sc, a) * (1 + (ring.fs - 1) * near);
    const rz = r + R * ring.fo * near, dth = (cw * sc / K) / rz / rad;         // 띠 하나가 차지하는 도넛 위 각도
    const op = (1 - a * ring.dimBack * (1 - Math.cos(ang * rad)) / 2 - a * ring.dimSide * (1 - near)).toFixed(2); // 도넛 뒤쪽 카드는 흐리게 (배경색으로 덮음)
    const twist = Math.sin(ts * 0.45 + c.p1) * 3 * pap;                         // 종이가 살짝 비틀림 (도)
    for (let j = 0; j < K; j++) {
      const x = (j - mid) / mid;                                               // 카드 왼쪽 끝 -1 ~ 오른쪽 끝 1
      // 종이가 물결치듯 앞뒤로 휨: 띠마다 도넛에서 조금 들어가고 나오고, 그 기울기만큼 띠를 비스듬히 돌려서 이음매가 벌어지지 않게
      const ph2 = x * 2.2 + ts * 0.8 + c.p2, amp = cw * sc * 0.06 * pap;
      const wave = amp * Math.sin(ph2), slope = Math.atan(amp * Math.cos(ph2) * 2.2 * 2 / (cw * sc)) / rad;
      const el = c.strips[j], a2 = ang + (j - mid) * dth;
      el.style.transform = `rotateY(${(th + (j - mid) * dth).toFixed(2)}deg) rotateX(${ph.toFixed(2)}deg) translateZ(${(rz + wave).toFixed(1)}px) rotateY(${(face - slope).toFixed(2)}deg) rotateX(${(twist * x).toFixed(2)}deg) scale(${(sc / Math.cos(slope * rad)).toFixed(3)}, ${sc.toFixed(3)})`;
      el.style.setProperty('--sh', (0.34 * (1 - Math.abs(Math.cos(a2 * rad)))).toFixed(3)); // 옆으로 돌아간 띠일수록 어둡게 = 휜 종이 그림자
      if (el.dataset.op !== op) { el.dataset.op = op; el.style.setProperty('--fog', (1 - op).toFixed(2)); } // 흐리게 = 배경색 안개 (투명하게 하면 띠 이음매가 보여서)
    }
  }
  // 맨 앞 작품 (화면에는 글자 없이, 화면 읽기 프로그램에만 알림)
  const f = a > 0.85 ? pj.frontIdx : -1;
  if (f !== pj.front) {
    pj.front = f; const s = f >= 0 ? STUDENTS[pj.cards[f].s] : null;
    pj.live.textContent = s ? `${s.name}, ${pjTitle(s)}. Enter 키를 누르면 작품 보기` : '';
  }
}
function enterProject() {
  pjBuild();
  pj.root.classList.toggle('still', reduce);
}
/* 키보드 (js/main.js가 부름): 상세가 열려 있으면 Esc 닫기, ← → 이전/다음 작품. 도넛에서는 ← → 로 한 장씩 */
function projectKey(e) {
  if (!pj.view.hidden) {
    if (e.key === 'Escape') return pjClose();
    if (e.key === 'ArrowLeft') { pjStep(-1); return true; }
    if (e.key === 'ArrowRight') { pjStep(1); return true; }
    return false;
  }
  if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
    if (pj.u < pjRingAt() - 0.3) { pjGotoCard(0); return true; }
    pjScrollToU(clamp(pj.u + (e.key === 'ArrowRight' ? 1 : -1) * PROJECT.perCard, pjRingAt(), pjEndAt())); return true;
  }
  if (e.key === 'Enter' && pjInRing() && (e.target === pj.root || e.target === document.body)) { pjOpen(pj.cards[pjFrontNow()].s); return true; }
  return false;
}

pj.hero.addEventListener('pointermove', (e) => {
  if (e.pointerType !== 'mouse' || reduce) return;
  const r = pj.hero.getBoundingClientRect();
  pj.tmx = ((e.clientX - r.left) / r.width - 0.5) * 2; pj.tmy = ((e.clientY - r.top) / r.height - 0.5) * 2;
  pj.vel = clamp(pj.vel + e.movementX * PROJECT.mouseSpin * (pj.u < PROJECT.hold ? 1 : 0), -90, 90);
});
pj.hero.addEventListener('pointerleave', () => { pj.tmx = pj.tmy = 0; });
addEventListener('resize', () => { if (pj.built) pjSize(); });

$('#pj-d-close').addEventListener('click', pjClose);
$('#pj-d-who').addEventListener('click', () => { const i = pj.at; pjClose(); go('designer'); dgFocus(i); });
