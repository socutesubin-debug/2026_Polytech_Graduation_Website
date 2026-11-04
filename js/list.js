/* 작가 목록 LIST: 이름 검색, 학생 카드와 3D 썸네일 */
let filter = -1;

const thumbObj = new Map();
const T3 = { ready: null, obj: null };
function initThumb3D() {
  if (!T3.ready) T3.ready = three().then(({ THREE }) => {
    const r = makeRenderer(THREE, 1.5), scene = new THREE.Scene();
    addLights(THREE, scene);
    Object.assign(T3, { THREE, r, scene, cam: new THREE.PerspectiveCamera(24, 1, .1, 50) });
  });
  return T3.ready;
}
function listRows() {
  const q = $('#search').value.trim();
  return STUDENTS.filter((s) => (filter < 0 || s.room === filter) && (!q || s.name.includes(q)));
}
let thumbQueue = Promise.resolve();
const thumbObserver = new IntersectionObserver((entries) => {
  for (const entry of entries) {
    if (!entry.isIntersecting) continue;
    const el = entry.target;
    thumbObserver.unobserve(el);
    thumbQueue = thumbQueue.then(async () => {
      if (!el.isConnected || page !== 'list') return;
      await mountThumb(el, MODELS[el.dataset.model]);
    }).catch((e) => report3D(e, 'model'));
  }
}, { root: $('#list'), rootMargin: '100px' });
function drawThumb(canvas, url) {
  const t = thumbObj.get(url); if (!t) return;
  const keep = T3.obj; if (keep) T3.scene.remove(keep);
  t.obj.rotation.y = t.angle; T3.scene.add(t.obj); T3.obj = t.obj;
  const px = canvas.width;
  T3.r.setSize(px / T3.r.getPixelRatio(), px / T3.r.getPixelRatio(), false); frameModel(px, px, T3); T3.r.render(T3.scene, T3.cam);
  const x = canvas.getContext('2d'); x.clearRect(0, 0, px, px); x.drawImage(T3.r.domElement, 0, 0, px, px);
  T3.scene.remove(t.obj); T3.obj = keep; if (keep) T3.scene.add(keep);
}
async function mountThumb(el, url) {
  await initThumb3D();
  const tpl = await loadModel(url);
  if (!thumbObj.has(url)) thumbObj.set(url, { obj: tpl.clone(true), angle: 0 });
  if (!el.isConnected) return;
  const c = document.createElement('canvas'); c.width = c.height = Math.round(420 * Math.min(T3.r.getPixelRatio(), 2)); c.setAttribute('aria-hidden', 'true');
  el.replaceChildren(c); el.classList.add('live'); drawThumb(c, url);
}
let spin = null;
const grid = $('#grid');
grid.addEventListener('pointerdown', (e) => {
  const th = e.target.closest('.thumb.live'); if (!th || e.button > 0) return;
  spin = { th, x: e.clientX, url: MODELS[th.dataset.model] }; th.dataset.spun = '';
  try { th.setPointerCapture(e.pointerId); } catch (err) {  }
});
grid.addEventListener('pointermove', (e) => {
  if (!spin) return;
  const dx = e.clientX - spin.x; spin.x = e.clientX; if (!dx) return;
  spin.th.dataset.spun = '1';
  const t = thumbObj.get(spin.url); if (t) { t.angle += dx * .012; drawThumb(spin.th.firstElementChild, spin.url); }
});
grid.addEventListener('pointerup', () => { spin = null; });
grid.addEventListener('pointercancel', () => { spin = null; });
function renderList() {
  thumbObserver.disconnect();
  spin = null;
  const rows = listRows();
  $('#grid').innerHTML = rows.map((s) => `
    <button class="card" type="button" data-i="${s.no - 1}">
      <span class="thumb" data-model="${MODELS[s.name] ? s.name : ''}">${bustSVG([-1, 1, 0][s.no % 3])}</span>
      <span class="meta"><b>${s.name}</b><em>${pad(s.no)}</em></span>
      <span class="gal">GALLERY ${pad(s.room + 1)}</span>
      <span class="card-slogan">${s.slogan}</span>
    </button>`).join('');
  $('#total').textContent = `검색 결과 ${rows.length}명 / 전체 ${STUDENTS.length}명`;
  $('#empty').hidden = rows.length > 0;
  $$('#grid .card').forEach((b) => b.addEventListener('click', () => {
    const th = $('.thumb', b);
    if (th && th.dataset.spun) { th.dataset.spun = ''; return; }
    const s = STUDENTS[+b.dataset.i];
    openDetail(s.no - 1);
  }));
  $$('#grid .thumb[data-model]').forEach((el) => {
    const name = el.dataset.model; if (!name) return;
    thumbObserver.observe(el);
  });
}
$('#search').addEventListener('input', renderList);

$('#gallery-filter').addEventListener('change', (e) => {
  filter = Number(e.target.value);
  renderList();
});
