/* WebGL2 빛나는 나비. 외부 라이브러리 없음. createButterflyGL(canvas, 옵션) */
/* WebGL2 빛나는 나비. 외부 라이브러리 없음.
   옵션: ?tint=gold|blue  ?trio=1  ?bg=sky  ?view=auto|front|side  ?t=초(정지 화면)  ?ui=0 */
function createButterflyGL(canvas, OPT) {
OPT = Object.assign({ tint: 'gold', trio: false, sky: false, view: 'auto', freeze: null, flapHz: 2.6 }, OPT || {});
const gl = canvas.getContext('webgl2', { alpha: true, premultipliedAlpha: true, antialias: false });
if (!gl) return null;

/* ---------- 수학 ---------- */
const M = {
  mul(a, b) { const o = new Float32Array(16);
    for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++)
      o[c*4+r] = a[r]*b[c*4] + a[4+r]*b[c*4+1] + a[8+r]*b[c*4+2] + a[12+r]*b[c*4+3];
    return o; },
  persp(fov, asp, n, f) { const t = 1/Math.tan(fov/2), o = new Float32Array(16);
    o[0] = t/asp; o[5] = t; o[10] = (f+n)/(n-f); o[11] = -1; o[14] = 2*f*n/(n-f); return o; },
  trans(x, y, z) { const o = M.id(); o[12] = x; o[13] = y; o[14] = z; return o; },
  id() { const o = new Float32Array(16); o[0] = o[5] = o[10] = o[15] = 1; return o; },
  rx(a) { const o = M.id(), c = Math.cos(a), s = Math.sin(a); o[5] = c; o[6] = s; o[9] = -s; o[10] = c; return o; },
  ry(a) { const o = M.id(), c = Math.cos(a), s = Math.sin(a); o[0] = c; o[2] = -s; o[8] = s; o[10] = c; return o; },
  rz(a) { const o = M.id(), c = Math.cos(a), s = Math.sin(a); o[0] = c; o[1] = s; o[4] = -s; o[5] = c; return o; },
  scale(s) { const o = M.id(); o[0] = o[5] = o[10] = s; return o; },
  pt(m, x, y, z) { return [m[0]*x+m[4]*y+m[8]*z+m[12], m[1]*x+m[5]*y+m[9]*z+m[13], m[2]*x+m[6]*y+m[10]*z+m[14]]; },
  dir(m, x, y, z) { return [m[0]*x+m[4]*y+m[8]*z, m[1]*x+m[5]*y+m[9]*z, m[2]*x+m[6]*y+m[10]*z]; },
};

