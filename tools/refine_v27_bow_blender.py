"""Build the isolated V2.7 recurve bow source and browser-ready GLB.

Open this script in Blender while last-archer-v261-bow-source.blend is open,
then run it. It keeps V2.6.1 untouched and saves the V2.7 work separately.
"""

import json
from pathlib import Path

import bpy


_text = bpy.data.texts.get(Path(__file__).name)
_script_path = Path(bpy.path.abspath(_text.filepath)) if _text and _text.filepath else Path(__file__).resolve()
ROOT = _script_path.parent.parent
SOURCE_DIR = ROOT / "assets" / "v2.6.1-bow"
OUTPUT_DIR = ROOT / "assets" / "v2.7-bow"
WORKING_BLEND = OUTPUT_DIR / "last-archer-v27-bow-working.blend"
EXPORT_GLB = OUTPUT_DIR / "la-recurve-v27.glb"
MANIFEST = OUTPUT_DIR / "manifest.json"
COLLECTION_NAME = "LAST_ARCHER_V27_RECURVE"


def material(name, hex_colour, roughness=0.78, metallic=0.0):
    colour = tuple(int(hex_colour[i : i + 2], 16) / 255 for i in (0, 2, 4)) + (1.0,)
    mat = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    mat.use_nodes = True
    shader = mat.node_tree.nodes.get("Principled BSDF")
    shader.inputs["Base Color"].default_value = colour
    shader.inputs["Roughness"].default_value = roughness
    shader.inputs["Metallic"].default_value = metallic
    mat.diffuse_color = colour
    return mat


def remove_previous(collection_name):
    old = bpy.data.collections.get(collection_name)
    if not old:
        return
    for obj in list(old.objects):
        bpy.data.objects.remove(obj, do_unlink=True)
    bpy.data.collections.remove(old)


def sweep(collection, name, points, radii, sides, materials, stripe=False):
    """Faceted vertical sweep. Points are (x, y, z), radii are (x, z)."""
    vertices = []
    for (x, y, z), (rx, rz) in zip(points, radii):
        for side in range(sides):
            angle = 2.0 * 3.141592653589793 * side / sides
            vertices.append((x + rx * __import__("math").cos(angle), y, z + rz * __import__("math").sin(angle)))
    faces, face_materials = [], []
    for ring in range(len(points) - 1):
        for side in range(sides):
            nxt = (side + 1) % sides
            faces.append((ring * sides + side, ring * sides + nxt, (ring + 1) * sides + nxt, (ring + 1) * sides + side))
            face_materials.append((ring % len(materials)) if stripe else 0)
    faces.extend([tuple(reversed(range(sides))), tuple((len(points) - 1) * sides + i for i in range(sides))])
    face_materials.extend([0, 0])
    mesh = bpy.data.meshes.new(name + "_MESH")
    mesh.from_pydata(vertices, [], faces)
    mesh.materials.clear()
    for mat in materials:
        mesh.materials.append(mat)
    for polygon, index in zip(mesh.polygons, face_materials):
        polygon.material_index = index
        polygon.use_smooth = False
    obj = bpy.data.objects.new(name, mesh)
    collection.objects.link(obj)
    return obj


def box(collection, name, centre, half_size, mat):
    x, y, z = centre
    hx, hy, hz = half_size
    vertices = [(x + sx * hx, y + sy * hy, z + sz * hz) for sx in (-1, 1) for sy in (-1, 1) for sz in (-1, 1)]
    faces = [(0, 1, 3, 2), (4, 6, 7, 5), (0, 4, 5, 1), (2, 3, 7, 6), (0, 2, 6, 4), (1, 5, 7, 3)]
    mesh = bpy.data.meshes.new(name + "_MESH")
    mesh.from_pydata(vertices, [], faces)
    mesh.materials.append(mat)
    for polygon in mesh.polygons:
        polygon.use_smooth = False
    obj = bpy.data.objects.new(name, mesh)
    collection.objects.link(obj)
    return obj


def triangle_count(objects):
    return sum(sum(max(0, len(face.vertices) - 2) for face in obj.data.polygons) for obj in objects if obj.type == "MESH")


