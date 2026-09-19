"""Pack the actual realtime art study into one offline HTML file."""
import re,json,base64
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
source=(ROOT/'prototypes/v2.5-anime-city-block.html').read_text(encoding='utf-8')
scripts=re.findall(r'<script[^>]*>(.*?)</script>',source,re.S)
html=(ROOT/'prototypes/reference-corner.html').read_text(encoding='utf-8')
kit=ROOT/'assets/v2.5-city-kit'
assets={name:'data:model/gltf-binary;base64,'+base64.b64encode((kit/(name+'.glb')).read_bytes()).decode() for name in ['la-zombie-shambler-anime','la-bow-recurve-pov','la-hand-grip','la-hand-draw']}
assets['la-zombie-shambler-anime']='data:model/gltf-binary;base64,'+base64.b64encode((ROOT/'assets/reference-corner/la-corner-shambler.glb').read_bytes()).decode()
html=html.replace('<!-- ENGINE -->','\n'.join('<script>'+s+'</script>' for s in scripts[:2]))
html=html.replace('<!-- ASSETS -->','<script>const CORNER_ASSETS='+json.dumps(assets)+';</script>')
html=html.replace('<!-- RUNTIME -->','<script>\n'+(ROOT/'prototypes/reference-corner.js').read_text(encoding='utf-8')+'\n</script>')
target=ROOT/'prototypes/v2.5-reference-corner.html';target.write_text(html,encoding='utf-8');print(f'{target.name}: {target.stat().st_size/1024:.0f} KiB')