/* ---------- 셰이더 ---------- */
const NOISE = `
float hash(vec2 p){ p = fract(p*vec2(123.34, 456.21)); p += dot(p, p+45.32); return fract(p.x*p.y); }
float vnoise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.-2.*f);
  return mix(mix(hash(i), hash(i+vec2(1,0)), f.x), mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), f.x), f.y); }
float fbm(vec2 p){ float a = .5, s = 0.; for(int i=0;i<4;i++){ s += a*vnoise(p); p = p*2.03+7.1; a *= .5; } return s; }
`;
/* 날개 모양: JS(lobeR)와 같은 식 */
const WING_COMMON = `
const vec2 ROOT_F = vec2(0., .10);
const vec2 ROOT_H = vec2(0., -.02);
uniform float uRF[64]; uniform float uRH[64];
const vec2 RNG_F = vec2(-.70, 1.10);   /* 앞날개 각도 범위(rad) */
const vec2 RNG_H = vec2(-1.62, .50);   /* 뒷날개 각도 범위(rad) */
float foreR(float th){ float u = clamp((th - RNG_F.x)/(RNG_F.y - RNG_F.x), 0., 1.)*63.; int i = int(min(floor(u), 62.)); return mix(uRF[i], uRF[i+1], u - float(i)); }
float hindR(float th){ float u = clamp((th - RNG_H.x)/(RNG_H.y - RNG_H.x), 0., 1.)*63.; int i = int(min(floor(u), 62.)); return mix(uRH[i], uRH[i+1], u - float(i)); }
float flapAngle(float ph){ return mix(-.38, 1.22, .5-.5*cos(ph)); }
`;
const WING_VS = `#version 300 es
precision highp float;
layout(location=0) in vec2 aP;
uniform mat4 uMVP; uniform float uPhase, uSide;
out vec2 vP;
${WING_COMMON}
void main(){
  vP = aP;
  float a = flapAngle(uPhase - .55*(.3 - aP.y) - .55*aP.x);
  vec3 p = vec3(uSide*aP.x*cos(a), aP.y, aP.x*sin(a));
  gl_Position = uMVP*vec4(p, 1.);
}`;
const WING_FS = `#version 300 es
precision highp float;
in vec2 vP; out vec4 o;
uniform float uTime, uSeed, uDense; uniform vec3 uWarm, uCool;
${NOISE}${WING_COMMON}
vec4 shade(vec2 q, float t, float th, float r, float veinN, float hind){
  /* 번져 사라지는 가장자리 */
  float patchy = fbm(q*5.5 + uSeed + vec2(0., uTime*.07));
  float region = smoothstep(.38, .62, fbm(q*1.7 + uSeed*2.));    /* 흩어지는 구역 */
  float cut = smoothstep(.70, 1.08, t)*(.25 + .75*region);
  float keep = smoothstep(cut - .1, cut + .1, patchy*1.25 + .12);
  vec2 gp = (q + uSeed)*120.; vec2 gi = floor(gp);
  vec2 gc = gi + .2 + .6*vec2(hash(gi), hash(gi + 31.7));
  float gr = hash(gi + 7.3);
  float grain = smoothstep(.34, .1, length(gp - gc))*step(.45, gr)*(1. + 2.5*step(.94, gr));
  float body = keep*(1. - smoothstep(.985, 1.0, t));              /* 막 부분 */
  float dust = grain*smoothstep(.74, .97, t)*(1. - smoothstep(1., 1.3, t))*(.25 + region)*(.4 + patchy); /* 가루 */
  /* 날개맥: 가늘고 불규칙하게 */
  float wob = .25*sin(r*6. + th*3.) + .5*vnoise(vec2(th*5. + uSeed, r*2.));
  float v1 = abs(fract(th*veinN + wob) - .5);
  float veins = smoothstep(.035, .0, v1)*smoothstep(.2, .38, t)*(.5 + .5*vnoise(vec2(th*9., r*3.) + uSeed));
  float v2 = abs(fract(th*veinN*2. + wob + .25) - .5);
  veins += .5*smoothstep(.04, .0, v2)*smoothstep(.66, .8, t);
  /* 유리 같은 막 */
  float cloud = fbm(q*3.2 + 11. + uSeed);
  float streak = fbm(vec2(th*16., r*1.3) + uSeed);                 /* 몸에서 퍼지는 빛줄기 */
  float rays = exp(-r*3.4)*(.28 + .75*streak*streak*2.);
  float hl = smoothstep(.5, .78, fbm(q*2.4 + 5. + uSeed*1.7));      /* 넓은 반사광 */
  float hl2 = smoothstep(.62, .8, fbm(vec2(th*5., r*7.) + 9. + uSeed)); /* 결 따라 생기는 반사 */
  /* 얼룩무늬: 바깥쪽 띠의 밝은 세포 무늬 */
  vec2 sp = q*15. + uSeed; vec2 si = floor(sp); float f1 = 9., f2 = 9.;
  for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) { vec2 g = si + vec2(i, j); vec2 c = g + vec2(hash(g), hash(g + 13.1)); float d = length(sp - c); if (d < f1) { f2 = f1; f1 = d; } else if (d < f2) f2 = d; }
  float band = smoothstep(.5, .66, t)*(1. - smoothstep(.86, .97, t));
  float spotArea = smoothstep(.48, .64, fbm(q*2.1 + 21. + uSeed))*mix(.6, 1., hind);
  float spots = smoothstep(.06, .22, f2 - f1)*smoothstep(.75, .45, f1)*band*spotArea;
  /* 표면 반짝이 */
  vec2 kp = (q + uSeed*.7)*70.; vec2 ki = floor(kp); float kr = hash(ki + 3.1);
  float glit = smoothstep(.3, .05, length(kp - ki - .2 - .6*vec2(hash(ki), hash(ki + 9.7))))*step(.72, kr)
             *(.4 + .6*sin(uTime*3. + kr*40.))*smoothstep(.35, .95, t);
  float mem = .055 + .15*cloud*cloud + rays + .2*hl*(.4 + cloud) + .2*hl2 + .38*spots + .5*glit;
  float goldFill = smoothstep(.62, 1., t)*(.12 + .3*patchy);        /* 끝으로 갈수록 금가루가 짙어짐 */
  float rimMod = .25 + .75*smoothstep(.3, .65, fbm(vec2(th*5., uSeed*3.)));
  float rim = .3*smoothstep(.8, 1., t) + .9*smoothstep(.955, .992, t)*rimMod;
  float sheen = .3*smoothstep(.5, 1., sin(th*2.5 + r*4. - uTime*.8 + cloud*4.));
  float I = body*(mem + uDense*(.42 + .2*cloud) + goldFill + .42*veins + rim + sheen*mem) + dust*1.3;
  float warm = clamp(.02 + .98*smoothstep(.45, 1., t) + .5*(cloud - .5) - .8*exp(-r*3.) - .5*spots - .3*hl, 0., 1.);
  return vec4(mix(uCool, uWarm, warm)*I, body);
}
void main(){
  vec2 qf = vP - ROOT_F, qh = vP - ROOT_H;
  float thf = atan(qf.y, qf.x), thh = atan(qh.y, qh.x);
  float rf = length(qf), rh = length(qh);
  float Rf = foreR(thf);
  float Rh = hindR(thh)*(1. + .03*cos(thh*30.)*smoothstep(-.35, -.6, thh)*smoothstep(-1.3, -1.05, thh));
  float tf = rf/Rf, th_ = rh/Rh;
  vec4 c = vec4(0.);
  if (tf < 1.32) c += shade(qf, tf, thf, rf, 7.5, 0.);
  if (th_ < 1.32) c += shade(qh + 3.7, th_, thh, rh, 4.2, 1.)*(tf < 1. ? .55 : 1.);
  c *= smoothstep(0., .03, vP.x);
  o = vec4(c.rgb, min(c.a, 1.));   /* 알파 = 날개 막이 덮은 정도 */
}`;
const BODY_VS = `#version 300 es
precision highp float;
layout(location=0) in vec3 aPos; layout(location=1) in vec2 aUv;
uniform mat4 uVP; out vec2 vUv;
void main(){ vUv = aUv; gl_Position = uVP*vec4(aPos, 1.); }`;
const BODY_FS = `#version 300 es
precision highp float;
in vec2 vUv; out vec4 o; uniform vec3 uWarm, uCool; uniform float uTime;
${NOISE}
float seg(vec2 p, vec2 a, vec2 b){ vec2 pa = p-a, ba = b-a; float h = clamp(dot(pa,ba)/dot(ba,ba), 0., 1.); return length(pa - ba*h); }
float curve(vec2 p, vec2 a, vec2 c, vec2 b){ float d = 1e3; vec2 prev = a;
  for(int i=1;i<=10;i++){ float t = float(i)/10.; vec2 q = mix(mix(a,c,t), mix(c,b,t), t); d = min(d, seg(p, prev, q)); prev = q; } return d; }
void main(){
  vec2 p = vUv;
  float fuzz = (vnoise(p*90.) - .5)*.012;
  float taper = mix(.022, .05, smoothstep(-.58, -.05, p.y));
  float d = seg(p, vec2(0., -.58), vec2(0., .12)) - taper;
  d = min(d, length(p - vec2(0., .185)) - .042) + fuzz;
  float core = smoothstep(.006, -.006, d)*(.85 + .15*sin(p.y*85.));
  float glow = .5*exp(-max(d, 0.)*34.) + .13*exp(-max(d, 0.)*8.);
  vec2 ap = vec2(abs(p.x), p.y);
  float da = curve(ap, vec2(.015, .21), vec2(.05, .46), vec2(.24, .66));
  float ant = smoothstep(.007, .0, da) + .5*exp(-da*60.);
  ant += 1.2*smoothstep(.02, .0, length(ap - vec2(.24, .66)));
  float dl = min(curve(ap, vec2(.03, .05), vec2(.16, .02), vec2(.2, -.14)), curve(ap, vec2(.03, -.02), vec2(.14, -.1), vec2(.15, -.26)));
  float legs = .45*smoothstep(.006, .0, dl);
  vec3 c = mix(uCool, vec3(1.), .7)*(core*1.2 + glow) + mix(uCool, uWarm, .5)*(ant*.8 + legs);
  o = vec4(c, core);
}`;
const PT_VS = `#version 300 es
precision highp float;
layout(location=0) in vec3 aPos; layout(location=1) in vec3 aInfo; /* life01, size, warm */
uniform mat4 uVP; uniform float uPx;
out float vA; out float vW;
void main(){
  gl_Position = uVP*vec4(aPos, 1.);
  float l = aInfo.x;
  vA = smoothstep(0., .08, l)*(1. - l)*sqrt(1. - l);
  vW = aInfo.z;
  gl_PointSize = max(1., aInfo.y*uPx/gl_Position.w);
}`;
const PT_FS = `#version 300 es
precision highp float;
in float vA; in float vW; out vec4 o; uniform vec3 uWarm, uCool;
void main(){
  vec2 d = gl_PointCoord - .5; float r = length(d)*2.;
  float a = smoothstep(1., .0, r); a *= a;
  o = vec4(mix(uCool, uWarm, vW)*a*vA*1.4, 0.);
}`;
const FS_VS = `#version 300 es
precision highp float;
out vec2 vUv;
void main(){ vec2 p = vec2((gl_VertexID<<1)&2, gl_VertexID&2); vUv = p; gl_Position = vec4(p*2.-1., 0., 1.); }`;
const BLUR_FS = `#version 300 es
precision highp float;
in vec2 vUv; out vec4 o; uniform sampler2D uTex; uniform vec2 uDir;
void main(){
  vec3 c = texture(uTex, vUv).rgb*.227;
  c += (texture(uTex, vUv + uDir*1.385).rgb + texture(uTex, vUv - uDir*1.385).rgb)*.316;
  c += (texture(uTex, vUv + uDir*3.231).rgb + texture(uTex, vUv - uDir*3.231).rgb)*.070;
  o = vec4(c, 1.);
}`;
const COMP_FS = `#version 300 es
precision highp float;
in vec2 vUv; out vec4 o; uniform sampler2D uScene, uB1, uB2; uniform float uOpaque, uDense;
void main(){
  vec4 sc = texture(uScene, vUv);
  vec3 c = sc.rgb + (texture(uB1, vUv).rgb*.55 + texture(uB2, vUv).rgb*.65)*(1. - .6*uDense*(1. - uOpaque));
  c = 1. - exp(-c*1.15);
  float m = max(c.r, max(c.g, c.b));
  /* 밝은 배경 위(투명 모드): 중간 밝기는 호박빛 유리처럼, 밝은 곳은 흰 빛 그대로 */
  vec3 onLight = c*mix(vec3(1., .84, .56), vec3(1.), smoothstep(.4, .85, m));
  /* uDense = 1 이면 날개가 덮은 곳만 배경을 가리고, 빛 번짐과 가루는 빛으로만 더해진다 (어두운 테두리 없음) */
  float aGlass = clamp(m*1.2, 0., 1.), aSolid = clamp(sc.a, 0., 1.)*.9;
  float a = mix(mix(aGlass, aSolid, uDense), 1., uOpaque);
  /* 불투명 모드: 밝은 배경에서도 보이도록 날개 면을 옅은 금빛으로 */
  vec3 solid = c*mix(vec3(1., .9, .68), vec3(1.), smoothstep(.72, .98, m)*.8 + .2*(1. - clamp(sc.a, 0., 1.)));
  o = vec4(mix(mix(onLight, solid, uDense), c, uOpaque), a);
}`;

