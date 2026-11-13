/* 화면 전환: 지금 보이는 화면과 상단 메뉴, 주소(#lobby3d 등) 관리
   V2 화면: opening(오프닝 s1~s3) · lobby3d(로비 s5) · hall-uxui / hall-visual(전시관 s6) · special(스페셜룸 s7) · list(목록 s8)
   옛 V1 화면(intro · lobby · gallery)은 지우지 않고 남겨 둠: 주소 끝에 #lobby, #gallery-1~3 을 붙이면 볼 수 있음 */
const INTRO_MODE = 'combo';
const introFrame = $('#intro-frame');
const screens = { intro: $('#intro'), lobby: $('#lobby'), gallery: $('#gallery'), list: $('#list'), 'test-room': $('#test-room'), 'hall-uxui': $('#hall-uxui'), 'hall-visual': $('#hall-visual'),
  opening: $('#opening'), lobby3d: $('#lobby3d'), special: $('#special') };
const topbar = $('#topbar'), veil = $('#veil');
let page = '', room = 0, detail = -1, busy = false;

function go(name) {
  closeDetail(true);
  for (const [k, el] of Object.entries(screens)) el.classList.toggle('on', k === name);
  for (const el of [$('#intro'), introFrame]) if (el !== screens.intro) el.classList.remove('on');
  page = name;
  topbar.classList.toggle('on', name !== 'intro' && name !== 'opening');
  topbar.classList.toggle('no-brand', name === 'lobby' || name === 'gallery');
  topbar.dataset.theme = name === 'list' ? 'light' : name === 'special' ? 'dark' : '';
  if (name === 'list') renderList();
  if (name === 'test-room') enterTestRoom();
  if (HALLS[name]) enterHall(name);
  if (name === 'lobby3d') enterLobby3D();
  if (name === 'special') enterSpecial();
  if (name !== 'opening') { op.playing = false; op.video.pause(); }
  updateNav(); setHash();
}
function updateNav() {
  $$('.pill button').forEach((b) => b.classList.toggle('active', b.dataset.go === page));
}
function setHash() {
  const h = page === 'gallery' ? `gallery-${room + 1}` : ['lobby', 'list', 'test-room', 'hall-uxui', 'hall-visual', 'lobby3d', 'special'].includes(page) ? page : '';
  try { history.replaceState(null, '', h ? `#${h}` : location.pathname + location.search); } catch (e) {  }
}
function arrive(cam) { cam.classList.remove('arrive'); void cam.offsetWidth; cam.classList.add('arrive'); }
