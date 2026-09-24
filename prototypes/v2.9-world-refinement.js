// V2.9 scene refinements are intentionally additive: the validated city,
// collision volume, enemy logic and gameplay loop stay in place.
(function(){
 const v29World=makeCityWorld;
 const v29Spawn=spawnEnemy;
 const v29Animate=animateEnemy;
 const v29Fit=fit;
 const linear=hex=>new THREE.Color(hex).convertSRGBToLinear();

 function material(hex,roughness=.82,emissive=0){
  return new THREE.MeshStandardMaterial({color:linear(hex),emissive:emissive?linear(hex):new THREE.Color(0),emissiveIntensity:emissive,roughness,metalness:roughness<.55?.18:0,flatShading:true});
 }
 function box(parent,size,position,mat,rotation){
  const mesh=new THREE.Mesh(new THREE.BoxGeometry(1,1,1),mat);mesh.scale.set(...size);mesh.position.set(...position);if(rotation)mesh.rotation.set(...rotation);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;
 }
 function cylinder(parent,radius,height,position,mat){
  const mesh=new THREE.Mesh(new THREE.CylinderGeometry(radius,radius,height,7),mat);mesh.position.set(...position);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;
 }
 function sharpStreetDetails(){
  const root=new THREE.Group();root.name='V29_SHARP_STREET_DETAILS';scene.add(root);
  const black=material(0x111920,.92), concrete=material(0x667078,.95), steel=material(0x3d4b53,.64), rust=material(0x73584a,.88), paper=material(0xaaa18d,.98), wet=new THREE.MeshBasicMaterial({color:linear(0x8daec2),transparent:true,opacity:.15,depthWrite:false});
  // Drain grates, curb bollards and service boxes create crisp close-range cues
  // without blocking the player's existing collision corridor.
  for(const z of [7.6,3.1,-1.4,-8.8,-15.6,-23.2]){
   for(let i=0;i<5;i++)box(root,[.055,.008,.48],[4.48+i*.055,.022,z],black);
   cylinder(root,.075,.78,[4.95,.39,z+.72],steel);
   box(root,[.12,.12,.12],[4.95,.78,z+.72],rust);
  }
  for(const [x,z,flip] of [[-5.65,-2.1,1],[5.62,-6.35,-1],[-5.60,-12.5,1],[5.62,-17.0,-1]]){
   const kiosk=new THREE.Group();kiosk.position.set(x,0,z);kiosk.rotation.y=flip*Math.PI/2;root.add(kiosk);
   box(kiosk,[.36,.58,.16],[0,1.52,0],steel);box(kiosk,[.23,.11,.016],[0,1.58,.092],black);box(kiosk,[.12,.27,.012],[.07,1.72,.098],paper);box(kiosk,[.022,1.10,.022],[.10,.63,0],rust);
  }
  for(const [x,z,angle] of [[-4.53,-5.2,Math.PI/2],[4.54,-10.8,-Math.PI/2],[-4.52,-18.6,Math.PI/2]]){
   const board=new THREE.Group();board.position.set(x,0,z);board.rotation.y=angle;root.add(board);
   box(board,[1.12,.78,.05],[0,2.0,.04],black);box(board,[1.0,.66,.012],[0,2.0,.075],paper);
   for(let i=0;i<4;i++)box(board,[.18,.25,.014],[-.33+i*.22,2.0+(i%2?.12:-.12),.086],i%3?rust:concrete);
  }
  for(const [x,z,w,h] of [[-1.9,5.1,2.2,.70],[1.4,1.2,1.6,.46],[-2.4,-4.6,1.45,.42],[2.2,-11.4,2.1,.62]]){
   const puddle=new THREE.Mesh(new THREE.PlaneGeometry(w,h),wet);puddle.rotation.x=-Math.PI/2;puddle.position.set(x,.026,z);root.add(puddle);
   const rim=new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.PlaneGeometry(w,h)),new THREE.LineBasicMaterial({color:0x182631,transparent:true,opacity:.35}));rim.rotation.x=-Math.PI/2;rim.position.copy(puddle.position);root.add(rim);
  }
 }

 function refineZombie(enemy){
  const model=enemy.sprite;
  model.traverse(node=>{
   if(!node.isMesh)return;
   const updateMaterial=mat=>{const next=mat.clone();next.flatShading=true;next.roughness=Math.max(.72,next.roughness||0);next.metalness=0;return next;};
   node.material=Array.isArray(node.material)?node.material.map(updateMaterial):updateMaterial(node.material);
  });
  const jacket=material(0x34464b,.94), lining=material(0x1b2830,.9), strap=material(0x5b665c,.78), eye= new THREE.MeshBasicMaterial({color:0xaacb73,transparent:true,opacity:.78});
  const spine=model.getObjectByName('Spine')||model;
  const head=model.getObjectByName('Head')||spine;
  const torso=new THREE.Group();torso.name='V29_LAYERED_JACKET';spine.add(torso);
  box(torso,[.51,.52,.15],[0,.20,-.105],jacket);
  box(torso,[.44,.08,.17],[0,.43,-.125],lining);
  for(const x of [-.18,.18])box(torso,[.035,.49,.025],[x,.19,-.19],strap,[0,0,x*.10]);
  box(torso,[.16,.15,.035],[.13,.19,-.205],lining);
  const eyeGroup=new THREE.Group();eyeGroup.name='V29_SUBTLE_EYES';head.add(eyeGroup);
  for(const x of [-.072,.072]){const glow=new THREE.Mesh(new THREE.SphereGeometry(.021,6,4),eye);glow.position.set(x,.015,-.15);eyeGroup.add(glow);}
  const hair=new THREE.Mesh(new THREE.DodecahedronGeometry(.18,0),lining);hair.scale.set(1.05,.50,.68);hair.position.set(0,.12,-.02);head.add(hair);
  enemy.v29Eyes=eyeGroup;
 }

 makeCityWorld=function(){
  v29World();
  scene.fog.color.copy(linear(0x0a1722));scene.fog.density=.025;
  renderer.outputEncoding=THREE.sRGBEncoding;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.98;
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  sharpStreetDetails();
 };
 spawnEnemy=function(position){const enemy=v29Spawn(position);if(enemy)refineZombie(enemy);return enemy;};
 animateEnemy=function(enemy,dt){v29Animate(enemy,dt);if(enemy.v29Eyes){const glow=.61+Math.sin(cityClock*4.2+enemy.seed*12)*.16;enemy.v29Eyes.children.forEach(eye=>eye.material.opacity=glow);}};
 fit=function(){v29Fit();renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,W<600?1.75:2));};
})();
