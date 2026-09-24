// Executed within the reference-world factory, before static batching.
// All paint is authored here; the concept image is never sampled.
const plasterPaint=texture((g,w,h)=>{
 g.fillStyle='#91928c';g.fillRect(0,0,w,h);
 for(let i=0;i<1400;i++){const x=rand()*w,y=rand()*h;g.globalAlpha=.02+rand()*.06;g.fillStyle=i%3?'#232b33':'#d0cab8';g.beginPath();g.ellipse(x,y,1+rand()*16,1+rand()*10,rand()*3,0,Math.PI*2);g.fill();}
 g.globalAlpha=.28;
 for(let i=0;i<18;i++){let x=rand()*w,y=rand()*h;g.fillStyle=['#696e6b','#b4b09f','#515c61'][i%3];g.beginPath();g.moveTo(x,y);for(let j=0;j<7;j++)g.lineTo(x+Math.cos(j)* (5+rand()*22),y+Math.sin(j)*(5+rand()*15));g.fill();}
 g.globalAlpha=.16;g.strokeStyle='#25333b';g.lineWidth=.7;
 for(let i=0;i<8;i++){let x=rand()*w,y=rand()*h;g.beginPath();g.moveTo(x,y);for(let n=0;n<7;n++){x+=rand()*15-7;y+=rand()*13;g.lineTo(x,y);}g.stroke();}
 g.globalAlpha=1;
});plasterPaint.wrapS=plasterPaint.wrapT=THREE.RepeatWrapping;
stone.map=plasterPaint;stone.color.copy(color(0xbcbeb8));
const brickPaint=texture((g,w,h)=>{
 g.fillStyle='#414749';g.fillRect(0,0,w,h);
 for(let y=0;y<h;y+=16)for(let x=-32;x<w;x+=48){const xx=x+(y%32?24:0);g.fillStyle=['#796b61','#73685e','#817368','#69645c','#8a7969'][Math.floor(rand()*5)];g.fillRect(xx+1,y+1,46,14);g.fillStyle='#b3a58a30';g.fillRect(xx+2,y+2,44,1);}
 for(let i=0;i<900;i++){g.fillStyle=i%2?'#131e2920':'#d6c8a610';g.fillRect(rand()*w,rand()*h,1+rand()*7,1+rand()*3);}
});brickPaint.wrapS=brickPaint.wrapT=THREE.RepeatWrapping;brick.map=brickPaint;brick.color.copy(color(0xc7b3a6));
const asphaltPaint=texture((g,w,h)=>{
 g.fillStyle='#49515a';g.fillRect(0,0,w,h);
 for(let i=0;i<9000;i++){const v=Math.floor(35+rand()*85);g.fillStyle=`rgba(${v},${v+4},${v+9},${.1+rand()*.3})`;g.fillRect(rand()*w,rand()*h,1,1);}
 for(let i=0;i<16;i++){const x=rand()*w,y=rand()*h;const gr=g.createRadialGradient(x,y,1,x,y,10+rand()*38);gr.addColorStop(0,'#111a2460');gr.addColorStop(1,'#111a2400');g.fillStyle=gr;g.fillRect(0,0,w,h);}
 g.strokeStyle='#141d26';g.lineWidth=.7;for(let i=0;i<9;i++){let x=rand()*w,y=rand()*h;g.beginPath();g.moveTo(x,y);for(let n=0;n<9;n++){const px=x,py=y;x+=rand()*24-12;y+=rand()*19;g.lineTo(x,y);if(n%3===0){g.moveTo(x,y);g.lineTo(x+12, y-9);g.moveTo(x,y);}}g.stroke();}
});asphaltPaint.wrapS=asphaltPaint.wrapT=THREE.RepeatWrapping;asphaltPaint.repeat.set(7,19);asphalt.map=asphaltPaint;asphalt.color.copy(color(0x9aa9b7));asphalt.roughness=.83;
// Recessed glazing with solid reveals, lintels, dark sill undersides and curtains.
solidRoot.traverse(o=>{
 if(o.name!=='WINDOW_MODULE')return;
 const frame=o.children[0];const w=frame.scale.x,h=frame.scale.y;
 box(o,[.07,h,.20],[-w/2+.025,0,.19],trim);box(o,[.07,h,.20],[w/2-.025,0,.19],trim);
 box(o,[w,.08,.24],[0,h/2,.16],stone);box(o,[w+.08,.05,.26],[0,-h/2,.13],black);
 if(rand()>.72)box(o,[w*.25,h-.2,.015],[w*.23,0,.116],mat('fadedcurtain',0x5f6259));
});
// Close storefront repairs, electric boxes, conduits and layered paper signage.
for(const [x,z,angle] of [[-4.45,-4,Math.PI/2],[4.48,-9,-Math.PI/2]]){
 const g=group('SERVICE_DETAILS',x,z,angle);
 for(let i=0;i<3;i++){box(g,[.30,.46,.17],[-1+i*.43,1.65,.1],metal);card(g,i===0?'高圧':'電力','',.19,.17,-1+i*.43,1.68,.191,'#9c9d8a','#404c51');rod(g,[-1+i*.43,1.4,.15],[-1+i*.43,.2,.15],.015,rust);}
 box(g,[2.9,.09,.9],[0,2.6,.42],mat('canvasawning',0x69534b),[.12,0,0]);
 for(let i=0;i<8;i++)box(g,[.12,.13,.04],[-1.3+i*.36,2.43,.88],rust);
 card(g,'営業終了','CLOSED UNTIL FURTHER NOTICE',1.25,.48,.5,1.9,.06,'#c0b89d','#454d4e');
 card(g,'行方不明','MISSING / CALL 031',.34,.47,-.85,.92,.04,'#444d4e','#b6b09c');
}
// Architectural shadows must read at human scale. Constrain lamps to pools.
scene.traverse(o=>{if(o.isSpotLight){o.intensity*=.87;if(o.castShadow)o.shadow.mapSize.set(1024,1024);}if(o.isDirectionalLight)o.intensity*=1.08;});
for(const mesh of staticMeshes){mesh.updateWorldMatrix(true,false);if(mesh.matrixWorld.elements[14]<-18)mesh.castShadow=false;}
// Frontage grime, oil splashes and cracked crosswalk paint in one tiny atlas.
const stainMap=texture((g,w,h)=>{
 g.clearRect(0,0,w,h);for(let i=0;i<1100;i++){g.fillStyle=i%4?'#0b141e50':'#747b7555';g.beginPath();g.ellipse(rand()*w,rand()*h,rand()*6,rand()*3,rand()*3,0,6.3);g.fill();}
});
const stains=new THREE.MeshStandardMaterial({map:stainMap,transparent:true,opacity:.65,depthWrite:false,roughness:1});
for(let i=0;i<15;i++){const m=new THREE.Mesh(new THREE.PlaneGeometry(3+rand()*3,2+rand()*3),stains);m.rotation.x=-Math.PI/2;m.rotation.z=rand()*3;m.position.set((rand()-.5)*8,.042,12-i*3);scene.add(m);}
// Bolted manhole, drainage slots and a grounded end barricade define this slice.
const cover=group('MANHOLE',1.6,2.3);part(cover,new THREE.CylinderGeometry(.52,.52,.025,20),metal,[0,.015,0]);
for(let i=-3;i<=3;i++)box(cover,[.7,.006,.023],[0,.031,i*.10],black);
for(let z of [9,-1,-12,-25])for(let s of [-1,1]){const g=group('DRAIN',s*4.40,z);box(g,[.38,.02,.68],[0,.015,0],black);for(let j=0;j<6;j++)box(g,[.36,.015,.023],[0,.03,-.28+j*.10],metal);}
for(let z of [16.3,-38]){const g=group('SLICE_BOUNDARY',0,z);for(let x=-11;x<=11;x+=2.8){box(g,[2.65,.85,.6],[x,.425,0],trim);for(let k=0;k<4;k++)box(g,[.20,.5,.015],[x-1+k*.57,.53,.31],mat('fadedwarning',0x92754f),[0,0,-.25]);}}
// True planar reflection of the realtime world, broken by a small wetness mask.
// The reflection target is fixed and reused: no allocations per frame.
const wetMask=texture((g,w,h)=>{g.fillStyle='#111';g.fillRect(0,0,w,h);for(let i=0;i<65;i++){const x=rand()*w,y=rand()*h,gr=g.createRadialGradient(x,y,1,x,y,8+rand()*28);gr.addColorStop(0,'#d0d0d0');gr.addColorStop(1,'#00000000');g.fillStyle=gr;g.fillRect(0,0,w,h);}});
wetMask.wrapS=wetMask.wrapT=THREE.RepeatWrapping;
const rt=new THREE.WebGLRenderTarget(768,512,{minFilter:THREE.LinearFilter,magFilter:THREE.LinearFilter});
const mirrorCamera=new THREE.PerspectiveCamera(),textureMatrix=new THREE.Matrix4();
const reflected=new THREE.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{reflected:{value:rt.texture},wetMask:{value:wetMask},textureMatrix:{value:textureMatrix}},
 vertexShader:'uniform mat4 textureMatrix; varying vec4 mirrorUV; varying vec3 world; void main(){vec4 p=modelMatrix*vec4(position,1.); world=p.xyz;mirrorUV=textureMatrix*p;gl_Position=projectionMatrix*viewMatrix*p;}',
 fragmentShader:'uniform sampler2D reflected;uniform sampler2D wetMask; varying vec4 mirrorUV; varying vec3 world; void main(){float m=texture2D(wetMask,world.xz*.23).r;vec2 uv=mirrorUV.xy/mirrorUV.w;uv.x+=sin(world.z*76.+world.x*9.)*.0011;vec3 c=texture2D(reflected,uv).rgb;float edge=1.-smoothstep(3.7,4.5,abs(world.x));gl_FragColor=vec4(c*.8,smoothstep(.20,.73,m)*.53*edge);\n#include <tonemapping_fragment>\n#include <encodings_fragment>\n}' });
