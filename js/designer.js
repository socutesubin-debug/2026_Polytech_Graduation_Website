/* Designer 방 (#designer) — 어두운 전시실 + 가운데 화살표 팻말
   - 들어오면 가운데 팻말 앞에 서 있음. 팻말의 왼쪽 화살표 = UX/UI · 웹, 오른쪽 화살표 = Visual (누르면 그쪽으로 감)
   - 방은 어둡고, 벽 가득 빛나는 그림이 비침. 왼쪽 벽 = 푸른 화면 설계도 그림, 오른쪽 벽 = 포스터 같은 색 그림
     두 벽은 팻말 뒤에서 뚝 끊기지 않고 흐릿하게(블러) 섞임. 옆으로 걸어가면 벽 그림도 같이 흘러감
   - 벽 그림 파일: assets/images/designer/wall-ux.webp, wall-visual.webp (같은 이름으로 바꿔 넣으면 됨)
   - 분야가 아직 정해지지 않은 사람은 Visual 쪽 끝 "분야 확인 중" 자리에 있음 (js/data.js의 field를 채우면 자기 쪽으로 감)
   - js/data.js에서 designer: false 인 사람은 Designer에 나오지 않음
   - 마우스 휠(위아래)을 굴리면 옆으로 천천히 지나감. 휴대폰은 손가락으로 옆으로 넘김. ← → 키, 양옆 화살표 버튼도 됨
   - 석고상은 입체 받침대(윗면 + 앞면 + 발판) 위에 있고, 받침대 앞면에 미술관 캡션 같은 금속 설명판이 붙어 있음: 이름·분야, 한 줄 소개, 소개글(있으면)
     설명판을 누르면 그 사람의 포트폴리오 사이트가 새 탭으로 열림 (주소가 아직 없으면 "포트폴리오 준비 중")
   - 위의 버튼으로 UX/UI · 웹 / 팻말 / Visual 쪽으로 바로 갈 수 있음
   - 석고상 사진은 assets/images/busts/01~15.webp (3D 파일을 미리 찍어 둔 사진, 배경이 투명)
   숫자를 바꾸고 싶으면 아래 DESIGNER만 고치면 됩니다 */
const DESIGNER = {
  wheel: 1,        // 휠 한 번에 옆으로 움직이는 정도 (2 = 두 배 빠르게)
  wallMove: 0.85,  // 옆으로 걸을 때 벽 그림이 따라 흐르는 정도 (1 = 석고상과 똑같이, 0 = 벽 그림은 가만히)
};
const dg = { root: $('#designer'), row: $('#dg-row'), built: false, side: 'fork', fresh: true };

function dgBuild() {
  if (dg.built) return; dg.built = true;
  const anyDesc = STUDENTS.some((s) => s.designer !== false && s.desc); dg.row.classList.toggle('has-desc', anyDesc); // 소개글이 있으면 설명판에 칸을 만듦
  const item = (s, i) => {
    // 금속 설명판 글: 이름 · 분야 / 가는 줄 / 한 줄 소개 (+ 소개글) / 포트폴리오 보기
    const plate = `<span class="dg-line"><b class="dg-name">${s.name}</b><span class="dg-field">${FIELD_LABEL[s.field] || '분야 확인 중'}</span></span>
        <span class="dg-slogan">${s.slogan || ''}</span>
        ${anyDesc ? `<span class="dg-desc">${s.desc || ''}</span>` : ''}
        <span class="dg-go">${s.portfolio ? '포트폴리오 보기 ↗' : '포트폴리오 준비 중'}</span>`;
    return `<li class="dg-item" data-field="${s.field || 'none'}" data-i="${i}">
      <div class="dg-bust"><img src="${bustThumb(s)}" alt="${s.name}의 석고상" loading="lazy" decoding="async"></div>
      <div class="dg-stand">
        <i class="dg-cap" aria-hidden="true"></i>
        <div class="dg-shaft">
          ${s.portfolio
            ? `<a class="dg-plate" href="${s.portfolio}" target="_blank" rel="noopener" aria-label="${s.name} 포트폴리오 새 탭으로 열기">${plate}</a>`
            : `<div class="dg-plate is-empty">${plate}</div>`}
        </div>
        <i class="dg-foot" aria-hidden="true"></i>
      </div>
    </li>`;
  };
  // 줄 세우기: [UX/UI · 웹 (팻말에서 가까운 순서가 오른쪽)] [팻말] [Visual] [분야 확인 중]
  const all = STUDENTS.map((s, i) => [s, i]).filter(([s]) => s.designer !== false);
  const ux = all.filter(([s]) => s.field === 'uxui'), vi = all.filter(([s]) => s.field === 'visual'), un = all.filter(([s]) => s.field !== 'uxui' && s.field !== 'visual');
  dg.row.innerHTML = `<li class="dg-sign dg-end" aria-hidden="true"><b>UX/UI · 웹</b><span>${ux.length}명</span></li>`
    + ux.map(([s, i]) => item(s, i)).join('')
    + `<li class="dg-fork" id="dg-fork"><p>어느 쪽으로 갈까요?</p>
        <div class="dg-post">
          <button type="button" data-side="uxui" aria-label="왼쪽 UX/UI · 웹 ${ux.length}명 쪽으로 가기"><span class="dg-board"><i></i><b>UX/UI · 웹</b><small>${ux.length}명</small></span></button>
          <button type="button" data-side="visual" aria-label="오른쪽 Visual ${vi.length}명 쪽으로 가기"><span class="dg-board"><b>Visual</b><small>${vi.length}명</small><i></i></span></button>
        </div></li>`
    + vi.map(([s, i]) => item(s, i)).join('')
    + (un.length ? `<li class="dg-sign" aria-hidden="true"><b>분야 확인 중</b><span>${un.length}명</span></li>` + un.map(([s, i]) => item(s, i)).join('') : '');
  dg.counts = { uxui: ux.length, visual: vi.length }; dg.total = all.length;
  dg.row.addEventListener('click', (e) => {
    const side = e.target.closest('[data-side]'); if (side) dgGo(side.dataset.side);
  });
  dg.row.addEventListener('scroll', dgProgress, { passive: true });
}

