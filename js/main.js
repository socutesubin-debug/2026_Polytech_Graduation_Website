/* 시작: 상단 메뉴·키보드 조작, 매 프레임 그리기, 처음 보여 줄 화면 정하기 */
$$('.pill button').forEach((b) => b.addEventListener('click', () => {
  cancelTransition();
  closeDetail(true);
  if (b.dataset.room) {
    const r = +b.dataset.room;
    if (page === 'gallery') { changeRoom(r); return; }
    setRoom(r); go('gallery'); arrive(galleryCam);
  } else { go(b.dataset.go); if (b.dataset.go === 'lobby') arrive($('#lobby-cam')); }
}));

addEventListener('keydown', (e) => {
  if (e.target.closest && e.target.closest('input,textarea')) return;
  if (page === 'intro' && (e.key === 'Enter' || e.key === ' ') && e.target === document.body) {
    e.preventDefault();
    if (screens.intro === introFrame) shatter();
    else intro.classList.contains('home') ? enterPoster() : tear();
  } else if (detail >= 0) {
    if (e.key === 'Escape') closeDetail();
    if (e.key === 'ArrowLeft') stepDetail(-1);
    if (e.key === 'ArrowRight') stepDetail(1);
  } else if (page === 'gallery') {
    if (e.key === 'ArrowLeft') changeRoom(room - 1);
    if (e.key === 'ArrowRight') changeRoom(room + 1);
  }
});

let lastT = performance.now();
function tick(t) {
  const dt = Math.min(64, t - lastT); lastT = t;
  ptr.x += (ptr.tx - ptr.x) * .05; ptr.y += (ptr.ty - ptr.y) * .05;
  if (intro.classList.contains('on')) updateStage(street, t);
  if (screens.lobby.classList.contains('on')) {
    updateStage(lobby, t);

    const L = lobby.layers[1];
    for (const v of views) v.style.transform = `translate(${(-lobby.ox * .55) / L.s}px,${(-lobby.oy * .55) / L.s}px)`;
    drawDust(lobbyDust, lobby, t);
  }
  if (screens.gallery.classList.contains('on')) {
    updateStage(gallery, t);
    renderGallery3D(t);
    drawDust(galleryDust, gallery, t);
  }
  if (detail >= 0) renderDetail3D(t, dt);
  requestAnimationFrame(tick);
}

// css/lobby.css 안에서 쓰는 이미지라서 페이지 기준 전체 주소로 바꿔 둠 (그대로 두면 css 폴더 기준으로 찾음)
document.documentElement.style.setProperty('--img-gallery', `url("${new URL(ROOM_ASSETS[0].bg, location.href)}")`);
$$('[data-asset]').forEach((img) => { img.src = ASSETS[img.dataset.asset]; });
// 주소 끝(#lobby, #gallery-2 …)은 setRoom이 주소를 고치기 전에 먼저 읽어 둠
const start = location.hash.slice(1);
requestAnimationFrame(tick);
if (start === 'lobby') go('lobby');
else if (start === 'list') go('list');
else if (/^gallery-[123]$/.test(start)) { setRoom(+start.slice(-1) - 1); go('gallery'); }
else if (matchMedia('(max-width: 760px)').matches) go('list');
else playIntro();
