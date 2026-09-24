// V2.8b local foreground-arm study. It keeps the tested V2.6.1 gameplay
// contract, adds layered dark tactical sleeves and gloves, and articulates both
// arms through their wrist, elbow and shoulder anchors.
// All geometry remains faceted; no smoothed subdivision.
// Named groups are independently exportable. Body construction uses changing
// elliptical cross-sections, rather than uniform cylinders or cuboid fingers.
var heroWeapon={limbs:[],leftSegments:[],rightSegments:[],pull:0,reviewPose:null,drawFingers:[],exports:[],motion:{breath:0,walk:0,recoil:0}};
makeCityWeapon=function(){
 weaponScene=new THREE.Scene();weaponCamera=new THREE.PerspectiveCamera(58,1,.01,8);
 weaponScene.add(new THREE.HemisphereLight(0x95abc2,0x18232b,.68));
 const key=new THREE.DirectionalLight(0xffd0a0,1.05);key.position.set(-2,3,1);weaponScene.add(key);
 const rim=new THREE.DirectionalLight(0x849dac,.46);rim.position.set(2,1,-2);weaponScene.add(rim);
 weaponRoot=new THREE.Group();weaponRoot.name='POV_RIG';weaponScene.add(weaponRoot);
 const mat=(hex,roughness=.86)=>new THREE.MeshStandardMaterial({color:cityColor(hex),roughness,flatShading:true});
 const M={leather:mat(0x343b3d),edge:mat(0x555b59),palm:mat(0x282e30),thread:mat(0x858574),skin:mat(0xa18c78),skinShade:mat(0x837260),cloth:mat(0x343f48),fold:mat(0x46515a),deep:mat(0x232e36),wood:mat(0x806143,.58),laminate:mat(0xb59a72,.55),black:mat(0x282d2c,.6),steel:mat(0x7c8888,.43),feather:mat(0xc2bba4)};
 const add=(g,geo,m)=>{const mesh=new THREE.Mesh(geo,m);g.add(mesh);return mesh;};
 const group=(name,parent)=>{const g=new THREE.Group();g.name=name;parent.add(g);return g;};
 const box=(g,size,pos,m)=>{const o=add(g,new THREE.BoxGeometry(...size),m);o.position.set(...pos);return o;};
 // Explicit ring centres and elliptical radii produce palm heels, tendons,
 // rolled sleeve folds and a gently asymmetric grip. UVs span the length.
 function loft(g,rings,m,n=8){
  const p=[],uv=[],index=[];for(let r=0;r<rings.length;r++){const [x,y,z,rx,rz]=rings[r];for(let j=0;j<n;j++){const a=2*Math.PI*j/n;p.push(x+Math.cos(a)*rx,y,z+Math.sin(a)*rz);uv.push(j/n,r/(rings.length-1));}}
  for(let r=0;r<rings.length-1;r++)for(let j=0;j<n;j++){const a=r*n+j,b=r*n+(j+1)%n;index.push(a,a+n,b+n,a,b+n,b);}
  for(let j=1;j<n-1;j++){index.push(0,j,j+1);const k=(rings.length-1)*n;index.push(k,k+j+1,k+j);}
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(p,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geo.setIndex(index);const flat=geo.toNonIndexed();flat.computeVertexNormals();geo.dispose();return add(g,flat,m);
 }
 function tube(g,points,radii,m,n=6){
  const positions=[],uv=[],idx=[],up=new THREE.Vector3(0,1,0);
  points.forEach((p,i)=>{const a=new THREE.Vector3(...points[Math.max(0,i-1)]),b=new THREE.Vector3(...points[Math.min(points.length-1,i+1)]),dir=b.sub(a).normalize();const q=new THREE.Quaternion().setFromUnitVectors(up,dir);
   for(let j=0;j<n;j++){const angle=2*Math.PI*j/n,v=new THREE.Vector3(Math.cos(angle)*radii[i],0,Math.sin(angle)*radii[i]*.88).applyQuaternion(q);positions.push(p[0]+v.x,p[1]+v.y,p[2]+v.z);uv.push(j/n,i/(points.length-1));}
  });
  for(let i=0;i<points.length-1;i++)for(let j=0;j<n;j++){const a=i*n+j,b=i*n+(j+1)%n;idx.push(a,a+n,b+n,a,b+n,b);}
  for(let j=1;j<n-1;j++){idx.push(0,j,j+1);const k=(points.length-1)*n;idx.push(k,k+j+1,k+j);}
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geo.setIndex(idx);const flat=geo.toNonIndexed();flat.computeVertexNormals();geo.dispose();return add(g,flat,m);
 }
 // Authored 256px colour grain shared by the entire wooden riser and limbs.
 const cv=document.createElement('canvas');cv.width=cv.height=256;const ctx=cv.getContext('2d');ctx.fillStyle='#bfa47c';ctx.fillRect(0,0,256,256);
 let seed=318;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)|0;return(seed>>>0)/4294967296;};
 for(let i=0;i<115;i++){const x=random()*256;ctx.strokeStyle=i%3?'#60472822':'#f0d2a028';ctx.lineWidth=.4+random();ctx.beginPath();ctx.moveTo(x,0);ctx.bezierCurveTo(x+random()*10,80,x-random()*12,170,x+random()*6,256);ctx.stroke();}
 const grain=new THREE.CanvasTexture(cv);grain.encoding=THREE.sRGBEncoding;M.wood.map=grain;M.wood.color.copy(cityColor(0xb49a7b));
 weaponBow=group('RECURVE_BOW',weaponRoot);
 // A carved riser: palm swell below the shelf and a cutaway sight window above.
 loft(weaponBow,[[0,.48,0,.023,.021],[-.007,.56,.015,.033,.039],[-.007,.635,.027,.034,.047],[0,.710,.008,.025,.034],[.026,.78,-.004,.027,.031],[.037,.855,-.010,.024,.027],[.015,.92,-.024,.022,.022]],M.wood,8);
 loft(weaponBow,[[.035,.78,-.003,.005,.028],[.044,.83,-.005,.004,.029],[.031,.91,-.016,.004,.019]],M.laminate,4);
 box(weaponBow,[.040,.010,.037],[-.009,.779,-.01],M.black);
 // The bow's belly and back are separate laminate planes within one mesh.
 for(const sign of [-1,1]){
  const rows=[[.18,-.020,.041],[.26,-.045,.040],[.35,-.080,.038],[.44,-.110,.035],[.53,-.132,.030],[.60,-.135,.026],[.66,-.111,.022],[.71,-.057,.016],[.755,.003,.010]];
  const rings=rows.map(([h,z,w])=>[sign>0?.012:0,.70+sign*h,z,w/2,.008]);if(sign<0)rings.reverse();
  const limb=loft(weaponBow,rings,M.wood,6);heroWeapon.limbs.push({mesh:limb,base:limb.geometry.attributes.position.array.slice()});
  const back=loft(weaponBow,rings.map(r=>[r[0],r[1],r[2]-.008,r[3]*.94,.0018]),M.black,4);heroWeapon.limbs.push({mesh:back,base:back.geometry.attributes.position.array.slice()});
  const tip=loft(weaponBow,[[sign>0?.012:0,.70+sign*.721,-.041,.009,.010],[sign>0?.012:0,.70+sign*.756,.003,.006,.009]].sort((a,b)=>a[1]-b[1]),M.black,6);heroWeapon.limbs.push({mesh:tip,base:tip.geometry.attributes.position.array.slice()});
 }
 // Thin diagonal leather winding follows the shaped grip, not a square block.
 for(let i=0;i<7;i++){const band=loft(weaponBow,[[-.007,.568+i*.018,.017,.034,.040],[-.007,.577+i*.018,.017,.034,.040]],M.leather,8);band.rotation.z=-.008;}
 box(weaponBow,[.019,.008,.003],[.01,.913,.001],M.steel);
 const left=group('GRIP_ARM',weaponRoot);heroWeapon.left=left;
 function hand(parent,draw){
  const hand=group(draw?'DRAW_HAND':'GRIP_HAND',parent);
  // Heel -> metacarpal arch -> four knuckles. The palm is ~9 cm across.
  loft(hand,[[-.069,-.071,.019,.027,.025],[-.058,-.043,.017,.042,.030],[-.051,.008,.012,.047,.028],[-.046,.047,.005,.044,.023],[-.033,.064,-.006,.031,.017]],M.leather,8);
  loft(hand,[[-.072,-.04,.043,.027,.007],[-.059,.00,.040,.034,.009],[-.047,.046,.029,.027,.008]],M.edge,6);
  // Small stitched panels and worn seams follow the dorsal shape.
  for(let i=0;i<6;i++){const y=-.035+i*.013;box(hand,[.004,.003,.002],[-.089+i*.004,y,.046],M.thread);}
  tube(hand,[[-.093,-.037,.030],[-.098,.005,.023],[-.077,.043,.021]],[.0025,.0025,.002],M.edge,4);
  if(!draw){
   for(let i=0;i<4;i++){
    const y=.035-i*.024,rad=.0125-i*.0008;
    tube(hand,[[-.040,y,-.013],[.010,y,-.043],[.029,y,-.020],[.017,y,.014]],[rad,rad,rad*.9,rad*.72],M.leather,6);
    tube(hand,[[-.058,y,-.009],[-.025,y,-.031],[.006,y,-.043]],[rad*1.11,rad*1.06,rad],M.leather,6);
    // Low, angular knuckle guards keep the silhouette readable without adding
    // noisy surface detail or a separate texture for every finger.
    box(hand,[.020,.010,.006],[.010,y,-.040],i===3?M.edge:M.black);
   }
   tube(hand,[[-.084,-.041,.013],[-.101,.018,.030],[-.055,.063,.013],[-.003,.041,-.002]],[.022,.022,.018,.012],M.leather,7);
   tube(hand,[[-.045,.06,.011],[-.003,.041,-.002]],[.016,.011],M.leather,6);
  }else{
   // One finger above and two below the nock: Mediterranean three-finger hook.
   for(const [i,y] of [[0,.029],[1,-.018],[2,-.042]]){
    const fg=group('DRAW_FINGER_'+i,hand);heroWeapon.drawFingers.push(fg);
    tube(fg,[[-.052,y,.005],[-.013,y,-.020],[.002,y,-.004],[-.006,y,.018]],[.013,.013,.012,.008],M.leather,6);
    tube(fg,[[-.023,y,-.018],[-.013,y,-.020],[.002,y,-.004]],[.012,.012,.010],M.leather,6);
   }
   tube(hand,[[-.061,-.057,.007],[-.025,-.066,-.015],[-.036,-.059,.018]],[.010,.010,.008],M.leather,6);
   tube(hand,[[-.092,-.04,.021],[-.10,.013,.040],[-.073,.034,.042]],[.020,.019,.013],M.leather,7);
  }
  return hand;
 }
 gripHand=hand(left,false);gripHand.position.set(-.006,.697,.018);
 // Layered, faceted sleeves run from the glove cuff to shoulder. The slimmer
 // under-sleeve keeps the pose readable when the elbow bends toward the camera.
 const wrist=new THREE.Vector3(-.075,.626,.037),elbow=new THREE.Vector3(-.32,.32,.20),shoulder=new THREE.Vector3(-.62,.10,.45);
 function forearm(parent,name,covered=false){
  const arm=group(name,parent);
  loft(arm,[[0,0,0,.030,.026],[-.001,.16,.004,.034,.029],[-.007,.34,.007,.042,.035],[-.011,.60,.003,.057,.043],[-.010,.82,0,.061,.046],[0,1,0,.053,.042]],covered?M.cloth:M.deep,10);
  loft(arm,[[-.010,.61,.003,.059,.046],[-.006,.69,.004,.068,.054],[-.015,.77,.002,.064,.052],[0,.89,0,.065,.053],[0,1.05,0,.057,.046]],M.cloth,9);
  loft(arm,[[-.010,.585,.003,.062,.049],[-.008,.64,.004,.070,.054],[-.005,.692,.004,.068,.054]],M.fold,9);
  loft(arm,[[0,-.045,0,.034,.031],[0,.04,.001,.036,.033],[0,.15,.004,.037,.034]],M.leather,8);
  box(arm,[.040,.030,.006],[0,.069,.036],M.edge);
  // Separate raised stitching, not a texture of giant painted lines.
  for(let i=-2;i<=2;i++)box(arm,[.003,.009,.003],[i*.009,.093,.038],M.thread);
  for(let i=0;i<3;i++)loft(arm,[[0,.20+i*.11,.004,.043,.034],[0,.235+i*.11,.004,.045,.035]],M.fold,8);
  return arm;
 }
 function sleeve(parent,name){
  const arm=group(name,parent);
  loft(arm,[[0,0,0,.060,.049],[.005,.08,-.002,.069,.055],[-.008,.15,.006,.066,.061],[0,.26,-.005,.075,.059],[.008,.46,0,.077,.070],[-.004,.72,.005,.084,.077],[0,1,0,.091,.085]],M.cloth,9);
  loft(arm,[[0,-.024,0,.061,.050],[.006,.025,.003,.073,.058],[.001,.076,.001,.071,.057],[0,.099,0,.065,.052]],M.fold,9);
  tube(arm,[[.049,.16,.034],[.045,.26,.047],[.058,.42,.036]],[.006,.005,.003],M.deep,5);
  tube(arm,[[-.04,.15,.045],[-.017,.22,.056],[.014,.26,.058]],[.004,.005,.004],M.fold,5);
  tube(arm,[[.04,.45,.056],[.049,.70,.062],[.057,.95,.068]],[.002,.002,.002],M.fold,4);
  return arm;
 }
 heroWeapon.segmentPose=function(o,a,b){const v=new THREE.Vector3().subVectors(b,a);o.position.copy(a);o.scale.y=v.length();o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),v.normalize());};
 const leftFore=forearm(left,'LEFT_FOREARM'),leftSleeve=sleeve(left,'LEFT_SLEEVE');heroWeapon.leftSegments=[leftFore,leftSleeve];heroWeapon.segmentPose(leftFore,wrist,elbow);heroWeapon.segmentPose(leftSleeve,elbow,shoulder);
 const right=group('DRAW_ARM',weaponRoot);heroWeapon.right=right;drawHand=hand(right,true);drawHand.rotation.y=Math.PI;
 heroWeapon.rightSegments=[forearm(right,'RIGHT_FOREARM'),sleeve(right,'RIGHT_SLEEVE')];
 weaponArrow=group('NOCKED_ARROW',weaponRoot);
 tube(weaponArrow,[[0,0,-.83],[0,0,-.15],[0,0,.008]],[.0038,.0041,.0042],M.wood,6);
 tube(weaponArrow,[[0,0,-.82],[0,0,-.865],[0,0,-.89]],[.006,.012,.0005],M.steel,4);
 for(let i=0;i<3;i++){const feather=group('FLETCHING',weaponArrow);feather.rotation.z=i*Math.PI*2/3;const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute([.002,0,-.02,.017,0,-.038,.012,0,-.095,.002,0,-.110],3));g.setIndex([0,1,2,0,2,3]);g.computeVertexNormals();const fm=M.feather.clone();fm.side=THREE.DoubleSide;add(feather,g,fm);}
 // Split plastic nock, string sits in its open groove at local z=0.
 for(let x of [-.004,.004])box(weaponArrow,[.003,.011,.019],[x,0,.008],M.feather);
 const stringGeo=new THREE.BufferGeometry();stringGeo.setAttribute('position',new THREE.Float32BufferAttribute(new Float32Array(9),3));weaponString=new THREE.Line(stringGeo,new THREE.LineBasicMaterial({color:cityColor(0xb4b4a1)}));weaponRoot.add(weaponString);
 // Static hand/arm details collapse to vertex-colour batches. Dynamic parts keep
 // their own group pivots, so posing creates no new geometry or materials.
 function batch(root,exclude=new Set()){
  root.updateWorldMatrix(true,true);const inv=root.matrixWorld.clone().invert(),batches=new Map();root.traverse(mesh=>{
   if(!mesh.isMesh||exclude.has(mesh))return;const m=mesh.material,key=(m.map?m.map.uuid:'flat')+'_'+m.side;
   if(!batches.has(key))batches.set(key,{p:[],n:[],uv:[],c:[],m,items:[]});const b=batches.get(key),g=mesh.geometry.index?mesh.geometry.toNonIndexed():mesh.geometry,t=new THREE.Matrix4().multiplyMatrices(inv,mesh.matrixWorld),nm=new THREE.Matrix3().getNormalMatrix(t),v=new THREE.Vector3();
   for(let i=0;i<g.attributes.position.count;i++){v.fromBufferAttribute(g.attributes.position,i).applyMatrix4(t);b.p.push(v.x,v.y,v.z);v.fromBufferAttribute(g.attributes.normal,i).applyMatrix3(nm).normalize();b.n.push(v.x,v.y,v.z);b.uv.push(g.attributes.uv?.getX(i)||0,g.attributes.uv?.getY(i)||0);b.c.push(m.color.r,m.color.g,m.color.b);}b.items.push(mesh);if(g!==mesh.geometry)g.dispose();
  });
  for(const b of batches.values()){const g=new THREE.BufferGeometry();for(const [name,size,values] of [['position',3,b.p],['normal',3,b.n],['uv',2,b.uv],['color',3,b.c]])g.setAttribute(name,new THREE.Float32BufferAttribute(values,size));g.computeBoundingSphere();const m=new THREE.MeshStandardMaterial({vertexColors:true,map:b.m.map||null,side:b.m.side,flatShading:true,roughness:b.m.map?.58:.85});const mesh=new THREE.Mesh(g,m);mesh.name='PAINTED_SURFACE';root.add(mesh);b.items.forEach(o=>{o.removeFromParent();o.geometry.dispose();});}
 }
 batch(weaponBow,new Set(heroWeapon.limbs.map(l=>l.mesh)));batch(gripHand);heroWeapon.leftSegments.forEach(o=>batch(o));batch(drawHand);heroWeapon.rightSegments.forEach(o=>batch(o));batch(weaponArrow);
 // drawFingers were baked into the distinct draw pose; release uses the hand pivot.
 heroWeapon.exports=[['la-recurve-v261',weaponBow],['la-grip-arm-v28b',left],['la-draw-arm-v28b',right],['la-arrow-v261',weaponArrow]];
 heroWeapon.updateHook=function(){
  // Under ?test=1 only, export the real rendered assets in local coordinates.
  const selected=heroWeapon.exports;return selected.map(([name,root])=>{root.updateWorldMatrix(true,true);const inv=root.matrixWorld.clone().invert(),meshes=[];root.traverse(o=>{if(!o.isMesh)return;const g=o.geometry.index?o.geometry.toNonIndexed():o.geometry,t=new THREE.Matrix4().multiplyMatrices(inv,o.matrixWorld),nm=new THREE.Matrix3().getNormalMatrix(t),p=[],n=[],uv=[],c=[],v=new THREE.Vector3(),m=o.material;
   for(let i=0;i<g.attributes.position.count;i++){v.fromBufferAttribute(g.attributes.position,i).applyMatrix4(t);p.push(v.x,v.y,v.z);v.fromBufferAttribute(g.attributes.normal,i).applyMatrix3(nm).normalize();n.push(v.x,v.y,v.z);uv.push(g.attributes.uv?.getX(i)||0,g.attributes.uv?.getY(i)||0);const col=g.attributes.color;c.push(m.color.r*(col?col.getX(i):1),m.color.g*(col?col.getY(i):1),m.color.b*(col?col.getZ(i):1));}meshes.push({p,n,uv,c,image:m.map?.image?.toDataURL?.('image/png'),doubleSided:m.side===THREE.DoubleSide});if(g!==o.geometry)g.dispose();});return {name,meshes};});
 };
 if(new URLSearchParams(location.search).has('test'))window.BowStudy={setPose:p=>{heroWeapon.reviewPose=p;},exportAssets:heroWeapon.updateHook,metrics:()=>({pose:heroWeapon.reviewPose,pull:heroWeapon.pull,release:weaponRelease,arrowVisible:weaponArrow.visible,nock:weaponArrow.position.toArray(),string:Array.from(weaponString.geometry.attributes.position.array),grip:gripHand.position.toArray(),drawHand:drawHand.position.toArray(),weaponDrawCalls:heroWeapon.calls,weaponTriangles:heroWeapon.triangles})};
};
updateWeapon=function(dt){
 if(!weaponRoot)return;
 const portrait=W/H<.8,pose=heroWeapon.reviewPose;weaponCamera.aspect=W/H;weaponCamera.fov=2*Math.atan(Math.tan(58*Math.PI/360)*Math.min(1,1.6/(W/H)))*180/Math.PI;weaponCamera.updateProjectionMatrix();
 const target=pose==='draw'?1:pose==='half'?.5:pose?0:chargeActive?charge:0;
 heroWeapon.pull=pose?target:THREE.MathUtils.lerp(heroWeapon.pull,target,Math.min(1,dt*(chargeActive?12:19)));
 weaponRelease=Math.max(0,weaponRelease-dt);
 const release=pose==='release'?.18:weaponRelease,pull=heroWeapon.pull*.34;
 const activeMotion=!reducedMotion&&!pose;
 const walking=activeMotion&&isMoving?1:0;
 heroWeapon.motion.walk=THREE.MathUtils.lerp(heroWeapon.motion.walk,walking,Math.min(1,dt*7));
 heroWeapon.motion.recoil=THREE.MathUtils.lerp(heroWeapon.motion.recoil,release,Math.min(1,dt*18));
 const walk=heroWeapon.motion.walk,breath=activeMotion?Math.sin(cityClock*1.72):0;
 const stride=activeMotion?Math.sin(cityClock*(walking?8.2:2.1)):0;
 // The bow stays stable enough for aiming. Weight travels through the shoulders
 // instead of making the entire weapon float around the camera.
 const baseX=portrait?.12:.27,baseY=portrait?-.53:-.68;
 weaponRoot.scale.setScalar(portrait?.48:.76);
 weaponRoot.position.set(baseX+breath*.0018+stride*.0045*walk,baseY+breath*.003+Math.abs(stride)*.0035*walk,-1.10+heroWeapon.motion.recoil*.018);
 weaponRoot.rotation.set(breath*.004+stride*.006*walk,.69+breath*.003,-.14+stride*.007*walk+heroWeapon.motion.recoil*.038);
 // The bow hand stays planted at the riser while its wrist, elbow and sleeve
 // absorb the player motion. That keeps the support arm from reading as a
 // single frozen mesh beside an otherwise animated draw arm.
 gripHand.rotation.set(.018+breath*.012,-.012,stride*.014*walk);
 const supportWrist=gripHand.localToWorld(new THREE.Vector3(-.069,-.071,.019));heroWeapon.left.worldToLocal(supportWrist);
 const supportElbow=new THREE.Vector3(-.32-stride*.018*walk,.32+breath*.010,.20+stride*.010*walk);
 const supportShoulder=new THREE.Vector3(-.62-stride*.007*walk,.10+breath*.004,.45+heroWeapon.motion.recoil*.010);
 heroWeapon.segmentPose(heroWeapon.leftSegments[0],supportWrist,supportElbow);heroWeapon.segmentPose(heroWeapon.leftSegments[1],supportElbow,supportShoulder);
 const nock=new THREE.Vector3(-.021,.791,.20+pull),rest=new THREE.Vector3(-.020,.791,-.020);
 weaponArrow.position.copy(nock);weaponArrow.visible=release<.16;
 weaponArrow.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,-1),rest.clone().sub(nock).normalize());
 // A short release follow-through then recovery keeps the hand connected to the
 // string rather than snapping back to its resting pose in one frame.
 const follow=release>0?Math.sin(release/.34*Math.PI)*.095:0;
 const handSway=new THREE.Vector3(stride*.005*walk,breath*.003-stride*.0025*walk,follow);
 drawHand.position.copy(nock).add(handSway).add(new THREE.Vector3(follow*.28,0,0));
 drawHand.rotation.set(-.035+heroWeapon.motion.recoil*.11,-Math.PI,(-.018-stride*.018*walk-follow*.8));
 const wrist=drawHand.localToWorld(new THREE.Vector3(-.069,-.071,.019));heroWeapon.right.worldToLocal(wrist);
 // The elbow leads slightly outward on a full draw, while the shoulder settles
 // into a believable rearward brace. Both segments remain continuous between
 // their joints through segmentPose.
 const elbow=new THREE.Vector3(.19+stride*.012*walk,.50+breath*.006,.58+pull*.40+follow*.16);
 const shoulder=new THREE.Vector3(.51+stride*.006*walk,.20+breath*.004,.87-pull*.036+heroWeapon.motion.recoil*.028);
 heroWeapon.segmentPose(heroWeapon.rightSegments[0],wrist,elbow);heroWeapon.segmentPose(heroWeapon.rightSegments[1],elbow,shoulder);
 for(const [i,finger] of heroWeapon.drawFingers.entries()){
  const hook=heroWeapon.pull*.16*(i===0?1:-.72),open=heroWeapon.motion.recoil*.23;
  finger.rotation.x=hook+open;finger.rotation.z=(i-1)*.008*heroWeapon.pull;
 }
 const flex=pull*.19;weaponString.geometry.attributes.position.array.set([.012,1.456,.003+flex,nock.x,nock.y,nock.z,0,-.056,.003+flex]);weaponString.geometry.attributes.position.needsUpdate=true;
 for(const l of heroWeapon.limbs){const a=l.mesh.geometry.attributes.position;for(let i=0;i<a.count;i++)a.array[i*3+2]=l.base[i*3+2]+flex*Math.pow(Math.abs(l.base[i*3+1]-.70)/.756,2);a.needsUpdate=true;}
};
