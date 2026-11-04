/* 3D 공통: three.js 불러오기, 석고상 .glb 읽기, 조명, 3D 오류 안내 */
let threeLib = null;
function three() {

  if (!threeLib) threeLib = Promise.all([import('three'), import('three/addons/loaders/GLTFLoader.js'), import('three/addons/libs/meshopt_decoder.module.js')])
    .then(([THREE, m, d]) => ({ THREE, GLTFLoader: m.GLTFLoader, MeshoptDecoder: d.MeshoptDecoder }));
  return threeLib;
}
const modelCache = new Map();

function parseGLB(url, GLTFLoader, MeshoptDecoder) {
  const loader = new GLTFLoader(); loader.setMeshoptDecoder(MeshoptDecoder);
  if (!url.startsWith('data:')) return loader.loadAsync(url);
  const raw = atob(url.slice(url.indexOf(',') + 1)), bin = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) bin[i] = raw.charCodeAt(i);
  return new Promise((res, rej) => {
    const cib = window.createImageBitmap;
    try { window.createImageBitmap = undefined; loader.parse(bin.buffer, '', res, rej); } finally { window.createImageBitmap = cib; }
  });
}

/* 더블클릭(file://)으로 열면 브라우저가 .glb 파일 읽기를 막음.
   스크립트 파일은 읽을 수 있어서, 같은 내용을 담아 둔 '01.glb.js' 같은 파일을 대신 불러옴 (build.ps1이 만듦) */
const GLB_DATA = {};
function glbFromScript(url) {
  return new Promise((res, rej) => {
    const s = document.createElement('script');
    s.src = url.replace(/\.glb$/, '.model.js');
    s.onload = () => (GLB_DATA[url] ? res(GLB_DATA[url]) : rej(new Error('GLB_DATA에 없음: ' + url)));
    s.onerror = () => rej(new Error('파일이 없음: ' + s.src));
    document.head.appendChild(s);
  });
}

function loadModel(url) {
  if (!modelCache.has(url)) modelCache.set(url, three().then(async ({ THREE, GLTFLoader, MeshoptDecoder }) => {
    const src = !url.startsWith('data:') ? await glbFromScript(url) : url;
    const gltf = await parseGLB(src, GLTFLoader, MeshoptDecoder);
    const m = gltf.scene;

    m.traverse((o) => {
      const mt = o.material;
      if (!mt) return;
      if (mt.emissiveMap && !mt.map) {
        mt.map = mt.emissiveMap; mt.color.set(0xffffff);
        mt.emissiveIntensity = LOOK.baked; mt.roughness = .82; mt.metalness = 0; mt.needsUpdate = true;
      } else if (mt.map) {
        mt.emissive.set(0xffffff); mt.emissiveMap = mt.map; mt.emissiveIntensity = LOOK.fill;
        mt.roughness = .85; mt.metalness = 0; mt.needsUpdate = true;
      }
    });
    const box = new THREE.Box3().setFromObject(m), size = box.getSize(new THREE.Vector3()), c = box.getCenter(new THREE.Vector3());
    m.position.set(-c.x, -box.min.y, -c.z);
    const fit = new THREE.Group(); fit.add(m); fit.scale.setScalar(1 / size.y);
    const tpl = new THREE.Group(); tpl.add(fit);
    tpl.userData.width = Math.max(size.x, size.z) / size.y;
    return tpl;
  }));
  return modelCache.get(url);
}

const LOOK = { baked: .75, fill: .42, hemi: .9, key: 1.25, rim: .7, exposure: 1 };
function makeRenderer(THREE, dpr) {
  const r = new THREE.WebGLRenderer({ alpha: true, antialias: true, preserveDrawingBuffer: false });
  r.setPixelRatio(Math.min(devicePixelRatio || 1, dpr));
  r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = LOOK.exposure;
  return r;
}
function addLights(THREE, scene) {
  scene.add(new THREE.HemisphereLight(0xfff3e2, 0x8a6a4c, LOOK.hemi));
  const key = new THREE.DirectionalLight(0xffe0b6, LOOK.key); key.position.set(-.6, 1, .9); scene.add(key);
  const rim = new THREE.DirectionalLight(0xffd29a, LOOK.rim); rim.position.set(.9, .5, -.7); scene.add(rim);
  return key;
}

let toastTimer;
function report3D(e, step) {
  console.error('3D 석고상을 불러오지 못했습니다 (' + step + ')', e);
  const raw = Object.values(MODELS).some((u) => !String(u).startsWith('data:'));
  const msg = location.protocol === 'file:' && raw
    ? '더블클릭으로 연 화면에서 3D 석고상 파일(assets/models/*.model.js)을 찾지 못했어요. README의 “내 컴퓨터에서 실행하기”를 봐 주세요.'
    : step === 'three'
      ? '3D 라이브러리를 불러오지 못했어요. 인터넷 연결을 확인하고 새로고침해 주세요.'
      : '석고상 3D 파일을 읽지 못했어요. 파일이 깨졌거나 경로가 틀렸을 수 있어요.';
  const t = $('#toast'); t.textContent = msg; t.classList.add('on');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('on'), 9000);
}