function prog(vs, fs) {
  const p = gl.createProgram();
  for (const [t, s] of [[gl.VERTEX_SHADER, vs], [gl.FRAGMENT_SHADER, fs]]) {
    const sh = gl.createShader(t); gl.shaderSource(sh, s); gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) console.error(gl.getShaderInfoLog(sh));
    gl.attachShader(p, sh);
  }
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) console.error(gl.getProgramInfoLog(p));
  const u = {}; const n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
  for (let i = 0; i < n; i++) { const nm = gl.getActiveUniform(p, i).name; u[nm] = gl.getUniformLocation(p, nm); }
  return { p, u };
}
const pWing = prog(WING_VS, WING_FS), pBody = prog(BODY_VS, BODY_FS), pPt = prog(PT_VS, PT_FS),
      pBlur = prog(FS_VS, BLUR_FS), pComp = prog(FS_VS, COMP_FS);

/* ---------- 지오메트리 ---------- */
const GX = 20, GY = 28, X0 = 0, X1 = 1.3, Y0 = -1.05, Y1 = 1.25;
const wingVAO = gl.createVertexArray(); let wingCount = 0;
{
  const v = [], idx = [];
  for (let j = 0; j <= GY; j++) for (let i = 0; i <= GX; i++) v.push(X0 + (X1-X0)*i/GX, Y0 + (Y1-Y0)*j/GY);
  for (let j = 0; j < GY; j++) for (let i = 0; i < GX; i++) { const a = j*(GX+1)+i, b = a+1, c = a+GX+1, d = c+1; idx.push(a, b, c, b, d, c); }
  gl.bindVertexArray(wingVAO);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer()); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(v), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer()); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(idx), gl.STATIC_DRAW);
  wingCount = idx.length;
}
const bodyVAO = gl.createVertexArray(), bodyBuf = gl.createBuffer(), bodyData = new Float32Array(6*5);
gl.bindVertexArray(bodyVAO); gl.bindBuffer(gl.ARRAY_BUFFER, bodyBuf); gl.bufferData(gl.ARRAY_BUFFER, bodyData, gl.DYNAMIC_DRAW);
gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 20, 0);
gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 20, 12);

