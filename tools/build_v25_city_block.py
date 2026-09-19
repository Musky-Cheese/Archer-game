"""Build the offline review page from the unchanged game and Stage 8 sources."""
import base64,json,re
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
def main():
    html=(ROOT/'prototypes/v2.5-render-lab.html').read_text(encoding='utf-8')
    html=re.sub(r'  var PORTABLE_GLB = \{.*?\n  \};','  var PORTABLE_GLB = {};',html,count=1,flags=re.S)
    a=html.index('  // ================= V2.5 renderer lab');b=html.index('  // ================= boot',a)
    source=(ROOT/'prototypes/v2.5-city-runtime.js').read_text(encoding='utf-8')
    kit=ROOT/'assets/v2.5-city-kit'
    data={p.stem:'data:model/gltf-binary;base64,'+base64.b64encode(p.read_bytes()).decode() for p in kit.glob('*.glb')}
    html=html[:a]+'  var V25_CITY_GLB='+json.dumps(data)+';\n'+source+'\n'+html[b:]
    html=html.replace('    buildGround();\n    buildBoundary();\n    buildPlatformAndRamps();\n    buildObstacles();\n    buildContainers();','    // District built once after renderer initialization.')
    html=html.replace('  installRendererLab();','  installV25CityBlock();')
    html=re.sub(r'\n    // first-person bow\n.*?\n    hctx.restore\(\);','',html,count=1,flags=re.S)
    html=re.sub(r"        if\(e.frameT>0.22\).*?\n",'        animateEnemy(e,dt);\n',html,count=1)
    a=html.index('    for(var a=arrows.length-1;a>=0;a--){',html.index('  function update(dt)'));b=html.index('    for(var p=particles.length-1;p>=0;p--){',a)
    html=html[:a]+'    updateCityArrows(dt);\n\n'+html[b:]
    html=html.replace('    scene.remove(e.sprite);\n    spawnBurst','    retireEnemy(e);\n    spawnBurst')
    html=html.replace('          scene.remove(e.sprite);\n          enemies.splice','          disposeCityActor(e);scene.remove(e.sprite);\n          enemies.splice')
    html=html.replace("fireBtn.addEventListener('pointercancel', releaseFireBtn);","fireBtn.addEventListener('pointercancel', function(){chargeActive=false;charge=0;fireBtn.classList.remove('pressed');});")
    html=html.replace("fireBtn.addEventListener('pointerleave', function(ev){ if(ev.pointerType==='touch') releaseFireBtn(); });",'// Pointer capture owns release; leaving does not fire.')
    html=html.replace("g.addColorStop(1,'rgba(0,0,0,.5)')","g.addColorStop(1,'rgba(0,0,0,.16)')")
    html=html.replace('    tex.anisotropy=renderer.capabilities.getMaxAnisotropy();','    tex.encoding=THREE.sRGBEncoding;tex.anisotropy=Math.min(4,renderer.capabilities.getMaxAnisotropy());')
    html=html.replace('Last Archer V2.5 — Renderer Lab','Last Archer V2.5 — Nightfall District')
    html=html.replace('lastArcher.v21.profile','lastArcher.v25.review.profile').replace('lastArcher.highScore','lastArcher.v25.review.highScore')
    css=(ROOT/'prototypes/v2.5-city.css').read_text();html=html.replace('</style>',css+'\n</style>',1)
    target=ROOT/'prototypes/v2.5-anime-city-block.html';target.write_text(html,encoding='utf-8')
    print(f'{target.name}: {target.stat().st_size/1024:.0f} KB; {len(data)} independent assets')
if __name__=='__main__':main()
