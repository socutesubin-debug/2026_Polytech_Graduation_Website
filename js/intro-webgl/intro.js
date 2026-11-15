/* WebGL 인트로 — 본체. 스크롤 진행률(0~1)로 카메라·나비·흡수 효과를 정하고, 날갯짓·물결은 시간으로 따로 움직여요.
   createWebGLIntro(root, opts) -> Promise<controller>
     root  : 인트로가 들어갈 요소 (안에 .iw-track > .iw-stage > canvas 구조를 만들어 줌)
     opts.onEnter() : '전시 입장'을 누르면 불림 (실제 사이트에서는 About/로비로 이동하는 함수를 넘기면 됨)
     opts.onSkip()  : '인트로 건너뛰기'를 누르면 불림 (없으면 onEnter)
     opts.freezeP   : 숫자를 주면 그 진행률에서 멈춤 (확인용, 주소 끝 ?p=0.6)
   controller: { progress(), setProgress(p, immediate), info(), dispose() }
   필요한 파일: js/intro-webgl/config.js, world.js, butterfly.js, css/intro-webgl.css, 포스터 이미지 */
window.createWebGLIntro = function (root, opts) {
  opts = opts || {};
  var CFG = window.IW_CONFIG;
  var onEnter = opts.onEnter || function () {};
  var onSkip = opts.onSkip || onEnter;

  /* ── HTML 뼈대 (안내 글자·버튼은 모두 HTML) ── */
  root.classList.add('iw-root');
  root.innerHTML =
    '<div class="iw-track"><div class="iw-stage">' +
      '<canvas class="iw-canvas" aria-hidden="true"></canvas>' +
      '<canvas class="iw-bfly" aria-hidden="true"></canvas>' +
      '<div class="iw-light" aria-hidden="true"></div>' +
      '<p class="iw-hint" aria-hidden="true"><span>스크롤하여 나비를 따라가 보세요</span><i></i></p>' +
      '<section class="iw-enter" aria-label="전시 입장" hidden>' +
        '<p class="iw-enter-kicker">BEYOND THE FRAME</p>' +
        '<p class="iw-enter-line">프레임 너머, 우리를 만나다</p>' +
        '<button type="button" class="iw-btn iw-enter-btn">전시 입장하기</button>' +
        '<button type="button" class="iw-link iw-replay">인트로 다시 보기</button>' +
      '</section>' +
    '</div></div>' +
    '<button type="button" class="iw-skip">인트로 건너뛰기</button>' +
    '<div class="iw-fallback" hidden>' +
      '<img class="iw-fallback-img" data-src="assets/images/intro/s2-poster-wall.jpg" alt="미술관 외벽에 걸린 졸업전시 포스터 BEYOND THE FRAME">' +
      '<div class="iw-fallback-box"><p class="iw-fallback-msg">이 기기에서는 3D 인트로를 보여 줄 수 없어요.</p>' +
      '<button type="button" class="iw-btn iw-fallback-enter">전시 입장하기</button>' +
      '<button type="button" class="iw-link iw-retry">다시 시도</button></div>' +
    '</div>' +
    (opts.debug ? '<pre class="iw-debug" aria-hidden="true"></pre>' : '');
  var $ = function (s) { return root.querySelector(s); };
  var track = $('.iw-track'), stage = $('.iw-stage'), canvas = $('.iw-canvas'), lightEl = $('.iw-light'), hint = $('.iw-hint'),
      enterEl = $('.iw-enter'), skipBtn = $('.iw-skip'), fallback = $('.iw-fallback'), dbg = $('.iw-debug');
  track.style.height = (CFG.scrollLength + 100) + 'vh';

  var listeners = [];
  function on(el, ev, fn, o) { el.addEventListener(ev, fn, o); listeners.push([el, ev, fn, o]); }
  on($('.iw-enter-btn'), 'click', function () { onEnter(); });
  on($('.iw-fallback-enter'), 'click', function () { onEnter(); });
  on($('.iw-retry'), 'click', function () { location.reload(); });
  on(skipBtn, 'click', function () { onSkip(); });
  on($('.iw-replay'), 'click', function () { window.scrollTo({ top: track.offsetTop, behavior: 'auto' }); });

  function showFallback(msg) {
    var fi = $('.iw-fallback-img'); if (fi && !fi.src) fi.src = fi.getAttribute('data-src'); // 실패했을 때만 그림을 받음
    if (msg) $('.iw-fallback-msg').textContent = msg;
    fallback.hidden = false; root.classList.add('iw-failed');
    track.style.height = '100vh';
  }

  var mql = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
  var Q = {
    reduced: !!mql.matches || opts.reduced === true,
    mobile: (window.matchMedia && matchMedia('(pointer: coarse)').matches) || Math.min(screen.width, screen.height) < 700
  };
  if (Q.reduced) root.classList.add('iw-reduced');

  // WebGL을 쓸 수 있는지 먼저 확인
  try {
    var test = document.createElement('canvas');
    if (!(test.getContext('webgl2') || test.getContext('webgl'))) { showFallback(); return Promise.reject(new Error('no webgl')); }
  } catch (e) { showFallback(); return Promise.reject(e); }

  return Promise.all([
    import('three'),
    loadPoster(CFG.poster.image)
  ]).then(function (mods) {
    return build(mods[0], mods[1]);
  }).catch(function (err) {
    console.error('[intro-webgl]', err);
    showFallback('3D 인트로를 불러오지 못했어요. 인터넷 연결을 확인하고 다시 시도해 주세요.');
    throw err;
  });

  function loadPoster(src) {
    return new Promise(function (res, rej) {
      var img = new Image();
      img.decoding = 'async';
      img.onload = function () { res(img); };
      img.onerror = function () { rej(new Error('poster load failed: ' + src)); };
      // 더블클릭(file://)으로 열면 브라우저가 그림을 3D에 쓰지 못하게 막아서, 글자로 담은 사본을 씀
      if (location.protocol === 'file:' && window.IW_POSTER_DATA) img.src = window.IW_POSTER_DATA;
      else img.src = src;
    });
  }

  function build(THREE, posterImg) {
    THREE.ColorManagement.enabled = false;
    var renderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: !Q.mobile, alpha: false, powerPreference: 'high-performance' });
    } catch (e) { showFallback(); throw e; }
    renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
    renderer.setClearColor(0xeef1f2, 1);

    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(CFG.fov.wide, 1, 0.05, 500);
    var world = IWWorld(THREE, CFG, Q);
    scene.add(world.group);
    world.setPosterImage(posterImg);
    var bf = IWButterfly(THREE, CFG, Q);
    scene.add(bf.group, bf.absorbPts);
    /* 전에 함께 만든 WebGL 나비(js/butterfly-gl.js)를 그대로 씀: 3D 공간에서 계산한 위치·방향을 그 나비에게 넘겨서 위에 겹쳐 그려요.
       쓸 수 없는 기기(WebGL2 없음)에서는 가벼운 3D 나비로 대신해요 */
    var bflyCanvas = $('.iw-bfly'), classic = null, cb = null;
    if (CFG.butterfly.style === 'classic' && window.createButterflyGL) {
      try { classic = createButterflyGL(bflyCanvas, { sky: true, dense: 1, flapHz: CFG.butterfly.flapHz }); } catch (e) { classic = null; }
    }
    if (classic) { cb = classic.butterflies[0]; bf.hideModel(); }
    else { bflyCanvas.style.display = 'none'; if (bf.trailPts) scene.add(bf.trailPts); }
    var cM = new THREE.Matrix4(), cQ = new THREE.Quaternion(), cE = new THREE.Euler(), cV = new THREE.Vector3();
    var cFix = new THREE.Matrix4().set(-1, 0, 0, 0,  0, 0, 1, 0,  0, 1, 0, 0,  0, 0, 0, 1);   // 옛 나비 축(머리 = y, 날개 올림 = z) → 3D 공간 축(머리 = z, 위 = y)
    function driveClassic(dt, ab, aT, hzMul) {
      cV.copy(bPos).project(camera);
      var px = (cV.x * 0.5 + 0.5) * W, py = (-cV.y * 0.5 + 0.5) * H;
      var depth = Math.max(0.2, cV.copy(bPos).applyMatrix4(camera.matrixWorldInverse).z * -1);
      var pxPerM = H / (2 * Math.tan(camera.fov * Math.PI / 360) * depth);
      var w = classic.toWorld(px, py);
      cQ.copy(camera.quaternion).invert().multiply(bf.group.quaternion);
      cM.makeRotationFromQuaternion(cQ).multiply(cFix); cE.setFromRotationMatrix(cM, 'YXZ');
      cb.pose = { x: w[0], y: w[1], z: 0, yaw: cE.y, pitch: cE.x, roll: cE.z,
        scale: CFG.butterfly.span / 2 * bf.group.scale.x * pxPerM * classic.unitsPerPx() * (1 - 0.35 * smooth(aT / 0.6)) };
      cb.hzMul = hzMul; cb.dust = Q.reduced || aT > 0.3 ? 0 : CFG.butterfly.dust;
      bflyCanvas.style.opacity = String(1 - smooth((aT - 0.05) / 0.5));   // 흡수: 나비는 옅어지고 하프톤 점이 포스터로 모임
      classic.simulate(dt); classic.draw();
    }

    var T = new THREE.Vector3().fromArray(world.posterUVToWorld(CFG.poster.target[0], CFG.poster.target[1]));
    var Tarr = [T.x, T.y, T.z];

    /* ── 화면 크기에 맞춘 경로 ── */
    var camKeys, pathKeys, D = 5, W = 1, H = 1, aspect = 1, pr = 1;
    function layout() {
      W = stage.clientWidth || innerWidth; H = stage.clientHeight || innerHeight; aspect = W / H;
      pr = Math.min(window.devicePixelRatio || 1, Q.mobile ? CFG.pixelRatio.mobile : CFG.pixelRatio.desktop);
      renderer.setPixelRatio(pr); renderer.setSize(W, H, false);
      var tall = aspect < 0.85;
      camera.fov = tall ? CFG.fov.tall : CFG.fov.wide; camera.aspect = aspect; camera.updateProjectionMatrix();
      var tv = Math.tan(camera.fov * Math.PI / 360), th = tv * aspect;
      var ps = world.posterSize;
      D = Math.max(ps[1] * CFG.holdMargin.h / 2 / tv, ps[0] * CFG.holdMargin.w / 2 / th);
      var hs = tall ? CFG.butterfly.holdTall : CFG.butterfly.holdWide.slice();
      if (!tall) { // 넓은 화면: 머무르는 자리가 화면 안에 들어오게 (포스터 왼쪽 빈 벽)
        var visHalf = (D - hs[2]) * th;
        hs[0] = -Math.min(-hs[0], Math.max(ps[0] / 2 + 0.22, visHalf * 0.72));
      }
      camKeys = CFG.cameraKeys.call(CFG, D, Tarr);
      pathKeys = CFG.pathKeys(hs, Tarr);
      if (classic) classic.resize();
      bf.setPointScale(H * pr / (2 * tv));
      needsRender = true;
    }

    /* ── 진행률 0~1 → 이야기 ── */
    function clamp01(x) { return x < 0 ? 0 : x > 1 ? 1 : x; }
    function smooth(x) { x = clamp01(x); return x * x * (3 - 2 * x); }
    function seg(p, a, b) { return clamp01((p - a) / (b - a)); }
    // 키 사이를 부드럽게 잇는 곡선 (Catmull-Rom / Hermite). stop 키에서는 잠깐 멈추듯 속도가 0
    function interp(keys, p, get, out) {
      var n = keys.length, i = 0;
      if (p <= keys[0].p) { var v0 = get(keys[0]); for (var c = 0; c < v0.length; c++) out[c] = v0[c]; return out; }
      if (p >= keys[n - 1].p) { var v1 = get(keys[n - 1]); for (c = 0; c < v1.length; c++) out[c] = v1[c]; return out; }
      while (i < n - 2 && p > keys[i + 1].p) i++;
      var k0 = keys[Math.max(0, i - 1)], k1 = keys[i], k2 = keys[i + 1], k3 = keys[Math.min(n - 1, i + 2)];
      var t1 = k1.p, t2 = k2.p, dt = t2 - t1, s = (p - t1) / dt;
      var P0 = get(k0), P1 = get(k1), P2 = get(k2), P3 = get(k3);
      var s2 = s * s, s3 = s2 * s, h00 = 2 * s3 - 3 * s2 + 1, h10 = s3 - 2 * s2 + s, h01 = -2 * s3 + 3 * s2, h11 = s3 - s2;
      for (c = 0; c < P1.length; c++) {
        var m1 = (k1.stop || i === 0) ? 0 : (P2[c] - P0[c]) / (t2 - k0.p);
        var m2 = (k2.stop || i + 1 === n - 1) ? 0 : (P3[c] - P1[c]) / (k3.p - t1);
        out[c] = h00 * P1[c] + h10 * dt * m1 + h01 * P2[c] + h11 * dt * m2;
      }
      return out;
    }
    function linear(keys, p, name) {
      if (p <= keys[0].p) return keys[0][name];
      for (var i = 0; i < keys.length - 1; i++) {
        if (p <= keys[i + 1].p) return keys[i][name] + (keys[i + 1][name] - keys[i][name]) * smooth((p - keys[i].p) / (keys[i + 1].p - keys[i].p));
      }
      return keys[keys.length - 1][name];
    }
    var gPos = function (k) { return k.pos; }, gLook = function (k) { return k.look; };
    var gYaw = function (k) { return [k.yaw]; }, gPitch = function (k) { return [k.pitch || 0]; }, gHover = function (k) { return [k.hover || 0]; };
    var a3 = [0, 0, 0], b3 = [0, 0, 0], c1 = [0], d1 = [0];

    var camPos = new THREE.Vector3(), camLook = new THREE.Vector3(), bPos = new THREE.Vector3(), prevB = new THREE.Vector3(), dirK = new THREE.Vector3(), dirB = new THREE.Vector3();
    var mouse = { x: 0, y: 0, sx: 0, sy: 0 };
    var ST = CFG.story;
    var state = { p: 0, target: 0, appear: Q.reduced || !CFG.autoAppear ? 1 : 0, t: 0, ripDist: 0, ripT: 0, ripStart: -1, entered: false, fps: 0, frames: 0, jumps: 0 };

    function storyFromScroll(sp) {
      var A = CFG.autoAppear ? CFG.autoAppear.to * smooth(state.appear) : 0;
      return A + sp * (1 - A);
    }

    function butterflyAt(p, t, out) {
      interp(pathKeys, p, gPos, a3);
      var hov = interp(pathKeys, p, gHover, c1)[0];
      var bob = CFG.butterfly.bob * hov * (Q.reduced ? 0.4 : 1) * (CFG.butterfly.span / 0.32);
      out.set(a3[0] + Math.sin(t * 1.05) * 0.05 * bob + Math.sin(t * 0.37) * 0.03 * bob,
              a3[1] + Math.sin(t * 1.7 + 1) * 0.045 * bob,
              a3[2] + Math.sin(t * 0.8 + 2) * 0.035 * bob);
      return hov;
    }

    /* ── 한 장면 그리기 (p = 진행률, dt = 지난 프레임부터 흐른 초) ── */
    function apply(p, dt) {
      var t = state.t;
      var ab = seg(p, ST.absorb[0], ST.absorb[1]);           // 흡수 구간 안의 진행률
      var con = seg(p, ST.connect[0], ST.connect[1]);
      var hold = seg(p, ST.hold[0] - 0.03, ST.hold[0]) * (1 - seg(p, ST.hold[1], ST.hold[1] + 0.02));

      /* 나비 */
      var hov = butterflyAt(p, t, bPos);
      var yaw = interp(pathKeys, p, gYaw, c1)[0] + (Q.reduced ? 0 : Math.sin(t * 0.5) * 0.22 * hov);
      var yawA = interp(pathKeys, Math.min(1, p + 0.015), gYaw, d1)[0], yawB = interp(pathKeys, Math.max(0, p - 0.005), gYaw, [0])[0];
      var bank = Math.max(-0.55, Math.min(0.55, -(yawA - yawB) * 9 * CFG.butterfly.bank)) + Math.sin(t * 0.9) * 0.06 * hov;
      var pitch = interp(pathKeys, p, gPitch, c1)[0] + Math.sin(t * 1.7 + 1) * 0.06 * hov;
      bf.setPose(bPos, yaw, pitch, bank * (1 - ab));
      bf.group.scale.setScalar(1 + CFG.butterfly.absorbGrow * smooth(ab / 0.6));
      var fold = smooth(ab / 0.5);
      bf.flap(dt, fold, (Q.reduced ? 0.65 : 1) * (1 - 0.35 * fold));
      var aT = clamp01((ab - 0.3) / 0.7);
      bf.setAbsorb(aT, T);
      bf.setTime(t);

      // 큰 스크롤 점프 → 잔상 정리 (화면을 가로지르는 긴 선 방지)
      var moved = bPos.distanceTo(prevB), jumped = moved > CFG.trail.jump;
      if (jumped) { bf.clearTrail(); if (classic) classic.clearDust(); world.clearRipples(); state.jumps++; state.ripDist = 0; }
      if (!classic) bf.trailUpdate(t, dt, dt > 0 ? moved / dt : 0, ab < 0.25 && !Q.reduced);
      // 나비가 지나가는 길을 따라 물결 (움직인 거리마다 하나, 떠 있을 때는 가끔)
      if (!jumped && !Q.reduced && CFG.ripple.strength > 0 && aT < 0.5 && dt > 0) {
        state.ripDist += moved;
        if (state.ripDist > CFG.ripple.spacing || t - state.ripT > CFG.ripple.hoverEvery) { world.addRipple(bPos.x, bPos.y, bPos.z); state.ripDist = 0; state.ripT = t; }
      }
      prevB.copy(bPos);

      /* 카메라 */
      interp(camKeys, p, gPos, a3); interp(camKeys, p, gLook, b3);
      camPos.fromArray(a3); camLook.fromArray(b3);
      var f = linear(CFG.follow, p, 'f');
      if (aT > 0) f *= 1 - smooth(aT * 2);
      dirK.subVectors(camLook, camPos).normalize();
      dirB.subVectors(bPos, camPos).normalize();
      dirK.lerp(dirB, f).normalize();
      // 마우스 시점 변화: 아주 작게, 포스터를 읽는 구간과 흡수 뒤에는 더 작게
      var par = Q.reduced ? 0 : CFG.parallax * (1 - 0.6 * hold) * (1 - con);
      mouse.sx += (mouse.x - mouse.sx) * Math.min(1, dt * 3); mouse.sy += (mouse.y - mouse.sy) * Math.min(1, dt * 3);
      camPos.x += mouse.sx * par; camPos.y += -mouse.sy * par * 0.6;
      // 벽·바닥을 뚫지 않게
      camPos.z = Math.max(camPos.z, CFG.poster.z + 0.3); camPos.y = Math.max(camPos.y, 0.3);
      camera.position.copy(camPos);
      camLook.copy(camPos).add(dirK);
      camera.lookAt(camLook);

      /* 포스터 효과 */
      var PU = world.posterU;
      PU.uGlow.value = smooth((ab - 0.1) / 0.5) * (1 - 0.45 * smooth((ab - 0.8) / 0.2)) + con * 0.4;
      PU.uGlow.value = Math.max(PU.uGlow.value, ab >= 1 ? CFG.poster.glow : 0);
      PU.uPatAmt.value = smooth((ab - 0.65) / 0.35) * (1 - con * 0.5);
      PU.uLight.value = smooth((con - 0.15) / 0.85);
      // 들어가는 순간 한 번만 퍼지는 파동: 앞으로 지나갈 때 시작, 뒤로 돌아가면 취소
      if (ab >= 0.86 && state.ripStart < 0) state.ripStart = t;
      if (ab < 0.8) state.ripStart = -1;
      var age = state.ripStart < 0 ? -1 : t - state.ripStart;
      PU.uRipAge.value = age >= 0 && age < 2.2 && !Q.reduced ? age : -1;
      world.shared.uBfly.value.set(bPos.x, bPos.y, bPos.z, 1 - smooth((aT - 0.4) / 0.4));

      /* HTML: 안내 글자, 빛, 입장 화면 */
      hint.style.opacity = String(1 - seg(p, CFG.autoAppear ? CFG.autoAppear.to * 1.05 : 0.01, (CFG.autoAppear ? CFG.autoAppear.to : 0) + 0.05));
      lightEl.style.opacity = String(smooth((con - 0.45) / 0.5));
      var ent = p >= CFG.enterAt;
      if (ent !== state.entered) {
        state.entered = ent; enterEl.hidden = !ent; root.classList.toggle('iw-at-end', ent);
      }

      world.update(t, camPos);
      if (classic) { camera.updateMatrixWorld(); driveClassic(dt, ab, aT, (Q.reduced ? 0.65 : 1) * (1 + 0.5 * (1 - hov)) * (1 - 0.3 * fold)); }
    }

    /* ── 스크롤 ── */
    var st = null;
    function readScroll() {
      var r = track.getBoundingClientRect(), len = r.height - (stage.clientHeight || innerHeight);
      return len > 0 ? clamp01(-r.top / len) : 0;
    }
    var scrollP = 0;
    if (window.ScrollTrigger && window.gsap) {
      gsap.registerPlugin(ScrollTrigger);
      st = ScrollTrigger.create({ trigger: track, start: 'top top', end: 'bottom bottom', onUpdate: function (s) { scrollP = s.progress; } });
      scrollP = st.progress;
    } else {
      on(window, 'scroll', function () { scrollP = readScroll(); }, { passive: true });
      scrollP = readScroll();
    }

    /* ── 마우스·터치: 시점 변화 + 벽 위에서만 작은 물결 ── */
    var ray = new THREE.Raycaster(), ndc = new THREE.Vector2(), lastRipT = 0, lastRipP = new THREE.Vector3(1e3, 0, 0);
    function pointer(e) {
      var r = canvas.getBoundingClientRect();
      ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
      if (e.pointerType === 'mouse') { mouse.x = ndc.x; mouse.y = -ndc.y; }
      if (CFG.ripple.pointer <= 0 || CFG.ripple.strength <= 0 || Q.reduced) return;
      var now = state.t;
      if (now - lastRipT < 0.25) return;
      ray.setFromCamera(ndc, camera);
      var hit = ray.intersectObject(world.wall, false)[0];
      if (!hit || hit.point.z < -0.01) return;               // 벽 앞면 위가 아니면 물결 없음
      if (hit.point.distanceTo(lastRipP) < 0.5 && e.type === 'pointermove') return;
      lastRipT = now; lastRipP.copy(hit.point);
      world.addRipple(hit.point.x, hit.point.y, (1 - CFG.ripple.pointer) * 3.5);   // z를 키우면 약해짐
    }
    // passive: 터치로 페이지를 스크롤하는 것을 절대 막지 않음
    on(stage, 'pointermove', pointer, { passive: true });
    on(stage, 'pointerdown', pointer, { passive: true });
    on(stage, 'pointerleave', function () { mouse.x = 0; mouse.y = 0; }, { passive: true });

    /* ── 화면 크기·회전 ── */
    var ro = window.ResizeObserver ? new ResizeObserver(function () { layout(); }) : null;
    if (ro) ro.observe(stage); else on(window, 'resize', layout);
    on(window, 'orientationchange', function () { setTimeout(layout, 250); });
    var onMotion = function () { Q.reduced = mql.matches; root.classList.toggle('iw-reduced', Q.reduced); };
    if (mql.addEventListener) mql.addEventListener('change', onMotion);

    /* ── 그리기 반복: 탭이 숨겨지면 멈춤 ── */
    var raf = 0, last = 0, needsRender = true, fpsAcc = 0, fpsN = 0, fpsT = 0;
    var frozen = typeof opts.freezeP === 'number' ? clamp01(opts.freezeP) : null;
    function frame(now) {
      raf = requestAnimationFrame(frame);
      var dt = last ? Math.min(0.1, (now - last) / 1000) : 1 / 60; last = now;
      step(dt);
      fpsAcc += dt; fpsN++;
      if (fpsAcc >= 0.5) { state.fps = fpsN / fpsAcc; fpsAcc = 0; fpsN = 0; }
      if (dbg) dbg.textContent = 'p ' + state.p.toFixed(3) + '  scroll ' + scrollP.toFixed(3) + '\nfps ' + state.fps.toFixed(1) + '  calls ' + renderer.info.render.calls + '\npr ' + pr.toFixed(2) + (Q.mobile ? ' mobile' : '') + (Q.reduced ? ' reduced' : '');
    }
    function step(dt) {
      state.t += dt;
      if (state.appear < 1) state.appear = Math.min(1, state.appear + dt / CFG.autoAppear.duration);
      state.target = frozen != null ? frozen : storyFromScroll(scrollP);
      var k = 1 - Math.exp(-dt * CFG.smooth);
      if (frozen != null) state.p = frozen;
      else state.p += (state.target - state.p) * k;
      if (Math.abs(state.target - state.p) < 1e-5) state.p = state.target;
      apply(state.p, dt);
      renderer.render(scene, camera);
      state.frames++;
    }
    function startLoop() { if (!raf) { last = 0; raf = requestAnimationFrame(frame); } }
    function stopLoop() { if (raf) cancelAnimationFrame(raf); raf = 0; }
    function onVis() { if (document.hidden) stopLoop(); else startLoop(); }
    on(document, 'visibilitychange', onVis);
    on(canvas, 'webglcontextlost', function (e) { e.preventDefault(); stopLoop(); if (!disposed) showFallback('3D 화면이 멈췄어요. 다시 시도를 눌러 주세요.'); }, false);
    var disposed = false;

    layout();
    state.p = state.target = frozen != null ? frozen : storyFromScroll(scrollP);
    prevB.set(1e3, 0, 0);
    apply(state.p, 0);
    root.classList.add('iw-ready');
    if (!opts.manual) startLoop();

    var ctrl = {
      progress: function () { return state.p; },
      setProgress: function (p, immediate) { frozen = null; if (immediate) { state.p = state.target = p; } },
      freeze: function (p) { frozen = p == null ? null : clamp01(p); },
      step: function (dt) { step(dt == null ? 1 / 60 : dt); },
      info: function () {
        var cam = camera.position, v = bPos.clone().project(camera);
        return { p: state.p, target: state.target, scroll: scrollP, fps: state.fps, frames: state.frames, jumps: state.jumps,
          calls: renderer.info.render.calls, mobile: Q.mobile, reduced: Q.reduced, pr: pr, D: D,
          cam: [cam.x, cam.y, cam.z], bfly: [bPos.x, bPos.y, bPos.z], bflyNDC: [v.x, v.y, v.z], entered: state.entered,
          listeners: listeners.length, geometries: renderer.info.memory.geometries, textures: renderer.info.memory.textures };
      },
      dispose: function () {
        disposed = true; stopLoop();
        listeners.forEach(function (l) { l[0].removeEventListener(l[1], l[2], l[3]); }); listeners.length = 0;
        if (ro) ro.disconnect();
        if (mql.removeEventListener) mql.removeEventListener('change', onMotion);
        if (st) st.kill();
        world.dispose(); bf.dispose();
        renderer.dispose(); renderer.forceContextLoss();
        root.innerHTML = ''; root.classList.remove('iw-root', 'iw-ready', 'iw-at-end', 'iw-reduced', 'iw-failed');
      }
    };
    return ctrl;
  }
};
