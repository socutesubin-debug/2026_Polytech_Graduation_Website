/* 전시실 GALLERY 01~03: 전시실 바꾸기, 석고상 배치·회전 */
const gallery = makeStage($('#gallery-stage'), 2000, 1126, { explore: true, zmax: 4.2 });
const galleryDust = makeDust($('#gallery .dust'), innerWidth < 760 ? 30 : 60);
const galleryCam = $('#gallery-cam'), hots = $('#hots');
$('#gallery-spots').innerHTML = spotsHTML(GALLERY_SPOTS, 1.7);

function setRoom(r, instant) {
  room = clamp(r, 0, 2);
  gallery.el.dataset.room = room;
  const art = ROOM_ASSETS[room], slots = art.slots;
  $('#room-bg').src = art.bg; $('#room-statues').src = art.statues; $('#room-statues').style.top = art.top + 'px';
  $('#g-title').textContent = `GALLERY ${pad(room + 1)}`;
  $('#room-prev').disabled = room === 0; $('#room-next').disabled = room === 2;
  const list = STUDENTS.filter((s) => s.room === room);
  $('#shadows').innerHTML = list.map((s) => {
    const p = slots[s.slot];
    return MODELS[s.name] ? `<span class="cshadow" style="left:${p.x}px;top:${p.y}px;width:${p.h * .62}px;height:${p.h * .09}px"></span>` : '';
  }).join('');
  hots.innerHTML = list.map((s) => {
    const p = slots[s.slot], has = !!MODELS[s.name], w = Math.max(p.h * .5, 110);

    const stand = has ? `<span class="stand" style="height:${p.h}px">${bustSVG(s.no % 2 ? -1 : 1)}</span>` : '';
    return `<button class="hot${has ? ' has' : ' empty'}" type="button" data-i="${s.no - 1}" style="left:${p.x - w / 2}px;top:${p.y - p.h}px;width:${w}px;height:${p.tag - p.y + p.h + 40}px" aria-label="${s.name} 학생 보기">
      ${stand}<span class="tag" style="top:${p.tag - p.y + p.h}px"><i>${has ? '+' : '·'}</i>STUDENT ${pad(s.no)} · ${s.name}</span></button>`;
  }).join('');
  $$('.hot', hots).forEach((b) => {
    const i = +b.dataset.i, has = b.classList.contains('has');
    if (has) {

      let from = null;
      const me = () => G3.statues.find((x) => x.i === i);
      b.addEventListener('pointerdown', (e) => {
        if (e.button > 0) return;
        e.stopPropagation(); from = e.clientX; b.dataset.spun = '';
        try { b.setPointerCapture(e.pointerId); } catch (err) {  }
        const s = me(); if (s) { s.drag = true; s.v = 0; s.hold = 0; }
      });
      b.addEventListener('pointermove', (e) => {
        if (from == null) return;
        const dx = e.clientX - from; from = e.clientX;
        const s = me(); if (!s) return;
        if (Math.abs(dx) > 0) b.dataset.spun = '1';
        const d = dx * .014; s.angle += d; s.v = d / Math.max(.008, (e.timeStamp - (s.lastT || e.timeStamp - 16)) / 1000); s.lastT = e.timeStamp;
      });
      const end = () => { if (from == null) return; from = null; const s = me(); if (s) { s.drag = false; s.v = clamp(s.v, -4, 4); } };
      b.addEventListener('pointerup', end); b.addEventListener('pointercancel', end);
    }
    b.addEventListener('click', () => {
      if (b.dataset.spun) { b.dataset.spun = ''; return; }
      if (!gallery.moved) openDetail(i);
    });
  });

  const withModel = list.filter((s) => MODELS[s.name]);
  const mid = withModel.length ? withModel.reduce((a, s) => a + slots[s.slot].x, 0) / withModel.length : gallery.iw / 2;
  Object.assign(gallery, { tz: 1, z: 1, tcx: mid, tcy: gallery.ih / 2 });
  limit(gallery); gallery.cx = gallery.tcx; gallery.cy = gallery.tcy;
  placeStatues();
  updateNav(); setHash();
}
async function changeRoom(r) {
  r = clamp(r, 0, 2);
  if (r === room || busy) return;
  const my = ++seq; busy = true; closeDetail(true);
  galleryCam.classList.add('switching');
  await wait(360);
  if (my !== seq) return;
  setRoom(r);
  galleryCam.classList.remove('switching'); arrive(galleryCam);
  busy = false;
}
$('#room-prev').addEventListener('click', () => changeRoom(room - 1));
$('#room-next').addEventListener('click', () => changeRoom(room + 1));

