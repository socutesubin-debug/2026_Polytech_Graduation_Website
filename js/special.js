/* V2 스페셜룸 (#special) — 스토리보드 s7. 스크롤 하나로 세 장면이 이어짐
   ① 구(공): 들어오면 프로젝트 썸네일들이 공 모양으로 넓게 떠서 천천히 돎 (s7-①)
   ② 도넛: 스크롤하면 썸네일들이 모여서 도넛(고리) 모양이 됨 (s7-②)
   ③ 액자: 더 스크롤하면 고리가 뒤로 넓게 물러나고 가운데 금 액자가 나타남 (s7-③)
            거기서 계속 스크롤하면 액자 속 작품이 랜덤으로 바뀜 (끝없이 스크롤할 수 있음)
   - 썸네일을 누르면 그 작품이 액자에 걸림. [SELECT] → 학생 소개 창 → 포트폴리오 새 탭
   - 키보드: ↓/↑ 로 장면 이동, 액자 장면에서 ↓ → ← 는 다른 작품
   - 움직임 줄이기: 구·도넛을 건너뛰고 액자 장면만 보여 줌
   - 대표 작품은 data.js의 work 칸({ src, title, desc, credit })에서 읽음. 아직 없으면(null) 이름이 적힌 회색 임시 카드
   - 3D(WebGL)를 쓰지 않고 CSS로만 움직여서 가벼움
   숫자를 바꾸고 싶으면 아래 SPECIAL만 고치면 됩니다 */
