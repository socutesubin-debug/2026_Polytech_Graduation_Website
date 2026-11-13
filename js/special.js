/* V2 갤러리 (#special, 옛 이름: 스페셜룸) — 스토리보드 s7. 스크롤 하나로 세 장면이 이어짐
   ① 구(공): 가운데 큰 글자 "Gallery" 둘레로 프로젝트 썸네일 카드들이 공 모양으로 떠다님 (s7-①)
            카드마다 따로 둥둥 움직이고, 마우스를 움직이면 그쪽으로 기울고 휙 돎
   ② 도넛: 스크롤하면 썸네일들이 모여서 도넛(고리) 모양이 됨 (s7-②)
   ③ 액자: 더 스크롤하면 썸네일들이 사라지고 벽에 금 액자 하나만 남음 (s7-③)
            액자 양옆에는 연한 썸네일이 살짝 보임 (왼쪽 = 방금 본 작품, 오른쪽 = 다음에 나올 작품)
            거기서 계속 스크롤하면 다음 작품이 옆에서 들어옴. 순서는 랜덤 (끝없이 스크롤할 수 있음)
   - 썸네일을 누르면 그 작품이 액자에 걸림. [SELECT] → 학생 소개 창 → 포트폴리오 새 탭
   - 키보드: ↓/↑ 로 장면 이동, 액자 장면에서 ↓ → 는 다음 작품, ← 는 방금 본 작품
   - 움직임 줄이기: 구·도넛을 건너뛰고 액자 장면만 보여 줌
   - 대표 작품은 data.js의 work 칸({ src, title, desc, credit })에서 읽음. 아직 없으면(null) 이름이 적힌 회색 임시 카드
   - 3D(WebGL)를 쓰지 않고 CSS로만 움직여서 가벼움
   숫자를 바꾸고 싶으면 아래 SPECIAL만 고치면 됩니다 */
const SPECIAL = {
  cards: 15, cardsMobile: 12,    // 떠 있는 썸네일 수 (작품 수보다 많게 쓰면 같은 작품이 되풀이됨)
  gather: [0.08, 0.40],          // 스크롤 진행률 이 구간에서 구 → 도넛
  reveal: [0.52, 0.76],          // 이 구간에서 도넛 → 액자
  randomFrom: 0.80, randomStep: 0.035, // 액자 장면: 이만큼 스크롤할 때마다 작품이 바뀜
  stops: [0, 0.47, 0.84],        // 장면별 멈춤 자리 (구, 도넛, 액자)
  spin: 7,                       // 저절로 도는 속도 (도/초)
  float: 1,                      // 카드가 따로따로 둥둥 움직이는 정도 (0 = 안 움직임, 2 = 두 배)
  mouseTilt: 14, mouseSpin: 0.22, // 마우스 쪽으로 기우는 각도(도), 마우스를 움직일 때 휙 도는 힘
  perspective: 1400,
};
const sp = {
  root: $('#special'), track: $('#sp-track'), view: $('#sp-view'), space: $('#sp-space'), word: $('#sp-word'), cloud: $('#sp-cloud'), stage: $('#sp-stage'), intro: $('#sp-intro'),
  at: -1, prev: -1, next: -1, bag: [], cards: [], built: false, progress: 0, target: 0, angle: 0, lastT: 0, zone: -1, phase: '', still: false, w: 0, h: 0, mx: 0, my: 0, tmx: 0, tmy: 0, vel: 0,
};
const spSmooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const spLerp = (a, b, t) => a + (b - a) * t;

