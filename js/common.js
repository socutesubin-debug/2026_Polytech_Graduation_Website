/* 공통 도구: 짧은 함수들, 석고상 그림(SVG), 마우스 따라 움직이는 무대, 먼지 효과 */
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const pad = (n) => String(n).padStart(2, '0');
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const wait = (ms) => new Promise((r) => setTimeout(r, reduce ? Math.min(ms, 120) : ms));
let seq = 0;

function bustSVG(turn = 0) {
  const fx = 100 + turn * 9, P = '#ece5d7', S = '#8a8172';
  return `<svg class="bust" viewBox="0 0 200 260" aria-hidden="true" focusable="false">
<path d="M68 238H132L137 254H63Z" fill="#d8cfbf"/>
<path d="M22 238C24 198 48 176 80 170L120 170C152 176 176 198 178 238Z" fill="${P}"/>
<path d="M120 170C152 176 176 198 178 238H140C142 210 134 186 120 170Z" fill="${S}" opacity=".3"/>
<path d="M83 172C86 154 84 140 81 126L121 126C118 140 116 154 118 172Z" fill="${P}"/>
<path d="M106 126H121C118 140 116 154 118 172H108C110 156 110 140 106 126Z" fill="${S}" opacity=".28"/>
<ellipse cx="57" cy="94" rx="5" ry="11" fill="${P}"/><ellipse cx="146" cy="94" rx="5" ry="11" fill="#c9c0b0"/>
<path d="M101 40C130 40 148 62 148 90C148 114 138 134 118 144C110 148 93 148 85 142C66 132 56 114 56 90C56 62 72 40 101 40Z" fill="${P}"/>
<path d="M118 44C140 52 150 72 148 92C146 116 136 134 118 144C132 124 136 104 134 88C132 68 126 54 118 44Z" fill="${S}" opacity=".3"/>
<g fill="none" stroke="#7a7266" stroke-linecap="round" opacity=".5">
<path d="M${fx - 25} 81Q${fx - 13} 74 ${fx - 3} 80" stroke-width="2.4"/><path d="M${fx + 4} 80Q${fx + 15} 74 ${fx + 26} 81" stroke-width="2.4"/>
<path d="M${fx - 1} 86L${fx - 5 + turn * 3} 109Q${fx} 115 ${fx + 7} 110" stroke-width="2"/><path d="M${fx - 11} 123Q${fx} 127 ${fx + 11} 122" stroke-width="2"/></g>
<path d="M57 86C52 50 78 34 102 34C128 34 150 52 145 88C138 70 124 60 104 60C84 60 66 70 57 86Z" fill="#f1ebdf" stroke="#9a9283" stroke-opacity=".5"/>
</svg>`;
}

const ptr = { x: 0, y: 0, tx: 0, ty: 0 };
addEventListener('pointermove', (e) => {
  if (e.pointerType !== 'mouse') return;
  ptr.tx = e.clientX / innerWidth - .5; ptr.ty = e.clientY / innerHeight - .5;
});
addEventListener('deviceorientation', (e) => {
  if (e.gamma == null) return;
  ptr.tx = clamp(e.gamma / 40, -.5, .5); ptr.ty = clamp((e.beta - 45) / 50, -.5, .5);
});

function makeStage(el, iw, ih, opts = {}) {
  const st = { el, iw, ih, explore: !!opts.explore, zmax: opts.zmax || 1,
    cx: iw / 2, cy: ih / 2, z: 1, tcx: iw / 2, tcy: ih / 2, tz: 1,
    ox: 0, oy: 0, lt: 0, frozen: false, moved: false, tilt: new DOMMatrix(),
    tilts: $$('.tilt', el),
    layers: $$('.layer', el).map((l) => ({ el: l, depth: +l.dataset.depth, tx: 0, ty: 0, s: 1 })) };
  const pts = new Map(); let pinch = 0;
  if (st.explore) el.classList.add('explore');
  el.addEventListener('pointerdown', (e) => {
    if (detail >= 0 || st.frozen) return;
    pts.set(e.pointerId, { x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY });
    st.moved = false; pinch = 0;
    if (st.explore) el.classList.add('grabbing');
  });
  addEventListener('pointermove', (e) => {
    const p = pts.get(e.pointerId); if (!p) return;
    const dx = e.clientX - p.x, dy = e.clientY - p.y;
    p.x = e.clientX; p.y = e.clientY;
    if (Math.hypot(e.clientX - p.sx, e.clientY - p.sy) > 6) st.moved = true;
    if (pts.size >= 2 && st.explore) {
      const [a, b] = [...pts.values()], d = Math.hypot(a.x - b.x, a.y - b.y);
      if (pinch) zoomAt(st, (a.x + b.x) / 2, (a.y + b.y) / 2, st.tz * d / pinch);
      pinch = d; st.moved = true; return;
    }
    const k = baseScale(st) * st.tz;
    st.tcx -= dx / k; st.tcy -= dy / k; limit(st);
  });
  const drop = (e) => {
    pts.delete(e.pointerId); pinch = 0;
    if (!pts.size) { el.classList.remove('grabbing'); setTimeout(() => { st.moved = false; }, 60); }
  };
  addEventListener('pointerup', drop); addEventListener('pointercancel', drop);
  if (st.explore) {
    el.addEventListener('wheel', (e) => {
      e.preventDefault();
      const d = e.deltaY * (e.deltaMode === 1 ? 16 : 1);
      zoomAt(st, e.clientX, e.clientY, st.tz * Math.exp(-d * (e.ctrlKey ? .01 : .0016)));
    }, { passive: false });
    el.addEventListener('dblclick', (e) => {
      if (e.target.closest('.hot')) return;
      zoomAt(st, e.clientX, e.clientY, st.tz > 1.4 ? 1 : Math.min(st.zmax, 2));
    });
  }
  return st;
}
const baseScale = (st) => Math.max(innerWidth / st.iw, innerHeight / st.ih) * 1.07;

