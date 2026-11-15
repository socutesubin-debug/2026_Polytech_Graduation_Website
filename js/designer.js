/* Designer (#designer) — 밝은 미술관 (2026-11-15)
   - 하나로 이어진 전시 공간: 왼쪽 = UX/UI · WEB 구역, 오른쪽 = VISUAL DESIGN 구역, 가운데는 아이보리 벽으로 자연스럽게 이어짐
   - 벽·바닥·받침대는 Three.js의 단순한 3D 도형. 석고상은 투명 배경 사진(assets/images/busts/01~15.webp)을 판에 붙인 2.5D
     (사진에 이미 빛과 그림자가 있어서 다시 조명하지 않음 → 어두워지지 않음. 카메라는 정면만 보고 옆으로만 움직여서 판의 옆면이 보이지 않음)
   - 분야별 벽 색은 벽 셰이더(아래 WALL_FS)가 그림: 석고상 위 조명이 벽에 번지는 자리에 색빛이 더 진하게 비침
   - 이름표·소개·포트폴리오 링크·메뉴·버튼은 HTML. 매 프레임 3D 받침대 자리에 맞춰 옮겨서 석고상과 어긋나지 않음
   - 조작: ← → 버튼·키, 휴대폰은 손가락으로 옆으로 밀기, 마우스 휠, 위 메뉴(전체 / UX/UI · WEB / VISUAL DESIGN)
     움직임이 끝나면 가장 가까운 학생이 가운데에 딱 멈춤. 석고상이나 이름을 누르면 학생 상세(js/detail.js), 포트폴리오는 새 탭
   - 학생 데이터는 js/data.js의 STUDENTS 한 곳만 고치면 됨 (designer: false 인 사람은 나오지 않음, field로 구역이 정해짐)
   - 3D가 안 되면(또는 주소에 ?dg=list) 같은 데이터로 만든 HTML 목록이 대신 나옴
   숫자를 바꾸고 싶으면 아래 DG만 고치면 됩니다 (단위: 1 = 대략 1m) */
const DG = {
  gap: 2.8,            // 석고상 사이 간격
  hub: 3.2,            // 가운데 안내판에서 양쪽 첫 학생까지 거리 (처음 화면 양 끝에 첫 학생이 살짝 보이게)
  endGap: 0.95,        // 마지막 학생에서 양 끝 옆벽까지 (간격의 몇 배)
  // 가운데 안내판: 기둥 높이, 판 너비·높이·두께, 왼쪽 판(위)·오른쪽 판(아래) 높이 / 입구 아치 반폭·둥근 부분 시작 높이
  sign: { post: 1.78, armW: 1.12, armH: 0.2, armD: 0.03, yL: 1.6, yR: 1.34, arch: 0.92, spring: 1.8 },
  bustH: 1.9,          // 석고상 사진 높이
  ped: { w: 1.36, h: 1.12, d: 1.0 },   // 받침대 너비·높이·깊이
  pedRim: { h: 0.075, out: 0.045 },    // 받침대 위 덮개·아래 받침 두께와 튀어나온 정도
  light: { beam: 0.11, dust: 0.9, hover: 0.5 }, // 빛줄기 밝기, 먼지 밝기, 마우스를 올렸을 때 더 밝아지는 정도
  turn: { delay: 0.7, angle: 0.24, speed: 0.42, fade: 2.2 }, // 가운데 학생 3D: 멈춘 뒤 몇 초 후 바뀔지, 도는 각도(라디안), 속도, 바뀌는 빠르기
  turnShade: 0.85, turnGlow: 0.6, // 3D 석고상 밝기: 빛을 받는 정도 + 스스로 빛나는 정도 (사진과 같은 밝기로 보이게 맞춘 값)
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
    stone: '#eae6df',  // 받침대
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

/* ---------- HTML: 이름표(받침대 앞), 짧은 소개 + 포트폴리오(받침대 아래), 구역 제목(벽) ---------- */
function dgBuild() {
  if (dg.built) return; dg.built = true;
  dg.people = dgPeople();
  const cap = ({ s, i }, k) => `<div class="dg-cap" data-i="${i}" data-k="${k}" data-field="${s.field}">
      <button type="button" class="dg-plaque" aria-label="${s.name}, ${DG_ZONE_TITLE[s.field]}. 학생 소개 열기"><b class="dg-name">${s.name}</b><span class="dg-field">${DG_ZONE_TITLE[s.field]}</span></button>
      <div class="dg-info">
        <p class="dg-slogan">${s.slogan || ''}</p>
        ${s.portfolio
          ? `<a class="dg-go" href="${s.portfolio}" target="_blank" rel="noopener" aria-label="${s.name} 포트폴리오 새 탭으로 열기">포트폴리오 <span aria-hidden="true">↗</span></a>`
          : '<span class="dg-go is-empty">포트폴리오 준비 중</span>'}
      </div>
    </div>`;
  const title = (z) => `<div class="dg-zone" data-zone="${z}" aria-hidden="true"><b>${DG_ZONE_TITLE[z]}</b><span>${dg.zones[z].n}명의 디자이너</span></div>`;
  // 가운데 안내판: 판은 3D 황동 판(dgCreate). 여기서는 판 위에 겹치는 투명 버튼(누르기·키보드)과 아치 위 새김 글자
  const Z = dg.zones;
  const sign = `<div class="dg-lintel" aria-hidden="true"><b>BEYOND THE FRAME</b><span>${dg.people.length}명의 디자이너</span></div>
    <button type="button" class="dg-sign-hit" data-zone="uxui" aria-label="안내판: 왼쪽 UX/UI · WEB 구역 ${Z.uxui.n}명. 첫 학생 앞으로 가기"></button>
    <button type="button" class="dg-sign-hit" data-zone="visual" aria-label="안내판: 오른쪽 VISUAL DESIGN 구역 ${Z.visual.n}명. 첫 학생 앞으로 가기"></button>`;
  dg.labels.innerHTML = title('uxui') + title('visual') + sign + dg.people.map(cap).join('');
  dg.caps = $$('.dg-cap', dg.labels); dg.zoneEls = $$('.dg-zone', dg.labels);
  dg.signHits = $$('.dg-sign-hit', dg.labels); dg.lintel = $('.dg-lintel', dg.labels);
  dg.signHits.forEach((b, n) => {
    b.addEventListener('pointerenter', () => { dg.signHov = n; dg.dirty = true; });
    b.addEventListener('pointerleave', () => { dg.signHov = -1; dg.dirty = true; });
  });
  dg.labels.addEventListener('click', (e) => {
    const a = e.target.closest('.dg-sign-hit'); if (a) { dgZone(a.dataset.zone); return; }
    const b = e.target.closest('.dg-plaque'); if (!b) return;
    const k = +b.parentElement.dataset.k; dgGoTo(k); openDetail(dg.people[k].i);
  });
  // Tab으로 이름표에 오면 그 학생 앞으로, 안내판에 오면 가운데로 이동
  dg.labels.addEventListener('focusin', (e) => {
    const c = e.target.closest('.dg-cap');
    if (c) { if (+c.dataset.k !== dg.at || dg.hubOn || dg.zoom > 0.5) dgGoTo(+c.dataset.k); return; }
    if (e.target.closest('.dg-sign-hit') && (!dg.hubOn || dg.zoom > 0.5)) dgGoStop(dg.hubSi);
  });
  dg.x = 0; dg.tx = 0; dgMark(dg.hubSi, true); // 처음에는 가운데 안내판 앞
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
  if (e.target.closest('.dg-list-close')) { dgHideList(); $('#dg-tabs [aria-pressed="true"]')?.focus({ preventScroll: true }); }
  if (e.target.closest('.dg-retry')) { dg.list.hidden = true; dg.root.classList.remove('is-list'); dg.mode = ''; dgStart(); }
});

