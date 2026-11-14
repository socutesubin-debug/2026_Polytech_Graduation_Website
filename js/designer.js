/* Designer 방 (#designer) — 석고상 15개가 받침대 위에 가로 한 줄로 전시된 방
   - 마우스 휠(위아래)을 굴리면 옆으로 천천히 지나감. 휴대폰은 손가락으로 옆으로 넘김. ← → 키, 양옆 화살표 버튼도 됨
   - 석고상마다 미술관 같은 작품안내 표찰: 번호·분야, 이름, 한 줄 소개, 소개글(있으면)
     표찰을 누르면 그 사람의 포트폴리오 사이트가 새 탭으로 열림 (주소가 아직 없으면 "포트폴리오 준비 중")
     표찰 아래 [대표 작품 보기]를 누르면 Project 방의 그 작품 상세가 열림
   - 위에서 분야(전체 / UX/UI · 웹 / Visual)를 고를 수 있음
   - 석고상 사진은 assets/images/busts/01~15.webp (3D 파일을 미리 찍어 둔 사진, 배경이 투명)
   숫자를 바꾸고 싶으면 아래 DESIGNER만 고치면 됩니다 */
const DESIGNER = {
  wheel: 1,        // 휠 한 번에 옆으로 움직이는 정도 (2 = 두 배 빠르게)
};
const dg = { root: $('#designer'), row: $('#dg-row'), built: false, field: 'all' };

function dgBuild() {
  if (dg.built) return; dg.built = true;
  dg.row.innerHTML = STUDENTS.map((s, i) => {
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
  }).join('');
  dg.row.addEventListener('click', (e) => {
    const b = e.target.closest('.dg-work'); if (!b) return;
    go('project'); pjOpen(+b.dataset.i, null);
  });
  dg.row.addEventListener('scroll', dgProgress, { passive: true });
  $('#dg-count').textContent = `${STUDENTS.length}명의 디자이너`;
}

function dgItems() { return $$('.dg-item', dg.row).filter((li) => !li.hidden); }
function dgProgress() {
  const max = dg.row.scrollWidth - dg.row.clientWidth;
  $('#dg-bar').style.transform = `scaleX(${max > 0 ? (dg.row.scrollLeft / max).toFixed(3) : 1})`;
  $('#dg-prev').disabled = dg.row.scrollLeft <= 2; $('#dg-next').disabled = dg.row.scrollLeft >= max - 2;
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
  if (li.hidden) dgFilter('all');
  requestAnimationFrame(() => {
    dgScrollTo(li, true);
    li.classList.remove('hi'); void li.offsetWidth; li.classList.add('hi');
    $('.dg-plate', li).focus({ preventScroll: true });
  });
}
function dgFilter(f) {
  dg.field = f;
  $$('#dg-filter button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.field === f)));
  let n = 0;
  $$('.dg-item', dg.row).forEach((li) => { const on = f === 'all' || li.dataset.field === f; li.hidden = !on; if (on) n++; });
  $('#dg-count').textContent = `${n}명의 디자이너`;
  dg.row.scrollLeft = 0; dgProgress();
}
function enterDesigner() { dgBuild(); requestAnimationFrame(dgProgress); }
/* 키보드 (js/main.js가 부름): ← → 로 옆 석고상 */
function designerKey(e) {
  if (e.key === 'ArrowRight' || e.key === 'PageDown') { dgStep(1); return true; }
  if (e.key === 'ArrowLeft' || e.key === 'PageUp') { dgStep(-1); return true; }
  if (e.key === 'Home') { dgScrollTo(dgItems()[0]); return true; }
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
$$('#dg-filter button').forEach((b) => b.addEventListener('click', () => dgFilter(b.dataset.field)));
addEventListener('resize', () => { if (page === 'designer') dgProgress(); });
