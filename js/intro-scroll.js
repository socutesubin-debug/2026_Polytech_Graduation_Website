/* 스크롤 인트로: 하늘의 나비 → (컷) 포스터 벽, 나비가 한 바퀴 돌며 들어오고 카메라가 따라감 → 나비가 포스터 속으로, 표면이 물처럼 일렁임 → 하얗게
   createIntroScroll(root, { scroller, onEnd, p, rec }) -> { cfg, start(), stop(), reset(), tick(p) }
     root     = 무대가 될 빈 요소 (화면을 꽉 채우는 크기)
     scroller = 스크롤되는 요소 (없으면 페이지 전체 스크롤)
     onEnd    = 끝(하얀 화면)에 닿았을 때 한 번 불림
   필요한 파일: js/butterfly-gl.js, css/intro-scroll.css, assets/images/intro/s1-sky.jpg · s2-poster-wall.jpg
   숫자를 고치고 싶으면 아래 CFG만 고치면 됩니다 */
function createIntroScroll(root, opts) {
  opts = opts || {};
  root.classList.add('is-stage'); root.innerHTML = '<div class="is-s1 layer"></div><div class="is-s2 layer"><div class="is-cam"><div class="is-wall"><div class="tile l"></div><div class="tile r"></div><div class="tile t"></div><div class="tile b"></div><div class="img"></div><div class="is-poster"><canvas class="is-water"></canvas><div class="is-rfx"><i class="rip"></i><i class="rip"></i><i class="rip"></i></div></div><div class="is-pfx"><i class="pglow"></i></div></div></div></div><div class="is-fx layer"></div><canvas class="is-gl"></canvas><div class="is-flash"><i></i></div><div class="is-white layer"></div><div class="is-hint">SCROLL<i></i></div>';
  var $ = function (id) { return root.querySelector('.is-' + id); };
  var s1 = $('s1'), s2 = $('s2'), wall = $('wall'), glc = $('gl'), flash = $('flash'),
      pglow = root.querySelector('.is-pfx .pglow'), rips = root.querySelectorAll('.is-rfx .rip'), poster = $('poster'), pfx = $('pfx'), rfx = $('rfx'),
      white = $('white'), hint = $('hint'), fx = $('fx');
  // knobs
  var CFG = {
    size: .105,        // butterfly size (share of the shorter screen side)
    dense: 1,          // 0 = see-through glass wings, 1 = nearly solid
    dust: .08,         // how much gold dust (1 = a lot)
    zoom: 3.4,         // how far the camera pushes into the poster after the butterfly
    chaseZoom: .65,    // how much closer the camera is while it chases the butterfly into scene 2
    chaseTilt: 5,      // how much the camera banks during the chase (degrees)
    wave: 1            // how strongly the poster's surface ripples like water when the butterfly goes in (0 = off)
  };
  var GL = window.createButterflyGL ? createButterflyGL(glc, { sky: true, dense: CFG.dense }) : null, glB = GL && GL.butterflies[0], lastX = null;
  var W = root.clientWidth || innerWidth, H = root.clientHeight || innerHeight;

  function clamp(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function seg(p, a, b) { return clamp((p - a) / (b - a)); }
  function ease(u) { return u * u * (3 - 2 * u); }
  function lerp(a, b, u) { return a + (b - a) * u; }
  function clamp2(v, a, b) { return v < a ? a : v > b ? b : v; }
  function hex(a, b, u) { return 'rgb(' + [0, 1, 2].map(function (i) { return Math.round(lerp(a[i], b[i], u)); }).join(',') + ')'; }

  // where the poster sits inside the photo (px in the 1672 x 941 image), so its own layer and the effects line up at any screen shape
  var IMG = { w: 1672, h: 941, x0: 606, x1: 1066, y0: 148, y1: 794 };
  function layout() {
    W = root.clientWidth || innerWidth; H = root.clientHeight || innerHeight;
    root.style.setProperty('--iw', W / 100 + 'px'); root.style.setProperty('--ih', H / 100 + 'px');
    var k = Math.max(W / IMG.w, H / IMG.h), ox = (W - IMG.w * k) / 2, oy = (H - IMG.h * k) / 2;       // same maths as background: center / cover
    var px = ox + IMG.x0 * k, py = oy + IMG.y0 * k, pw = (IMG.x1 - IMG.x0) * k, ph = (IMG.y1 - IMG.y0) * k;
    var L = 4 * W, T = H;                                                                              // the photo's corner inside #wall
    // the photo and its mirrored copies are laid out at the photo's own size (not the screen's), so they stay right on tall phone screens too
    var iw = IMG.w * k, ih = IMG.h * k, pics = root.querySelectorAll('.is-wall .img, .is-wall .tile');
    for (var i = 0; i < pics.length; i++) {
      var e = pics[i], c = e.classList, st = e.style;
      st.width = iw + 'px'; st.height = ih + 'px'; st.backgroundSize = '100% 100%';
      st.left = L + ox + (c.contains('l') ? -iw : c.contains('r') ? iw : 0) + 'px'; st.top = T + oy + (c.contains('t') ? -ih : c.contains('b') ? ih : 0) + 'px';
    }
    poster.style.left = L + px + 'px'; poster.style.top = T + py + 'px'; poster.style.width = pw + 'px'; poster.style.height = ph + 'px';
    poster.style.backgroundSize = IMG.w * k + 'px ' + IMG.h * k + 'px'; poster.style.backgroundPosition = (ox - px) + 'px ' + (oy - py) + 'px';
    ZB = Math.min(1, .8 * W / pw);                                                                      // tall (phone) screens: step back so the whole poster fits
    CX = px + pw / 2; CY = py + ph * .47;                                                              // the poster's butterfly
    pfx.style.left = L + CX + 'px'; pfx.style.top = T + CY + 'px'; rfx.style.left = pw / 2 + 'px'; rfx.style.top = ph * .47 + 'px';
    wall.style.transformOrigin = (L + CX) + 'px ' + (T + CY) + 'px';
  }
  var CX = 0, CY = 0, ZB = 1;

  // the poster's surface as water: a small WebGL layer on the poster that bends the picture with ripples from the point of entry.
  // (if the picture cannot be used as a texture, e.g. opened as a local file, the soft CSS ripples are used instead)
  var water = (function () {
    var cv = $('water'), g = CFG.wave > 0 && cv.getContext('webgl', { antialias: false, alpha: false });
    if (!g) return null;
    var vs = 'attribute vec2 a; varying vec2 v; void main(){ v = vec2(a.x*.5+.5, .5-a.y*.5); gl_Position = vec4(a, 0., 1.); }';
    var fs = [
      'precision highp float; varying vec2 v; uniform sampler2D uT; uniform vec4 uR; uniform vec2 uC; uniform float uAsp, uE, uNear, uTime, uAmp;',
      'float hgt(vec2 q){',
      '  float d = length(q), beh = uE*1.5 - d;',                                                   // beh = how far behind the wave front this point is
      '  float train = sin(beh*40.)*smoothstep(-.03, .06, beh)*exp(-beh*2.6)*(1. - .5*uE)*step(.0001, uE);',
      '  float amb = (sin(q.x*17. + uTime*1.9) + sin(q.y*13. - uTime*1.5 + q.x*5.) + sin((q.x + q.y)*23. + uTime*2.6))/3.;',
      '  return train + amb*(.07*uNear*exp(-d*3.) + .16*smoothstep(0., .45, uE)); }',
      'void main(){',
      '  vec2 q = (v - uC)*vec2(uAsp, 1.); float e = .004;',
      '  vec2 gr = vec2(hgt(q + vec2(e, 0.)) - hgt(q - vec2(e, 0.)), hgt(q + vec2(0., e)) - hgt(q - vec2(0., e)))/(2.*e);',
      '  float m = smoothstep(.035, .12, min(v.x, 1. - v.x))*smoothstep(.025, .085, min(v.y, 1. - v.y));',   // the frame itself stays rigid
      '  gr *= m; vec2 off = gr*vec2(1./uAsp, 1.)*.0011*uAmp;',
      '  vec3 c = vec3(texture2D(uT, uR.xy + (v + off)*uR.zw).r, texture2D(uT, uR.xy + (v + off*1.1)*uR.zw).g, texture2D(uT, uR.xy + (v + off*1.2)*uR.zw).b);',
      '  float lit = dot(gr, vec2(-.6, -.8))*.011*uAmp;',                                            // light from the upper left catches the wave slopes
      '  c += max(lit, 0.)*vec3(1., .97, .88); c *= 1. + max(min(lit, 0.), -1.)*.38;',
      '  c += pow(max(lit, 0.), 3.)*.6;',
      '  c = mix(c, vec3(1., .985, .94), smoothstep(.4, 1., uE)*.75);',
      '  gl_FragColor = vec4(c, 1.); }'].join('\n');
    var pr = g.createProgram();
    [[g.VERTEX_SHADER, vs], [g.FRAGMENT_SHADER, fs]].forEach(function (x) { var sh = g.createShader(x[0]); g.shaderSource(sh, x[1]); g.compileShader(sh); if (!g.getShaderParameter(sh, g.COMPILE_STATUS)) console.error(g.getShaderInfoLog(sh)); g.attachShader(pr, sh); });
    g.linkProgram(pr); g.useProgram(pr);
    g.bindBuffer(g.ARRAY_BUFFER, g.createBuffer()); g.bufferData(g.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), g.STATIC_DRAW);
    g.enableVertexAttribArray(0); g.bindAttribLocation(pr, 0, 'a'); g.vertexAttribPointer(0, 2, g.FLOAT, false, 0, 0); g.linkProgram(pr); g.useProgram(pr);
    var U = {}; ['uR', 'uC', 'uAsp', 'uE', 'uNear', 'uTime', 'uAmp'].forEach(function (n) { U[n] = g.getUniformLocation(pr, n); });
    var api = { ready: false, draw: function (e, near, time) {
      var dpr = Math.min(devicePixelRatio || 1, 2), w = Math.max(8, Math.round(cv.clientWidth * dpr)), h = Math.max(8, Math.round(cv.clientHeight * dpr));
      if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; }
      g.viewport(0, 0, w, h);
      g.uniform4f(U.uR, IMG.x0 / IMG.w, IMG.y0 / IMG.h, (IMG.x1 - IMG.x0) / IMG.w, (IMG.y1 - IMG.y0) / IMG.h);
      g.uniform2f(U.uC, .5, .47); g.uniform1f(U.uAsp, (IMG.x1 - IMG.x0) / (IMG.y1 - IMG.y0));
      g.uniform1f(U.uE, e); g.uniform1f(U.uNear, near); g.uniform1f(U.uTime, time); g.uniform1f(U.uAmp, CFG.wave);
      g.drawArrays(g.TRIANGLE_STRIP, 0, 4);
    } };
    var im = new Image();
    im.onload = function () {
      try {
        g.bindTexture(g.TEXTURE_2D, g.createTexture()); g.texImage2D(g.TEXTURE_2D, 0, g.RGB, g.RGB, g.UNSIGNED_BYTE, im);
        g.texParameteri(g.TEXTURE_2D, g.TEXTURE_MIN_FILTER, g.LINEAR); g.texParameteri(g.TEXTURE_2D, g.TEXTURE_WRAP_S, g.CLAMP_TO_EDGE); g.texParameteri(g.TEXTURE_2D, g.TEXTURE_WRAP_T, g.CLAMP_TO_EDGE);
        api.ready = true;
      } catch (err) { console.warn('water: picture not usable as a texture, using the simple ripples', err); }
    };
    im.src = 'assets/images/intro/s2-poster-wall.jpg';
    api.cv = cv; return api;
  })();
  addEventListener('resize', function () { layout(); if (GL) GL.resize(); }); layout();

  var target = 0, p = 0;
  var scroller = opts.scroller || null;        // the element that scrolls (none = the page itself)
  function readScroll() {
    var m = scroller ? scroller.scrollHeight - scroller.clientHeight : document.documentElement.scrollHeight - innerHeight;
    target = m > 0 ? clamp((scroller ? scroller.scrollTop : scrollY) / m) : 0;
  }
  (scroller || window).addEventListener('scroll', readScroll, { passive: true }); readScroll();
  var fixed = opts.p == null ? null : opts.p;                      // ?p=0.6 freezes the scene at one point (for checking)

  var last = performance.now(), lastRing = 0, t0 = last, RAD = Math.PI / 180;
  function spawnRing(x, y, sc) {
    var d = document.createElement('i'); d.className = 'ring';
    var w = 60 * sc, h = 82 * sc; d.style.width = w + 'px'; d.style.height = h + 'px'; d.style.left = x - w / 2 + 'px'; d.style.top = y - h / 2 + 'px';
    fx.appendChild(d);
    d.animate([{ transform: 'scale(.7) rotate(-4deg)', opacity: 0 }, { opacity: .6, offset: .25 }, { transform: 'scale(2.1) rotate(5deg)', opacity: 0 }], { duration: 1500, easing: 'ease-out' }).onfinish = function () { d.remove(); };
  }

  function frame(now) {
    var dt = Math.min(.05, Math.max(0, (now - last) / 1000)); last = now;
    var t = (now - t0) / 1000;
    if (fixed !== null) { p = +fixed; } else { p += (target - p) * Math.min(1, dt * 6); }
    var u = Math.min(W, H), sc = u / 900;

    // ---- timing (p = scroll progress 0..1) ----
    var kSide = ease(seg(p, .06, .15));        // S1: turn from the front view to a side view
    var kFly = ease(seg(p, .10, .265));         // S1: fly off to the right, seen from the side
    var kCut = seg(p, .265, .29);              // cut S1 -> S2 (quick)
    var kIn  = seg(p, .275, .62);               // S2: enter from the left, loop once, settle in front of the poster (camera follows)
    var kFace = ease(seg(p, .57, .64));        // turn to face the poster
    var kDive = seg(p, .69, .765); kDive = kDive * kDive;   // the butterfly darts into the poster
    var kThru = Math.pow(seg(p, .72, .97), 2.6); // camera drifts right with the dive, then speeds up through the wall once it is in
    var kWhite = ease(seg(p, .865, .955));

    s2.style.opacity = kCut;
    s1.style.visibility = kCut >= 1 ? 'hidden' : 'visible';

    // S2 flight path in wall space: a straight run from off-screen left to the waiting spot, with one full loop added on the way
    function pathAt(k) {
      var e = 1 - Math.pow(1 - k, 2.2), a = 2 * Math.PI * ease(seg(k, .28, .84)), R = .15 * u;   // fast at first: it is already in the picture when the scene opens
      return [lerp(-.13 * W, CX - .09 * W, e) + R * Math.sin(a), lerp(.36 * H, CY + .12 * H, e) - R * (1 - Math.cos(a))];
    }
    var bw = pathAt(kIn), bw2 = pathAt(Math.min(1, kIn + .01));
    // camera: always frontal, but alive. It starts close on the butterfly, chases it through the loop (pan, zoom and a little tilt), then eases back to the full view
    var follow = 1 - ease(seg(p, .44, .64)), zf = ZB * (1 + CFG.chaseZoom * follow);
    var camX = clamp2((bw[0] - CX) * .85 * follow, -.3 * W, .3 * W), camY = clamp2((bw[1] - CY) * .8 * follow, -.13 * H, .13 * H);
    var camR = CFG.chaseTilt * follow * Math.sin(2 * Math.PI * ease(seg(kIn, .2, .9)) + .6);     // degrees: the camera banks with the loop
    var zoom = zf * (1 + (CFG.zoom - 1) * kThru);                    // later: push in towards the poster's butterfly
    var cr = Math.cos(camR * RAD), sr = Math.sin(camR * RAD);
    var wallX = -(camX * cr - camY * sr) * zf, wallY = -(camX * sr + camY * cr) * zf, theta = 0;
    wall.style.transform = 'translate(' + wallX + 'px,' + wallY + 'px) rotate(' + camR + 'deg) scale(' + zoom + ')';
    function toScreen(q) { var dx = (q[0] - CX) * zf, dy = (q[1] - CY) * zf; return [CX + dx * cr - dy * sr + wallX, CY + dx * sr + dy * cr + wallY]; }

    // the moment of entering: the poster glows from inside as the butterfly comes close, then ripples spread on its surface
    var near = ease(seg(p, .66, .765)), after = seg(p, .765, .90);
    pglow.style.opacity = near * (1 - .8 * ease(seg(after, 0, .45)));
    pglow.style.transform = 'scale(' + (.5 + .7 * near + 1.6 * after) + ')';
    // water: the surface stirs a little as the butterfly comes near, then rings run out from where it goes in
    var wOn = water && water.ready, wE = seg(p, .762, .95);
    if (wOn) { var show = near > 0 && p < .97; water.cv.style.opacity = show ? 1 : 0; if (show) water.draw(wE, near, t); }
    for (var r = 0; r < rips.length; r++) {
      if (wOn) { rips[r].style.opacity = 0; continue; }
      var e = seg(p, .764 + r * .03, .875 + r * .03);
      rips[r].style.opacity = e > 0 && e < 1 ? Math.sin(Math.PI * Math.pow(e, .6)) * .9 : 0;     // swells in, then dies away
      rips[r].style.transform = 'scale(' + (.15 + 2.9 * (1 - Math.pow(1 - e, 2))) + ')';
    }
    poster.style.transform = 'translateZ(26px) scale(' + (1 + .012 * Math.sin(Math.PI * seg(p, .76, .82))) + ')';   // the poster gives a tiny pulse as it takes the butterfly in

    // ---- butterfly path ----
    var bob = Math.sin(t * 2.1) * 9 * sc + Math.sin(t * 3.7) * 4 * sc, sway = Math.sin(t * 1.3) * 12 * sc;
    var x, y, pitch, roll, yaw, scale = 1;
    var th = 0;
    if (p < .27) {                       // scene 1
      x = lerp(.5 * W, 1.18 * W, kFly) + sway * (1 - kFly);
      y = .44 * H - Math.sin(kFly * Math.PI) * .07 * H + bob;
      pitch = lerp(-36, -74, kSide); roll = lerp(6 * Math.sin(t * .9), -90, kSide);   // roll -90 = head to the right
      yaw = lerp(10 * Math.sin(t * .5), 0, kSide);
    } else {                             // scene 2
      var posterX = CX, sp = toScreen(bw), sp2 = toScreen(bw2);
      // after the loop it waits in front of the poster (nearer to us = lower left and bigger), then flies away from us into it
      x = lerp(sp[0], CX, kDive) + sway * .5 * (1 - kDive) * ease(seg(kIn, .9, 1));
      y = lerp(sp[1], CY, kDive) + bob * (1 - kDive);
      var head = kIn < 1 ? Math.atan2(sp2[1] - sp[1], sp2[0] - sp[0]) / RAD : 0;      // direction of travel on screen (0 = right, -90 = up)
      pitch = lerp(-70, -62, kFace); roll = lerp(-(90 + head), lerp(-16, 0, kDive), kFace) ;   // nose follows the path, then points at the poster
      yaw = 0;
      scale = lerp(1, 1.35, ease(kIn)) * (1 - .84 * kDive);
      // burst of light exactly where it goes in
      var fl = seg(p, .75, .772) * (1 - seg(p, .772, .83)) * .75;
      flash.style.opacity = fl;
      flash.style.transform = 'translate(' + posterX + 'px,' + CY + 'px) scale(' + (.5 + 1.6 * seg(p, .745, .86)) + ')';
    }
    if (p < .27) flash.style.opacity = 0;
    var hidden = (p > .262 && p < .278) || p > .80;
    var alpha = hidden ? 0 : 1 - seg(p, .757, .775);
    if (GL) {
      var wpos = GL.toWorld(x, y), k = GL.unitsPerPx();
      if (lastX !== null && Math.abs(x - lastX) > .5 * W) GL.clearDust();   // scene cut: drop the old dust
      lastX = x;
      glB.pose = { x: wpos[0], y: wpos[1], z: 0, scale: CFG.size * u * scale * k, yaw: yaw * RAD, pitch: pitch * RAD, roll: roll * RAD };
      glB.hzMul = 1 + .9 * Math.max(Math.sin(kFly * Math.PI), kIn > 0 && kIn < 1 ? .8 : 0, 1.4 * kDive);
      glB.dust = alpha > .5 ? CFG.dust * (1 + 9 * kDive) : 0;      // it sheds a trail of dust as it darts in
      GL.wind[0] = p > .3 ? 1.1 * seg(p, .70, .76) * (1 - seg(p, .765, .78)) * Math.sin(th) : 0;   // the dust is drawn into the poster after it
      GL.wind[2] = p > .3 ? -1.1 * seg(p, .70, .76) * (1 - seg(p, .765, .78)) * Math.cos(th) : 0;
      glc.style.opacity = alpha;
      GL.simulate(dt); GL.draw();
    }
    // a thin frame outline ripples out now and then while it hovers
    if (alpha > .5 && p < .08 && now - lastRing > 2600) { spawnRing(x, y, sc); lastRing = now; }

    white.style.opacity = kWhite;
    if (p >= .975 && !ended && fixed === null) { ended = true; if (opts.onEnd) opts.onEnd(); }
    hint.style.opacity = 1 - seg(p, .01, .06);
    if (!manual && running) raf = requestAnimationFrame(frame);
  }
  var manual = !!opts.rec, clock = performance.now(), running = false, raf = 0, ended = false;
  return {
    cfg: CFG,
    start: function () { if (manual || running) return; running = true; layout(); if (GL) GL.resize(); readScroll(); last = performance.now(); raf = requestAnimationFrame(frame); },
    stop: function () { running = false; cancelAnimationFrame(raf); },
    reset: function () { p = target = 0; ended = false; lastX = null; if (GL) GL.clearDust(); },   // back to the first frame
    tick: function (v) { fixed = v; clock += 1000 / 30; frame(clock); }                             // recording: one step of 1/30 s at progress v
  };
}
