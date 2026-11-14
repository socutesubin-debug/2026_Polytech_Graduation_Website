/* Project 방 (#project) — 작품 15개를 보는 방
   ① 첫 화면: 가운데 큰 글자 "Project" 둘레로 작품 카드가 떠다님. 마우스 쪽으로 기울고, 옆으로 빨리 움직이면 휙 돎
   ② 스크롤하면 작품 목록(격자)이 아래에서 올라와 카드들을 덮음. 위에서 분야(전체 / UX/UI · 웹 / Visual)를 고를 수 있음
   ③ 작품을 누르면 작품 상세: 제목·설명·만든 사람 + 아래로 내리며 보는 그림 (작품마다 14장 정도)
      만든 사람 이름을 누르면 Designer 방의 그 사람 석고상으로 감
   - 작품 자료는 js/data.js의 work 칸: { src: 대표 그림, title, desc, images: [그림1, 그림2, …] }
     아직 없으면(null) 이름이 적힌 회색 임시 카드, 상세 그림도 회색 임시 칸으로 보여 줌
   - 움직임 줄이기: 카드가 떠다니지 않고 제자리에 멈춰 있음
   숫자를 바꾸고 싶으면 아래 PROJECT만 고치면 됩니다 */
const PROJECT = {
  imageCount: 14,                 // 작품 상세의 그림 수 (work.images가 없을 때 보여 줄 임시 칸 수)
  spin: 7,                        // 카드 묶음이 저절로 도는 속도 (도/초)
  float: 1,                       // 카드가 따로따로 둥둥 움직이는 정도 (0 = 안 움직임)
  mouseTilt: 14, mouseSpin: 0.22, // 마우스 쪽으로 기우는 각도(도), 마우스를 움직일 때 휙 도는 힘
};
const pj = {
  root: $('#project'), hero: $('#pj-hero'), space: $('#pj-space'), word: $('#pj-word'), cloud: $('#pj-cloud'),
  grid: $('#pj-grid'), view: $('#pj-detail'), body: $('#pj-d-body'),
  cards: [], built: false, angle: 0, vel: 0, lastT: 0, mx: 0, my: 0, tmx: 0, tmy: 0, field: 'all', at: -1, back: null,
};
const pjSmooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

function pjThumb(s, small) {
  if (s.work && s.work.src) return `<img src="${s.work.src}" alt="${small ? '' : `${s.name}의 작품${s.work.title ? ': ' + s.work.title : ''}`}" loading="lazy" decoding="async">`;
  return `<span class="pj-temp"><em>${pad(s.no)}</em><b>${s.name}</b><small>작품 준비 중</small></span>`;
}
const pjTitle = (s) => (s.work && s.work.title) || '작품 제목 준비 중';

/* 떠다니는 카드 + 아래 작품 목록 만들기 (처음 들어올 때 한 번) */
function pjBuild() {
  if (pj.built) return; pj.built = true;
  const n = STUDENTS.length, deg = 180 / Math.PI;
  pj.cloud.innerHTML = STUDENTS.map((s, i) => `<button class="pj-card" type="button" tabindex="-1" aria-hidden="true" data-i="${i}">${pjThumb(s, true)}</button>`).join('');
  pj.cards = $$('.pj-card', pj.cloud).map((el, i) => {
    const y = 1 - (2 * (i + 0.5)) / n; // 공 위에 골고루 퍼지는 자리 (나선)
    return { el, th: (i * 137.508) % 360, ph: Math.asin(y) * deg * 0.92,
      sz: 0.72 + ((i * 7) % 5) * 0.14, f1: 0.5 + ((i * 3) % 7) * 0.09, f2: 0.4 + ((i * 5) % 6) * 0.11, p1: i * 1.7, p2: i * 2.9 };
  });
  pj.cloud.addEventListener('click', (e) => { const b = e.target.closest('.pj-card'); if (b) pjOpen(+b.dataset.i, b); });
  pj.grid.innerHTML = STUDENTS.map((s, i) => `<li data-field="${s.field || 'none'}"><button class="pj-item" type="button" data-i="${i}">
    <span class="pj-thumb">${pjThumb(s)}</span>
    <span class="pj-meta"><span class="pj-no">${pad(s.no)}</span><b>${pjTitle(s)}</b><span>${s.name} · ${FIELD_LABEL[s.field] || '분야 확인 중'}</span></span></button></li>`).join('');
  pj.grid.addEventListener('click', (e) => { const b = e.target.closest('.pj-item'); if (b) pjOpen(+b.dataset.i, b); });
  $('#pj-count').textContent = `${STUDENTS.length}개의 작품`;
}

