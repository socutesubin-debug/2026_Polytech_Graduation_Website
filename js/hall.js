/* V2 전시관 (#hall-uxui, #hall-visual): 시험 방을 키운 진짜 전시관.
   - 밝은 돌 공간 + 아치·기둥 (스토리보드 s6 버전 1) / 석고상 앞에 멈추면 큰 이름 글자와 선 (버전 2에서 빌린 연출)
   - 스크롤 아래 = 전진, 위 = 후진, 손을 멈추면 그 자리. 기둥을 지나면 다음 석고상이 서서히 드러남
   - 석고상(또는 이름표)을 누르면 소개가 열리고 비행이 멈춤. 닫으면 같은 자리·같은 초점
   - 멈춘 자리에서 마우스를 움직이면 시점이 ±5도만 살짝 돌아감 (터치·움직임 줄이기에서는 꺼짐)
   - 학생은 data.js의 field 값으로 나눔. field가 빈 학생은 전시관에서 빠지고 목록에만 보임
   숫자를 바꾸고 싶으면 아래 HALL_LAYOUT과 HALL_THEMES만 고치면 됩니다 (단위: 미터 비슷한 크기) */
const HALL_LAYOUT = {
  eye: 1.45,          // 나비 눈높이
  gap: 4.4,           // 석고상 사이 앞뒤 거리
  sideX: 1.75,        // 석고상이 길 가운데에서 떨어진 거리 (왼쪽·오른쪽 번갈아)
  pathX: 0.45,        // 석고상 앞에서 나비가 그 석고상 쪽으로 다가가는 정도
  standOff: 1.5,      // 석고상 앞 멈춤 지점이 석고상보다 얼마나 앞인지
  pillar: { ahead: 1.45, r: 0.38, h: 4.6 }, // 다음 석고상을 가리는 기둥: 석고상보다 ahead만큼 앞. 옆 위치(x)는 앞 석고상 자리에서 볼 때 딱 가리도록 자동 계산
  pedestal: 1.0, bustH: 0.62,
  halfWidth: 3.2, ceiling: 5.2,
  typeWindow: 0.035,  // 석고상 앞 멈춤 지점에서 이만큼 안에 있으면 큰 이름 글자가 보임 (진행률 기준)
  lookDeg: 5,         // 마우스로 둘러보는 최대 각도
};
const HALL_THEMES = {
  'hall-uxui': {
    field: 'uxui', no: 'GALLERY 01', title: 'UX/UI · 웹 전시관',
    stone: 0xe3dccf, wall: 0xebe5da, floor: 0xd4cdc1, trim: 0xf1ece3,
    sky: 0xfff4e4, ground: 0xb8ad9d, key: 0xffe6c4, keyPos: [6, 7, 2], light: 'window', // 옆 창에서 들어오는 조금 따뜻한 빛
  },
  'hall-visual': {
    field: 'visual', no: 'GALLERY 02', title: 'Visual 전시관',
    stone: 0xdcdedd, wall: 0xe9eae8, floor: 0xcdcfcd, trim: 0xf0f1ef,
    sky: 0xf1f5ff, ground: 0xbfc3c6, key: 0xeef3ff, keyPos: [-1.5, 9, 1], light: 'grid',   // 격자 천장에서 내려오는 조금 차가운 빛
  },
};

const HALLS = {};

function hallStudents(field) { return STUDENTS.filter((s) => s.field === field); }