const mirror=new THREE.Mesh(new THREE.PlaneGeometry(9.2,66),reflected);mirror.rotation.x=-Math.PI/2;mirror.position.set(0,.026,-17);scene.add(mirror);
const reflectTarget=new THREE.Vector3(),reflectDir=new THREE.Vector3(),clipPlane=new THREE.Plane(new THREE.Vector3(0,1,0),-.027),clipV=new THREE.Vector4(),q=new THREE.Vector4();
function reflectWetRoad(){
 camera.updateMatrixWorld();mirrorCamera.copy(camera);mirrorCamera.position.y=-camera.position.y+.052;
 camera.getWorldDirection(reflectDir);reflectTarget.copy(camera.position).add(reflectDir);reflectTarget.y=-reflectTarget.y+.052;
 mirrorCamera.up.set(0,-1,0);mirrorCamera.lookAt(reflectTarget);mirrorCamera.updateMatrixWorld();mirrorCamera.matrixWorldInverse.copy(mirrorCamera.matrixWorld).invert();
 textureMatrix.set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1).multiply(mirrorCamera.projectionMatrix).multiply(mirrorCamera.matrixWorldInverse);
 const cp=clipPlane.clone().applyMatrix4(mirrorCamera.matrixWorldInverse);clipV.set(cp.normal.x,cp.normal.y,cp.normal.z,cp.constant);const p=mirrorCamera.projectionMatrix.elements;
 q.set((Math.sign(clipV.x)+p[8])/p[0],(Math.sign(clipV.y)+p[9])/p[5],-1,(1+p[10])/p[14]);clipV.multiplyScalar(2/clipV.dot(q));p[2]=clipV.x;p[6]=clipV.y;p[10]=clipV.z+1;p[14]=clipV.w;
 mirror.visible=false;const sprites=[];scene.traverse(o=>{if(o.isSprite&&o.visible){o.visible=false;sprites.push(o);}});const old=renderer.getRenderTarget(),shadow=renderer.shadowMap.autoUpdate;renderer.shadowMap.autoUpdate=false;renderer.setRenderTarget(rt);renderer.clear();renderer.render(scene,mirrorCamera);renderer.setRenderTarget(old);renderer.shadowMap.autoUpdate=shadow;mirror.visible=true;sprites.forEach(o=>o.visible=true);
}
