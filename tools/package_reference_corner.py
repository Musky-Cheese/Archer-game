"""Write a human-readable manifest and portable ZIP from the validated modules."""
import json,zipfile
from pathlib import Path
root=Path(__file__).resolve().parents[1]
kit=root/'assets/reference-corner'
rows=json.loads((kit/'manifest.json').read_text())
descriptions={'la-corner-shambler.glb':'Rigged jacket-wearing shambler; Idle and Walk',
 'la-mart-shell.glb':'Four-storey shop shell; separate window/balcony modules',
 'la-window.glb':'Recessed window, frame and sill','la-balcony.glb':'Balcony slab and railings',
 'la-aircon.glb':'Wall air conditioner','la-dumpster.glb':'Sanitation dumpster',
 'la-refuse-bags.glb':'Three faceted refuse bags','la-vending.glb':'Revive Energy vending cabinet',
 'la-abandoned-sedan.glb':'Abandoned compact sedan','la-street-lamp.glb':'Street lamp mesh',
 'la-billboard.glb':'Supported insurance billboard with embedded creative'}
lines=['# Reference corner asset manifest','','Each file is a self-contained GLB; dimensions are X × Y × Z in metres.','',
 '| File | What it is | Dimensions (m) | Triangles | KiB |', '|---|---|---|---:|---:|']
for r in rows:
    lines.append(f"| {r['file']} | {descriptions[r['file']]} | {' × '.join(f'{v:.2f}' for v in r['dimensions_m'])} | {r['triangles']} | {r['bytes']/1024:.1f} |")
lines+=['','All use a base-centred origin and flat shading. The character has one vertex-colour material; textured props use a few small embedded colour images (256 px maximum).','',
 'Each export has a matching PNG in `previews/`. These are renders of the GLBs, not concept art.']
(kit/'manifest.md').write_text('\n'.join(lines)+'\n',encoding='utf-8')
archive=root/'docs/v2.5/last-archer-reference-corner-assets.zip'
with zipfile.ZipFile(archive,'w',zipfile.ZIP_DEFLATED) as z:
    for p in sorted(kit.rglob('*')):
        if p.is_file():z.write(p,p.relative_to(kit))
print(f'Packaged {len(rows)} modules, manifest and previews: {archive.stat().st_size//1024} KiB')
