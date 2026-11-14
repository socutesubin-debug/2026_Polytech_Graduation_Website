/* 장면 3: 3D Jutsu 프로젝트의 입구 + 벽 6장 + 복도 + 끝의 문을 같은 치수(미터)로 그리는 작은 WebGL 렌더러.
   좌표는 Blender와 같다: x = 오른쪽, y = 안쪽, z = 위.  createTunnelGL(canvas) -> { draw(eye, target, roll) } */
function createTunnelGL(canvas) {
  const gl = canvas.getContext('webgl', { antialias: true, alpha: false });
  if (!gl) return null;

  const V = [];   // x y z  nx ny nz  r g b
  const sub = (a, b) => [a[0]-b[0], a[1]-b[1], a[2]-b[2]];
  const cross = (a, b) => [a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]];
  const norm = a => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0]/l, a[1]/l, a[2]/l]; };
  function quad(p, c, toward) {            // p = 4 corners in order; toward = a point the face should look at (optional)
    let n = norm(cross(sub(p[1], p[0]), sub(p[3], p[0])));
    if (toward) { const m = [(p[0][0]+p[2][0])/2, (p[0][1]+p[2][1])/2, (p[0][2]+p[2][2])/2], d = sub(toward, m); if (n[0]*d[0]+n[1]*d[1]+n[2]*d[2] < 0) n = n.map(v => -v); }
    for (const i of [0, 1, 2, 0, 2, 3]) V.push(p[i][0], p[i][1], p[i][2], n[0], n[1], n[2], c[0], c[1], c[2]);
  }
  function box(ce, s, c) {
    const x0 = ce[0]-s[0]/2, x1 = ce[0]+s[0]/2, y0 = ce[1]-s[1]/2, y1 = ce[1]+s[1]/2, z0 = ce[2]-s[2]/2, z1 = ce[2]+s[2]/2;
    const out = k => [ce[0]+k[0]*99, ce[1]+k[1]*99, ce[2]+k[2]*99];
    quad([[x0,y0,z0],[x1,y0,z0],[x1,y0,z1],[x0,y0,z1]], c, out([0,-1,0]));
    quad([[x0,y1,z0],[x1,y1,z0],[x1,y1,z1],[x0,y1,z1]], c, out([0,1,0]));
    quad([[x0,y0,z0],[x0,y1,z0],[x0,y1,z1],[x0,y0,z1]], c, out([-1,0,0]));
    quad([[x1,y0,z0],[x1,y1,z0],[x1,y1,z1],[x1,y0,z1]], c, out([1,0,0]));
    quad([[x0,y0,z1],[x1,y0,z1],[x1,y1,z1],[x0,y1,z1]], c, out([0,0,1]));
    quad([[x0,y0,z0],[x1,y0,z0],[x1,y1,z0],[x0,y1,z0]], c, out([0,0,-1]));
  }

  const STONE = [.73, .73, .69], FLOOR = [.61, .60, .57], GALLERY = [.84, .82, .77], JOINT = [.43, .43, .41];
  // 바닥과 줄눈
  quad([[-60,-60,0],[60,-60,0],[60,19,0],[-60,19,0]], FLOOR, [0,0,99]);
  for (let y = -8; y <= 16; y += 3) quad([[-6,y-.03,.004],[6,y-.03,.004],[6,y+.03,.004],[-6,y+.03,.004]], JOINT, [0,0,99]);
  // 입구 (y = -4): 기둥 2개, 상인방, 좌우 벽. 화면을 채우도록 벽을 더 넓고 높게 잇는다
  box([-7,-4,3.5], [2.2,.9,7], STONE); box([7,-4,3.5], [2.2,.9,7], STONE); box([0,-4,7.35], [16.2,.9,.7], STONE);
  box([-34,-4,3.5], [52,.6,7], STONE); box([34,-4,3.5], [52,.6,7], STONE); box([0,-3.9,18.65], [120,.6,23.3], STONE);
  // 복도 옆벽
  box([-6.5,7,3], [1,22,6], GALLERY); box([6.5,7,3], [1,22,6], GALLERY);
  // 비틀리는 벽 6장: [아래왼쪽 x, 아래오른쪽 x, 위왼쪽(x,z), 위오른쪽(x,z)] — 3D 프로젝트에서 읽은 값
  const FAN = [
    [-3.77, 1.51, [-1.22, 6.31], [3.32, 4.48]], [-3.22, 1.83, [-1.70, 6.11], [3.05, 4.92]], [-2.76, 2.17, [-2.14, 5.84], [2.73, 5.33]],
    [-2.35, 2.55, [-2.55, 5.51], [2.35, 5.68]], [-1.99, 2.98, [-2.90, 5.13], [1.93, 5.98]], [-1.67, 3.49, [-3.20, 4.71], [1.46, 6.22]]];
  const FANCOL = [[.73,.72,.68], [.57,.60,.60], [.78,.75,.69]];
  FAN.forEach((o, i) => {
    const y0 = 1 + 2.5*i, yaw = (-6 + 2.4*i)*Math.PI/180, cs = Math.cos(yaw), sn = Math.sin(yaw), col = FANCOL[i % 3];
    const P = (x, yl, z) => [x*cs - yl*sn, y0 + x*sn + yl*cs, z];
    const A = [o[0], 0], B = [o[1], 0], D = o[2], C = o[3], cen = P((A[0]+B[0])/2, 0, 3);
    for (const yl of [-.24, .24]) {
      const f = (pts) => quad(pts.map(q => P(q[0], yl, q[1])), col, P(0, yl*400, 3));
      f([[-6,0], A, D, [-6,8]]); f([[-6,8], D, C, [6,8]]); f([B, [6,0], [6,8], C]);
    }
    const inner = col.map(v => v*.86);
    for (const [p, q] of [[A, D], [D, C], [C, B]]) quad([P(p[0],-.24,p[1]), P(q[0],-.24,q[1]), P(q[0],.24,q[1]), P(p[0],.24,p[1])], inner, cen);
    quad([P(-6,-.24,8), P(6,-.24,8), P(6,.24,8), P(-6,.24,8)], col, [0,0,99]);
  });
  // 끝 벽과 빛나는 문
  box([-9.5,18,3], [16,1,6], FLOOR); box([9.5,18,3], [16,1,6], FLOOR); box([0,18,5.7], [3,1,.6], GALLERY);
  const nGeo = V.length/9;
  quad([[-1.5,20.2,0],[1.5,20.2,0],[1.5,20.2,5.4],[-1.5,20.2,5.4]], [9, 9, 9], [0,0,3]);   // 9 = 빛(셰이더에서 그대로 흰색)

  const vs = `attribute vec3 aP, aN, aC; uniform mat4 uVP; varying vec3 vC; varying float vY;
    void main(){
      vec3 L = normalize(vec3(-.45, -.5, .75));
      float lit = .5 + .5*dot(aN, L);                       /* 부드러운 반구 조명 */
      vec3 shade = mix(vec3(.50, .56, .66), vec3(1.04, 1.02, .98), lit);   /* 그늘은 푸른 회색 */
      vC = aC.r > 5. ? vec3(1.) : aC*shade*1.18;
      vY = aP.y; gl_Position = uVP*vec4(aP, 1.);
    }`;
  const fs = `precision mediump float; varying vec3 vC; varying float vY; uniform float uGlow;
    void main(){
      float g = smoothstep(-2., 19., vY);                     /* 문에 가까울수록 빛에 잠긴다 */
      vec3 c = mix(vC, vec3(1., .985, .95), g*g*(.45 + .5*uGlow));
      gl_FragColor = vec4(c, 1.);
    }`;
  const p = gl.createProgram();
  for (const [t, s] of [[gl.VERTEX_SHADER, vs], [gl.FRAGMENT_SHADER, fs]]) { const sh = gl.createShader(t); gl.shaderSource(sh, s); gl.compileShader(sh); if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) console.error(gl.getShaderInfoLog(sh)); gl.attachShader(p, sh); }
  gl.bindAttribLocation(p, 0, 'aP'); gl.bindAttribLocation(p, 1, 'aN'); gl.bindAttribLocation(p, 2, 'aC');
  gl.linkProgram(p); gl.useProgram(p);
  const uVP = gl.getUniformLocation(p, 'uVP'), uGlow = gl.getUniformLocation(p, 'uGlow');
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer()); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(V), gl.STATIC_DRAW);
  for (let i = 0; i < 3; i++) { gl.enableVertexAttribArray(i); gl.vertexAttribPointer(i, 3, gl.FLOAT, false, 36, i*12); }
  gl.enable(gl.DEPTH_TEST);

  function mul(a, b) { const o = new Float32Array(16); for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) o[c*4+r] = a[r]*b[c*4] + a[4+r]*b[c*4+1] + a[8+r]*b[c*4+2] + a[12+r]*b[c*4+3]; return o; }
  let W = 0, H = 0;
  return {
    /* eye, target: [x, y, z] (미터), roll: 라디안, glow: 0..1 빛에 잠기는 정도 */
    draw(eye, target, roll, glow) {
      const dpr = Math.min(window.devicePixelRatio || 1, 2), w = Math.max(8, Math.round((canvas.clientWidth || innerWidth)*dpr)), h = Math.max(8, Math.round((canvas.clientHeight || innerHeight)*dpr));
      if (w !== W || h !== H) { W = canvas.width = w; H = canvas.height = h; }
      gl.viewport(0, 0, W, H); gl.clearColor(.93, .95, .97, 1); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      const asp = W/H, vfov = (asp >= 1 ? 2*Math.atan(Math.tan(29.4*Math.PI/180)/asp) : 62*Math.PI/180), t = 1/Math.tan(vfov/2), n = .1, f = 200;
      const P = new Float32Array([t/asp,0,0,0, 0,t,0,0, 0,0,(f+n)/(n-f),-1, 0,0,2*f*n/(n-f),0]);
      const fw = norm(sub(target, eye)); let rt = norm(cross(fw, [0,0,1])); let up = cross(rt, fw);
      const cr = Math.cos(roll || 0), sr = Math.sin(roll || 0);
      const rt2 = [rt[0]*cr + up[0]*sr, rt[1]*cr + up[1]*sr, rt[2]*cr + up[2]*sr], up2 = [up[0]*cr - rt[0]*sr, up[1]*cr - rt[1]*sr, up[2]*cr - rt[2]*sr];
      const d = v => -(v[0]*eye[0] + v[1]*eye[1] + v[2]*eye[2]);
      const Vw = new Float32Array([rt2[0],up2[0],-fw[0],0, rt2[1],up2[1],-fw[1],0, rt2[2],up2[2],-fw[2],0, d(rt2),d(up2),-d(fw),0+1]);
      gl.uniformMatrix4fv(uVP, false, mul(P, Vw)); gl.uniform1f(uGlow, glow || 0);
      gl.drawArrays(gl.TRIANGLES, 0, V.length/9);
    }
  };
}
