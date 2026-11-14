/* Project 방 (#project) — 작품 15개를 보는 방
   ① 첫 화면: 글자 없이 작품 썸네일만 공(구) 모양으로 떠다님. 순서는 들어올 때마다 랜덤. 마우스 쪽으로 기울고, 옆으로 빨리 움직이면 휙 돎
   ② 스크롤하면 카드들이 모여 도넛(고리) 모양이 됨
   ③ 도넛은 저절로 계속 돌고, 카드는 종이처럼 팔랑팔랑 흩날림. 스크롤하면 더 돌고, 빨리 스크롤하면 카드가 바람에 흩어지듯 퍼졌다가 다시 모임
      카드를 누르거나 Enter 키(맨 앞 카드) = 작품 상세. ← → 키 = 한 장만큼 돌리기
   ④ 스크롤 끝에서도 도넛은 계속 돎 (작품 목록은 없음)
   ⑤ 작품을 누르면 작품 상세 (검은 화면): 왼쪽 제목·이름·설명·맨 아래 메일, 오른쪽 내려 보는 그림 (작품마다 14장 정도), 오른쪽 위 X 닫기
      만든 사람 이름을 누르면 Designer 방의 그 사람 석고상으로 감
   - 메일은 js/data.js 학생마다 email 칸 (비어 있으면 안 보임)
   - 작품 자료는 js/data.js의 work 칸: { src: 대표 그림, title, desc, images: [그림1, 그림2, …] }
     아직 없으면(null) 떠다니는 카드는 글자 없는 회색 임시 카드, 작품 목록은 이름이 적힌 회색 카드, 상세 그림도 회색 임시 칸으로 보여 줌
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
  flutter: 1,                     // 종이처럼 팔랑이는 정도 (0 = 안 팔랑임)
  scatter: 1,                     // 빨리 스크롤할 때 카드가 흩어지는 정도 (0 = 안 흩어짐)
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
  u: 0, k: 0, ringBase: 0, front: -1, auto: 0, sv: 0, prevU: 0, frontIdx: 0,
  ver: /[?&]v=1\b/.test(location.search) ? 1 : PROJECT.version,
};
const pjSmooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const pjLerp = (a, b, t) => a + (b - a) * t;

function pjThumb(s, small) {
  if (s.work && s.work.src) return `<img src="${s.work.src}" alt="${small ? '' : `${s.name}의 작품${s.work.title ? ': ' + s.work.title : ''}`}" loading="lazy" decoding="async">`;
  if (small) return `<span class="pj-temp" style="filter:brightness(${(0.88 + ((s.no * 7) % 5) * 0.06).toFixed(2)})"></span>`; // 떠다니는 카드: 글자 없이
  return `<span class="pj-temp"><em>${pad(s.no)}</em><b>${s.name}</b><small>작품 준비 중</small></span>`;
}
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
  pj.cloud.innerHTML = order.map((i) => `<button class="pj-card" type="button" tabindex="-1" aria-hidden="true" data-i="${i}">${pjThumb(STUDENTS[i], true)}</button>`).join('');
  pj.cards = $$('.pj-card', pj.cloud).map((el, i) => {                       // i = 도넛 위 자리, s = 학생 번호
    const y = 1 - (2 * (i + 0.5)) / n; // 공 위에 골고루 퍼지는 자리 (나선)
    return { el, i, s: +el.dataset.i, th: (i * 137.508) % 360, ph: Math.asin(y) * deg * 0.92, tr: (i * 360) / n, // tr = 도넛 위 자리
      sz: 0.72 + ((i * 7) % 5) * 0.14, f1: 0.5 + ((i * 3) % 7) * 0.09, f2: 0.4 + ((i * 5) % 6) * 0.11, p1: i * 1.7, p2: i * 2.9,
      sr: ((i * 5) % 7) / 3 - 1, sp: ((i * 11) % 9) / 4 - 1, st: ((i * 13) % 5) / 2 - 1 }; // 흩어질 때 방향 (-1~1)
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
  // 스크롤 빠르기 → 바람 (0~1): 빨리 내릴수록 카드가 세게 팔랑이고 흩어짐
  const sp = dt > 0 ? Math.abs(pj.u - pj.prevU) / (dt / 1000) : 0; pj.prevU = pj.u;
  pj.sv += (sp - pj.sv) * (1 - Math.exp(-dt / (sp > pj.sv ? 90 : 450)));
  const gust = live ? clamp(pj.sv / 2.2, 0, 1) : 0;
  if (live) { pj.angle += (C.spin * (1 - a) + pj.vel) * dt / 1000; pj.vel *= Math.exp(-dt / 700); pj.auto += C.ringSpin * a * (1 + gust) * dt / 1000; }
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
  const fl = live ? C.flutter * (1 + gust * 1.6) : 0, sc8 = C.scatter * gust * a; // 팔랑임 세기, 흩어짐 세기 (도넛에서)
  let best = 999;
  for (const c of pj.cards) {
    const th = pjLerp(c.th, c.tr, a) + Math.sin(ts * c.f1 + c.p1) * 6 * wob + c.st * 9 * sc8;
    const ph = pjLerp(c.ph, 0, a) + Math.cos(ts * c.f2 + c.p2) * 5 * wob + (c.sp * 16 + Math.sin(ts * c.f1 * 1.7 + c.p2) * 5) * sc8;
    const r = R * (1 + Math.sin(ts * c.f2 + c.p1) * 0.07 * wob + c.sr * 0.16 * sc8), sway = Math.sin(ts * c.f1 * 0.8 + c.p2) * 7 * wob;
    // 종이처럼 팔랑: 카드마다 다른 박자로 앞뒤·옆으로 젖혀지고, 살짝 오르내리고, 살짝 휘어 보임
    const fx = Math.sin(ts * c.f1 * 1.9 + c.p2) * 13 * fl, fy = Math.sin(ts * c.f2 * 1.5 + c.p1) * 9 * fl;
    const fz = Math.sin(ts * c.f2 * 1.2 + c.p2 * 1.3) * 4 * fl, bob = Math.sin(ts * c.f1 * 1.1 + c.p1) * 0.08 * fl, sk = Math.sin(ts * c.f1 * 2.3 + c.p1) * 2.5 * fl;
    const ang = ((th + spinY) % 360 + 540) % 360 - 180;                       // 맨 앞에서 얼마나 돌아가 있는지 (-180~180도)
    if (Math.abs(ang) < best) { best = Math.abs(ang); pj.frontIdx = c.i; }
    const near = Math.max(0, 1 - Math.abs(ang) / step) * a;                    // 맨 앞 작품일수록 1
    const face = Math.cos(ang * rad) < 0 ? 180 : 0;                            // 뒤쪽 카드는 뒤집어서 글자가 거꾸로 보이지 않게
    const sc = pjLerp(c.sz, ring.sc, a) * (1 + (ring.fs - 1) * near);
    c.el.style.transform = `rotateY(${th.toFixed(2)}deg) rotateX(${ph.toFixed(2)}deg) translateZ(${(r + R * ring.fo * near).toFixed(1)}px) rotateY(${face}deg) rotateZ(${(sway + fz).toFixed(2)}deg) translateY(${(bob * 100).toFixed(1)}%) rotateX(${fx.toFixed(2)}deg) rotateY(${fy.toFixed(2)}deg) skewY(${sk.toFixed(2)}deg) scale(${sc.toFixed(3)})`;
    const op = 1 - a * ring.dimBack * (1 - Math.cos(ang * rad)) / 2 - a * ring.dimSide * (1 - near); // 도넛 뒤쪽 카드는 흐리게
    if (Math.abs(op - (c.op ?? 1)) > 0.01) { c.op = op; c.el.style.opacity = op.toFixed(2); }
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
