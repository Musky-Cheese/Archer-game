"""Run inside Blender's Scripting workspace to rebuild/export the V2.5 city kit.

Open last-archer-v2.5-city-kit-source.blend first. The script writes individual
GLBs into an `individual-assets` folder next to the .blend file.
"""
import bpy
from pathlib import Path

OUT = Path(bpy.path.abspath("//")) / "individual-assets"
OUT.mkdir(exist_ok=True)

PALETTE = {
    "charcoal": (0.125, 0.165, 0.205, 1), "concrete": (0.22, 0.275, 0.315, 1),
    "brick": (0.376, 0.255, 0.235, 1), "window": (0.055, 0.11, 0.145, 1),
    "amber": (0.84, 0.604, 0.29, 1), "olive": (0.38, 0.47, 0.24, 1),
    "cream": (0.82, 0.78, 0.67, 1), "metal": (0.12, 0.16, 0.19, 1),
}
MATERIALS = {}

def mat(name):
    if name not in MATERIALS:
        value = bpy.data.materials.get("V25_" + name.upper()) or bpy.data.materials.new("V25_" + name.upper())
        value.diffuse_color = PALETTE[name]
        value.use_nodes = True
        bsdf = value.node_tree.nodes.get("Principled BSDF")
        bsdf.inputs["Base Color"].default_value = PALETTE[name]
        bsdf.inputs["Roughness"].default_value = 0.82
        bsdf.inputs["Metallic"].default_value = 0.45 if name == "metal" else 0.0
        MATERIALS[name] = value
    return MATERIALS[name]

def cube(root, name, size, loc, material):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc)
    obj = bpy.context.object; obj.name = name; obj.dimensions = size
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    obj.data.materials.append(mat(material)); obj.parent = root
    for poly in obj.data.polygons: poly.use_smooth = False
    return obj

def cyl(root, name, radius, depth, loc, material):
    bpy.ops.mesh.primitive_cylinder_add(vertices=8, radius=radius, depth=depth, location=loc)
    obj = bpy.context.object; obj.name = name; obj.data.materials.append(mat(material)); obj.parent = root
    for poly in obj.data.polygons: poly.use_smooth = False
    return obj

def root_for(name):
    root = bpy.data.objects.new(name, None); bpy.context.collection.objects.link(root); return root

def storefront(root):
    cube(root,"wall",(8,5.8,.45),(0,2.9,0),"charcoal"); cube(root,"sign",(7.1,.58,.15),(0,4.65,-.32),"cream")
    cube(root,"top-band",(7.7,.36,.18),(0,5.35,-.32),"brick"); cube(root,"door",(1.28,2.62,.13),(-3.1,1.45,-.31),"metal")
    for x in (-2.2,0,2.2): cube(root,"window",(1.75,2.15,.12),(x,2.25,-.31),"window")
    for x in (-3.85,3.85): cube(root,"trim",(.22,2.35,.18),(x,2.15,-.38),"amber")

def corner(root):
    cube(root,"front-wall",(8,5.8,.45),(0,2.9,3.78),"charcoal"); cube(root,"side-wall",(.45,5.8,8),(3.78,2.9,0),"brick")
    for x in (-2.1,0,2.1): cube(root,"front-window",(1.55,2.05,.12),(x,2.15,3.48),"window")
    for z in (-2.1,0,2.1): cube(root,"side-window",(.12,2.05,1.55),(3.48,2.15,z),"window")
    cube(root,"front-sign",(7.2,.52,.12),(0,4.62,3.48),"cream"); cube(root,"side-sign",(.12,.52,7.2),(3.48,4.62,0),"amber")

def alley(root):
    cube(root,"wall",(6,5.5,.42),(0,2.75,0),"concrete"); cube(root,"door",(1.35,2.45,.13),(-1.8,1.3,-.28),"metal")
    cube(root,"boarded-panel",(1.65,1.05,.13),(1.62,2.65,-.28),"brick"); cube(root,"window",(1.32,.82,.14),(1.62,4.1,-.29),"window"); cube(root,"lamp",(.15,.15,.22),(-.35,4.55,-.35),"amber")

def sidewalk(root):
    cube(root,"sidewalk",(8,.16,2.25),(0,.08,0),"concrete"); cube(root,"curb",(8,.25,.3),(0,.125,-1.1),"charcoal")
    for x in (-2.5,0,2.5): cube(root,"seam",(.09,.02,2.08),(x,.175,0),"concrete")

def road(root):
    cube(root,"asphalt",(16,.08,16),(0,.04,0),"charcoal")
    for n in range(-6,7,3): cube(root,"crosswalk",(1.45,.02,.24),(n,.09,-4.4),"cream"); cube(root,"crosswalk",(.24,.02,1.45),(-4.4,.09,n),"cream")

def streetlight(root):
    cyl(root,"base",.22,.16,(0,.08,0),"metal"); cyl(root,"pole",.1,4.7,(0,2.42,0),"metal"); cube(root,"arm",(1,.1,.1),(.45,4.65,0),"metal"); cube(root,"lamp",(.38,.18,.32),(.88,4.48,0),"amber")

def dumpster(root):
    cube(root,"body",(2.15,1.18,1.08),(0,.7,0),"olive"); cube(root,"lid",(2.25,.15,1.17),(0,1.35,0),"metal"); cube(root,"panel",(1.3,.38,.08),(0,.83,-.58),"cream")
    for x in (-.83,.83):
        cyl(root,"wheel",.13,.18,(x,.13,-.42),"metal"); cyl(root,"wheel",.13,.18,(x,.13,.42),"metal")

RECIPES = [("la-city-storefront-facade", storefront), ("la-city-corner-facade", corner), ("la-city-alley-wall", alley), ("la-city-sidewalk-curb", sidewalk), ("la-city-intersection-road", road), ("la-city-streetlight-anime", streetlight), ("la-city-dumpster-anime", dumpster)]

def export(root, filename):
    bpy.ops.object.select_all(action="DESELECT"); root.select_set(True)
    for child in root.children_recursive: child.select_set(True)
    bpy.context.view_layer.objects.active = root
    bpy.ops.export_scene.gltf(filepath=str(OUT / (filename + ".glb")), export_format="GLB", use_selection=True, export_apply=True)

for name, recipe in RECIPES:
    old = bpy.data.objects.get(name)
    if old: bpy.data.objects.remove(old, do_unlink=True)
    root = root_for(name); recipe(root); export(root, name)

bpy.ops.wm.save_as_mainfile(filepath=str(Path(bpy.path.abspath("//")) / "last-archer-v2.5-city-kit-source.blend"))
print("Built V2.5 city kit:", OUT)
