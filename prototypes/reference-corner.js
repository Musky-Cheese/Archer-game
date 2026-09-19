/* One carefully composed corner, entirely realtime geometry. No concept image
   is used as scenery. Textures are shared 256px painted-style colour atlases. */
(function(){
'use strict';
const canvas=document.getElementById('corner'),renderer=new THREE.WebGLRenderer({canvas,antialias:true});
renderer.outputEncoding=THREE.sRGBEncoding;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.95;
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(59,1,.05,180);camera.rotation.order='YXZ';
scene.background=new THREE.Color(0x0a1421);scene.fog=new THREE.FogExp2(0x101e2b,.022);
let seed=4102;const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)|0;return (seed>>>0)/4294967296;};
const color=h=>new THREE.Color(h).convertSRGBToLinear();
const assets=[],colliders=[],staticMeshes=[],glowMeshes=[],mixers=[],stats={loaded:0,failed:0,grounding:[]};
const palette={stone:0x8f918c,brick:0x807c72,trim:0x39434c,metal:0x4b565c,rust:0x65554a,glass:0x1c2c39,wood:0x60584c,asphalt:0x545d68};
function texture(paint,w=256,h=256){const c=document.createElement('canvas');c.width=w;c.height=h;paint(c.getContext('2d'),w,h);const t=new THREE.CanvasTexture(c);t.encoding=THREE.sRGBEncoding;t.anisotropy=Math.min(renderer.capabilities.getMaxAnisotropy(),4);return t;}
const wallTex=texture((g,w,h)=>{
 g.fillStyle='#93958e';g.fillRect(0,0,w,h);
 for(let y=0;y<256;y+=32)for(let x=-48;x<256;x+=64){const xx=x+(y%64?32:0);g.fillStyle=['#a1a09a','#878d8c','#92928a','#9b9b90'][Math.floor(rand()*4)];g.fillRect(xx+1,y+1,62,30);}
 for(let i=0;i<95;i++){g.globalAlpha=.04+rand()*.09;g.fillStyle=rand()>.5?'#171f28':'#d7cdb6';const x=rand()*256,y=rand()*256;g.fillRect(x,y,3+rand()*20,2+rand()*10);}g.globalAlpha=1;
});wallTex.wrapS=wallTex.wrapT=THREE.RepeatWrapping;
const roadTex=texture((g,w,h)=>{
 g.fillStyle='#707b83';g.fillRect(0,0,w,h);
 for(let i=0;i<550;i++){g.globalAlpha=.05+rand()*.07;g.fillStyle=rand()>.65?'#c4c0ad':'#1c2630';g.fillRect(rand()*w,rand()*h,1+rand()*7,1+rand()*4);}
 g.globalAlpha=.35;g.strokeStyle='#263039';g.lineWidth=.8;
 for(let i=0;i<9;i++){let x=rand()*w,y=rand()*h;g.beginPath();g.moveTo(x,y);for(let n=0;n<6;n++){x+=rand()*25-12;y+=rand()*20;g.lineTo(x,y);}g.stroke();}g.globalAlpha=1;
});roadTex.wrapS=roadTex.wrapT=THREE.RepeatWrapping;roadTex.repeat.set(5,18);
const materials={};
function mat(name,h,roughness=.92,map=null){if(!materials[name])materials[name]=new THREE.MeshStandardMaterial({color:color(h),roughness,metalness:name.includes('metal')?.25:0,flatShading:true,map});return materials[name];}
const stone=mat('stone',0xd4d8d7,.97,wallTex),brick=mat('brick',0xb7a094,.97,wallTex),trim=mat('trim',palette.trim),metal=mat('metal',palette.metal,.72),rust=mat('rust',palette.rust),glass=mat('glass',palette.glass,.33),black=mat('black',0x171e26),wood=mat('wood',palette.wood),asphalt=mat('asphalt',0x84919e,.65,roadTex);
const emission=(h,intensity)=>new THREE.MeshStandardMaterial({color:color(h),emissive:color(h),emissiveIntensity:intensity,roughness:.7});
const warmWindow=emission(0xe5b672,.85),dimWindow=emission(0x7f7357,.24),lampMat=emission(0xffd69a,3.1);
const boxGeo=new THREE.BoxGeometry(1,1,1),cylGeo=new THREE.CylinderGeometry(1,1,1,6),solidRoot=new THREE.Group();scene.add(solidRoot);
function part(g,geo,m,pos,scale,rotation){
 if(geo===boxGeo&&m.map===wallTex&&scale){geo=geo.clone();const uv=geo.attributes.uv;for(let face=0;face<6;face++){const w=face<2?scale[2]:scale[0],h=face===2||face===3?scale[2]:scale[1];for(let j=0;j<4;j++){const i=face*4+j;uv.setXY(i,uv.getX(i)*w/2.5,uv.getY(i)*h/2.5);}}}
 const o=new THREE.Mesh(geo,m);o.position.set(...pos);if(scale)o.scale.set(...scale);if(rotation)o.rotation.set(...rotation);o.castShadow=true;o.receiveShadow=true;g.add(o);staticMeshes.push(o);return o;}