/* 15명을 섞어 둔 주머니에서 하나씩 꺼냄: 다 볼 때까지 겹치지 않고, 새 주머니의 첫 장도 방금 본 것과 다르게 */
function spNextIndex() {
  if (!sp.bag.length) {
    sp.bag = STUDENTS.map((_, i) => i);
    for (let i = sp.bag.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [sp.bag[i], sp.bag[j]] = [sp.bag[j], sp.bag[i]]; }
    if (sp.bag[sp.bag.length - 1] === sp.at && sp.bag.length > 1) sp.bag.unshift(sp.bag.pop());
  }
  return sp.bag.pop();
}
function spWorkHTML(s, small) {
  if (s.work && s.work.src) return `<img src="${s.work.src}" alt="${small ? '' : `${s.name}의 대표 작품${s.work.title ? ': ' + s.work.title : ''}`}" loading="lazy" decoding="async">`;
  return `<span class="sp-temp"><em>${pad(s.no)}</em><b>${s.name}</b><small>대표 작품 준비 중</small></span>`;
}
/* 액자 양옆의 연한 썸네일: 왼쪽 = 방금 본 작품, 오른쪽 = 다음에 나올 작품 */
function spPeek(el, i, label) {
  el.hidden = i < 0; if (i < 0) return;
  el.innerHTML = spWorkHTML(STUDENTS[i], true); el.setAttribute('aria-label', `${label}: ${STUDENTS[i].name}`);
}
function spShow(i, back) {
  const s = STUDENTS[i];
  if (i !== sp.at) { sp.prev = back ? -1 : sp.at; sp.at = i; }
  const bi = sp.bag.indexOf(i); if (bi >= 0) sp.bag.splice(bi, 1);
  if (back) { if (sp.next >= 0 && sp.next !== i) sp.bag.push(sp.next); sp.next = -1; }
  if (sp.next < 0 || sp.next === i) sp.next = spNextIndex();
  spPeek($('#sp-peek-prev'), sp.prev, '이전 작품'); spPeek($('#sp-peek-next'), sp.next, '다음 작품');
  const work = $('#sp-work');
  work.classList.remove('in', 'back'); void work.offsetWidth;
  work.innerHTML = spWorkHTML(s); work.classList.add('in'); work.classList.toggle('back', !!back);
  $('#sp-no').textContent = `${pad(s.no)} / ${pad(STUDENTS.length)} · ${FIELD_LABEL[s.field] || '분야 확인 중'}`;
  $('#sp-name').textContent = s.name;
  $('#sp-title').textContent = (s.work && s.work.title) || s.slogan || '';
  $('#sp-select').setAttribute('aria-label', `${s.name} 학생 소개 보기`);
}
function spNext() { spShow(sp.next >= 0 ? sp.next : spNextIndex()); }
function spPrev() { if (sp.prev >= 0) spShow(sp.prev, true); }

/* 썸네일 카드 만들기: 공 위의 자리(골고루 퍼지는 나선)와 도넛 위의 자리(한 줄 고리)를 미리 계산해 둠 */
function spBuild() {
  if (sp.built) return; sp.built = true;
  const n = matchMedia('(max-width: 760px)').matches ? SPECIAL.cardsMobile : SPECIAL.cards, deg = 180 / Math.PI;
  const list = Array.from({ length: n }, (_, i) => {
    const y = 1 - (2 * (i + 0.5)) / n;
    // sz = 카드 크기(조금씩 다르게), f1·f2·p1·p2 = 카드마다 다른 둥둥 움직임의 빠르기와 시작 위치
    return { i: i % STUDENTS.length, ts: (i * 137.508) % 360, ps: Math.asin(y) * deg * 0.92,
      sz: 0.72 + ((i * 7) % 5) * 0.14, f1: 0.5 + ((i * 3) % 7) * 0.09, f2: 0.4 + ((i * 5) % 6) * 0.11, p1: i * 1.7, p2: i * 2.9 };
  });
  // 도넛 자리는 공에서의 방향 순서대로 나눠 줌 → 모일 때 멀리 돌아가지 않고 가까운 자리로 감
  [...list].sort((a, b) => a.ts - b.ts).forEach((c, k) => { c.tr = (k / n) * 360; c.pr = 0; });
  sp.cloud.innerHTML = list.map((c, k) => `<button class="sp-card" type="button" tabindex="-1" data-k="${k}" data-i="${c.i}" aria-hidden="true">${spWorkHTML(STUDENTS[c.i], true)}</button>`).join('');
  sp.cards = $$('.sp-card', sp.cloud).map((el, k) => ({ el, ...list[k] }));
  sp.cloud.addEventListener('click', (e) => {
    const b = e.target.closest('.sp-card'); if (!b) return;
    spShow(+b.dataset.i); spGoto(2);
  });
}
function spScrollMax() { return Math.max(1, sp.root.scrollHeight - sp.root.clientHeight); }
/* 장면으로 이동: 0 = 구, 1 = 도넛, 2 = 액자 */
function spGoto(k, instant) {
  const p = SPECIAL.stops[clamp(k, 0, 2)];
  if (sp.still) return;
  sp.zone = -1; sp.hold = p; // 장면으로 옮겨 가는 동안에는 작품을 바꾸지 않음 (누른 작품이 그대로 걸려 있도록)
  sp.root.scrollTo({ top: p * spScrollMax(), behavior: instant || reduce ? 'auto' : 'smooth' });
  if (instant || reduce) { sp.target = sp.progress = p; }
}
function spStopIndex() { const p = sp.target; return p < 0.24 ? 0 : p < 0.66 ? 1 : 2; }

