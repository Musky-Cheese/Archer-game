"""Create the editable Blender source for the V2.6.1 foreground bow kit.

Run with Blender in background mode.  It imports the four shipped GLBs into
separate collections, keeps their base-centred origins, stores the runtime
placement as metadata, saves a portable .blend, and exports one round-trip
GLB as a proof that Blender can send an asset back to the browser pipeline.
"""

import json
from pathlib import Path

import bpy


# Blender can report __file__ as only "\\create_v261_bow_blend.py" when a
# text block runs inside its editor. Its text datablock preserves the full
# disk path, so prefer that and retain __file__ for background invocations.
_text_name = Path(__file__).name
_loaded_text = bpy.data.texts.get(_text_name)
_script_file = (
    Path(bpy.path.abspath(_loaded_text.filepath))
    if _loaded_text and _loaded_text.filepath
    else Path(__file__).resolve()
)
ROOT = _script_file.parent.parent
ASSET_DIR = ROOT / "assets" / "v2.6.1-bow"
MANIFEST_PATH = ASSET_DIR / "manifest.json"
SOURCE_BLEND = ASSET_DIR / "last-archer-v261-bow-source.blend"
ROUNDTRIP_DIR = ASSET_DIR / "blender-roundtrip"


def clear_scene():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    for collection in list(bpy.data.collections):
        bpy.data.collections.remove(collection)


def import_asset(row, source_collection):
    """Import an exported GLB as editable meshes under its own source root."""
    filepath = ASSET_DIR / row["file"]
    before = set(bpy.context.scene.objects)
    bpy.ops.import_scene.gltf(filepath=str(filepath))
    imported = [obj for obj in bpy.context.scene.objects if obj not in before]

    asset_collection = bpy.data.collections.new(filepath.stem)
    source_collection.children.link(asset_collection)

    root = bpy.data.objects.new(f"{filepath.stem}_SOURCE", None)
    root.empty_display_type = "ARROWS"
    root.empty_display_size = 0.15
    root["asset_file"] = row["file"]
    root["triangles_budget"] = row["triangles"]
    root["source_offset"] = row["sourceOffset"]
    root["origin"] = row["origin"]
    root["units"] = "metres, Y-up"
    asset_collection.objects.link(root)

    for obj in imported:
        for collection in list(obj.users_collection):
            collection.objects.unlink(obj)
        asset_collection.objects.link(obj)
        obj.parent = root
        if obj.type == "MESH":
            for polygon in obj.data.polygons:
                polygon.use_smooth = False
    return root


def add_readme_text(manifest):
    text = bpy.data.texts.new("LAST_ARCHER_EXPORT_GUIDE")
    text.write(
        "LAST ARCHER V2.6.1 FOREGROUND BOW KIT\n\n"
        "Each asset is in its own collection, metres/Y-up, with a base-centred source origin.\n"
        "Edit a collection at a time. Keep flat shading and the triangle budget below.\n"
        "Export selected collection objects as GLB, with +Y up and no external textures.\n\n"
    )
    for row in manifest:
        text.write(f"{row['file']}: budget {row['triangles']} triangles; source offset {row['sourceOffset']}\n")


def export_roundtrip(root):
    """Export the recurve only as a small, independent pipeline proof."""
    ROUNDTRIP_DIR.mkdir(exist_ok=True)
    bpy.ops.object.select_all(action="DESELECT")
    for obj in [root, *root.children_recursive]:
        obj.select_set(True)
    bpy.context.view_layer.objects.active = root.children[0] if root.children else root
    bpy.ops.export_scene.gltf(
        filepath=str(ROUNDTRIP_DIR / "la-recurve-v261-roundtrip.glb"),
        export_format="GLB",
        use_selection=True,
        export_apply=False,
        export_yup=True,
    )


def main():
    manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
    clear_scene()
    bpy.context.scene.unit_settings.system = "METRIC"
    bpy.context.scene.unit_settings.length_unit = "METERS"
    bpy.context.scene["project"] = "Last Archer V2.6.1"
    bpy.context.scene["purpose"] = "Editable source for individual, browser-ready GLB exports"

    source_collection = bpy.data.collections.new("LAST_ARCHER_V261_BOW_SOURCE")
    bpy.context.scene.collection.children.link(source_collection)
    roots = {}
    for row in manifest:
        roots[row["file"]] = import_asset(row, source_collection)
    add_readme_text(manifest)
    export_roundtrip(roots["la-recurve-v261.glb"])
    bpy.ops.wm.save_as_mainfile(filepath=str(SOURCE_BLEND))
    print(f"Created {SOURCE_BLEND}")


if __name__ == "__main__":
    main()
