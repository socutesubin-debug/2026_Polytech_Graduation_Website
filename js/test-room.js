/* 시험 방 (#test-room): 기둥 1개 + 3D 석고상 3개.
   나비의 눈높이에서 스크롤로 정해진 곡선 길을 앞뒤로 날아간다.
   - 스크롤 아래 = 전진, 위 = 후진, 손을 멈추면 그 자리에 머문다
   - 석고상(또는 이름표)을 누르면 비행을 멈추고 학생 소개를 연다. 닫으면 같은 자리·같은 초점으로 돌아온다
   - 3D를 못 불러오면 '전체 학생 보기 / 다시 시도'를 보여 준다
   숫자를 바꾸고 싶으면 아래 TR_LAYOUT만 고치면 된다 (단위: 미터 비슷한 크기) */
const TR_LAYOUT = {
  students: ['박재연', '민하도', '조민영'],          // 시험용 학생 3명 (3D 파일이 작은 순서로 고름)
  eye: 1.45,                                         // 나비 눈높이
  // 비행 길의 경유점 [x, y, z]. 입구(z=7)에서 출발해 -z 방향으로 날아간다
  path: [[0.4, 1.5, 7], [0.7, 1.45, 3.5], [0.1, 1.42, 0], [-0.8, 1.4, -2.8], [-0.7, 1.42, -6], [-0.2, 1.45, -9], [-0.4, 1.45, -11.6], [0, 1.55, -15.5]],
  busts: [{ x: -1.6, z: 1.2 }, { x: 1.4, z: -9.6 }, { x: -1.6, z: -12.8 }], // 석고상 받침대 위치
  pillar: { x: 0.95, z: -7.1, r: 0.38, h: 4.2 },     // 기둥 (두 번째 석고상을 가린다)
  pedestal: 1.0, bustH: 0.62,                        // 받침대 높이, 석고상 키
};

const tr = $('#test-room'), trView = $('#tr-view'), trTags = $('#tr-tags'), trFail = $('#tr-fail');
const TR = { ready: null, failed: false, progress: 0, target: 0, savedTop: null, stops: [], busts: [], frozen: false };

function trStudents() { return TR_LAYOUT.students.map((n) => STUDENTS.find((s) => s.name === n)).filter(Boolean); }

/* 스크롤 진행률 0~1 읽기. GSAP ScrollTrigger가 있으면 그것을 쓰고, 없으면(인터넷 끊김) 직접 계산 */
function trScrollMax() { return Math.max(1, tr.scrollHeight - tr.clientHeight); }
function trSetupScroll() {
  if (TR.scrollReady) return;
  TR.scrollReady = true;
  if (window.gsap && window.ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);
    TR.st = ScrollTrigger.create({
      scroller: tr, trigger: '#tr-track', start: 'top top', end: 'bottom bottom',
      onUpdate: (self) => { if (!TR.frozen) TR.target = self.progress; },
    });
  } else {
    tr.addEventListener('scroll', () => { if (!TR.frozen) TR.target = tr.scrollTop / trScrollMax(); }, { passive: true });
  }
}