const SPIN = reduce ? 0 : .32;
const FRONT_HOLD = 3500;
/* 석고상마다 돌아가는 방향과 속도를 다르게 (번호로 결정해서 매번 같은 모습) */
const spinFor = (no) => (no % 3 === 0 ? -1 : 1) * (0.2 + 0.06 * ((no * 37) % 7));

const G3 = { generation: 0, ready: null, statues: [], w: 0, h: 0 };
function initGallery3D() {
  if (!G3.ready) G3.ready = three().then(({ THREE }) => {
    const r = makeRenderer(THREE, 1.75);
    r.domElement.className = 'statues';
    gallery.el.insertBefore(r.domElement, hots.parentElement);
    const scene = new THREE.Scene(); const key = addLights(THREE, scene);
    Object.assign(G3, { THREE, r, scene, key, cam: new THREE.PerspectiveCamera(20, 1, 1, 10000) });
  }).catch((e) => report3D(e, 'three'));
  return G3.ready;
}

async function placeStatues() {
  const my = room, generation = ++G3.generation;
  await initGallery3D(); if (!G3.r || generation !== G3.generation) return;
  for (const s of G3.statues) G3.scene.remove(s.obj);
  G3.statues = [];
  for (const s of STUDENTS.filter((x) => x.room === my && MODELS[x.name])) {
    loadModel(MODELS[s.name]).then((tpl) => {
      if (room !== my || generation !== G3.generation) return;
      const obj = tpl.clone(true);
      G3.scene.add(obj);

      G3.statues.push({ obj, i: s.no - 1, slot: ROOM_ASSETS[my].slots[s.slot], angle: 0, v: 0, spin: spinFor(s.no), hold: FRONT_HOLD + s.no * 420, drag: false });
      const hot = $(`.hot[data-i="${s.no - 1}"]`, hots); if (hot) hot.classList.add('ready');
    }).catch((e) => report3D(e, 'model'));
  }
}
function renderGallery3D(t) {
  if (!G3.r) return;
  const { THREE, r, cam, scene, key } = G3, W = innerWidth, H = innerHeight;
  if (key && !reduce) key.color.setHSL(0.8 + 0.1 * Math.sin(t / 2600), 0.42, 0.93);
  if (W !== G3.w || H !== G3.h) {
    G3.w = W; G3.h = H; r.setSize(W, H, false);
    const d = (H / 2) / Math.tan(THREE.MathUtils.degToRad(cam.fov / 2));
    cam.aspect = W / H; cam.position.set(0, 0, d); cam.near = d / 20; cam.far = d * 4; cam.updateProjectionMatrix();
  }
  const L = gallery.layers[1], dt = Math.min(64, t - (G3.last || t)); G3.last = t;
  for (const s of G3.statues) {
    const [sx, sy] = toScreen(gallery, L, s.slot.x, s.slot.y), [, ty] = toScreen(gallery, L, s.slot.x, s.slot.y - s.slot.h);
    s.obj.position.set(sx - W / 2, H / 2 - sy, 0);
    s.obj.scale.setScalar(sy - ty);
    if (s.hold > 0 && !s.drag) s.hold -= dt;
    else if (!s.drag && !reduce) {
      s.hold = 0;
      s.v += (s.spin - s.v) * (1 - Math.exp(-dt / 800));
      s.angle += s.v * dt / 1000;
    }
    s.obj.rotation.y = s.angle;
  }
  r.render(scene, cam);
}