def build_bow(collection):
    dark_wood = material("V27_Wood_Dark", "251913")
    warm_wood = material("V27_Wood_Laminate", "6C3F25")
    amber_edge = material("V27_Wood_Edge", "A76A37")
    leather = material("V27_Leather", "241914")
    leather_light = material("V27_Leather_Wrap", "5A3924")
    serving = material("V27_String_Serving", "262A2B", 0.55, 0.05)
    horn = material("V27_Tip_Horn", "B7AA85", 0.45, 0.08)

    # Y is vertical and the root stays at the base-centre (0, 0, 0).
    lower = [(0, .025, .105), (0, .10, .175), (0, .26, .105), (0, .48, .040), (0, .615, .012)]
    upper = [(0, .885, .012), (0, 1.13, .043), (0, 1.39, .115), (0, 1.54, .205), (0, 1.60, .135)]
    limb_radii = [(.018, .013), (.025, .018), (.030, .021), (.026, .019), (.019, .014)]
    objects = [
        sweep(collection, "V27_LOWER_LIMB", lower, limb_radii, 5, [dark_wood, warm_wood], True),
        sweep(collection, "V27_UPPER_LIMB", upper, limb_radii, 5, [dark_wood, warm_wood], True),
        sweep(collection, "V27_LOWER_LAMINATE", [(x, y, z - .019) for x, y, z in lower], [(.012, .004)] * 5, 3, [amber_edge]),
        sweep(collection, "V27_UPPER_LAMINATE", [(x, y, z - .019) for x, y, z in upper], [(.012, .004)] * 5, 3, [amber_edge]),
    ]

    # Carved riser has a broad shoulder, narrowed throat and simple angular planes.
    riser = [(0, .605, .01), (0, .65, -.002), (0, .74, -.010), (0, .84, -.003), (0, .91, .012)]
    objects.append(sweep(collection, "V27_CARVED_RISER", riser, [(.045, .033), (.055, .046), (.043, .050), (.055, .046), (.045, .033)], 6, [warm_wood, dark_wood], True))
    objects.append(sweep(collection, "V27_LEATHER_GRIP", [(0, .665, .005), (0, .71, .006), (0, .76, .006), (0, .81, .006), (0, .855, .006)], [(.040, .043), (.045, .048), (.046, .050), (.045, .048), (.040, .043)], 6, [leather, leather_light], True))

    # Four thin bands sell a wrapped grip while preserving the low triangle budget.
    for index, y in enumerate((.69, .735, .78, .825)):
        objects.append(sweep(collection, f"V27_GRIP_WRAP_{index + 1}", [(0, y - .006, .006), (0, y + .006, .006)], [(.049, .052), (.049, .052)], 5, [leather_light]))

    objects.extend([
        sweep(collection, "V27_LOWER_TIP", lower[:2], [(.025, .019), (.028, .021)], 4, [horn]),
        sweep(collection, "V27_UPPER_TIP", upper[-2:], [(.028, .021), (.025, .019)], 4, [horn]),
        sweep(collection, "V27_BOWSTRING", [(0, .025, .105), (0, .78, .235), (0, 1.60, .135)], [(.004, .004)] * 3, 4, [serving]),
        sweep(collection, "V27_STRING_SERVING", [(0, .69, .225), (0, .78, .235), (0, .87, .225)], [(.009, .009)] * 3, 5, [serving]),
        box(collection, "V27_ARROW_SHELF", (.040, .88, .065), (.032, .012, .042), horn),
        box(collection, "V27_SHELF_PAD", (.041, .895, .097), (.022, .006, .020), leather),
        box(collection, "V27_SIGHT_PLATE", (-.045, .905, .025), (.010, .038, .020), dark_wood),
    ])
    return objects


def export_bow(objects):
    bpy.ops.object.select_all(action="DESELECT")
    for obj in objects:
        obj.select_set(True)
    bpy.context.view_layer.objects.active = objects[0]
    bpy.ops.export_scene.gltf(
        filepath=str(EXPORT_GLB),
        export_format="GLB",
        use_selection=True,
        export_apply=False,
        export_yup=True,
    )


def main():
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    remove_previous(COLLECTION_NAME)
    collection = bpy.data.collections.new(COLLECTION_NAME)
    bpy.context.scene.collection.children.link(collection)
    v261 = bpy.data.collections.get("LAST_ARCHER_V261_BOW_SOURCE")
    if v261:
        v261.hide_viewport = True
        v261.hide_render = True
    objects = build_bow(collection)
    count = triangle_count(objects)
    if count >= 800:
        raise RuntimeError(f"V2.7 bow uses {count} triangles; budget is under 800")
    export_bow(objects)
    MANIFEST.write_text(json.dumps({
        "file": EXPORT_GLB.name,
        "asset": "realistic anime first-person recurve bow",
        "dimensions_m": [0.11, 1.60, 0.24],
        "triangles": count,
        "origin": "base-centre, Y-up, metres",
        "materials": 7,
        "textures": 0,
        "source": "last-archer-v27-bow-working.blend",
    }, indent=2), encoding="utf-8")
    bpy.context.scene["last_archer_v27_note"] = "V2.7 isolated bow source; V2.6.1 retained but hidden."
    bpy.ops.wm.save_as_mainfile(filepath=str(WORKING_BLEND))
    print(f"LAST_ARCHER_V27_COMPLETE {EXPORT_GLB} ({count} triangles)")


if __name__ == "__main__":
    main()
