/* 배경음 (2026-11-16) — 화면 아래의 둥근 유리 버튼으로 켜고 끔
   - 켜져 있으면 막대 5개가 실제 배경음 소리에 맞춰 움직임 (Web Audio 분석). 끄면 버튼이 작게 줄고 막대는 짧게 멈춤
   - 늘 켜진 상태로 시작 (버튼은 처음부터 켜진 모양). 버튼은 끌 때만 누르면 됨. 꺼도 다음에 들어오면 다시 켜짐
   - 페이지가 열리면 바로 재생을 시도함. 브라우저가 막으면(사용자가 한 번 누르기 전에는 소리를 못 내게 하는 규칙) 화면 아무 곳이나 처음 누르거나 키를 누르는 순간 소리가 남
     (그동안 막대는 비슷한 움직임으로 대신 움직임. 스크롤·휠은 브라우저가 '누르기'로 치지 않아서 소리가 나지 않음)
   - 다른 탭으로 가면 잠시 멈추고, 돌아오면 다시 이어짐. 소리는 부드럽게 커지고 작아짐
   - 음악 파일: assets/audio/bgm.mp3 (바꾸려면 같은 이름으로 덮어쓰기)
   숫자를 바꾸고 싶으면 아래 SOUND만 고치면 됩니다 */
