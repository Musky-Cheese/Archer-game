"""Build a self-contained playable preview from the approved corner kit and V2.5 systems."""
import base64,json,re
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]

def uri(path):
    return 'data:model/gltf-binary;base64,'+base64.b64encode(path.read_bytes()).decode()

def main():
    html=(ROOT/'prototypes/v2.5-render-lab.html').read_text(encoding='utf-8')
    html=re.sub(r'  var PORTABLE_GLB = \{.*?\n  \};','  var PORTABLE_GLB = {};',html,count=1,flags=re.S)
    start=html.index('  // ================= V2.5 renderer lab')
    end=html.index('  // ================= boot',start)
    original=(ROOT/'prototypes/v2.5-city-runtime.js').read_text(encoding='utf-8')
    bridge=(ROOT/'prototypes/v2.5-corner-play-runtime.js').read_text(encoding='utf-8')
    data={p.stem:uri(p) for p in (ROOT/'assets/reference-corner').glob('*.glb')}
    legacy=ROOT/'assets/v2.5-city-kit'
    for name in ['la-bow-recurve-pov','la-hand-grip','la-hand-draw']:
        data[name]=uri(legacy/(name+'.glb'))
    # The gameplay runtime keeps its old lookup key; it now resolves to the
    # approved corner shambler rather than the former district actor.
    data['la-zombie-shambler-anime']=data.pop('la-corner-shambler')
    injected='  var V25_CORNER_GLB='+json.dumps(data)+';\n'+original+'\n'+bridge+'\n'
    html=html[:start]+injected+html[end:]
    html=html.replace('    buildGround();\n    buildBoundary();\n    buildPlatformAndRamps();\n    buildObstacles();\n    buildContainers();','    // The playable corner builds after renderer initialization.')
    html=html.replace('  installRendererLab();','  installCornerPlayable();')
    html=re.sub(r'\n    // first-person bow\n.*?\n    hctx.restore\(\);','',html,count=1,flags=re.S)
    html=re.sub(r"        if\(e.frameT>0.22\).*?\n",'        animateEnemy(e,dt);\n',html,count=1)
    arrow_start=html.index('    for(var a=arrows.length-1;a>=0;a--){',html.index('  function update(dt)'))
    arrow_end=html.index('    for(var p=particles.length-1;p>=0;p--){',arrow_start)
    html=html[:arrow_start]+'    updateCityArrows(dt);\n\n'+html[arrow_end:]
    html=html.replace('    scene.remove(e.sprite);\n    spawnBurst','    retireEnemy(e);\n    spawnBurst')
    html=html.replace('          scene.remove(e.sprite);\n          enemies.splice','          disposeCityActor(e);scene.remove(e.sprite);\n          enemies.splice')
    html=html.replace("fireBtn.addEventListener('pointercancel', releaseFireBtn);","fireBtn.addEventListener('pointercancel', function(){chargeActive=false;charge=0;fireBtn.classList.remove('pressed');});")
    html=html.replace("fireBtn.addEventListener('pointerleave', function(ev){ if(ev.pointerType==='touch') releaseFireBtn(); });",'// Pointer capture owns release; leaving does not fire.')
    html=html.replace("g.addColorStop(1,'rgba(0,0,0,.5)')","g.addColorStop(1,'rgba(0,0,0,.16)')")
    html=html.replace('    tex.anisotropy=renderer.capabilities.getMaxAnisotropy();','    tex.encoding=THREE.sRGBEncoding;tex.anisotropy=Math.min(4,renderer.capabilities.getMaxAnisotropy());')
    html=html.replace('Last Archer V2.5 — Renderer Lab','Last Archer V2.5 — The Last Corner')
    html=html.replace('lastArcher.v21.profile','lastArcher.v25.corner.profile').replace('lastArcher.highScore','lastArcher.v25.corner.highScore')
    html=html.replace('</style>',(ROOT/'prototypes/v2.5-city.css').read_text()+'\n</style>',1)
    target=ROOT/'prototypes/v2.5-corner-playable.html';target.write_text(html,encoding='utf-8')
    print(f'{target.name}: {target.stat().st_size/1024:.0f} KiB; {len(data)} embedded assets')

if __name__=='__main__':main()