function trBuild({ THREE }) {
  const L = TR_LAYOUT;
  const r = makeRenderer(THREE, 1.75);
  r.domElement.className = 'tr-canvas';
  trView.prepend(r.domElement);
  const scene = new THREE.Scene();
  const stone = 0xdcd6cc;
  scene.background = new THREE.Color(stone);
  scene.fog = new THREE.Fog(stone, 9, 26);
  // 부드러운 빛: 하늘빛 + 따뜻한 위쪽 빛
  scene.add(new THREE.HemisphereLight(0xfff8ee, 0xb9b0a3, 1.1));
  const sun = new THREE.DirectionalLight(0xfff1dc, 1.1); sun.position.set(-3, 8, 4); scene.add(sun);

  const mat = (c, rough = 0.92) => new THREE.MeshStandardMaterial({ color: c, roughness: rough, metalness: 0 });
  const floorM = mat(0xcfc8bd), wallM = mat(0xe4dfd6), pillarM = mat(0xe9e4db), pedM = mat(0xf1ede6);

  const floor = new THREE.Mesh(new THREE.PlaneGeometry(10, 40), floorM);
  floor.rotation.x = -Math.PI / 2; floor.position.z = -4; scene.add(floor);
  for (const sx of [-1, 1]) {
    const w = new THREE.Mesh(new THREE.PlaneGeometry(40, 6), wallM);
    w.rotation.y = -sx * Math.PI / 2; w.position.set(sx * 3, 3, -4); scene.add(w);
  }
  // 아치 3개 (입구·중간·출구)
  for (const z of [5.5, -4.2, -16.5]) {
    const g = new THREE.Group();
    const ring = new THREE.Mesh(new THREE.TorusGeometry(1.6, 0.16, 12, 40, Math.PI), pillarM);
    ring.position.y = 3; g.add(ring);
    for (const sx of [-1, 1]) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.32, 3, 0.32), pillarM);
      leg.position.set(sx * 1.6, 1.5, 0); g.add(leg);
    }
    g.position.z = z; scene.add(g);
  }
  // 기둥
  const P = L.pillar;
  const pillar = new THREE.Mesh(new THREE.CylinderGeometry(P.r, P.r * 1.05, P.h, 32), pillarM);
  pillar.position.set(P.x, P.h / 2, P.z); scene.add(pillar);
  const base = new THREE.Mesh(new THREE.BoxGeometry(P.r * 2.6, 0.2, P.r * 2.6), pillarM);
  base.position.set(P.x, 0.1, P.z); scene.add(base);

  // 받침대 (석고상은 나중에 불러와서 올림)
  const list = trStudents();
  TR.busts = list.map((s, k) => {
    const b = L.busts[k];
    const ped = new THREE.Mesh(new THREE.BoxGeometry(0.62, L.pedestal, 0.62), pedM);
    ped.position.set(b.x, L.pedestal / 2, b.z); scene.add(ped);
    const spot = new THREE.PointLight(0xffe6c2, 0.9, 3.2, 1.6);
    spot.position.set(b.x, L.pedestal + 1.6, b.z + 0.6); scene.add(spot);
    return { s, i: s.no - 1, x: b.x, z: b.z, obj: null, ped, ratio: 0, samples: [] };
  });

  const curve = new THREE.CatmullRomCurve3(L.path.map((p) => new THREE.Vector3(...p)), false, 'centripetal');
  const cam = new THREE.PerspectiveCamera(58, 1, 0.05, 60);
  Object.assign(TR, { THREE, r, scene, cam, curve, pillar, ray: new THREE.Raycaster(), w: 0, h: 0 });
  trFitCam((trView.clientWidth || innerWidth) / (trView.clientHeight || innerHeight));
}

/* 석고상 3D 불러와 받침대 위에 올리기 */
async function trLoadBusts() {
  await Promise.all(TR.busts.map(async (b) => {
    const tpl = await loadModel(MODELS[b.s.name]);
    const obj = tpl.clone(true);
    obj.scale.setScalar(TR_LAYOUT.bustH);
    obj.position.set(b.x, TR_LAYOUT.pedestal, b.z);
    obj.rotation.y = Math.atan2(-b.x, 3);            // 길 쪽을 살짝 바라보게
    obj.userData.i = b.i;
    obj.traverse((o) => { o.userData.i = b.i; });
    TR.scene.add(obj); b.obj = obj;
    // 가림 계산용 점: 석고상 표면 점을 골고루 최대 160개
    obj.updateMatrixWorld(true);
    const pts = [], v = new TR.THREE.Vector3();
    obj.traverse((o) => {
      const pos = o.geometry && o.geometry.attributes.position; if (!pos) return;
      const step = Math.max(1, Math.floor(pos.count / 160));
      for (let j = 0; j < pos.count; j += step) pts.push(v.fromBufferAttribute(pos, j).applyMatrix4(o.matrixWorld).clone());
    });
    const step = Math.max(1, Math.floor(pts.length / 160));
    b.samples = pts.filter((_, j) => j % step === 0);
  }));
}

/* 진행률 p에서 카메라 위치와 시선 정하기 */
function trPose(p, t = 0) {
  const { THREE, curve, cam } = TR;
  const pos = curve.getPointAt(clamp(p, 0, 1));
  const ahead = curve.getPointAt(clamp(p + 0.04, 0, 1));
  if (p > 0.96) ahead.add(curve.getTangentAt(1).multiplyScalar(2));
  const look = ahead.clone();
  // 가까운 석고상 쪽으로 시선을 천천히 돌림 (멀미 나지 않게 최대 45%까지만)
  let best = null, bw = 0;
  for (const b of TR.busts) {
    const dz = pos.z - b.z; if (dz < 0.4) continue;  // 옆을 지나가는 석고상은 더 보지 않고 앞을 봄
    const d = Math.hypot(pos.x - b.x, dz);
    const w = clamp(1 - (d - 1.4) / 3.2, 0, 1) * 0.45;
    if (w > bw) { bw = w; best = b; }
  }
  if (best) look.lerp(new THREE.Vector3(best.x, TR_LAYOUT.pedestal + TR_LAYOUT.bustH * 0.6, best.z), bw);
  const bob = reduce ? 0 : Math.sin(t / 900) * 0.025;  // 나비의 아주 작은 오르내림
  cam.position.set(pos.x, pos.y + bob, pos.z);
  cam.lookAt(look);
  cam.updateMatrixWorld(true);
}

