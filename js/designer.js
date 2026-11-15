/* Designer (#designer) — 밝은 미술관 (2026-11-15)
   - 하나로 이어진 전시 공간: 왼쪽 = UX/UI · WEB 구역, 오른쪽 = VISUAL DESIGN 구역, 가운데는 아이보리 벽으로 자연스럽게 이어짐
   - 벽·바닥·받침대는 Three.js의 단순한 3D 도형. 석고상은 투명 배경 사진(assets/images/busts/01~15.webp)을 판에 붙인 2.5D
     (사진에 이미 빛과 그림자가 있어서 다시 조명하지 않음 → 어두워지지 않음. 카메라는 정면만 보고 옆으로만 움직여서 판의 옆면이 보이지 않음)
   - 분야별 벽 색은 벽 셰이더(아래 WALL_FS)가 그림: 석고상 위 조명이 벽에 번지는 자리에 색빛이 더 진하게 비침
   - 배경은 깔끔하게 (2026-11-16): 민 아이보리 벽 + 이음매 없는 바닥 + 석고상 위 은은한 조명. 가운데 벽에는 방향 사인(가는 글자 + 긴 화살표 선)
   - 이름표(이름 + '~디자이너')·벽 사인·버튼은 HTML. 매 프레임 3D 자리에 맞춰 옮겨서 석고상과 어긋나지 않음
   - 조작: ← → 버튼·키, 휴대폰은 손가락으로 옆으로 밀기, 마우스 휠, 벽 사인의 화살표(그 구역 첫 학생으로)
     움직임이 끝나면 가장 가까운 학생이 가운데에 딱 멈춤. 석고상이나 이름표를 누르면 그 학생 포트폴리오가 새 탭으로 열림
   - 학생 데이터는 js/data.js의 STUDENTS 한 곳만 고치면 됨 (designer: false 인 사람은 나오지 않음, field로 구역이 정해짐)
   - 3D가 안 되면(또는 주소에 ?dg=list) 같은 데이터로 만든 HTML 목록이 대신 나옴
   숫자를 바꾸고 싶으면 아래 DG만 고치면 됩니다 (단위: 1 = 대략 1m) */
const DG = {
  gap: 2.8,            // 석고상 사이 간격
  hub: 2.45,           // 가운데 벽 사인에서 양쪽 첫 학생까지 거리 (처음 화면 양 끝에 첫 학생이 보이게)
  endGap: 0.95,        // 마지막 학생에서 양 끝 옆벽까지 (간격의 몇 배)
  // 가운데 벽의 방향 사인(가는 글자 + 긴 화살표 선) 가운데 높이. 화면 가운데 높이의 ← → 버튼보다 위 (구역 첫 학생 앞에서 화면 끝에 걸려도 버튼과 안 겹침)
  way: { y: 2.3 },
  bustH: 1.9,          // 석고상 사진 높이
  ped: { w: 1.36, h: 1.12, d: 1.0 },   // 받침대 너비·높이·깊이
  pedRim: { h: 0.075, out: 0.045 },    // 받침대 위 덮개·아래 받침 두께와 튀어나온 정도
  turn: { delay: 0.7, angle: 0.24, speed: 0.42, fade: 2.2 }, // 가운데 학생 3D: 멈춘 뒤 몇 초 후 바뀔지, 도는 각도(라디안), 속도, 바뀌는 빠르기
  turnShade: 2.0, turnGlow: 0, turnMix: 0.65, // 3D 석고상: 빛을 받는 정도, 스스로 빛나는 정도, 석고색 맞춤 정도 (사진과 같은 색·밝기로 보이게 화면 색을 재서 맞춘 값)
  pedZ: 0.95,          // 벽에서 받침대 가운데까지 거리
  fov: 30,             // 카메라 화각 (작을수록 망원)
  viewDesk: 2.7,       // 데스크톱: 화면 가로에 석고상 몇 칸이 보일지
  viewMobile: 2.15,    // 모바일(세로 화면): 화면 가로 폭 (석고상 한 명이 꽉 차게)
  glide: 5.2,          // 이동 부드러움 (클수록 빨리 도착)
  wheel: 1,            // 휠 한 번에 움직이는 정도
  parallax: 0.1,       // 마우스를 움직이면 카메라가 아주 조금 따라감 (0 = 끔)
  colors: {
    ivory: '#efe8dc',  // 벽 기본색
    ux: '#b6c3d2',     // UX/UI 구역 벽 빛 (옅은 블루그레이)
    visual: '#efbea2', // Visual 구역 벽 빛 (옅은 피치·테라코타)
    floor: '#e6dfd4',  // 돌 바닥
    plaster: '#eae6df', // 석고상 색 기준: 사진·3D 석고상 모두 이 색 쪽으로 같은 만큼 맞춤 (그래서 사진 → 3D로 바뀌어도 색이 같음)
    stone: '#f4f2f0',  // 받침대: 석고상과 같은 석고 색 (화면에서 석고상과 같은 빛깔, 밝기는 조금 낮게 = 석고상이 돋보임)
  },
  tint: 0.62,          // 벽 색빛 진하기 (0 = 아이보리만)
  maxDpr: 2,           // 화면 선명도 상한 (휴대폰은 1.5)
};

const dg = {
  root: $('#designer'), stage: $('#dg-stage'), labels: $('#dg-labels'), list: $('#dg-list'),
  built: false, gl: null, people: [], x: null, tx: 0, at: 0, zoom: 0, tzoom: 0, mode: '', loading: false,
  ptr: { x: 0, y: 0, sx: 0, sy: 0 }, drag: null, wheelT: 0, raf: 0, dirty: true,
};
const DG_ZONE_TITLE = { uxui: 'UX/UI · WEB', visual: 'VISUAL DESIGN' };

/* 학생 줄 세우기 (데이터 한 곳에서): 가운데(x = 0)에 입구 아치와 안내판. UX/UI는 왼쪽으로, Visual은 오른쪽으로
   같은 분야 안에서는 data.js 순서대로 가운데에서 바깥으로. dg.people 순서 = UX/UI → Visual (상세 화면의 ← → 순서)
   dg.stops = 멈추는 자리를 왼쪽부터: UX/UI 바깥쪽 … UX/UI 첫 학생, 안내판(k = -1), Visual 첫 학생 … */
function dgPeople() {
  const all = STUDENTS.map((s, i) => ({ s, i })).filter(({ s }) => s.designer !== false && (s.field === 'uxui' || s.field === 'visual'));
  const ux = all.filter((p) => p.s.field === 'uxui'), vi = all.filter((p) => p.s.field === 'visual');
  const G = DG.gap, H = DG.hub;
  ux.forEach((p, n) => { p.x = -H - n * G; });
  vi.forEach((p, n) => { p.x = H + n * G; });
  const uxFar = ux.length ? ux.at(-1).x : -H, viFar = vi.length ? vi.at(-1).x : H;
  dg.zones = {
    uxui: { title: (uxFar - H) / 2, from: uxFar, to: -H, n: ux.length },
    visual: { title: (H + viFar) / 2, from: H, to: viFar, n: vi.length },
  };
  const people = [...ux, ...vi];
  dg.stops = [...people.map((p, k) => ({ x: p.x, k })), { x: 0, k: -1 }].sort((a, b) => a.x - b.x);
  dg.hubSi = dg.stops.findIndex((s) => s.k === -1);
  dg.ends = [Math.min(uxFar, -H) - G * DG.endGap, Math.max(viFar, H) + G * DG.endGap]; // 양 끝 옆벽 자리
  return people;
}
function dgOrder() { return dg.people.map((p) => p.i); } // 상세 화면의 ← → 순서