const box=(g,s,p,m=stone,r)=>part(g,boxGeo,m,p,s,r);
function group(name,x=0,z=0,angle=0){const g=new THREE.Group();g.name=name;g.position.set(x,0,z);g.rotation.y=angle;solidRoot.add(g);return g;}
function collider(x0,x1,z0,z1){colliders.push({x0,x1,z0,z1});}
function rod(g,a,b,r=.025,m=metal){const A=new THREE.Vector3(...a),B=new THREE.Vector3(...b),delta=B.clone().sub(A);const o=part(g,cylGeo,m,A.clone().add(B).multiplyScalar(.5).toArray(),[r,delta.length(),r]);o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());return o;}
function outlined(o,angle=28,opacity=.4){const e=new THREE.EdgesGeometry(o.geometry,angle),m=new THREE.LineBasicMaterial({color:0x070d14,transparent:true,opacity});const line=new THREE.LineSegments(e,m);o.add(line);}
function card(g,text,sub,w,h,x,y,z,fg='#c3bdac',bg='#3e484a',angle=0){
 const t=texture((ctx,W,H)=>{ctx.fillStyle=bg;ctx.fillRect(0,0,W,H);ctx.strokeStyle='#b2ab934b';ctx.lineWidth=1;ctx.strokeRect(3,2,W-6,H-4);ctx.fillStyle=fg;ctx.textAlign='center';ctx.textBaseline='middle';let fs=H*(sub?.48:.7);ctx.font='700 '+fs+'px sans-serif';while(ctx.measureText(text).width>W-16){fs--;ctx.font='700 '+fs+'px sans-serif';}ctx.fillText(text,W/2,sub?H*.38:H*.5);if(sub){ctx.font=Math.max(3,H*.17)+'px sans-serif';ctx.fillText(sub,W/2,H*.77);}ctx.globalAlpha=.09;for(let i=0;i<30;i++){ctx.fillStyle='#081420';ctx.fillRect(rand()*W,rand()*H,rand()*18+2,1);}},256,Math.min(256,Math.max(16,Math.round(256*h/w))));
 const m=new THREE.MeshStandardMaterial({map:t,roughness:.9,transparent:false});const o=new THREE.Mesh(new THREE.PlaneGeometry(w,h),m);o.position.set(x,y,z);o.rotation.y=angle;g.add(o);o.receiveShadow=true;return o;
}
function windowPanel(g,x,y,z,w=1.25,h=1.7,lit=false){
 const module=new THREE.Group();module.name='WINDOW_MODULE';module.position.set(x,y,z);g.add(module);g=module;x=y=z=0;
 box(g,[w+.20,h+.2,.16],[x,y,z],trim);box(g,[w,h,.03],[x,y,z+.095],lit?(rand()>.45?warmWindow:dimWindow):glass);
 box(g,[.055,h,.07],[x,y,z+.13],metal);box(g,[w,.045,.07],[x,y-.15,z+.13],trim);
 box(g,[w+.33,.11,.3],[x,y-h/2-.1,z+.09],metal);
 if(lit){box(g,[w*.37,h,.02],[x-w*.27,y,z+.12],mat('curtain',0x4b4c46));}
}
function balcony(g,x,y,z,w=2.8){
 const module=new THREE.Group();module.name='BALCONY_MODULE';module.position.set(x,y,z);g.add(module);g=module;x=y=z=0;
 box(g,[w,.13,.9],[x,y,z+.40],trim);rod(g,[x-w/2,y+1,z+.85],[x+w/2,y+1,z+.85],.035);
 for(let dx=-w/2;dx<=w/2;dx+=.27)rod(g,[x+dx,y,z+.85],[x+dx,y+1,z+.85],.018);
 rod(g,[x-w/2,y,z],[x-w/2,y+1,z+.85],.025);rod(g,[x+w/2,y,z],[x+w/2,y+1,z+.85],.025);
}
function aircon(g,x,y,z){const module=new THREE.Group();module.name='AIRCON_MODULE';module.position.set(x,y,z);g.add(module);g=module;x=y=z=0;box(g,[.8,.55,.36],[x,y,z],mat('ac',0x8b8c7d));for(let i=0;i<6;i++)box(g,[.57,.025,.03],[x,y-.18+i*.067,z+.2],trim);rod(g,[x+.22,y-.3,z],[x+.22,y-.5,z],.025,rust);}
function facade(g,w=7.5,floors=4,d=6,hero=false){
 const h=floors*3.1;box(g,[w,h,d],[0,h/2,-d/2],hero?stone:brick);
 box(g,[w+.14,.2,d+.14],[0,h-.03,-d/2],trim);box(g,[w,.18,.28],[0,3.0,.04],trim);
 for(let f=1;f<floors;f++){
  const yy=3.1*f+1.5;[-w*.28,w*.23].forEach((x,i)=>windowPanel(g,x,yy,.09,1.35,1.8,(f+i)%4===0));
  box(g,[w,.075,.10],[0,f*3.1,.055],mat('seam',0x5c6364));
  if(hero&&f<3)balcony(g,-w*.26,f*3.1+.24,.17,2.65);
  if(f%2===0)aircon(g,w*.27,yy-1.15,.3);
 }
 box(g,[w*.63,2.64,.10],[0,1.35,.11],trim);
 for(let i=0;i<23;i++)box(g,[w*.60,.071,.1],[0,.20+i*.102,.205],mat('shutter'+(i%3),[0x4c565b,0x424c55,0x3d4750][i%3]));
 box(g,[w*.67,.57,.30],[0,2.83,.18],mat('signframe',0x5b635f));
 if(hero){card(g,'YAMADA MART','EVERYDAY ESSENTIALS / SINCE 1986',w*.64,.43,0,2.84,.34,'#333e42','#b1b1a0');card(g,'QUIET PEOPLE','LIVE LONGER',1.04,.6,w*.12,.80,.27,'#888c81','#465057');}
 else card(g,['NAKAMACHI CLINIC','KINU REPAIRS','AFTER HOURS'][Math.floor(rand()*3)],'',w*.62,.42,0,2.84,.34,'#a0a8a0','#3c4950');
 box(g,[.90,2.36,.08],[w*.40,1.2,.075],black);box(g,[.62,1.47,.04],[w*.40,1.5,.13],glass);box(g,[.06,.14,.07],[w*.355,1.1,.17],metal);
 rod(g,[-w*.46,.1,.16],[-w*.46,h+.6,.16],.058,rust);
 [1.5,4.5,7.5,10.5].filter(y=>y<h).forEach(y=>box(g,[.18,.09,.16],[-w*.46,y,.16],metal));
 // Side windows are modules on the return wall; street depth stays readable.
 const side=new THREE.Group();side.position.set(w/2+.025,0,-d/2);side.rotation.y=Math.PI/2;g.add(side);
 for(let f=1;f<floors;f++)for(let x of [-1.6,1.2])windowPanel(side,x,3.1*f+1.5,0,1.05,1.7,rand()>.88);
 box(side,[d,.1,.10],[0,3.1,0],trim);if(hero){aircon(side,1.1,2.55,.25);balcony(side,-.5,6.45,.16,3.0);}
 return g;
}
// The near shop and the opposing corner frame an open street, not a back wall.
facade(group('YAMADA_CORNER',-8.25,0),7.5,4,7,true);collider(-12,-4.45,-7,0);
facade(group('LEFT_NEIGHBOUR',-15.5,1.2),6.8,5,7);collider(-19,-12,-6,1.3);
const opposite=facade(group('OPPOSITE_CORNER',8.3,-4,0),7.5,4,8,false);collider(4.5,12,-12,-4);
facade(group('RIGHT_NEIGHBOUR',15.5,1.8),7.0,5,7);collider(12,19,-6,1.9);
// Expose the left face of the right block to the street.
const returnWall=new THREE.Group();returnWall.position.set(-3.8,0,-4);returnWall.rotation.y=-Math.PI/2;opposite.add(returnWall);
for(let f=1;f<4;f++)for(let x of [-2.2,.6])windowPanel(returnWall,x,3.1*f+1.5,0,1.15,1.8,rand()>.85);
balcony(returnWall,0,3.35,.12,3.7);balcony(returnWall,0,6.45,.12,3.7);
for(let side of [-1,1])for(let i=0;i<5;i++){
 const x=side*(8.7+rand()*1.2),z=-12-i*8;
 const g=facade(group('RECEDING_'+side+'_'+i,x,z,side<0?Math.PI/2:-Math.PI/2),6.7,4+Math.floor(rand()*2),6,false);
 // Far buildings are scenery outside the one-corner exploration area.
 if(i<2)collider(x-3.4,x+3.4,z-6,z);
}
// A distant broken skyline closes the view without blocking the explorable corner.
for(let i=0;i<6;i++){const g=group('DISTANT_TOWER_'+i,(i-2.5)*6.5,-65-(i%2)*5);facade(g,5.8,6+i%3,6);box(g,[1.4,1.8,1.3],[1.2,20+i%3*3.1,-2],trim);}
// Road, individually joined curbs and a crosswalk broken by wear.
const floor=box(scene,[42,.12,102],[0,-.065,-22],asphalt);floor.castShadow=false;
const curb=mat('curb',0x7e827d,.96),paving=mat('paving',0x6b7479,.95);
for(let side of [-1,1]){
 box(scene,[3.1,.18,65],[side*6.15,.07,-20],paving);
 for(let z=12;z>-53;z-=1.25){box(scene,[.31,.26,1.20],[side*4.72,.11,z],curb);}
 for(let z=11;z>-50;z-=2.5)box(scene,[2.6,.01,.025],[side*6.15,.167,z],trim);
}
const marking=mat('marking',0xb1b0a0);
for(let x=-4.1;x<=4.1;x+=1.08){const o=box(scene,[.64,.012,2.05],[x,.003,6.0],marking);o.castShadow=false;
 for(let j=0;j<3;j++)box(scene,[.1+rand()*.19,.015,.03+rand()*.3],[x+(rand()-.5)*.6,.015,5.1+rand()*1.8],asphalt).castShadow=false;}
