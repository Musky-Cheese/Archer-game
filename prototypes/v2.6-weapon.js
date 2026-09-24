// One foreground rig: grip, left forearm, three-finger string draw and right arm.
// Nock and fingertips share a landmark; the arrow aims through the same reticle
// target as the projectile. Limbs flex in cached buffers during the draw.
var heroWeapon={limbs:[],rightSegments:[],pull:0};
makeCityWeapon=function(){
 weaponScene=new THREE.Scene();weaponCamera=new THREE.PerspectiveCamera(58,1,.01,8);
 weaponScene.add(new THREE.HemisphereLight(0x91a8c1,0x1a232c,.75));
 const key=new THREE.DirectionalLight(0xffd29e,1.4);key.position.set(-2,3,1);weaponScene.add(key);
 const rim=new THREE.DirectionalLight(0x89a8c3,.65);rim.position.set(2,1,-2);weaponScene.add(rim);
 weaponRoot=new THREE.Group();weaponScene.add(weaponRoot);
 const material=(c,r=.8)=>new THREE.MeshStandardMaterial({color:cityColor(c),roughness:r,flatShading:true});
 const leather=material(0x292f34),seam=material(0x4e5558),skin=material(0x9c826b),cuff=material(0x252e38),cloth=material(0x36424d),wood=material(0x9d7650,.5),edge=material(0xb29970,.55),carbon=material(0x303a3e,.55),steel=material(0x818b8b,.35);
 const add=(g,geo,m,p)=>{const o=new THREE.Mesh(geo,m);o.position.set(...p);g.add(o);return o;};
 const box=(g,s,p,m)=>add(g,new THREE.BoxGeometry(...s),m,p);
 function segment(g,a,b,r0,r1,m,n=8){const A=new THREE.Vector3(...a),B=new THREE.Vector3(...b),v=B.clone().sub(A);const o=add(g,new THREE.CylinderGeometry(r1,r0,1,n),m,A.clone().add(B).multiplyScalar(.5).toArray());o.scale.y=v.length();o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),v.normalize());return o;}
 // Two laminated recurves with distinct back, belly and edge planes.
 weaponBow=new THREE.Group();weaponRoot.add(weaponBow);
 for(let sign of [-1,1]){
  const rings=[[0,0,.056],[.10,-.018,.052],[.20,-.045,.048],[.31,-.078,.043],[.42,-.090,.038],[.52,-.080,.030],[.60,-.044,.025],[.67,.012,.017]];
  const p=[],ix=[];for(let [y,z,w] of rings)p.push(-w/2,.7+sign*y,z-.016,w/2,.7+sign*y,z-.016,w/2,.7+sign*y,z+.016,-w/2,.7+sign*y,z+.016);
  for(let i=0;i<rings.length-1;i++)for(let j=0;j<4;j++){const a=i*4+j,b=i*4+(j+1)%4;ix.push(a,b,b+4,a,b+4,a+4);}
  const end=(rings.length-1)*4;ix.push(0,2,1,0,3,2,end,end+1,end+2,end,end+2,end+3);
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setIndex(ix);const flat=g.toNonIndexed();flat.computeVertexNormals();const o=add(weaponBow,flat,wood,[0,0,0]);heroWeapon.limbs.push({mesh:o,base:flat.attributes.position.array.slice()});
  const strip=segment(weaponBow,[.018,.7+sign*.17,-.05],[.012,.7+sign*.52,-.084],.006,.004,edge,4);strip.visible=false;
 }
 const grip=add(weaponBow,new THREE.CylinderGeometry(.040,.043,.23,8),carbon,[0,.69,0]);grip.scale.z=1.3;
 for(let i=0;i<9;i++)box(weaponBow,[.074,.009,.097],[0,.59+i*.022,.005],leather);
 box(weaponBow,[.062,.014,.068],[-.035,.773,-.005],steel);
 heroWeapon.tipTop=new THREE.Vector3(0,1.37,.012);heroWeapon.tipBottom=new THREE.Vector3(0,.03,.012);
 function hand(parent,draw){
  const h=new THREE.Group();parent.add(h);
  // Broad palm, heel and knuckle plate are faceted, fingers curl around a grip.
  const palm=add(h,new THREE.SphereGeometry(1,7,4),leather,[-.067,-.016,.022]);palm.scale.set(.072,.095,.044);palm.rotation.z=-.2;
  box(h,[.058,.063,.012],[-.102,.010,.060],seam);
  for(let i=0;i<4;i++){
   const yy=.045-i*.035,xx=draw?.030:0;
   segment(h,[-.08,yy,.0],[.020+xx,yy,-.040],.017,.016,leather,6);
   segment(h,[.020+xx,yy,-.040],[.035+xx,yy,.009],.016,.014,skin,6);
   segment(h,[.035+xx,yy,.009],[.012+xx,yy,.034],.014,.010,skin,6);
   box(h,[.025,.022,.009],[-.070,yy,.045],seam);
  }
  segment(h,[-.12,-.065,.02],[-.086,.044,.051],.027,.024,leather);
  segment(h,[-.086,.044,.051],[-.024,.059,.026],.024,.018,skin);
  return h;
 }
 gripHand=hand(weaponRoot,false);gripHand.position.set(-.010,.7,.010);
 segment(weaponRoot,[-.95,-.50,.56],[-.43,.12,.25],.123,.089,cloth);
 segment(weaponRoot,[-.43,.12,.25],[-.13,.55,.055],.085,.058,skin);
 segment(weaponRoot,[-.16,.49,.093],[-.112,.61,.036],.070,.064,leather);
 // Raised stitched wrist strap and folded sleeve rim.
 segment(weaponRoot,[-.475,.06,.275],[-.398,.165,.225],.096,.087,cuff);
 segment(weaponRoot,[-.153,.51,.078],[-.137,.55,.052],.073,.070,seam);
 drawHand=new THREE.Group();weaponRoot.add(drawHand);hand(drawHand,true);
 heroWeapon.rightSegments=[segment(weaponRoot,[0,0,0],[0,1,0],.064,.093,skin),segment(weaponRoot,[0,0,0],[0,1,0],.102,.148,cloth),segment(weaponRoot,[0,0,0],[0,1,0],.097,.107,cuff)];
 const stringGeo=new THREE.BufferGeometry();stringGeo.setAttribute('position',new THREE.Float32BufferAttribute(new Float32Array(9),3));weaponString=new THREE.Line(stringGeo,new THREE.LineBasicMaterial({color:cityColor(0xcac7b4)}));weaponRoot.add(weaponString);
 weaponArrow=new THREE.Group();weaponRoot.add(weaponArrow);
 const shaft=add(weaponArrow,new THREE.CylinderGeometry(.004,.005,.87,6),wood,[0,0,-.435]);shaft.rotation.x=Math.PI/2;
 const arrowhead=add(weaponArrow,new THREE.ConeGeometry(.016,.055,4),steel,[0,0,-.897]);arrowhead.rotation.x=-Math.PI/2;
 for(let i=0;i<3;i++){const f=box(weaponArrow,[.032,.002,.086],[.010,0,-.068],edge);f.rotation.z=i*Math.PI*2/3;}
 box(weaponArrow,[.012,.013,.026],[0,0,.009],edge);
 heroWeapon.segmentPose=function(o,a,b){const v=b.clone().sub(a);o.position.copy(a).add(b).multiplyScalar(.5);o.scale.y=v.length();o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),v.normalize());};
};
updateWeapon=function(dt){
 if(!weaponRoot)return;
 const portrait=W/H<.8;weaponCamera.aspect=W/H;weaponCamera.fov=2*Math.atan(Math.tan(58*Math.PI/360)*Math.min(1,1.6/(W/H)))*180/Math.PI;weaponCamera.updateProjectionMatrix();
 const target=chargeActive?charge:0;heroWeapon.pull=THREE.MathUtils.lerp(heroWeapon.pull,target,Math.min(1,dt*(chargeActive?13:22)));
 const pull=heroWeapon.pull*.38;weaponRelease=Math.max(0,weaponRelease-dt);
 weaponRoot.scale.setScalar(portrait?.46:.69);weaponRoot.position.set(portrait?.13:.29,portrait?-.51:-.67,-1.10);weaponRoot.rotation.set(0,.72,-.12);
 if(!reducedMotion){weaponRoot.position.y+=(isMoving?Math.sin(cityClock*8)*.006:Math.sin(cityClock*1.7)*.0015);weaponRoot.rotation.z+=weaponRelease*.07;}
 const nock=new THREE.Vector3(-.055,.777,.21+pull);
 weaponArrow.position.copy(nock);weaponArrow.visible=weaponRelease<.16;
 // Aiming geometry stays on the arrow rest. Ballistic correction is handled by doFire.
 weaponArrow.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,-1),new THREE.Vector3(.022,0,-1).normalize());
 const follow=weaponRelease>0?Math.sin(weaponRelease/.34*Math.PI)*.11:0;
 drawHand.position.copy(nock).add(new THREE.Vector3(-.022+follow*.4,0,.018+follow));drawHand.visible=true;
 const wrist=drawHand.position.clone().add(new THREE.Vector3(-.053,-.082,.019)),elbow=new THREE.Vector3(.28,.34,.65+pull*.35),shoulder=new THREE.Vector3(.62,-.24,.90);
 heroWeapon.segmentPose(heroWeapon.rightSegments[0],wrist,elbow);heroWeapon.segmentPose(heroWeapon.rightSegments[1],elbow,shoulder);
 heroWeapon.segmentPose(heroWeapon.rightSegments[2],elbow.clone().lerp(wrist,.08),elbow.clone().lerp(shoulder,.09));
 const tipFlex=pull*.20;weaponString.geometry.attributes.position.array.set([0,1.37,.012+tipFlex,nock.x,nock.y,nock.z,0,.03,.012+tipFlex]);weaponString.geometry.attributes.position.needsUpdate=true;
 for(const l of heroWeapon.limbs){const a=l.mesh.geometry.attributes.position;for(let i=0;i<a.count;i++)a.array[i*3+2]=l.base[i*3+2]+tipFlex*Math.pow(Math.abs(l.base[i*3+1]-.7)/.67,2);a.needsUpdate=true;}
};