/* ---------- HTML: 이름표(받침대 앞: 이름 + '~디자이너' 한 줄), 가운데 벽 방향 사인, 구역 제목(벽) ----------
   석고상이나 이름표를 누르면 그 학생 포트폴리오가 새 탭으로 열림 (포트폴리오가 아직 없으면 아무 일도 없음) */
function dgBuild() {
  if (dg.built) return; dg.built = true;
  dg.people = dgPeople();
  const inner = (s) => `<b class="dg-name">${s.name}</b>${s.slogan ? `<span class="dg-slogan">${s.slogan}</span>` : ''}`;
  const cap = ({ s, i }, k) => `<div class="dg-cap" data-i="${i}" data-k="${k}" data-field="${s.field}">
      ${s.portfolio
        ? `<a class="dg-plaque" href="${s.portfolio}" target="_blank" rel="noopener" aria-label="${s.name}, ${s.slogan || ''}. 포트폴리오 새 탭으로 열기">${inner(s)}</a>`
        : `<div class="dg-plaque is-empty" tabindex="0" aria-label="${s.name}, ${s.slogan || ''}. 포트폴리오 준비 중">${inner(s)}</div>`}
    </div>`;
  const title = (z) => `<div class="dg-zone" data-zone="${z}" aria-hidden="true"><b>${DG_ZONE_TITLE[z]}</b><span>${dg.zones[z].n}명의 디자이너</span></div>`;
  // 가운데 벽의 방향 사인: 가는 검정 글자 + 밑줄(가는 쪽 끝은 화살촉, 반대쪽 끝은 위로 휘어 올라가는 곡선). 위 = 왼쪽 UX/UI, 아래 = 오른쪽 VISUAL. 누르면 그 구역 첫 학생 앞으로
  const Z = dg.zones;
  const sign = `<div class="dg-ways">
      <button type="button" class="dg-sign-hit dg-way is-l" data-zone="uxui" aria-label="왼쪽 UX/UI · WEB 구역 ${Z.uxui.n}명. 첫 학생 앞으로 가기"><span>UX/UI · WEB</span><svg aria-hidden="true" viewBox="0 0 230 46" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M10 31.5 L1.5 39 L10 46.5 M1.5 39 H196 C212 39 222 30 227 12"/></svg></button>
      <button type="button" class="dg-sign-hit dg-way is-r" data-zone="visual" aria-label="오른쪽 VISUAL DESIGN 구역 ${Z.visual.n}명. 첫 학생 앞으로 가기"><span>VISUAL DESIGN</span><svg aria-hidden="true" viewBox="0 0 230 46" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M10 31.5 L1.5 39 L10 46.5 M1.5 39 H196 C212 39 222 30 227 12"/></svg></button>
    </div>
    <div class="dg-hubcap" aria-hidden="true"><span class="dg-hint is-desk">← → 키, 마우스 휠로 둘러보세요</span><span class="dg-hint is-touch">옆으로 밀어 보세요</span></div>`;
  dg.labels.innerHTML = title('uxui') + title('visual') + sign + dg.people.map(cap).join('');
  dg.hubcap = $('.dg-hubcap', dg.labels); dg.ways = $('.dg-ways', dg.labels);
  dg.caps = $$('.dg-cap', dg.labels); dg.zoneEls = $$('.dg-zone', dg.labels);
  dg.signHits = $$('.dg-sign-hit', dg.labels);
  dg.labels.addEventListener('click', (e) => {
    const a = e.target.closest('.dg-sign-hit'); if (a) dgZone(a.dataset.zone); // 이름표(링크)는 브라우저가 새 탭으로 엶
  });
  // Tab으로 이름표에 오면 그 학생 앞으로, 안내판에 오면 가운데로 이동
  dg.labels.addEventListener('focusin', (e) => {
    const c = e.target.closest('.dg-cap');
    if (c) { if (+c.dataset.k !== dg.at || dg.hubOn || dg.zoom > 0.5) dgGoTo(+c.dataset.k); return; }
    if (e.target.closest('.dg-sign-hit') && (!dg.hubOn || dg.zoom > 0.5)) dgGoStop(dg.hubSi);
  });
  dg.x = 0; dg.tx = 0; dgMark(dg.hubSi, true); // 처음에는 가운데 벽 사인 앞
}

/* HTML 목록 (같은 데이터): 3D가 안 될 때 대신 보여 주고, 휴대폰에서 '전체'를 누르면 위에 겹쳐 보여 줌(overlay) */
function dgShowList(msg, overlay) {
  dg.overlay = !!overlay;
  if (!overlay) { dg.mode = 'list'; dg.root.classList.add('is-list'); }
  const group = (f) => `<section class="dg-list-group" data-field="${f}"><h3>${DG_ZONE_TITLE[f]} <small>${dg.zones[f].n}명</small></h3><ul>`
    + dg.people.filter((p) => p.s.field === f).map(({ s, i }) => `<li>
      <img src="${bustThumb(s)}" alt="" width="240" height="280" loading="lazy" decoding="async">
      <button type="button" class="dg-list-name" data-i="${i}" aria-label="${s.name} 학생 소개 열기"><b>${s.name}</b><span>${DG_ZONE_TITLE[s.field]}</span></button>
      <p>${s.slogan || ''}</p>
      ${s.portfolio ? `<a href="${s.portfolio}" target="_blank" rel="noopener">포트폴리오 ↗</a>` : '<span class="is-empty">포트폴리오 준비 중</span>'}
    </li>`).join('') + '</ul></section>';
  dg.list.innerHTML = `${overlay ? '<button type="button" class="dg-list-close">전시장으로 돌아가기</button>' : ''}${msg ? `<p class="dg-list-msg">${msg} <button type="button" class="dg-retry">다시 시도</button></p>` : ''}${group('uxui')}${group('visual')}`;
  dg.list.hidden = false;
  if (overlay) { dg.list.scrollTop = 0; $('.dg-list-close', dg.list).focus({ preventScroll: true }); }
}
function dgHideList() { dg.list.hidden = true; dg.overlay = false; dgMark(dg.si, false); }
dg.list.addEventListener('click', (e) => {
  const n = e.target.closest('.dg-list-name');
  if (n && dg.overlay) { const k = dg.people.findIndex((p) => p.i === +n.dataset.i); dgHideList(); dgGoTo(k, true); $('.dg-plaque', dg.caps[k]).focus({ preventScroll: true }); return; }
  if (n) openDetail(+n.dataset.i);
  if (e.target.closest('.dg-list-close')) { dgHideList(); dg.root.focus({ preventScroll: true }); }
  if (e.target.closest('.dg-retry')) { dg.list.hidden = true; dg.root.classList.remove('is-list'); dg.mode = ''; dgStart(); }
});

