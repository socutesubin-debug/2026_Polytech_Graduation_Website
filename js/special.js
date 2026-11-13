/* V2 스페셜룸 (#special) — 스토리보드 s7: 짙은 방 가운데 금 액자, 학생 15명의 대표 작품을 한 점씩 랜덤으로 감상
   - 들어오면 랜덤으로 한 명의 대표 작품이 걸림. [다른 작품]·스크롤·← → 키로 다음 랜덤 작품 (같은 작품이 연달아 나오지 않음)
   - [SELECT] → 학생 소개 창 → 포트폴리오 새 탭
   - [모아 보기] → 15점이 휘어진 띠 모양으로 천천히 돎 (s7-②). 하나를 고르면 액자에 걸림
   - 대표 작품은 data.js의 work 칸({ src, title, desc, credit })에서 읽음. 아직 없으면(null) 이름이 적힌 회색 임시 카드
   - 3D(WebGL)를 쓰지 않아서 가볍고, 메뉴 GALLERY 03에서 로비를 거치지 않고 바로 들어올 수 있음 */
const SPECIAL = { wheelGap: 650, ringSpeed: 7, ringRadius: 440 }; // 스크롤 한 번에 한 작품(ms), 띠 도는 속도(도/초), 띠 반지름(px)
const sp = { root: $('#special'), at: -1, bag: [], lastWheel: 0, ring: false, angle: 0, lastT: 0, hold: false };

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
  const work = $('#sp-work');
  work.classList.remove('in'); void work.offsetWidth;
  work.innerHTML = spWorkHTML(s); work.classList.add('in');
  $('#sp-no').textContent = `${pad(s.no)} / ${pad(STUDENTS.length)} · ${FIELD_LABEL[s.field] || '분야 확인 중'}`;
  $('#sp-name').textContent = s.name;
  $('#sp-title').textContent = (s.work && s.work.title) || s.slogan || '';
  $('#sp-select').setAttribute('aria-label', `${s.name} 학생 소개 보기`);
}
function spNext() { if (sp.ring) return; spShow(spNextIndex()); }

function spBuildRing() {
  const ring = $('#sp-ring'); if (ring.childElementCount) return;
  const n = STUDENTS.length;
  ring.innerHTML = STUDENTS.map((s, i) => {
    const a = (360 / n) * i, y = Math.sin((i / n) * Math.PI * 4) * 46; // 띠가 위아래로 물결치게
    return `<button class="sp-card" type="button" data-i="${i}" style="--a:${a}deg;--y:${y.toFixed(1)}px" aria-label="${s.name}의 대표 작품을 액자에 걸기">${spWorkHTML(s, true)}<span class="sp-card-name">${s.name}</span></button>`;
  }).join('');
  $$('.sp-card', ring).forEach((b) => {
    b.addEventListener('click', () => { spToggleRing(false); spShow(+b.dataset.i); $('#sp-select').focus({ preventScroll: true }); });
    b.addEventListener('focus', () => { sp.hold = true; if (!sp.root.classList.contains('flat')) sp.angle = -parseFloat(b.style.getPropertyValue('--a')); });
    b.addEventListener('blur', () => { sp.hold = false; });
  });
  ring.addEventListener('pointerenter', () => { sp.hold = true; });
  ring.addEventListener('pointerleave', () => { sp.hold = false; });
}
function spToggleRing(on) {
  sp.ring = on;
  if (on) spBuildRing();
  // 움직임 줄이기·좁은 화면에서는 도는 띠 대신 가만히 있는 카드 묶음
  sp.root.classList.toggle('flat', reduce || matchMedia('(max-width: 760px)').matches);
  $('#sp-ring-wrap').hidden = !on; $('#sp-room').hidden = on;
  sp.root.classList.toggle('ring-on', on);
  if (on) $('#sp-back').focus({ preventScroll: true }); else $('#sp-all').focus({ preventScroll: true });
}
function renderSpecial(t) {
  if (!sp.ring || sp.root.classList.contains('flat')) { sp.lastT = t; return; }
  const dt = Math.min(64, t - (sp.lastT || t)); sp.lastT = t;
  if (!sp.hold && detail < 0) sp.angle -= SPECIAL.ringSpeed * dt / 1000;
  $('#sp-ring').style.transform = `translateZ(${-SPECIAL.ringRadius}px) rotateY(${sp.angle.toFixed(2)}deg)`;
}
function enterSpecial() {
  if (sp.at < 0) spShow(spNextIndex());
  $('#sp-ring').style.setProperty('--r', SPECIAL.ringRadius + 'px');
}
/* 다른 화면에서 쓰는 키보드 처리 (js/main.js가 부름) */
function specialKey(e) {
  if (e.key === 'Escape' && sp.ring) { spToggleRing(false); return true; }
  if (sp.ring) return false;
  if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === 'PageDown') { spNext(); return true; }
  if (e.key === 'ArrowLeft' || e.key === 'ArrowUp' || e.key === 'PageUp') { spNext(); return true; }
  return false;
}
$('#sp-next').addEventListener('click', spNext);
$('#sp-select').addEventListener('click', () => { if (sp.at >= 0) openDetail(sp.at); });
$('#sp-frame').addEventListener('click', () => { if (sp.at >= 0) openDetail(sp.at); });
$('#sp-all').addEventListener('click', () => spToggleRing(true));
$('#sp-back').addEventListener('click', () => spToggleRing(false));
sp.root.addEventListener('wheel', (e) => {
  if (sp.ring || detail >= 0 || Math.abs(e.deltaY) < 8) return;
  const now = performance.now(); if (now - sp.lastWheel < SPECIAL.wheelGap) return;
  sp.lastWheel = now; spNext();
}, { passive: true });
