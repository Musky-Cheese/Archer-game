// Export the exact preview geometry; each module is a self-contained, base-centred GLB.
const {chromium}=require('playwright'),fs=require('node:fs'),path=require('node:path'),{pathToFileURL}=require('node:url');
const root=path.resolve(__dirname,'..'),out=path.join(root,'assets/reference-corner');
function exportGLB(asset){
 const chunks=[],views=[],accessors=[],materials=[],images=[],textures=[],buffers=[];let size=0;
 const append=(buffer)=>{const padding=(4-size%4)%4;if(padding){chunks.push(Buffer.alloc(padding));size+=padding;}const id=views.length;views.push({buffer:0,byteOffset:size,byteLength:buffer.length});chunks.push(buffer);size+=buffer.length;return id;};
 function acc(values,type,bounds=false){const count={VEC2:2,VEC3:3,VEC4:4}[type],array=new Float32Array(values),a={bufferView:append(Buffer.from(array.buffer)),componentType:5126,count:values.length/count,type};if(bounds){a.min=Array(count).fill(Infinity);a.max=Array(count).fill(-Infinity);for(let i=0;i<values.length;i++){a.min[i%count]=Math.min(a.min[i%count],values[i]);a.max[i%count]=Math.max(a.max[i%count],values[i]);}}accessors.push(a);return accessors.length-1;}
 const min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity];
 for(const mesh of asset.meshes)for(let i=0;i<mesh.p.length;i++){min[i%3]=Math.min(min[i%3],mesh.p[i]);max[i%3]=Math.max(max[i%3],mesh.p[i]);}
 const origin=[(min[0]+max[0])/2,min[1],(min[2]+max[2])/2],groups=new Map();
 for(const mesh of asset.meshes){const emission=mesh.emissive?.some(v=>v>.001)?mesh.emissive:null,key=JSON.stringify([mesh.image||null,mesh.transparent?mesh.opacity:1,emission]);if(!groups.has(key))groups.set(key,{p:[],n:[],uv:[],c:[],image:mesh.image,repeat:mesh.repeat,opacity:mesh.transparent?mesh.opacity:1,emission});const g=groups.get(key);g.p.push(...mesh.p.map((v,i)=>v-origin[i%3]));g.n.push(...mesh.n);g.uv.push(...mesh.uv);for(let i=0;i<mesh.p.length/3;i++)g.c.push(...mesh.color);}
 const primitives=[];
 for(const g of groups.values()){
  const material={name:'Paint_'+materials.length,pbrMetallicRoughness:{baseColorFactor:[1,1,1,g.opacity],metallicFactor:0,roughnessFactor:.9}};
  const attrs={POSITION:acc(g.p,'VEC3',true),NORMAL:acc(g.n,'VEC3'),COLOR_0:acc(g.c,'VEC3')};
  // CanvasTexture uploads with flipY=true; glTF textures use flipY=false.
  if(g.image){const bytes=Buffer.from(g.image.split(',')[1],'base64');images.push({bufferView:append(bytes),mimeType:'image/png'});textures.push({source:images.length-1,sampler:0});material.pbrMetallicRoughness.baseColorTexture={index:textures.length-1};attrs.TEXCOORD_0=acc(g.uv.map((v,i)=>i%2?1-v*(g.repeat?.[1]||1):v*(g.repeat?.[0]||1)),'VEC2');}
  if(g.opacity<1)material.alphaMode='BLEND';
  if(g.emission)material.emissiveFactor=g.emission.map(v=>Math.min(v,1));
  materials.push(material);primitives.push({attributes:attrs,material:materials.length-1});
 }
 const binary=Buffer.concat(chunks);const doc={asset:{version:'2.0',generator:'Last Archer reference-corner module exporter'},scene:0,scenes:[{nodes:[0]}],nodes:[{name:asset.name,mesh:0}],meshes:[{primitives}],materials,buffers:[{byteLength:binary.length}],bufferViews:views,accessors};
 if(images.length)Object.assign(doc,{images,textures,samplers:[{magFilter:9729,minFilter:9987,wrapS:10497,wrapT:10497}]});
 const j=Buffer.from(JSON.stringify(doc)),json=Buffer.concat([j,Buffer.alloc((4-j.length%4)%4,32)]),bin=Buffer.concat([binary,Buffer.alloc((4-binary.length%4)%4)]),header=Buffer.alloc(12),jh=Buffer.alloc(8),bh=Buffer.alloc(8);header.write('glTF');header.writeUInt32LE(2,4);header.writeUInt32LE(28+json.length+bin.length,8);jh.writeUInt32LE(json.length);jh.write('JSON',4);bh.writeUInt32LE(bin.length);bh.write('BIN\0',4);
 const file=asset.name+'.glb',data=Buffer.concat([header,jh,json,bh,bin]);fs.writeFileSync(path.join(out,file),data);
 return {file,description:asset.name.replace('la-','').replaceAll('-',' '),dimensions_m:max.map((v,i)=>+(v-min[i]).toFixed(3)),triangles:asset.meshes.reduce((s,m)=>s+m.p.length/9,0),bytes:data.length,materials:materials.length,textures:images.length,origin:'base centre; Y up; metres',sourceOffset:origin};
}
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
 try{
  const page=await browser.newPage();await page.goto(pathToFileURL(path.join(root,'prototypes/v2.5-reference-corner.html')).href);await page.waitForFunction(()=>window.CornerReview?.getMetrics().ready);
  const modules=await page.evaluate(()=>CornerReview.exportModules()),rows=modules.map(exportGLB);
  const existing=JSON.parse(fs.readFileSync(path.join(out,'manifest.json'),'utf8')).filter(r=>r.file==='la-corner-shambler.glb');
  fs.writeFileSync(path.join(out,'manifest.json'),JSON.stringify([...existing,...rows],null,2));
  console.log(JSON.stringify(rows.map(r=>({file:r.file,triangles:r.triangles,kib:Math.round(r.bytes/1024)})),null,2));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