/* ---------- 3D 장면 ---------- */
const DG_WALL_VS = `varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position,1.); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`;
const DG_NOISE = `
float h21(vec2 p){ p = fract(p*vec2(123.34,456.21)); p += dot(p,p+45.32); return fract(p.x*p.y); }
float vnoise(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f);
  return mix(mix(h21(i),h21(i+vec2(1,0)),f.x), mix(h21(i+vec2(0,1)),h21(i+vec2(1,1)),f.x), f.y); }
float fbm(vec2 p){ float a=.5, s=0.; for(int i=0;i<4;i++){ s+=a*vnoise(p); p*=2.03; a*=.5; } return s; }`;
// 벽: 깔끔한 아이보리 한 면 (2026-11-16 정리: 판넬·몰딩·레일·창살 빛·이음선·아치 없앰)
//     + 석고상마다 천장 조명이 그리는 은은한 빛 원뿔(가운데 학생·마우스 올린 학생일수록 밝게) + 구역 색빛 + 바닥과 닿는 곳의 옅은 그늘
const DG_WALL_FS = `
uniform vec3 uIvory, uUx, uVi; uniform float uTint, uUxEnd, uViFrom, uGap, uFocus, uHovX, uHovA; uniform float uBx[16]; uniform int uN;
varying vec3 vW;${DG_NOISE}
float cone(float dx, float y){ // 천장 조명이 벽에 그리는 빛: 위는 좁고 아래로 갈수록 넓게 퍼짐
  float w = 0.2 + 0.34 * max(0., 4.6 - y);
  return exp(-dx * dx / (w * w) * 1.7) * smoothstep(0.3, 2.4, y) * (1. - 0.8 * smoothstep(3.3, 4.6, y));
}
void main(){
  float x = vW.x, y = vW.y;
  float pool = 0., spot = 0.;
  for (int i = 0; i < 16; i++) { if (i >= uN) break;
    float dx = x - uBx[i];
    pool += exp(-pow(dx / 1.25, 2.)) * exp(-pow((y - 2.55) / 1.6, 2.));
    float f = exp(-pow((uBx[i] - uFocus) / (uGap * .75), 2.));                     // 가운데 학생일수록 1
    float hv = uHovA * exp(-pow((uBx[i] - uHovX) / .4, 2.));                        // 마우스를 올린 학생
    spot += cone(dx, y) * (0.35 + 0.65 * f + 0.55 * hv);
  }
  pool = min(pool, 1.); spot = min(spot, 1.4);
  float v = smoothstep(-0.2, 2.4, y) * (1. - 0.35 * smoothstep(3.2, 6.5, y));   // 바닥 쪽은 살짝 어둡고, 위로 갈수록 은은하게
  vec3 c = uIvory * (0.86 + 0.05 * v + 0.04 * pool + 0.14 * spot);
  float wu = 1. - smoothstep(uUxEnd + uGap * .35, uUxEnd + uGap * 1.05, x);       // 0~1: UX/UI 구역
  float wv = smoothstep(uViFrom - uGap * 1.05, uViFrom - uGap * .35, x);          // 0~1: Visual 구역
  float spill = (0.38 + 0.62 * pool) * smoothstep(-0.4, 1.6, y) * (1. - 0.5 * smoothstep(3.4, 6., y));
  c = mix(c, uUx * (0.9 + 0.1 * pool), wu * spill * uTint);
  c = mix(c, uVi * (0.9 + 0.1 * pool), wv * spill * uTint);
  c *= 0.992 + 0.016 * vnoise(vW.xy * 14.);                                       // 아주 고운 벽 질감
  c *= 1. - 0.07 * exp(-y * 10.);                                                  // 바닥과 닿는 곳
  gl_FragColor = vec4(c, 1.);
}`;
// 바닥: 이음매 없는 밝은 돌 바닥 + 벽 쪽 그늘 + 벽 색빛이 바닥에 살짝 비침
const DG_FLOOR_FS = `
uniform vec3 uFloor, uUx, uVi; uniform float uTint, uUxEnd, uViFrom, uGap, uFocus, uHovX, uHovA; uniform float uBx[16]; uniform int uN;
varying vec3 vW;${DG_NOISE}
void main(){
  vec2 p = vW.xz;
  vec3 c = uFloor * 0.93 * (0.985 + 0.03 * fbm(p * 1.6));
  float z = vW.z;
  c *= 1. - 0.08 * exp(-z * 8.) - 0.04 * exp(-z * 1.2);                           // 벽 가까이 어둡게 (모서리)
  float wu = 1. - smoothstep(uUxEnd + uGap * .35, uUxEnd + uGap * 1.05, p.x);
  float wv = smoothstep(uViFrom - uGap * 1.05, uViFrom - uGap * .35, p.x);
  float b = exp(-z * .9) * uTint * .5;
  c = mix(c, uUx, wu * b * .45); c = mix(c, uVi, wv * b * .45);
  float pool = 0.;                                                                // 받침대 앞 바닥에 비친 은은한 빛
  for (int i = 0; i < 16; i++) { if (i >= uN) break; float dx = (p.x - uBx[i]) / 1.3;
    float f = 0.4 + 0.6 * exp(-pow((uBx[i] - uFocus) / (uGap * .75), 2.)) + 0.4 * uHovA * exp(-pow((uBx[i] - uHovX) / .4, 2.));
    pool += exp(-dx*dx) * exp(-pow((z - 2.2) / 1.5, 2.)) * f; }
  c *= 1. + 0.1 * min(pool, 1.2);
  c *= 1. - 0.06 * smoothstep(4., 12., z);                                         // 카메라 쪽 바닥은 조금 차분하게
  gl_FragColor = vec4(c, 1.);
}`;

function dgSoftTex(THREE, kind, blur) {
  const n = 128, cv = document.createElement('canvas'); cv.width = cv.height = n;
  const c = cv.getContext('2d'), m = n * blur;
  if (kind === 'ellipse') {
    const g = c.createRadialGradient(n / 2, n / 2, 0, n / 2, n / 2, n / 2);
    g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(0.5, 'rgba(0,0,0,.55)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = g; c.fillRect(0, 0, n, n);
  } else {
    // 가운데는 진하고 가장자리로 갈수록 흐려지는 사각형: 가로·세로 그라데이션을 곱함
    const img = c.createImageData(n, n), e = (v) => Math.min(1, Math.max(0, v / m));
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
      const a = e(Math.min(x, n - 1 - x)) * e(Math.min(y, n - 1 - y)), s = a * a * (3 - 2 * a);
      img.data[(y * n + x) * 4 + 3] = Math.round(s * 255);
    }
    c.putImageData(img, 0, 0);
  }
  const t = new THREE.CanvasTexture(cv); return t;
}
/* 안내판 화살표 판 앞면 그림: 황동(위가 밝고 가운데가 조금 어두운 금속) + 가는 결 + 안쪽 테두리 + 새긴 글자(구역 이름·인원)
   그림 좌표 = 판 모양 좌표(m)를 그대로 늘린 것 (dir -1: 왼쪽이 화살표 끝, 1: 오른쪽이 끝) */
function dgStoneTex(THREE) {
  const n = 256, cv = document.createElement('canvas'); cv.width = cv.height = n;
  // 석고 표면: 결·점무늬 없이, 아주 옅게 얼룩진 큰 무늬 + 고운 입자 (석고상과 같은 재료처럼 보이게)
  const c = cv.getContext('2d'); c.fillStyle = '#fff'; c.fillRect(0, 0, n, n);
  for (let k = 0; k < 40; k++) { // 큰 얼룩 (손으로 바른 석고의 미세한 농담)
    const x = Math.random() * n, y = Math.random() * n, r = 30 + Math.random() * 60, g = c.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, `rgba(236,232,226,${.12 + Math.random() * .1})`); g.addColorStop(1, 'rgba(236,232,226,0)');
    for (const dx of [-n, 0, n]) for (const dy of [-n, 0, n]) { c.save(); c.translate(dx, dy); c.fillStyle = g; c.fillRect(x - r, y - r, r * 2, r * 2); c.restore(); } // 이음매 없이 반복
  }
  const im = c.getImageData(0, 0, n, n), d = im.data;
  for (let i = 0; i < d.length; i += 4) { const e = (Math.random() - .5) * 3; d[i] += e; d[i + 1] += e; d[i + 2] += e; } // 아주 고운 입자 (진하면 천 무늬처럼 보임)
  c.putImageData(im, 0, 0);
  const t = new THREE.CanvasTexture(cv); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; return t;
}
/* 석고상 실루엣으로 만든 흐린 그림자 (벽에 비치는 그림자) */
function dgBustShadow(THREE, img) {
  const w = 40, h = 46, pad = 10, cv = document.createElement('canvas');
  cv.width = w + pad * 2; cv.height = h + pad * 2;
  const c = cv.getContext('2d'); c.drawImage(img, pad, pad, w, h);
  c.globalCompositeOperation = 'source-in'; c.fillStyle = '#000'; c.fillRect(0, 0, cv.width, cv.height);
  const big = document.createElement('canvas'); big.width = 120; big.height = 138;
  const b = big.getContext('2d'); b.imageSmoothingQuality = 'high'; b.drawImage(cv, 0, 0, big.width, big.height); // 작은 그림을 늘리면 흐려짐
  return { tex: new THREE.CanvasTexture(big), sx: cv.width / w, sy: cv.height / h };
}