function makeHall(id) {
  const T = HALL_THEMES[id], L = HALL_LAYOUT;
  const root = $('#' + id);
  const students = hallStudents(T.field);
  const missing = STUDENTS.filter((s) => !s.field).map((s) => s.name);
  root.innerHTML = `
    <div class="tr-track hall-track" style="height:${120 + students.length * 110}vh">
      <div class="tr-view hall-view">
        <div class="tr-tags hall-tags"></div>
        <div class="hall-type" aria-hidden="true">
          <svg class="ht-line" viewBox="0 0 640 140" preserveAspectRatio="none">
            <defs><linearGradient id="${id}-fade" x1="0" x2="1"><stop offset=".55" stop-color="currentColor"/><stop offset="1" stop-color="currentColor" stop-opacity=".08"/></linearGradient></defs>
            <path pathLength="1" d="M0 118 H560 Q584 118 584 94 V8" stroke="url(#${id}-fade)"/>
          </svg>
          <p class="ht-no"></p>
          <p class="ht-name"></p>
          <p class="ht-slogan"></p>
        </div>
        <div class="tr-hud">
          <p class="tr-title">${T.no} <span>${T.title} · ${students.length}명</span></p>
          <p class="tr-hint">스크롤을 내리면 앞으로, 올리면 뒤로 날아가요</p>
          <div class="tr-steps">
            <button type="button" data-step="-1" aria-label="이전 지점으로">↑ 이전</button>
            <button type="button" data-step="1" aria-label="다음 지점으로">다음 ↓</button>
          </div>
          <div class="tr-bar" aria-hidden="true"><i></i></div>
        </div>
        <div class="tr-fail" role="alert" hidden>
          <p>3D 전시관을 불러오지 못했어요.</p>
          <div>
            <button type="button" data-act="list">전체 학생 보기</button>
            <button type="button" data-act="retry">다시 시도</button>
          </div>
        </div>
      </div>
    </div>`;
  const H = {
    id, T, root, students, missing,
    view: $('.hall-view', root), track: $('.hall-track', root), tagsEl: $('.hall-tags', root), failEl: $('.tr-fail', root),
    typeEl: $('.hall-type', root), barEl: $('.tr-bar i', root),
    ready: null, failed: false, progress: 0, target: 0, frozen: false, savedTop: null, savedP: 0,
    stops: [], nearStops: [], halfStops: [], busts: [], pillars: [], look: { x: 0, y: 0, tx: 0, ty: 0 }, typeAt: -1,
  };
  HALLS[id] = H;
  if (missing.length) console.info(`[${T.title}] 분야가 아직 정해지지 않아 전시관에서 빠진 학생 ${missing.length}명: ${missing.join(', ')} (목록 화면에는 보여요)`);

  $$('[data-step]', root).forEach((b) => b.addEventListener('click', () => hallJump(H, +b.dataset.step)));
  $('[data-act="retry"]', root).addEventListener('click', () => { H.ready = null; initHall(H); });
  $('[data-act="list"]', root).addEventListener('click', () => go('list'));
  H.view.addEventListener('click', (e) => {
    if (!H.r || e.target !== H.r.domElement) return;
    const rect = H.r.domElement.getBoundingClientRect();
    const v = new H.THREE.Vector2(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
    H.ray.far = Infinity; H.ray.setFromCamera(v, H.cam);
    const hit = H.ray.intersectObjects(H.busts.map((b) => b.obj).filter(Boolean), true)[0];
    if (hit) openDetail(hit.object.userData.i);
  });
  // 마우스로 살짝 둘러보기 (마우스일 때만)
  H.view.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse' || reduce) return;
    const r = H.view.getBoundingClientRect();
    H.look.tx = clamp((e.clientX - r.left) / r.width - 0.5, -0.5, 0.5) * 2;
    H.look.ty = clamp((e.clientY - r.top) / r.height - 0.5, -0.5, 0.5) * 2;
  });
  H.view.addEventListener('pointerleave', () => { H.look.tx = 0; H.look.ty = 0; });
  return H;
}

/* 석고상 자리 계산: 입구에서 -z 방향으로, 왼쪽(-1)·오른쪽(+1) 번갈아 */
function hallSpots(n) {
  const L = HALL_LAYOUT;
  return Array.from({ length: n }, (_, k) => { const side = k % 2 ? 1 : -1; return { side, x: side * L.sideX, z: 1.2 - k * L.gap }; });
}
/* 비행 길 경유점: 입구 → (각 석고상 앞, 그 석고상 쪽으로 조금 다가감) → 출구 아치 너머 */
function hallPath(spots) {
  const L = HALL_LAYOUT, first = spots[0], last = spots[spots.length - 1];
  const pts = [[0.3, L.eye + 0.05, first.z + 6.2], [0.15, L.eye, first.z + 3.6]];
  for (const s of spots) pts.push([s.side * L.pathX, L.eye - 0.03, s.z + L.standOff]);
  pts.push([0, L.eye, last.z - 2.2], [0, L.eye + 0.1, last.z - 5.6]);
  return pts;
}

