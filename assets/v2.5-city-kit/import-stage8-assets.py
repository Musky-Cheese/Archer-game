"""Run this file inside Blender to import the exact Stage 8 asset files.

Adds a collection without deleting existing work, then saves a new blend copy.
The data URI review page is not needed. Keep this file beside the individual GLBs.
"""
from pathlib import Path
from datetime import datetime
import bpy

asset_dir=Path(__file__).resolve().parent
collection=bpy.data.collections.new('Last Archer Stage 8')
bpy.context.scene.collection.children.link(collection)
for i,source in enumerate(sorted(asset_dir.glob('*.glb'))):
    before=set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=str(source))
    imported=set(bpy.data.objects)-before
    for obj in imported:
        for previous in list(obj.users_collection):previous.objects.unlink(obj)
        collection.objects.link(obj)
    for obj in imported:
        if obj.parent not in imported:
            obj.location.x+=(i%4)*12
            obj.location.y+=(i//4)*14

target=asset_dir/('last-archer-stage8-'+datetime.now().strftime('%Y%m%d-%H%M%S')+'.blend')
bpy.ops.wm.save_as_mainfile(filepath=str(target),copy=True)
print('Saved editable Stage 8 import:',target)
