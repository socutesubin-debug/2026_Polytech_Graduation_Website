# Blender 촬영 스크립트: 석고상 .glb 하나를 모든 학생에게 똑같은 조건으로 찍음
# 사용: blender -b -P bust-render.py -- input.glb output.png [tex_mix]
#   tex_mix: 원래 대리석 무늬를 얼마나 남길지 (0 = 완전히 같은 석고색, 1 = 원래 그림 색)
import bpy, sys, math
from mathutils import Vector

argv = sys.argv[sys.argv.index('--') + 1:]
GLB, OUT = argv[0], argv[1]
TEX_MIX = float(argv[2]) if len(argv) > 2 else 0.35
CUT = len(argv) > 3 and argv[3] == 'cut'   # 받침대 아래 네모 받침 잘라내기
RES = (960, 1120)               # 사이트 석고상 사진 2배 크기
IVORY = (0.74, 0.66, 0.54, 1)   # 통일할 석고색 (따뜻한 베이지)

bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene
bpy.ops.import_scene.gltf(filepath=GLB)
meshes = [o for o in sc.objects if o.type == 'MESH']

if CUT:
    import bmesh
    # 부모를 풀고 위치·크기를 메시에 적용 → 메시 좌표 = 화면 좌표
    for o in meshes:
        mw = o.matrix_world.copy(); o.parent = None; o.matrix_world = mw
        o.data.transform(o.matrix_world); o.matrix_world.identity()
    vs = [v.co.copy() for o in meshes for v in o.data.vertices]
    z0 = min(v.z for v in vs); H = max(v.z for v in vs) - z0; step = H * 0.005
    def width(z):
        xs = [v.x for v in vs if z <= v.z < z + step]
        return (max(xs) - min(xs)) if len(xs) > 3 else 0
    W0 = max(width(z0 + i * step) for i in range(3))
    zc = None
    for i in range(1, 40):                     # 아래쪽 20% 안에서만 찾기
        if width(z0 + i * step) < 0.8 * W0: zc = z0 + i * step; break
    if zc:
        for o in meshes:
            bm = bmesh.new(); bm.from_mesh(o.data)
            geom = bm.verts[:] + bm.edges[:] + bm.faces[:]
            bmesh.ops.bisect_plane(bm, geom=geom, plane_co=(0, 0, zc), plane_no=(0, 0, 1), clear_inner=True)
            bm.to_mesh(o.data); bm.free(); o.data.update()
        print('CUT at', round((zc - z0) / H * 100, 1), '% of height')
    else:
        print('CUT: no plinth found')
    bpy.context.view_layer.update()

# 크기·위치 맞추기: 높이 2.0, 바닥 z=0, 가운데 x=y=0
pts = [o.matrix_world @ Vector(c) for o in meshes for c in o.bound_box]
mn = Vector((min(p.x for p in pts), min(p.y for p in pts), min(p.z for p in pts)))
mx = Vector((max(p.x for p in pts), max(p.y for p in pts), max(p.z for p in pts)))
s = 2.0 / (mx.z - mn.z)
roots = [o for o in sc.objects if o.parent is None]
for o in roots:
    o.scale *= s
    o.location = (o.location - Vector(((mn.x + mx.x) / 2, (mn.y + mx.y) / 2, mn.z))) * s
bpy.context.view_layer.update()