function hallBuild(H, { THREE }) {
  const L = HALL_LAYOUT, T = H.T;
  const r = makeRenderer(THREE, 1.75);
  r.toneMappingExposure = 1.3;
  r.shadowMap.enabled = true; r.shadowMap.type = THREE.PCFSoftShadowMap;
  r.domElement.className = 'tr-canvas';
  H.view.prepend(r.domElement);
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(T.stone);
  const spots = hallSpots(Math.max(1, H.students.length));
  const zFront = spots[0].z + 8, zBack = spots[spots.length - 1].z - 8, len = zFront - zBack, zMid = (zFront + zBack) / 2;
  scene.fog = new THREE.Fog(T.stone, 10, 30);

  scene.add(new THREE.HemisphereLight(T.sky, T.ground, 1.55));
  const key = new THREE.DirectionalLight(T.key, 1.0);
  key.position.set(T.keyPos[0], T.keyPos[1], zMid + T.keyPos[2]); key.target.position.set(0, 0, zMid);
  key.castShadow = true; key.shadow.mapSize.set(2048, 2048); key.shadow.bias = -0.0004; key.shadow.normalBias = 0.02;
  // 그림자 카메라의 '위쪽'을 복도 길이 방향(z)으로 맞춰서, 위아래 범위로 복도 전체를 덮음
  key.shadow.camera.up.set(0, 0, 1);
  Object.assign(key.shadow.camera, { left: -9, right: 9, top: len / 2 + 2, bottom: -len / 2 - 2, near: 0.5, far: 40 });
  scene.add(key, key.target);

  const mat = (c, rough = 0.92) => new THREE.MeshStandardMaterial({ color: c, roughness: rough, metalness: 0 });
  const floorM = mat(T.floor), wallM = mat(T.wall), trimM = mat(T.trim), glowM = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const add = (m, x, y, z, { cast = true, receive = true } = {}) => { m.position.set(x, y, z); m.castShadow = cast; m.receiveShadow = receive; scene.add(m); return m; };

  const floor = add(new THREE.Mesh(new THREE.PlaneGeometry(L.halfWidth * 2, len), floorM), 0, 0, zMid, { cast: false });
  floor.rotation.x = -Math.PI / 2;
  // 벽: UX/UI관은 오른쪽 벽에 창이 나 있음 (창 사이 벽 조각 + 밝은 창)
  for (const sx of [-1, 1]) {
    if (T.light === 'window' && sx === 1) {
      const step = L.gap, winW = 1.7;
      for (let z = zFront; z > zBack; z -= step) {
        const seg = add(new THREE.Mesh(new THREE.BoxGeometry(0.2, L.ceiling, step - winW), wallM), sx * L.halfWidth, L.ceiling / 2, z - (step - winW) / 2, { cast: true });
        seg.receiveShadow = true;
        const top = add(new THREE.Mesh(new THREE.BoxGeometry(0.2, L.ceiling - 3.6, winW), wallM), sx * L.halfWidth, 3.6 + (L.ceiling - 3.6) / 2, z - step + winW / 2);
        const sill = add(new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.7, winW), wallM), sx * L.halfWidth, 0.35, z - step + winW / 2);
        const pane = add(new THREE.Mesh(new THREE.PlaneGeometry(winW, 2.9), glowM), sx * (L.halfWidth + 0.12), 2.15, z - step + winW / 2, { cast: false, receive: false });
        pane.rotation.y = -Math.PI / 2; void top; void sill;
      }
    } else {
      const w = add(new THREE.Mesh(new THREE.PlaneGeometry(len, L.ceiling), wallM), sx * L.halfWidth, L.ceiling / 2, zMid, { cast: false });
      w.rotation.y = -sx * Math.PI / 2;
    }
  }
  // 천장: Visual관은 격자 천장 (밝은 판 + 보), UX/UI관은 평평한 천장
  const ceil = add(new THREE.Mesh(new THREE.PlaneGeometry(L.halfWidth * 2, len), T.light === 'grid' ? glowM : wallM), 0, L.ceiling, zMid, { cast: false, receive: false });
  ceil.rotation.x = Math.PI / 2;
  if (T.light === 'grid') {
    const beamM = mat(0xb9bcbd);
    for (let x = -L.halfWidth; x <= L.halfWidth + 0.01; x += 1.6) add(new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.28, len), beamM), x, L.ceiling - 0.14, zMid, { cast: false });
    for (let z = zFront; z > zBack; z -= 1.6) add(new THREE.Mesh(new THREE.BoxGeometry(L.halfWidth * 2, 0.28, 0.12), beamM), 0, L.ceiling - 0.14, z, { cast: false });
  }
  // 출구 너머 밝은 빛 (프레임을 넘어)
  const exitGlow = add(new THREE.Mesh(new THREE.PlaneGeometry(L.halfWidth * 2, L.ceiling), glowM), 0, L.ceiling / 2, zBack, { cast: false, receive: false });
  void exitGlow;
  // 아치: 입구, 석고상 두 개마다, 출구. 로비와 같은 반원 아치
  const arch = (z) => {
    const ring = add(new THREE.Mesh(new THREE.TorusGeometry(1.6, 0.16, 12, 40, Math.PI), trimM), 0, 3, z);
    void ring;
    for (const sx of [-1, 1]) add(new THREE.Mesh(new THREE.BoxGeometry(0.32, 3, 0.32), trimM), sx * 1.6, 1.5, z);
  };
  arch(spots[0].z + 5.4);
  spots.forEach((s, k) => { if (k % 2 === 1 && k < spots.length - 1) arch(s.z - L.gap / 2); });
  arch(spots[spots.length - 1].z - 3.6);

  // 기둥: 두 번째 석고상부터, 그 석고상 앞을 가림
  const P = L.pillar, pillarM = trimM;
  H.pillars = spots.slice(1).map((s, k) => {
    // 앞 석고상 앞 멈춤 자리에서 이 석고상을 바라보는 선 위에 기둥을 세움 → 거기서는 가려지고, 앞으로 가면 서서히 드러남
    const from = { x: spots[k].side * L.pathX, z: spots[k].z + L.standOff }, pz = s.z + P.ahead;
    const px = from.x + (s.x - from.x) * ((from.z - pz) / (from.z - s.z));
    const p = add(new THREE.Mesh(new THREE.CylinderGeometry(P.r, P.r * 1.05, P.h, 32), pillarM), px, P.h / 2, pz);
    add(new THREE.Mesh(new THREE.BoxGeometry(P.r * 2.6, 0.2, P.r * 2.6), pillarM), px, 0.1, pz);
    return p;
  });

  // 받침대 + 가림 계산용 점 (석고상 모양을 아직 몰라도 바로 계산되게 상자 모양 점을 씀)
  const pedM = mat(0xf3efe8);
  H.busts = H.students.map((s, k) => {
    const sp = spots[k];
    add(new THREE.Mesh(new THREE.BoxGeometry(0.62, L.pedestal, 0.62), pedM), sp.x, L.pedestal / 2, sp.z);
    const spot = new THREE.PointLight(T.key, 0.7, 3.2, 1.6);
    spot.position.set(sp.x - sp.side * 0.4, L.pedestal + 1.6, sp.z + 0.7); scene.add(spot);
    const samples = [];
    for (let a = 0; a < 6; a++) for (let b = 0; b < 8; b++) for (const dz of [-0.12, 0.12]) {
      samples.push(new THREE.Vector3(sp.x + (a / 5 - 0.5) * 0.42, L.pedestal + 0.02 + (b / 7) * L.bustH * 0.96, sp.z + dz));
    }
    return { s, k, i: s.no - 1, x: sp.x, z: sp.z, side: sp.side, obj: null, ratio: 0, samples };
  });

  const curve = new THREE.CatmullRomCurve3(hallPath(spots).map((p) => new THREE.Vector3(...p)), false, 'centripetal');
  const cam = new THREE.PerspectiveCamera(58, 1, 0.05, 60);
  scene.updateMatrixWorld(true); // 기둥 위치를 바로 계산에 쓰려면 한 번 갱신해야 함 (그리기 전이라도)
  Object.assign(H, { THREE, r, scene, cam, curve, ray: new THREE.Raycaster(), w: 0, h: 0 });
  hallFitCam(H, (H.view.clientWidth || innerWidth) / (H.view.clientHeight || innerHeight));
}

