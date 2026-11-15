# 사이트용 3D 파일 만들기: bust-render.py와 같은 석고색을 GLB 색 그림(baseColor)에 직접 입혀서 저장
# 사용: blender --factory-startup -b -P bust-export.py -- 입력.glb 출력.glb [tex_mix] [cut]
# 색 계산은 bust-render.py 재질과 같음: 결과 = IVORY × (1 − mix + mix × 밝기보정(흑백(원래 색)))
import bpy, sys
import numpy as np

argv = sys.argv[sys.argv.index('--') + 1:]
GLB, OUT = argv[0], argv[1]
TEX_MIX = float(argv[2]) if len(argv) > 2 else 1.0
CUT = len(argv) > 3 and argv[3] == 'cut'
IVORY = np.array([0.74, 0.66, 0.54])      # 선형 색 (bust-render.py와 같음)

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=GLB)
meshes = [o for o in bpy.context.scene.objects if o.type == 'MESH']

if CUT:  # bust-render.py와 같은 방법으로 네모 받침 잘라내기
    import bmesh
    for o in meshes:
        mw = o.matrix_world.copy(); o.parent = None; o.matrix_world = mw
        o.data.transform(o.matrix_world); o.matrix_world.identity()
    vs = np.array([v.co[:] for o in meshes for v in o.data.vertices])
    z0 = vs[:, 2].min(); H = vs[:, 2].max() - z0; step = H * 0.005
    def width(z):
        xs = vs[(vs[:, 2] >= z) & (vs[:, 2] < z + step), 0]
        return xs.max() - xs.min() if len(xs) > 3 else 0
    W0 = max(width(z0 + i * step) for i in range(3)); zc = None
    for i in range(1, 40):
        if width(z0 + i * step) < 0.8 * W0: zc = z0 + i * step; break
    if zc:
        for o in meshes:
            bm = bmesh.new(); bm.from_mesh(o.data)
            bmesh.ops.bisect_plane(bm, geom=bm.verts[:] + bm.edges[:] + bm.faces[:], plane_co=(0, 0, zc), plane_no=(0, 0, 1), clear_inner=True)
            bm.to_mesh(o.data); bm.free(); o.data.update()
        print('CUT at', round((zc - z0) / H * 100, 1), '%')

def to_lin(c): return np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)
def to_srgb(c): return np.where(c <= 0.0031308, c * 12.92, 1.055 * np.power(np.clip(c, 0, None), 1 / 2.4) - 0.055)

done = set()
for o in meshes:
    for slot in o.material_slots:
        m = slot.material
        if not m or not m.use_nodes: continue
        nt = m.node_tree
        bsdf = next((n for n in nt.nodes if n.type == 'BSDF_PRINCIPLED'), None)
        if not bsdf: continue
        lk = bsdf.inputs['Base Color'].links
        if lk and lk[0].from_node.type == 'TEX_IMAGE':
            img = lk[0].from_node.image
            if img.name not in done:
                w, h = img.size
                px = np.empty(w * h * 4, dtype=np.float32); img.pixels.foreach_get(px); px = px.reshape(-1, 4)
                lin = to_lin(px[:, :3])
                bw = lin @ np.array([0.2126, 0.7152, 0.0722])
                bw = np.maximum(1.25 * bw - 0.045, 0)                       # Bright 0.08, Contrast 0.25
                k = (1 - TEX_MIX) + TEX_MIX * bw
                px[:, :3] = to_srgb(np.clip(IVORY[None, :] * k[:, None], 0, 1))
                img.pixels.foreach_set(px.ravel()); img.update()
                img.file_format = 'PNG'; img.pack()
                done.add(img.name)
        # 거칠기·금속 그림은 빼고 값으로 통일
        for key in ('Roughness', 'Metallic'):
            for l in list(bsdf.inputs[key].links): nt.links.remove(l)
        bsdf.inputs['Roughness'].default_value = 0.85
        bsdf.inputs['Metallic'].default_value = 0.0

bpy.ops.export_scene.gltf(filepath=OUT, export_format='GLB', export_image_format='AUTO', export_apply=True)
print('EXPORTED', OUT)
