// 닷홈 업로드용 폴더 만들기: 사이트에 실제로 쓰는 파일만 골라서 복사 (테스트·도구·안 쓰는 이미지·예비 파일 빼기)
// 사용: npm run upload   또는   node tools/build-upload.cjs [만들 폴더]
//   폴더를 안 적으면 이 저장소의 dist/dothome_upload (git에는 안 올라감, .gitignore)
//   만든 폴더 '안의 내용물'(index.html, css, js, assets)을 알드라이브로 닷홈 html 폴더에 올리면 됨 (README '닷홈에 올리기')
// 고르는 방법: index.html이 불러오는 css·js(와 index.html)에 경로나 파일 이름이 나오는 파일만 남김
//   + 번호로 주소를 만드는 석고상 사진(assets/images/busts/NN.webp)·3D 석고상(assets/models/NN.glb)은 남김
//   - 더블클릭(file://)용 3D 예비 파일(*.model.js), 시험용 영상 인트로(?intro=video)의 영상은 뺌
const fs = require('fs'), path = require('path');
const src = path.join(__dirname, '..'), out = path.resolve(process.argv[2] || path.join(src, 'dist', 'dothome_upload'));
if (out === src || src.startsWith(out)) { console.error('만들 폴더가 저장소 폴더와 같거나 그 위예요: ' + out); process.exit(1); }
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]);
const rel = (f) => path.relative(src, f).split(path.sep).join('/');

// 올릴 페이지: 사이트 본체 + 포스터 QR로 여는 폰용 나비 페이지(butterfly.html)
const PAGES = ['index.html', 'butterfly.html'];
const loaded = new Set(PAGES);
for (const pg of PAGES) {
  const html = fs.readFileSync(path.join(src, pg), 'utf8');
  for (const m of html.matchAll(/(?:src|href)="((?:js|css)\/[^"?]+)/g)) loaded.add(m[1]);
}
let corpus = ''; for (const f of loaded) { const p = path.join(src, f); if (fs.existsSync(p)) corpus += '\n' + fs.readFileSync(p, 'utf8'); }

const DROP = [/\.model\.js$/, /^assets\/video\/intro-scroll(-720)?\.mp4$/, /^assets\/video\/intro-scroll-poster\.jpg$/];
const keep = [], skip = [];
for (const f of [...PAGES, ...['css', 'js', 'assets'].flatMap((d) => walk(path.join(src, d)).map(rel))]) {
  let ok = loaded.has(f);
  if (!ok) { const base = path.basename(f); ok = corpus.includes(f) || corpus.includes(encodeURI(f)) || corpus.includes(base) || corpus.includes(encodeURIComponent(base)); }
  if (/^assets\/vendor\/mediapipe\//.test(f)) ok = true; // 폰 AR 나비의 손 알아보기 파일
  if (/^assets\/images\/busts\/\d+\.webp$/.test(f) || /^assets\/models\/\d+\.glb$/.test(f)) ok = true;
  if (DROP.some((r) => r.test(f))) ok = false;
  (ok ? keep : skip).push(f);
}
const missing = [...loaded].filter((f) => !fs.existsSync(path.join(src, f)));
if (missing.length) { console.error('index.html이 부르는데 없는 파일: ' + missing.join(', ')); process.exit(1); }

fs.rmSync(out, { recursive: true, force: true });
let bytes = 0;
for (const f of keep) { const to = path.join(out, f); fs.mkdirSync(path.dirname(to), { recursive: true }); fs.copyFileSync(path.join(src, f), to); bytes += fs.statSync(to).size; }
const odd = keep.filter((f) => /[^\x00-\x7F]| /.test(f));
console.log(`만든 폴더: ${out}`);
console.log(`넣은 파일 ${keep.length}개 (${(bytes / 1048576).toFixed(1)}MB), 뺀 파일 ${skip.length}개`);
if (odd.length) console.log('주의: 한글·공백이 든 파일 이름 (FTP에서 깨질 수 있음): ' + odd.join(', '));
if (process.argv.includes('--list')) { console.log('\n뺀 파일:'); skip.forEach((f) => console.log('  ' + f)); }
