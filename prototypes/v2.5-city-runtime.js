  // Stage 8 district integration. This is injected inside the baseline closure.
  var city={ready:false,loaded:0,failed:0,requested:0,placements:0,templates:{},solids:[],grounded:[],dead:[],frames:[],review:true};
  var cityGradient=new THREE.DataTexture(new Uint8Array([82,157,255]),3,1,THREE.LuminanceFormat);
  cityGradient.magFilter=cityGradient.minFilter=THREE.NearestFilter;cityGradient.needsUpdate=true;
  var cityMatCache={},cityOpaque=[],cityBoxGeo=new THREE.BoxGeometry(1,1,1);
  var weaponScene,weaponCamera,weaponRoot,weaponBow,weaponString,weaponArrow,gripHand,drawHand;
  var weaponRelease=0,cityClock=0,previousCityTime=0,cityRenderStats={calls:0,triangles:0};
  var cityTmp=new THREE.Vector3(),cityRay=new THREE.Raycaster();
  var cityBaseReset=resetGame,cityBaseStart=startGame,cityBaseRelease=releaseShot;
  var cityViews={intersection:{x:1,z:11,yaw:.06,pitch:.025},alley:{x:-8,z:6,yaw:0,pitch:.035},close:{x:-2,z:1.8,yaw:0,pitch:-.025}};

  function cityColor(hex){return new THREE.Color(hex).convertSRGBToLinear();}
  function cityMaterial(hex){
    if(!cityMatCache[hex])cityMatCache[hex]=new THREE.MeshToonMaterial({color:cityColor(hex),gradientMap:cityGradient,flatShading:true});
    return cityMatCache[hex];
  }
  function cityBox(parent,size,pos,color,collide){
    var m=new THREE.Mesh(cityBoxGeo,cityMaterial(color));m.scale.set(size[0],size[1],size[2]);m.position.set(pos[0],pos[1],pos[2]);parent.add(m);
    cityOpaque.push(m);if(collide)addCitySolid(m);return m;
  }
  function addCitySolid(object){
    object.updateWorldMatrix(true,true);var b=new THREE.Box3().setFromObject(object);
    city.solids.push({x0:b.min.x,x1:b.max.x,z0:b.min.z,z1:b.max.z,y0:b.min.y,y1:b.max.y});
  }
  function cloneRig(source){
    var copy=source.clone(true),map=new Map();
    function pair(a,b){map.set(a,b);for(var i=0;i<a.children.length;i++)pair(a.children[i],b.children[i]);}pair(source,copy);
    source.traverse(function(n){if(n.isSkinnedMesh){var target=map.get(n);target.skeleton=new THREE.Skeleton(n.skeleton.bones.map(function(b){return map.get(b);}),n.skeleton.boneInverses);target.bind(target.skeleton,n.bindMatrix);target.frustumCulled=false;}});
    return copy;
  }
  function loadCityTemplates(){
    var keys=Object.keys(V25_CITY_GLB);city.requested=keys.length;
    return Promise.all(keys.map(function(key){return new Promise(function(resolve,reject){
      portableLoader.load(V25_CITY_GLB[key],function(gltf){
        gltf.scene.traverse(function(n){if(!n.isMesh)return;
          var original=n.material,key=original.uuid;
          if(!cityMatCache[key])cityMatCache[key]=new THREE.MeshToonMaterial({color:original.color.clone(),vertexColors:!!n.geometry.attributes.color,skinning:!!n.isSkinnedMesh,flatShading:true,gradientMap:cityGradient,side:THREE.DoubleSide});
          n.material=cityMatCache[key];
        });city.templates[key]=gltf;city.loaded++;resolve();
      },undefined,function(error){city.failed++;reject(error);});
    });}));
  }
  function placeCity(key,x,z,angle,solid){
    var m=city.templates[key].scene.clone(true);m.position.set(x,0,z);m.rotation.y=angle||0;scene.add(m);m.updateWorldMatrix(true,true);
    var b=new THREE.Box3().setFromObject(m);
    // Imported assets are grounded by their measured lower bound, never by
    // accidentally using the map's Z coordinate as height.
    m.position.y-=b.min.y;m.updateWorldMatrix(true,true);b.setFromObject(m);
    city.grounded.push({name:key,minY:b.min.y});city.placements++;
    if(solid)addCitySolid(m);
    m.traverse(function(n){if(n.isMesh)cityOpaque.push(n);});return m;
  }
  function mergeCityOpaque(){
    var p=[],n=[],c=[];var normalMatrix=new THREE.Matrix3(),v=new THREE.Vector3(),normal=new THREE.Vector3();
    cityOpaque.forEach(function(mesh){
      mesh.updateWorldMatrix(true,false);var g=mesh.geometry.index?mesh.geometry.toNonIndexed():mesh.geometry;
      var pos=g.attributes.position,norm=g.attributes.normal,col=g.attributes.color,base=mesh.material.color;
      normalMatrix.getNormalMatrix(mesh.matrixWorld);
      for(var i=0;i<pos.count;i++){
        v.fromBufferAttribute(pos,i).applyMatrix4(mesh.matrixWorld);normal.fromBufferAttribute(norm,i).applyMatrix3(normalMatrix).normalize();
        p.push(v.x,v.y,v.z);n.push(normal.x,normal.y,normal.z);
        c.push(base.r*(col?col.getX(i):1),base.g*(col?col.getY(i):1),base.b*(col?col.getZ(i):1));
      }
      mesh.visible=false;if(g!==mesh.geometry)g.dispose();
    });
    var g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(n,3));g.setAttribute('color',new THREE.Float32BufferAttribute(c,3));g.computeBoundingSphere();
    var mesh=new THREE.Mesh(g,new THREE.MeshToonMaterial({color:0xffffff,vertexColors:true,gradientMap:cityGradient,flatShading:true,side:THREE.DoubleSide}));mesh.name='DISTRICT_STATIC_BATCH';scene.add(mesh);
  }
  function signBoard(x,z,id,w,h,height,angle){
    var g=new THREE.Group();g.position.set(x,0,z);g.rotation.y=angle||0;scene.add(g);
    cityBox(g,[w+.18,h+.18,.22],[0,height,0],0x202a34,true);
    [-w*.32,w*.32].forEach(function(a){cityBox(g,[.14,height,.14],[a,height/2,0],0x384650,true);});
    adFace(g,id,w,h,0,height,.121);adFace(g,id,w,h,0,height,-.121,Math.PI);
  }
  function lampPool(x,z){
    var cv=document.createElement('canvas');cv.width=cv.height=64;var ctx=cv.getContext('2d');var gradient=ctx.createRadialGradient(32,32,1,32,32,32);
    gradient.addColorStop(0,'rgba(214,154,74,.15)');gradient.addColorStop(1,'rgba(214,154,74,0)');ctx.fillStyle=gradient;ctx.fillRect(0,0,64,64);
    var tex=new THREE.CanvasTexture(cv);tex.encoding=THREE.sRGBEncoding;
    var m=new THREE.Mesh(new THREE.PlaneGeometry(6,6),new THREE.MeshBasicMaterial({map:tex,transparent:true,depthWrite:false}));m.rotation.x=-Math.PI/2;m.position.set(x,.014,z);scene.add(m);
  }
  function makeCityWorld(){
    scene.background=new THREE.Color(0x080d16);scene.fog=new THREE.Fog(0x080d16,18,57);
    scene.add(new THREE.HemisphereLight(0x91abc5,0x343b42,.40));
    var key=new THREE.DirectionalLight(0xffd5a0,.95);key.position.set(-8,14,8);scene.add(key);
    var rim=new THREE.DirectionalLight(0x668fc1,.28);rim.position.set(10,8,-12);scene.add(rim);
    cityBox(scene,[34,.10,34],[0,-.05,0],0x202a34,false);
    // Four north blocks and two street walls leave a cross-shaped route and
    // a traversable alley along the west edge of the cover islands.
    [-12,-4,4,12].forEach(function(x){placeCity('la-city-storefront-facade',x,-16,Math.PI,true);});
    [-7,3,13].forEach(function(z){placeCity('la-city-corner-facade',-15.5,z,-Math.PI/2,true);placeCity('la-city-storefront-facade',15.5,z,Math.PI/2,true);});
    [-12,-4,4,12].forEach(function(x){cityBox(scene,[8,.14,2.2],[x,.07,-12.2],0x384650,false);});
    [-1,1].forEach(function(s){cityBox(scene,[2.2,.14,27],[s*11.8,.07,1.7],0x384650,false);});
    for(var z=-11;z<16;z+=4)cityBox(scene,[.09,.012,1.7],[0,.006,z],0x877f6b,false);
    for(var x=-4;x<=4;x+=1.15){cityBox(scene,[.65,.012,2.25],[x,.007,-8.6],0x877f6b,false);cityBox(scene,[.65,.012,2.25],[x,.007,5.8],0x877f6b,false);}
    [-10.8,10.8].forEach(function(x){[-10,6].forEach(function(z){placeCity('la-city-streetlight-anime',x,z,x>0?Math.PI:0,true);lampPool(x*.86,z);});});
    placeCity('la-city-dumpster-anime',-8,1,Math.PI*.06,true);placeCity('la-city-dumpster-anime',8,-5,Math.PI,true);
    // Utility pipes and air-conditioning silhouettes on the street walls.
    [-1,1].forEach(function(s){[-4,6].forEach(function(z){cityBox(scene,[.16,5,.16],[s*12.75,2.5,z],0x29343f,true);cityBox(scene,[.6,.75,1.2],[s*12.5,3.8,z+1.8],0x384650,false);});});
    signBoard(-6,-11,'BILLBOARD_01',5.6,2.4,5.0,0);
    signBoard(7,-11,'BILLBOARD_02',4.0,1.8,4.4,-.08);
    signBoard(10,10,'ROAD_SIGN_01',3.6,1.55,3.9,-Math.PI/2);
    var wall=new THREE.Group();wall.position.set(-12.7,0,4);wall.rotation.y=Math.PI/2;scene.add(wall);adFace(wall,'WALL_AD_01',3.9,2.3,0,2.6,.03);
    var vending=new THREE.Group();vending.position.set(10.4,0,-5.6);scene.add(vending);
    cityBox(vending,[1.3,2.3,.9],[0,1.15,0],0x354d43,true);adFace(vending,'VENDING_01',1.15,.57,0,1.92,.46);
    cityBox(vending,[.8,1.05,.06],[-.13,1.03,.48],0x111f27,false);
    for(var row=0;row<3;row++)for(var col=0;col<3;col++)cityBox(vending,[.14,.20,.06],[-.38+col*.25,.7+row*.29,.525],0x92ac62,false);
    cityBox(vending,[.18,.18,.08],[.49,1.04,.48],0xd69a4a,false);
    var crate=new THREE.Group();crate.position.set(5,0,1.2);scene.add(crate);
    cityBox(crate,[1.65,1.25,1.4],[0,.625,0],0x806044,true);[-.63,.63].forEach(function(x){cityBox(crate,[.12,1.3,1.44],[x,.65,0],0x384650,false);});adFace(crate,'CRATE_SPONSOR',1.2,.55,0,.75,.711);
    var barricade=new THREE.Group();barricade.position.set(-4,0,-3.7);barricade.rotation.y=.12;scene.add(barricade);
    cityBox(barricade,[3.5,1.1,.38],[0,.55,0],0x384650,true);[-1.25,1.25].forEach(function(x){cityBox(barricade,[.25,.18,1.2],[x,.09,0],0x29343f,true);});adFace(barricade,'BARRICADE_SPONSOR',3.1,.63,0,.68,.205);
    // A compact abandoned sedan, kept under a prop-sized triangle budget.
    var car=new THREE.Group();car.position.set(6.8,0,8.9);car.rotation.y=-.12;scene.add(car);
    cityBox(car,[1.8,.55,3.8],[0,.67,0],0x60413d,true);cityBox(car,[1.5,.68,1.8],[0,1.19,-.15],0x29343f,true);
    cityBox(car,[1.36,.38,.025],[0,1.28,-1.065],0x52616b,false);
    [-.92,.92].forEach(function(x){[-1.2,1.2].forEach(function(z){cityBox(car,[.18,.51,.57],[x,.29,z],0x10151b,false);});});
    [-.59,.59].forEach(function(x){cityBox(car,[.29,.14,.04],[x,.74,-1.92],0xbca779,false);});
    // Roof silhouettes continue behind the playable block without tall floating props.
    [-22,-10,5,20].forEach(function(x,i){cityBox(scene,[9,17+i%2*6,7],[x,(17+i%2*6)/2,-25],0x202a34,false);});
    mergeCityOpaque();
    Object.keys(adMaterials).forEach(function(k){adMaterials[k].toneMapped=false;});
    obstacles=city.solids;
  }

  // All movement and projectiles now share the real wall/prop rectangles.
  function insideSolid(x,z,r){return city.solids.some(function(o){return o.y0<1.65&&o.y1>.2&&x>o.x0-r&&x<o.x1+r&&z>o.z0-r&&z<o.z1+r;});}
  pushOutOfObstacles=function(e,r){
    for(var pass=0;pass<3;pass++)city.solids.forEach(function(o){
      if(o.y0>=1.65||o.y1<.2)return;
      if(e.x>o.x0-r&&e.x<o.x1+r&&e.z>o.z0-r&&e.z<o.z1+r){
        var options=[{d:e.x-(o.x0-r),x:o.x0-r,z:e.z},{d:o.x1+r-e.x,x:o.x1+r,z:e.z},{d:e.z-(o.z0-r),x:e.x,z:o.z0-r},{d:o.z1+r-e.z,x:e.x,z:o.z1+r}];
        options.sort(function(a,b){return a.d-b.d;});e.x=options[0].x;e.z=options[0].z;
      }
    });
  };
  platformWallCheck=function(){};regionAt=function(){return {region:'ground',h:0};};
  function segmentBox(a,b,o,inflate){
    var enter=0,exit=1,r=inflate||0;
    for(var i=0;i<3;i++){
      var key=['x','y','z'][i],lo=o[key+'0']-r,hi=o[key+'1']+r,d=b[key]-a[key];
      if(Math.abs(d)<1e-8){if(a[key]<lo||a[key]>hi)return null;continue;}
      var t0=(lo-a[key])/d,t1=(hi-a[key])/d;if(t0>t1){var swap=t0;t0=t1;t1=swap;}enter=Math.max(enter,t0);exit=Math.min(exit,t1);if(enter>exit)return null;
    }return enter;
  }
  function nearestCityHit(a,b,actors){
    var best=null;
    city.solids.forEach(function(o){var t=segmentBox(a,b,o,.018);if(t!==null&&(!best||t<best.t))best={t:t,kind:'wall'};});
    if(actors)enemies.forEach(function(e){if(!e.alive)return;var t=segmentBox(a,b,{x0:e.x-e.r*.65,x1:e.x+e.r*.65,z0:e.z-e.r*.65,z1:e.z+e.r*.65,y0:0,y1:e.type==='runner'?1.72:1.9},.08);if(t!==null&&(!best||t<best.t))best={t:t,kind:'enemy',enemy:e};});
    return best;
  }
  steerZombie=function(e,dt){
    var dx=player.x-e.x,dz=player.z-e.z,dist=Math.hypot(dx,dz)||1;
    var step=e.speed*dt,next={x:e.x+dx/dist*step,z:e.z+dz/dist*step};pushOutOfObstacles(next,e.r*.55);
    if(Math.hypot(next.x-e.x,next.z-e.z)<step*.35){next={x:e.x+dz/dist*step*e.side,z:e.z-dx/dist*step*e.side};pushOutOfObstacles(next,e.r*.55);}
    e.x=Math.max(-15.2,Math.min(15.2,next.x));e.z=Math.max(-15.2,Math.min(15.2,next.z));
    e.sprite.rotation.y=Math.atan2(-dx,-dz);
  };
  spawnEnemy=function(position){
    if(!city.ready)return;
    var runner=score>=60&&Math.random()<Math.min(.45,.15+wave*.05),sx,sz;
    if(position){sx=position[0];sz=position[1];runner=false;}
    else{
      var gates=[[-8,-10],[0,-11],[8,-10],[-8,14],[0,14],[9,13]];
      var choices=gates.filter(function(p){return Math.hypot(p[0]-player.x,p[1]-player.z)>8&&!insideSolid(p[0],p[1],.65);});
      var p=choices[Math.floor(Math.random()*choices.length)]||gates[0];sx=p[0];sz=p[1];
    }
    var gltf=city.templates['la-zombie-shambler-anime'];var model=cloneRig(gltf.scene);model.position.set(sx,0,sz);if(runner)model.scale.set(.88,.91,.9);scene.add(model);
    var mixer=new THREE.AnimationMixer(model),actions={};gltf.animations.forEach(function(clip){actions[clip.name]=mixer.clipAction(clip);});actions.Walk.play();if(runner)actions.Walk.timeScale=1.7;
    var e={id:nextId++,x:sx,z:sz,speed:runner?(3.6+Math.random()*.9+wave*.12):(1.7+Math.random()*.7+wave*.09),type:runner?'runner':'shambler',r:runner?.55:.85,seed:Math.random()*100,frame:0,frameT:0,sprite:model,alive:true,mixer:mixer,actions:actions,side:Math.random()>.5?1:-1};
    enemies.push(e);return e;
  };
  var cityShadowGeo=new THREE.CircleGeometry(.45,12).rotateX(-Math.PI/2),cityShadowMat=new THREE.MeshBasicMaterial({color:0x080d16,transparent:true,opacity:.5,depthWrite:false});
  var cityContacts=null,cityContactCapacity=0,cityContactMatrix=new THREE.Matrix4();
  function updateCityContacts(){
    var count=enemies.length+city.dead.length;
    if(!cityContacts||count>cityContactCapacity){
      if(cityContacts){scene.remove(cityContacts);cityContacts.dispose();}
      cityContactCapacity=Math.max(64,cityContactCapacity*2,count);
      cityContacts=new THREE.InstancedMesh(cityShadowGeo,cityShadowMat,cityContactCapacity);cityContacts.instanceMatrix.setUsage(THREE.DynamicDrawUsage);cityContacts.frustumCulled=false;scene.add(cityContacts);
    }
    cityContacts.count=count;var i=0;
    enemies.forEach(function(e){cityContactMatrix.makeTranslation(e.x,.012,e.z);cityContacts.setMatrixAt(i++,cityContactMatrix);});
    city.dead.forEach(function(d){cityContactMatrix.makeTranslation(d.e.x,.012,d.e.z);cityContacts.setMatrixAt(i++,cityContactMatrix);});
    cityContacts.instanceMatrix.needsUpdate=true;
  }
  function animateEnemy(e,dt){e.mixer.update(dt);}
  function disposeCityActor(e){
    if(!e.mixer)return;e.mixer.stopAllAction();e.mixer.uncacheRoot(e.sprite);
    e.sprite.traverse(function(n){if(n.isSkinnedMesh)n.skeleton.dispose();});
  }
  function retireEnemy(e){e.actions.Walk.stop();var death=e.actions.Death;death.reset().setLoop(THREE.LoopOnce,1);death.clampWhenFinished=true;death.play();city.dead.push({e:e,age:0});}
  placeContainer=function(c){
    var spots=[[-8,-7],[8,3],[-7,9],[4,-6],[9,-9],[-9,3],[3,12],[-3,-10]],p=spots[containers.indexOf(c)%spots.length]||spots[0];
    c.x=p[0];c.z=p[1];c.y=0;c.active=true;c.respawnT=0;c.group.visible=true;c.group.position.set(c.x,.3,c.z);
  };
  resetGame=function(){(enemies||[]).forEach(disposeCityActor);city.dead.forEach(function(d){disposeCityActor(d.e);scene.remove(d.e.sprite);});city.dead.length=0;cityBaseReset();player.x=1;player.z=11;yaw=.06;pitch=.025;weaponRelease=0;};

  function makeCityWeapon(){
    weaponScene=new THREE.Scene();weaponCamera=new THREE.PerspectiveCamera(58,1,.01,5);weaponScene.add(weaponCamera);
    weaponScene.add(new THREE.HemisphereLight(0xd6dfeb,0x596573,.95));var lamp=new THREE.DirectionalLight(0xffd5a0,1.8);lamp.position.set(-2,3,2);weaponScene.add(lamp);
    weaponRoot=new THREE.Group();weaponRoot.position.set(.30,-.49,-.95);weaponRoot.rotation.z=-.11;weaponScene.add(weaponRoot);
    weaponBow=city.templates['la-bow-recurve-pov'].scene.clone(true);weaponRoot.add(weaponBow);
    var geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(new Float32Array(9),3));weaponString=new THREE.Line(geo,new THREE.LineBasicMaterial({color:cityColor(0xd8cfb9)}));weaponRoot.add(weaponString);
    weaponArrow=new THREE.Group();var shaft=new THREE.Mesh(new THREE.CylinderGeometry(.006,.006,.78,6),cityMaterial(0x806044));shaft.rotation.x=Math.PI/2;shaft.position.z=-.39;weaponArrow.add(shaft);
    var tip=new THREE.Mesh(new THREE.ConeGeometry(.024,.085,4),cityMaterial(0xc0c8cb));tip.rotation.x=-Math.PI/2;tip.position.z=-.8;weaponArrow.add(tip);
    var featherGeo=new THREE.BoxGeometry(.042,.003,.095);for(var f=0;f<3;f++){var feather=new THREE.Mesh(featherGeo,cityMaterial(0xd8cfb9));feather.rotation.z=f*Math.PI/3;feather.position.z=-.09;weaponArrow.add(feather);}weaponRoot.add(weaponArrow);
    gripHand=city.templates['la-hand-grip'].scene.clone(true);gripHand.rotation.z=-Math.PI/2;gripHand.position.set(-.36,.67,.05);weaponRoot.add(gripHand);
    drawHand=city.templates['la-hand-draw'].scene.clone(true);drawHand.rotation.x=-Math.PI/2;weaponRoot.add(drawHand);
    var a=new THREE.Vector3(-.36,.67,.05),b=new THREE.Vector3(-.70,-.46,.58),delta=a.clone().sub(b);
    var sleeve=new THREE.Mesh(new THREE.CylinderGeometry(.068,.105,delta.length(),6),cityMaterial(0x202a34));sleeve.position.copy(a).add(b).multiplyScalar(.5);sleeve.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());weaponRoot.add(sleeve);
  }
  function updateWeapon(dt){
    if(!weaponRoot)return;
    var portrait=W/H<.8;weaponCamera.aspect=W/H;weaponCamera.updateProjectionMatrix();
    weaponRoot.scale.setScalar(portrait?.43:.53);weaponRoot.position.set(portrait?.17:.30,portrait?-.45:-.47,-1.02);
    var pull=chargeActive?charge*.28:0;weaponRelease=Math.max(0,weaponRelease-dt);
    if(!reducedMotion){weaponRoot.position.y+=isMoving?Math.sin(cityClock*9)*.009:0;weaponRoot.rotation.z=-.11+weaponRelease*.11;}
    weaponArrow.position.set(-.045,.76,.16+pull);weaponArrow.visible=weaponRelease<.20;
    drawHand.position.set(-.045,.79,.545+pull);drawHand.visible=chargeActive||weaponRelease>0;
    var p=weaponString.geometry.attributes.position.array;
    p.set([0,1.38,-.015+pull*.17,-.045,.76,.16+pull,0,.02,-.015+pull*.17]);
    if(weaponRelease>0&&!reducedMotion)p[5]+=Math.sin(weaponRelease*110)*weaponRelease*.07;
    weaponString.geometry.attributes.position.needsUpdate=true;
    // Deform the cached limb vertices in place; never allocate geometry on draw.
    weaponBow.traverse(function(n){if(!n.isMesh)return;var a=n.geometry.attributes.position;
      if(!n.userData.flexBase){n.geometry=n.geometry.clone();a=n.geometry.attributes.position;n.userData.flexBase=a.array.slice();}
      var base=n.userData.flexBase;
      for(var i=0;i<a.count;i++){var y=base[i*3+1];a.array[i*3+2]=base[i*3+2]+pull*.18*Math.pow(Math.abs(y-.70)/.70,2);}
      a.needsUpdate=true;
    });
  }
  releaseShot=function(){weaponRelease=.34;cityBaseRelease();};
  doFire=function(spreadDeg){
    camera.rotation.set(pitch,yaw,0);camera.position.set(player.x,EYE_H,player.z);camera.updateMatrixWorld(true);
    var dir=new THREE.Vector3();camera.getWorldDirection(dir);var far=camera.position.clone().addScaledVector(dir,50),target=far.clone();
    var hit=nearestCityHit(camera.position,far,true);if(hit)target.lerpVectors(camera.position,far,hit.t);
    var offset=new THREE.Vector3(.22,-.14,-.35).applyQuaternion(camera.quaternion),origin=camera.position.clone().add(offset);
    if(nearestCityHit(camera.position,origin,false)){sfxThud();return;}
    dir.subVectors(target,origin).normalize();if(spreadDeg)dir.applyAxisAngle(_up,spreadDeg*Math.PI/180);
    var dist=origin.distanceTo(target),speed=30,v=dir.clone().multiplyScalar(speed);
    // Midpoint gravity integration with a small high-arc compensation towards
    // the reticle target. Speeds, gravity and charge range retain baseline values.
    v.y+=2.8*Math.min(dist,50)/speed;
    var mesh=initArrowAssets.template();mesh.position.copy(origin);scene.add(mesh);
    arrows.push({x:origin.x,y:origin.y,z:origin.z,vx:v.x,vy:v.y,vz:v.z,dist:0,maxDist:52+charge*10,mesh:mesh});
  };
  function updateCityArrows(dt){
    for(var i=arrows.length-1;i>=0;i--){
      var a=arrows[i],from={x:a.x,y:a.y,z:a.z},to={x:a.x+a.vx*dt,y:a.y+a.vy*dt-2.8*dt*dt,z:a.z+a.vz*dt};
      var hit=nearestCityHit(from,to,true);a.vy-=5.6*dt;a.dist+=Math.hypot(to.x-from.x,to.y-from.y,to.z-from.z);
      a.x=to.x;a.y=to.y;a.z=to.z;
      if(hit){var point=new THREE.Vector3().lerpVectors(new THREE.Vector3(from.x,from.y,from.z),new THREE.Vector3(to.x,to.y,to.z),hit.t);
        if(hit.enemy){resolveHit(hit.enemy,point.x,point.y,point.z);enemies.splice(enemies.indexOf(hit.enemy),1);}else{sfxThud();spawnBurst(point.x,point.y,point.z,0x384650);}}
      if(hit||a.y<0||a.dist>a.maxDist){scene.remove(a.mesh);arrows.splice(i,1);}else{a.mesh.position.set(a.x,a.y,a.z);a.mesh.lookAt(a.x+a.vx,a.y+a.vy,a.z+a.vz);}
    }
  }
  render=function(t){
    var dt=Math.min(.05,Math.max(0,t-previousCityTime));previousCityTime=t;
    if(state!==STATE_PAUSED||city.review)cityClock+=dt;
    camera.rotation.set(pitch,yaw,0);camera.position.set(player.x,player.h+EYE_H,player.z);camera.updateMatrixWorld(true);
    if(city.review)enemies.forEach(function(e){e.actions.Walk.stop();e.actions.Idle.play();e.mixer.update(dt);e.sprite.rotation.y=Math.PI+.12;});
    if(state===STATE_PLAY)city.dead=city.dead.filter(function(d){d.age+=dt;d.e.mixer.update(dt);if(d.age>1.2){disposeCityActor(d.e);scene.remove(d.e.sprite);return false;}return true;});
    updateWeapon(state===STATE_PLAY||city.review?dt:0);if(city.ready)updateCityContacts();
    renderer.info.autoReset=false;renderer.info.reset();renderer.autoClear=true;renderer.render(scene,camera);
    if(weaponScene){renderer.autoClear=false;renderer.clearDepth();renderer.render(weaponScene,weaponCamera);renderer.autoClear=true;}
    cityRenderStats={calls:renderer.info.render.calls,triangles:renderer.info.render.triangles};drawHud2d(t);
    if(city.frames.length<240&&dt>0)city.frames.push(dt*1000);
  };
  var baseFit=fit;fit=function(){baseFit();renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,W<600?1.5:2));};
  function setCityView(name){var v=cityViews[name]||cityViews.intersection;city.review=true;state=STATE_PAUSED;clearInput();pauseScreen.hidden=true;player.x=v.x;player.z=v.z;player.h=0;yaw=v.yaw;pitch=v.pitch;}
  function playDistrict(){
    if(!city.ready)return;city.review=false;cityBaseStart();
    document.getElementById('district-panel').classList.add('playing');
  }
  function installV25CityBlock(){
    WORLD_HALF=16;obstacles=[];containers=[];scene.clear();state=STATE_PAUSED;
    startScreen.hidden=overScreen.hidden=pauseScreen.hidden=tutorialScreen.hidden=true;
    renderer.outputEncoding=THREE.sRGBEncoding;renderer.toneMapping=THREE.ReinhardToneMapping;renderer.toneMappingExposure=.75;
    var panel=document.createElement('aside');panel.id='district-panel';panel.innerHTML='<div class="eyebrow">LAST ARCHER / V2.5</div><h2>NIGHTFALL DISTRICT</h2><p>A deserted intersection. Keep moving.<br>Hold fire to draw. Release to survive.</p><button id="district-play" disabled>Loading…</button><select id="district-view" aria-label="Review camera"><option value="intersection">Intersection</option><option value="alley">West alley</option><option value="close">Enemy & bow</option></select><div class="status">Local preview · dark anime city</div>';document.body.appendChild(panel);
    panel.addEventListener('mousedown',function(e){e.stopPropagation();});panel.addEventListener('mousemove',function(e){e.stopPropagation();});
    document.getElementById('district-play').addEventListener('click',playDistrict);
    document.getElementById('district-view').addEventListener('change',function(e){setCityView(e.target.value);});
    window.LastArcherV25={getMetrics:function(){return {assets:{requested:city.requested,loaded:city.loaded,failed:city.failed,placements:city.placements},ready:city.ready,solids:city.solids.length,grounding:city.grounded,render:cityRenderStats,memory:{geometries:renderer.info.memory.geometries,textures:renderer.info.memory.textures},enemies:enemies.length,animated:enemies.filter(function(e){return !!e.mixer;}).length,state:state,player:{x:player.x,z:player.z},arrows:arrows.length,shots:shotsThisRun,score:score,buffs:Object.keys(activeBuffs),charge:charge,weapon:{foreground:!!weaponScene,draw:chargeActive,release:weaponRelease},frames:city.frames.slice()};},setView:setCityView};
    // Deterministic review hooks are available only when explicitly requested.
    if(new URLSearchParams(location.search).has('test'))window.LastArcherV25.test={play:function(){profile.tutorialSeen=true;playDistrict();},placePlayer:function(x,z,angle){player.x=x;player.z=z;yaw=angle||0;pitch=0;},spawn:spawnEnemy,clearEnemies:function(){enemies.forEach(function(e){disposeCityActor(e);scene.remove(e.sprite);});enemies=[];spawnTimer=999;},step:function(dt){update(dt);},aim:function(p){var dx=p[0]-player.x,dz=p[2]-player.z;yaw=Math.atan2(-dx,-dz);pitch=Math.atan2(p[1]-EYE_H,Math.hypot(dx,dz));},fire:function(){releaseShot();},solidRay:function(a,b){return nearestCityHit(a,b,false);},reset:resetGame,pickup:function(){player.x=containers[0].x;player.z=containers[0].z;},paused:pauseGame,resume:resumeGame,
      draw:function(value){chargeActive=value>0;charge=value;},render:render,wallPush:function(x,z){var p={x:x,z:z};pushOutOfObstacles(p,PLAYER_RADIUS);return p;},profile:function(){return Object.assign({},profile);},save:saveProfile,
      preview:function(){resetGame();spawnEnemy([-2,-2]);spawnEnemy([3,-6]);spawnEnemy([-7,-3]);document.getElementById('district-panel').classList.remove('playing');setCityView('intersection');}};
    loadCityTemplates().then(function(){makeCityWorld();makeCityWeapon();city.ready=true;buildContainers();
      containers.forEach(function(c){c.mesh.scale.setScalar(.65);c.mesh.material.color.convertSRGBToLinear();c.mesh.material.emissive.convertSRGBToLinear();c.mesh.material.emissiveIntensity=.16;var label=c.group.children[1];label.scale.set(1.3,.325,1);label.position.y=.68;label.material.map.encoding=THREE.sRGBEncoding;});
      resetGame();spawnEnemy([-2,-2]);spawnEnemy([3,-6]);spawnEnemy([-7,-3]);setCityView('intersection');var b=document.getElementById('district-play');b.disabled=false;b.textContent='Enter district';fit();}).catch(function(error){console.error(error);panel.querySelector('.status').id='city-load-error';panel.querySelector('.status').textContent='Could not load the district. Reload to retry.';});
  }