/* 분야 고르기 */
function pjFilter(f) {
  pj.field = f;
  $$('#pj-filter button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.field === f)));
  let n = 0;
  $$('li', pj.grid).forEach((li) => { const on = f === 'all' || li.dataset.field === f; li.hidden = !on; if (on) n++; });
  $('#pj-count').textContent = `${n}개의 작품`;
}

/* 작품 상세 */
function pjOpen(i, from) {
  const s = STUDENTS[i]; pj.at = i; pj.back = from || pj.back;
  const imgs = (s.work && s.work.images && s.work.images.length) ? s.work.images : null;
  const count = imgs ? imgs.length : PROJECT.imageCount;
  $('#pj-d-no').textContent = `${pad(s.no)} / ${pad(STUDENTS.length)} · ${FIELD_LABEL[s.field] || '분야 확인 중'}`;
  $('#pj-d-title').textContent = pjTitle(s);
  $('#pj-d-desc').textContent = (s.work && s.work.desc) || '작품 설명은 자료를 받으면 채워져요.';
  const who = $('#pj-d-who'); who.textContent = `${s.name} →`; who.setAttribute('aria-label', `${s.name} 디자이너 보기`);
  $('#pj-d-images').innerHTML = Array.from({ length: count }, (_, k) => imgs
    ? `<figure class="pj-shot"><img src="${imgs[k]}" alt="${pjTitle(s)} 그림 ${k + 1}" loading="lazy" decoding="async"></figure>`
    : `<figure class="pj-shot pj-shot-temp"><span>그림 ${pad(k + 1)} / ${pad(count)}</span></figure>`).join('');
  const nx = STUDENTS[(i + 1) % STUDENTS.length];
  $('#pj-d-next').textContent = `다음 작품 · ${pad(nx.no)} ${nx.name} →`;
  pj.view.hidden = false; pj.root.classList.add('reading');
  pj.view.scrollTop = 0;
  requestAnimationFrame(() => pj.view.classList.add('on'));
  $('#pj-d-close').focus({ preventScroll: true });
}
function pjClose() {
  if (pj.view.hidden) return false;
  pj.view.classList.remove('on'); pj.root.classList.remove('reading');
  setTimeout(() => { if (!pj.view.classList.contains('on')) pj.view.hidden = true; }, reduce ? 0 : 320);
  const back = pj.back && pj.back.isConnected && !pj.back.closest('[hidden]') && pj.back.closest('#pj-grid') ? pj.back : null;
  if (back) back.focus({ preventScroll: true }); else pj.root.focus({ preventScroll: true });
  pj.at = -1; return true;
}
function pjStep(d) { if (pj.at >= 0) pjOpen((pj.at + d + STUDENTS.length) % STUDENTS.length); }

/* 매 프레임: 떠다니는 카드 움직이기 + 스크롤에 따라 첫 화면 흐려지기 */
function renderProject(t) {
  if (!pj.built) return;
  const C = PROJECT, W = pj.hero.clientWidth, H = pj.hero.clientHeight; if (!W || !H) return;
  const dt = Math.min(64, t - (pj.lastT || t)); pj.lastT = t;
  const p = clamp(pj.root.scrollTop / H, 0, 1);  // 0 = 첫 화면, 1 = 작품 목록이 화면을 다 덮음
  if (p >= 1 || pj.root.classList.contains('reading')) return; // 안 보일 때는 쉬기
  const fade = 1 - pjSmooth(0.05, 0.85, p);
  pj.hero.style.opacity = fade.toFixed(3);
  pj.word.style.transform = `translate(-50%,-50%) scale(${(1 - 0.12 * p).toFixed(3)})`;
  const live = !reduce, ease = 1 - Math.exp(-dt / 260);
  pj.mx += (pj.tmx - pj.mx) * ease; pj.my += (pj.tmy - pj.my) * ease;
  if (live) { pj.angle += (C.spin + pj.vel) * dt / 1000; pj.vel *= Math.exp(-dt / 700); }
  const R = Math.max(Math.min(W * 0.5, H * 0.62), H * 0.4) * (1 + 0.25 * p);
  const tilt = -6 - pj.my * C.mouseTilt * 0.7, spinY = pj.angle + pj.mx * C.mouseTilt;
  pj.space.style.transform = `translate3d(0,${(-p * H * 0.15).toFixed(1)}px,${(-R * 0.35).toFixed(1)}px)`;
  pj.cloud.style.transform = `rotateX(${tilt.toFixed(2)}deg) rotateY(${spinY.toFixed(2)}deg)`;
  const cw = clamp(W * 0.12, 104, 190), rad = Math.PI / 180, ts = t / 1000, wob = live ? C.float : 0;
  if (cw !== pj.cw) { pj.cw = cw; pj.hero.style.setProperty('--cw', cw.toFixed(0) + 'px'); }
  for (const c of pj.cards) {
    const th = c.th + Math.sin(ts * c.f1 + c.p1) * 6 * wob, ph = c.ph + Math.cos(ts * c.f2 + c.p2) * 5 * wob;
    const r = R * (1 + Math.sin(ts * c.f2 + c.p1) * 0.07 * wob), sway = Math.sin(ts * c.f1 * 0.8 + c.p2) * 7 * wob;
    const face = Math.cos((th + spinY) * rad) < 0 ? 180 : 0; // 뒤쪽 카드는 뒤집어서 글자·그림이 거꾸로 보이지 않게
    c.el.style.transform = `rotateY(${th.toFixed(2)}deg) rotateX(${ph.toFixed(2)}deg) translateZ(${r.toFixed(1)}px) rotateY(${face}deg) rotateZ(${sway.toFixed(2)}deg) scale(${c.sz.toFixed(3)})`;
  }
}
function enterProject() {
  pjBuild();
  pj.root.classList.toggle('still', reduce);
}
/* 키보드 (js/main.js가 부름): 상세가 열려 있으면 Esc 닫기, ← → 이전/다음 작품 */
function projectKey(e) {
  if (pj.view.hidden) return false;
  if (e.key === 'Escape') return pjClose();
  if (e.key === 'ArrowLeft') { pjStep(-1); return true; }
  if (e.key === 'ArrowRight') { pjStep(1); return true; }
  return false;
}

pj.hero.addEventListener('pointermove', (e) => {
  if (e.pointerType !== 'mouse' || reduce) return;
  const r = pj.hero.getBoundingClientRect();
  pj.tmx = ((e.clientX - r.left) / r.width - 0.5) * 2; pj.tmy = ((e.clientY - r.top) / r.height - 0.5) * 2;
  pj.vel = clamp(pj.vel + e.movementX * PROJECT.mouseSpin, -90, 90);
});
pj.hero.addEventListener('pointerleave', () => { pj.tmx = pj.tmy = 0; });
$('#pj-down').addEventListener('click', () => pj.root.scrollTo({ top: pj.hero.clientHeight, behavior: reduce ? 'auto' : 'smooth' }));
$$('#pj-filter button').forEach((b) => b.addEventListener('click', () => pjFilter(b.dataset.field)));
$('#pj-d-close').addEventListener('click', pjClose);
$('#pj-d-prev').addEventListener('click', () => pjStep(-1));
$('#pj-d-nextbtn').addEventListener('click', () => pjStep(1));
$('#pj-d-next').addEventListener('click', () => pjStep(1));
$('#pj-d-who').addEventListener('click', () => { const i = pj.at; pjClose(); go('designer'); dgFocus(i); });
