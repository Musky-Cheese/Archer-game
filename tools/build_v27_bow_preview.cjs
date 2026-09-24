/* Build an offline, side-by-side browser preview after Blender exports V2.7. */
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const oldPath = path.join(root, 'assets', 'v2.6.1-bow', 'la-recurve-v261.glb');
const nextPath = path.join(root, 'assets', 'v2.7-bow', 'la-recurve-v27.glb');
const manifestPath = path.join(root, 'assets', 'v2.7-bow', 'manifest.json');
const output = path.join(root, 'prototypes', 'v2.7-bow-compare.html');
// The portable Three.js files live beside Archer-game in this project mirror.
const threeSource = fs.readFileSync(path.join(root, '..', 'three-test.min.js'), 'utf8');
const loaderSource = fs.readFileSync(path.join(root, '..', 'three-gltfloader-r134.js'), 'utf8');

if (!fs.existsSync(nextPath)) throw new Error('Run refine_v27_bow_blender.py in Blender before building the preview.');
const dataUrl = file => 'data:model/gltf-binary;base64,' + fs.readFileSync(file).toString('base64');
const oldGlb = dataUrl(oldPath);
const nextGlb = dataUrl(nextPath);
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

const html = `<!doctype html>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Last Archer — V2.7 recurve comparison</title>
<style>
  *{box-sizing:border-box} html,body{margin:0;height:100%;background:#0c1015;color:#e9e1d4;font-family:system-ui,sans-serif}
  canvas{display:block;width:100%;height:100%} #head{position:fixed;inset:0 0 auto;padding:22px 28px;pointer-events:none;background:linear-gradient(#0c1015e8,transparent)}
  h1{margin:0;font:600 28px/1.1 Georgia,serif;letter-spacing:.04em} p{margin:7px 0;color:#9fa8ae;font-size:13px} #status{position:fixed;bottom:18px;left:50%;translate:-50% 0;padding:8px 12px;border:1px solid #70573d;background:#111923dc;color:#d7bc87;font:12px ui-monospace,monospace}
  .label{position:fixed;top:124px;color:#dfbd80;font:700 12px ui-monospace,monospace;letter-spacing:.12em}.old{left:21%}.next{right:21%}
</style>
<div id="head"><h1>LAST ARCHER / RECURVE BOW STUDY</h1><p>Shipped V2.6.1 beside Blender-made V2.7 · dark realistic-anime material pass</p></div>
<div class="label old">V2.6.1 / SHIPPED</div><div class="label next">V2.7 / BLENDER</div><div id="status">Loading independent GLBs…</div>
<script>${threeSource}</script><script>${loaderSource}</script>
<script>
const oldGLB=${JSON.stringify(oldGlb)}, nextGLB=${JSON.stringify(nextGlb)};
const r=new THREE.WebGLRenderer({antialias:true});r.setPixelRatio(Math.min(devicePixelRatio,2));r.outputEncoding=THREE.sRGBEncoding;document.body.append(r.domElement);
const scene=new THREE.Scene();scene.background=new THREE.Color(0x0c1015);scene.fog=new THREE.Fog(0x0c1015,4,10);
const camera=new THREE.PerspectiveCamera(35,1,.01,50);camera.position.set(2.7,1.12,4.5);camera.lookAt(0,.8,.04);
scene.add(new THREE.HemisphereLight(0x718696,0x17120f,1.55));const key=new THREE.DirectionalLight(0xffbc72,2.6);key.position.set(-2,4,3);scene.add(key);const rim=new THREE.DirectionalLight(0x6f91a7,1.35);rim.position.set(3,2,-2);scene.add(rim);
const floor=new THREE.Mesh(new THREE.PlaneGeometry(18,18),new THREE.MeshStandardMaterial({color:0x161c22,roughness:.55,metalness:.15}));floor.rotation.x=-Math.PI/2;scene.add(floor);
const loader=new THREE.GLTFLoader();let ready=0;
function show(url,x,name){loader.load(url,g=>{const root=g.scene;root.position.x=x;root.rotation.y=.18;root.traverse(o=>{if(o.isMesh){o.material.flatShading=true;o.castShadow=true;}});scene.add(root);ready++;document.getElementById('status').textContent=ready===2?'Ready · V2.7: ${manifest.triangles} triangles · ${manifest.textures} textures':'Loading '+name+'…';window.V27BowCompare={ready:ready===2};},undefined,e=>{document.getElementById('status').textContent='Load error: '+e.message;console.error(e);});}
show(oldGLB,-.62,'V2.6.1');show(nextGLB,.62,'V2.7');
function fit(){r.setSize(innerWidth,innerHeight,false);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix()}addEventListener('resize',fit);fit();
function frame(t){requestAnimationFrame(frame);scene.rotation.y=Math.sin(t*.00032)*.07;r.render(scene,camera)}frame(0);
</script>`;
fs.writeFileSync(output, html);
console.log(output);
