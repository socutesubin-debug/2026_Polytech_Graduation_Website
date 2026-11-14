/* 화면 전환: 지금 보이는 화면과 상단 메뉴, 주소(#lobby3d 등) 관리
   지금 화면 (2026-11-14 새 기획): opening(Intro) · about(전시 소개) · project(Project 방) · designer(Designer 방)
   예전 V2 화면 lobby3d(로비) · hall-uxui / hall-visual(전시관) · list(목록)은 메뉴에서 뺐지만 주소(#lobby3d 등)로는 볼 수 있음
   옛 V1 화면(intro · lobby · gallery)은 지우지 않고 남겨 둠: 주소 끝에 #lobby, #gallery-1~3 을 붙이면 볼 수 있음 */
const INTRO_MODE = 'combo';
const introFrame = $('#intro-frame');
const screens = { intro: $('#intro'), lobby: $('#lobby'), gallery: $('#gallery'), list: $('#list'), 'test-room': $('#test-room'), 'hall-uxui': $('#hall-uxui'), 'hall-visual': $('#hall-visual'),
  opening: $('#opening'), lobby3d: $('#lobby3d'), about: $('#about'), project: $('#project'), designer: $('#designer') };
const topbar = $('#topbar'), veil = $('#veil');
let page = '', room = 0, detail = -1, busy = false;

function go(name) {
  if (name === 'special') name = 'project'; // 예전 이름
  closeDetail(true);
  for (const [k, el] of Object.entries(screens)) el.classList.toggle('on', k === name);
  for (const el of [$('#intro'), introFrame]) if (el !== screens.intro) el.classList.remove('on');
  page = name;
  topbar.classList.toggle('on', name !== 'intro' && name !== 'opening');
  topbar.classList.toggle('no-brand', name === 'lobby' || name === 'gallery');
  topbar.dataset.theme = name === 'designer' ? 'dark' : ['list', 'about', 'project'].includes(name) ? 'light' : ''; // Designer는 어두운 방이라 메뉴 글자를 밝게
  if (name === 'list') renderList();
  if (name === 'test-room') enterTestRoom();
  if (HALLS[name]) enterHall(name);
  if (name === 'lobby3d') enterLobby3D();
  if (name === 'about') enterAbout();
  if (name === 'project') enterProject();
  if (name === 'designer') enterDesigner();
  if (name !== 'project' && typeof pjClose === 'function') pjClose();
  if (name !== 'opening') { op.playing = false; op.video.pause(); }
  updateNav(); setHash();
}
function updateNav() {
  $$('.pill button').forEach((b) => b.classList.toggle('active', b.dataset.go === page));
}
function setHash() {
  const h = page === 'gallery' ? `gallery-${room + 1}` : ['lobby', 'list', 'test-room', 'hall-uxui', 'hall-visual', 'lobby3d', 'about', 'project', 'designer'].includes(page) ? page : '';
  try { history.replaceState(null, '', h ? `#${h}` : location.pathname + location.search); } catch (e) {  }
}
function arrive(cam) { cam.classList.remove('arrive'); void cam.offsetWidth; cam.classList.add('arrive'); }
