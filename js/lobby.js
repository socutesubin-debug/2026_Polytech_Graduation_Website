/* 로비: 액자 3개를 누르면 해당 전시실로 확대해 들어감 */
const lobby = makeStage($('#lobby-stage'), 2000, 1128);
const lobbyDust = makeDust($('#lobby .dust'), innerWidth < 760 ? 30 : 60);
$('#lobby-spots').innerHTML = spotsHTML(LOBBY_SPOTS, 2.3);
$('#windows').innerHTML = FRAMES.map(({ inner: [x, y, w, h] }, r) =>
  `<div class="window" data-r="${r}" style="left:${x}px;top:${y}px;width:${w}px;height:${h}px"><div class="view"></div><div class="wl">GALLERY ${pad(r + 1)}</div></div>`).join('');
$('#frame-btns').innerHTML = FRAMES.map(({ outer: [x, y, w, h] }, r) => `
  <button class="frame-btn" type="button" data-r="${r}" style="left:${x}px;top:${y}px;width:${w}px;height:${h}px" aria-label="GALLERY ${pad(r + 1)} 들어가기"></button>
  <div class="flabel" style="left:${x + w / 2}px;top:${y + h + 26}px"><b>GALLERY ${pad(r + 1)}</b><span>${STUDENTS.filter((s) => s.room === r).map((s) => s.name).join(' · ')}</span></div>`).join('');
const views = $$('#windows .view');
$$('.frame-btn').forEach((b) => b.addEventListener('click', () => { if (!lobby.moved) enterFrame(+b.dataset.r); }));

function resetLobbyTransition() {
  lobby.el.classList.remove('zooming');
  lobby.el.style.transform = '';
  lobby.frozen = false;
}
function cancelTransition() {
  ++seq; busy = false;
  resetLobbyTransition();
  galleryCam.classList.remove('switching');
}
async function enterFrame(r) {
  if (busy) return;
  const my = ++seq; busy = true;
  const L = lobby.layers[1], [x, y, w, h] = FRAMES[r].inner, W = innerWidth, H = innerHeight;
  const [x0, y0] = toScreen(lobby, L, x, y), [x1, y1] = toScreen(lobby, L, x + w, y + h);
  const k = Math.max(W / (x1 - x0), H / (y1 - y0)) * 1.06, cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
  lobby.frozen = true;
  lobby.el.classList.add('zooming');
  lobby.el.style.transform = `translate(${W / 2 - cx * k}px,${H / 2 - cy * k}px) scale(${k})`;
  await wait(950); if (my !== seq) return;
  setRoom(r, true); go('gallery'); arrive($('#gallery-cam'));
  await wait(1000);
  if (my !== seq) return;
  resetLobbyTransition();
  busy = false;
}