function renderSpecial(t) {
  if (!sp.built) return;
  const C = SPECIAL, W = sp.view.clientWidth, H = sp.view.clientHeight; if (!W || !H) return;
  const dt = Math.min(64, t - (sp.lastT || t)); sp.lastT = t;
  if (detail < 0 && !sp.still) {
    const max = spScrollMax(); let top = sp.root.scrollTop;
    // 액자 장면의 끝까지 내려오면 액자 장면의 처음으로 살짝 되돌림 → 끝없이 스크롤해서 랜덤 작품을 볼 수 있음 (화면은 똑같이 보임)
    if (top >= max - 2) { top = (C.randomFrom + C.randomStep * 0.5) * max; sp.root.scrollTop = top; sp.progress = top / max; sp.zone = 0; }
    sp.target = top / max;
  }
  sp.progress += (sp.target - sp.progress) * (reduce ? 1 : 1 - Math.exp(-dt / 150));
  if (Math.abs(sp.target - sp.progress) < 1e-4) sp.progress = sp.target;
  const p = sp.still ? 1 : sp.progress;
  if (sp.hold != null && Math.abs(sp.progress - sp.hold) < 0.004) sp.hold = null;
  const a = spSmooth(C.gather[0], C.gather[1], p), b = spSmooth(C.reveal[0], C.reveal[1], p);

  // 액자 장면에서 스크롤할 때마다 다른 작품
  const zone = p < C.randomFrom ? -1 : Math.floor((p - C.randomFrom) / C.randomStep);
  if (zone !== sp.zone) { if (zone >= 0 && sp.zone >= 0 && detail < 0 && sp.hold == null) spNext(); sp.zone = zone; }

  const phase = b > 0.5 ? 'frame' : a > 0.5 ? 'ring' : 'sphere';
  if (phase !== sp.phase) {
    sp.phase = phase; sp.root.dataset.phase = phase;
    if (page === 'special') topbar.dataset.theme = phase === 'sphere' ? 'light' : 'dark';
    $$('#sp-steps button').forEach((el, k) => el.setAttribute('aria-current', String(k === ['sphere', 'ring', 'frame'].indexOf(phase))));
  }
  sp.view.style.setProperty('--a', a.toFixed(3)); sp.view.style.setProperty('--b', b.toFixed(3));
  sp.intro.style.opacity = (1 - spSmooth(0.02, 0.14, p)).toFixed(3);
  const show = spSmooth(0.62, 0.8, p);
  sp.stage.style.opacity = show.toFixed(3); sp.stage.style.transform = `translateY(${((1 - show) * 30).toFixed(1)}px) scale(${(0.94 + 0.06 * show).toFixed(3)})`;
  sp.stage.inert = show < 0.5; sp.stage.style.visibility = show < 0.02 ? 'hidden' : 'visible';

  // 가운데 큰 글자: 구 장면에서만 보이고, 카드가 모이기 시작하면 사라짐
  const wordOp = 1 - spSmooth(0.04, 0.26, p);
  sp.word.style.opacity = wordOp.toFixed(3); sp.word.style.visibility = wordOp < 0.02 ? 'hidden' : 'visible';

  // 구름(썸네일 묶음) 전체: 돌기, 기울기, 앞뒤 자리 + 마우스 따라 기울기
  const live = !reduce && detail < 0, ease = 1 - Math.exp(-dt / 260);
  sp.mx += (sp.tmx - sp.mx) * ease; sp.my += (sp.tmy - sp.my) * ease;
  if (live) { sp.angle += (C.spin * (1 - 0.55 * b) + sp.vel) * dt / 1000; sp.vel *= Math.exp(-dt / 700); }
  const Rs = Math.max(Math.min(W * 0.5, H * 0.62), H * 0.4), Rr = Math.min(W * 0.36, H * 0.6);
  const R = spLerp(Rs, Rr, a) * (1 + 0.5 * b);                              // 액자 장면: 고리가 넓어지면서 사라짐
  const cz = spLerp(-Rs * 0.35, -Rr * 0.6, a) - Rr * 0.8 * b;
  const mt = C.mouseTilt * (1 - b);
  const tilt = spLerp(spLerp(-6, -24, a), -8, b) - sp.my * mt * 0.7, roll = spLerp(8 * a, 0, b);
  const spinY = sp.angle + p * 140 + sp.mx * mt;
  sp.space.style.transform = `translate3d(0,0,${cz.toFixed(1)}px)`;
  sp.cloud.style.transform = `rotateZ(${roll.toFixed(2)}deg) rotateX(${tilt.toFixed(2)}deg) rotateY(${spinY.toFixed(2)}deg)`;
  const cw = clamp(W * 0.12, 104, 190), rad = Math.PI / 180, ts = t / 1000;
  if (cw !== sp.cw) { sp.cw = cw; sp.view.style.setProperty('--cw', cw.toFixed(0) + 'px'); }
  // 액자 장면에서는 떠 있는 썸네일을 모두 지움 → 벽에는 액자(와 양옆의 연한 썸네일)만 남음
  const op = 1 - spSmooth(0, 0.7, b);
  const wob = reduce ? 0 : C.float * (1 - 0.6 * a) * (1 - b);                // 도넛에서는 조금만 흔들림
  for (const c of sp.cards) {
    const th = spLerp(c.ts, c.tr, a) + Math.sin(ts * c.f1 + c.p1) * 6 * wob;
    const ph = spLerp(c.ps, c.pr, a) + Math.cos(ts * c.f2 + c.p2) * 5 * wob;
    const r = R * (1 + Math.sin(ts * c.f2 + c.p1) * 0.07 * wob);
    const sway = Math.sin(ts * c.f1 * 0.8 + c.p2) * 7 * wob;                  // 카드가 제자리에서 살짝 갸웃거림
    const face = Math.cos((th + spinY) * rad) < 0 ? 180 : 0;                 // 뒤쪽 카드는 뒤집어서 글자·그림이 거꾸로 보이지 않게
    c.el.style.transform = `rotateY(${th.toFixed(2)}deg) rotateX(${ph.toFixed(2)}deg) translateZ(${r.toFixed(1)}px) rotateY(${face}deg) rotateZ(${sway.toFixed(2)}deg) scale(${spLerp(c.sz, 1, a).toFixed(3)})`;
    if (Math.abs(op - (c.op ?? 1)) > 0.01 || (op === 0 && c.op !== 0)) { c.op = op; c.el.style.opacity = op.toFixed(2); c.el.style.visibility = op < 0.03 ? 'hidden' : 'visible'; }
  }
}
function enterSpecial() {
  spBuild();
  sp.still = reduce; sp.root.classList.toggle('still', sp.still); // 움직임 줄이기: 액자 장면만
  if (sp.at < 0) spShow(spNextIndex());
  sp.phase = ''; // 메뉴 색을 지금 장면에 맞게 다시 맞춤
}
/* 키보드 처리 (js/main.js가 부름) */
function specialKey(e) {
  const k = spStopIndex(), down = e.key === 'ArrowDown' || e.key === 'PageDown', up = e.key === 'ArrowUp' || e.key === 'PageUp';
  if (sp.still || k === 2) {
    if (down || e.key === 'ArrowRight') { spNext(); return true; }
    if (e.key === 'ArrowLeft') { spPrev(); return true; }
    if (up && !sp.still) { spGoto(1); return true; }
    return false;
  }
  if (down) { spGoto(k + 1); return true; }
  if (up) { spGoto(k - 1); return true; }
  return false;
}
['wheel', 'touchstart'].forEach((ev) => sp.root.addEventListener(ev, () => { sp.hold = null; }, { passive: true }));
/* 마우스: 있는 쪽으로 카드 묶음이 기울고, 옆으로 움직이면 그 방향으로 휙 돎 */
sp.view.addEventListener('pointermove', (e) => {
  if (e.pointerType !== 'mouse' || reduce) return;
  const r = sp.view.getBoundingClientRect();
  sp.tmx = ((e.clientX - r.left) / r.width - 0.5) * 2; sp.tmy = ((e.clientY - r.top) / r.height - 0.5) * 2;
  sp.vel = clamp(sp.vel + e.movementX * SPECIAL.mouseSpin, -90, 90);
});
sp.view.addEventListener('pointerleave', () => { sp.tmx = sp.tmy = 0; });
$('#sp-next').addEventListener('click', spNext);
$('#sp-peek-next').addEventListener('click', spNext);
$('#sp-peek-prev').addEventListener('click', spPrev);
$('#sp-select').addEventListener('click', () => { if (sp.at >= 0) openDetail(sp.at); });
$('#sp-frame').addEventListener('click', () => { if (sp.at >= 0) openDetail(sp.at); });
$('#sp-all').addEventListener('click', () => spGoto(1));
$('#sp-start').addEventListener('click', () => spGoto(1));
$$('#sp-steps button').forEach((el, k) => el.addEventListener('click', () => spGoto(k)));