for(let z=2;z>-55;z-=5)box(scene,[.065,.009,2.5],[.02,.001,z],mat('yellowline',0x827451)).castShadow=false;
// Rails in the distance emphasize the street's vanishing point.
for(let side of [-1,1])for(let z=-15;z>-38;z-=7){const g=group('RAIL',side*4.72,z);rod(g,[0,.9,0],[0,.9,-4],.035);[0,-2,-4].forEach(zz=>rod(g,[0,.18,zz],[0,.9,zz],.035));}
// A few matte rubble clusters, paper and uneven curb debris, all real geometry.
const rubbleGeo=new THREE.DodecahedronGeometry(1,0),rubbleMats=[mat('rubble1',0x535b60),mat('rubble2',0x70736f),mat('rubble3',0x464b50)];
for(let i=0;i<100;i++){
 const side=rand()>.5?1:-1,x=side*(4.2+rand()*2),z=10-rand()*40,size=.035+rand()*.12;
 const m=part(scene,rubbleGeo,rubbleMats[i%3],[x,size*.35,z],[size*1.8,size,size],[rand(),rand()*3,rand()]);m.castShadow=i<25;
}
for(let i=0;i<18;i++)box(scene,[.16+rand()*.2,.006,.20+rand()*.16],[(rand()-.5)*9,.008,8-rand()*20],mat('paper',0x8e8b78),[0,rand()*3,0]).castShadow=false;
function dumpster(x,z,angle=0){const g=group('DUMPSTER',x,z,angle),body=mat('dumpster',0x465a50),lid=mat('dumpsterlid',0x293b37);
 const o=box(g,[1.8,1.02,1.0],[0,.7,0],body);outlined(o);box(g,[1.93,.12,1.13],[0,1.29,0],lid,[.035,0,0]);
 for(let xx of [-.68,.68]){box(g,[.06,1,.055],[xx,.72,.515],metal);rod(g,[xx-.1,1.36,0],[xx+.1,1.36,0],.035,black);for(let zz of [-.34,.34])part(g,cylGeo,black,[xx,.16,zz],[.10,.17,.10],[Math.PI/2,0,0]);}
 for(let y of [.38,.75])box(g,[1.82,.055,1.04],[0,y,0],lid);
 card(g,'A118','CITY SANITATION',.49,.27,-.38,.86,.51,'#babfa5','#3c5047');collider(x-1,x+1,z-.6,z+.6);return g;
}
dumpster(-4.98,-3.2,.08);dumpster(6.4,-6.9,Math.PI/2);
function trash(x,z){const g=group('REFUSE',x,z);for(let i=0;i<3;i++){const s=.23+rand()*.13;part(g,new THREE.IcosahedronGeometry(1,0),mat('bag',0x303a40),[(i-1)*.37,s*.7,rand()*.3],[s*.85,s,s*.8]);part(g,cylGeo,black,[(i-1)*.37,s*1.7,0],[.035,.10,.035]);}return g;}
trash(-6.1,.40);trash(-4.9,-1.1);trash(5,-8);
// Vending creative stays fictional and replaceable, framed in a worn cabinet.
const ads={BILLBOARD_01:{headline:'ZOMBIE INSURANCE',tagline:'Coverage Ends Upon Death'},VENDING_01:{headline:'REVIVE ENERGY',tagline:'Probably Not Infected'}};
const vend=group('VENDING',-10.25,.72,.05);box(vend,[1.06,2.22,.76],[0,1.11,0],mat('vending',0x925951));outlined(box(vend,[.99,2.14,.055],[0,1.13,.4],mat('vendframe',0x89524b)));
box(vend,[.70,1.35,.025],[-.09,1.38,.439],black);const display=emission(0x829cbd,.65);box(vend,[.65,1.16,.02],[-.09,1.4,.46],display);
for(let row=0;row<4;row++)for(let col=0;col<4;col++){const m=[mat('canred',0xad7268),mat('canblue',0x78969e),mat('cancream',0xb6b49e)][(row+col)%3];part(vend,cylGeo,m,[-.32+col*.15,.94+row*.29,.485],[.042,.18,.042]);}
box(vend,[.53,.16,.04],[-.03,.37,.45],black);box(vend,[.13,.35,.03],[.39,1.14,.46],metal);
let vendingHeader,vendingTag;
function refreshVending(){for(const old of [vendingHeader,vendingTag])if(old){old.removeFromParent();old.geometry.dispose();old.material.map.dispose();old.material.dispose();}
 vendingHeader=card(vend,ads.VENDING_01.headline,'',.67,.18,-.09,2.09,.49,'#ece0c2','#576b77');
 vendingTag=card(vend,ads.VENDING_01.tagline,'',.69,.25,-.09,.65,.46,'#c9b4a5','#7c4d48');
}refreshVending();collider(-11.25,-9.7,.2,1.25);
// Tapered sedan body and broken windscreen: no rectangular toy-car silhouette.
function loft(rings,m,g){const vertices=[],indices=[];for(const ring of rings){let [z,w,y0,y1]=ring;vertices.push(-w,y0,z,w,y0,z,w,y1,z,-w,y1,z);}
 for(let r=0;r<rings.length-1;r++)for(let i=0;i<4;i++){let a=r*4+i,b=r*4+(i+1)%4,c=b+4,d=a+4;indices.push(a,b,c,a,c,d);}indices.push(0,3,2,0,2,1);let a=4*(rings.length-1);indices.push(a,a+1,a+2,a,a+2,a+3);
 const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geo.setIndex(indices);const flat=geo.toNonIndexed();flat.computeVertexNormals();return part(g,flat,m,[0,0,0]);}
