// Gameplay bridge for the approved reference corner. It deliberately reuses
// the V2.5 wave, pickup, health, restart and arrow systems around a new layout.

var cornerInheritedReset=resetGame;
resetGame=function(){
  cornerInheritedReset();
  player.x=.2;player.z=13.6;player.h=0;yaw=.015;pitch=.035;weaponRelease=0;
};
var cityViews={corner:{x:.2,z:13.6,yaw:.015,pitch:.035},mart:{x:-1.3,z:9.5,yaw:.48,pitch:.06},street:{x:.2,z:7.5,yaw:0,pitch:.015}};

function cornerMaterialize(source){
  var copy=source.clone(true);
  copy.traverse(function(n){
    if(!n.isMesh)return;
    n.castShadow=true;n.receiveShadow=true;
    var original=n.material,materials=Array.isArray(original)?original:[original];
    n.material=materials.map(function(m){
      var next=m.clone();next.flatShading=true;next.side=THREE.DoubleSide;
      if(n.geometry.attributes.color)next.vertexColors=true;
      next.needsUpdate=true;return next;
    });
    if(n.material.length===1)n.material=n.material[0];
  });
  return copy;
}
function loadCityTemplates(){
  var keys=Object.keys(V25_CORNER_GLB);city.requested=keys.length;
  return Promise.all(keys.map(function(key){return new Promise(function(resolve,reject){
    portableLoader.load(V25_CORNER_GLB[key],function(gltf){city.templates[key]=gltf;city.loaded++;resolve();},undefined,function(error){city.failed++;reject(error);});
  });}));
}
function placeCorner(key,x,z,angle,solid,y,scale){
  var model=cornerMaterialize(city.templates[key].scene);model.name='CORNER_'+key.toUpperCase();model.position.set(x,y||0,z);model.rotation.y=angle||0;
  if(scale)model.scale.setScalar(scale);scene.add(model);model.updateWorldMatrix(true,true);
  var bounds=new THREE.Box3().setFromObject(model);model.position.y-=(bounds.min.y-(y||0));model.updateWorldMatrix(true,true);bounds.setFromObject(model);
  city.grounded.push({name:key,minY:bounds.min.y});city.placements++;
  if(solid)addCitySolid(model);return model;
}
function cornerLamp(x,z,side){
  var lamp=placeCorner('la-street-lamp',x,z,side<0?Math.PI:0,true);
  var warm=new THREE.PointLight(0xffbd7b,1.25,7,1.5);warm.position.set(x+side*.8,5.3,z);scene.add(warm);
  lampPool(x+side*.65,z);return lamp;
}
function cornerWindow(x,y,z,angle,scale){return placeCorner('la-window',x,z,angle,false,y,scale||1);}
function cornerBalcony(x,y,z,angle){return placeCorner('la-balcony',x,z,angle,false,y);}
function cornerBox(parent,size,pos,color,solid){return cityBox(parent,size,pos,color,solid);}
function cornerRoad(){
  scene.background=new THREE.Color(0x081421);scene.fog=new THREE.FogExp2(0x0c1b28,.026);
  scene.add(new THREE.HemisphereLight(0x7b9bbb,0x20282e,.38));
  var moon=new THREE.DirectionalLight(0x92b4d4,.46);moon.position.set(-13,24,10);scene.add(moon);
  var fill=new THREE.DirectionalLight(0x54779b,.16);fill.position.set(11,9,-17);scene.add(fill);
  cornerBox(scene,[42,.11,78],[0,-.055,-22],0x263542,false);
  [-1,1].forEach(function(side){
    cornerBox(scene,[3.3,.15,67],[side*6.3,.06,-19],0x687279,false);
    for(var z=14;z>-54;z-=1.3)cornerBox(scene,[.28,.22,1.23],[side*4.75,.10,z],0x81847d,false);
    for(var zz=12;zz>-49;zz-=2.5)cornerBox(scene,[2.7,.01,.03],[side*6.3,.15,zz],0x37424a,false);
  });
  for(var x=-4.1;x<=4.1;x+=1.08)cornerBox(scene,[.64,.009,2.05],[x,.003,6],0xb7b5a3,false);
  for(var dash=1;dash>-53;dash-=5)cornerBox(scene,[.07,.008,2.5],[0,.002,dash],0x86734f,false);
}
function addCornerDetail(){
  // The two near blocks replicate the approved composition; receding blocks
  // create a fighting street while leaving the centre clear.
  placeCorner('la-mart-shell',-8.25,0,0,true);
  placeCorner('la-mart-shell',8.25,-4,Math.PI,true);
  placeCorner('la-mart-shell',-8.5,-12,0,true,.0,.92);
  placeCorner('la-mart-shell',8.5,-15,Math.PI,true,.0,.92);
  placeCorner('la-mart-shell',-8.6,-25,0,true,.0,.78);
  placeCorner('la-mart-shell',8.6,-27,Math.PI,true,.0,.78);
  [-2.35,.8].forEach(function(dx){[4.65,7.75,10.85].forEach(function(y){cornerWindow(-8.25+dx,y,.12,0);cornerWindow(8.25-dx,y,-4.12,Math.PI);});});
  [3.35,6.45].forEach(function(y){cornerBalcony(-9.35,y,.3,0);cornerBalcony(9.35,y,-4.3,Math.PI);});
  [-5.0,5.0].forEach(function(x){[-4.3,-16].forEach(function(z){var g=new THREE.Group();g.position.set(x,0,z);scene.add(g);cornerBox(g,[.16,5,.16],[0,2.5,0],0x4c5558,true);cornerBox(g,[.62,.7,.34],[.15,3.6,.11],0x8b8c7d,false);});});
  cornerLamp(-4.15,1.2,1);cornerLamp(4.4,-4,-1);cornerLamp(-4.5,-15,1);cornerLamp(4.6,-26,-1);cornerLamp(-4.7,-38,1);
  placeCorner('la-dumpster',-4.95,-3.2,.08,true);placeCorner('la-dumpster',6.4,-6.9,Math.PI/2,true);
  placeCorner('la-refuse-bags',-6.1,.4,0,false);placeCorner('la-refuse-bags',5.1,-8,0,false);
  var vend=placeCorner('la-vending',-10.25,.72,0,true);adFace(vend,'VENDING_01',.67,.21,0,2.08,.49);
  var car=placeCorner('la-abandoned-sedan',-5.65,7.0,-.6,true);
  var board=placeCorner('la-billboard',7.25,-3.7,0,true);adFace(board,'BILLBOARD_01',5.0,2.55,0,8.9,.125);
  // A little solid cover makes aiming and route choice meaningful.
  var crate=new THREE.Group();crate.position.set(3.5,0,-.6);scene.add(crate);cornerBox(crate,[1.5,1.18,1.35],[0,.59,0],0x806044,true);adFace(crate,'CRATE_SPONSOR',1.18,.50,0,.76,.68);
  var barricade=new THREE.Group();barricade.position.set(-3.1,0,-5.2);barricade.rotation.y=.12;scene.add(barricade);cornerBox(barricade,[3.2,1.0,.34],[0,.5,0],0x384650,true);adFace(barricade,'BARRICADE_SPONSOR',2.8,.52,0,.62,.19);
  // Physical street signs and traffic light give the route a readable end point.
  var pole=new THREE.Group();pole.position.set(-4.52,0,-2.2);scene.add(pole);cornerBox(pole,[.13,13.9,.13],[0,6.95,0],0x605d50,true);cornerBox(pole,[4.0,.08,.08],[2,6.2,0],0x4b565c,false);cornerBox(pole,[.45,.92,.3],[3.65,5.65,0],0x171e26,false);adFace(pole,'ROAD_SIGN_01',1.7,.52,2.12,5.85,.15);
  // High dark silhouettes close the horizon without producing floating scenery.
  [-17,-10,-3,4,11,18].forEach(function(x,i){cornerBox(scene,[5.4,14+(i%3)*2,6.5],[x,7+(i%3),-49],0x152434,false);});
}
function makeCityWorld(){
  cornerRoad();addCornerDetail();
  obstacles=city.solids;
}
function retireEnemy(e){
  if(e.actions.Walk)e.actions.Walk.stop();e.sprite.rotation.z=(e.side||1)*1.38;e.sprite.position.y=.08;city.dead.push({e:e,age:0});
}
function spawnEnemy(position){
  if(!city.ready)return;var sx,sz,runner=score>=60&&Math.random()<Math.min(.38,.12+wave*.04);
  if(position){sx=position[0];sz=position[1];runner=false;}else{
    var gates=[[-3,-13],[3,-15],[-3,-31],[3,-33],[-3,14],[3,14]],choices=gates.filter(function(p){return Math.hypot(p[0]-player.x,p[1]-player.z)>8&&!insideSolid(p[0],p[1],.65);});
    var p=choices[Math.floor(Math.random()*choices.length)]||gates[0];sx=p[0];sz=p[1];
  }
  var gltf=city.templates['la-zombie-shambler-anime'],model=cloneRig(gltf.scene);model.position.set(sx,0,sz);if(runner)model.scale.set(.89,.92,.89);scene.add(model);
  var mixer=new THREE.AnimationMixer(model),actions={};gltf.animations.forEach(function(clip){actions[clip.name]=mixer.clipAction(clip);});if(actions.Walk)actions.Walk.play();
  if(runner&&actions.Walk)actions.Walk.timeScale=1.55;
  var e={id:nextId++,x:sx,z:sz,speed:runner?(3.35+Math.random()*.7+wave*.10):(1.62+Math.random()*.58+wave*.08),type:runner?'runner':'shambler',r:runner?.50:.62,seed:Math.random()*100,frame:0,frameT:0,sprite:model,alive:true,mixer:mixer,actions:actions,side:Math.random()>.5?1:-1};enemies.push(e);return e;
}
function setCityView(name){var v=cityViews[name]||cityViews.corner;city.review=true;state=STATE_PAUSED;clearInput();pauseScreen.hidden=true;player.x=v.x;player.z=v.z;player.h=0;yaw=v.yaw;pitch=v.pitch;}
function installCornerPlayable(){
  WORLD_HALF=20;obstacles=[];containers=[];scene.clear();state=STATE_PAUSED;
  startScreen.hidden=overScreen.hidden=pauseScreen.hidden=tutorialScreen.hidden=true;
  renderer.outputEncoding=THREE.sRGBEncoding;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.88;
  var panel=document.createElement('aside');panel.id='district-panel';panel.innerHTML='<div class="eyebrow">LAST ARCHER / V2.5</div><h2>THE LAST CORNER</h2><p>The approved night street is now live.<br>Hold fire, move, and hold the line.</p><button id="district-play" disabled>Loading…</button><select id="district-view" aria-label="Review camera"><option value="corner">Street corner</option><option value="mart">Shuttered mart</option><option value="street">Down the street</option></select><div class="status">Local playable preview · no deployment</div>';document.body.appendChild(panel);
  panel.addEventListener('mousedown',function(e){e.stopPropagation();});panel.addEventListener('mousemove',function(e){e.stopPropagation();});
  document.getElementById('district-play').addEventListener('click',playDistrict);document.getElementById('district-view').addEventListener('change',function(e){setCityView(e.target.value);});
  window.LastArcherCorner={getMetrics:function(){return {ready:city.ready,assets:{requested:city.requested,loaded:city.loaded,failed:city.failed,placements:city.placements},solids:city.solids.length,state:state,player:{x:player.x,z:player.z},health:lives,wave:wave,score:score,enemies:enemies.length,arrows:arrows.length,buffs:Object.keys(activeBuffs),render:cityRenderStats,memory:{geometries:renderer.info.memory.geometries,textures:renderer.info.memory.textures},weapon:{foreground:!!weaponScene,draw:chargeActive,release:weaponRelease},charge:charge};},setView:setCityView};
  if(new URLSearchParams(location.search).has('test'))window.LastArcherCorner.test={play:function(){profile.tutorialSeen=true;playDistrict();},spawn:spawnEnemy,clearEnemies:function(){enemies.forEach(function(e){disposeCityActor(e);scene.remove(e.sprite);});enemies=[];spawnTimer=999;},placePlayer:function(x,z,angle){player.x=x;player.z=z;yaw=angle||0;pitch=0;},aim:function(p){var dx=p[0]-player.x,dz=p[2]-player.z;yaw=Math.atan2(-dx,-dz);pitch=Math.atan2(p[1]-EYE_H,Math.hypot(dx,dz));},fire:function(){releaseShot();},step:function(dt){update(dt);},reset:resetGame,pickup:function(){player.x=containers[0].x;player.z=containers[0].z;},paused:pauseGame,resume:resumeGame,draw:function(v){chargeActive=v>0;charge=v;},render:render,wallPush:function(x,z){var p={x:x,z:z};pushOutOfObstacles(p,PLAYER_RADIUS);return p;},preview:function(){resetGame();spawnEnemy([0,4.5]);spawnEnemy([-2,-4]);spawnEnemy([2,-7]);setCityView('corner');}};
  loadCityTemplates().then(function(){makeCityWorld();makeCityWeapon();city.ready=true;buildContainers();containers.forEach(function(c){c.mesh.scale.setScalar(.65);c.mesh.material.color.convertSRGBToLinear();c.mesh.material.emissive.convertSRGBToLinear();c.mesh.material.emissiveIntensity=.16;var label=c.group.children[1];if(label)label.visible=false;});resetGame();spawnEnemy([0,4.5]);spawnEnemy([-2,-4]);spawnEnemy([2,-7]);setCityView('corner');var b=document.getElementById('district-play');b.disabled=false;b.textContent='Enter district';fit();}).catch(function(error){console.error(error);panel.querySelector('.status').id='city-load-error';panel.querySelector('.status').textContent='Could not load the corner. Reload to retry.';});
}
