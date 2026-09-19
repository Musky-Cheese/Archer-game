// Render the actual independent GLBs, including the exported shambler skeleton.
const fs=require('node:fs'),path=require('node:path');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),kit=path.resolve(root,process.argv[2]||'assets/v2.5-city-kit');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe'});
 try{
  const page=await browser.newPage({viewport:{width:512,height:512}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  const source=fs.readFileSync(path.join(root,'prototypes/v2.5-anime-city-block.html'),'utf8');
  const scripts=[...source.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)].map(m=>m[1]);
  await page.setContent('<style>body{margin:0;background:#080d16}</style>');
  for(const s of scripts.slice(0,2))await page.addScriptTag({content:s});
  const output=path.join(kit,'previews');fs.mkdirSync(output,{recursive:true});
  for(const file of fs.readdirSync(kit).filter(n=>n.endsWith('.glb'))){
   const url='data:model/gltf-binary;base64,'+fs.readFileSync(path.join(kit,file)).toString('base64');
   const facing=process.argv[3]==='front'&&!file.includes('shambler')?1:-1;
   await page.evaluate(async ({url,facing})=>{
    if(window.assetRenderer){window.assetRenderer.dispose();window.assetRenderer.domElement.remove();}
    const renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});window.assetRenderer=renderer;
    renderer.setSize(512,512);renderer.outputEncoding=THREE.sRGBEncoding;renderer.toneMapping=THREE.ReinhardToneMapping;renderer.toneMappingExposure=.85;document.body.appendChild(renderer.domElement);
    const scene=new THREE.Scene();scene.background=new THREE.Color(0x080d16);
    scene.add(new THREE.HemisphereLight(0xafc4d5,0x3c414a,.75));const key=new THREE.DirectionalLight(0xffd5ac,1.5);key.position.set(-3,5,-4);scene.add(key);
    const gltf=await new Promise((resolve,reject)=>new THREE.GLTFLoader().load(url,resolve,undefined,reject));scene.add(gltf.scene);
    const box=new THREE.Box3().setFromObject(gltf.scene),size=box.getSize(new THREE.Vector3()),center=box.getCenter(new THREE.Vector3());
    const camera=new THREE.PerspectiveCamera(38,1,.01,150),distance=Math.max(size.x,size.y,size.z)*1.8;
    camera.position.set(center.x+distance*.52,center.y+distance*.3,center.z+distance*facing);camera.lookAt(center);
    renderer.render(scene,camera);
   },{url,facing});
   await page.screenshot({path:path.join(output,file.replace('.glb','.png'))});
  }
  if(errors.length)throw new Error(errors.join('\n'));
  console.log('Rendered '+fs.readdirSync(kit).filter(n=>n.endsWith('.glb')).length+' individual asset previews.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
