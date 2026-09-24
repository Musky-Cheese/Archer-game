// Explicit late assignments avoid function-hoisting collisions with V2.5.
var heroReset=resetGame;
resetGame=function(){heroReset();player.x=.2;player.z=13.6;player.h=0;yaw=.015;pitch=.035;heroWeapon.pull=0;};
var heroFit=fit;
fit=function(){heroFit();camera.fov=2*Math.atan(Math.tan(59*Math.PI/360)*Math.min(1,1.6/(W/H)))*180/Math.PI;camera.updateProjectionMatrix();};
addEventListener('resize',fit);
cityViews={corner:{x:.2,z:13.6,yaw:.015,pitch:.035},mart:{x:-1.3,z:9.5,yaw:.48,pitch:.06},street:{x:.2,z:7.5,yaw:0,pitch:.015},enemy:{x:.15,z:7.7,yaw:0,pitch:-.02}};
setCityView=function(name){var v=cityViews[name]||cityViews.corner;city.review=true;state=STATE_PAUSED;clearInput();pauseScreen.hidden=true;player.x=v.x;player.z=v.z;player.h=0;yaw=v.yaw;pitch=v.pitch;};
loadCityTemplates=function(){
 var keys=Object.keys(V26_GLB);city.requested=keys.length;
 return Promise.all(keys.map(key=>new Promise((resolve,reject)=>portableLoader.load(V26_GLB[key],g=>{
  g.scene.traverse(n=>{if(n.isMesh){n.castShadow=true;n.receiveShadow=true;n.material.flatShading=true;}});
  city.templates[key]=g;city.loaded++;resolve();
 },undefined,e=>{city.failed++;reject(e);}))))
};
var heroSpawn=spawnEnemy;
spawnEnemy=function(position){
 if(!city.ready)return;
 if(!position){const gates=[[-2.8,-30],[2.8,-28],[0,-19],[-3,14],[3,14]],eligible=gates.filter(p=>Math.hypot(p[0]-player.x,p[1]-player.z)>9&&!insideSolid(p[0],p[1],.65));position=eligible[Math.floor(Math.random()*eligible.length)]||[0,-30];}
 const e=heroSpawn(position);if(!e)return;
 // Preserve the original escalation even when the new street selects the gate.
 if(score>=60&&Math.random()<Math.min(.45,.15+wave*.05)){e.type='runner';e.speed=3.6+wave*.12;e.r=.55;e.actions.Walk.timeScale=1.7;e.sprite.scale.set(.9,.94,.9);}
 e.sprite.rotation.y=Math.atan2(e.x-player.x,e.z-player.z);
 return e;
};
placeContainer=function(c){
 const spots=[[-3.4,2],[3.4,-4],[-2.7,10],[3.1,-15],[-3.3,-23],[2.5,11],[-2.8,-10],[2.5,-29]],p=spots[containers.indexOf(c)%spots.length]||spots[0];
 c.x=p[0];c.z=p[1];c.y=0;c.active=true;c.respawnT=0;c.group.visible=true;c.group.position.set(c.x,.3,c.z);
};
retireEnemy=function(e){
 e.mixer.stopAllAction();const death=e.actions.Death;death.reset().setLoop(THREE.LoopOnce,1);death.clampWhenFinished=true;death.play();city.dead.push({e,age:0});
};
function installHeroSlice(){
 WORLD_HALF=39;obstacles=[];containers=[];scene.clear();state=STATE_PAUSED;
 startScreen.hidden=overScreen.hidden=pauseScreen.hidden=tutorialScreen.hidden=true;
 renderer.outputEncoding=THREE.sRGBEncoding;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.93;renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
 camera.fov=59;camera.updateProjectionMatrix();
 const panel=document.createElement('aside');panel.id='district-panel';panel.innerHTML='<div class="eyebrow">LAST ARCHER / V2.6</div><h2>NAKAMACHI</h2><p>After midnight. After everyone.<br>WASD to move · drag to look · hold fire to draw.</p><button id="district-play" disabled>Loading…</button><select id="district-view" aria-label="Review camera"><option value="corner">Street corner</option><option value="mart">Shuttered mart</option><option value="street">Down the street</option><option value="enemy">Shambler close-up</option></select><div class="status">Local visual preview</div>';document.body.appendChild(panel);
 for(const event of ['mousedown','mousemove'])panel.addEventListener(event,e=>e.stopPropagation());
 document.getElementById('district-play').addEventListener('click',playDistrict);document.getElementById('district-view').addEventListener('change',e=>setCityView(e.target.value));
 window.LastArcherV26={setView:setCityView,updateAd:(id,patch)=>heroWorld.updateAd(id,patch),getMetrics:()=>({ready:city.ready,assets:{requested:city.requested,loaded:city.loaded,failed:city.failed,placements:city.placements},solids:city.solids.length,state,player:{x:player.x,z:player.z},health:lives,wave,score,enemies:enemies.length,dead:city.dead.length,arrows:arrows.length,buffs:Object.keys(activeBuffs),render:cityRenderStats,memory:{geometries:renderer.info.memory.geometries,textures:renderer.info.memory.textures},charge,weapon:{draw:chargeActive,release:weaponRelease,pull:heroWeapon.pull},frames:city.frames.slice()})};
 if(new URLSearchParams(location.search).has('test'))window.LastArcherV26.test={
  play:()=>{profile.tutorialSeen=true;playDistrict();},spawn:position=>{const e=spawnEnemy(position);return e?{id:e.id,x:e.x,z:e.z}:null;},
  clearEnemies:()=>{enemies.forEach(e=>{disposeCityActor(e);scene.remove(e.sprite);});enemies=[];spawnTimer=999;},
  placePlayer:(x,z,angle)=>{player.x=x;player.z=z;yaw=angle||0;pitch=0;},
  aim:p=>{const dx=p[0]-player.x,dz=p[2]-player.z;yaw=Math.atan2(-dx,-dz);pitch=Math.atan2(p[1]-EYE_H,Math.hypot(dx,dz));},
  fire:()=>releaseShot(),step:dt=>update(dt),reset:()=>resetGame(),pickup:()=>{player.x=containers[0].x;player.z=containers[0].z;},paused:pauseGame,resume:resumeGame,
  draw:v=>{chargeActive=v>0;charge=v;},render:t=>render(t),wallPush:(x,z)=>{const p={x,z};pushOutOfObstacles(p,PLAYER_RADIUS);return p;},solidRay:(a,b)=>nearestCityHit(a,b,false),
  snapshot:()=>({solids:city.solids,pickups:containers.map(c=>({x:c.x,z:c.z,active:c.active,blocked:insideSolid(c.x,c.z,.4)})),actors:enemies.map(e=>({x:e.x,z:e.z,blocked:insideSolid(e.x,e.z,.25)})),death:city.dead.map(d=>({time:d.e.actions.Death.time,hips:d.e.sprite.getObjectByName('Hips').position.toArray()}))}),
  preview:()=>{resetGame();spawnEnemy([0,4.5]);spawnEnemy([-2,-4]);spawnEnemy([2,-7]);setCityView('corner');},bow:v=>{weaponRoot.visible=v;},
  assetAudit:()=>{const source=city.templates['la-zombie-shambler-anime'],root=cloneRig(source.scene),mixer=new THREE.AnimationMixer(root),clip=source.animations.find(a=>a.name==='Death'),action=mixer.clipAction(clip);action.setLoop(THREE.LoopOnce,1);action.clampWhenFinished=true;action.play();mixer.update(clip.duration);root.updateMatrixWorld(true);const bounds=new THREE.Box3(),v=new THREE.Vector3();root.traverse(n=>{if(n.isSkinnedMesh){n.skeleton.update();const p=n.geometry.attributes.position;for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i);n.boneTransform(i,v);v.applyMatrix4(n.matrixWorld);bounds.expandByPoint(v);}n.skeleton.dispose();}});mixer.stopAllAction();mixer.uncacheRoot(root);return {animations:source.animations.map(a=>a.name),deathBounds:{min:bounds.min.toArray(),max:bounds.max.toArray()}};}
 };
 loadCityTemplates().then(()=>{
  makeCityWorld();makeCityWeapon();city.ready=true;buildContainers();
  // Supply pickups retain all eight buffs in small, readable field cases.
  const caseTrim=new THREE.MeshStandardMaterial({color:cityColor(0x283239),roughness:.7}),caseLatch=new THREE.MeshStandardMaterial({color:cityColor(0x9c997e),roughness:.6});
  containers.forEach(c=>{c.mesh.scale.set(.76,.42,.50);c.mesh.material.color.copy(cityColor(c.type==='fleetFoot'?0x65715b:0x867351));c.mesh.material.emissive.convertSRGBToLinear();c.mesh.material.emissiveIntensity=.025;for(const x of [-.20,.20]){const band=new THREE.Mesh(new THREE.BoxGeometry(.045,.67,.67),caseTrim);band.position.x=x;c.mesh.add(band);}const handle=new THREE.Mesh(new THREE.BoxGeometry(.20,.065,.09),caseTrim);handle.position.y=.355;c.mesh.add(handle);const latch=new THREE.Mesh(new THREE.BoxGeometry(.075,.10,.028),caseLatch);latch.position.set(0,.17,.333);c.mesh.add(latch);const label=c.group.children[1];if(label){label.scale.set(.90,.225,1);label.position.y=.45;label.material.map.encoding=THREE.sRGBEncoding;}});
  resetGame();spawnEnemy([0,4.5]);spawnEnemy([-2,-4]);spawnEnemy([2,-7]);setCityView('corner');const b=document.getElementById('district-play');b.disabled=false;b.textContent='Enter street';fit();
 }).catch(e=>{console.error(e);panel.querySelector('.status').textContent='Could not load the street. Reload to retry.';});
}