function dgSupportsGL() {
  try { const c = document.createElement('canvas'); return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl'))); } catch (e) { return false; }
}

async function dgStart() {
  if (dg.gl || dg.loading || dg.mode === 'list') return;
  if (/[?&]dg=list\b/.test(location.search)) { dgShowList(''); return; }
  if (!dgSupportsGL()) { dgShowList('이 기기에서는 3D 전시장을 열 수 없어서 목록으로 보여 드려요.'); return; }
  dg.loading = true; dg.root.classList.add('is-loading');
  let THREE;
  try { THREE = await import('three'); }
  catch (e) { dg.loading = false; dg.root.classList.remove('is-loading'); dgShowList('3D 전시장을 불러오지 못했어요. 인터넷 연결을 확인한 뒤 다시 시도해 주세요.'); return; }
  dg.loading = false; dg.root.classList.remove('is-loading');
  if (page !== 'designer' || dg.gl) return; // 불러오는 사이 다른 화면으로 갔으면 만들지 않음
  try { dgCreate(THREE); }
  catch (e) { console.warn(e); dgDispose(); dgShowList('3D 전시장을 열지 못했어요.'); return; }
  dgLoop();
}

function dgCreate(THREE) {
  const mobile = matchMedia('(pointer:coarse)').matches;
  const r = new THREE.WebGLRenderer({ antialias: (devicePixelRatio || 1) < 2, alpha: false, powerPreference: 'low-power' });
  r.setPixelRatio(Math.min(devicePixelRatio || 1, mobile ? 1.5 : DG.maxDpr));
  r.setClearColor(DG.colors.ivory);
  dg.stage.appendChild(r.domElement);
  const scene = new THREE.Scene(), cam = new THREE.PerspectiveCamera(DG.fov, 1, 0.1, 200);
  const G = dg.gl = { THREE, r, scene, cam, list: [], busts: [], ray: new THREE.Raycaster(), v: new THREE.Vector3() };
  const keep = (o) => { G.list.push(o); return o; }; // 나중에 dispose할 것들
  const P = dg.people, xs = P.map((p) => p.x), Z = dg.zones;
  const left = Math.min(...xs, 0) - 40, right = Math.max(...xs, 0) + 40, len = right - left, mid = (left + right) / 2;
  const col = (h) => new THREE.Color(h);
  const lin = (h) => { const c = new THREE.Color(h); return new THREE.Vector3(c.r, c.g, c.b); }; // 셰이더 색: 화면에 그대로 나가는 값(sRGB)
  const bx = new Float32Array(16); xs.slice(0, 15).forEach((x, k) => { bx[k] = x; }); bx[Math.min(15, xs.length)] = 0; // 마지막 칸 = 가운데 안내판 조명
  const common = { uUx: { value: lin(DG.colors.ux) }, uVi: { value: lin(DG.colors.visual) }, uTint: { value: DG.tint },
    uUxEnd: { value: Z.uxui.to }, uViFrom: { value: Z.visual.from }, uGap: { value: DG.gap }, uBx: { value: bx }, uN: { value: Math.min(16, xs.length + 1) },
    uFocus: { value: dg.x }, uHovX: { value: 0 }, uHovA: { value: 0 } };
  G.common = common; // 매 프레임 uFocus(카메라가 보는 곳)·마우스 올린 학생을 바꿈 (벽·바닥이 같은 값을 나눠 씀)
  // THREE.Color는 '#hex'를 받을 때 선형으로 바꿔 둠 → 셰이더에서 바로 내보낼 sRGB 값으로 되돌림
  for (const k of ['uUx', 'uVi']) common[k].value.set(...new THREE.Color(k === 'uUx' ? DG.colors.ux : DG.colors.visual).convertLinearToSRGB().toArray());
  const srgb = (h) => new THREE.Vector3(...new THREE.Color(h).convertLinearToSRGB().toArray());

  // 벽
  const wallMat = keep(new THREE.ShaderMaterial({ vertexShader: DG_WALL_VS, fragmentShader: DG_WALL_FS, uniforms: { ...common, uIvory: { value: srgb(DG.colors.ivory) } } }));
  const wallGeo = keep(new THREE.PlaneGeometry(len, 30));
  const wall = new THREE.Mesh(wallGeo, wallMat); wall.position.set(mid, 15, 0); scene.add(wall);
  // 바닥
  const floorMat = keep(new THREE.ShaderMaterial({ vertexShader: DG_WALL_VS, fragmentShader: DG_FLOOR_FS, uniforms: { ...common, uFloor: { value: srgb(DG.colors.floor) } } }));
  const floorGeo = keep(new THREE.PlaneGeometry(len, 300));
  const floor = new THREE.Mesh(floorGeo, floorMat); floor.rotation.x = -Math.PI / 2; floor.position.set(mid, 0, 150); scene.add(floor);

  // 받침대: 아래 받침 + 몸통 + 위 덮개 (위아래가 조금 튀어나온 대리석 받침). 빛은 왼쪽 위 앞(창문 쪽)에서 → 석고상 사진의 빛 방향과 맞춤
  scene.add(new THREE.HemisphereLight(0xfffcf7, 0xd6cec2, 1.7));
  const sun = new THREE.DirectionalLight(0xfff6ea, 1.55); sun.position.set(-3, 5, 6); scene.add(sun);
  const stone = keep(dgStoneTex(THREE));
  const pedMat = keep(new THREE.MeshLambertMaterial({ color: col(DG.colors.stone), map: stone }));
  const { w: pw, h: ph, d: pd } = DG.ped, rim = DG.pedRim;
  const pedGeo = keep(new THREE.BoxGeometry(pw, ph - rim.h * 2, pd));
  const capGeo = keep(new THREE.BoxGeometry(pw + rim.out * 2, rim.h, pd + rim.out * 2));
  const footGeo = keep(new THREE.BoxGeometry(pw + rim.out * 2.6, rim.h, pd + rim.out * 2.6));
  // 그림자 무늬들
  const softRect = keep(dgSoftTex(THREE, 'rect', 0.32)), softTight = keep(dgSoftTex(THREE, 'rect', 0.12)), ell = keep(dgSoftTex(THREE, 'ellipse'));
  const shMat = (tex, o) => keep(new THREE.MeshBasicMaterial({ color: 0x3a2e22, alphaMap: tex, transparent: true, opacity: o, depthWrite: false }));
  const floorSh = shMat(softRect, 0.3), floorAO = shMat(softTight, 0.24), wallSh = shMat(softRect, 0.13), topSh = shMat(ell, 0.22);
  const unit = keep(new THREE.PlaneGeometry(1, 1));
  const bw = DG.bustH * 480 / 560; // 사진 비율 480×560
  const bustGeo = keep(new THREE.PlaneGeometry(bw, DG.bustH)); bustGeo.translate(0, DG.bustH / 2, 0);
  P.forEach((p, k) => {
    const g = new THREE.Group(); g.position.set(p.x, 0, 0); scene.add(g);
    const ped = new THREE.Mesh(pedGeo, pedMat); ped.position.set(0, ph / 2, DG.pedZ); ped.userData.k = k; g.add(ped);
    const cap = new THREE.Mesh(capGeo, pedMat); cap.position.set(0, ph - rim.h / 2, DG.pedZ); cap.userData.k = k; g.add(cap);
    const foot = new THREE.Mesh(footGeo, pedMat); foot.position.set(0, rim.h / 2, DG.pedZ); foot.userData.k = k; g.add(foot);
    const fl = (m, w, d, x, z) => { const s = new THREE.Mesh(unit, m); s.rotation.x = -Math.PI / 2; s.scale.set(w, d, 1); s.position.set(x, 0.003, z); s.renderOrder = 1; g.add(s); return s; };
    fl(floorSh, pw * 1.75, pd * 1.6, 0.22, DG.pedZ - 0.08);      // 받침대 아래 넓게 퍼진 그림자 (빛이 왼쪽에서 와서 오른쪽으로 조금 밀림)
    fl(floorAO, pw * 1.1, pd * 1.12, 0.03, DG.pedZ);              // 바닥에 닿는 곳의 진한 그늘
    const ws = new THREE.Mesh(unit, wallSh); ws.scale.set(pw * 1.3, ph * 1.25, 1); ws.position.set(0.5, ph * 0.5, 0.004); ws.renderOrder = 1; g.add(ws); // 벽에 비친 받침대 그림자
    const ts = new THREE.Mesh(unit, topSh); ts.rotation.x = -Math.PI / 2; ts.scale.set(bw * 0.62, pd * 0.62, 1); ts.position.set(0.02, ph + 0.003, DG.pedZ); ts.renderOrder = 1; g.add(ts); // 석고상 발 밑 그늘
    G.busts[k] = { g, ped, parts: [ped, cap, foot], k, loaded: false };
  });
  G.bustGeo = bustGeo; G.unit = unit; G.bw = bw;
  // 양 끝 옆벽: 전시가 여기서 끝남. 빛이 왼쪽에서 와서 왼쪽 끝 벽(오른쪽을 봄)은 그늘, 오른쪽 끝 벽은 밝게
  dg.ends.forEach((x, n) => {
    const iv = col(DG.colors.ivory).multiplyScalar(n === 0 ? 0.74 : 0.9);
    const m = keep(new THREE.MeshBasicMaterial({ color: iv }));
    const side = new THREE.Mesh(keep(new THREE.PlaneGeometry(400, 30)), m);
    side.rotation.y = n === 0 ? Math.PI / 2 : -Math.PI / 2; side.position.set(x, 15, 200); scene.add(side);
    const sk = new THREE.Mesh(keep(new THREE.PlaneGeometry(400, 0.16)), keep(new THREE.MeshBasicMaterial({ color: iv.clone().multiplyScalar(0.92) })));
    sk.rotation.y = side.rotation.y; sk.position.set(x + (n === 0 ? 0.002 : -0.002), 0.08, 200); scene.add(sk); // 옆벽 걸레받이
  });
  G.turn = { k: -1, model: null, mats: [], a: 0, loading: false, since: 0, t0: 0 }; // 가운데 학생 3D로 천천히 돌기
  G.hov = { k: -1, x: 0, a: 0 };
  dg.dirty = true;
  dgResize();
  dgLoadBusts();
}

/* 석고상 사진: 지금 보이는 자리에서 가까운 것부터 차례로 불러옴 */
function dgLoadBusts() {
  const G = dg.gl; if (!G) return;
  const order = G.busts.map((b) => b.k).sort((a, b) => Math.abs(dg.people[a].x - dg.tx) - Math.abs(dg.people[b].x - dg.tx));
  let running = 0, next = 0;
  const pump = () => {
    while (running < 3 && next < order.length) {
      const k = order[next++], b = G.busts[k]; if (b.loaded) continue;
      running++;
      const img = new Image(); img.decoding = 'async'; img.src = bustThumb(dg.people[k].s);
      const done = () => { running--; if (dg.gl === G) pump(); };
      img.decode().then(() => { if (dg.gl === G) dgAddBust(b, img); done(); }, done);
    }
  };
  pump();
}
/* 석고상 색 맞춤 (셰이더 조각): 밝기는 그대로 두고 색을 DG.colors.plaster 쪽으로 45% 섞음. 사진과 3D가 같은 식을 씀 */
function dgPlasterMix(v, cap, amt) {
  return `{ float l = dot(${v}, vec3(.2126,.7152,.0722)); vec3 iv = uIvory / dot(uIvory, vec3(.2126,.7152,.0722));
    ${v} = mix(${v}, min(l * iv * 1.04, ${cap}), ${amt}); }`;
}
function dgAddBust(b, img) {
  const G = dg.gl, { THREE } = G;
  const tex = new THREE.Texture(img); tex.colorSpace = THREE.SRGBColorSpace; tex.premultiplyAlpha = true; // 가장자리가 검게 번지지 않게
  tex.anisotropy = 4; tex.needsUpdate = true; G.list.push(tex);
  // 사진의 빛은 그대로 두고(다시 조명하지 않음), 색만 아이보리 쪽으로 살짝 맞춰서 15개가 같은 석고 색으로 보이게
  const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, premultipliedAlpha: true, depthWrite: false, toneMapped: false });
  mat.onBeforeCompile = (sh) => {
    sh.uniforms.uIvory = { value: new THREE.Color(DG.colors.plaster) };
    sh.fragmentShader = 'uniform vec3 uIvory;\n' + sh.fragmentShader.replace('#include <map_fragment>', `#include <map_fragment>
      ${dgPlasterMix('diffuseColor.rgb', 'vec3(diffuseColor.a)', '.45')}`);
  };
  G.list.push(mat);
  const m = new THREE.Mesh(G.bustGeo, mat); m.position.set(0, DG.ped.h, DG.pedZ); m.renderOrder = 3; m.userData.k = b.k; b.g.add(m); b.bust = m;
  // 벽에 비친 석고상 그림자 (실루엣을 흐리게)
  const sh = dgBustShadow(THREE, img); G.list.push(sh.tex);
  const smat = new THREE.MeshBasicMaterial({ color: 0x3a2e22, alphaMap: sh.tex, transparent: true, opacity: 0.16, depthWrite: false }); G.list.push(smat);
  const s = new THREE.Mesh(G.unit, smat); s.scale.set(G.bw * sh.sx * 1.08, DG.bustH * sh.sy * 1.08, 1);
  s.position.set(0.62, DG.ped.h + DG.bustH * 0.5 + 0.05, 0.005); s.renderOrder = 2; b.g.add(s);
  b.loaded = true; dg.dirty = true;
}

