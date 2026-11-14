/* Designer 방 (#designer) — 갈림길 복도
   - 들어오면 가운데 갈림길에 서 있음. 왼쪽으로 가면 UX/UI · 웹의 방, 오른쪽으로 가면 Visual의 방
   - 걸어갈수록 방 분위기가 서서히 바뀜: UX/UI = 밝은 벽 + 얇은 도면 격자, Visual = 어두운 벽 + 석고상마다 조명
   - 분야가 아직 정해지지 않은 사람은 Visual의 방 끝 "분야 확인 중" 자리에 있음 (js/data.js의 field를 채우면 자기 방으로 감)
   - 마우스 휠(위아래)을 굴리면 옆으로 천천히 지나감. 휴대폰은 손가락으로 옆으로 넘김. ← → 키, 양옆 화살표 버튼도 됨
   - 석고상마다 미술관 같은 작품안내 표찰: 번호·분야, 이름, 한 줄 소개, 소개글(있으면)
     표찰을 누르면 그 사람의 포트폴리오 사이트가 새 탭으로 열림 (주소가 아직 없으면 "포트폴리오 준비 중")
     표찰 아래 [대표 작품 보기]를 누르면 Project 방의 그 작품 상세가 열림
   - 위의 버튼으로 UX/UI 방 / 갈림길 / Visual 방으로 바로 갈 수 있음
   - 석고상 사진은 assets/images/busts/01~15.webp (3D 파일을 미리 찍어 둔 사진, 배경이 투명)
   숫자를 바꾸고 싶으면 아래 DESIGNER만 고치면 됩니다 */
const DESIGNER = {
  wheel: 1,        // 휠 한 번에 옆으로 움직이는 정도 (2 = 두 배 빠르게)
};
const dg = { root: $('#designer'), row: $('#dg-row'), built: false, side: 'fork', fresh: true };

function dgBuild() {
  if (dg.built) return; dg.built = true;
  const item = (s, i) => {
    const plate = `<span class="dg-no">${pad(s.no)} · ${FIELD_LABEL[s.field] || '분야 확인 중'}</span>
        <b class="dg-name">${s.name}</b>
        <span class="dg-slogan">${s.slogan || ''}</span>
        ${s.desc ? `<span class="dg-desc">${s.desc}</span>` : ''}
        <span class="dg-go">${s.portfolio ? '포트폴리오 보기 ↗' : '포트폴리오 준비 중'}</span>`;
    return `<li class="dg-item" data-field="${s.field || 'none'}" data-i="${i}">
      <div class="dg-bust"><img src="${bustThumb(s)}" alt="${s.name}의 석고상" loading="lazy" decoding="async"></div>
      <div class="dg-stand" aria-hidden="true"></div>
      ${s.portfolio
        ? `<a class="dg-plate" href="${s.portfolio}" target="_blank" rel="noopener" aria-label="${s.name} 포트폴리오 새 탭으로 열기">${plate}</a>`
        : `<div class="dg-plate is-empty">${plate}</div>`}
      <button class="dg-work" type="button" data-i="${i}">대표 작품 보기</button>
    </li>`;
  };
  // 줄 세우기: [UX/UI 방 (갈림길에서 가까운 순서가 오른쪽)] [갈림길] [Visual 방] [분야 확인 중]
  const all = STUDENTS.map((s, i) => [s, i]);
  const ux = all.filter(([s]) => s.field === 'uxui'), vi = all.filter(([s]) => s.field === 'visual'), un = all.filter(([s]) => s.field !== 'uxui' && s.field !== 'visual');
  dg.row.innerHTML = `<li class="dg-sign dg-end" aria-hidden="true"><b>UX/UI · 웹의 방</b><span>${ux.length}명</span></li>`
    + ux.map(([s, i]) => item(s, i)).join('')
    + `<li class="dg-fork" id="dg-fork"><p>어느 방으로 갈까요?</p>
        <button type="button" data-side="uxui"><span>←</span><b>UX/UI · 웹의 방</b><small>${ux.length}명</small></button>
        <button type="button" data-side="visual"><b>Visual의 방</b><small>${vi.length}명</small><span>→</span></button></li>`
    + vi.map(([s, i]) => item(s, i)).join('')
    + (un.length ? `<li class="dg-sign" aria-hidden="true"><b>분야 확인 중</b><span>${un.length}명</span></li>` + un.map(([s, i]) => item(s, i)).join('') : '');
  dg.counts = { uxui: ux.length, visual: vi.length };
  dg.row.addEventListener('click', (e) => {
    const side = e.target.closest('[data-side]'); if (side) { dgGo(side.dataset.side); return; }
    const b = e.target.closest('.dg-work'); if (!b) return;
    go('project'); pjOpen(+b.dataset.i, null);
  });
  dg.row.addEventListener('scroll', dgProgress, { passive: true });
}