/* 석고상 3D 파일을 길 순서대로 2개씩 불러옴: 첫 석고상이 먼저 보이고, 뒤쪽은 비행하는 동안 채워짐 */
async function hallLoadBusts(H) {
  const queue = [...H.busts];
  const worker = async () => {
    while (queue.length) {
      const b = queue.shift();
      const tpl = await loadModel(MODELS[b.s.name]);
      const obj = tpl.clone(true);
      obj.scale.setScalar(HALL_LAYOUT.bustH);
      obj.position.set(b.x, HALL_LAYOUT.pedestal, b.z);
      obj.rotation.y = Math.atan2(-b.x, 3);
      obj.traverse((o) => { o.userData.i = b.i; if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
      H.scene.add(obj); b.obj = obj;
      const el = $(`.tr-tag[data-i="${b.i}"]`, H.tagsEl); if (el) el.dataset.loaded = '1';
    }
  };
  await Promise.all([worker(), worker()]);
}

function hallPose(H, p, t = 0) {
  const { THREE, curve, cam } = H, L = HALL_LAYOUT;
  const pos = curve.getPointAt(clamp(p, 0, 1));
  const ahead = curve.getPointAt(clamp(p + 0.03, 0, 1));
  if (p > 0.97) ahead.add(curve.getTangentAt(1).multiplyScalar(2));
  const look = ahead.clone();
  let best = null, bw = 0;
  for (const b of H.busts) {
    const dz = pos.z - b.z; if (dz < 0.4) continue;
    const d = Math.hypot(pos.x - b.x, dz);
    const w = clamp(1 - (d - 1.4) / 3.2, 0, 1) * 0.45;
    if (w > bw) { bw = w; best = b; }
  }
  if (best) look.lerp(new THREE.Vector3(best.x, L.pedestal + L.bustH * 0.6, best.z), bw);
  const bob = reduce ? 0 : Math.sin(t / 900) * 0.025;
  cam.position.set(pos.x, pos.y + bob, pos.z);
  cam.lookAt(look);
  if (H.look.x || H.look.y) {
    const rad = THREE.MathUtils.degToRad(L.lookDeg);
    cam.rotateY(-H.look.x * rad); cam.rotateX(-H.look.y * rad * 0.6);
  }
  cam.updateMatrixWorld(true);
}

/* 석고상이 기둥에 안 가려진 정도 0~1 */
function hallVisible(H, b) {
  const { cam, ray, THREE } = H;
  cam.updateProjectionMatrix();
  let inView = 0, seen = 0;
  const ndc = new THREE.Vector3(), dir = new THREE.Vector3();
  for (const p of b.samples) {
    ndc.copy(p).project(cam);
    if (ndc.z > 1 || Math.abs(ndc.x) > 1 || Math.abs(ndc.y) > 1) continue;
    inView++;
    dir.copy(p).sub(cam.position); const dist = dir.length(); dir.normalize();
    ray.set(cam.position, dir); ray.far = dist;
    if (!ray.intersectObjects(H.pillars, false).length) seen++;
  }
  return inView < b.samples.length * 0.6 ? 0 : seen / b.samples.length;
}

/* 멈춤 지점: 각 석고상 앞, 그리고 다음 석고상이 기둥 뒤에서 절반 보이는 곳.
   기둥 옆을 지나는 순간은 짧아서, 그 구간에서는 스크롤을 더 많이 해야 앞으로 가도록 '느린 구간'을 만듦
   → 다음 석고상이 서서히 드러남. (스크롤 진행률 u ↔ 길 위 위치 p 를 바꿔 주는 표를 만들어 둠) */
function hallFindStops(H) {
  const L = HALL_LAYOUT, look = H.look, keep = { x: look.x, y: look.y };
  look.x = look.y = 0;
  const near = (b) => { let bp = 0, bd = 1e9; for (let p = 0; p <= 1; p += 0.0005) { const q = H.curve.getPointAt(p); const d = Math.hypot(q.x - b.side * L.pathX, q.z - b.z - L.standOff); if (d < bd) { bd = d; bp = p; } } return bp; };
  const nearP = H.busts.map(near);
  // 드러나기 시작(0.05)~다 드러남(0.95) 구간과 절반(0.5) 지점을 길 위에서 찾음
  const reveal = H.busts.map((b, k) => {
    if (k === 0) return null;
    let from = null, to = null, half = null, hd = 0.25, wasHidden = false;
    for (let p = nearP[k - 1]; p <= nearP[k]; p += 0.0005) {
      hallPose(H, p); const v = hallVisible(H, b);
      if (v < 0.05) { wasHidden = true; from = p; continue; }
      if (!wasHidden) continue;
      if (Math.abs(v - 0.5) < hd) { hd = Math.abs(v - 0.5); half = p; }
      if (v > 0.95 && to == null) to = p;
    }
    return half == null ? null : { from: from ?? half, to: to ?? nearP[k], half };
  });
  Object.assign(look, keep);
  // 느린 구간 표: 드러나는 구간은 원래보다 SLOW배 스크롤해야 지나감
  const SLOW = 7, N = 4000, cum = new Float32Array(N + 1);
  for (let i = 1; i <= N; i++) {
    const p = (i - 0.5) / N;
    const slow = reveal.some((r) => r && p >= r.from - 0.004 && p <= r.to + 0.004);
    cum[i] = cum[i - 1] + (slow ? SLOW : 1);
  }
  for (let i = 0; i <= N; i++) cum[i] /= cum[N];
  H.toScroll = (p) => { const x = clamp(p, 0, 1) * N, i = Math.floor(x); return i >= N ? 1 : cum[i] + (cum[i + 1] - cum[i]) * (x - i); };
  H.toPath = (u) => {
    u = clamp(u, 0, 1); let lo = 0, hi = N;
    while (hi - lo > 1) { const m = (lo + hi) >> 1; if (cum[m] <= u) lo = m; else hi = m; }
    const span = cum[hi] - cum[lo] || 1;
    return (lo + (u - cum[lo]) / span) / N;
  };
  H.nearStops = nearP.map(H.toScroll);
  H.halfStops = reveal.map((r) => (r ? H.toScroll(r.half) : null));
  H.stops = [0, ...H.busts.flatMap((_, k) => [H.halfStops[k], H.nearStops[k]]).filter((p) => p != null), 1].sort((x, y) => x - y);
}

function hallTagsHTML(H) {
  H.tagsEl.innerHTML = H.busts.map((b) =>
    `<button class="tr-tag" type="button" data-i="${b.i}" aria-label="${b.s.name} 학생 소개 보기"><i>+</i>${b.s.name}<em>${FIELD_LABEL[b.s.field] || ''}</em></button>`).join('');
  $$('.tr-tag', H.tagsEl).forEach((el) => el.addEventListener('click', () => openDetail(+el.dataset.i)));
}

function hallShowFail(H, e) {
  H.failed = true; H.ready = null;
  if (e) console.error(`${H.T.title} 3D를 불러오지 못했습니다`, e);
  H.failEl.hidden = false;
  setTimeout(() => { if (H.failed && page === H.id) $('[data-act="retry"]', H.root).focus({ preventScroll: true }); }, 80);
}

function hallSetupScroll(H) {
  if (H.scrollReady) return;
  H.scrollReady = true;
  if (window.gsap && window.ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);
    H.st = ScrollTrigger.create({
      scroller: H.root, trigger: H.track, start: 'top top', end: 'bottom bottom',
      onUpdate: (self) => { if (!H.frozen) H.target = self.progress; },
    });
  } else {
    H.root.addEventListener('scroll', () => { if (!H.frozen) H.target = H.root.scrollTop / hallScrollMax(H); }, { passive: true });
  }
}
function hallScrollMax(H) { return Math.max(1, H.root.scrollHeight - H.root.clientHeight); }

function initHall(H) {
  hallSetupScroll(H);
  if (H.ready) return H.ready;
  H.failEl.hidden = true; H.failed = false;
  const forceFail = new URLSearchParams(location.search).has('fail3d');
  if (!H.students.length) { hallShowFail(H, new Error('이 전시관에 배정된 학생이 없음')); return Promise.resolve(); }
  H.ready = (forceFail ? Promise.reject(new Error('fail3d 시험')) : three())
    .then((lib) => {
      if (!H.r) hallBuild(H, lib);
      hallFindStops(H); hallTagsHTML(H); H.root.dataset.ready = '1';
      // 석고상 파일은 화면이 뜬 뒤에 이어서 불러옴 (받침대·멈춤 지점은 이미 준비됨)
      return hallLoadBusts(H).then(() => { H.root.dataset.loaded = '1'; });
    })
    .catch((e) => hallShowFail(H, e));
  return H.ready;
}

function hallJump(H, dir) {
  if (!H.stops.length) return;
  const cur = H.target, eps = 0.003;
  const next = dir > 0 ? H.stops.find((p) => p > cur + eps) : [...H.stops].reverse().find((p) => p < cur - eps);
  if (next == null) return;
  H.root.scrollTo({ top: next * hallScrollMax(H), behavior: reduce ? 'auto' : 'smooth' });
  if (reduce) H.target = next;
}

function hallFitCam(H, aspect) {
  const cam = H.cam, deg = H.THREE.MathUtils;
  cam.aspect = aspect;
  cam.fov = clamp(deg.radToDeg(2 * Math.atan(Math.tan(deg.degToRad(70) / 2) / aspect)), 58, 100);
  cam.updateProjectionMatrix();
}

/* 석고상 앞에 멈추면 큰 이름 글자 + 선 */
function hallType(H) {
  let at = -1, bd = HALL_LAYOUT.typeWindow;
  H.nearStops.forEach((p, k) => { const d = Math.abs(H.progress - p); if (d < bd) { bd = d; at = k; } });
  if (at === H.typeAt) return;
  H.typeAt = at;
  const el = H.typeEl;
  el.classList.remove('on');
  if (at < 0) return;
  const b = H.busts[at];
  clearTimeout(H.typeTimer);
  H.typeTimer = setTimeout(() => {
    if (H.typeAt !== at) return;
    $('.ht-no', el).textContent = `${pad(at + 1)} / ${pad(H.busts.length)} · ${FIELD_LABEL[b.s.field] || ''}`;
    $('.ht-name', el).textContent = b.s.name;
    $('.ht-slogan', el).textContent = b.s.slogan || '';
    el.classList.toggle('right', b.side < 0); // 석고상이 왼쪽이면 글자는 오른쪽에
    void el.offsetWidth; el.classList.add('on');
  }, reduce ? 0 : 120);
}

function renderHall(H, t) {
  if (!H.r || H.failed) return;
  if (detail >= 0) {
    if (!H.frozen) { H.frozen = true; H.savedTop = H.root.scrollTop; H.savedP = H.target; }
    return;
  }
  if (H.frozen) {
    H.frozen = false;
    if (H.savedTop != null) { H.root.scrollTop = H.savedTop; H.target = H.savedP; H.savedTop = null; }
  }
  const W = H.view.clientWidth, Hh = H.view.clientHeight;
  if (W !== H.w || Hh !== H.h) { H.w = W; H.h = Hh; H.r.setSize(W, Hh, false); hallFitCam(H, W / Hh); }
  const dt = Math.min(250, t - (H.lastT || t)); H.lastT = t;
  const k = reduce ? 1 : 1 - Math.exp(-dt / 140);
  H.progress += (H.target - H.progress) * k;
  if (Math.abs(H.target - H.progress) < 1e-4) H.progress = H.target;
  const lk = reduce ? 1 : 1 - Math.exp(-dt / 220);
  H.look.x += (H.look.tx - H.look.x) * lk; H.look.y += (H.look.ty - H.look.y) * lk;
  if (Math.abs(H.look.x) < 1e-4 && !H.look.tx) H.look.x = 0;
  if (Math.abs(H.look.y) < 1e-4 && !H.look.ty) H.look.y = 0;
  hallPose(H, H.toPath(H.progress), t);
  H.r.render(H.scene, H.cam);
  const v = new H.THREE.Vector3(), moved = H.progress !== H.lastCheck;
  for (const b of H.busts) {
    const el = $(`.tr-tag[data-i="${b.i}"]`, H.tagsEl); if (!el) continue;
    if (moved || !b.checked) b.ratio = hallVisible(H, b), b.checked = true;
    v.set(b.x, HALL_LAYOUT.pedestal + HALL_LAYOUT.bustH + 0.12, b.z).project(H.cam);
    // 이름표는 가까운 석고상(8m 안)만: 멀리 있는 석고상 이름표가 기둥 앞에 떠 보이지 않게
    const show = !!b.obj && b.ratio > 0.35 && v.z < 1 && Math.abs(v.x) < 1.05 && H.cam.position.distanceTo(new H.THREE.Vector3(b.x, H.cam.position.y, b.z)) < 8;
    el.classList.toggle('on', show);
    el.tabIndex = show ? 0 : -1;
    if (show) el.style.transform = `translate(${(v.x + 1) / 2 * W}px,${(1 - v.y) / 2 * Hh}px) translate(-50%,-100%)`;
  }
  H.lastCheck = H.progress;
  hallType(H);
  H.barEl.style.transform = `scaleX(${H.progress})`;
}

function enterHall(id) {
  const H = HALLS[id];
  initHall(H);
  requestAnimationFrame(() => { if (H.st) ScrollTrigger.refresh(); });
}

for (const id of Object.keys(HALL_THEMES)) if ($('#' + id)) makeHall(id);