function limit(st) {
  const s = baseScale(st) * st.tz;
  const mx = Math.max(0, (st.iw * s - innerWidth) / 2 - 36) / s, my = Math.max(0, (st.ih * s - innerHeight) / 2 - 36) / s;
  st.tcx = clamp(st.tcx, st.iw / 2 - mx, st.iw / 2 + mx);
  st.tcy = clamp(st.tcy, st.ih / 2 - my, st.ih / 2 + my);
}

function zoomAt(st, x, y, z) {
  const s0 = baseScale(st), z0 = st.tz, z1 = clamp(z, 1, st.zmax);
  const ix = st.tcx + (x - innerWidth / 2) / (s0 * z0), iy = st.tcy + (y - innerHeight / 2) / (s0 * z0);
  st.tz = z1;
  st.tcx = ix - (x - innerWidth / 2) / (s0 * z1); st.tcy = iy - (y - innerHeight / 2) / (s0 * z1);
  limit(st);
}
function updateStage(st, t) {
  if (st.frozen || (detail >= 0 && st === gallery)) return;
  const W = innerWidth, H = innerHeight, m = reduce ? 0 : 1;
  const ease = 1 - Math.exp(-Math.min(64, t - (st.lt || t)) / 110); st.lt = t;
  limit(st);
  st.cx += (st.tcx - st.cx) * ease; st.cy += (st.tcy - st.cy) * ease; st.z += (st.tz - st.z) * ease;
  const s0 = baseScale(st) * st.z;

  st.ox = (-ptr.x * 26 + Math.sin(t / 4300) * 8) * m;
  st.oy = (-ptr.y * 16 + Math.cos(t / 5600) * 5) * m;

  const ay = (ptr.x * 2.4 + Math.sin(t / 5200) * .6) * m, ax = (-ptr.y * 1.6 + Math.cos(t / 6100) * .4) * m, P = 1500;
  const tf = `perspective(${P}px) rotateX(${ax.toFixed(3)}deg) rotateY(${ay.toFixed(3)}deg)`;
  for (const el of st.tilts) el.style.transform = tf;
  st.tilt = new DOMMatrix().translateSelf(W / 2, H / 2)
    .multiplySelf(new DOMMatrix([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, -1 / P, 0, 0, 0, 1]))
    .rotateSelf(ax, 0, 0).rotateSelf(0, ay, 0).translateSelf(-W / 2, -H / 2);
  for (const L of st.layers) {
    const s = s0 * (1 + (L.depth - .55) * .02 + Math.sin(t / 6400) * .005 * m);
    L.s = s;
    L.tx = W / 2 - st.cx * s + st.ox * L.depth;
    L.ty = H / 2 - st.cy * s + st.oy * L.depth;
    L.el.style.transform = `translate3d(${L.tx}px,${L.ty}px,0) scale(${s})`;
    L.el.style.setProperty('--s', s);
  }
}

function toScreen(st, L, ix, iy) {
  const p = st.tilt.transformPoint(new DOMPoint(L.tx + ix * L.s, L.ty + iy * L.s, 0, 1));
  return [p.x / p.w, p.y / p.w];
}
function spotsHTML(list, delayStep) {
  return list.map(([x, y, w, h], k) => `<span class="spot" style="left:${x - w / 2}px;top:${y - h / 2}px;width:${w}px;height:${h}px;animation-delay:${-k * delayStep}s"></span>`).join('');
}

function makeDust(canvas, n) {
  const ps = Array.from({ length: n }, () => ({ x: Math.random(), y: Math.random(), z: .3 + Math.random() * .9, r: .6 + Math.random() * 1.5, v: .00015 + Math.random() * .0004, p: Math.random() * 6.3 }));
  return { canvas, ctx: canvas.getContext('2d'), ps };
}
function drawDust(d, st, t) {
  if (reduce) return;
  const dpr = Math.min(devicePixelRatio || 1, 2), W = innerWidth, H = innerHeight, c = d.canvas, x = d.ctx;
  if (c.width !== Math.round(W * dpr) || c.height !== Math.round(H * dpr)) { c.width = Math.round(W * dpr); c.height = Math.round(H * dpr); }
  x.setTransform(dpr, 0, 0, dpr, 0, 0); x.clearRect(0, 0, W, H);
  for (const p of d.ps) {
    p.y -= p.v; if (p.y < -.05) { p.y = 1.05; p.x = Math.random(); }
    const px = p.x * W + Math.sin(t / 3200 + p.p) * 16 * p.z + st.ox * p.z * 1.4;
    const py = p.y * H + st.oy * p.z * 1.4;
    const a = (.15 + .5 * Math.sin(t / 1100 + p.p * 3) ** 2) * p.z * .8;
    x.fillStyle = `rgba(255,240,212,${a.toFixed(3)})`;
    x.beginPath(); x.arc(px, py, p.r * p.z, 0, 6.3); x.fill();
  }
}