/* 석고상이 화면에서 기둥에 얼마나 안 가려졌는지 0~1 (1 = 다 보임) */
function trVisible(b) {
  const { cam, ray, pillar, THREE } = TR;
  if (!b.samples.length) return 0;
  cam.updateProjectionMatrix();
  let inView = 0, seen = 0;
  const ndc = new THREE.Vector3(), dir = new THREE.Vector3();
  for (const p of b.samples) {
    ndc.copy(p).project(cam);
    if (ndc.z > 1 || Math.abs(ndc.x) > 1 || Math.abs(ndc.y) > 1) continue;
    inView++;
    dir.copy(p).sub(cam.position); const dist = dir.length(); dir.normalize();
    ray.set(cam.position, dir); ray.far = dist;
    if (!ray.intersectObject(pillar, false).length) seen++;
  }
  return inView < b.samples.length * 0.6 ? 0 : seen / b.samples.length;
}

/* 멈춤 지점 계산: 첫 석고상 앞, 두 번째가 기둥 뒤에서 절반 보이는 곳, 두 번째 앞, 세 번째 앞, 끝 */
function trFindStops() {
  const near = (b) => { let bp = 0, bd = 1e9; for (let p = 0; p <= 1; p += 0.002) { const q = TR.curve.getPointAt(p); const d = Math.hypot(q.x - b.x, q.z - b.z - 1.4); if (d < bd) { bd = d; bp = p; } } return bp; };
  const [A, B, C] = TR.busts;
  const pA = near(A), pB = near(B), pC = near(C);
  // 첫 석고상과 두 번째 석고상 사이에서 '절반 보임(0.5)'에 가장 가까운 곳
  let half = (pA + pB) / 2, hd = 1, wasHidden = false;
  for (let p = pA; p <= pB; p += 0.002) {
    trPose(p); const v = trVisible(B);
    if (v < 0.25) wasHidden = true;
    if (wasHidden && Math.abs(v - 0.5) < hd) { hd = Math.abs(v - 0.5); half = p; }
  }
  TR.halfReveal = half;
  TR.stops = [0, pA, half, pB, pC, 1];
}

function trTagsHTML() {
  trTags.innerHTML = TR.busts.map((b) =>
    `<button class="tr-tag" type="button" data-i="${b.i}" aria-label="${b.s.name} 학생 소개 보기"><i>+</i>${b.s.name}<em>${FIELD_LABEL[b.s.field] || '분야 확인 중'}</em></button>`).join('');
  $$('.tr-tag', trTags).forEach((el) => el.addEventListener('click', () => openDetail(+el.dataset.i)));
}

function trShowFail(e) {
  TR.failed = true; TR.ready = null;
  if (e) console.error('시험 방 3D를 불러오지 못했습니다', e);
  trFail.hidden = false;
  // ScrollTrigger가 화면 크기를 다시 재는 동안 초점이 풀리지 않게 한 박자 뒤에 옮김
  setTimeout(() => { if (TR.failed && page === 'test-room') $('#tr-retry').focus({ preventScroll: true }); }, 80);
}

function initTestRoom() {
  trSetupScroll();
  if (TR.ready) return TR.ready;
  trFail.hidden = true; TR.failed = false;
  const forceFail = new URLSearchParams(location.search).has('fail3d'); // 실패 화면 시험용: 주소에 ?fail3d
  TR.ready = (forceFail ? Promise.reject(new Error('fail3d 시험')) : three())
    .then((lib) => { if (!TR.r) trBuild(lib); return trLoadBusts(); })
    .then(() => { trFindStops(); trTagsHTML(); tr.dataset.ready = '1'; })
    .catch(trShowFail);
  return TR.ready;
}

