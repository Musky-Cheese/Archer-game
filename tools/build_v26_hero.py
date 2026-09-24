"""V2.6 local slice: reuse the intact art-study world and proven game loop.

The generated HTML is disposable output. V2.5 sources and assets stay unchanged.
"""
import base64, json, re
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]

def main():
    html = (ROOT/'prototypes/v2.5-corner-playable.html').read_text(encoding='utf-8')
    start = html.index('  var V25_CORNER_GLB=')
    end = html.index('  // ================= boot', start)
    original = (ROOT/'prototypes/v2.5-city-runtime.js').read_text(encoding='utf-8')
    # These original factory implementations are replaced by explicit assignments
    # below; keeping the old gameplay closure avoids a second simulation loop.
    reference = (ROOT/'prototypes/reference-corner.js').read_text(encoding='utf-8')
    world = reference[reference.index('let seed='):reference.index('// Character/weapon assets')]
    world = world.replace('batchArchitecture();', (ROOT/'prototypes/v2.6-surfaces.js').read_text(encoding='utf-8')+'\nbatchArchitecture();')
    world = world.replace("const scene=", "const unusedScene=")
    # Keep source-world object coordinates, not base-centred GLB module origins.
    world = 'makeCityWorld=function(){\nscene.background=new THREE.Color(0x0a1421);scene.fog=new THREE.FogExp2(0x101e2b,.022);\n'+world
    world += '\ncity.solids=colliders.map(c=>Object.assign({y0:0,y1:18},c));\n'
    world += 'city.solids.push({x0:-30,x1:30,z0:16,z1:18,y0:0,y1:1.2},{x0:-30,x1:30,z0:-39,z1:-37,y0:0,y1:1.2});\n'
    world += 'city.placements=solidRoot.children.length;obstacles=city.solids;heroWorld={reflect:reflectWetRoad,ads,updateAd:(id,patch)=>{if(!ads[id])throw Error("Unknown slot");Object.assign(ads[id],patch);if(id==="VENDING_01")refreshVending();else{billboardMat.map.dispose();billboardMat.map=billboardCreative();}}};\n};\n'
    original = original.replace('d.age>1.2','d.age>3.0')
    original = original.replace('renderer.info.reset();renderer.autoClear=true;renderer.render(scene,camera);','renderer.info.reset();renderer.autoClear=true;containers.forEach(c=>{if(c.group.children[1])c.group.children[1].visible=!city.review&&Math.hypot(c.x-player.x,c.z-player.z)<4.5;});if(heroWorld)heroWorld.reflect();renderer.render(scene,camera);')
    # Fix old steering's square-map clamp; this preview is a bounded long street.
    original = original.replace('Math.max(-15.2,Math.min(15.2,next.x))','Math.max(-11.5,Math.min(11.5,next.x))').replace('Math.max(-15.2,Math.min(15.2,next.z))','Math.max(-36.5,Math.min(15.5,next.z))')
    asset=ROOT/'assets/v2.6-hero/la-shambler-v26.glb'
    data={'la-zombie-shambler-anime':'data:model/gltf-binary;base64,'+base64.b64encode(asset.read_bytes()).decode()}
    body='var heroWorld=null;var V26_GLB='+json.dumps(data)+';\n'+original+'\n'+world
    body+=(ROOT/'prototypes/v2.6-weapon.js').read_text(encoding='utf-8')
    body+=(ROOT/'prototypes/v2.6-integration.js').read_text(encoding='utf-8')
    html=html[:start]+body+'\n'+html[end:]
    html=html.replace('installCornerPlayable();','installHeroSlice();')
    html=html.replace('Last Archer V2.5 — The Last Corner','Last Archer V2.6 — Nak amachi'.replace('Nak amachi','Nakamachi'))
    html=html.replace('lastArcher.v25.corner','lastArcher.v26.hero')
    html=html.replace('Math.max(-WORLD_HALF+PLAYER_RADIUS,Math.min(WORLD_HALF-PLAYER_RADIUS,testEntity.x))','Math.max(-11.5,Math.min(11.5,testEntity.x))')
    html=html.replace('</style>', '\n#district-panel{border-color:#9a805e} #district-panel button{background:#bc9a65} #district-panel h2{letter-spacing:3px} #look-hint{opacity:.7}\n</style>',1)
    target=ROOT/'prototypes/v2.6-hero-slice.html'
    target.write_text(html,encoding='utf-8')
    print(f'{target.name}: {target.stat().st_size/1024:.0f} KiB')

if __name__=='__main__':main()
