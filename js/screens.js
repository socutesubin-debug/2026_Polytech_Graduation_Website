/* 화면 전환: 지금 보이는 화면(인트로/로비/전시실/목록)과 상단 메뉴, 주소(#lobby 등) 관리 */
const INTRO_MODE = 'combo';
const introFrame = $('#intro-frame');
const screens = { intro: $('#intro'), lobby: $('#lobby'), gallery: $('#gallery'), list: $('#list'), 'test-room': $('#test-room') };
const topbar = $('#topbar'), veil = $('#veil');
let page = '', room = 0, detail = -1, busy = false;

function go(name) {
  closeDetail(true);
  for (const [k, el] of Object.entries(screens)) el.classList.toggle('on', k === name);
  for (const el of [$('#intro'), introFrame]) if (el !== screens.intro) el.classList.remove('on');
  page = name;
  topbar.classList.toggle('on', name !== 'intro');
  topbar.classList.toggle('no-brand', name === 'lobby' || name === 'gallery');
  topbar.dataset.theme = name === 'list' ? 'light' : '';
  if (name === 'list') renderList();
  if (name === 'test-room') enterTestRoom();
  updateNav(); setHash();
}
function updateNav() {
  $$('.pill button').forEach((b) => b.classList.toggle('active', page === 'gallery' ? b.dataset.room === String(room) : b.dataset.go === page));
}
function setHash() {
  const h = page === 'gallery' ? `gallery-${room + 1}` : ['lobby', 'list', 'test-room'].includes(page) ? page : '';
  try { history.replaceState(null, '', h ? `#${h}` : location.pathname + location.search); } catch (e) {  }
}
function arrive(cam) { cam.classList.remove('arrive'); void cam.offsetWidth; cam.classList.add('arrive'); }