const car=group('ABANDONED_SEDAN',-5.65,7.0,-.60),paint=mat('carpaint',0x63717a,.72);
const body=loft([[-1.85,.72,.38,.7],[-1.50,.89,.37,.89],[.9,.90,.37,.88],[1.95,.78,.43,.72]],paint,car);outlined(body,.25,.6);
const cabin=loft([[-.95,.78,.8,.85],[-.35,.68,.86,1.39],[.62,.66,.84,1.4],[1.23,.79,.79,.84]],glass,car);outlined(cabin);
box(car,[1.41,.09,1.0],[0,1.4,.14],paint);rod(car,[-.75,.9,-.88],[-.65,1.4,-.34],.045,paint);rod(car,[.75,.9,-.88],[.65,1.4,-.34],.045,paint);
for(let side of [-1,1]){rod(car,[side*.68,1.4,.61],[side*.79,.84,1.20],.045,paint);box(car,[.035,.35,.035],[side*.72,1.15,.08],paint);
 for(let z of [-1.23,1.24]){part(car,new THREE.CylinderGeometry(.32,.32,.19,10),black,[side*.86,.33,z],null,[0,0,Math.PI/2]);part(car,new THREE.CylinderGeometry(.15,.15,.20,8),metal,[side*.86,.33,z],null,[0,0,Math.PI/2]);}
 box(car,[.2,.085,.15],[side*.92,.93,.88],paint);}