/* 이전·다음 멈춤 지점으로 이동 (키보드 ↑↓, 화면 버튼, 움직임 줄이기 사용자용) */
function trJump(dir) {
  if (!TR.stops.length) return;
  const cur = TR.target, eps = 0.003;
  const next = dir > 0 ? TR.stops.find((p) => p > cur + eps) : [...TR.stops].reverse().find((p) => p < cur - eps);
  if (next == null) return;
  trScrollTo(next, !reduce);
}
function trScrollTo(p, smooth) {
  tr.scrollTo({ top: p * trScrollMax(), behavior: smooth ? 'smooth' : 'auto' });
  if (!smooth) TR.target = p;
}
$('#tr-prev').addEventListener('click', () => trJump(-1));
$('#tr-next').addEventListener('click', () => trJump(1));
$('#tr-retry').addEventListener('click', () => { TR.ready = null; initTestRoom(); });
$('#tr-to-list').addEventListener('click', () => go('list'));

/* 석고상 자체를 눌러도 소개가 열림 */
trView.addEventListener('click', (e) => {
  if (!TR.r || e.target !== TR.r.domElement) return;
  const rect = TR.r.domElement.getBoundingClientRect();
  const v = new TR.THREE.Vector2(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
  TR.ray.far = Infinity; TR.ray.setFromCamera(v, TR.cam);
  const hit = TR.ray.intersectObjects(TR.busts.map((b) => b.obj).filter(Boolean), true)[0];
  if (hit) openDetail(hit.object.userData.i);
});

/* 화면 비율에 맞춰 시야 넓이 조절: 휴대폰 세로 화면에서도 좌우 석고상이 잘리지 않게 가로 시야를 약 70도로 유지 */
function trFitCam(aspect) {
  const cam = TR.cam, deg = TR.THREE.MathUtils;
  cam.aspect = aspect;
  const hFov = deg.degToRad(70);
  cam.fov = clamp(deg.radToDeg(2 * Math.atan(Math.tan(hFov / 2) / aspect)), 58, 100);
  cam.updateProjectionMatrix();
}

/* 매 프레임 그리기 (main.js의 tick에서 부름) */
function renderTestRoom(t) {
  if (!TR.r || TR.failed) return;
  // 학생 소개가 열려 있으면 비행을 멈추고 위치를 기억, 닫히면 그 위치로 되돌림
  if (detail >= 0) {
    if (!TR.frozen) { TR.frozen = true; TR.savedTop = tr.scrollTop; TR.savedP = TR.target; }
    return;
  }
  if (TR.frozen) {
    TR.frozen = false;
    if (TR.savedTop != null) { tr.scrollTop = TR.savedTop; TR.target = TR.savedP; TR.savedTop = null; }
  }
  const W = trView.clientWidth, H = trView.clientHeight;
  if (W !== TR.w || H !== TR.h) { TR.w = W; TR.h = H; TR.r.setSize(W, H, false); trFitCam(W / H); }
  // 부드럽게 따라가기 (움직임 줄이기면 바로 이동). 시간 기준이라 느린 기기에서도 같은 속도로 따라감
  const dt = Math.min(250, t - (TR.lastT || t)); TR.lastT = t;
  TR.progress += (TR.target - TR.progress) * (reduce ? 1 : 1 - Math.exp(-dt / 140));
  if (Math.abs(TR.target - TR.progress) < 1e-4) TR.progress = TR.target;
  trPose(TR.progress, t);
  TR.r.render(TR.scene, TR.cam);
  // 이름표 위치: 석고상 머리 위. 기둥에 많이 가려지면 숨김
  const v = new TR.THREE.Vector3();
  for (const b of TR.busts) {
    const el = $(`.tr-tag[data-i="${b.i}"]`, trTags); if (!el || !b.obj) continue;
    if (TR.progress !== TR.lastCheck || !b.checked) b.ratio = trVisible(b), b.checked = true;
    v.set(b.x, TR_LAYOUT.pedestal + TR_LAYOUT.bustH + 0.12, b.z).project(TR.cam);
    const show = b.ratio > 0.35 && v.z < 1 && Math.abs(v.x) < 1.05;
    el.classList.toggle('on', show);
    el.tabIndex = show ? 0 : -1;
    if (show) el.style.transform = `translate(${(v.x + 1) / 2 * W}px,${(1 - v.y) / 2 * H}px) translate(-50%,-100%)`;
  }
  TR.lastCheck = TR.progress;
  $('#tr-progress').style.transform = `scaleX(${TR.progress})`;
}

function enterTestRoom() {
  initTestRoom();
  requestAnimationFrame(() => { if (TR.st) ScrollTrigger.refresh(); });
}
