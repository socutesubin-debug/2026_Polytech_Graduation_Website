// 석고상 .glb의 삼각형(면) 수를 줄이는 도구. 사이트에는 안 쓰이고, 석고상 파일을 새로 만들 때만 씀.
// 사용법: node simplify-bust.mjs 원본.glb 줄인.glb 100000 0.01 1
//   100000 = 남길 면 수, 0.01 = 허용 오차(크게 둬도 됨), 1 = 그림자 모양(법선) 지키는 정도
// 얼굴 모양을 지키려고 UV와 법선(NORMAL)을 함께 보면서 줄임. 자세한 순서는 README '석고상 파일 줄이기' 참고.
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { dequantize, weld, prune, compactPrimitive } from '@gltf-transform/functions';
import { MeshoptDecoder, MeshoptSimplifier } from 'meshoptimizer';
const [,, inp, out, tgt, err, nw] = process.argv; const NW = Number(nw ?? 0.5);
await MeshoptDecoder.ready; await MeshoptSimplifier.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.decoder': MeshoptDecoder });
const doc = await io.read(inp);
for (const e of doc.getRoot().listExtensionsUsed()) if (/meshopt|quantization/.test(e.extensionName)) e.dispose();
await doc.transform(dequantize(), weld());
for (const mesh of doc.getRoot().listMeshes()) for (const p of mesh.listPrimitives()) {
  const pos = p.getAttribute('POSITION'), uv = p.getAttribute('TEXCOORD_0'), nrm = p.getAttribute('NORMAL');
  const idx = new Uint32Array(p.getIndices().getArray());
  const P = new Float32Array(pos.getArray());
  const n = pos.getCount(), A = new Float32Array(n * 5), U = uv.getArray(), N = nrm.getArray();
  for (let i = 0; i < n; i++) { A[i*5]=U[i*2]; A[i*5+1]=U[i*2+1]; A[i*5+2]=N[i*3]; A[i*5+3]=N[i*3+1]; A[i*5+4]=N[i*3+2]; }
  const target = Math.min(idx.length, Number(tgt) * 3);
  const [res, e] = MeshoptSimplifier.simplifyWithAttributes(idx, P, 3, A, 5, [0.5, 0.5, NW, NW, NW], null, target, Number(err), ['Permissive']);
  console.log('tris', idx.length / 3, '->', res.length / 3, 'err', e.toFixed(5));
  p.getIndices().setArray(res);
  compactPrimitive(p);
}
await doc.transform(prune());
await io.write(out, doc);
