/* 인트로: 티켓 빠각 → 길거리 포스터 → 금색 액자 → 와장창 → 로비 */
const intro = $('#intro');
const street = makeStage($('#street-stage'), 1740, 980);
const POSTER = [731, 300, 278, 452];
let introTimer;
function resetStreet() { street.el.classList.remove('zooming'); street.el.style.transform = ''; street.frozen = false; }
intro.classList.toggle('no-ticket', INTRO_MODE === 'frame');
const FAST = INTRO_MODE === 'combo';
for (const el of [intro, introFrame, $('#portal')]) el.classList.toggle('fast', FAST);
function playIntro() {
  ++seq; busy = false; clearTimeout(introTimer); clearTimeout(frameTimer);
  screens.intro = intro;
  introFrame.classList.remove('opened'); shardsEl.classList.remove('on');
  cleanupPortal(); intro.classList.remove('opening');
  intro.classList.remove('crack', 'torn', 'lit', 'home');
  resetStreet();
  go('intro');
  introTimer = setTimeout(tear, INTRO_MODE === 'frame' ? 400 : FAST ? 1600 : 3200);
}
async function tear() {
  if (page !== 'intro' || intro.classList.contains('crack')) return;
  clearTimeout(introTimer);
  const my = seq;
  intro.classList.add('crack');
  if (INTRO_MODE !== 'frame') {
    await wait(FAST ? 200 : 240); if (my !== seq) return;
    intro.classList.add('torn');
    await wait(FAST ? 420 : 600); if (my !== seq) return;
  }
  intro.classList.add('lit');
  await wait(FAST ? 450 : 700); if (my !== seq) return;
  intro.classList.add('home');
  $('#poster').focus({ preventScroll: true });
  if (FAST) introTimer = setTimeout(enterPoster, 1400);
}

const portal = $('#portal');
function cleanupPortal() {
  for (const lob of [screens.lobby, introFrame]) { lob.style.clipPath = ''; lob.style.opacity = ''; lob.style.transition = ''; }
  portal.classList.remove('on', 'grow'); portal.removeAttribute('style');
}
function resetFrameTitle() {
  $$('.if-eyebrow,.if-title,.if-sub', introFrame).forEach((el) => { el.style.animation = 'none'; void el.offsetWidth; el.style.animation = ''; });
}
async function enterPoster() {
  if (page !== 'intro' || busy || !intro.classList.contains('home')) return;
  const my = ++seq; busy = true;
  clearTimeout(introTimer);
  const toFrame = INTRO_MODE !== 'ticket';
  const r = $('#poster').getBoundingClientRect(), W = innerWidth, H = innerHeight, lob = toFrame ? introFrame : screens.lobby;
  const clip = (x0, y0, x1, y1, rad) => `inset(${y0}px ${W - x1}px ${H - y1}px ${x0}px round ${rad}px)`;
  street.frozen = true;
  intro.classList.add('opening');

  lob.style.transition = 'none'; lob.style.opacity = '0'; lob.style.clipPath = clip(r.left, r.top, r.right, r.bottom, 2);
  lob.classList.add('on');
  if (toFrame) { introFrame.classList.remove('opened'); resetFrameTitle(); } else arrive($('#lobby-cam'));
  Object.assign(portal.style, { left: r.left + 'px', top: r.top + 'px', width: r.width + 'px', height: r.height + 'px' });
  await wait(FAST ? 250 : 420); if (my !== seq) { cleanupPortal(); return; }

  portal.classList.add('on');
  lob.style.transition = `opacity ${FAST ? .5 : .85}s ease`; lob.style.opacity = '1';
  await wait(FAST ? 550 : 950); if (my !== seq) { cleanupPortal(); return; }

  lob.style.transition = `clip-path ${FAST ? 1 : 1.5}s cubic-bezier(.75,0,.2,1)`; lob.style.clipPath = clip(0, 0, W, H, 0);
  portal.classList.add('grow'); Object.assign(portal.style, { left: '0px', top: '0px', width: W + 'px', height: H + 'px' });
  await wait(FAST ? 1050 : 1550); if (my !== seq) { cleanupPortal(); return; }
  intro.classList.add('instant'); lob.classList.add('instant');
  if (toFrame) { screens.intro = introFrame; go('intro'); } else go('lobby');
  cleanupPortal();
  await wait(60);
  intro.classList.remove('instant', 'opening'); lob.classList.remove('instant'); resetStreet();
  busy = false;
  if (toFrame && my === seq) frameTimer = setTimeout(shatter, FAST ? 2000 : 2600);
}