box(car,[1.57,.13,.1],[0,.45,1.97],trim);box(car,[.75,.20,.025],[0,.65,1.97],black);for(let x of [-.59,.59])box(car,[.29,.17,.04],[x,.68,1.98],mat('deadheadlights',0xaca99c));
card(car,'NO SIGNAL','',.42,.12,0,.47,2.03,'#777c7b','#232b32');collider(-6.8,-4.3,6.5,10.7);
// Rusted exterior escape stair and landing on the right street wall.
const escape=group('FIRE_ESCAPE',4.45,-6.8,-Math.PI/2);
for(let y of [3.25,6.35,9.45]){box(escape,[2.7,.09,.85],[0,y,.4],metal);rod(escape,[-1.4,y+1,.88],[1.4,y+1,.88],.026);for(let x=-1.3;x<1.4;x+=.3)rod(escape,[x,y,.88],[x,y+1,.88],.016);}
for(let y=3.25;y<9.45;y+=.31){const x=-1.2+((y-3.25)%3.1)/3.1*2.4;box(escape,[.45,.045,.70],[x,y,.5],metal);}
rod(escape,[-1.4,3.25,.15],[1.35,6.35,.15],.035);rod(escape,[-1.4,6.35,.15],[1.35,9.45,.15],.035);
// Street lighting: restricted pools of amber, cool sky fill and a real key shadow.
scene.add(new THREE.HemisphereLight(0x7997b9,0x242a2d,.30));
const moon=new THREE.DirectionalLight(0x93b4d8,.34);moon.position.set(-15,26,-15);scene.add(moon);
const fill=new THREE.DirectionalLight(0x607d9b,.12);fill.position.set(4,9,14);scene.add(fill);
function streetLamp(x,z,h,side=1,shadow=false){
 const g=group('STREET_LAMP',x,z);rod(g,[0,0,0],[0,h,0],.065,metal);part(g,cylGeo,metal,[0,.18,0],[.15,.36,.15]);rod(g,[0,h-.2,0],[side*.92,h-.05,0],.048,metal);
 const shade=box(g,[.75,.13,.34],[side*.89,h-.11,0],metal);box(g,[.61,.028,.28],[side*.89,h-.19,0],lampMat);glowMeshes.push(shade);
 const light=new THREE.SpotLight(color(0xffbb78),4.8,18,Math.PI/3.5,.78,1.35);light.position.set(x+side*.89,h-.23,z);light.target.position.set(x+side*.45,0,z-.3);scene.add(light,light.target);
 if(shadow){light.castShadow=true;light.shadow.mapSize.set(1024,1024);light.shadow.bias=-.00035;light.shadow.normalBias=.025;light.shadow.camera.near=.4;}
 const point=new THREE.PointLight(color(0xffbd7b),1.5,7,1.5);point.position.copy(light.position);scene.add(point);
 const cone=new THREE.Mesh(new THREE.ConeGeometry(2.7,h-.3,16,1,true),new THREE.MeshBasicMaterial({color:0xffcf86,transparent:true,opacity:.008,depthWrite:false,side:THREE.DoubleSide}));cone.position.set(x+side*.89,h/2-.2,z);scene.add(cone);
 return g;
}
streetLamp(-4.15,1.2,5.65,1,true);streetLamp(4.40,-4.0,5.1,-1,true);streetLamp(-4.4,-15,5.5,1);streetLamp(4.6,-26,5.7,-1);streetLamp(-4.6,-37,5.8,1);
// Small entrance lights carry warmer detail onto the close facades.
function sconce(x,y,z){const g=group('WALL_LAMP',x,z);box(g,[.18,.34,.22],[0,y,0],metal);box(g,[.12,.22,.10],[0,y,.13],lampMat);const l=new THREE.PointLight(0xffc382,1.7,5,1.5);l.position.set(x,y,z+.3);scene.add(l);}
sconce(-5.16,2.5,.4);sconce(5.25,2.8,-3.5);
// Utility pole and sagging wires form a broken, layered skyline.
const pole=group('UTILITY_POLE',-4.52,-2.2);rod(pole,[0,0,0],[0,13.9,0],.095,mat('pole',0x605d50));
for(let h of [8.4,11.5,13.0]){rod(pole,[-.85,h,0],[.85,h,0],.052,metal);for(let x of [-.7,-.3,.3,.7]){part(pole,cylGeo,black,[x,h+.13,0],[.07,.24,.07]);}}
function cable(points){const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));const geo=new THREE.BufferGeometry().setFromPoints(curve.getPoints(24));const line=new THREE.Line(geo,new THREE.LineBasicMaterial({color:0x080e17}));scene.add(line);}
for(let i=0;i<4;i++){cable([[-4.52+i*.22,11.7,-2.2],[0,10.4,-6],[8,12.2,-7]]);cable([[-4.5+i*.15,11.7,-2],[-4.8,9.8,-17],[-5.1+i*.16,12,-33]]);}
// Restrained traffic signal and street name on a supported arm.
rod(pole,[0,6.2,0],[4.0,6.2,0],.075,metal);box(pole,[.43,.93,.3],[3.64,5.65,0],black);
for(let i=0;i<3;i++)part(pole,new THREE.CylinderGeometry(.12,.12,.04,10),i===1?emission(0xb37b35,.6):mat('signaloff',0x171e20),[3.64,5.94-i*.27,.18],null,[Math.PI/2,0,0]);
card(pole,'NAKAMACHI ST.','KEEP TO THE LIGHT',1.65,.55,2.15,5.85,.15,'#a7b3ac','#263f49');
// Supported billboard: central creative remains replaceable at runtime.
const billboard=group('BILLBOARD',7.25,-3.70,-.08);box(billboard,[5.2,2.75,.20],[0,8.9,0],metal);
for(let x of [-2.35,2.35]){rod(billboard,[x,5.6,0],[x,10.35,0],.055,metal);rod(billboard,[x,5.7,-.15],[x,7.8,.8],.045,metal);}
function billboardCreative(){return texture((g,w,h)=>{
 g.fillStyle='#aeb3af';g.fillRect(0,0,w,h);g.fillStyle='#7c8993';g.beginPath();g.moveTo(168,0);g.lineTo(256,0);g.lineTo(256,256);g.lineTo(190,256);g.lineTo(157,205);g.lineTo(183,157);g.closePath();g.fill();
 // An original flat illustrated profile, kept on the sign rather than scenery.
 g.fillStyle='#c6c4b4';g.beginPath();g.moveTo(211,44);g.lineTo(235,57);g.lineTo(244,83);g.lineTo(232,97);g.lineTo(236,120);g.lineTo(224,134);g.lineTo(228,163);g.lineTo(195,161);g.lineTo(190,127);g.lineTo(178,95);g.lineTo(188,59);g.closePath();g.fill();
 g.fillStyle='#2d3d4b';g.beginPath();g.moveTo(176,71);g.lineTo(172,27);g.lineTo(194,10);g.lineTo(229,19);g.lineTo(246,56);g.lineTo(233,88);g.lineTo(218,53);g.lineTo(200,46);g.lineTo(188,84);g.lineTo(186,126);g.closePath();g.fill();
 g.strokeStyle='#394a55';g.lineWidth=2;g.beginPath();g.moveTo(218,78);g.lineTo(232,81);g.moveTo(220,113);g.lineTo(230,113);g.stroke();
 g.fillStyle='#4e5f6b';g.beginPath();g.moveTo(195,146);g.lineTo(229,146);g.lineTo(256,177);g.lineTo(256,256);g.lineTo(150,256);g.lineTo(166,177);g.closePath();g.fill();
 g.fillStyle='#253d4a';g.font='700 21px sans-serif';g.fillText('TOMORROW',14,54);g.fillText('IS WORTH',14,80);g.fillText('INSURING.',14,106);
 for(let i=0;i<11;i++){g.fillStyle=i%2?'#849398':'#71868c';g.fillRect(10+i*13,190-rand()*45,11,65);}
 g.fillStyle='#273f4c';g.fillRect(0,216,256,40);g.fillStyle='#d3cdbb';g.font='bold 14px sans-serif';g.fillText(ads.BILLBOARD_01.headline,10,233);g.font='8px sans-serif';g.fillText(ads.BILLBOARD_01.tagline,10,247);
},256,256);}
const billboardMat=new THREE.MeshStandardMaterial({map:billboardCreative(),roughness:.9});
const billboardFace=new THREE.Mesh(new THREE.PlaneGeometry(5.0,2.55),billboardMat);billboardFace.position.set(0,8.9,.115);billboard.add(billboardFace);
for(let x of [-1.7,1.7]){rod(billboard,[x,10.35,0],[x,10.4,.5],.028);box(billboard,[.42,.09,.23],[x,10.36,.5],lampMat);}
const boardLight=new THREE.SpotLight(color(0xffd3a0),3.4,7,.85,.5,1.2);boardLight.position.set(7.25,11,-1.5);boardLight.target.position.set(7.25,8.9,-3.6);scene.add(boardLight,boardLight.target);
// Aged wall lettering, deliberately sparse instead of a wallpaper of ads.
card(opposite,'SAME CITY.','DIFFERENT DEAD.',2.4,1.3,1.8,5.2,.13,'#9ca196','#787d75');
card(group('CORNER_MURAL',-11.35,.09),'STILL PEOPLE.','STILL TOMORROW.',1.2,1.9,0,4.5,.12,'#575e5b','#91928a');
// Patches of wet pavement catch actual lights, with broken angular highlights.
const wet=new THREE.MeshStandardMaterial({color:color(0x27313c),roughness:.19,metalness:.42,transparent:true,opacity:.62,depthWrite:false});
for(let i=0;i<19;i++){let x=(rand()-.5)*8,z=9-rand()*33;const points=[];for(let j=0;j<8;j++){const a=j*Math.PI/4;points.push(new THREE.Vector2(Math.cos(a)*(0.25+rand()*.8),Math.sin(a)*(.15+rand()*.5)));}const shape=new THREE.Shape(points),m=new THREE.Mesh(new THREE.ShapeGeometry(shape),wet);m.rotation.x=-Math.PI/2;m.position.set(x,.016,z);scene.add(m);}
const reflection=mat('reflection',0x9f7949,.4);reflection.transparent=true;reflection.opacity=.17;reflection.depthWrite=false;
for(let i=0;i<28;i++){const x=-2.9+(rand()-.5)*1.25,z=3+rand()*7;box(scene,[.08+rand()*.38,.002,.025+rand()*.08],[x,.023,z],reflection).castShadow=false;}

