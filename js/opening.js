/* Intro (#opening) — 스크롤 인트로
   스크롤을 내리면: 하늘의 나비 → 포스터 벽 → 나비가 포스터 속으로 → 하얗게 밝아진 뒤 다음 화면(About)으로 넘어감
   장면 자체는 js/intro-scroll.js (숫자는 그 파일 맨 위 CFG). 여기서는 사이트와 잇는 일만 함
   - [건너뛰기]·Esc·Enter: 바로 다음 화면
   - 상단 메뉴의 Intro를 누르면 처음부터 다시 */
const OPENING = {
  next: 'about',              // 인트로가 끝나면 갈 화면
  seenKey: 'btf-opening-seen',
};
const op = { root: $('#opening'), stage: $('#op-stage'), intro: null, playing: false };

function opSeen() { try { return localStorage.getItem(OPENING.seenKey) === '1'; } catch (e) { return false; } }
function opMarkSeen() { try { localStorage.setItem(OPENING.seenKey, '1'); } catch (e) { /* 저장을 막아 둔 브라우저 */ } }

function playOpening() {
  cancelTransition();
  op.root.classList.toggle('seen', opSeen());
  go('opening');
  if (!op.intro) op.intro = createIntroScroll(op.stage.appendChild(document.createElement('div')), { scroller: op.root, onEnd: opLeave });
  op.root.scrollTop = 0; op.intro.reset();
  op.playing = true; op.intro.start();
}
function opStop() { op.playing = false; if (op.intro) op.intro.stop(); }
function opLeave() { if (page !== 'opening') return; opMarkSeen(); go(OPENING.next); }
function opSkip() { opLeave(); }
$('#op-skip').addEventListener('click', opSkip);