function dgItems() { return $$('.dg-item', dg.row); }
const dgMid = (el) => el.offsetLeft + el.offsetWidth / 2 - dg.row.clientWidth / 2; // 이 칸이 화면 가운데 올 때의 스크롤 위치
function dgProgress() {
  const max = dg.row.scrollWidth - dg.row.clientWidth, x = dg.row.scrollLeft;
  $('#dg-bar').style.transform = `scaleX(${max > 0 ? (x / max).toFixed(3) : 1})`;
  $('#dg-prev').disabled = x <= 2; $('#dg-next').disabled = x >= max - 2;
  // 갈림길에서 얼마나 왼쪽/오른쪽으로 왔는지 → 방 분위기 (0 = 갈림길, 1 = 그 방 안)
  const fork = dgMid($('#dg-fork')), W = Math.max(200, $('#dg-fork').offsetWidth * 1.15); // 바로 옆 석고상까지 오면 그 방 분위기가 다 됨
  const ux = clamp((fork - x) / W, 0, 1), vi = clamp((x - fork) / W, 0, 1);
  $('#dg-amb-ux').style.opacity = ux.toFixed(3); $('#dg-amb-vi').style.opacity = vi.toFixed(3);
  dg.root.style.setProperty('--vi', vi.toFixed(3));
  dg.root.classList.toggle('dark', vi > 0.5);
  const side = ux > 0.5 ? 'uxui' : vi > 0.5 ? 'visual' : 'fork';
  if (side !== dg.side || !$('#dg-count').textContent) {
    dg.side = side;
    $$('#dg-filter button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.side === side)));
    $('#dg-count').textContent = side === 'uxui' ? `UX/UI · 웹의 방 · ${dg.counts.uxui}명` : side === 'visual' ? `Visual의 방 · ${dg.counts.visual}명` : `갈림길 · ${STUDENTS.length}명의 디자이너`;
  }
}
/* 방으로 바로 가기: UX/UI = 갈림길 바로 왼쪽 석고상, Visual = 바로 오른쪽 석고상 */
function dgGo(side) {
  const fork = $('#dg-fork');
  if (side === 'uxui') dgScrollTo(fork.previousElementSibling.classList.contains('dg-item') ? fork.previousElementSibling : fork);
  else if (side === 'visual') dgScrollTo(fork.nextElementSibling || fork);
  else dgScrollTo(fork);
}
/* 화면 가운데에 가장 가까운 석고상 번호 */
function dgCurrent() {
  const mid = dg.row.scrollLeft + dg.row.clientWidth / 2, items = dgItems();
  let best = 0, bd = Infinity;
  items.forEach((li, k) => { const d = Math.abs(li.offsetLeft + li.offsetWidth / 2 - mid); if (d < bd) { bd = d; best = k; } });
  return best;
}
function dgScrollTo(li, instant) {
  if (!li) return;
  dg.row.scrollTo({ left: li.offsetLeft + li.offsetWidth / 2 - dg.row.clientWidth / 2, behavior: instant || reduce ? 'auto' : 'smooth' });
}
function dgStep(d) { const items = dgItems(); dgScrollTo(items[clamp(dgCurrent() + d, 0, items.length - 1)]); }
/* 그 사람 석고상으로 이동하고 잠깐 빛나게 함 (Project 방 작품 상세에서 이름을 누르면) */
function dgFocus(i) {
  if (i == null || i < 0) return;
  const li = $(`.dg-item[data-i="${i}"]`, dg.row); if (!li) return;
  dg.fresh = false;
  requestAnimationFrame(() => {
    dgScrollTo(li, true);
    li.classList.remove('hi'); void li.offsetWidth; li.classList.add('hi');
    $('.dg-plate', li).focus({ preventScroll: true });
  });
}
function enterDesigner() {
  dgBuild();
  requestAnimationFrame(() => { if (dg.fresh) { dg.fresh = false; dgScrollTo($('#dg-fork'), true); } dgProgress(); }); // 처음 들어오면 갈림길에 서 있음
}
/* 키보드 (js/main.js가 부름): ← → 로 옆 석고상 */
function designerKey(e) {
  if (e.key === 'ArrowRight' || e.key === 'PageDown') { dgStep(1); return true; }
  if (e.key === 'ArrowLeft' || e.key === 'PageUp') { dgStep(-1); return true; }
  if (e.key === 'Home') { dgScrollTo(dgItems()[0]); return true; }
  if (e.key === 'Escape') return false;
  if (e.key === 'End') { dgScrollTo(dgItems().at(-1)); return true; }
  return false;
}

// 마우스 휠(위아래)을 옆으로 움직이는 데 씀. 트랙패드로 옆으로 밀 때는 그대로 둠
dg.row.addEventListener('wheel', (e) => {
  if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
  e.preventDefault();
  dg.row.scrollLeft += e.deltaY * (e.deltaMode === 1 ? 32 : 1) * DESIGNER.wheel;
}, { passive: false });
$('#dg-prev').addEventListener('click', () => dgStep(-1));
$('#dg-next').addEventListener('click', () => dgStep(1));
$$('#dg-filter button').forEach((b) => b.addEventListener('click', () => dgGo(b.dataset.side)));
addEventListener('resize', () => { if (page === 'designer') dgProgress(); });