/* 화면 크기에 맞춰 카메라 거리·높이 정하기: 위쪽 메뉴 아래부터 석고상이 크게, 아래에는 소개 글 자리 */
function dgResize() {
  const G = dg.gl; if (!G) return;
  const w = dg.stage.clientWidth || innerWidth, h = dg.stage.clientHeight || innerHeight;
  G.r.setSize(w, h, false); G.cam.aspect = w / h; G.cam.updateProjectionMatrix();
  const tan = Math.tan(DG.fov * Math.PI / 360), portrait = w / h < 0.85;
  const top = portrait ? 127 : 124; // 석고상 위쪽 여백 (위 메뉴가 있던 때와 같은 구도)
  const below = portrait ? Math.min(230, h * 0.27) : Math.min(190, Math.max(130, h * 0.2)); // 받침대 아래 소개 글 자리
  const contentH = DG.ped.h + DG.bustH + 0.12;
  const W = portrait ? DG.viewMobile : DG.gap * DG.viewDesk;
  const dW = W / (2 * tan * G.cam.aspect), dH = contentH / (2 * tan * ((h - top - below) / h));
  const d = Math.max(dW, dH);
  const upp = 2 * d * tan / h; // 석고상 깊이에서 화면 1px = 몇 m
  const ys = (top + (h - below)) / 2; // 석고상+받침대의 가운데가 올 화면 높이
  G.base = { d, camY: clamp(contentH / 2 - (h / 2 - ys) * upp, 0.7, 2.4), upp, w, h, portrait };
  // '전체' 보기: 전시장 전체가 들어오게 뒤로 물러남 (너무 작아지지 않게 상한)
  const [first, last] = dg.ends, all = last - first + DG.gap * 0.3; // 양 끝 옆벽까지 다 들어오게
  const dAll = all / (2 * tan * G.cam.aspect);
  G.far = { d: Math.min(dAll, d * (portrait ? 3.2 : 7)), cx: (first + last) / 2 };
  // 전체 보기에서는 카메라를 낮추고 화면을 위로 밀어서, 석고상 줄은 화면 아래쪽에, 위쪽은 색빛이 번진 벽이 채움
  const uppFar = 2 * G.far.d * tan / h, fy = 1.05;
  G.far.y = fy; G.far.shift = h * (portrait ? 0.6 : 0.64) - (h / 2 - (contentH / 2 - fy) / uppFar);
  dg.root.classList.toggle('is-portrait', portrait);
  dg.dirty = true;
}

