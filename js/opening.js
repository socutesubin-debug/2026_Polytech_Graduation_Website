/* V2 오프닝 (#opening) — 스토리보드 s1~s3
   s1 나비 등장 → s2 포스터 앞을 지나감 → s3 빛나는 아치 입구 + [입장하기]
   - 지금은 코드로 그린 임시 그림(SVG)과 나비. 영상 파일을 넣고 아래 OPENING.video에 이름을 적으면 그 영상이 대신 재생됨
   - [건너뛰기]는 항상 보임 (누르면 바로 로비). 한 번 본 사람에게는 더 눈에 띄게 보임
   - 움직임 줄이기: 움직임 없이 입구 그림 + [입장하기]만 보여 줌
   - [입장하기] → 나비가 빛 속으로 → 하얗게 밝아짐 → 로비 (s4 슬로건 모션이 생기면 OPENING.next만 바꾸면 됨)
   시간을 바꾸고 싶으면 아래 OPENING 숫자만 고치면 됩니다 (단위: 1000 = 1초) */
const OPENING = {
  shots: [3400, 4200, 2200],  // s1, s2, s3에서 나비가 날아가는 시간
  enterAt: 1300,              // s3이 시작되고 이만큼 뒤에 [입장하기]가 나타남
  loopTail: 2,                // 영상일 때: 마지막 2초를 반복 재생
  video: [],                  // 영상이 준비되면 파일 이름을 적어요: ['assets/video/intro.webm', 'assets/video/intro.mp4']
  next: 'lobby3d',            // 입장한 뒤 갈 화면
  seenKey: 'btf-opening-seen',
};
const op = {
  root: $('#opening'), art: $('#op-art'), fly: $('#op-fly'), copy: $('#op-copy'), white: $('#op-white'),
  video: $('#op-video'), paths: [1, 2, 3].map((n) => $('#op-path-' + n)),
  t0: 0, shot: 0, playing: false, leaving: false, mode: 'art', raf: 0,
};
$('#op-poster').setAttribute('href', ASSETS.poster);

function opSeen() { try { return localStorage.getItem(OPENING.seenKey) === '1'; } catch (e) { return false; } }
function opMarkSeen() { try { localStorage.setItem(OPENING.seenKey, '1'); } catch (e) { /* 저장을 막아 둔 브라우저 */ } }

function opSetShot(n) {
  op.shot = n;
  op.root.dataset.shot = String(n);
  $$('.op-shot', op.art).forEach((g) => g.classList.toggle('on', +g.dataset.shot === n));
}
/* 나비를 길(SVG path) 위의 한 점에 놓음. k = 0(길 처음)~1(길 끝) */
function opPlaceFly(path, k, t) {
  const len = path.getTotalLength(), d = clamp(k, 0, 1) * len;
  const a = path.getPointAtLength(d), b = path.getPointAtLength(Math.min(len, d + 6));
  const m = path.getScreenCTM(); if (!m) return;
  const x = a.x * m.a + a.y * m.c + m.e, y = a.x * m.b + a.y * m.d + m.f;
  const ang = Math.atan2(b.y - a.y, b.x - a.x) * 180 / Math.PI + 90;
  const bob = Math.sin(t / 170) * 5;
  op.fly.style.transform = `translate(${x}px,${y + bob}px) translate(-50%,-50%) rotate(${k >= 1 ? 0 : ang * 0.55}deg) scale(${m.a.toFixed(3)})`;
}
function opShowEnter() {
  if (op.copy.classList.contains('on')) return;
  op.copy.classList.add('on');
  if (page === 'opening' && document.activeElement === document.body) $('#op-enter').focus({ preventScroll: true });
}
function opFrame(t) {
  if (!op.playing || page !== 'opening') { op.playing = false; return; }
  op.raf = requestAnimationFrame(opFrame);
  if (op.mode === 'video' || op.leaving) return;
  const [a, b, c] = OPENING.shots, e = t - op.t0;
  const ease = (x) => x * x * (3 - 2 * x);
  if (e < a) { if (op.shot !== 1) opSetShot(1); opPlaceFly(op.paths[0], e / a, t); }
  else if (e < a + b) { if (op.shot !== 2) opSetShot(2); opPlaceFly(op.paths[1], (e - a) / b, t); }
  else {
    if (op.shot !== 3) opSetShot(3);
    opPlaceFly(op.paths[2], ease(clamp((e - a - b) / c, 0, 1)), t);
    if (e - a - b > OPENING.enterAt) opShowEnter();
  }
}
/* 영상 파일이 있으면 영상으로 바꿈. 없으면(대부분 지금) 아무 일도 안 일어나고 임시 그림이 계속 나옴 */
function opTryVideo() {
  const v = op.video; if (v.dataset.tried) return; v.dataset.tried = '1';
  if (reduce || !OPENING.video.length) return;
  for (const src of OPENING.video) { const s = document.createElement('source'); s.src = src; s.type = src.endsWith('.webm') ? 'video/webm' : 'video/mp4'; v.appendChild(s); }
  v.addEventListener('loadeddata', () => {
    if (page !== 'opening' || op.leaving) return;
    op.mode = 'video'; v.hidden = false; op.root.classList.add('has-video');
    v.currentTime = 0; v.play().catch(() => {});
  }, { once: true });
  v.addEventListener('timeupdate', () => {
    if (!v.duration || op.mode !== 'video') return;
    if (v.currentTime > v.duration - OPENING.loopTail - 0.3) opShowEnter();
    if (v.currentTime >= v.duration - 0.08) { v.currentTime = Math.max(0, v.duration - OPENING.loopTail); v.play().catch(() => {}); }
  });
  v.load();
}
function playOpening() {
  cancelTransition();
  op.leaving = false; op.mode = 'art';
  op.copy.classList.remove('on'); op.white.classList.remove('on'); op.fly.classList.remove('in');
  op.root.classList.toggle('seen', opSeen());
  go('opening');
  if (reduce) { // 움직임 줄이기: 입구 그림 한 장 + [입장하기]
    opSetShot(3); op.root.classList.add('still'); opShowEnter();
    requestAnimationFrame(() => opPlaceFly(op.paths[2], 1, 0));
    return;
  }
  opSetShot(1);
  op.t0 = performance.now(); op.playing = true;
  cancelAnimationFrame(op.raf); op.raf = requestAnimationFrame(opFrame);
  opTryVideo();
  if (op.video.readyState >= 2) { op.mode = 'video'; op.video.currentTime = 0; op.video.play().catch(() => {}); }
}
/* [입장하기]: 나비가 빛 속으로 → 하얗게 → 다음 화면 */
async function opEnter() {
  if (op.leaving || page !== 'opening') return;
  op.leaving = true; opMarkSeen();
  const my = ++seq;
  op.fly.classList.add('in'); op.white.classList.add('on'); op.copy.classList.remove('on');
  await wait(900); if (my !== seq) return;
  opLeave();
}
function opSkip() { if (page !== 'opening') return; opMarkSeen(); ++seq; opLeave(); }
function opLeave() {
  op.playing = false; op.video.pause();
  go(OPENING.next);
}
$('#op-enter').addEventListener('click', opEnter);
$('#op-skip').addEventListener('click', opSkip);
addEventListener('resize', () => { if (page === 'opening' && (reduce || op.shot === 3)) opPlaceFly(op.paths[2], 1, 0); });
