"""Build the offline V2.5 playable city-block review from the render lab.

The generated HTML embeds the small, individual GLBs so it can be opened from
the filesystem without a local server.  The source lab remains unchanged.
"""
from __future__ import annotations

import base64
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "prototypes" / "v2.5-render-lab.html"
OUTPUT = ROOT / "prototypes" / "v2.5-anime-city-block.html"
KIT = ROOT / "assets" / "v2.5-city-kit"


def data_uri(path: Path) -> str:
    return "data:model/gltf-binary;base64," + base64.b64encode(path.read_bytes()).decode("ascii")


def main() -> None:
    html = SOURCE.read_text(encoding="utf-8")
    assets = {path.stem: data_uri(path) for path in sorted(KIT.glob("*.glb"))}
    asset_json = json.dumps(assets, separators=(",", ":"))
    # The lab's old environment remains a source reference, but it must not
    # initialize inside this focused 32m city-block preview.
    html = html.replace("buildPortableAssetLayer();", "if (!window.__V25_CITY_BLOCK__) buildPortableAssetLayer();")
    # Stage 5 replaces the old canvas bow with a correctly camera-attached 3D bow.
    html = re.sub(r"\n    // first-person bow\n.*?\n    hctx\.restore\(\);", "\n    // V2.5 renders the bow as a camera-attached 3D asset.", html, count=1, flags=re.S)
    marker = "  // ================= boot ================="
    assert marker in html, "render lab boot marker changed"
    injection = f'''  // ================= V2.5 anime city block =================
  // This is a local review build. The same independent GLBs can be used in a
  // normal Three.js loader later; embedding here only makes file:// review work.
  window.__V25_CITY_BLOCK__=true;
  var V25_CITY_GLB={asset_json};
  var v25City={{requested:0,loaded:0,failed:0,colliders:0,shamblers:0}};
  var v25Shamblers=[], v25Bow=null, v25Arrow=null, v25String=null, v25BowOffset=new THREE.Vector3(.30,-.28,-.75);
  window.LastArcherV25={{assetStatus:v25City, adSlots:AD_SLOTS}};

  function installV25CityBlock(){{
    // Remove the lab world after its renderer has been created; retain camera.
    scene.children.slice().forEach(function(child){{if(child!==camera)scene.remove(child);}});
    obstacles.length=0; WORLD_HALF=16;
    regionAt=function(){{return {{region:'ground',h:0}};}};
    startScreen.hidden=true; overScreen.hidden=true; pauseScreen.hidden=true; tutorialScreen.hidden=true;
    var oldPanel=document.getElementById('renderer-lab');if(oldPanel)oldPanel.remove();
    var cityPanel=document.createElement('aside');cityPanel.id='city-block-panel';
    cityPanel.innerHTML='<strong>V2.5 · ANIME CITY BLOCK</strong><span id="city-load">Loading 9 portable assets…</span><small>WASD to move · click and hold to draw · release to fire</small>';
    document.body.appendChild(cityPanel);

    renderer.outputColorSpace=THREE.SRGBColorSpace; renderer.toneMapping=THREE.ReinhardToneMapping;renderer.toneMappingExposure=.84;
    scene.background=new THREE.Color(0x070b12);scene.fog=new THREE.FogExp2(0x070b12,.045);
    var hemi=new THREE.HemisphereLight(0x36506c,0x10151b,1.0);scene.add(hemi);
    var moon=new THREE.DirectionalLight(0x9eb8d6,1.25);moon.position.set(-8,13,5);scene.add(moon);
    var warm=new THREE.PointLight(0xe5a957,5,16,2);warm.position.set(-5,4,-4);scene.add(warm);

    var floor=new THREE.Mesh(new THREE.PlaneGeometry(32,32),new THREE.MeshToonMaterial({{color:0x171f2a,gradientMap:makeLabGradient()}}));floor.rotation.x=-Math.PI/2;floor.position.y=-.02;scene.add(floor);
    function cityBox(parent,w,h,d,x,y,z,color){{var mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),new THREE.MeshToonMaterial({{color:color,gradientMap:makeLabGradient()}}));mesh.position.set(x,y,z);parent.add(mesh);return mesh;}}
    function cityCollider(x,z,r,type){{obstacles.push({{x:x,z:z,r:r,type:type||'city'}});v25City.colliders++;}}
    function cityAdBoard(x,z,rotation,id,w,h,top){{
      var g=new THREE.Group();g.position.set(x,0,z);g.rotation.y=rotation||0;g.name='CITY_AD_'+id;
      cityBox(g,w+.3,h+.3,.22,0,top,0,0x1b242d);adFace(g,id,w,h,0,top,.125);adFace(g,id,w,h,0,top,-.125,Math.PI);
      [-w*.32,w*.32].forEach(function(px){{cityBox(g,.18,top,.18,px,top/2,0,0x3d4851);var p=new THREE.Vector3(px,0,0);g.localToWorld(p);cityCollider(p.x,p.z,.28,'ad-'+id);}});scene.add(g);
    }}
    function loadCity(key,x,z,rotation,scale,radius,after){{
      v25City.requested++;
      portableLoader.load(V25_CITY_GLB[key],function(gltf){{
        var model=gltf.scene;model.name='V25_'+key.toUpperCase();model.position.set(x,0,z);model.rotation.y=rotation||0;model.scale.setScalar(scale||1);
        model.traverse(function(node){{if(node.isMesh){{node.castShadow=false;node.receiveShadow=false;node.material.flatShading=true;node.material.needsUpdate=true;}}}});
        scene.add(model);if(radius)cityCollider(x,z,radius,key);v25City.loaded++;if(after)after(model);updateCityStatus();
      }},undefined,function(error){{v25City.failed++;console.error('V2.5 asset failed',key,error);updateCityStatus();}});
    }}
    function updateCityStatus(){{var el=document.getElementById('city-load');if(el)el.textContent='Assets '+v25City.loaded+'/'+v25City.requested+(v25City.failed?' · '+v25City.failed+' failed':'')+' · '+v25City.colliders+' solid surfaces';}}

    // 32 × 32 metre playable intersection: each GLB retains its own pivot.
    [[-8,-8],[8,-8],[-8,8],[8,8]].forEach(function(p){{loadCity('la-city-intersection-road',p[0],p[1],0,1,0);}});
    [[-12,-11,0],[-4,-15,0],[4,-15,0],[12,-11,0]].forEach(function(p){{loadCity('la-city-storefront-facade',p[0],p[1],p[2],1,3.7);}});
    loadCity('la-city-corner-facade',11,10,Math.PI,1,4.7);
    loadCity('la-city-alley-wall',-11,10,Math.PI,1,3.2);
    [[-12,-7,0],[12,-7,Math.PI],[-7,12,Math.PI/2],[7,12,-Math.PI/2]].forEach(function(p){{loadCity('la-city-sidewalk-curb',p[0],p[1],p[2],1,0);}});
    [[-13,-12,0],[-13,4,0],[13,-12,Math.PI],[13,4,Math.PI]].forEach(function(p){{loadCity('la-city-streetlight-anime',p[0],p[1],p[2],1,.35);}});
    [[-8,7,.35],[9,7,-.5],[-6,-3,.1]].forEach(function(p){{loadCity('la-city-dumpster-anime',p[0],p[1],p[2],1,1.25);}});
    cityAdBoard(-8,-10,0,'BILLBOARD_01',6,3,5.6);
    cityAdBoard(8,-10,Math.PI,'BILLBOARD_02',5.4,2.7,5.0);
    cityAdBoard(10,6,-Math.PI/2,'ROAD_SIGN_01',4.7,1.9,4.4);
    var poster=new THREE.Group();poster.position.set(-10,0,8);poster.rotation.y=Math.PI/2;cityBox(poster,5.5,4.1,.22,0,3,0,0x29323c);adFace(poster,'WALL_AD_01',4.9,3.25,0,3,.13);scene.add(poster);cityCollider(-10,8,2.8,'wall-ad');
    var crate=new THREE.Group();crate.position.set(4,0,5);cityBox(crate,2.2,1.7,2.2,0,.85,0,0x69462d);adFace(crate,'CRATE_SPONSOR',1.8,.82,0,.95,1.11);scene.add(crate);cityCollider(4,5,1.5,'crate');
    var bunker=new THREE.Group();bunker.position.set(-2,0,-3);cityBox(bunker,4.2,1.3,.4,0,.65,0,0x4a3b2e);adFace(bunker,'BARRICADE_SPONSOR',3.7,.6,0,.77,.22);scene.add(bunker);cityCollider(-2,-3,2.25,'barricade');
    var vending=new THREE.Group();vending.position.set(7,0,1);cityBox(vending,1.55,2.8,.9,0,1.4,0,0x315848);adFace(vending,'VENDING_01',1.25,.72,0,2.13,.47);scene.add(vending);cityCollider(7,1,.92,'vending');

    [[-4,5],[3,8],[7,4]].forEach(function(p){{loadCity('la-zombie-shambler-anime',p[0],p[1],Math.PI,1,.68,function(model){{model.userData.baseY=0;v25Shamblers.push(model);v25City.shamblers=v25Shamblers.length;}});}});
    loadCity('la-bow-recurve-pov',0,0,0,.48,0,function(model){{
      scene.remove(model);model.traverse(function(node){{if(node.isMesh){{node.material=new THREE.MeshBasicMaterial({{color:0xe0a458,depthTest:false}});node.frustumCulled=false;node.renderOrder=999;}}}});v25Bow=model;v25Bow.name='V25_CAMERA_RECURVE_BOW';scene.add(v25Bow);
      v25Arrow=new THREE.Mesh(new THREE.CylinderGeometry(.011,.011,.68,5),new THREE.MeshBasicMaterial({{color:0xece2ce}}));v25Arrow.rotation.x=Math.PI/2;v25Arrow.position.set(-.075,.33,-.28);v25Bow.add(v25Arrow);
      var geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(new Float32Array(9),3));v25String=new THREE.Line(geo,new THREE.LineBasicMaterial({{color:0xd8cfb9}}));v25Bow.add(v25String);
    }});

    player.x=0;player.z=11;yaw=0;pitch=-.02;state=STATE_PLAY;spawnTimer=2.2;
    window.LastArcherV25.getMetrics=function(){{return {{assets:Object.assign({{}},v25City),bowAttached:!!v25Bow&&v25Bow.parent===scene,render:{{calls:renderer.info.render.calls,triangles:renderer.info.render.triangles}}}};}};
    updateCityStatus();
  }}
  function updateV25View(t){{
    v25Shamblers.forEach(function(model,index){{model.position.y=Math.sin(t*2.2+index)*.035;model.rotation.z=Math.sin(t*1.4+index)*.035;}});
    if(!v25Bow)return;
    v25Bow.position.copy(camera.position).add(v25BowOffset.clone().applyQuaternion(camera.quaternion));v25Bow.quaternion.copy(camera.quaternion);v25Bow.rotateY(Math.PI);
    var pull=chargeActive?charge*.32:0;
    v25Bow.rotation.z=-.08+Math.sin(t*1.5)*.008;v25Arrow.position.z=-.28+pull;
    var positions=v25String.geometry.attributes.position.array;
    positions[0]=-.085;positions[1]=.07;positions[2]=.015;positions[3]=-.075;positions[4]=.33;positions[5]=pull;positions[6]=-.085;positions[7]=.62;positions[8]=.015;v25String.geometry.attributes.position.needsUpdate=true;
  }}
  var v25BaseRender=render;
  render=function(t){{camera.rotation.set(pitch,yaw,0);camera.position.set(player.x,player.h+EYE_H,player.z);camera.updateMatrixWorld(true);updateV25View(t);v25BaseRender(t);}};

'''
    html = html.replace(marker, injection + marker)
    html = html.replace("  installRendererLab();\n  requestAnimationFrame(frame);", "  installRendererLab();\n  installV25CityBlock();\n  requestAnimationFrame(frame);")
    # Tight visual panel lives in this review page only.
    html = html.replace("</style>", "#city-block-panel{position:fixed;left:18px;bottom:18px;z-index:20;display:grid;gap:4px;max-width:290px;padding:11px 13px;border:1px solid rgba(224,164,88,.45);background:rgba(7,11,18,.84);color:#e8dfcc;font:12px/1.35 ui-monospace,monospace;letter-spacing:.04em;pointer-events:none}#city-block-panel strong{color:#e0a458;font-size:12px}#city-block-panel small{color:#aeb8bd;font-size:10px;letter-spacing:0}\n</style>", 1)
    OUTPUT.write_text(html, encoding="utf-8")
    print(f"Wrote {OUTPUT} ({OUTPUT.stat().st_size / 1024 / 1024:.2f} MB, {len(assets)} embedded GLBs)")


if __name__ == "__main__":
    main()
