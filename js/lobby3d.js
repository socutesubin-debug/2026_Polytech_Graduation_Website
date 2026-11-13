/* V2 로비 (#lobby3d) — 스토리보드 s5: 하얀 돌벽에 아치 3개, 아치마다 둥근 등 하나
   왼쪽 UX/UI의 방(GALLERY 01) · 가운데 비주얼의 방(GALLERY 02) · 오른쪽 스페셜룸(GALLERY 03)
   - 아치에 마우스를 올리면 등이 밝아지고, 누르면 그 아치 안으로 날아 들어가며 방으로 이동
   - 같은 입구 3개가 HTML 버튼(#lb-doors)으로도 있어서 Tab/Enter로 고를 수 있음
   - 모바일(760px 이하)·3D 실패·움직임 줄이기 없이도: 3D 대신 아치 카드 3장 + [전체 학생 바로가기]
   숫자를 바꾸고 싶으면 아래 LOBBY3D만 고치면 됩니다 (단위: 미터 비슷한 크기) */
const LOBBY3D = {
  cam: { pos: [0, 1.55, 9.4], look: [0, 2.05, 0], fov: 44 }, // 첫 구도: 입구 영상의 마지막 아치와 맞출 때 여기를 고침
  archX: [-4.3, 0, 4.3],     // 아치 3개의 가운데 위치
  archW: 2.5, archStraight: 2.5, // 아치 폭, 곧은 부분 높이 (그 위에 반원)
  wallH: 6.6, wallW: 22, depth: 0.8,
  lamp: { y: 3.05, r: 0.2, idle: 0.9, hover: 2.6 },
  stone: 0xf3eee4, floor: 0xe2dbcf, trim: 0xfbf7f0,
  rooms: [0xeadfcb, 0xdde2e3, 0x2b2118], // 아치 안쪽 방 색: UX/UI(따뜻함) · Visual(차가움) · 스페셜(짙음)
  flyMs: 1100,
};
const LOBBY_DOORS = ['hall-uxui', 'hall-visual', 'special'];
const lb = {
  root: $('#lobby3d'), view: $('#lb-view'), doors: $$('#lb-doors .lb-door'),
  ready: null, failed: false, hover: -1, flying: null, lamps: [], hits: [], w: 0, h: 0,
};
$('#lb-count-0').textContent = `${hallStudents('uxui').length}명의 석고상`;
$('#lb-count-1').textContent = `${hallStudents('visual').length}명의 석고상`;
$('#lb-count-2').textContent = `대표 작품 ${STUDENTS.length}점`;

const lobbyWants3D = () => !matchMedia('(max-width: 760px)').matches && !new URLSearchParams(location.search).has('fail3d');

