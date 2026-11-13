/* 학생 상세 팝업: 석고상을 누르면 열리는 창 (3D 회전, 이전/다음 학생) */
const dv = $('#detail'), dModel = $('#d-model');
const D3 = { ready: null, obj: null, angle: 0, drag: null, key: '' };
function initDetail3D() {
  if (!D3.ready) D3.ready = three().then(({ THREE }) => {
    const r = makeRenderer(THREE, 2);
    const scene = new THREE.Scene(); addLights(THREE, scene);
    const cam = new THREE.PerspectiveCamera(24, 1, .1, 50);
    const c = r.domElement;
    c.addEventListener('pointerdown', (e) => { D3.drag = e.clientX; c.setPointerCapture(e.pointerId); });
    c.addEventListener('pointermove', (e) => { if (D3.drag == null) return; D3.angle += (e.clientX - D3.drag) * .012; D3.drag = e.clientX; });
    c.addEventListener('pointerup', () => { D3.drag = null; });
    Object.assign(D3, { THREE, r, scene, cam });
  });
  return D3.ready;
}

function frameModel(w, h, state = D3) {
  const { cam } = state, mw = state.obj ? state.obj.userData.width || .7 : .7;
  const need = Math.max(1.08, (mw * 1.15) / (w / h));
  const dist = (need / 2) / Math.tan(state.THREE.MathUtils.degToRad(cam.fov / 2));
  cam.aspect = w / h; cam.position.set(0, need / 2 - .02, dist); cam.lookAt(0, need / 2 - .02, 0); cam.updateProjectionMatrix();
}
async function showDetailModel(url, key) {
  dModel.innerHTML = bustSVG(0);
  if (!url) { dModel.innerHTML = bustSVG(0); return; }
  try {
    await initDetail3D();
    const tpl = await loadModel(url);
    if (D3.key !== key) return;
    if (D3.obj) D3.scene.remove(D3.obj);
    D3.obj = tpl.clone(true); D3.scene.add(D3.obj); D3.angle = 0;
    dModel.replaceChildren(D3.r.domElement);
  } catch (e) { if (D3.key === key) { dModel.innerHTML = bustSVG(0); report3D(e, 'model'); } }
}
function renderDetail3D(t, dt) {
  if (!D3.r || !D3.obj || !D3.r.domElement.isConnected) return;
  const w = dModel.clientWidth, h = dModel.clientHeight; if (!w || !h) return;
  const c = D3.r.domElement;
  if (c.width !== Math.round(w * D3.r.getPixelRatio())) D3.r.setSize(w, h, false);
  else if (c.height !== Math.round(h * D3.r.getPixelRatio())) D3.r.setSize(w, h, false);
  frameModel(w, h);
  if (D3.drag == null && !reduce) D3.angle += dt / 1000 * .45;
  D3.obj.rotation.y = D3.angle;
  D3.r.render(D3.scene, D3.cam);
}
let lastFocus = null, detailOrder = [], modalBackground = [];
function stepDetail(delta) {
  if (detail < 0 || !detailOrder.length) return;
  const at = detailOrder.indexOf(detail);
  openDetail(detailOrder[(at + delta + detailOrder.length) % detailOrder.length]);
}
function openDetail(i) {
  i = (i + STUDENTS.length) % STUDENTS.length;
  const s = STUDENTS[i];
  if (detail < 0) {
    lastFocus = document.activeElement;
    detailOrder = page === 'list'
      ? listRows().map((s) => s.no - 1)
      : page === 'test-room' ? trStudents().map((s) => s.no - 1)
      : HALLS[page] ? HALLS[page].students.map((s) => s.no - 1)
      : page === 'special' ? STUDENTS.map((s) => s.no - 1)
      : STUDENTS.filter((s) => s.room === room).map((s) => s.no - 1);
    modalBackground = [...new Set([...Object.values(screens), topbar])].map((el) => [el, el.inert]);
    for (const [el] of modalBackground) el.inert = true;
  }
  detail = i;
  $('#d-room').textContent = page === 'gallery'
    ? `${['첫번째', '두번째', '세번째'][s.room]} 전시실`
    : (FIELD_LABEL[s.field] || '분야 확인 중');
  $('#d-count').textContent = `${pad(detailOrder.indexOf(i) + 1)} / ${pad(detailOrder.length)}`;
  $('#d-name').textContent = s.name;
  $('#d-slogan').textContent = s.slogan || '';
  $('#d-desc').textContent = s.desc || '';
  const pf = $('#d-portfolio');
  if (s.portfolio) { pf.href = s.portfolio; pf.textContent = s.portfolio.replace(/^https?:\/\//, '').replace(/\/$/, ''); pf.style.display = ''; pf.classList.remove('off'); pf.removeAttribute('aria-disabled'); }
  else { pf.removeAttribute('href'); pf.textContent = '포트폴리오 준비 중'; pf.style.display = ''; pf.classList.add('off'); pf.setAttribute('aria-disabled', 'true'); }
  D3.key = 'd' + i;
  showDetailModel(MODELS[s.name], D3.key);
  dv.classList.add('on');
  $('#d-close').focus({ preventScroll: true });
}
function closeDetail(silent) {
  if (detail < 0) return;
  dv.classList.remove('on'); detail = -1; D3.key = ''; D3.drag = null;
  for (const [el, inert] of modalBackground) el.inert = inert;
  modalBackground = [];
  gallery.lt = performance.now();
  if (!silent && lastFocus && lastFocus.isConnected) lastFocus.focus({ preventScroll: true });
}
$('#d-close').addEventListener('click', () => closeDetail());
$('#d-prev').addEventListener('click', () => stepDetail(-1));
$('#d-next').addEventListener('click', () => stepDetail(1));
dv.addEventListener('click', (e) => { if (e.target === dv) closeDetail(); });

// The overlay is the only keyboard focus scope until it closes.
dv.addEventListener('keydown', (e) => {
  if (e.key !== 'Tab') return;
  const buttons = $$('button:not(:disabled), a[href]', dv).filter((el) => !el.hidden && el.getClientRects().length);
  const first = buttons[0], last = buttons[buttons.length - 1];
  if (!first) { e.preventDefault(); dv.focus(); return; }
  if (e.shiftKey && (document.activeElement === first || document.activeElement === dv)) { e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
});
