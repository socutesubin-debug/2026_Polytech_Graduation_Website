/* WebGL 인트로 — 공간: 하늘, 미술관 외벽(건물), 바닥, 포스터와 프레임 + 나비가 지나간 자리에 번지는 물결.
   IWWorld(THREE, CFG, Q) -> { group, poster, wall, update(t, camPos), addRipple(x,y,z), clearRipples(), dispose() }
   모든 것이 한 3D 공간 안에 고정된 자리에 있고, 카메라만 움직여요. */
window.IWWorld = function (THREE, CFG, Q) {
  var NOISE = [
    'float hash(vec2 p){ p = fract(p*vec2(123.34, 456.21)); p += dot(p, p+45.32); return fract(p.x*p.y); }',
    'float vnoise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.-2.*f);',
    '  return mix(mix(hash(i), hash(i+vec2(1,0)), f.x), mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), f.x), f.y); }',
    'float fbm(vec2 p){ float a = .5, s = 0.; for(int i=0;i<4;i++){ s += a*vnoise(p); p = p*2.03+7.1; a *= .5; } return s; }'
  ].join('\n');

  var P = CFG.poster, PH = P.height, PW = P.height * P.aspect, PY = P.centerY, PZ = P.z;
  var sun = new THREE.Vector3().fromArray(CFG.sun).normalize();
  var group = new THREE.Group();
  var disposables = [];
  function keep(x) { disposables.push(x); return x; }

  var shared = {
    uTime: { value: 0 }, uSun: { value: sun },
    uBfly: { value: new THREE.Vector4(0, 0, 10, 0) },          // 나비 위치 xyz + 그림자 세기
    uBSpan: { value: CFG.butterfly.span },
    uLeaf: { value: CFG.leaves },
    uRect: { value: new THREE.Vector4(-PW / 2, PY - PH / 2, PW / 2, PY + PH / 2) },
    uRip: { value: null }, uRipStr: { value: CFG.ripple.strength }
  };
  /* 물결: 나비가 지나간 자리(x, y, z)와 생긴 시각. 벽·포스터·하늘 셰이더가 함께 읽어요 */
  var MAXR = CFG.ripple.max, rips = [], ripIdx = 0;
  for (var ri = 0; ri < MAXR; ri++) rips.push(new THREE.Vector4(0, 0, 0, -100));
  shared.uRip.value = rips;
  function addRipple(x, y, z) { rips[ripIdx].set(x, y, z, shared.uTime.value); ripIdx = (ripIdx + 1) % MAXR; }
  function clearRipples() { rips.forEach(function (r) { r.w = -100; }); }
  var RIP = [
    'uniform vec4 uRip[' + MAXR + ']; uniform float uRipStr;',
    /* 벽 위의 물결: 수면에 떨어진 물방울처럼 고리가 퍼지며 사라짐. 나비가 벽에서 멀면 약함 */
    'float pathRipple(vec2 q){ float s = 0.;',
    '  for(int i = 0; i < ' + MAXR + '; i++){ vec4 r = uRip[i]; float age = uTime - r.w; if(age < 0. || age > 3.6) continue;',
    '    float d = length(q - r.xy); float k = d - age*.36;',
    '    s += cos(k*30.)*exp(-age*1.15)*exp(-k*k/.022)*smoothstep(0., .12, age)*exp(-max(r.z, 0.)*.32); }',
    '  return s*uRipStr; }'
  ].join('\n');

  /* ── 하늘: 옅은 푸른색, 부드러운 구름 ── */
  var skyMat = keep(new THREE.ShaderMaterial({
    uniforms: { uTime: shared.uTime, uSun: shared.uSun, uRip: shared.uRip, uRipStr: shared.uRipStr },
    vertexShader: 'varying vec3 vDir; void main(){ vDir = normalize(position); vec4 p = projectionMatrix*modelViewMatrix*vec4(position,1.); gl_Position = p.xyww; }',
    fragmentShader: NOISE + '\nuniform float uTime; uniform vec3 uSun; varying vec3 vDir;\n' +
      'uniform vec4 uRip[' + MAXR + ']; uniform float uRipStr;\n' +
      /* 하늘의 물결: 나비가 지나간 자리를 중심으로 공기가 수면처럼 번짐 */
      'float skyRipple(vec3 d){ float s = 0.;\n' +
      '  for(int i = 0; i < ' + MAXR + '; i++){ vec4 r = uRip[i]; float age = uTime - r.w; if(age < 0. || age > 3.6) continue;\n' +
      '    vec3 v = r.xyz - cameraPosition; float L = length(v); vec3 n = v/L; if(dot(d, n) < 0.) continue;\n' +
      '    float k = length(cross(d, n))*L - age*.36;\n' +
      '    s += cos(k*30.)*exp(-age*1.15)*exp(-k*k/.022)*smoothstep(0., .12, age); }\n' +
      '  return s*uRipStr; }\n' +
      'void main(){ vec3 d = normalize(vDir); float h = clamp(d.y, 0., 1.);\n' +
      ' vec3 hor = vec3(.925,.945,.955), zen = vec3(.60,.74,.87);\n' +
      ' vec3 col = mix(hor, zen, pow(smoothstep(0., 1., h), .65));\n' +
      ' vec2 cp = d.xz/(d.y+.18)*1.4 + vec2(uTime*.006, uTime*.002);\n' +
      ' float c = fbm(cp*1.2) * .7 + fbm(cp*3.1)*.3; c = smoothstep(.5, .82, c)*smoothstep(.03, .3, d.y);\n' +
      ' col = mix(col, vec3(.975,.98,.985), c*.6);\n' +
      ' float s = max(dot(d, uSun), 0.); col += vec3(1.,.97,.9)*(pow(s, 6.)*.10 + pow(s, 300.)*.5);\n' +
      ' col += skyRipple(d)*.045;\n' +
      ' gl_FragColor = vec4(col, 1.); }',
    side: THREE.BackSide, depthWrite: false
  }));
  var sky = new THREE.Mesh(keep(new THREE.SphereGeometry(300, 32, 16)), skyMat);
  sky.frustumCulled = false; sky.renderOrder = -10;
  group.add(sky);

  /* ── 돌 재질 (건물 외벽, 처마, 연못 테두리) ── */
  var stoneVS = 'varying vec3 vW; varying vec3 vN; void main(){ vec4 w = modelMatrix*vec4(position,1.); vW = w.xyz; vN = normalize(mat3(modelMatrix)*normal); gl_Position = projectionMatrix*viewMatrix*w; }';
  var leafFn = [
    'uniform float uTime, uLeaf, uBSpan; uniform vec3 uSun; uniform vec4 uBfly, uRect;',
    /* 나뭇잎 그림자: 화면 밖 왼쪽 위 나무가 벽에 드리우는 얼룩. 바람에 아주 조금 흔들림 */
    'float leafShadow(vec2 q){',
    '  float m = 1. - smoothstep(1.0, 6.4, length((q - vec2(-5.4, 6.4))*vec2(.7, 1.)));',
    '  vec2 w = vec2(sin(uTime*.55)*.05 + sin(uTime*1.3)*.015, cos(uTime*.4)*.03);',
    '  float a = fbm(q*1.1 + w*1.5 + 3.1); float b = fbm(q*4.2 - w*3. + 9.7); float c = vnoise(q*9. + w*6.);',
    '  float holes = smoothstep(.46, .70, a*.35 + b*.45 + c*.25);',   /* 잎 사이로 들어오는 햇빛 */
    '  float shade = m*(1. - holes*.9);',
    '  return smoothstep(0., 1., shade)*uLeaf; }',
    /* 나비 그림자: 햇빛 반대 방향으로 벽(z=0)에 비친 작은 얼룩 */
    'float bflyShadow(vec3 w){',
    '  float dz = max(uBfly.z - w.z, 0.); vec2 s = uBfly.xy - uSun.xy*(dz/uSun.z);',
    '  float r = uBSpan*(.32 + dz*.12); float d = length((w.xy - s)*vec2(1., 1.6));',
    '  return uBfly.w*smoothstep(r, r*.15, d)*exp(-dz*.8)*.22; }'
  ].join('\n');
  var stoneMat = keep(new THREE.ShaderMaterial({
    uniforms: shared,
    vertexShader: stoneVS,
    fragmentShader: NOISE + '\n' + leafFn + '\n' + RIP + '\nvarying vec3 vW; varying vec3 vN;\n' +
      'void main(){ vec3 n = normalize(vN);\n' +
      ' vec2 q = abs(n.z) > .5 ? vW.xy : (abs(n.x) > .5 ? vec2(-vW.z, vW.y) : vW.xz);\n' +
      /* 노란 기가 적은 아이보리 석재 */
      ' vec3 base = vec3(.915,.905,.885);\n' +
      ' float g = fbm(q*2.3)*.55 + fbm(q*17.)*.45; base *= .955 + .07*g;\n' +
      ' float sp = step(.985, hash(floor(q*140.))); base *= 1. - sp*.05;\n' +
      /* 큰 석판 줄눈 (포스터가 한 석판 가운데 오도록) */
      ' vec2 pj = (q + vec2(2.1, 0.)) / vec2(4.2, 3.0);\n' +
      ' vec2 dj = (.5 - abs(fract(pj) - .5)) * vec2(4.2, 3.0);\n' +
      ' float joint = 1. - smoothstep(.003, .012, min(dj.x, dj.y));\n' +
      ' base *= 1. - joint*.16;\n' +
      ' float lam = max(dot(n, uSun), 0.);\n' +
      ' float sh = n.z > .5 ? leafShadow(q) : 0.;\n' +
      ' vec3 col = base*(.80 + .30*lam*(1. - sh*.8));\n' +
      ' col *= mix(vec3(1.), vec3(.95,.965,.99), sh*.6);\n' +       /* 그늘은 살짝 푸르게 */
      /* 포스터 프레임 그림자 (오른쪽 아래로 부드럽게) */
      ' if(n.z > .5){ vec2 o = vec2(.045, -.065); vec2 c = (uRect.xy + uRect.zw)*.5 + o; vec2 hs = (uRect.zw - uRect.xy)*.5 + .03;\n' +
      '   vec2 dd = abs(vW.xy - c) - hs; float sd = length(max(dd, 0.)) + min(max(dd.x, dd.y), 0.);\n' +
      '   col *= 1. - .22*smoothstep(.09, -.02, sd)*(1. - sh*.6);\n' +
      '   col *= 1. - bflyShadow(vW);\n' +
      '   float rp = pathRipple(vW.xy); col *= 1. + rp*.10; col += max(rp, 0.)*.03; }\n' +
      ' gl_FragColor = vec4(col, 1.); }'
  }));

  // 건물: 왼쪽으로 길게, 오른쪽 x = 9 에서 모서리. 높이 12 m
  var bld = new THREE.Mesh(keep(new THREE.BoxGeometry(40, 12, 14)), stoneMat);
  bld.position.set(9 - 20, 6, -7);
  group.add(bld);
  var cornice = new THREE.Mesh(keep(new THREE.BoxGeometry(40.5, 0.42, 14.5)), stoneMat);
  cornice.position.set(9 - 20 + 0.25, 12.2, -7 + 0.25);
  group.add(cornice);
  var plinth = new THREE.Mesh(keep(new THREE.BoxGeometry(40.1, 0.28, 0.12)), stoneMat);
  plinth.position.set(9 - 20 + 0.05, 0.14, 0.06);
  group.add(plinth);

  /* ── 바닥: 연한 석재 포장 ── */
  var groundMat = keep(new THREE.ShaderMaterial({
    uniforms: shared,
    vertexShader: stoneVS,
    fragmentShader: NOISE + '\n' + leafFn + '\nvarying vec3 vW; varying vec3 vN;\n' +
      'void main(){ vec2 q = vW.xz; vec3 base = vec3(.865,.855,.835);\n' +
      ' base *= .95 + .08*(fbm(q*2.)*.5 + fbm(q*15.)*.5);\n' +
      ' vec2 pj = q / vec2(1.2, .6); pj.x += step(1., mod(floor(pj.y), 2.))*.5;\n' +
      ' vec2 dj = (.5 - abs(fract(pj) - .5))*vec2(1.2, .6); base *= 1. - .12*(1. - smoothstep(.004, .012, min(dj.x, dj.y)));\n' +
      ' float sh = leafShadow(vec2(q.x + q.y*.85, 3.4 - q.y*1.1))*.7;\n' +
      ' vec3 col = base*(.82 + .22*uSun.y*(1. - sh*.6));\n' +
      ' float far = smoothstep(18., 48., length(q - vec2(0., 8.)));\n' +   /* 멀리 갈수록 하늘색에 녹아듦 */
      ' col = mix(col, vec3(.925,.945,.955), far);\n' +
      ' col *= 1. - .25*(1. - smoothstep(0., .5, q.y));\n' +                 /* 벽 아래 접지 그늘 */
      ' gl_FragColor = vec4(col, 1.); }'
  }));
  var ground = new THREE.Mesh(keep(new THREE.PlaneGeometry(90, 70)), groundMat);
  ground.rotation.x = -Math.PI / 2; ground.position.set(0, 0, 35 - 0.001);
  group.add(ground);

  /* ── 포스터 (원본 이미지 그대로, 효과는 재질에서만) ── */
  var posterTex = new THREE.Texture();
  posterTex.colorSpace = THREE.NoColorSpace;
  posterTex.anisotropy = 4;
  posterTex.generateMipmaps = true;
  posterTex.minFilter = THREE.LinearMipmapLinearFilter;
  keep(posterTex);
  var posterU = {
    uMap: { value: posterTex }, uTime: shared.uTime, uSun: shared.uSun, uBfly: shared.uBfly, uBSpan: shared.uBSpan, uLeaf: shared.uLeaf, uRect: shared.uRect,
    uT: { value: new THREE.Vector2(P.target[0], P.target[1]) },
    uPat: { value: new THREE.Vector4().fromArray(P.pattern) },
    uAspect: { value: P.aspect },
    uGlow: { value: 0 }, uPatAmt: { value: 0 }, uRipAge: { value: -1 }, uInStr: { value: P.rippleStrength }, uRip: shared.uRip, uRipStr: shared.uRipStr,
    uLight: { value: 0 }, uReady: { value: 0 }
  };
  var posterMat = keep(new THREE.ShaderMaterial({
    uniforms: posterU,
    vertexShader: 'varying vec2 vUv; varying vec3 vW; void main(){ vUv = uv; vec4 w = modelMatrix*vec4(position,1.); vW = w.xyz; gl_Position = projectionMatrix*viewMatrix*w; }',
    fragmentShader: NOISE + '\n' + leafFn + '\n' + RIP + '\nuniform sampler2D uMap; uniform vec2 uT; uniform vec4 uPat; uniform float uAspect, uGlow, uPatAmt, uRipAge, uInStr, uLight, uReady;\n' +
      'varying vec2 vUv; varying vec3 vW;\n' +
      'void main(){ vec2 uv = vUv; vec2 dd = (vUv - uT)*vec2(uAspect, 1.); float d = length(dd);\n' +
      /* 들어가는 순간 한 번만 퍼지는 작은 파동. 평소(uRipAge < 0)에는 글자를 전혀 건드리지 않음 */
      ' if(uRipAge >= 0. && uInStr > 0.){ float r = uRipAge*.30; float env = exp(-uRipAge*2.4)*smoothstep(0., .08, uRipAge);\n' +
      '   float w = exp(-pow((d - r)/.04, 2.)); uv -= dd/(d + 1e-4)/vec2(uAspect, 1.)*sin((d - r)*80.)*w*env*.0045*uInStr; }\n' +
      ' vec3 col = mix(vec3(.86,.8,.72), texture2D(uMap, uv).rgb, uReady);\n' +
      /* 포스터 나비 무늬를 은은하게 강조 (세피아 부분일수록 더) */
      ' vec2 pb = (vUv - uPat.xy)/uPat.zw; float pm = smoothstep(1., .45, length(pb));\n' +
      ' float sep = clamp((col.r - col.b)*3.2, 0., 1.);\n' +
      ' float shim = .78 + .22*sin(uTime*1.2 - d*28.);\n' +
      ' col += vec3(1.,.93,.80)*uPatAmt*pm*(.06 + .22*sep)*shim;\n' +
      /* 흡수 지점의 작은 빛 */
      ' col += vec3(1.,.975,.92)*uGlow*(exp(-d*d/.0010)*.62 + exp(-d*d/.010)*.14);\n' +
      /* 파동이 지나가는 자리의 아주 옅은 빛 */
      ' if(uRipAge >= 0.){ float r = uRipAge*.30; col += vec3(1.,.97,.9)*exp(-pow((d - r)/.03, 2.))*exp(-uRipAge*2.2)*.12*uInStr; }\n' +
      /* 마지막: 포스터 가운데에서 퍼지는 아이보리빛 */
      ' float L = uLight; col = mix(col, vec3(.99,.975,.945), clamp(L*1.6 - d*(1.8 - L*1.6), 0., 1.));\n' +
      ' col *= 1. + pathRipple(vW.xy)*.06;\n' +
      ' col *= 1. - bflyShadow(vW)*.45;\n' +
      ' gl_FragColor = vec4(col, 1.); }'
  }));
  var poster = new THREE.Mesh(keep(new THREE.PlaneGeometry(PW, PH)), posterMat);
  poster.position.set(0, PY, PZ);
  group.add(poster);

  // 얇고 절제된 프레임 (짙은 청동색)
  var frameMat = keep(new THREE.MeshLambertMaterial({ color: 0x5e5244 }));
  var F = P.frame, FD = P.frameDepth;
  [[0, PH / 2 + F / 2, PW + F * 2, F], [0, -PH / 2 - F / 2, PW + F * 2, F],
   [-PW / 2 - F / 2, 0, F, PH], [PW / 2 + F / 2, 0, F, PH]].forEach(function (f) {
    var m = new THREE.Mesh(keep(new THREE.BoxGeometry(f[2], f[3], FD)), frameMat);
    m.position.set(f[0], PY + f[1], FD / 2 + 0.01); group.add(m);
  });
  // 포스터 뒤판 (벽과 포스터 사이 틈이 보이지 않게)
  var back = new THREE.Mesh(keep(new THREE.PlaneGeometry(PW + F * 2, PH + F * 2)), frameMat);
  back.position.set(0, PY, 0.012); group.add(back);

  // 프레임·몸통용 빛 (직접 만든 셰이더는 이 빛을 쓰지 않아요)
  var hemi = new THREE.HemisphereLight(0xf4f6f8, 0xcfc8bc, 1.25);
  var dir = new THREE.DirectionalLight(0xfff8ee, 0.9); dir.position.copy(sun).multiplyScalar(10);
  group.add(hemi, dir);

  function posterUVToWorld(u, v) { return [(u - 0.5) * PW, PY + (v - 0.5) * PH, PZ]; }

  function setPosterImage(img) {
    posterTex.image = img; posterTex.needsUpdate = true; posterU.uReady.value = 1;
  }

  return {
    group: group, poster: poster, wall: bld, shared: shared, posterU: posterU,
    posterSize: [PW, PH], posterUVToWorld: posterUVToWorld, setPosterImage: setPosterImage,
    addRipple: addRipple, clearRipples: clearRipples,
    update: function (t, camPos) { shared.uTime.value = t; sky.position.copy(camPos); },
    dispose: function () { disposables.forEach(function (d) { if (d && d.dispose) d.dispose(); }); }
  };
};