// One shared transparent paint atlas for plaster chips, rain streaks and cracks.
const wearMap=texture((g,w,h)=>{
 g.clearRect(0,0,w,h);
 for(let i=0;i<85;i++){const x=rand()*w,y=rand()*h;g.fillStyle=['#2c34374d','#a6a59244','#c0b8a33d'][i%3];g.beginPath();g.moveTo(x,y);g.lineTo(x+8+rand()*20,y+rand()*7);g.lineTo(x+rand()*22,y+8+rand()*12);g.lineTo(x-5,y+6);g.closePath();g.fill();}
 g.strokeStyle='#202a3166';g.lineWidth=1;for(let i=0;i<4;i++){let x=rand()*w,y=rand()*h;g.beginPath();g.moveTo(x,y);for(let j=0;j<6;j++){x+=rand()*18-9;y+=rand()*14;g.lineTo(x,y);}g.stroke();}
 for(let i=0;i<20;i++){g.fillStyle='#1a25302a';g.fillRect(rand()*w,0,1+rand()*4,20+rand()*130);}
});
const wearMat=new THREE.MeshStandardMaterial({map:wearMap,transparent:true,opacity:.36,depthWrite:false,roughness:1});
for(const g of solidRoot.children.filter(g=>g.name==='YAMADA_CORNER'||g.name==='OPPOSITE_CORNER')){
 for(let y=1.25;y<12;y+=2.5){const mesh=new THREE.Mesh(new THREE.PlaneGeometry(7.4,2.5),wearMat);mesh.position.set(0,y,.025);g.add(mesh);}
 for(let y=1.25;y<12;y+=2.5){const mesh=new THREE.Mesh(new THREE.PlaneGeometry(7,2.5),wearMat);mesh.position.set(g.name==='YAMADA_CORNER'?3.76:-3.76,y,-3.5);mesh.rotation.y=g.name==='YAMADA_CORNER'?Math.PI/2:-Math.PI/2;g.add(mesh);}
}
// Crooked awnings and utility boxes break the grid at pedestrian height.
for(const [x,z,side] of [[-4.4,-9.4,1],[4.55,-15,-1]]){
 const g=group('SIDE_AWNING',x,z,side*Math.PI/2);box(g,[2.7,.08,1.0],[0,2.65,.43],mat('awning',0x69524b),[.15,0,0]);box(g,[2.7,.19,.05],[0,2.5,.9],rust);for(let xx of [-1.1,1.1])rod(g,[xx,2.2,0],[xx,2.6,.82],.025);
}
for(const x of [-5.5,5.0]){const g=group('METER_BOX',x,x<0?.05:-3.65);box(g,[.36,.54,.17],[0,1.7,0],metal);box(g,[.17,.14,.02],[0,1.77,.10],black);rod(g,[.10,1.45,0],[.10,.2,0],.022,rust);}
// Low-opacity warm reflection marks follow the lamp pools; no screen-space filter.
const glint=new THREE.MeshBasicMaterial({color:color(0xd8a060),transparent:true,opacity:.18,depthWrite:false});
for(let i=0;i<90;i++){const x=-3.1+(rand()-.5)*2,z=4+rand()*8;box(scene,[.035+rand()*.24,.001,.007+rand()*.06],[x,.031,z],glint).castShadow=false;}