const SPECIAL = {
  cards: 60, cardsMobile: 36,    // 떠 있는 썸네일 수 (작품 15점을 여러 번 되풀이해서 채움)
  gather: [0.08, 0.40],          // 스크롤 진행률 이 구간에서 구 → 도넛
  reveal: [0.52, 0.76],          // 이 구간에서 도넛 → 액자
  randomFrom: 0.80, randomStep: 0.035, // 액자 장면: 이만큼 스크롤할 때마다 작품이 바뀜
  stops: [0, 0.47, 0.84],        // 장면별 멈춤 자리 (구, 도넛, 액자)
  spin: 5,                       // 저절로 도는 속도 (도/초)
  perspective: 1400,
};
const sp = {
  root: $('#special'), track: $('#sp-track'), view: $('#sp-view'), cloud: $('#sp-cloud'), stage: $('#sp-stage'), intro: $('#sp-intro'),
  at: -1, bag: [], cards: [], built: false, progress: 0, target: 0, angle: 0, lastT: 0, zone: -1, phase: '', still: false, w: 0, h: 0,
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
function spShow(i) {
  const s = STUDENTS[i]; sp.at = i;
  const bi = sp.bag.indexOf(i); if (bi >= 0) sp.bag.splice(bi, 1);
  const work = $('#sp-work');
  work.classList.remove('in'); void work.offsetWidth;
  work.innerHTML = spWorkHTML(s); work.classList.add('in');
  $('#sp-no').textContent = `${pad(s.no)} / ${pad(STUDENTS.length)} · ${FIELD_LABEL[s.field] || '분야 확인 중'}`;
  $('#sp-name').textContent = s.name;
  $('#sp-title').textContent = (s.work && s.work.title) || s.slogan || '';
  $('#sp-select').setAttribute('aria-label', `${s.name} 학생 소개 보기`);
}
function spNext() { spShow(spNextIndex()); }

/* 썸네일 카드 만들기: 공 위의 자리(골고루 퍼지는 나선)와 도넛 위의 자리(2줄 고리)를 미리 계산해 둠 */
function spBuild() {
  if (sp.built) return; sp.built = true;
  const n = matchMedia('(max-width: 760px)').matches ? SPECIAL.cardsMobile : SPECIAL.cards, deg = 180 / Math.PI;
  const list = Array.from({ length: n }, (_, i) => {
    const y = 1 - (2 * (i + 0.5)) / n;
    return { i: i % STUDENTS.length, ts: (i * 137.508) % 360, ps: Math.asin(y) * deg * 0.92 };
  });
  // 도넛 자리는 공에서의 방향 순서대로 나눠 줌 → 모일 때 멀리 돌아가지 않고 가까운 자리로 감
  [...list].sort((a, b) => a.ts - b.ts).forEach((c, k) => { c.tr = (k / n) * 360; c.pr = k % 2 ? 6.5 : -6.5; });
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
  sp.zone = -1;
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
  const a = spSmooth(C.gather[0], C.gather[1], p), b = spSmooth(C.reveal[0], C.reveal[1], p);

  // 액자 장면에서 스크롤할 때마다 다른 작품
  const zone = p < C.randomFrom ? -1 : Math.floor((p - C.randomFrom) / C.randomStep);
  if (zone !== sp.zone) { if (zone >= 0 && sp.zone >= 0 && detail < 0) spNext(); sp.zone = zone; }

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

  // 구름(썸네일 묶음) 전체: 돌기, 기울기, 앞뒤 자리
  if (!reduce && detail < 0) sp.angle += C.spin * (1 - 0.55 * b) * dt / 1000;
  const Rs = Math.min(W * 0.66, H * 0.52), Rr = Math.min(W * 0.34, H * 0.62), Rf = Math.max(W * 0.9, 620);
  const R = spLerp(spLerp(Rs, Rr, a), Rf, b);
  const cz = spLerp(spLerp(-Rs * 0.35, -Rr * 0.6, a), -Rf * 0.75, b);     // 액자 장면: 고리가 커지면서 뒤로 물러남
  const tilt = spLerp(spLerp(-6, -24, a), -3, b), roll = spLerp(spLerp(0, 8, a), 0, b);
  const cy = spLerp(0, W < 760 ? -H * 0.15 : -H * 0.02, b); // 좁은 화면에서는 띠를 위로 올려 글자와 겹치지 않게
  const spinY = sp.angle + p * 140;
  sp.cloud.style.transform = `translate3d(0,${cy.toFixed(1)}px,${cz.toFixed(1)}px) rotateZ(${roll.toFixed(2)}deg) rotateX(${tilt.toFixed(2)}deg) rotateY(${spinY.toFixed(2)}deg)`;
  const cw = clamp(W * 0.1, 92, 168), n = sp.cards.length;
  // 액자 장면의 카드 크기: 고리 둘레에 한 줄(n/2장)이 빈틈없이 이어지도록
  const scale = spLerp(spLerp(0.5, 1, a), (2 * Math.PI * Rf) / (n / 2) / cw, b), flip = 180 * b, rad = Math.PI / 180;
  if (cw !== sp.cw) { sp.cw = cw; sp.view.style.setProperty('--cw', cw.toFixed(0) + 'px'); }
  for (const c of sp.cards) {
    const th = spLerp(c.ts, c.tr, a), ph = spLerp(c.ps, c.pr, a) * (1 - 0.3 * b);
    c.el.style.transform = `rotateY(${th.toFixed(2)}deg) rotateX(${ph.toFixed(2)}deg) translateZ(${R.toFixed(1)}px) rotateY(${flip.toFixed(1)}deg) scale(${scale.toFixed(3)})`;
    // 액자 장면에서는 고리의 앞쪽 절반(액자를 가리는 쪽)을 숨기고, 뒤쪽 절반만 액자 뒤로 지나가는 띠처럼 보이게 함
    const front = spSmooth(-0.25, 0.2, Math.cos((th + spinY) * rad)), op = (1 - b * front) * (1 - 0.3 * b);
    if (Math.abs(op - (c.op ?? 1)) > 0.01) { c.op = op; c.el.style.opacity = op.toFixed(2); c.el.style.visibility = op < 0.03 ? 'hidden' : 'visible'; }
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
    if (down || e.key === 'ArrowRight' || e.key === 'ArrowLeft') { spNext(); return true; }
    if (up && !sp.still) { spGoto(1); return true; }
    return false;
  }
  if (down) { spGoto(k + 1); return true; }
  if (up) { spGoto(k - 1); return true; }
  return false;
}
$('#sp-next').addEventListener('click', spNext);
$('#sp-select').addEventListener('click', () => { if (sp.at >= 0) openDetail(sp.at); });
$('#sp-frame').addEventListener('click', () => { if (sp.at >= 0) openDetail(sp.at); });
$('#sp-all').addEventListener('click', () => spGoto(1));
$('#sp-start').addEventListener('click', () => spGoto(1));
$$('#sp-steps button').forEach((el, k) => el.addEventListener('click', () => spGoto(k)));
