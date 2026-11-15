/* WebGL 인트로 — 나비 한 마리 + 하프톤 잔상 + 포스터로 흡수되는 점들.
   IWButterfly(THREE, CFG, Q) -> { group, setPose(pos, yaw, pitch, bank), flap(dt, fold, rate), setAbsorb(aT, target),
                                    trailUpdate(t, dt, moved), clearTrail(), dispose() }
   - 위치·방향은 스크롤 진행률에서 계산된 값(setPose)으로만 정해져요 → 거꾸로 스크롤해도 같은 자세
   - 날갯짓은 시간으로 따로 움직여요 (flap) → 스크롤을 멈춰도 계속 */
window.IWButterfly = function (THREE, CFG, Q) {
  var B = CFG.butterfly;
  var group = new THREE.Group();          // 위치 + 방향
  var model = new THREE.Group();          // 크기 (날개 반쪽 길이 = 1)
  model.scale.setScalar(B.span / 2);
  group.add(model);
  var disposables = [];
  function keep(x) { disposables.push(x); return x; }

  /* ── 날개 모양: 기존 승인 WebGL 나비(js/butterfly-gl.js)와 같은 윤곽 — 레퍼런스에서 딴 (각도°, 반지름) 점
     위에서 본 오른쪽 날개: x = 바깥, z = 앞(머리 쪽). 각도는 x축에서 앞쪽으로 잰 값 ── */
  var FORE_PTS = [[-40,.02],[-30,.08],[-22,.19],[-16,.39],[-11,.62],[-1.8,.76],[7.4,.83],[17,.98],[26,1.12],[33,1.13],[36.4,.91],[39,.68],[42,.50],[45,.38],[50,.22],[58,.05],[63,.02]];
  var HIND_PTS = [[-93,.02],[-86,.08],[-80,.18],[-74,.38],[-69,.60],[-63,.72],[-52,.76],[-41,.75],[-27,.75],[-16,.72],[-5,.62],[10,.35],[20,.12],[28,.02]];
  function makeTable(pts) {           // 64칸 반지름 표 (기존 나비와 같은 방식으로 두 번 부드럽게)
    var a0 = pts[0][0], a1 = pts[pts.length - 1][0], t = [];
    for (var i = 0; i < 64; i++) {
      var deg = a0 + (a1 - a0) * i / 63, r = 0.02;
      for (var k = 0; k < pts.length - 1; k++) if (deg >= pts[k][0] && deg <= pts[k + 1][0]) { var f = (deg - pts[k][0]) / (pts[k + 1][0] - pts[k][0]); r = pts[k][1] + (pts[k + 1][1] - pts[k][1]) * f; }
      t.push(r);
    }
    for (var pass = 0; pass < 2; pass++) { var c = t.slice(); for (i = 1; i < 63; i++) t[i] = 0.25 * c[i - 1] + 0.5 * c[i] + 0.25 * c[i + 1]; }
    return { t: t, a0: a0 * Math.PI / 180, a1: a1 * Math.PI / 180 };
  }
  function outline(pts, n, rootZ) {
    var tab = makeTable(pts), out = [];
    for (var i = 0; i < n; i++) {
      var u = i / (n - 1) * 63, j = Math.min(Math.floor(u), 62), r = tab.t[j] + (tab.t[j + 1] - tab.t[j]) * (u - j);
      var th = tab.a0 + (tab.a1 - tab.a0) * i / (n - 1);
      out.push(new THREE.Vector3(r * Math.cos(th), 0, rootZ + r * Math.sin(th)));
    }
    return out;
  }
  var RINGS = 7, SEG = 56;
  function wingGeo(pts, root) {
    var out = outline(pts, SEG, root[1]), pos = [], aS = [], aA = [], idx = [];
    pos.push(root[0], 0, root[1]); aS.push(0); aA.push(0.5);
    for (var r = 1; r <= RINGS; r++) {
      var s = r / RINGS;
      for (var i = 0; i < SEG; i++) {
        var o = out[i];
        pos.push(root[0] + (o.x - root[0]) * s, 0, root[1] + (o.z - root[1]) * s); aS.push(s); aA.push(i / (SEG - 1));
      }
    }
    for (var j = 0; j < SEG - 1; j++) idx.push(0, 1 + j, 2 + j);
    for (r = 1; r < RINGS; r++) {
      var a = 1 + (r - 1) * SEG, b = 1 + r * SEG;
      for (j = 0; j < SEG - 1; j++) idx.push(a + j, b + j, b + j + 1, a + j, b + j + 1, a + j + 1);
    }
    var g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('aS', new THREE.Float32BufferAttribute(aS, 1));
    g.setAttribute('aA', new THREE.Float32BufferAttribute(aA, 1));
    g.setIndex(idx); g.computeVertexNormals();
    g.userData = { out: out, root: root };
    return keep(g);
  }
  var foreGeo = wingGeo(FORE_PTS, [0.0, 0.10]), hindGeo = wingGeo(HIND_PTS, [0.0, -0.02]);

  /* ── 날개 재질: 아이보리·베이지 + 은은한 진주빛, 가장자리는 하프톤 점 ── */
  var wingU = {
    uTime: { value: 0 }, uDiss: { value: 0 }, uOpacity: { value: 1 }, uFlex: { value: 0 },
    uSun: { value: new THREE.Vector3().fromArray(CFG.sun).normalize() }
  };
  function wingMat(hind) {
    return keep(new THREE.ShaderMaterial({
      uniforms: Object.assign({ uHind: { value: hind ? 1 : 0 } }, wingU),
      vertexShader: [
        'attribute float aS; attribute float aA; uniform float uFlex;',
        'varying float vS; varying float vA; varying vec2 vL; varying vec3 vN; varying vec3 vV;',
        'void main(){ vS = aS; vA = aA; vL = position.xz; vec3 p = position;',
        '  p.y += uFlex*aS*aS*.18;',                                   // 날개 끝이 살짝 늦게 따라오는 휨
        '  vec4 w = modelMatrix*vec4(p, 1.); vN = normalize(mat3(modelMatrix)*vec3(0.,1.,0.)); vV = normalize(cameraPosition - w.xyz);',
        '  gl_Position = projectionMatrix*viewMatrix*w; }'
      ].join('\n'),
      fragmentShader: [
        'uniform float uTime, uDiss, uOpacity, uHind; uniform vec3 uSun;',
        'varying float vS; varying float vA; varying vec2 vL; varying vec3 vN; varying vec3 vV;',
        'void main(){',
        '  float th = 1. - uDiss;',                                    // 흡수: 날개 끝(vS=1)부터 사라짐
        '  if(vS > th) discard;',
        '  float edge = smoothstep(.74, 1., vS)*.88;',
        '  float front = uDiss > 0. ? smoothstep(th - .26, th, vS) : 0.;',
        '  float ht = max(edge, front);',
        '  vec2 g = vL*30.; vec2 cell = fract(g) - .5; float rad = .75*(1. - ht);',
        '  float dotA = smoothstep(rad + .07, rad - .07, length(cell));',
        '  float a = ht < .02 ? 1. : dotA;',
        '  if(a < .02) discard;',
        /* 색 */
        '  vec3 ivory = vec3(.975,.958,.928), beige = vec3(.80,.72,.61), grey = vec3(.62,.57,.52);',
        '  vec3 col = ivory;',
        '  float vein = smoothstep(.045, .0, abs(fract(vA*(uHind > .5 ? 6. : 8.) + vS*.15) - .5))*smoothstep(.1, .3, vS)*(1. - edge);',
        '  col = mix(col, beige, vein*.5);',
        '  float spot = uHind > .5 ? smoothstep(.14, .03, length(vL - vec2(.42, -.48))) : smoothstep(.08, .02, length(vL - vec2(.55, .42))) + smoothstep(.13, .03, length((vL - vec2(.86, .66))*vec2(1., 1.5)))*.8;',
        '  col = mix(col, grey, clamp(spot, 0., 1.)*.42);',
        '  col = mix(col, beige, smoothstep(.72, 1., vS)*.55);',
        '  vec3 n = normalize(vN); if(!gl_FrontFacing) n = -n;',
        '  float f = 1. - abs(dot(n, normalize(vV)));',
        '  vec3 pearl = mix(vec3(.96,.86,.93), vec3(.86,.95,.92), .5 + .5*sin(f*7. + vA*5. + uTime*.4));',
        '  col = mix(col, pearl, .10 + .32*f*(1. - edge));',
        '  float lam = .80 + .26*abs(dot(n, uSun));',
        '  col *= lam; col += vec3(.035,.03,.02)*(1. - vS);',
        '  gl_FragColor = vec4(col, a*uOpacity*.97); }'
      ].join('\n'),
      side: THREE.DoubleSide, transparent: true, depthWrite: true
    }));
  }
  var foreMat = wingMat(false), hindMat = wingMat(true);

  // 오른쪽·왼쪽 × 앞날개·뒷날개. 축(pivot)은 몸통 가까이
  var wings = [];
  [1, -1].forEach(function (side) {
    [[foreGeo, foreMat, 0], [hindGeo, hindMat, 1]].forEach(function (w) {
      var pivot = new THREE.Group(); pivot.position.set(side * 0.035, 0.015, 0);
      var mesh = new THREE.Mesh(w[0], w[1]); mesh.scale.x = side; mesh.frustumCulled = false;
      pivot.add(mesh); model.add(pivot);
      wings.push({ pivot: pivot, mesh: mesh, side: side, hind: w[2] });
    });
  });

  // 작은 몸통 (털·다리·마디 없음)
  var bodyMat = keep(new THREE.MeshLambertMaterial({ color: 0xece4d6, emissive: 0x2a2620, transparent: true }));
  var body = new THREE.Mesh(keep(new THREE.SphereGeometry(1, 14, 10)), bodyMat);
  body.scale.set(0.05, 0.05, 0.36); body.position.z = -0.02; model.add(body);
  var head = new THREE.Mesh(body.geometry, bodyMat);
  head.scale.setScalar(0.06); head.position.set(0, 0.01, 0.34); model.add(head);
  var antPts = [];
  [1, -1].forEach(function (s) {
    var c = new THREE.QuadraticBezierCurve3(new THREE.Vector3(s * 0.02, 0.03, 0.37), new THREE.Vector3(s * 0.08, 0.16, 0.56), new THREE.Vector3(s * 0.2, 0.2, 0.7));
    var pts = c.getPoints(8);
    for (var i = 0; i < pts.length - 1; i++) antPts.push(pts[i], pts[i + 1]);
  });
  var antMat = keep(new THREE.LineBasicMaterial({ color: 0xb8a68c, transparent: true }));
  var ant = new THREE.LineSegments(keep(new THREE.BufferGeometry().setFromPoints(antPts)), antMat);
  model.add(ant);

  /* ── 하프톤 점 (잔상·흡수 공통 재질) ── */
  function dotsMat() {
    return keep(new THREE.ShaderMaterial({
      uniforms: { uScale: { value: 300 } },
      vertexShader: [
        'attribute float aAlpha; attribute float aSize; attribute float aTone; uniform float uScale;',
        'varying float vAlpha; varying float vTone;',
        'void main(){ vAlpha = aAlpha; vTone = aTone; vec4 mv = modelViewMatrix*vec4(position, 1.);',
        '  gl_PointSize = aSize*uScale/max(-mv.z, .05); gl_Position = projectionMatrix*mv; }'
      ].join('\n'),
      fragmentShader: [
        'varying float vAlpha; varying float vTone;',
        'void main(){ float d = length(gl_PointCoord - .5); float a = smoothstep(.5, .32, d)*vAlpha; if(a < .01) discard;',
        '  vec3 c = mix(vec3(.99,.975,.94), vec3(.72,.60,.44), vTone); gl_FragColor = vec4(c, a); }'
      ].join('\n'),
      transparent: true, depthWrite: false
    }));
  }
  function makePoints(n) {
    var g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute('aAlpha', new THREE.BufferAttribute(new Float32Array(n), 1).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute('aSize', new THREE.BufferAttribute(new Float32Array(n), 1).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute('aTone', new THREE.BufferAttribute(new Float32Array(n), 1));
    var pts = new THREE.Points(keep(g), dotsMat());
    pts.frustumCulled = false;
    return pts;
  }

  // 고정된 난수: 같은 스크롤 위치 → 같은 모습
  var seed = 12345;
  function rnd() { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }

  var NA = Q.reduced ? CFG.absorb.particles.reduced : (Q.mobile ? CFG.absorb.particles.mobile : CFG.absorb.particles.desktop);
  var absorbPts = makePoints(NA);
  var AP = [];
  for (var i = 0; i < NA; i++) {
    var wi = Math.floor(rnd() * 4), w = wings[wi], geo = w.hind ? hindGeo : foreGeo;
    var o = geo.userData.out[Math.floor(rnd() * SEG)], root = geo.userData.root;
    var s = 0.3 + 0.7 * Math.sqrt(rnd());
    AP.push({
      w: w, local: new THREE.Vector3(root[0] + (o.x - root[0]) * s, 0, root[1] + (o.z - root[1]) * s),
      release: (1 - s) * 0.62 + rnd() * 0.08, ang: rnd() * Math.PI * 2, rad: 0.4 + rnd() * 0.6, size: 0.010 + rnd() * 0.012
    });
    absorbPts.geometry.attributes.aTone.array[i] = rnd() < 0.55 ? 0.85 : 0.1;
  }
  absorbPts.visible = false;

  var NT = Q.reduced ? 0 : (Q.mobile ? CFG.trail.count.mobile : CFG.trail.count.desktop);
  var trailPts = NT ? makePoints(NT) : null;
  var TR = [];
  for (i = 0; i < NT; i++) { TR.push({ p: new THREE.Vector3(), born: -10, size: 0, v: new THREE.Vector3() }); trailPts.geometry.attributes.aTone.array[i] = i % 3 === 0 ? 0.1 : 0.8; }
  var trailIdx = 0, lastSpawn = 0;

  /* ── 자세 ── */
  var euler = new THREE.Euler(0, 0, 0, 'YXZ');
  function setPose(pos, yaw, pitch, bank) {
    group.position.copy(pos);
    euler.set(-pitch, yaw, bank); group.quaternion.setFromEuler(euler);
  }

  var phase = 0, hidden = false;
  function flap(dt, fold, rate) {
    phase += dt * Math.PI * 2 * B.flapHz * rate;
    var c = 0.5 - 0.5 * Math.cos(phase);
    var amp = 1 - fold * 0.85;
    var mid = B.flapDown + (B.flapUp - B.flapDown) * 0.5;
    wings.forEach(function (w) {
      var cc = 0.5 - 0.5 * Math.cos(phase - (w.hind ? 0.35 : 0));
      var a = mid + (cc - 0.5) * (B.flapUp - B.flapDown) * amp;
      a = a + (B.foldAngle - mid) * fold;
      w.pivot.rotation.z = w.side * a;
      if (w.hind) w.pivot.rotation.y = w.side * 0.05;
    });
    wingU.uFlex.value = Math.sin(phase - 0.9) * (1 - fold) * 0.9;
    return c;
  }

  /* ── 흡수: aT 0→1, target = 포스터 속 나비 (월드 좌표) ── */
  var tmp = new THREE.Vector3(), tmp2 = new THREE.Vector3();
  function smooth(x) { x = x < 0 ? 0 : x > 1 ? 1 : x; return x * x * (3 - 2 * x); }
  function setAbsorb(aT, target) {
    var diss = Math.min(1, aT / 0.62);
    wingU.uDiss.value = diss > 0 ? diss : 0;
    var bodyFade = 1 - smooth((aT - 0.48) / 0.27);
    bodyMat.opacity = bodyFade; antMat.opacity = bodyFade;
    body.visible = head.visible = ant.visible = !hidden && bodyFade > 0.01;
    model.visible = aT < 0.999;
    if (aT <= 0) { absorbPts.visible = false; return; }
    absorbPts.visible = true;
    group.updateMatrixWorld(true);
    var pa = absorbPts.geometry.attributes, pos = pa.position.array, al = pa.aAlpha.array, sz = pa.aSize.array;
    for (var i = 0; i < NA; i++) {
      var q = AP[i];
      var k = (aT - q.release) / 0.3;
      if (k <= 0) { al[i] = 0; continue; }
      k = Math.min(1, k);
      var e = smooth(k);
      tmp.copy(q.local).applyMatrix4(q.w.mesh.matrixWorld);
      var sw = (1 - e) * e * CFG.absorb.swirl * q.rad * 4, ang = q.ang + e * 3.2;
      tmp2.set(target.x + Math.cos(ang) * sw, target.y + Math.sin(ang) * sw, target.z + (1 - e) * 0.02);
      tmp.lerp(tmp2, e);
      pos[i * 3] = tmp.x; pos[i * 3 + 1] = tmp.y; pos[i * 3 + 2] = tmp.z;
      al[i] = Math.min(1, k * 12) * (1 - smooth((k - 0.78) / 0.22));
      sz[i] = q.size * (1 - 0.65 * e);
    }
    pa.position.needsUpdate = true; pa.aAlpha.needsUpdate = true; pa.aSize.needsUpdate = true;
  }

  /* ── 짧은 하프톤 잔상 (개수·수명 제한) ── */
  function clearTrail() { TR.forEach(function (t) { t.born = -10; }); if (trailPts) { trailPts.geometry.attributes.aAlpha.array.fill(0); trailPts.geometry.attributes.aAlpha.needsUpdate = true; } }
  function trailUpdate(t, dt, speed, enabled) {
    if (!trailPts) return;
    var life = CFG.trail.life;
    if (enabled && speed > 0.05 && t - lastSpawn > 0.045) {
      lastSpawn = t;
      group.updateMatrixWorld(true);
      for (var n = 0; n < 2; n++) {
        var w = wings[(trailIdx + n) % 4], geo = w.hind ? hindGeo : foreGeo, o = geo.userData.out[Math.floor(((trailIdx * 7 + n * 13) % SEG))];
        var r = TR[trailIdx];
        r.p.set(o.x * 0.9, 0, o.z * 0.9).applyMatrix4(w.mesh.matrixWorld);
        r.v.set(0, -0.06, 0); r.born = t; r.size = 0.008 + ((trailIdx * 37) % 10) * 0.0008;
        trailIdx = (trailIdx + 1) % NT;
      }
    }
    var pa = trailPts.geometry.attributes, pos = pa.position.array, al = pa.aAlpha.array, sz = pa.aSize.array;
    for (var i = 0; i < NT; i++) {
      var q = TR[i], age = t - q.born;
      if (age < 0 || age > life) { al[i] = 0; continue; }
      q.p.addScaledVector(q.v, dt);
      var u = age / life;
      pos[i * 3] = q.p.x; pos[i * 3 + 1] = q.p.y; pos[i * 3 + 2] = q.p.z;
      al[i] = (1 - u) * (1 - u) * 0.8; sz[i] = q.size * (1 - 0.5 * u);
    }
    pa.position.needsUpdate = true; pa.aAlpha.needsUpdate = true; pa.aSize.needsUpdate = true;
  }

  function setPointScale(px) { absorbPts.material.uniforms.uScale.value = px; if (trailPts) trailPts.material.uniforms.uScale.value = px; }

  return {
    group: group, absorbPts: absorbPts, trailPts: trailPts, wingU: wingU,
    setPose: setPose, flap: flap, setAbsorb: setAbsorb, trailUpdate: trailUpdate, clearTrail: clearTrail, setPointScale: setPointScale,
    setTime: function (t) { wingU.uTime.value = t; },
    hideModel: function () { model.children.forEach(function (c) { c.traverse(function (o) { if (o.isMesh || o.isLineSegments) o.visible = false; }); }); hidden = true; },
    dispose: function () { disposables.forEach(function (d) { if (d && d.dispose) d.dispose(); }); }
  };
};
