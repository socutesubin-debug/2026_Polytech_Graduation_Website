/* 손 알아보기 — 카메라 영상에서 손을 찾아 '손바닥이 화면 어디에, 얼마나 가까이 있는지'를 알려 줌 (2026-11-16, butterfly.html에서 씀)
   - 구글 MediaPipe 손 인식(HandLandmarker, Apache-2.0)을 씀. 파일은 assets/vendor/mediapipe/ (프로그램 약 9MB + 손 모델 약 8MB)
     용량이 커서 나비가 먼저 날기 시작한 뒤에 따로 내려받고, 준비되면 그때부터 손을 찾아요. 실패해도 나비는 그대로 날아요
   - 손목~가운뎃손가락 뿌리 길이(진짜 손은 약 9cm)가 화면에서 얼마나 크게 보이는지로 손까지 거리를 어림해요
   숫자를 바꾸고 싶으면 아래 BF_HAND만 고치면 됩니다 */
const BF_HAND = {
  every: 90,        // 몇 ms마다 손을 찾을지 (작을수록 빨리 반응하지만 폰이 뜨거워짐)
  palm: 0.09,       // 손목~가운뎃손가락 뿌리 길이 (m). 거리 어림에 씀
  minScore: 0.5,    // 이 점수보다 확실할 때만 손으로 봄
  base: 'assets/vendor/mediapipe',
};
async function startButterflyHand(video, fovDeg, onHand) {
  const H = BF_HAND;
  const vision = await import(new URL(H.base + '/vision_bundle.mjs', location.href).href);
  const files = await vision.FilesetResolver.forVisionTasks(new URL(H.base + '/wasm', location.href).href);
  const make = (delegate) => vision.HandLandmarker.createFromOptions(files, {
    baseOptions: { modelAssetPath: new URL(H.base + '/hand_landmarker.task', location.href).href, delegate },
    runningMode: 'VIDEO', numHands: 1, minHandDetectionConfidence: H.minScore, minHandPresenceConfidence: H.minScore, minTrackingConfidence: H.minScore,
  });
  let lm; try { lm = await make('GPU'); } catch (e) { lm = await make('CPU'); }
  let alive = true, lastT = -1;
  function tick() {
    if (!alive) return;
    setTimeout(tick, H.every);
    if (document.hidden || video.readyState < 2 || !video.videoWidth || video.currentTime === lastT) return;
    lastT = video.currentTime;
    let res; try { res = lm.detectForVideo(video, performance.now()); } catch (e) { return; }
    const pts = res && res.landmarks && res.landmarks[0];
    if (!pts) { onHand(null); return; }
    /* 영상은 화면을 가득 채우게 잘려 있음(object-fit: cover) → 영상 좌표를 화면 px로 */
    const W = innerWidth, Hh = innerHeight, vw = video.videoWidth, vh = video.videoHeight, sc = Math.max(W/vw, Hh/vh);
    const px = (p) => [(p.x*vw - vw/2)*sc + W/2, (p.y*vh - vh/2)*sc + Hh/2];
    const ids = [0, 5, 9, 13, 17]; let cx = 0, cy = 0; // 손바닥 가운데 = 손목 + 손가락 뿌리 4개의 평균
    for (const i of ids) { const q = px(pts[i]); cx += q[0]/ids.length; cy += q[1]/ids.length; }
    const a = px(pts[0]), b = px(pts[9]), len = Math.hypot(a[0] - b[0], a[1] - b[1]);
    const fpx = Hh/2/Math.tan(fovDeg*Math.PI/360);
    onHand({ sx: cx, sy: cy, depth: H.palm*fpx/Math.max(20, len) });
  }
  tick();
  return { stop() { alive = false; try { lm.close(); } catch (e) {} } };
}