const NP = 16000;
const pPos = new Float32Array(NP*3), pVel = new Float32Array(NP*3), pInfo = new Float32Array(NP*3),
      pLife = new Float32Array(NP), pDur = new Float32Array(NP).fill(1), pTint = new Uint8Array(NP);
pLife.fill(9);
let pNext = 0;
const ptVAO = gl.createVertexArray(), ptPosBuf = gl.createBuffer(), ptInfoBuf = gl.createBuffer();
gl.bindVertexArray(ptVAO);
gl.bindBuffer(gl.ARRAY_BUFFER, ptPosBuf); gl.bufferData(gl.ARRAY_BUFFER, pPos, gl.DYNAMIC_DRAW);
gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
gl.bindBuffer(gl.ARRAY_BUFFER, ptInfoBuf); gl.bufferData(gl.ARRAY_BUFFER, pInfo, gl.DYNAMIC_DRAW);
gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 0, 0);
const fsVAO = gl.createVertexArray();

/* ---------- 렌더 타깃 ---------- */
const cam = { fov: 32*Math.PI/180, z: 4.6 };
let W = 0, H = 0, DPR = 1, fbScene, fbA1, fbB1, fbA2, fbB2;
function target(w, h) {
  const tex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
  for (const [k, v] of [[gl.TEXTURE_MIN_FILTER, gl.LINEAR], [gl.TEXTURE_MAG_FILTER, gl.LINEAR], [gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE], [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE]]) gl.texParameteri(gl.TEXTURE_2D, k, v);
  const fb = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
  return { fb, tex, w, h };
}
function resize() {
  DPR = Math.min(window.devicePixelRatio || 1, 2);
  const w = Math.max(8, Math.round((canvas.clientWidth || innerWidth)*DPR)), h = Math.max(8, Math.round((canvas.clientHeight || innerHeight)*DPR));
  if (w === W && h === H) return;
  W = canvas.width = w; H = canvas.height = h;
  for (const t of [fbScene, fbA1, fbB1, fbA2, fbB2]) if (t) { gl.deleteTexture(t.tex); gl.deleteFramebuffer(t.fb); }
  cam.fov = (W < H ? 46 : 32)*Math.PI/180; cam.z = W < H ? 5.2 : 4.6;
  fbScene = target(W, H);
  fbA1 = target(W>>2, H>>2); fbB1 = target(W>>2, H>>2);
  fbA2 = target(W>>3, H>>3); fbB2 = target(W>>3, H>>3);
}

