/* 학생 목록 LIST (스토리보드 s8): 이름 검색, 분야 선택, 석고상 사진 카드.
   3D를 전혀 쓰지 않는 화면이라서, 3D가 안 켜지는 기기에서도 15명 모두 볼 수 있음 (3D 실패 시 대피소).
   석고상 사진은 assets/images/busts/01~15.webp (3D 파일을 미리 찍어 둔 사진) */
let fieldFilter = 'all'; // 'all' | 'uxui' | 'visual'

/* 카드 아래에 적는 전시관 이름: 분야가 정해진 학생만 전시관이 있음 */
function galleryLabel(s) {
  return s.field === 'uxui' ? 'GALLERY 01 · UX/UI' : s.field === 'visual' ? 'GALLERY 02 · Visual' : '분야 확인 중';
}
function bustThumb(s) {
  const url = MODELS[s.name]; if (!url) return '';
  return 'assets/images/busts/' + url.match(/(\d+)\.glb$/)[1] + '.webp';
}
function listRows() {
  const q = $('#search').value.trim();
  return STUDENTS.filter((s) => (fieldFilter === 'all' || s.field === fieldFilter) && (!q || s.name.includes(q)));
}
function renderList() {
  const rows = listRows();
  $('#grid').innerHTML = rows.map((s) => {
    const img = bustThumb(s);
    return `
    <button class="card" type="button" data-i="${s.no - 1}" aria-label="${s.name} 학생 소개 보기">
      <span class="thumb">${img ? `<img src="${img}" alt="" loading="lazy" decoding="async" width="480" height="560">` : bustSVG(0)}</span>
      <span class="meta"><b>${s.name}</b><em>${pad(s.no)}</em></span>
      <span class="gal">${galleryLabel(s)}</span>
      <span class="card-slogan">${s.slogan}</span>
    </button>`;
  }).join('');
  $('#total').innerHTML = rows.length === STUDENTS.length
    ? `총 인원 <b>${STUDENTS.length}</b>명`
    : `<b>${rows.length}</b>명 보는 중 / 총 인원 ${STUDENTS.length}명`;
  $('#empty').hidden = rows.length > 0;
  $$('#grid .card').forEach((b) => b.addEventListener('click', () => openDetail(+b.dataset.i)));
  $$('#field-filter button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.field === fieldFilter)));
}
$('#search').addEventListener('input', renderList);
$$('#field-filter button').forEach((b) => b.addEventListener('click', () => { fieldFilter = b.dataset.field; renderList(); }));
