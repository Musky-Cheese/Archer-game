"""Serialize the exact browser-captured foreground pieces as separate GLBs."""
import base64,json,math,struct,zipfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'assets/v2.6.1-bow';OUT.mkdir(parents=True,exist_ok=True)
assets=json.loads((ROOT/'docs/v2.6.1/asset-geometry.json').read_text())
records=[]
for asset in assets:
    blob=bytearray();views=[];accessors=[];materials=[];primitives=[];images=[];textures=[]
    def append(data):
        while len(blob)%4:blob.append(0)
        index=len(views);views.append(dict(buffer=0,byteOffset=len(blob),byteLength=len(data)));blob.extend(data);return index
    def acc(data,kind,bounds=False):
        n={'VEC2':2,'VEC3':3}[kind]
        assert all(math.isfinite(v) for v in data)
        entry=dict(bufferView=append(struct.pack('<'+'f'*len(data),*data)),componentType=5126,count=len(data)//n,type=kind)
        if bounds:entry.update(min=[min(data[i::n]) for i in range(n)],max=[max(data[i::n]) for i in range(n)])
        accessors.append(entry);return len(accessors)-1
    lo=[min(min(m['p'][i::3]) for m in asset['meshes']) for i in range(3)]
    hi=[max(max(m['p'][i::3]) for m in asset['meshes']) for i in range(3)]
    offset=[(lo[0]+hi[0])/2,lo[1],(lo[2]+hi[2])/2]
    groups={}
    for mesh in asset['meshes']:
        key=(mesh.get('image'),mesh.get('doubleSided',False))
        g=groups.setdefault(key,dict(p=[],n=[],uv=[],c=[]))
        g['p'].extend(v-offset[i%3] for i,v in enumerate(mesh['p']))
        for field in ['n','uv','c']:g[field].extend(mesh[field])
    for (image,double),g in groups.items():
        attrs=dict(POSITION=acc(g['p'],'VEC3',True),NORMAL=acc(g['n'],'VEC3'),COLOR_0=acc(g['c'],'VEC3'))
        material=dict(name='Grain' if image else 'GlovePalette',doubleSided=double,pbrMetallicRoughness=dict(baseColorFactor=[1,1,1,1],metallicFactor=0,roughnessFactor=.58 if image else .85))
        if image:
            data=base64.b64decode(image.split(',')[1]);assert data[:8]==b'\x89PNG\r\n\x1a\n';w,h=struct.unpack('>II',data[16:24]);assert w<=256 and h<=256
            images.append(dict(bufferView=append(data),mimeType='image/png'));textures.append(dict(source=len(images)-1,sampler=0))
            material['pbrMetallicRoughness']['baseColorTexture']=dict(index=len(textures)-1)
            attrs['TEXCOORD_0']=acc([1-v if i%2 else v for i,v in enumerate(g['uv'])],'VEC2')
        primitives.append(dict(attributes=attrs,material=len(materials)));materials.append(material)
    doc=dict(asset=dict(version='2.0',generator='Last Archer V2.6.1 browser geometry export'),scene=0,scenes=[dict(nodes=[0])],nodes=[dict(name=asset['name'],mesh=0)],meshes=[dict(primitives=primitives)],materials=materials,buffers=[dict(byteLength=len(blob))],bufferViews=views,accessors=accessors)
    if images:doc.update(images=images,textures=textures,samplers=[dict(magFilter=9729,minFilter=9987,wrapS=33071,wrapT=33071)])
    encoded=json.dumps(doc,separators=(',',':')).encode();encoded+=b' '*((-len(encoded))%4)
    while len(blob)%4:blob.append(0)
    raw=struct.pack('<4sII',b'glTF',2,28+len(encoded)+len(blob))+struct.pack('<I4s',len(encoded),b'JSON')+encoded+struct.pack('<I4s',len(blob),b'BIN\0')+blob
    assert len(raw)<500*1024
    target=OUT/(asset['name']+'.glb');target.write_bytes(raw)
    records.append(dict(file=target.name,dimensions_m=[round(hi[i]-lo[i],3) for i in range(3)],triangles=sum(len(m['p'])//9 for m in asset['meshes']),bytes=len(raw),materials=len(materials),textures=len(images),sourceOffset=offset,origin='base-centre, Y-up, metres',pose='ready',animations=[]))
(OUT/'manifest.json').write_text(json.dumps(records,indent=2))
lines=['# V2.6.1 reusable bow and arms','','Each file is a self-contained GLB in metres, Y-up, with a base-centred pivot.','These are static ready-pose assets. The game animates the bow, string, nock and arm landmarks in `prototypes/v2.6.1-weapon.js`. No baked animation or skeleton is claimed.','','| File | What it is | Dimensions (m) | Triangles | KiB |','|---|---|---|---:|---:|']
descs=['Carved laminated recurve, grip wrap and arrow shelf','Left glove, anatomical forearm and rolled sleeve','Right three-finger draw glove, forearm and sleeve','Shaft, broadhead, three feathers and split nock']
for row,desc in zip(records,descs):lines.append(f"| {row['file']} | {desc} | {' × '.join(map(str,row['dimensions_m']))} | {row['triangles']} | {row['bytes']/1024:.1f} |")
lines+=['','`sourceOffset` in the JSON manifest restores each asset’s runtime placement. The string is a dynamic line in the game and is not baked into the bow GLB. The two arm assets use character-scale budgets (under 1,500 triangles each); the bow stays below 800 triangles.','One 256 × 256 colour-grain image is embedded where needed; no normal or roughness maps.','Preview PNGs show each GLB loaded independently in Three.js.']
(OUT/'README.md').write_text('\n'.join(lines)+'\n',encoding='utf-8')
print(json.dumps(records))