// Efficiently batch opaque architectural pieces by material. Asset groups remain
// available for export; the rendered scene has no per-brick draw-call explosion.
function batchArchitecture(){
 const groups=new Map();for(const mesh of staticMeshes){if((mesh.material.transparent&&mesh.material!==glint)||mesh.children.length)continue;mesh.updateWorldMatrix(true,false);const key=mesh.material.uuid+'_'+mesh.castShadow;
 if(!groups.has(key))groups.set(key,{material:mesh.material,cast:mesh.castShadow,p:[],n:[],uv:[],items:[]});const b=groups.get(key),g=mesh.geometry.index?mesh.geometry.toNonIndexed():mesh.geometry;const p=g.attributes.position,n=g.attributes.normal,uv=g.attributes.uv,normalMat=new THREE.Matrix3().getNormalMatrix(mesh.matrixWorld),v=new THREE.Vector3(),nn=new THREE.Vector3();
 for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i).applyMatrix4(mesh.matrixWorld);nn.fromBufferAttribute(n,i).applyMatrix3(normalMat).normalize();b.p.push(v.x,v.y,v.z);b.n.push(nn.x,nn.y,nn.z);b.uv.push(uv?uv.getX(i):0,uv?uv.getY(i):0);}b.items.push(mesh);if(g!==mesh.geometry)g.dispose();}
 for(const b of groups.values()){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(b.p,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(b.n,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(b.uv,2));g.computeBoundingSphere();const m=new THREE.Mesh(g,b.material);m.castShadow=b.cast;m.receiveShadow=true;m.name='BATCH';scene.add(m);b.items.forEach(o=>o.visible=false);}
}
batchArchitecture();
// Character/weapon assets are real GLBs; pose and low-key light sell their scale.
const loader=new THREE.GLTFLoader();let weaponScene=null,weaponCamera=null,weaponRoot=null,bow=null,string=null,arrow=null,drawHand=null,charge=0,draw=false,bowVisible=true;
const people=[];let failures=[];
async function load(key){return new Promise((resolve,reject)=>loader.load(CORNER_ASSETS[key],g=>{stats.loaded++;resolve(g);},undefined,e=>{stats.failed++;failures.push(String(e));reject(e);}));}
Promise.all(Object.keys(CORNER_ASSETS).map(async k=>[k,await load(k)])).then(pairs=>{
 const models=Object.fromEntries(pairs);
 for(let i=0;i<3;i++){
  // Reloading the small rig creates independent bones without sharing animation state.
  const src=models['la-zombie-shambler-anime'];const model=src.scene.clone(true),mapping=new Map();function pair(a,b){mapping.set(a,b);a.children.forEach((c,j)=>pair(c,b.children[j]));}pair(src.scene,model);
  src.scene.traverse(n=>{if(n.isSkinnedMesh){let c=mapping.get(n);c.skeleton=new THREE.Skeleton(n.skeleton.bones.map(b=>mapping.get(b)),n.skeleton.boneInverses);c.bind(c.skeleton,n.bindMatrix);c.frustumCulled=false;c.castShadow=true;}});
  model.position.set([.1,-2.1,2.7][i],0,[5.3,-4,-2.5][i]);model.rotation.y=Math.PI;scene.add(model);
  const mix=new THREE.AnimationMixer(model);mix.clipAction(src.animations.find(a=>a.name==='Idle')).play();mixers.push(mix);people.push(model);
  const spine=model.getObjectByName('Spine');if(spine)spine.rotation.x=-.14;
 }
 weaponScene=new THREE.Scene();weaponCamera=new THREE.PerspectiveCamera(54,1,.01,5);weaponScene.add(new THREE.HemisphereLight(0x8ba2b9,0x111820,.35));let l=new THREE.DirectionalLight(0xffc58b,1.3);l.position.set(-2,3,-1);weaponScene.add(l);
 weaponRoot=new THREE.Group();weaponRoot.position.set(.30,-.47,-1.02);weaponRoot.scale.setScalar(.65);weaponRoot.rotation.z=-.15;weaponScene.add(weaponRoot);
 bow=models['la-bow-recurve-pov'].scene;bow.rotation.y=-.65;bow.scale.z=1.65;weaponRoot.add(bow);
 // Anatomical wrist/elbow landmarks, with tapered sleeves and curved fingers.
 // These connected segments replace the previous disconnected arm cylinders.
 const glove=mat('glove',0x39424c),handSkin=mat('handskin',0xb19378),sleeveMat=mat('sleeve',0x303b48);
 function limb(parent,a,b,r0,r1,m){const A=new THREE.Vector3(...a),B=new THREE.Vector3(...b),delta=B.clone().sub(A);const o=new THREE.Mesh(new THREE.CylinderGeometry(r1,r0,delta.length(),7),m);o.position.copy(A).add(B).multiplyScalar(.5);o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());parent.add(o);return o;}
 function hand(parent,x,y,z){const h=new THREE.Group();h.position.set(x,y,z);parent.add(h);
  limb(h,[-.08,-.10,.02],[-.035,.03,.005],.066,.067,glove);
  for(let i=0;i<4;i++){const yy=-.055+i*.036;limb(h,[-.055,yy,-.03],[.038,yy,-.047],.017,.015,glove);limb(h,[.038,yy,-.047],[.043,yy,.015],.015,.013,handSkin);}
  limb(h,[-.08,-.045,.02],[-.043,.056,.039],.026,.024,glove);limb(h,[-.043,.056,.039],[.012,.045,.027],.024,.018,handSkin);return h;
 }
 const grip=hand(weaponRoot,-.005,.70,.045);
 limb(weaponRoot,[-.65,-.50,.92],[-.38,.10,.52],.135,.102,sleeveMat);
 limb(weaponRoot,[-.38,.10,.52],[-.105,.60,.067],.10,.062,sleeveMat);
 limb(weaponRoot,[-.14,.525,.13],[-.095,.635,.05],.068,.065,glove);
 drawHand=new THREE.Group();weaponRoot.add(drawHand);hand(drawHand,0,0,0);
 limb(drawHand,[.02,-.07,.04],[.36,-.35,.40],.062,.098,glove);
 limb(drawHand,[.36,-.35,.40],[.70,-.55,.69],.10,.14,sleeveMat);
 const stringGeo=new THREE.BufferGeometry();stringGeo.setAttribute('position',new THREE.Float32BufferAttribute(new Float32Array(9),3));string=new THREE.Line(stringGeo,new THREE.LineBasicMaterial({color:color(0xb8b6a5)}));weaponRoot.add(string);
 arrow=new THREE.Group();let shaft=new THREE.Mesh(new THREE.CylinderGeometry(.006,.006,.83,6),wood);shaft.rotation.x=Math.PI/2;shaft.position.z=-.41;arrow.add(shaft);let tip=new THREE.Mesh(new THREE.ConeGeometry(.022,.08,4),metal);tip.rotation.x=-Math.PI/2;tip.position.z=-.84;arrow.add(tip);for(let i=0;i<3;i++){const f=new THREE.Mesh(new THREE.BoxGeometry(.045,.003,.1),mat('feather',0xbab8a4));f.rotation.z=i*Math.PI/3;f.position.z=-.11;arrow.add(f);}weaponRoot.add(arrow);
 document.getElementById('status').textContent='Realtime corner · all assets loaded';ready=true;
}).catch(e=>{console.error(e);document.getElementById('status').textContent='Asset load failed — reload to retry.';});