/* ---------- 나비 ---------- */
const TINTS = {
  gold: { warm: [1.0, .74, .36], cool: [1.0, .96, .88] },
  blue: { warm: [.62, .78, 1.0], cool: [.95, .98, 1.0] },
  white: { warm: [1.0, .9, .72], cool: [1.0, 1.0, 1.0] },
};
const butterflies = OPT.trio ? [
  { tint: 'gold',  pos: [0, .62, 0],      scale: .78, view: 'front', seed: 1.3, off: 0 },
  { tint: 'blue',  pos: [-1.15, -.55, .2], scale: .7,  view: 'sideL', seed: 5.1, off: 1.7 },
  { tint: 'white', pos: [1.15, -.5, .2],   scale: .7,  view: 'sideR', seed: 8.4, off: 3.1 },
] : [{ tint: OPT.tint, pos: [0, 0, 0], scale: 1, view: OPT.view, seed: 1.3, off: 0 }];

/* 날개 윤곽: 레퍼런스에서 딴 (각도°, 반지름) 점들을 64칸 표로 만든다 */
const RNG_F = [-.70, 1.10], RNG_H = [-1.62, .50];
const FORE_PTS = [[-40,.02],[-30,.08],[-22,.19],[-16,.39],[-11,.62],[-1.8,.76],[7.4,.83],[17,.98],[26,1.12],[33,1.13],[36.4,.91],[39,.68],[42,.50],[45,.38],[50,.22],[58,.05],[63,.02]];
const HIND_PTS = [[-93,.02],[-86,.08],[-80,.18],[-74,.38],[-69,.60],[-63,.72],[-52,.76],[-41,.75],[-27,.75],[-16,.72],[-5,.62],[10,.35],[20,.12],[28,.02]];
function makeTable(pts, rng) {
  const t = new Float32Array(64);
  for (let i = 0; i < 64; i++) {
    const deg = (rng[0] + (rng[1] - rng[0])*i/63)*180/Math.PI;
    let r = .02;
    for (let k = 0; k < pts.length - 1; k++) if (deg >= pts[k][0] && deg <= pts[k+1][0]) { const f = (deg - pts[k][0])/(pts[k+1][0] - pts[k][0]); r = pts[k][1] + (pts[k+1][1] - pts[k][1])*f; }
    t[i] = r;
  }
  for (let pass = 0; pass < 2; pass++) { const c = t.slice(); for (let i = 1; i < 63; i++) t[i] = .25*c[i-1] + .5*c[i] + .25*c[i+1]; }
  return t;
}
const TAB_F = makeTable(FORE_PTS, RNG_F), TAB_H = makeTable(HIND_PTS, RNG_H);
function tabR(tab, rng, th) { const u = Math.max(0, Math.min(1, (th - rng[0])/(rng[1] - rng[0])))*63, i = Math.min(Math.floor(u), 62); return tab[i] + (tab[i+1] - tab[i])*(u - i); }
const flapAngle = ph => -.38 + 1.6*(.5 - .5*Math.cos(ph));
function edgePoint() { /* 날개 가장자리의 임의 지점 (날개 좌표) */
  const k = .86 + Math.random()*.2;
  if (Math.random() < .55) { const th = .42 + (Math.random() + Math.random() - 1)*.5, r = tabR(TAB_F, RNG_F, th)*k; return [r*Math.cos(th), .10 + r*Math.sin(th)]; }
  const th = -.8 + (Math.random() + Math.random() - 1)*.6, r = tabR(TAB_H, RNG_H, th)*k; return [r*Math.cos(th), -.02 + r*Math.sin(th)];
}
function wingLocal(x, y, side, phase) {
  const a = flapAngle(phase - .55*(.3 - y) - .55*x);
  return [side*x*Math.cos(a), y, x*Math.sin(a)];
}
function modelOf(b, t) {
  if (b.pose) { /* 바깥(인트로)에서 자세를 정해 줄 때 */
    const q = b.pose;
    let m = M.trans(q.x, q.y, q.z || 0);
    m = M.mul(m, M.ry(q.yaw || 0)); m = M.mul(m, M.rx((q.pitch || 0) + .08*Math.sin(b.phase + 1.))); m = M.mul(m, M.rz(q.roll || 0));
    return M.mul(m, M.scale(q.scale || 1));
  }
  const tt = t + b.off*3;
  let yaw, pitch = -.62, roll = .06*Math.sin(tt*.9);
  if (b.view === 'front') { yaw = .12*Math.sin(tt*.5); pitch = -.3; }
  else if (b.view === 'side' || b.view === 'sideR') yaw = 1.05 + .12*Math.sin(tt*.5);
  else if (b.view === 'sideL') yaw = -1.05 + .12*Math.sin(tt*.5);
  else yaw = .95*Math.sin(tt*.33);
  const ph = b.phase;
  const bob = -.07*Math.cos(ph) + .05*Math.sin(tt*1.1);
  const sway = .08*Math.sin(tt*.7) + .04*Math.sin(tt*1.9);
  let m = M.trans(b.pos[0] + sway, b.pos[1] + bob, b.pos[2] + .1*Math.sin(tt*.45));
  m = M.mul(m, M.ry(yaw)); m = M.mul(m, M.rz(roll)); m = M.mul(m, M.rx(pitch + .08*Math.sin(ph + 1.)));
  return M.mul(m, M.scale(b.scale));
}