/* 카메라 위치 (zoom 0 = 학생 앞, 1 = 전체 보기) */
function dgCamera() {
  const G = dg.gl, B = G.base, z = dg.zoom, e = z * z * (3 - 2 * z);
  const d = B.d + (G.far.d - B.d) * e, y = B.camY + (G.far.y - B.camY) * e;
  if (e > 0) G.cam.setViewOffset(B.w, B.h, 0, -G.far.shift * e, B.w, B.h); else G.cam.clearViewOffset();
  const px = reduce ? 0 : dg.ptr.sx * DG.parallax, py = reduce ? 0 : dg.ptr.sy * DG.parallax * 0.5;
  G.cam.position.set(dg.x + px, y - py, DG.pedZ + d);
  G.cam.lookAt(dg.x + px, y - py, DG.pedZ); // 언제나 벽을 정면으로 봄 (회전 없음)
  G.cam.updateMatrixWorld();
}

/* HTML 이름표를 받침대 자리에 맞춰 옮김 */
function dgPlaceLabels() {
  const G = dg.gl, { cam, v } = G, w = G.base.w, h = G.base.h;
  const proj = (x, y, z) => { v.set(x, y, z).project(cam); return [(v.x + 1) / 2 * w, (1 - v.y) / 2 * h]; };
  const front = DG.pedZ + DG.ped.d / 2;
  const ppu = (proj(1, 0, front)[0] - proj(0, 0, front)[0]); // 받침대 앞면에서 1m = 몇 px
  const s = clamp(ppu / 185, 0.3, 1.35);
  dg.root.style.setProperty('--s', s.toFixed(3));
  dg.root.classList.toggle('is-far', dg.zoom > 0.5);
  dg.caps.forEach((el, k) => {
    const p = dg.people[k], [x, y] = proj(p.x, DG.ped.h * 0.62, front), [, yb] = proj(p.x, 0, front);
    const off = x < -w * 0.5 || x > w * 1.5;
    el.style.transform = `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0)`;
    el.style.setProperty('--drop', (yb - y).toFixed(1) + 'px');
    el.classList.toggle('off', off);
    el.classList.toggle('is-at', k === dg.at && !dg.hubOn && dg.zoom < 0.5);
    el.classList.toggle('is-hover', k === G.hov.k);
  });
  // 가운데 벽의 방향 사인 (글자 크기는 벽 깊이 기준 배율 --ws)
  { const [x, y] = proj(0, DG.way.y, 0), ws = clamp((proj(1, 0, 0)[0] - proj(0, 0, 0)[0]) / 185, 0.3, 1.35);
    dg.ways.style.transform = `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0)`; dg.ways.style.setProperty('--ws', ws.toFixed(3));
    const r = dg.ways.getBoundingClientRect(), off = r.right < 0 || r.left > w || dg.zoom > 0.5;
    dg.signHits.forEach((el) => el.classList.toggle('off', off)); }
  // 사인 아래 바닥: 조작 방법 (학생 소개 글과 같은 높이쯤). 사인 앞에 있을 때만
  { const [x, y] = proj(0, 0, DG.pedZ + 0.36); dg.hubcap.style.transform = `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0)`;
    dg.hubcap.classList.toggle('off', !dg.hubOn || dg.zoom > 0.5 || Math.abs(dg.x) > DG.gap * 0.5); }
  // 구역 제목: 학생 앞에서는 안내판이 대신하므로 숨기고, 전체 보기에서만 구역 한가운데 위쪽 벽에
  const e = dg.zoom * dg.zoom * (3 - 2 * dg.zoom);
  dg.zoneEls.forEach((el) => {
    const z = dg.zones[el.dataset.zone], [x, y] = proj(z.title, DG.ped.h + DG.bustH * 1.82, 0);
    el.style.transform = `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0)`;
    el.classList.toggle('off', e < 0.5);
  });
}

function dgLoop() {
  cancelAnimationFrame(dg.raf);
  let last = performance.now();
  const step = (t) => {
    if (!dg.gl) return;
    dg.raf = requestAnimationFrame(step);
    if (document.hidden) { last = t; return; }
    const dt = Math.min(0.05, (t - last) / 1000); last = t;
    const k = reduce ? 1 : 1 - Math.exp(-dt * DG.glide);
    const ox = dg.x, oz = dg.zoom, osx = dg.ptr.sx, osy = dg.ptr.sy;
    if (!dg.drag) dg.x += (dg.tx - dg.x) * k;
    dg.zoom += (dg.tzoom - dg.zoom) * k;
    if (Math.abs(dg.tx - dg.x) < 1e-4) dg.x = dg.tx;
    if (Math.abs(dg.tzoom - dg.zoom) < 1e-4) dg.zoom = dg.tzoom;
    const pk = 1 - Math.exp(-dt * 3);
    dg.ptr.sx += (dg.ptr.x - dg.ptr.sx) * pk; dg.ptr.sy += (dg.ptr.y - dg.ptr.sy) * pk;
    const H = dg.gl.hov, oh = H.a;
    H.a += ((H.k >= 0 ? 1 : 0) - H.a) * (reduce ? 1 : 1 - Math.exp(-dt * 8)); if (Math.abs(H.a - (H.k >= 0 ? 1 : 0)) < 1e-3) H.a = H.k >= 0 ? 1 : 0;
    const turning = dgTurn(dt, t / 1000);
    const moved = dg.dirty || ox !== dg.x || oz !== dg.zoom || Math.abs(osx - dg.ptr.sx) > 1e-4 || Math.abs(osy - dg.ptr.sy) > 1e-4 || oh !== H.a || turning;
    if (!moved) return; // 멈춰 있으면 다시 그리지 않음 (배터리 아낌)
    dg.dirty = false;
    dgCamera(); dgPlaceLabels(); dgLights();
    dg.gl.r.render(dg.gl.scene, dg.gl.cam);
  };
  dg.raf = requestAnimationFrame(step);
}

/* 조명: 카메라가 보는 학생(가운데)일수록 벽의 빛 원뿔이 밝고, 마우스를 올린 학생은 더 밝게 (벽·바닥 셰이더가 같은 값을 씀) */
function dgLights() {
  const G = dg.gl, C = G.common, H = G.hov, e = dg.zoom * dg.zoom * (3 - 2 * dg.zoom);
  C.uFocus.value = dg.x; C.uHovX.value = H.x; C.uHovA.value = H.a * (1 - e);
}