const views={hero:{x:.2,y:1.75,z:14,yaw:.015,pitch:.055},shop:{x:-1,y:1.75,z:9.5,yaw:.50,pitch:.10},street:{x:0,y:1.75,z:9.5,yaw:0,pitch:.015}};
let yaw=0,pitch=0,ready=false,exploring=false,pointer=null,time=0,last=0,frameTimes=[],renderStats={};const keys={};
function setView(name){const v=views[name]||views.hero;camera.position.set(v.x,v.y,v.z);yaw=v.yaw;pitch=v.pitch;camera.rotation.set(pitch,yaw,0);}
setView('hero');
function resize(){renderer.setPixelRatio(Math.min(devicePixelRatio||1,innerWidth<600?1.5:2));renderer.setSize(innerWidth,innerHeight,false);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();}resize();addEventListener('resize',resize);
document.getElementById('view').onchange=e=>setView(e.target.value);
document.getElementById('weapon').onclick=()=>{bowVisible=!bowVisible;document.getElementById('weapon').textContent='Bow: '+(bowVisible?'on':'off');};
document.getElementById('explore').onclick=()=>{exploring=!exploring;document.getElementById('explore').textContent=exploring?'Stop exploring':'Explore';if(exploring)canvas.requestPointerLock?.();else document.exitPointerLock?.();};
document.addEventListener('pointerlockchange',()=>{if(!document.pointerLockElement){exploring=false;document.getElementById('explore').textContent='Explore';}});
canvas.addEventListener('pointerdown',e=>{pointer={x:e.clientX,y:e.clientY,id:e.pointerId};canvas.setPointerCapture(e.pointerId);if(exploring)draw=true;});
canvas.addEventListener('pointermove',e=>{let dx=0,dy=0;if(document.pointerLockElement){dx=e.movementX;dy=e.movementY;}else if(pointer){dx=e.clientX-pointer.x;dy=e.clientY-pointer.y;pointer.x=e.clientX;pointer.y=e.clientY;}yaw-=dx*.0022;pitch=Math.max(-.9,Math.min(.9,pitch-dy*.0022));});
canvas.addEventListener('pointerup',()=>{pointer=null;draw=false;});canvas.addEventListener('pointercancel',()=>{pointer=null;draw=false;});
addEventListener('keydown',e=>{keys[e.code]=true;if(e.code==='KeyF')draw=true;if(['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown'].includes(e.code))e.preventDefault();});addEventListener('keyup',e=>{keys[e.code]=false;if(e.code==='KeyF')draw=false;});addEventListener('blur',()=>{Object.keys(keys).forEach(k=>keys[k]=false);draw=false;});
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
function frame(ts){requestAnimationFrame(frame);let dt=Math.min(.04,(ts-last)/1000||.016);last=ts;time+=dt;
 if(ready&&frameTimes.length<180)frameTimes.push(dt*1000);
 const f=(keys.KeyW?1:0)-(keys.KeyS?1:0),s=(keys.KeyD?1:0)-(keys.KeyA?1:0);if(f||s){const norm=Math.hypot(f,s),x=camera.position.x+(-Math.sin(yaw)*f+Math.cos(yaw)*s)*dt*2.5/norm,z=camera.position.z+(-Math.cos(yaw)*f-Math.sin(yaw)*s)*dt*2.5/norm;const blocked=colliders.some(o=>x>o.x0-.27&&x<o.x1+.27&&z>o.z0-.27&&z<o.z1+.27);if(!blocked){camera.position.x=Math.max(-11,Math.min(11,x));camera.position.z=Math.max(-13,Math.min(16,z));}}
 camera.rotation.set(pitch,yaw,0);mixers.forEach(m=>m.update(dt));
 charge=THREE.MathUtils.lerp(charge,draw?1:0,Math.min(1,dt*(draw?3:11)));
 renderer.info.autoReset=false;renderer.info.reset();renderer.autoClear=true;renderer.render(scene,camera);
 if(weaponScene&&bowVisible){const portrait=innerWidth/innerHeight<.8;weaponCamera.aspect=camera.aspect;weaponCamera.updateProjectionMatrix();weaponRoot.scale.setScalar(portrait?.40:.63);weaponRoot.position.set(portrait?.16:.32,portrait?-.49:-.70,-1.04);if(!reduced)weaponRoot.rotation.z=-.14+(f||s?Math.sin(time*7)*.006:0);
  const pull=charge*.30;string.geometry.attributes.position.array.set([0,1.38,-.015,-.045,.76,.16+pull,0,.02,-.015]);string.geometry.attributes.position.needsUpdate=true;arrow.position.set(-.045,.76,.16+pull);drawHand.position.set(-.045,.76,.16+pull);drawHand.visible=charge>.05;
  renderer.autoClear=false;renderer.clearDepth();renderer.render(weaponScene,weaponCamera);renderer.autoClear=true;
 }
 renderStats={calls:renderer.info.render.calls,triangles:renderer.info.render.triangles};
}
requestAnimationFrame(frame);
window.CornerReview={setView,getMetrics:()=>({ready,assets:stats,render:renderStats,textures:renderer.info.memory.textures,geometry:renderer.info.memory.geometries,frameTimes:frameTimes.slice(),errors:failures,camera:camera.position.toArray(),charge,bowVisible}),setBow:v=>bowVisible=v,ads,updateAd:(id,patch)=>{if(!ads[id])throw new Error('Unknown ad slot: '+id);Object.assign(ads[id],patch);if(id==='VENDING_01'){refreshVending();return;}billboardMat.map.dispose();billboardMat.map=billboardCreative();billboardMat.needsUpdate=true;},setDraw:v=>draw=v,
 exportModules:()=>{
  const selections=[['la-mart-shell','YAMADA_CORNER'],['la-window','WINDOW_MODULE'],['la-balcony','BALCONY_MODULE'],['la-aircon','AIRCON_MODULE'],['la-dumpster','DUMPSTER'],['la-refuse-bags','REFUSE'],['la-vending','VENDING'],['la-abandoned-sedan','ABANDONED_SEDAN'],['la-street-lamp','STREET_LAMP'],['la-billboard','BILLBOARD']];
  return selections.map(([name,nodeName])=>{const root=solidRoot.getObjectByName(nodeName),inverse=new THREE.Matrix4();root.updateWorldMatrix(true,true);inverse.copy(root.matrixWorld).invert();const meshes=[];
   function collect(node){if(node!==root&&name==='la-mart-shell'&&node.name.endsWith('_MODULE'))return;
    if(node.isMesh){const geometry=node.geometry.index?node.geometry.toNonIndexed():node.geometry;const transform=new THREE.Matrix4().multiplyMatrices(inverse,node.matrixWorld),normal=new THREE.Matrix3().getNormalMatrix(transform),p=[],n=[],uv=[],v=new THREE.Vector3();for(let i=0;i<geometry.attributes.position.count;i++){v.fromBufferAttribute(geometry.attributes.position,i).applyMatrix4(transform);p.push(v.x,v.y,v.z);v.fromBufferAttribute(geometry.attributes.normal,i).applyMatrix3(normal).normalize();n.push(v.x,v.y,v.z);uv.push(geometry.attributes.uv?.getX(i)||0,geometry.attributes.uv?.getY(i)||0);}
     const m=node.material,t=m.map;meshes.push({p,n,uv,color:m.color.toArray(),emissive:m.emissive?.clone().multiplyScalar(m.emissiveIntensity).toArray(),opacity:m.opacity,transparent:m.transparent,image:t?.image?.toDataURL?.('image/png'),repeat:t?.repeat?.toArray()});if(geometry!==node.geometry)geometry.dispose();}
    node.children.forEach(collect);
   }collect(root);return {name,meshes};
  });
 }
};
})();