const SOUND = {
  src: 'assets/audio/bgm.mp3',
  volume: 0.45,       // 소리 크기 (0~1)
  fade: 0.9,          // 켜고 끌 때 부드럽게 바뀌는 시간(초)
  key: 'btf-sound',   // 예전 버전이 켬/끔을 저장하던 이름 (지금은 지우기만 함)
  bars: [0.45, 0.8, 1, 0.7, 0.5], // 막대마다 기본 키 (가운데가 큼)
};
const snd = { on: true, want: true, audio: null, ctx: null, an: null, data: null, raf: 0, vol: 0, lv: [0, 0, 0, 0, 0], btn: null, bars: [] };
(() => {
  try { localStorage.removeItem(SOUND.key); } catch (e) { /* 예전에 저장해 둔 '끔' 기억 지우기 */ }
  const btn = snd.btn = document.createElement('button');
  btn.type = 'button'; btn.className = 'snd'; btn.id = 'snd';
  btn.innerHTML = '<span class="snd-bars" aria-hidden="true">' + SOUND.bars.map(() => '<i></i>').join('') + '</span>';
  document.body.appendChild(btn);
  snd.bars = [...btn.querySelectorAll('i')];
  const label = () => { btn.setAttribute('aria-pressed', String(snd.on)); btn.setAttribute('aria-label', snd.on ? '배경음 끄기' : '배경음 켜기'); btn.classList.toggle('is-on', snd.on); };
  label();

  function setup() {
    if (snd.audio) return;
    const a = snd.audio = new Audio(SOUND.src); a.loop = true; a.preload = 'auto'; a.volume = 0;
    // 소리 분석 (막대 움직임용). 파일을 더블클릭해 연 경우(file://)에는 브라우저가 분석을 막아서 쓰지 않음 → 막대는 비슷한 움직임으로 대신함
    const AC = window.AudioContext || window.webkitAudioContext;
    if (AC && location.protocol !== 'file:') {
      try {
        snd.ctx = new AC(); const src = snd.ctx.createMediaElementSource(a);
        snd.an = snd.ctx.createAnalyser(); snd.an.fftSize = 256; snd.an.smoothingTimeConstant = 0.75;
        src.connect(snd.an); snd.an.connect(snd.ctx.destination);
        snd.data = new Uint8Array(snd.an.frequencyBinCount);
      } catch (e) { snd.ctx = snd.an = null; }
    }
  }
  function frame(t) {
    snd.raf = requestAnimationFrame(frame);
    // 소리 크기를 부드럽게
    const dt = Math.min(0.1, Math.max(0.001, (t - (snd.last || t)) / 1000)); snd.last = t;
    const playing = !snd.audio.paused;
    const target = snd.on && playing && !document.hidden ? SOUND.volume : 0, step = SOUND.volume * dt / SOUND.fade; // 초 기준 (화면 빠르기와 상관없이 같은 시간)
    snd.vol += Math.max(-step, Math.min(step, target - snd.vol)); snd.audio.volume = Math.max(0, Math.min(1, snd.vol));
    if (!snd.on && snd.vol <= 0.001) { snd.audio.pause(); cancelAnimationFrame(snd.raf); snd.raf = 0; snd.last = 0; snd.bars.forEach((b) => b.style.removeProperty('--h')); return; }
    // 막대: 낮은 소리 → 높은 소리 5구간의 세기 (가운데 막대가 낮은 소리)
    const n = snd.bars.length, order = [3, 1, 0, 2, 4];
    if (snd.an) snd.an.getByteFrequencyData(snd.data);
    for (let i = 0; i < n; i++) {
      let v;
      if (snd.an && playing) { const k = order[i], a = 1 + k * 5, b = a + 5; let s = 0; for (let j = a; j < b; j++) s += snd.data[j]; v = Math.min(1, s / 5 / 190 * (1 + k * 0.55)); } // 높은 소리는 원래 약해서 조금 키워 줌
      else v = 0.45 + 0.3 * Math.sin(t / 260 + i * 1.7) + 0.25 * Math.sin(t / 143 + i * 2.9); // 분석을 못 쓸 때, 아직 소리가 막혀 있을 때
      if (reduce) v = 0.6;
      snd.lv[i] += (v - snd.lv[i]) * (1 - Math.exp(-dt * 22));
      snd.bars[i].style.setProperty('--h', (0.18 + 0.82 * snd.lv[i] * SOUND.bars[i] / Math.max(...SOUND.bars) * (snd.on ? 1 : snd.vol / SOUND.volume)).toFixed(3));
    }
  }
  function play() { // 재생 시도. 브라우저가 막으면 켜진 모양 그대로 두고, 처음 누르기를 기다림
    setup();
    if (snd.ctx && snd.ctx.state === 'suspended') snd.ctx.resume().catch(() => {});
    const p = snd.audio.play();
    if (p && p.then) p.then(() => GESTURES.forEach((g) => removeEventListener(g, first, true)), () => {}); // 소리가 나기 시작하면 첫 누르기 기다리기를 그만둠
  }
  function set(on, remember) {
    if (remember) snd.want = on; // 이번 방문 동안만 기억 (다음에 들어오면 다시 켜진 채로 시작)
    if (on) play();
    snd.on = on; label();
    if (snd.audio && !snd.raf) snd.raf = requestAnimationFrame(frame);
  }
  btn.addEventListener('click', (e) => { e.stopPropagation(); set(!snd.on, true); });
  // 처음 누르기·키 입력: 브라우저가 소리를 허락하는 순간. 켜져 있는데 아직 소리가 안 나면 바로 재생 (버튼 누르기는 위 click이 '끄기'로 처리)
  const GESTURES = ['pointerdown', 'pointerup', 'touchend', 'keydown'];
  const first = (e) => {
    if (e.target && e.target.closest && e.target.closest('#snd')) return;
    if (snd.on && snd.audio && snd.audio.paused && !document.hidden) play();
  };
  GESTURES.forEach((g) => addEventListener(g, first, true));
  set(true, false); // 페이지가 열리면 바로 켜기 시도
  document.addEventListener('visibilitychange', () => {
    if (!snd.audio || !snd.on) return;
    if (document.hidden) { if (!snd.raf) snd.audio.pause(); } else { snd.audio.play().catch(() => {}); if (!snd.raf) snd.raf = requestAnimationFrame(frame); }
  });
  // 버튼 색: 밝은 화면에서는 짙은 막대, 어두운 화면(Intro, 작품 상세)에서는 흰 막대
  const theme = () => { btn.dataset.theme = topbar.dataset.theme === 'light' && !document.body.classList.contains('pj-reading') ? 'light' : 'dark'; };
  new MutationObserver(theme).observe(topbar, { attributes: true, attributeFilter: ['data-theme'] });
  new MutationObserver(theme).observe(document.body, { attributes: true, attributeFilter: ['class'] });
  theme();
})();