/* 가운데에 멈춘 학생: 잠시 뒤 사진이 3D 석고상으로 바뀌어 좌우로 천천히 돎. 움직이기 시작하면 다시 사진으로 (움직임 줄이기에서는 안 함)
   돌아가는 중이면 true (계속 다시 그려야 함) */
function dgTurn(dt, time) {
  const G = dg.gl, T = G.turn, C = DG.turn;
  if (reduce || typeof loadModel !== 'function') return false;
  const settled = !dg.drag && !dg.hubOn && dg.zoom < 0.02 && Math.abs(dg.tx - dg.x) < 0.01 && Math.abs(dg.x - dg.people[dg.at].x) < 0.05;
  T.since = settled ? T.since + dt : 0;
  const want = settled && T.since > C.delay ? dg.at : -1;
  if (want >= 0 && T.k !== want && T.a < 1e-3 && !T.loading) dgTurnLoad(want);
  const target = want >= 0 && T.k === want && T.model ? 1 : 0, oa = T.a;
  T.a += (target - T.a) * (1 - Math.exp(-dt * C.fade)); if (Math.abs(target - T.a) < 2e-3) T.a = target;
  if (!T.model) return false;
  T.model.visible = T.a > 0;
  T.mats.forEach((m) => { m.opacity = T.a; });
  const b = G.busts[T.k]; if (b.bust) b.bust.material.opacity = 1 - T.a;
  T.model.rotation.y = C.angle * Math.sin((time - T.t0) * C.speed);
  if (T.a === 0 && target === 0) { dgTurnDrop(); return oa !== 0; }
  return true;
}
function dgTurnLoad(k) {
  const G = dg.gl, T = G.turn, url = MODELS[dg.people[k].s.name];
  dgTurnDrop(); T.k = k;
  if (!url || (navigator.connection && navigator.connection.saveData)) return; // 3D 파일이 없거나 데이터 절약 모드면 사진 그대로
  T.loading = true;
  loadModel(url).then((tpl) => {
    T.loading = false;
    if (dg.gl !== G || T.k !== k) return;
    const { THREE } = G, m = tpl.clone(true);
    m.traverse((o) => {
      if (!o.isMesh) return;
      // 빛을 받는 정도(turnShade) + 그늘 쪽이 너무 어두워지지 않게 스스로 빛나는 정도(turnGlow). 마지막에 사진과 같은 석고색 맞춤(dgPlasterMix)
      const mt = new THREE.MeshLambertMaterial({ map: o.material.map, color: new THREE.Color().setScalar(DG.turnShade), transparent: true, opacity: 0,
        emissive: new THREE.Color(1, 1, 1), emissiveMap: o.material.map, emissiveIntensity: DG.turnGlow });
      mt.onBeforeCompile = (sh) => {
        sh.uniforms.uIvory = { value: new THREE.Color(DG.colors.plaster) }; sh.uniforms.uMix = { value: DG.turnMix }; mt.userData.sh = sh;
        sh.fragmentShader = 'uniform vec3 uIvory; uniform float uMix;\n' + sh.fragmentShader.replace('#include <opaque_fragment>', `${dgPlasterMix('outgoingLight', 'vec3(1.)', 'uMix')}
      #include <opaque_fragment>`);
      };
      o.material = mt; T.mats.push(mt); o.renderOrder = 3;
    });
    m.scale.setScalar(DG.bustH * 1100 / 1120); // 사진 안 석고상 높이(1100/1120)와 같게
    m.position.set(0, DG.ped.h, DG.pedZ); m.visible = false;
    G.busts[k].g.add(m); T.model = m; T.t0 = performance.now() / 1000; dg.dirty = true;
  }, (e) => { T.loading = false; console.warn('3D 석고상을 불러오지 못해 사진으로 보여 줘요', e); });
}
function dgTurnDrop() {
  const G = dg.gl, T = G.turn;
  if (T.model) { T.model.removeFromParent(); T.mats.forEach((m) => m.dispose()); }
  if (T.k >= 0 && G.busts[T.k] && G.busts[T.k].bust) G.busts[T.k].bust.material.opacity = 1;
  T.model = null; T.mats = []; T.a = 0; T.k = -1;
}

/* ---------- 이동: 멈추는 자리(dg.stops) 기준. si = stops 번호, k = 학생 번호(안내판은 k = -1) ---------- */
function dgNearestStop(x) {
  let best = 0, bd = Infinity;
  dg.stops.forEach((s, i) => { const d = Math.abs(s.x - x); if (d < bd) { bd = d; best = i; } });
  return best;
}
/* 위치는 그대로 두고 '지금 자리'만 정함: 좌우 버튼, 위 메뉴 표시, 화면 읽기 프로그램 안내 */
function dgMark(si, announce) {
  dg.si = clamp(si, 0, dg.stops.length - 1);
  const s = dg.stops[dg.si], near = dg.zoom < 0.5;
  dg.hubOn = s.k < 0; if (!dg.hubOn) dg.at = s.k;
  $('#dg-prev').disabled = dg.si === 0 && near; $('#dg-next').disabled = dg.si === dg.stops.length - 1 && near;
  dgTabs(dg.tzoom > 0.5 || dg.hubOn ? 'all' : dg.people[dg.at].s.field); // 안내판 앞(두 구역의 입구)과 전체 보기에서는 '전체'
  if (!announce) return;
  const p = dg.people[dg.at], Z = dg.zones;
  $('#dg-now').textContent = dg.hubOn
    ? `가운데 안내판. 왼쪽 ${DG_ZONE_TITLE.uxui} ${Z.uxui.n}명, 오른쪽 ${DG_ZONE_TITLE.visual} ${Z.visual.n}명`
    : `${p.s.name}, ${DG_ZONE_TITLE[p.s.field]} (${dg.at + 1} / ${dg.people.length})`;
}
function dgSetAt(k, announce) { dgMark(dg.stops.findIndex((s) => s.k === clamp(k, 0, dg.people.length - 1)), announce); }
function dgTabs(z) { dg.zone = z; } // 지금 보는 구역 ('all' | 'uxui' | 'visual'). 위 메뉴는 없앰 (2026-11-16, 안내판이 대신함)
function dgGoStop(si, instant) {
  si = clamp(si, 0, dg.stops.length - 1);
  dg.tzoom = 0; dg.tx = dg.stops[si].x; if (instant || reduce) { dg.x = dg.tx; dg.zoom = 0; }
  dgMark(si, true); dg.dirty = true;
}
function dgGoTo(k, instant) { dgGoStop(dg.stops.findIndex((s) => s.k === clamp(k, 0, dg.people.length - 1)), instant); }
function dgStep(d) { dgGoStop((dg.zoom > 0.5 ? dgNearestStop(dg.x) : dg.si) + d); }
function dgZone(z) {
  if (z === 'all') {
    if (!dg.gl) return;
    if (dg.gl.base.portrait) { dgTabs('all'); dgShowList('', true); return; } // 휴대폰: 멀리서 보면 너무 작아서 목록으로
    dg.tzoom = 1; dg.tx = dg.gl.far.cx; dgTabs('all'); $('#dg-now').textContent = `전체 ${dg.people.length}명의 디자이너`; dg.dirty = true;
    $('#dg-prev').disabled = $('#dg-next').disabled = false;
    if (reduce) { dg.x = dg.tx; dg.zoom = 1; }
    return;
  }
  const k = dg.people.findIndex((p) => p.s.field === z); if (k >= 0) dgGoTo(k);
}
/* Project 방 작품 상세에서 "만든 사람"을 누르면: 그 석고상 앞으로 바로 가고 이름표에 초점 */
function dgFocus(i) {
  dgBuild();
  const k = dg.people.findIndex((p) => p.i === i); if (k < 0) return;
  dgGoTo(k, true);
  requestAnimationFrame(() => {
    const el = dg.mode === 'list' ? $(`.dg-list-name[data-i="${i}"]`, dg.list) : $('.dg-plaque', dg.caps[k]);
    if (el) el.focus({ preventScroll: true });
  });
}