function spawn(b, m, prevM, dt, n) {
  for (let k = 0; k < n; k++) {
    const i = pNext; pNext = (pNext + 1) % NP;
    const [x, y] = edgePoint(), side = Math.random() < .5 ? -1 : 1;
    const l = wingLocal(x, y, side, b.phase), l0 = wingLocal(x, y, side, b.prevPhase);
    const w = M.pt(m, l[0], l[1], l[2]), w0 = M.pt(prevM, l0[0], l0[1], l0[2]);
    const tail = M.dir(m, 0, -1, -.25);
    for (let a = 0; a < 3; a++) {
      pPos[i*3+a] = w[a];
      pVel[i*3+a] = (w[a] - w0[a])/Math.max(dt, .008)*.05 + tail[a]*(.16 + Math.random()*.32) + (Math.random() - .5)*.05;
    }
    pLife[i] = 0; pDur[i] = 2. + Math.random()*4.;
    pInfo[i*3+1] = (Math.random() < .04 ? 5 : 1.5) + Math.random()*1.8;
    pInfo[i*3+2] = Math.random();
    pTint[i] = b.ti;
  }
}
/* 날개 끝에서 가늘게 이어지는 가루 줄기 */
const WISPS = [[.50, 0, .97], [.30, 0, .98], [-1.02, 1, .97], [-.72, 1, .98]];  /* [각도, 0=앞날개 1=뒷날개, 반지름 비율] */
function spawnWisps(b, m, dt) {
  const tail = M.dir(m, 0, -1, -.3), n = Math.max(1, Math.round(3*dt*60*(b.dust === undefined ? 1 : b.dust)));
  for (const [th, hind, k] of WISPS) for (const side of [-1, 1]) for (let j = 0; j < n; j++) {
    const i = pNext; pNext = (pNext + 1) % NP;
    const r = (hind ? tabR(TAB_H, RNG_H, th) : tabR(TAB_F, RNG_F, th))*k;
    const l = wingLocal(r*Math.cos(th), (hind ? -.02 : .10) + r*Math.sin(th), side, b.phase - Math.random()*.25);
    const w = M.pt(m, l[0], l[1], l[2]);
    for (let a = 0; a < 3; a++) { pPos[i*3+a] = w[a] + (Math.random() - .5)*.012; pVel[i*3+a] = tail[a]*(.34 + Math.random()*.06) + (Math.random() - .5)*.012; }
    pLife[i] = 0; pDur[i] = 3. + Math.random()*2.5;
    pInfo[i*3+1] = 1.5 + Math.random()*1.0; pInfo[i*3+2] = .3 + Math.random()*.7; pTint[i] = b.ti;
  }
}
function stepParticles(dt, t) {
  for (let i = 0; i < NP; i++) {
    if (pLife[i] >= 1) { pInfo[i*3] = 1; continue; }
    pLife[i] += dt/pDur[i];
    const x = pPos[i*3], y = pPos[i*3+1], z = pPos[i*3+2];
    /* 소용돌이치는 흐름 */
    const fx = Math.sin(y*3.1 + t*.7) + Math.cos(z*2.7 - t*.4), fy = Math.sin(z*3.3 + t*.5) + Math.cos(x*2.9 + t*.6), fz = Math.sin(x*3.5 - t*.3) + Math.cos(y*2.5 + t*.8);
    pVel[i*3] += fx*.16*dt; pVel[i*3+1] += (fy*.16 - .03)*dt; pVel[i*3+2] += fz*.16*dt;
    const dr = Math.exp(-.4*dt);
    pVel[i*3] *= dr; pVel[i*3+1] *= dr; pVel[i*3+2] *= dr;
    pPos[i*3] = x + (pVel[i*3] + api.wind[0])*dt; pPos[i*3+1] = y + (pVel[i*3+1] + api.wind[1])*dt; pPos[i*3+2] = z + (pVel[i*3+2] + api.wind[2])*dt;
    pInfo[i*3] = Math.min(pLife[i], 1);
  }
}