function lobbyBuild({ THREE }) {
  const C = LOBBY3D, r = makeRenderer(THREE, 1.75);
  r.toneMappingExposure = 1.45; r.shadowMap.enabled = true; r.shadowMap.type = THREE.PCFSoftShadowMap;
  r.domElement.className = 'lb-canvas';
  lb.view.replaceChildren(r.domElement);
  const scene = new THREE.Scene(); scene.background = new THREE.Color(C.stone); scene.fog = new THREE.Fog(C.stone, 16, 34);
  scene.add(new THREE.HemisphereLight(0xfffaf0, 0xcfc4b2, 1.9));
  const key = new THREE.DirectionalLight(0xfff0d8, 1.1); key.position.set(-5, 9, 8); key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048); key.shadow.bias = -0.0004; key.shadow.normalBias = 0.02;
  Object.assign(key.shadow.camera, { left: -12, right: 12, top: 10, bottom: -4, near: 0.5, far: 40 });
  scene.add(key);
  const mat = (c, rough = 0.93) => new THREE.MeshStandardMaterial({ color: c, roughness: rough, metalness: 0 });
  const stoneM = mat(C.stone), trimM = mat(C.trim), floorM = mat(C.floor);

  // 바닥
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(C.wallW + 8, 30), floorM); floor.rotation.x = -Math.PI / 2; floor.position.z = 2; floor.receiveShadow = true; scene.add(floor);
  // 벽: 아치 모양 구멍 3개가 뚫린 두꺼운 돌벽
  const half = C.archW / 2, wall = new THREE.Shape();
  wall.moveTo(-C.wallW / 2, 0); wall.lineTo(C.wallW / 2, 0); wall.lineTo(C.wallW / 2, C.wallH); wall.lineTo(-C.wallW / 2, C.wallH); wall.closePath();
  for (const x of C.archX) {
    const hole = new THREE.Path();
    hole.moveTo(x - half, 0); hole.lineTo(x - half, C.archStraight); hole.absarc(x, C.archStraight, half, Math.PI, 0, true); hole.lineTo(x + half, 0); hole.closePath();
    wall.holes.push(hole);
  }
  const wallMesh = new THREE.Mesh(new THREE.ExtrudeGeometry(wall, { depth: C.depth, bevelEnabled: false, curveSegments: 40 }), stoneM);
  wallMesh.position.z = -C.depth; wallMesh.castShadow = true; wallMesh.receiveShadow = true; scene.add(wallMesh);
  // 위쪽 띠(처마)와 아래 걸레받이
  const band = new THREE.Mesh(new THREE.BoxGeometry(C.wallW, 0.22, 0.3), trimM); band.position.set(0, 5.75, 0.12); band.castShadow = true; scene.add(band);
  const base = new THREE.Mesh(new THREE.BoxGeometry(C.wallW, 0.3, 0.16), trimM); base.position.set(0, 0.15, 0.06);
  // 걸레받이는 아치 구멍 앞을 막지 않도록 조각으로 나눔
  const edges = [-C.wallW / 2, ...C.archX.flatMap((x) => [x - half - 0.24, x + half + 0.24]), C.wallW / 2];
  for (let i = 0; i < edges.length; i += 2) { const b = base.clone(); const w = edges[i + 1] - edges[i]; b.geometry = new THREE.BoxGeometry(w, 0.3, 0.16); b.position.x = (edges[i] + edges[i + 1]) / 2; b.receiveShadow = true; scene.add(b); }

  C.archX.forEach((x, k) => {
    // 아치 테두리 (전시관의 아치와 같은 반원 모양) + 양옆 기둥
    const ring = new THREE.Mesh(new THREE.TorusGeometry(half + 0.12, 0.14, 12, 48, Math.PI), trimM); ring.position.set(x, C.archStraight, 0.04); ring.castShadow = true; scene.add(ring);
    for (const sx of [-1, 1]) { const p = new THREE.Mesh(new THREE.BoxGeometry(0.28, C.archStraight, 0.3), trimM); p.position.set(x + sx * (half + 0.12), C.archStraight / 2, 0.04); p.castShadow = true; p.receiveShadow = true; scene.add(p); }
    // 아치 안쪽 방 (안에서 보는 상자)
    const roomM = new THREE.MeshStandardMaterial({ color: C.rooms[k], roughness: 0.95, side: THREE.BackSide });
    const room = new THREE.Mesh(new THREE.BoxGeometry(4.2, 5.2, 6), roomM); room.position.set(x, 2.6, -C.depth - 3); room.receiveShadow = true; scene.add(room);
    // 둥근 등 + 줄
    const lampM = new THREE.MeshBasicMaterial({ color: 0xfff1d2 });
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(C.lamp.r, 32, 24), lampM); lamp.position.set(x, C.lamp.y, -C.depth / 2); scene.add(lamp);
    const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 1.0, 8), mat(0x6b6258)); cord.position.set(x, C.lamp.y + C.lamp.r + 0.5, -C.depth / 2); scene.add(cord);
    const light = new THREE.PointLight(k === 2 ? 0xffd9a0 : 0xfff0d2, C.lamp.idle, 9, 1.6); light.position.set(x, C.lamp.y - 0.1, -C.depth / 2 - 0.4); scene.add(light);
    const halo = new THREE.Mesh(new THREE.SphereGeometry(C.lamp.r * 2.6, 24, 16), new THREE.MeshBasicMaterial({ color: 0xfff1d2, transparent: true, opacity: 0.1, depthWrite: false, blending: THREE.AdditiveBlending })); halo.position.copy(lamp.position); scene.add(halo);
    lb.lamps[k] = { light, halo, glow: 0 };
    // 마우스가 닿는지 재는 투명 문
    const hit = new THREE.Mesh(new THREE.PlaneGeometry(C.archW + 0.5, C.archStraight + half + 0.3), new THREE.MeshBasicMaterial({ visible: false }));
    hit.position.set(x, (C.archStraight + half) / 2, 0.02); hit.userData.k = k; scene.add(hit); lb.hits[k] = hit;
    // 방 안에 보이는 것: 받침대(UX/UI·Visual), 금 액자(스페셜)
    if (k < 2) {
      const ped = new THREE.Mesh(new THREE.BoxGeometry(0.62, 1.0, 0.62), mat(0xf3efe8)); ped.position.set(x, 0.5, -C.depth - 2.6); ped.castShadow = true; ped.receiveShadow = true; scene.add(ped);
    } else {
      const frame = new THREE.Mesh(new THREE.BoxGeometry(1.15, 1.45, 0.08), new THREE.MeshBasicMaterial({ color: 0xc9a25c })); frame.position.set(x, 1.75, -C.depth - 3.4); scene.add(frame);
      const art = new THREE.Mesh(new THREE.PlaneGeometry(0.93, 1.23), new THREE.MeshBasicMaterial({ color: 0x9a9084 })); art.position.set(x, 1.75, -C.depth - 3.35); scene.add(art);
    }
  });

  const cam = new THREE.PerspectiveCamera(C.cam.fov, 1, 0.05, 80);
  Object.assign(lb, { THREE, r, scene, cam, ray: new THREE.Raycaster() });
  lobbyFitCam((lb.view.clientWidth || innerWidth) / (lb.view.clientHeight || innerHeight));

  // 두 전시관 받침대 위에 석고상 하나씩 (가벼운 파일): 로비가 뜬 뒤에 천천히 불러옴
  const show = [hallStudents('uxui')[0], hallStudents('visual')[0]];
  show.forEach((s, k) => {
    if (!s || !MODELS[s.name]) return;
    loadModel(MODELS[s.name]).then((tpl) => {
      const o = tpl.clone(true); o.scale.setScalar(0.62); o.position.set(C.archX[k], 1.0, -C.depth - 2.6);
      o.traverse((m) => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } }); scene.add(o);
    }).catch((e) => console.warn('로비 석고상을 불러오지 못했어요 (로비는 그대로 쓸 수 있어요)', e));
  });
}
/* 화면이 좁으면 시야를 넓혀서 아치 3개가 다 보이게 함 */
function lobbyFitCam(aspect) {
  const { cam, THREE } = lb, d = THREE.MathUtils, C = LOBBY3D;
  const needH = d.degToRad(74); // 가로로 꼭 보여야 하는 각도
  cam.aspect = aspect;
  cam.fov = clamp(d.radToDeg(2 * Math.atan(Math.tan(needH / 2) / aspect)), C.cam.fov, 96);
  cam.updateProjectionMatrix();
}
function lobbyPose(t) {
  const { cam, THREE } = lb, C = LOBBY3D;
  const home = new THREE.Vector3(...C.cam.pos), look = new THREE.Vector3(...C.cam.look);
  if (!reduce) { home.x += ptr.x * 0.7; home.y += -ptr.y * 0.25 + Math.sin(t / 2600) * 0.03; }
  if (lb.flying) {
    const f = lb.flying, x = C.archX[f.k], e = clamp((t - f.t0) / C.flyMs, 0, 1), k = e * e * (3 - 2 * e);
    home.lerp(new THREE.Vector3(x, 1.5, -C.depth - 0.6), k);
    look.lerp(new THREE.Vector3(x, 1.5, -C.depth - 4), k);
  }
  cam.position.copy(home); cam.lookAt(look);
}
function renderLobby3D(t) {
  if (!lb.r || lb.failed) return;
  const W = lb.view.clientWidth, H = lb.view.clientHeight; if (!W || !H) return;
  if (W !== lb.w || H !== lb.h) { lb.w = W; lb.h = H; lb.r.setSize(W, H, false); lobbyFitCam(W / H); }
  lobbyPose(t);
  const C = LOBBY3D, focus = lb.doors.findIndex((b) => b === document.activeElement || b.matches(':hover'));
  const on = lb.flying ? lb.flying.k : focus >= 0 ? focus : lb.hover;
  lb.lamps.forEach((L, k) => {
    L.glow += ((k === on ? 1 : 0) - L.glow) * (reduce ? 1 : 0.12);
    L.light.intensity = C.lamp.idle + (C.lamp.hover - C.lamp.idle) * L.glow;
    L.halo.material.opacity = 0.1 + 0.3 * L.glow; L.halo.scale.setScalar(1 + 0.25 * L.glow);
  });
  lb.doors.forEach((b, k) => b.classList.toggle('lit', k === on));
  lb.r.render(lb.scene, lb.cam);
  // 입구 버튼을 각 아치 아래에 맞춰 놓음
  const v = new lb.THREE.Vector3();
  lb.doors.forEach((b, k) => {
    v.set(C.archX[k], 0, 0.9).project(lb.cam);
    b.style.left = `${(v.x + 1) / 2 * W}px`; b.style.top = `${(1 - v.y) / 2 * H}px`;
  });
}
function lobbyPick(e) {
  if (!lb.r || lb.flying) return -1;
  const rect = lb.r.domElement.getBoundingClientRect();
  const p = new lb.THREE.Vector2(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
  lb.ray.setFromCamera(p, lb.cam);
  const hit = lb.ray.intersectObjects(lb.hits, false)[0];
  return hit ? hit.object.userData.k : -1;
}
/* 아치 안으로 날아 들어간 뒤 그 방으로 이동 */
async function lobbyEnter(k) {
  if (lb.flying || page !== 'lobby3d') return;
  const target = LOBBY_DOORS[k];
  if (!lb.r || lb.failed || reduce || !lb.root.classList.contains('is3d')) { go(target); return; }
  const my = ++seq;
  lb.flying = { k, t0: performance.now() };
  lb.root.classList.add('flying');
  await wait(LOBBY3D.flyMs - 250);
  if (my !== seq) { lobbyReset(); return; }
  go(target);
  await wait(950);
  lobbyReset();
}
function lobbyReset() { lb.flying = null; lb.root.classList.remove('flying'); }
function initLobby3D() {
  if (lb.ready || !lobbyWants3D()) return lb.ready;
  lb.failed = false;
  lb.ready = three().then((lib) => {
    lobbyBuild(lib);
    lb.root.classList.add('is3d'); lb.root.dataset.ready = '1';
  }).catch((e) => { // 3D가 안 되면 아치 카드 3장으로 (버튼은 이미 화면에 있음)
    console.error('로비 3D를 불러오지 못했습니다. 카드 화면으로 보여 줍니다.', e);
    lb.failed = true; lb.ready = null; lb.root.classList.remove('is3d'); lb.root.dataset.ready = 'cards';
  });
  return lb.ready;
}
function enterLobby3D() {
  lobbyReset();
  if (lobbyWants3D()) initLobby3D(); else lb.root.dataset.ready = 'cards';
}
lb.view.addEventListener('pointermove', (e) => { if (e.pointerType === 'mouse') { lb.hover = lobbyPick(e); lb.view.style.cursor = lb.hover >= 0 ? 'pointer' : ''; } });
lb.view.addEventListener('pointerleave', () => { lb.hover = -1; });
lb.view.addEventListener('click', (e) => { const k = lobbyPick(e); if (k >= 0) lobbyEnter(k); });
lb.doors.forEach((b, k) => b.addEventListener('click', () => lobbyEnter(k)));
$('#lb-all').addEventListener('click', () => go('list'));