function enterDesigner() {
  dgBuild();
  if (dg.mode !== 'list') dgStart();
  dgMark(dg.si, false);
}
/* 다른 화면으로 가면: 그리기를 멈추고 3D 자원을 모두 정리 (돌아오면 같은 자리에서 다시 만듦) */
function dgDispose() {
  cancelAnimationFrame(dg.raf); dg.raf = 0;
  const G = dg.gl; if (!G) return;
  dgTurnDrop(); dg.gl = null;
  G.list.forEach((o) => o.dispose && o.dispose());
  G.r.dispose(); try { G.r.forceContextLoss(); } catch (e) { }
  G.r.domElement.remove();
}
function dgLeave() { dg.drag = null; if (dg.overlay) dgHideList(); dgDispose(); }

/* 키보드 (js/main.js가 부름) */
function designerKey(e) {
  if (dg.mode === 'list') return false;
  if (dg.overlay) { if (e.key === 'Escape') { dgHideList(); return true; } return false; }
  if (e.key === 'ArrowRight' || e.key === 'PageDown') { dgStep(1); return true; }
  if (e.key === 'ArrowLeft' || e.key === 'PageUp') { dgStep(-1); return true; }
  if (e.key === 'Home') { dgGoStop(0); return true; }                    // 맨 왼쪽 끝 학생
  if (e.key === 'End') { dgGoStop(dg.stops.length - 1); return true; }  // 맨 오른쪽 끝 학생
  return false;
}

/* 손가락·마우스로 끌기, 휠, 석고상 누르기, 마우스 깊이감 */
function dgPick(cx, cy) {
  const G = dg.gl; if (!G) return -1;
  const rc = dg.stage.getBoundingClientRect();
  G.ray.setFromCamera({ x: (cx - rc.left) / rc.width * 2 - 1, y: -(cy - rc.top) / rc.height * 2 + 1 }, G.cam);
  const objs = G.busts.flatMap((b) => (b.bust ? [...b.parts, b.bust] : b.parts));
  const hit = G.ray.intersectObjects(objs, false)[0];
  return hit ? hit.object.userData.k : -1;
}
dg.stage.addEventListener('pointerdown', (e) => {
  if (!dg.gl || e.button > 0) return;
  dg.drag = { id: e.pointerId, x0: e.clientX, x: e.clientX, cx: dg.x, t: performance.now(), v: 0, moved: false };
  try { dg.stage.setPointerCapture(e.pointerId); } catch (err) { }
});
dg.stage.addEventListener('pointermove', (e) => {
  if (!dg.drag) {
    if (e.pointerType === 'mouse' && dg.gl) {
      dg.ptr.x = (e.clientX / innerWidth - 0.5) * 2; dg.ptr.y = (e.clientY / innerHeight - 0.5) * 2;
      const k = dgPick(e.clientX, e.clientY);
      const link = k >= 0 && !!dg.people[k].s.portfolio; // 포트폴리오가 있는 석고상 위에서만 '누를 수 있음' 커서
      dg.stage.style.cursor = link ? 'pointer' : ''; dg.stage.classList.toggle('is-hot', link); // is-hot = 나비 커서가 황금빛으로
      dgHover(k);
    }
    return;
  }
  const D = dg.drag, now = performance.now(), upp = dg.gl.base.upp * (1 + (dg.gl.far.d / dg.gl.base.d - 1) * dg.zoom);
  const dx = e.clientX - D.x; D.v = dx / Math.max(1, now - D.t); D.x = e.clientX; D.t = now;
  if (Math.abs(e.clientX - D.x0) > 6) D.moved = true;
  dg.x = dgClampX(D.cx - (e.clientX - D.x0) * upp); dg.tx = dg.x; dg.dirty = true;
});
const dgUp = (e) => {
  const D = dg.drag; if (!D) return; dg.drag = null;
  if (!D.moved) { // 석고상을 누르면: 그 학생 앞으로 가고, 포트폴리오가 있으면 바로 새 탭으로 엶
    const k = dgPick(e.clientX, e.clientY); if (k < 0) return;
    dgGoTo(k); const url = dg.people[k].s.portfolio;
    if (url) window.open(url, '_blank', 'noopener');
    return;
  }
  // 손을 놓으면: 밀던 방향으로 조금 더 가서 가장 가까운 자리(학생 또는 안내판)에 멈춤 (전체 보기에서는 그 자리에 멈춤)
  if (performance.now() - D.t > 90) D.v = 0; // 끌다가 손을 멈춘 뒤 놓으면 던지지 않음 (그 자리에서 가장 가까운 곳으로)
  const upp = dg.gl.base.upp, fling = clamp(-D.v * 260 * upp, -DG.gap * 1.2, DG.gap * 1.2);
  if (dg.zoom > 0.5) { dg.tx = dgClampX(dg.x + fling); return; }
  let si = dgNearestStop(dg.x + fling);
  if (dg.gl.base.portrait) si = clamp(si, dg.si - 1, dg.si + 1); // 휴대폰: 한 번 밀면 한 칸씩
  if (si === dg.si && Math.abs(e.clientX - D.x0) > 40) si += e.clientX < D.x0 ? 1 : -1; // 짧게 밀어도 한 칸은 넘어감
  dgGoStop(si);
};
dg.stage.addEventListener('pointerup', dgUp);
dg.stage.addEventListener('pointercancel', dgUp);
dg.stage.addEventListener('pointerleave', () => { dg.ptr.x = dg.ptr.y = 0; dgHover(-1); });
/* 마우스를 올린 학생: 조명이 밝아지고 명판이 살짝 떠오름 (석고상·받침대 위, 또는 명판 위) */
function dgHover(k) {
  const G = dg.gl; if (!G || G.hov.k === k) return;
  G.hov.k = k; if (k >= 0) G.hov.x = dg.people[k].x; dg.dirty = true;
}
dg.labels.addEventListener('pointerover', (e) => { const c = e.target.closest('.dg-cap'); if (c && e.pointerType === 'mouse') dgHover(+c.dataset.k); });
dg.labels.addEventListener('pointerout', (e) => { const c = e.target.closest('.dg-cap'); if (c && !c.contains(e.relatedTarget)) dgHover(-1); });
function dgClampX(x) { const a = dg.stops[0].x - DG.gap * 0.6, b = dg.stops.at(-1).x + DG.gap * 0.6; return clamp(x, a, b); }
dg.root.addEventListener('wheel', (e) => {
  if (!dg.gl || e.target.closest('.dg-list')) return;
  e.preventDefault();
  const d = (Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY) * (e.deltaMode === 1 ? 32 : 1);
  dg.tx = dgClampX(dg.tx + d * dg.gl.base.upp * DG.wheel); dg.dirty = true;
  if (dg.zoom > 0.5) return;
  dgMark(dgNearestStop(dg.tx), false);
  clearTimeout(dg.wheelT); dg.wheelT = setTimeout(() => dgGoStop(dgNearestStop(dg.tx)), 160); // 휠을 멈추면 가장 가까운 자리(학생 또는 안내판)에 정렬
}, { passive: false });
$('#dg-prev').addEventListener('click', () => dgStep(-1));
$('#dg-next').addEventListener('click', () => dgStep(1));
addEventListener('resize', () => { if (dg.gl) dgResize(); });
