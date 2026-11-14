/* 영상 인트로 (시험용): 생성한 영상(assets/video/intro-scroll.mp4)을 스크롤에 맞춰 앞뒤로 돌려 보여 줌
   createIntroVideo(root, { scroller, onEnd }) -> { start(), stop(), reset() }   (js/intro-scroll.js와 같은 쓰임새)
   - 스크롤하기 전: 영상의 처음 hold초(나비가 제자리에서 나는 부분)를 반복 재생
   - 스크롤하면: 스크롤 위치에 맞는 장면으로 부드럽게 따라감
   주소 끝에 ?intro=video 를 붙이면 사이트가 이 버전으로 열림 */
function createIntroVideo(root, opts) {
  opts = opts || {};
  var CFG = { src: 'assets/video/intro-scroll.mp4', poster: 'assets/video/intro-scroll-poster.jpg',
    hold: 3,          // 영상 처음 몇 초가 "스크롤 전" 부분인지
    end: 19.6,        // 스크롤을 끝까지 내렸을 때의 영상 시각(초)
    glide: 4 };       // 스크롤을 따라오는 빠르기 (작을수록 부드럽게)
  root.classList.add('iv-stage');
  root.innerHTML = '<video class="iv-video" muted playsinline preload="auto" poster="' + CFG.poster + '"><source src="' + CFG.src + '" type="video/mp4"></video><div class="is-hint">SCROLL<i></i></div>';
  var v = root.querySelector('video'), hint = root.querySelector('.is-hint'), scroller = opts.scroller || null;
  var target = 0, cur = 0, running = false, raf = 0, ended = false, last = 0, looping = false;
  function read() {
    var m = scroller ? scroller.scrollHeight - scroller.clientHeight : document.documentElement.scrollHeight - innerHeight;
    target = m > 0 ? Math.min(1, Math.max(0, (scroller ? scroller.scrollTop : scrollY) / m)) : 0;
  }
  (scroller || window).addEventListener('scroll', read, { passive: true });
  function frame(now) {
    if (!running) return;
    var dt = Math.min(.05, (now - last) / 1000); last = now;
    cur += (target - cur) * Math.min(1, dt * CFG.glide);
    if (cur < .002 && target < .002) {                      // 스크롤 전: 처음 부분을 반복 재생
      if (!looping) { looping = true; v.currentTime = 0; v.play().catch(function () {}); }
      if (v.currentTime >= CFG.hold - .05) v.currentTime = 0;
    } else {
      if (looping) { looping = false; v.pause(); }
      var tt = CFG.hold + (CFG.end - CFG.hold) * cur;
      if (!v.seeking && Math.abs(v.currentTime - tt) > .02) v.currentTime = tt;
    }
    hint.style.opacity = 1 - Math.min(1, cur / .04);
    if (cur >= .985 && !ended) { ended = true; if (opts.onEnd) opts.onEnd(); }
    raf = requestAnimationFrame(frame);
  }
  return {
    start: function () { if (running) return; running = true; read(); last = performance.now(); raf = requestAnimationFrame(frame); },
    stop: function () { running = false; looping = false; cancelAnimationFrame(raf); v.pause(); },
    reset: function () { cur = target = 0; ended = false; looping = false; }
  };
}
