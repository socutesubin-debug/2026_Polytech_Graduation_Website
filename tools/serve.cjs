// 내 컴퓨터에서 사이트 보기용 작은 웹 서버 (캐시 끔 = 파일을 고치면 새로고침만 해도 바로 반영)
// 사용: npm start   또는   node tools/serve.cjs [폴더] [포트]   → http://localhost:8765/
// 폴더를 안 적으면 이 저장소 폴더, 포트를 안 적으면 8765 (테스트가 쓰는 포트)
const http = require('http'), fs = require('fs'), path = require('path');
const root = path.resolve(process.argv[2] || path.join(__dirname, '..')), port = +(process.argv[3] || 8765);
const T = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript', '.cjs': 'text/javascript', '.css': 'text/css; charset=utf-8', '.json': 'application/json',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.gif': 'image/gif',
  '.glb': 'model/gltf-binary', '.wasm': 'application/wasm', '.woff2': 'font/woff2', '.woff': 'font/woff', '.mp4': 'video/mp4', '.webm': 'video/webm', '.mp3': 'audio/mpeg', '.wav': 'audio/wav' };
http.createServer((req, res) => {
  let p; try { p = decodeURIComponent(req.url.split('?')[0]); } catch (e) { res.writeHead(400); return res.end(); }
  if (p.endsWith('/')) p += 'index.html';
  const f = path.join(root, p); if (!f.startsWith(root)) { res.writeHead(403); return res.end(); }
  fs.stat(f, (e, st) => {
    if (e || !st.isFile()) { res.writeHead(404); return res.end('not found'); }
    const type = T[path.extname(f).toLowerCase()] || 'application/octet-stream', range = req.headers.range;
    const head = { 'Content-Type': type, 'Cache-Control': 'no-store', 'Accept-Ranges': 'bytes' };
    if (range) { // 영상·소리 파일 앞뒤로 넘기기
      const m = /bytes=(\d*)-(\d*)/.exec(range), s = m && m[1] ? +m[1] : 0, end = m && m[2] ? +m[2] : st.size - 1;
      res.writeHead(206, { ...head, 'Content-Range': `bytes ${s}-${end}/${st.size}`, 'Content-Length': end - s + 1 });
      return fs.createReadStream(f, { start: s, end }).pipe(res);
    }
    res.writeHead(200, { ...head, 'Content-Length': st.size }); fs.createReadStream(f).pipe(res);
  });
}).listen(port, '127.0.0.1', () => console.log(`사이트: http://localhost:${port}/   (폴더: ${root})  끄려면 Ctrl+C`));