/* ---------- 3D 장면 ---------- */
const DG_WALL_VS = `varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position,1.); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`;
const DG_NOISE = `
float h21(vec2 p){ p = fract(p*vec2(123.34,456.21)); p += dot(p,p+45.32); return fract(p.x*p.y); }
float vnoise(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f);
  return mix(mix(h21(i),h21(i+vec2(1,0)),f.x), mix(h21(i+vec2(0,1)),h21(i+vec2(1,1)),f.x), f.y); }
float fbm(vec2 p){ float a=.5, s=0.; for(int i=0;i<4;i++){ s+=a*vnoise(p); p*=2.03; a*=.5; } return s; }`;
// 벽: 아이보리(조금 어둡게) + 석고상마다 천장 조명이 그리는 빛 원뿔(가운데 학생·마우스 올린 학생일수록 밝게) + 구역 색빛
//     + 창살 빛·나뭇잎 그림자(아주 옅게) + 아래 판넬·띠 몰딩·그림 레일 + 걸레받이 + 구역 제목 아래 아치 통로
const DG_WALL_FS = `
uniform vec3 uIvory, uUx, uVi; uniform float uTint, uUxEnd, uViFrom, uGap, uFocus, uHovX, uHovA; uniform float uBx[16]; uniform int uN; uniform vec3 uArch; // 가운데 입구: x, 반폭, 둥근 부분 시작 높이
varying vec3 vW;${DG_NOISE}
float cone(float dx, float y){ // 천장 조명이 벽에 그리는 빛: 위는 좁고 아래로 갈수록 넓게 퍼짐
  float w = 0.2 + 0.34 * max(0., 4.6 - y);
  return exp(-dx * dx / (w * w) * 1.7) * smoothstep(0.3, 2.4, y) * (1. - 0.8 * smoothstep(3.3, 4.6, y)); // 석고상 머리 높이에서 가장 밝고, 천장 쪽은 은은하게
}
float archD(float dx, float y, float hw, float spring){ // 아치 모양까지의 거리 (안쪽이면 음수)
  return y < spring ? max(abs(dx) - hw, -y) : length(vec2(dx, y - spring)) - hw;
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
  vec3 c = uIvory * (0.85 + 0.05 * v + 0.04 * pool + 0.17 * spot);
  float wu = 1. - smoothstep(uUxEnd + uGap * .35, uUxEnd + uGap * 1.05, x);       // 0~1: UX/UI 구역
  float wv = smoothstep(uViFrom - uGap * 1.05, uViFrom - uGap * .35, x);          // 0~1: Visual 구역
  float spill = (0.38 + 0.62 * pool) * smoothstep(-0.4, 1.6, y) * (1. - 0.5 * smoothstep(3.4, 6., y));
  spill *= 0.85 + 0.3 * fbm(vec2(x * .22, y * .35));                             // 빛 번짐이 고르지 않게
  c = mix(c, uUx * (0.9 + 0.1 * pool), wu * spill * uTint);
  c = mix(c, uVi * (0.9 + 0.1 * pool), wv * spill * uTint);
  // 창살 빛 + 나뭇잎 그림자 (왼쪽 위 창문에서 들어오는 빛, 아주 옅게)
  float u = x + y * 0.55;
  float bars = smoothstep(.0, .25, fract(u / 2.6)) * (1. - smoothstep(.55, .8, fract(u / 2.6)));
  float sunMask = smoothstep(1.6, 3.4, y) * (0.5 + 0.5 * sin(x * .19 + 1.3));
  float leaves = smoothstep(.42, .7, fbm(vec2(x * 1.4, y * 1.7) + 3.1));
  c *= 1. + 0.045 * bars * sunMask * (1. - 0.7 * leaves);
  // 벽 패널 이음선, 아주 고운 돌 결
  float seam = 1. - smoothstep(0., .012, abs(fract(x / 5.6) - .5) * 5.6);          // 이음선이 가운데 입구(x = 0)를 지나지 않게 반 칸 옮김
  c *= 1. - 0.035 * seam;
  c *= 0.985 + 0.03 * vnoise(vW.xy * 18.);
  vec3 wallC = c; // 아치 안쪽 계산용 (몰딩 전 벽색)
  // 아래 판넬(징두리): 의자 높이 띠 몰딩 + 네모 판넬 (빛이 왼쪽 위에서 와서 왼쪽·위 테두리는 밝고 오른쪽·아래는 그늘)
  float rail = 0.98, e = 0.011;
  if (y < rail) {
    c *= 0.955;
    float px = fract(x / 1.5) * 1.5, x0 = 0.12, x1 = 1.38, y0 = 0.3, y1 = rail - 0.16;
    float inX = step(x0 - e, px) * step(px, x1 + e), inY = step(y0 - e, y) * step(y, y1 + e);
    c *= 1. + 0.06 * inY * (1. - smoothstep(0., e, abs(px - x0))) - 0.07 * inY * (1. - smoothstep(0., e, abs(px - x1)));
    c *= 1. + 0.06 * inX * (1. - smoothstep(0., e, abs(y - y1))) - 0.07 * inX * (1. - smoothstep(0., e, abs(y - y0)));
  }
  float rb = y - rail;
  c *= 1. + 0.07 * smoothstep(-0.004, 0.004, rb) * (1. - smoothstep(0.034, 0.042, rb));   // 띠 몰딩 윗면 빛
  c *= 1. - 0.1 * exp(-max(0., -rb) * 70.) * step(rb, 0.);                                // 띠 몰딩 아래 그늘
  // 그림 레일 (석고상 머리 위 가는 띠)
  float pr = y - 3.72;
  c *= 1. + 0.05 * smoothstep(-0.003, 0.003, pr) * (1. - smoothstep(0.022, 0.028, pr));
  c *= 1. - 0.06 * exp(-max(0., -pr) * 90.) * step(pr, 0.);
  // 걸레받이(바닥과 닿는 아래 띠)와 바닥 경계의 그늘
  float base = 1. - step(0.16, y);
  c = mix(c, c * 0.93, base);
  c *= 1. + 0.05 * (1. - smoothstep(0., 0.01, abs(y - 0.16)));
  c *= 1. - 0.08 * exp(-y * 12.);
  // 가운데 입구 아치 (안내판 뒤): 테두리 몰딩 + 안쪽은 깊이감. 안쪽 바닥 쪽은 왼쪽은 UX/UI 빛, 오른쪽은 Visual 빛이 살짝 비침
  float hw = uArch.y, spring = uArch.z, dx = x - uArch.x, d = archD(dx, y, hw, spring), fw = 0.16;
  if (d < fw && y >= 0.) {
    if (d > 0.) {                                                                       // 테두리 몰딩 (안쪽 가는 홈 + 바깥 그늘)
      float t = d / fw; c = wallC * (1.04 + 0.04 * (1. - t)) * (1. - 0.12 * smoothstep(0.75, 1., t)) * (1. - 0.06 * (1. - smoothstep(0., .012, abs(d - fw * .35))));
    } else {
      // 안쪽은 너무 하얗지 않게: 위(아치 천장 그늘)에서 아래로 조금씩 밝아지고, 바닥 쪽에 옆 전시실 색빛
      vec3 inC = uIvory * (0.64 + 0.13 * smoothstep(spring + 0.5, 0.2, y)) * (0.97 + 0.03 * vnoise(vW.xy * 9.));
      vec3 beyond = mix(uUx, uVi, smoothstep(-hw * .6, hw * .6, dx));
      inC = mix(inC, beyond * 0.85, 0.2 * smoothstep(1.8, 0.1, y));
      float r = 0.12, side = smoothstep(-0.02, 0.03, abs(dx) - (hw - r));                // 안쪽 옆면(두께): 왼쪽은 그늘, 오른쪽은 빛
      float top = y > spring ? smoothstep(-0.02, 0.03, length(vec2(dx, y - spring)) - (hw - r)) : 0.;
      float rev = max(side * step(y, spring), top);
      inC = mix(inC, uIvory * mix(0.72, 0.92, smoothstep(-0.3, 0.3, dx)), rev * 0.85);
      c = inC;
    }
  }
  gl_FragColor = vec4(c, 1.);
}`;
// 바닥: 밝은 돌 타일 + 벽 쪽 그늘 + 벽 색빛이 바닥에 살짝 비침
const DG_FLOOR_FS = `
uniform vec3 uFloor, uUx, uVi; uniform float uTint, uUxEnd, uViFrom, uGap, uFocus, uHovX, uHovA; uniform float uBx[16]; uniform int uN;
varying vec3 vW;${DG_NOISE}
void main(){
  vec2 p = vW.xz;
  vec2 t = (p + vec2(0.9, 0.)) / vec2(1.8, 1.2); vec2 ti = floor(t), tf = fract(t); // 타일 이음매가 가운데(x = 0) 바로 아래를 지나지 않게
  float seam = 1. - smoothstep(0., .012, min(min(tf.x, 1. - tf.x) * 1.8, min(tf.y, 1. - tf.y) * 1.2));
  vec3 c = uFloor * 0.93 * (0.97 + 0.05 * h21(ti)) * (0.975 + 0.05 * fbm(p * 2.2));
  c *= 1. - 0.04 * seam;
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

// 빛줄기: 석고상 뒤에 세운 판. 위는 좁고 아래로 넓어지는 은은한 빛 (더하기 섞기라 벽·석고상을 밝게만 함)
const DG_BEAM_VS = `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }`;
const DG_BEAM_FS = `
uniform float uA; varying vec2 vUv;
void main(){
  float y = vUv.y, hw = mix(0.46, 0.1, y), dx = abs(vUv.x - .5);
  float a = (1. - smoothstep(hw * 0.35, hw, dx)) * smoothstep(0., 0.4, y) * (1. - smoothstep(0.55, 1., y)) * (0.5 + 0.5 * y);
  gl_FragColor = vec4(vec3(1., .94, .84) * a * uA, 1.);
}`;
// 먼지: 가운데 학생의 빛줄기 안에서만 반짝이며 천천히 떠다님
const DG_DUST_VS = `
uniform float uT, uSize; attribute float aSeed; varying float vA;
void main(){
  vec3 p = position;
  p.y = 1.2 + mod(p.y - 1.2 + uT * (0.03 + 0.03 * aSeed), 3.);
  p.x += sin(uT * (0.2 + 0.3 * aSeed) + aSeed * 40.) * 0.08;
  p.z += cos(uT * 0.25 + aSeed * 23.) * 0.05;
  float w = 0.2 + 0.32 * max(0., 4.4 - p.y);                     // 빛 원뿔 안쪽일수록 밝게
  vA = exp(-p.x * p.x / (w * w) * 2.) * smoothstep(1.2, 1.8, p.y) * (1. - smoothstep(3.8, 4.2, p.y)) * (0.4 + 0.6 * fract(aSeed * 7.3));
  vec4 mv = modelViewMatrix * vec4(p, 1.);
  gl_PointSize = uSize * (0.6 + 0.8 * fract(aSeed * 3.1)) / -mv.z;
  gl_Position = projectionMatrix * mv;
}`;
const DG_DUST_FS = `
uniform float uA; varying float vA;
void main(){ vec2 d = gl_PointCoord - .5; float a = smoothstep(.5, .1, length(d)) * vA * uA; gl_FragColor = vec4(vec3(1., .95, .86) * a, 1.); }`;

/* 부드러운 그림자 무늬 (사각형 / 타원), 작은 캔버스를 크게 늘려서 흐리게 */
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
function dgArmTex(THREE, zone, dir, w, h, t) {
  const W = 1024, H = Math.round(W * h / w), cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
  const draw = () => {
    const c = cv.getContext('2d'), px = W / w, tip = t * px;
    const gr = c.createLinearGradient(0, 0, 0, H);
    gr.addColorStop(0, '#f0e0b6'); gr.addColorStop(0.4, '#d3b984'); gr.addColorStop(0.62, '#bc9f6a'); gr.addColorStop(1, '#d6be8c');
    c.fillStyle = gr; c.fillRect(0, 0, W, H);
    for (let i = 0; i < 160; i++) { c.fillStyle = `rgba(${Math.random() < .5 ? '255,248,226' : '120,92,48'},${Math.random() * .06})`; c.fillRect(0, Math.random() * H, W, 1); } // 가로 결
    // 안쪽 테두리 (판 모양을 따라 조금 안쪽에 가는 홈)
    const m = 12, L = dir < 0 ? tip : 0, R = dir < 0 ? W : W - tip;
    c.beginPath();
    if (dir < 0) { c.moveTo(m * 1.6, H / 2); c.lineTo(L + m * .4, m); c.lineTo(W - m, m); c.lineTo(W - m, H - m); c.lineTo(L + m * .4, H - m); }
    else { c.moveTo(m, m); c.lineTo(R - m * .4, m); c.lineTo(W - m * 1.6, H / 2); c.lineTo(R - m * .4, H - m); c.lineTo(m, H - m); }
    c.closePath(); c.lineWidth = 2.5; c.strokeStyle = 'rgba(110,84,44,.55)'; c.stroke();
    c.translate(0, 2); c.strokeStyle = 'rgba(255,246,220,.5)'; c.lineWidth = 1.5; c.stroke(); c.setTransform(1, 0, 0, 1, 0, 0);
    // 새긴 글자: 어두운 글자 + 아래쪽 밝은 선 (파인 홈처럼)
    const name = DG_ZONE_TITLE[zone], fam = '"Noto Sans KR","Apple SD Gothic Neo","Malgun Gothic",sans-serif';
    const text = (s, x, align, size, weight, sp) => {
      c.font = `${weight} ${size}px ${fam}`; c.textAlign = align; c.textBaseline = 'middle'; if ('letterSpacing' in c) c.letterSpacing = sp + 'px';
      c.fillStyle = 'rgba(255,246,220,.7)'; c.fillText(s, x, H / 2 + 3);
      c.fillStyle = '#3b2c17'; c.fillText(s, x, H / 2);
    };
    // 구역 이름만 판 가운데에 (인원은 아치 위 글자와 화면 읽기 안내에 있음. 판 안쪽 끝은 기둥에 가려서 비워 둠)
    const big = Math.round(H * 0.42), mid = dir < 0 ? (L + W - 60) / 2 : (60 + R) / 2;
    text(name, mid, 'center', big, 700, 10);
    tex.needsUpdate = true; if (dg.gl) dg.dirty = true;
  };
  draw();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(draw); // 글꼴이 늦게 오면 다시 그림
  return tex;
}

/* 받침대 돌 결 (아주 옅은 얼룩 + 가는 대리석 결) */
function dgStoneTex(THREE) {
  const n = 256, cv = document.createElement('canvas'); cv.width = cv.height = n;
  const c = cv.getContext('2d'); c.fillStyle = '#fff'; c.fillRect(0, 0, n, n);
  for (let k = 0; k < 900; k++) {
    const r = Math.random() * 2.2 + .4, v = 225 + Math.random() * 30 | 0;
    c.fillStyle = `rgba(${v},${v - 2},${v - 5},${Math.random() * .3})`;
    c.beginPath(); c.arc(Math.random() * n, Math.random() * n, r, 0, 7); c.fill();
  }
  c.lineCap = 'round';
  for (let k = 0; k < 3; k++) { // 비스듬히 지나가는 결 (부드럽게 휘어짐)
    let x = Math.random() * n, y = -10; c.beginPath(); c.moveTo(x, y);
    while (y < n + 10) { const nx = x + (Math.random() - .3) * 22, ny = y + 26 + Math.random() * 20; c.quadraticCurveTo(x, y, (x + nx) / 2, (y + ny) / 2); x = nx; y = ny; }
    c.strokeStyle = `rgba(160,148,132,${.05 + Math.random() * .05})`; c.lineWidth = .5 + Math.random() * .6; c.stroke();
  }
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
    uFocus: { value: dg.x }, uHovX: { value: 0 }, uHovA: { value: 0 }, uArch: { value: new THREE.Vector3(0, DG.sign.arch, DG.sign.spring) } };
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
  // 빛줄기·먼지
  const beamGeo = keep(new THREE.PlaneGeometry(2.1, 3.3)); beamGeo.translate(0, 3.3 / 2, 0);
  G.beams = [];
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
    // 빛줄기 (움직임 줄이기에서도 멈춘 빛으로 보여 줌)
    const bm = keep(new THREE.ShaderMaterial({ vertexShader: DG_BEAM_VS, fragmentShader: DG_BEAM_FS, uniforms: { uA: { value: 0 } },
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    const beam = new THREE.Mesh(beamGeo, bm); beam.position.set(0, ph, DG.pedZ - 0.38); beam.renderOrder = 2; g.add(beam); G.beams[k] = bm;
    const fl = (m, w, d, x, z) => { const s = new THREE.Mesh(unit, m); s.rotation.x = -Math.PI / 2; s.scale.set(w, d, 1); s.position.set(x, 0.003, z); s.renderOrder = 1; g.add(s); return s; };
    fl(floorSh, pw * 1.75, pd * 1.6, 0.22, DG.pedZ - 0.08);      // 받침대 아래 넓게 퍼진 그림자 (빛이 왼쪽에서 와서 오른쪽으로 조금 밀림)
    fl(floorAO, pw * 1.1, pd * 1.12, 0.03, DG.pedZ);              // 바닥에 닿는 곳의 진한 그늘
    const ws = new THREE.Mesh(unit, wallSh); ws.scale.set(pw * 1.3, ph * 1.25, 1); ws.position.set(0.5, ph * 0.5, 0.004); ws.renderOrder = 1; g.add(ws); // 벽에 비친 받침대 그림자
    const ts = new THREE.Mesh(unit, topSh); ts.rotation.x = -Math.PI / 2; ts.scale.set(bw * 0.62, pd * 0.62, 1); ts.position.set(0.02, ph + 0.003, DG.pedZ); ts.renderOrder = 1; g.add(ts); // 석고상 발 밑 그늘
    G.busts[k] = { g, ped, parts: [ped, cap, foot], k, loaded: false };
  });
  G.bustGeo = bustGeo; G.unit = unit; G.bw = bw;
  // 가운데 안내판: 둥근 대리석 받침 + 황동 기둥(꼭대기 장식) + 기둥에서 왼쪽·오른쪽으로 뻗은 황동 화살표 판 (두께가 있고 장면 조명을 받음)
  // 판 위에는 투명 HTML 버튼(.dg-sign-hit)을 겹쳐서 누르기·키보드를 받음. 뒤에 입구 아치, 위에서 조명
  {
    const g = new THREE.Group(); scene.add(g); const S = DG.sign, z0 = DG.pedZ;
    const brass = keep(new THREE.MeshLambertMaterial({ color: col('#c4a76e') }));
    const add = (geo, mat, x, y, z) => { const m = new THREE.Mesh(keep(geo), mat); m.position.set(x, y, z); g.add(m); return m; };
    add(new THREE.CylinderGeometry(0.3, 0.33, 0.07, 40), pedMat, 0, 0.035, z0);               // 받침 아래 단
    add(new THREE.CylinderGeometry(0.17, 0.2, 0.06, 32), pedMat, 0, 0.1, z0);                // 받침 위 단
    add(new THREE.CylinderGeometry(0.042, 0.05, S.post, 24), brass, 0, 0.13 + S.post / 2, z0); // 기둥
    add(new THREE.CylinderGeometry(0.06, 0.06, 0.03, 24), brass, 0, 0.13 + S.post, z0);       // 꼭대기 테
    add(new THREE.SphereGeometry(0.055, 24, 16), brass, 0, 0.19 + S.post, z0);                // 꼭대기 공
    // 화살표 판: 앞면에 새긴 글자 그림, 옆면은 민 황동
    const { armW: w, armH: h, armD: d } = S, t = 0.13, zf = z0 + 0.05;
    G.signArms = [];
    [{ dir: -1, zone: 'uxui', y: S.yL }, { dir: 1, zone: 'visual', y: S.yR }].forEach((a) => {
      const sh = new THREE.Shape(), L = -w / 2, R = w / 2;
      if (a.dir < 0) { sh.moveTo(L, 0); sh.lineTo(L + t, h / 2); sh.lineTo(R, h / 2); sh.lineTo(R, -h / 2); sh.lineTo(L + t, -h / 2); }
      else { sh.moveTo(L, h / 2); sh.lineTo(R - t, h / 2); sh.lineTo(R, 0); sh.lineTo(R - t, -h / 2); sh.lineTo(L, -h / 2); }
      sh.closePath();
      const geo = keep(new THREE.ExtrudeGeometry(sh, { depth: d, bevelEnabled: true, bevelThickness: 0.004, bevelSize: 0.004, bevelSegments: 2 }));
      const tex = keep(dgArmTex(THREE, a.zone, a.dir, w, h, t)); tex.repeat.set(1 / w, 1 / h); tex.offset.set(0.5, 0.5);
      const face = keep(new THREE.MeshLambertMaterial({ map: tex })), side = keep(new THREE.MeshLambertMaterial({ color: col('#a98c57') }));
      const m = new THREE.Mesh(geo, [face, side]);
      const cx = a.dir * (w / 2 - 0.05); m.position.set(cx, a.y, zf - d); g.add(m);
      G.signArms.push({ mesh: m, face, x0: cx - w / 2, x1: cx + w / 2, y0: a.y - h / 2, y1: a.y + h / 2, z: zf + 0.004 });
    });
    const fl = (m, w2, d2, x, z) => { const s = new THREE.Mesh(unit, m); s.rotation.x = -Math.PI / 2; s.scale.set(w2, d2, 1); s.position.set(x, 0.003, z); s.renderOrder = 1; g.add(s); };
    fl(floorSh, 1.0, 0.75, 0.12, z0 - 0.04); fl(floorAO, 0.75, 0.55, 0.02, z0);
    const ws = new THREE.Mesh(unit, wallSh); ws.scale.set(w * 2.1, 0.5, 1); ws.position.set(0.35, (S.yL + S.yR) / 2, 0.004); ws.renderOrder = 1; g.add(ws); // 판이 벽(아치 안)에 드리운 흐린 그림자
    const bm = keep(new THREE.ShaderMaterial({ vertexShader: DG_BEAM_VS, fragmentShader: DG_BEAM_FS, uniforms: { uA: { value: 0 } },
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    const beam = new THREE.Mesh(beamGeo, bm); beam.scale.set(1.25, 1.15, 1); beam.position.set(0, 0, DG.pedZ - 0.3); beam.renderOrder = 2; g.add(beam);
    G.signBeam = bm;
  }
  // 양 끝 옆벽: 전시가 여기서 끝남. 빛이 왼쪽에서 와서 왼쪽 끝 벽(오른쪽을 봄)은 그늘, 오른쪽 끝 벽은 밝게
  dg.ends.forEach((x, n) => {
    const iv = col(DG.colors.ivory).multiplyScalar(n === 0 ? 0.74 : 0.9);
    const m = keep(new THREE.MeshBasicMaterial({ color: iv }));
    const side = new THREE.Mesh(keep(new THREE.PlaneGeometry(400, 30)), m);
    side.rotation.y = n === 0 ? Math.PI / 2 : -Math.PI / 2; side.position.set(x, 15, 200); scene.add(side);
    const sk = new THREE.Mesh(keep(new THREE.PlaneGeometry(400, 0.16)), keep(new THREE.MeshBasicMaterial({ color: iv.clone().multiplyScalar(0.92) })));
    sk.rotation.y = side.rotation.y; sk.position.set(x + (n === 0 ? 0.002 : -0.002), 0.08, 200); scene.add(sk); // 옆벽 걸레받이
  });
  // 먼지 (가운데 학생 빛줄기 안). 움직임 줄이기에서는 만들지 않음
  if (!reduce) {
    const n = mobile ? 40 : 70, pos = new Float32Array(n * 3), seed = new Float32Array(n);
    for (let i = 0; i < n; i++) { pos[i * 3] = (Math.random() - .5) * 1.4; pos[i * 3 + 1] = 1.2 + Math.random() * 3; pos[i * 3 + 2] = DG.pedZ - 0.3 + Math.random() * 0.9; seed[i] = Math.random(); }
    const dGeo = keep(new THREE.BufferGeometry()); dGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); dGeo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
    const dMat = keep(new THREE.ShaderMaterial({ vertexShader: DG_DUST_VS, fragmentShader: DG_DUST_FS, uniforms: { uT: { value: 0 }, uA: { value: 0 }, uSize: { value: 1 } },
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    const dust = new THREE.Points(dGeo, dMat); dust.renderOrder = 4; dust.frustumCulled = false; scene.add(dust);
    G.dust = { obj: dust, mat: dMat };
  }
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
function dgAddBust(b, img) {
  const G = dg.gl, { THREE } = G;
  const tex = new THREE.Texture(img); tex.colorSpace = THREE.SRGBColorSpace; tex.premultiplyAlpha = true; // 가장자리가 검게 번지지 않게
  tex.anisotropy = 4; tex.needsUpdate = true; G.list.push(tex);
  // 사진의 빛은 그대로 두고(다시 조명하지 않음), 색만 아이보리 쪽으로 살짝 맞춰서 15개가 같은 석고 색으로 보이게
  const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, premultipliedAlpha: true, depthWrite: false, toneMapped: false });
  mat.onBeforeCompile = (sh) => {
    sh.uniforms.uIvory = { value: new THREE.Color(DG.colors.stone) };
    sh.fragmentShader = 'uniform vec3 uIvory;\n' + sh.fragmentShader.replace('#include <map_fragment>', `#include <map_fragment>
      { float l = dot(diffuseColor.rgb, vec3(.2126,.7152,.0722)); vec3 iv = uIvory / dot(uIvory, vec3(.2126,.7152,.0722));
        diffuseColor.rgb = mix(diffuseColor.rgb, min(l * iv * 1.04, vec3(diffuseColor.a)), .45); }`);
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
  const tabs = $('#dg-tabs').getBoundingClientRect(), top = Math.max(90, tabs.bottom + (portrait ? 26 : 18));
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
  // 안내판 3D 화살표 판 위에 투명 버튼을 겹침 (판 앞면의 네 귀퉁이를 화면으로 옮겨서 크기·자리를 맞춤)
  G.signArms.forEach((a, n) => {
    const [x0, y1] = proj(a.x0, a.y1, a.z), [x1, y0] = proj(a.x1, a.y0, a.z), el = dg.signHits[n];
    el.style.transform = `translate3d(${x0.toFixed(1)}px,${y1.toFixed(1)}px,0)`;
    el.style.width = (x1 - x0).toFixed(1) + 'px'; el.style.height = (y0 - y1).toFixed(1) + 'px';
    el.classList.toggle('off', x1 < 0 || x0 > w || dg.zoom > 0.5);
  });
  // 아치 위 새김 글자
  { const [x, y] = proj(0, DG.sign.spring + DG.sign.arch + 0.3, 0); dg.lintel.style.transform = `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0)`;
    dg.lintel.classList.toggle('off', x < -w * 0.3 || x > w * 1.3 || dg.zoom > 0.5); }
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
    // 먼지가 떠다니는 동안은 30fps 정도로만 다시 그림. 그 밖에 멈춰 있으면 다시 그리지 않음 (배터리 아낌)
    const dusty = dg.gl.dust && dg.zoom < 0.5 && t - (dg.lastDraw || 0) > 32;
    if (!moved && !dusty) return;
    dg.dirty = false; dg.lastDraw = t;
    dgCamera(); dgPlaceLabels(); dgLights(t / 1000);
    dg.gl.r.render(dg.gl.scene, dg.gl.cam);
  };
  dg.raf = requestAnimationFrame(step);
}

/* 조명: 카메라가 보는 학생(가운데)일수록 빛줄기·벽 빛이 밝고, 마우스를 올린 학생은 더 밝게. 먼지는 가운데 학생 빛줄기 안에 */
function dgLights(time) {
  const G = dg.gl, C = G.common, H = G.hov, L = DG.light, e = dg.zoom * dg.zoom * (3 - 2 * dg.zoom);
  C.uFocus.value = dg.x; C.uHovX.value = H.x; C.uHovA.value = H.a * (1 - e);
  G.beams.forEach((m, k) => {
    const f = Math.exp(-(((dg.people[k].x - dg.x) / (DG.gap * 0.75)) ** 2)), hv = H.k === k ? H.a : 0;
    m.uniforms.uA.value = L.beam * (0.3 + 0.7 * f + L.hover * 1.2 * hv) * (1 - 0.5 * e);
  });
  G.signBeam.uniforms.uA.value = L.beam * (0.3 + 0.7 * Math.exp(-((dg.x / (DG.gap * 0.75)) ** 2))) * (1 - 0.5 * e);
  G.signArms.forEach((a, n) => { a.face.emissive.setScalar(dg.signHov === n ? 0.12 : 0); }); // 마우스를 올린 판은 살짝 밝게
  if (G.dust) {
    const s = dg.stops[dg.si], f = s.k < 0 ? 0 : Math.exp(-(((s.x - dg.x) / (DG.gap * 0.5)) ** 2)); // 지금 멈춘 학생의 빛줄기 (안내판 앞에서는 끔)
    const sx = s.x;
    G.dust.obj.position.x = sx;
    G.dust.mat.uniforms.uT.value = time;
    G.dust.mat.uniforms.uA.value = L.dust * f * (1 - e);
    G.dust.mat.uniforms.uSize.value = 0.014 * G.base.h / (2 * Math.tan(DG.fov * Math.PI / 360)) * G.r.getPixelRatio();
  }
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
      // 사진은 사이트에서 색을 살짝 아이보리 쪽으로 맞춰서 보여 줌 → 3D도 노란빛을 조금 빼서 같은 색으로
      const mt = new THREE.MeshLambertMaterial({ map: o.material.map, color: new THREE.Color(DG.turnShade * 0.97, DG.turnShade * 0.97, DG.turnShade * 1.06), transparent: true, opacity: 0,
        emissive: new THREE.Color(0.97, 0.97, 1.08), emissiveMap: o.material.map, emissiveIntensity: DG.turnGlow }); // 그늘 쪽이 너무 어두워지지 않게 색 그림을 조금 스스로 빛나게
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
  dgTabs(dg.tzoom > 0.5 ? 'all' : dg.hubOn ? '' : dg.people[dg.at].s.field); // 안내판 앞에서는 아무 메뉴도 눌리지 않음
  if (!announce) return;
  const p = dg.people[dg.at], Z = dg.zones;
  $('#dg-now').textContent = dg.hubOn
    ? `가운데 안내판. 왼쪽 ${DG_ZONE_TITLE.uxui} ${Z.uxui.n}명, 오른쪽 ${DG_ZONE_TITLE.visual} ${Z.visual.n}명`
    : `${p.s.name}, ${DG_ZONE_TITLE[p.s.field]} (${dg.at + 1} / ${dg.people.length})`;
}
function dgSetAt(k, announce) { dgMark(dg.stops.findIndex((s) => s.k === clamp(k, 0, dg.people.length - 1)), announce); }
function dgTabs(z) { $$('#dg-tabs button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.zone === z))); dg.zone = z; }
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
      dg.stage.style.cursor = k >= 0 ? 'pointer' : '';
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
  if (!D.moved) { const k = dgPick(e.clientX, e.clientY); if (k >= 0) { dgGoTo(k); $('.dg-plaque', dg.caps[k]).focus({ preventScroll: true }); openDetail(dg.people[k].i); } return; }
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
$('#dg-tabs').addEventListener('click', (e) => { const b = e.target.closest('[data-zone]'); if (b) dgZone(b.dataset.zone); });
addEventListener('resize', () => { if (dg.gl) dgResize(); });