/* ---------- 프레임 ---------- */
const tintList = Object.keys(TINTS);
butterflies.forEach(b => { b.ti = tintList.indexOf(b.tint) < 0 ? 0 : tintList.indexOf(b.tint); b.phase = b.off; b.prevPhase = b.off; b.prevM = null; });

function fsPass(p, dst, set) {
  gl.bindFramebuffer(gl.FRAMEBUFFER, dst ? dst.fb : null);
  gl.viewport(0, 0, dst ? dst.w : W, dst ? dst.h : H);
  gl.useProgram(p.p); set(); gl.bindVertexArray(fsVAO); gl.drawArrays(gl.TRIANGLES, 0, 3);
}
function bindTex(unit, tex, loc) { gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, tex); gl.uniform1i(loc, unit); }

let last = null, simT = 0;
function frame(now) {
  resize();
  let dt = last === null ? 1/60 : Math.min((now - last)/1000, .05); last = now;
  simulate(dt); draw();
  requestAnimationFrame(frame);
}
function simulate(dt) {
  simT += dt;
  for (const b of butterflies) {
    b.prevPhase = b.phase;
    /* 날갯짓 속도가 살짝씩 변함 */
    const hz = OPT.flapHz*(b.hzMul || 1)*(1 + .18*Math.sin(simT*.8 + b.off) + .1*Math.sin(simT*2.3 + b.off*2.));
    b.phase += dt*hz*Math.PI*2;
    b.m = modelOf(b, simT);
    if (!b.prevM) b.prevM = b.m;
    const down = Math.max(0, -Math.sin(b.phase)); /* 내려칠 때 더 많이 */
    spawn(b, b.m, b.prevM, dt, Math.round((14 + 55*down)*dt*60*(b.dust === undefined ? 1 : b.dust)/(butterflies.length > 1 ? 1.6 : 1)));
    spawnWisps(b, b.m, dt);
    b.prevM = b.m;
  }
  stepParticles(dt, simT);
}
function draw() {
  const asp = W/H;
  const VP = M.mul(M.persp(cam.fov, asp, .1, 50), M.trans(0, 0, -cam.z));
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbScene.fb); gl.viewport(0, 0, W, H);
  gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
  gl.disable(gl.DEPTH_TEST); gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE);

  for (const b of butterflies) {
    const T = TINTS[b.tint] || TINTS.gold, MVP = M.mul(VP, b.m);
    gl.useProgram(pWing.p); gl.bindVertexArray(wingVAO);
    gl.uniformMatrix4fv(pWing.u.uMVP, false, MVP);
    gl.uniform1f(pWing.u.uPhase, b.phase); gl.uniform1f(pWing.u.uDense, api.dense); gl.uniform1f(pWing.u.uTime, simT);
    gl.uniform1fv(pWing.u['uRF[0]'], TAB_F); gl.uniform1fv(pWing.u['uRH[0]'], TAB_H);
    gl.uniform3fv(pWing.u.uWarm, T.warm); gl.uniform3fv(pWing.u.uCool, T.cool);
    for (const side of [-1, 1]) {
      gl.uniform1f(pWing.u.uSide, side); gl.uniform1f(pWing.u.uSeed, b.seed + (side > 0 ? 0 : 17.3));
      gl.drawElements(gl.TRIANGLES, wingCount, gl.UNSIGNED_SHORT, 0);
    }
    /* 몸통: 몸 축을 따라 카메라를 보는 판 */
    const o = M.pt(b.m, 0, 0, 0), ax = M.dir(b.m, 0, 1, 0);
    const vd = [-o[0], -o[1], cam.z - o[2]];
    let sx = [ax[1]*vd[2] - ax[2]*vd[1], ax[2]*vd[0] - ax[0]*vd[2], ax[0]*vd[1] - ax[1]*vd[0]];
    const sl = Math.hypot(...sx) || 1, al = Math.hypot(...ax);
    sx = sx.map(v => v/sl*al);
    const quad = [[-.6, -.85], [.6, -.85], [.6, .9], [-.6, -.85], [.6, .9], [-.6, .9]];
    quad.forEach(([u, v], i) => { for (let a = 0; a < 3; a++) bodyData[i*5+a] = o[a] + (sx[a]*u + ax[a]*v)*.72 + ax[a]*.03; bodyData[i*5+3] = u; bodyData[i*5+4] = v; });
    gl.useProgram(pBody.p); gl.bindVertexArray(bodyVAO);
    gl.bindBuffer(gl.ARRAY_BUFFER, bodyBuf); gl.bufferSubData(gl.ARRAY_BUFFER, 0, bodyData);
    gl.uniformMatrix4fv(pBody.u.uVP, false, VP);
    gl.uniform3fv(pBody.u.uWarm, T.warm); gl.uniform3fv(pBody.u.uCool, T.cool); gl.uniform1f(pBody.u.uTime, simT);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }
  /* 가루 */
  gl.useProgram(pPt.p); gl.bindVertexArray(ptVAO);
  gl.bindBuffer(gl.ARRAY_BUFFER, ptPosBuf); gl.bufferSubData(gl.ARRAY_BUFFER, 0, pPos);
  gl.bindBuffer(gl.ARRAY_BUFFER, ptInfoBuf); gl.bufferSubData(gl.ARRAY_BUFFER, 0, pInfo);
  gl.uniformMatrix4fv(pPt.u.uVP, false, VP); gl.uniform1f(pPt.u.uPx, H/720*4.6);
  const T0 = TINTS[butterflies.length > 1 ? 'white' : butterflies[0].tint] || TINTS.gold;
  gl.uniform3fv(pPt.u.uWarm, T0.warm); gl.uniform3fv(pPt.u.uCool, T0.cool);
  gl.drawArrays(gl.POINTS, 0, NP);

  /* 빛 번짐 */
  gl.disable(gl.BLEND);
  const blur = (src, dst, dx, dy) => fsPass(pBlur, dst, () => { bindTex(0, src.tex, pBlur.u.uTex); gl.uniform2f(pBlur.u.uDir, dx, dy); });
  blur(fbScene, fbA1, 1.6/fbA1.w, 0); blur(fbA1, fbB1, 0, 1.6/fbB1.h);
  blur(fbB1, fbA2, 1.8/fbA2.w, 0);    blur(fbA2, fbB2, 0, 1.8/fbB2.h);
  blur(fbB2, fbA2, 2.6/fbA2.w, 0);    blur(fbA2, fbB2, 0, 2.6/fbB2.h);
  fsPass(pComp, null, () => {
    bindTex(0, fbScene.tex, pComp.u.uScene); bindTex(1, fbB1.tex, pComp.u.uB1); bindTex(2, fbB2.tex, pComp.u.uB2);
    gl.uniform1f(pComp.u.uOpaque, OPT.sky ? 0 : 1); gl.uniform1f(pComp.u.uDense, api.dense);
  });
}
const api = {
  dense: OPT.dense || 0,   /* 0 = 투명한 유리, 1 = 불투명에 가까운 날개 */
  wind: [0, 0, 0],          /* 가루 전체를 밀어내는 바람 */
  butterflies, simulate, draw, resize,
  /* 화면 픽셀 좌표를 나비가 있는 평면(z=0)의 좌표로 바꾼다 */
  toWorld(px, py) { const hh = cam.z*Math.tan(cam.fov/2), cw = canvas.clientWidth || innerWidth, ch = canvas.clientHeight || innerHeight;
    return [(px/cw*2 - 1)*hh*cw/ch, -(py/ch*2 - 1)*hh]; },
  unitsPerPx() { const hh = cam.z*Math.tan(cam.fov/2); return 2*hh/(canvas.clientHeight || innerHeight); },
  start() { requestAnimationFrame(frame); },
  clearDust() { pLife.fill(9); for (const b of butterflies) b.prevM = null; },
  advance(n) { for (let i = 0; i < n; i++) simulate(1/60); draw(); },
};
resize();
return api;
}