# 재질: 원래 무늬의 밝기만 살짝 남기고 색은 모두 같은 석고색
for o in meshes:
    for slot in o.material_slots:
        m = slot.material
        if not m or not m.use_nodes: continue
        nt = m.node_tree
        bsdf = next((n for n in nt.nodes if n.type == 'BSDF_PRINCIPLED'), None)
        if not bsdf: continue
        link = bsdf.inputs['Base Color'].links
        src = link[0].from_socket if link else None
        bw = nt.nodes.new('ShaderNodeRGBToBW')
        ramp = nt.nodes.new('ShaderNodeMix'); ramp.data_type = 'RGBA'; ramp.blend_type = 'MULTIPLY'
        ramp.inputs['Factor'].default_value = TEX_MIX
        ramp.inputs['A'].default_value = IVORY
        if src:
            nt.links.new(src, bw.inputs['Color'])
            # 밝기를 1 근처로 끌어올려 무늬만 남기기
            br = nt.nodes.new('ShaderNodeBrightContrast')
            br.inputs['Bright'].default_value = 0.08
            br.inputs['Contrast'].default_value = 0.25
            nt.links.new(bw.outputs['Val'], br.inputs['Color'])
            nt.links.new(br.outputs['Color'], ramp.inputs['B'])
        else:
            ramp.inputs['B'].default_value = (1, 1, 1, 1)
        nt.links.new(ramp.outputs['Result'], bsdf.inputs['Base Color'])
        bsdf.inputs['Roughness'].default_value = 0.62
        for k in ('Metallic', 'Specular IOR Level'):
            if k in bsdf.inputs and not bsdf.inputs[k].links:
                bsdf.inputs[k].default_value = 0.0 if k == 'Metallic' else 0.35
        if 'Subsurface Weight' in bsdf.inputs:
            bsdf.inputs['Subsurface Weight'].default_value = 0.08
            bsdf.inputs['Subsurface Radius'].default_value = (0.06, 0.05, 0.04)
        # 거칠기·금속 맵이 무늬를 다르게 만들지 않도록 끊기
        for k in ('Roughness', 'Metallic'):
            for l in list(bsdf.inputs[k].links): nt.links.remove(l)

# 조명: 왼쪽 위 주광 + 오른쪽 보조광 + 뒤쪽 테두리광 + 은은한 주변광
def area(name, loc, energy, size, color=(1, 0.97, 0.92)):
    d = bpy.data.lights.new(name, 'AREA'); d.energy = energy; d.size = size; d.color = color
    o = bpy.data.objects.new(name, d); sc.collection.objects.link(o); o.location = loc
    o.rotation_euler = (Vector((0, 0, 1.1)) - Vector(loc)).to_track_quat('-Z', 'Y').to_euler()
area('key', (-2.6, -3.2, 3.4), 420, 2.2, (1, 0.93, 0.84))
area('fill', (3.0, -2.6, 1.6), 140, 3.0, (0.95, 0.96, 1.0))
area('rim', (0.8, 3.0, 3.0), 260, 1.6)
w = bpy.data.worlds.new('w'); sc.world = w; w.use_nodes = True
w.node_tree.nodes['Background'].inputs['Color'].default_value = (0.9, 0.87, 0.82, 1)
w.node_tree.nodes['Background'].inputs['Strength'].default_value = 0.35

# 카메라: 정면, 살짝 아래에서, 85mm
cd = bpy.data.cameras.new('cam'); cd.lens = 85
cam = bpy.data.objects.new('cam', cd); sc.collection.objects.link(cam); sc.camera = cam
cam.location = (0, -9.2, 1.15); cam.rotation_euler = (math.radians(89), 0, 0)
# 화면에 맞추기: 높이 2.0이 화면 높이의 약 92%가 되게
cd.sensor_fit = 'VERTICAL'; cd.sensor_height = 24
dist = 9.2; cd.lens = 24 * dist / (2.0 / 0.92)

sc.render.engine = 'CYCLES'
sc.cycles.samples = 96; sc.cycles.use_denoising = True
try:
    sc.cycles.device = 'GPU'
except Exception: pass
sc.render.film_transparent = True
sc.render.resolution_x, sc.render.resolution_y = RES
sc.render.image_settings.file_format = 'PNG'; sc.render.image_settings.color_mode = 'RGBA'
sc.view_settings.view_transform = 'Standard'; sc.view_settings.look = 'Medium Contrast'
sc.render.filepath = OUT
bpy.ops.render.render(write_still=True)
print('RENDERED', OUT)