function dgItems() { return $$('.dg-item', dg.row); }
const dgMid = (el) => el.offsetLeft + el.offsetWidth / 2 - dg.row.clientWidth / 2; // 이 칸이 화면 가운데 올 때의 스크롤 위치
function dgProgress() {
  const max = dg.row.scrollWidth - dg.row.clientWidth, x = dg.row.scrollLeft;
  $('#dg-bar').style.transform = `scaleX(${max > 0 ? (x / max).toFixed(3) : 1})`;
  $('#dg-prev').disabled = x <= 2; $('#dg-next').disabled = x >= max - 2;
  // 팻말이 화면 어디에 있는지 → 두 벽이 섞이는 흐린 경계의 자리. 벽 그림은 걸어간 만큼 옆으로 흘러감
  const forkEl = $('#dg-fork'), fork = dgMid(forkEl), W = Math.max(200, forkEl.offsetWidth * 1.15);
  dg.fx = forkEl.offsetLeft + forkEl.offsetWidth / 2 - x;
  dg.root.style.setProperty('--fx', dg.fx.toFixed(1) + 'px');
  dg.root.style.setProperty('--wx', (-((x * DESIGNER.wallMove) % (dg.tile || 1600))).toFixed(1) + 'px');
  // 팻말에서 얼마나 왼쪽/오른쪽으로 왔는지 (0 = 팻말 앞, 1 = 그쪽 안)
  const ux = clamp((fork - x) / W, 0, 1), vi = clamp((x - fork) / W, 0, 1);
  const side = ux > 0.5 ? 'uxui' : vi > 0.5 ? 'visual' : 'fork';
  if (side !== dg.side || !$('#dg-count').textContent) {
    dg.side = side;
    $$('#dg-filter button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.side === side)));
    $('#dg-count').textContent = side === 'uxui' ? `UX/UI · 웹 · ${dg.counts.uxui}명` : side === 'visual' ? `Visual · ${dg.counts.visual}명` : `${dg.total}명의 디자이너`;
  }
}
/* 크기 맞추기: 벽 그림 한 장의 너비(벽 높이의 4배), 팻말 기둥이 석고상 받침대와 같은 바닥 높이에 서게 */
function dgLayout() {
  const wall = $('.dg-wall', dg.root), li = $('.dg-item', dg.row); if (!wall || !li) return;
  dg.tile = Math.max(200, wall.offsetHeight * 4); dg.root.style.setProperty('--tile', dg.tile.toFixed(0) + 'px');
  const gap = li.getBoundingClientRect().bottom - $('.dg-stand', li).getBoundingClientRect().bottom;
  $('#dg-fork').style.setProperty('--fork-b', Math.max(0, gap).toFixed(0) + 'px');
}
/* 바로 가기: UX/UI = 팻말 바로 왼쪽 석고상, Visual = 바로 오른쪽 석고상 */
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
  requestAnimationFrame(() => { dgLayout(); if (dg.fresh) { dg.fresh = false; dgScrollTo($('#dg-fork'), true); } dgProgress(); }); // 처음 들어오면 팻말 앞에 서 있음
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
addEventListener('resize', () => { if (page === 'designer') { dgLayout(); dgProgress(); } });