const shardsEl = $('#shards');
(function buildShards() {

  const cols = 9, rows = 7, jit = (v, s) => Math.max(0, Math.min(100, v + (Math.random() - .5) * s));
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
    const x0 = x * 100 / cols, x1 = (x + 1) * 100 / cols, y0 = y * 100 / rows, y1 = (y + 1) * 100 / rows;
    const pts = [[jit(x0, 3), jit(y0, 3)], [jit(x1, 3), jit(y0, 3)], [jit(x1, 3), jit(y1, 3)], [jit(x0, 3), jit(y1, 3)]];
    const p = document.createElement('div'); p.className = 'shard';
    p.style.setProperty('--clip', pts.map(([a, b]) => `${a.toFixed(2)}% ${b.toFixed(2)}%`).join(', '));
    const dx = (x0 + x1) / 2 - 50, dy = (y0 + y1) / 2 - 50, len = Math.max(1, Math.hypot(dx, dy)), dist = 900 + Math.random() * 700;
    p.style.setProperty('--tx', `${(dx / len * dist + (Math.random() - .5) * 260).toFixed(0)}px`);
    p.style.setProperty('--ty', `${(dy / len * dist + (Math.random() - .5) * 260).toFixed(0)}px`);
    p.style.setProperty('--tz', `${(300 + Math.random() * 500).toFixed(0)}px`);
    p.style.setProperty('--rx', `${((Math.random() - .5) * 1100).toFixed(0)}deg`);
    p.style.setProperty('--ry', `${((Math.random() - .5) * 1100).toFixed(0)}deg`);
    p.style.setProperty('--rz', `${((Math.random() - .5) * 900).toFixed(0)}deg`);
    p.style.setProperty('--delay', `${(Math.random() * 100).toFixed(0)}ms`);
    const tone = Math.random();
    if (tone < .38) { p.style.background = 'linear-gradient(135deg,#f0d9ad 0%,#b79d70 48%,#e5cfaa 100%)'; p.style.borderColor = 'rgba(255,239,204,.98)'; p.style.boxShadow = 'inset 0 0 10px rgba(255,248,226,.7),0 0 14px rgba(226,193,135,.3)'; }
    else if (tone < .72) { p.style.background = 'linear-gradient(135deg,#76654b 0%,#2b2923 55%,#b59a6b 100%)'; p.style.borderColor = 'rgba(213,184,132,.95)'; }
    else { p.style.background = 'linear-gradient(135deg,#d9c7a5 0%,#8b7756 45%,#292821 100%)'; p.style.borderColor = 'rgba(242,218,174,.95)'; }
    shardsEl.appendChild(p);
  }
})();
let frameTimer;
async function shatter() {
  if (page !== 'intro' || busy || screens.intro !== introFrame) return;
  clearTimeout(frameTimer);
  const my = ++seq; busy = true;
  introFrame.classList.add('opened');
  await wait(140);
  $$('.shard', shardsEl).forEach((p) => { p.style.animation = 'none'; void p.offsetWidth; p.style.animation = ''; });
  shardsEl.classList.add('on');
  introFrame.classList.add('instant'); screens.lobby.classList.add('instant');
  go('lobby'); arrive($('#lobby-cam'));
  await wait(1800);
  shardsEl.classList.remove('on'); introFrame.classList.remove('instant', 'opened'); screens.lobby.classList.remove('instant');
  if (my === seq) busy = false;
}
introFrame.addEventListener('click', shatter);

$('#brand').addEventListener('click', playIntro);
$('#ticket').addEventListener('click', tear);
$('#poster').addEventListener('click', () => { if (!street.moved) enterPoster(); });
$$('[data-skip]').forEach((b) => b.addEventListener('click', () => { ++seq; busy = false; clearTimeout(introTimer); clearTimeout(frameTimer); go('lobby'); arrive($('#lobby-cam')); }));
