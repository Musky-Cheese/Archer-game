"""Extend the portable corner rig with layered tailoring and a grounded fall.

No Blender dependency. A normal glTF skin, embedded vertex colours and animation.
"""
import json, math, struct
from pathlib import Path
import refine_v25_assets as kit
ROOT=Path(__file__).resolve().parents[1]
kit.OUT=ROOT/'assets/v2.6-hero'
kit.OUT.mkdir(parents=True,exist_ok=True)
# Reuse the approved proportions; execute only the geometry definition, not its
# old export or path setup. All new output stays in the V2.6 directory.
source=(ROOT/'tools/build_corner_character.py').read_text()
source=source[source.index('kit.PAL.update'):source.index('clips=')]
scope={'kit':kit}
exec(compile(source,'corner_geometry','exec'),scope)
s,rig=scope['s'],scope['rig']
# Lift jacket midtones without lighting the entire night street flat.
for i,c in enumerate(s.c):
    if c==kit.linear('jacket'):s.c[i]=kit.linear('#657077')
    elif c==kit.linear('cloth'):s.c[i]=kit.linear('#414a50')
# Larger tailored lapels, collar thickness, shirt folds, cuffs and thumbs.
for sign,arm,fore,thigh,shin in [(-1,3,4,7,8),(1,5,6,9,10)]:
    s.loft('#555a55',[(sign*.067,1.37,-.164,.085,.042),(sign*.088,1.48,-.112,.085,.054)],1,4)
    s.tri('#73766b',[(sign*.046,1.44,-.187),(sign*.10,1.405,-.201),(sign*.085,1.32,-.190)],1)
    s.tri('#29343b',[(sign*.065,1.38,-.199),(sign*.17,1.31,-.171),(sign*.074,1.12,-.179)],1)
    s.tri('#68716e',[(sign*.067,1.39,-.203),(sign*.17,1.31,-.176),(sign*.11,1.27,-.191)],1)
    s.box('#3d464a',(.135,.102,.022),(sign*.139,1.08,-.144),1)
    s.box('#727870',(.135,.010,.022),(sign*.139,1.13,-.160),1)
    s.loft('#29333b',[(sign*.35,.861,-.13,.113,.15),(sign*.35,.913,-.12,.127,.16)],fore,6)
    s.loft('skin',[(sign*.304,.70,-.208,.026,.032),(sign*.291,.75,-.175,.038,.035),(sign*.318,.782,-.15,.04,.037)],fore,4)
    for y in [1.19,1.27]:
        s.tri('#637078',[(sign*.32,y,-.1),(sign*.245,y+.025,-.084),(sign*.30,y-.040,-.104)],arm)
    for y in [.93,1.01]:
        s.tri('#56636b',[(sign*.40,y,-.10),(sign*.30,y+.02,-.16),(sign*.34,y-.025,-.173)],fore)
    for y in [.30,.62]:
        s.tri('#536068',[(sign*.21,y,-.068),(sign*.11,y+.038,-.09),(sign*.16,y-.025,-.094)],shin if y<.4 else thigh)
    # Ear and hollow temple, visible in profile instead of a featureless oval.
    s.loft('skinDark',[(sign*.122,1.64,-.131,.023,.050),(sign*.131,1.697,-.12,.028,.047)],2,4)
    s.tri('#35463e',[(sign*.040,1.63,-.263),(sign*.089,1.645,-.246),(sign*.065,1.588,-.243)],2)
for y in [1.06,1.14,1.22,1.30]:s.box('#858477',(.014,.014,.009),(.006,y,-.183),1)
# Seven-head adult proportions: retain the jaw planes without a toy-sized head.
s.p=[(x*.87,1.52+(y-1.52)*.82,-.10+(z+.10)*.9) if joint==2 and y>1.52 else (x,y,z) for (x,y,z),joint in zip(s.p,s.j)]
# Slightly lighten shirt planes, keep greens confined to the face and hands.
clips=[('Idle',3.0,[(1,0,[-.11,-.14,-.11]),(2,0,[.08,.12,.08]),(3,2,[-.09,-.12,-.09]),(5,2,[.07,.09,.07])]),
       ('Walk',1.2,[(7,0,[-.28,.28,-.28]),(9,0,[.28,-.28,.28]),(8,0,[.1,.34,.1]),(10,0,[.34,.1,.34]),(1,0,[-.11,-.15,-.11]),(2,2,[-.035,.025,-.035]),(3,0,[.17,-.17,.17]),(5,0,[-.17,.17,-.17])]),
       ('Attack',.5,[(3,0,[0,-.7,-.1]),(5,0,[0,-.65,-.1]),(1,0,[-.11,-.2,-.11])])]
center_z=(min(p[2] for p in s.p)+max(p[2] for p in s.p))/2
s.translate(0,0,-center_z)
rig=[(name,parent,(p[0],p[1],p[2]-center_z)) for name,parent,p in rig]
record=kit.write('la-shambler-v26.glb',s,rig,clips)
path=kit.OUT/record['file'];raw=path.read_bytes();jl=struct.unpack_from('<I',raw,12)[0]
doc=json.loads(raw[20:20+jl]);blob=bytearray(raw[28+jl:])
def accessor(values,kind,component=5126):
    while len(blob)%4:blob.append(0)
    n={'SCALAR':1,'VEC3':3,'VEC4':4}[kind];flat=values if n==1 else [v for row in values for v in row]
    offset=len(blob);blob.extend(struct.pack('<'+('f' if component==5126 else 'H')*len(flat),*flat))
    view=len(doc['bufferViews']);doc['bufferViews'].append({'buffer':0,'byteOffset':offset,'byteLength':len(blob)-offset})
    a={'bufferView':view,'componentType':component,'count':len(values),'type':kind}
    if kind=='SCALAR':a.update(min=[min(values)],max=[max(values)])
    doc['accessors'].append(a);return len(doc['accessors'])-1
# Tiny emissive eye primitive is part of the exported asset, no runtime eye hack.
eyes=[];body=[];eye=kit.linear('eye')
for i in range(0,len(s.p),3):(eyes if s.c[i]==eye else body).extend([i,i+1,i+2])
primitive=doc['meshes'][0]['primitives'][0];primitive['indices']=accessor(body,'SCALAR',5123)
doc['materials'].append({'name':'SubtleEyeGlow','emissiveFactor':[.25,.32,.09],'pbrMetallicRoughness':{'baseColorFactor':[1,1,1,1],'metallicFactor':0,'roughnessFactor':1}})
doc['meshes'][0]['primitives'].append({'attributes':primitive['attributes'].copy(),'indices':accessor(eyes,'SCALAR',5123),'material':1})
times=accessor([0,.13,.32,.57,.86,1.12],'SCALAR');anim={'name':'Death','samplers':[],'channels':[]}
def track(bone,path,values,kind):
    sampler=len(anim['samplers']);anim['samplers'].append({'input':times,'output':accessor(values,kind),'interpolation':'LINEAR'});anim['channels'].append({'sampler':sampler,'target':{'node':bone+2,'path':path}})
def rotate(bone,axis,angles):
    values=[]
    for a in angles:q=[0,0,0,math.cos(a/2)];q[axis]=math.sin(a/2);values.append(q)
    track(bone,'rotation',values,'VEC4')
rotate(0,0,[0,-.06,.26,.83,1.52,1.54])
rotate(1,0,[-.11,-.24,-.12,.10,.03,.03])
rotate(2,0,[.08,-.14,.07,-.08,.02,.02])
rotate(7,0,[0,-.20,-.35,-.30,-.12,-.12]);rotate(9,0,[0,.06,-.2,-.3,-.12,-.12])
rotate(8,0,[.1,.35,.7,.45,.10,.1]);rotate(10,0,[.1,.3,.6,.45,.1,.1])
rotate(3,2,[-.08,-.2,-.45,-.65,-.90,-.90]);rotate(5,2,[.08,.2,.45,.65,.90,.90])
rotate(4,0,[0,-.15,-.3,-.2,-.1,-.1]);rotate(6,0,[0,-.15,-.3,-.2,-.1,-.1])
track(0,'translation',[[0,y,z-center_z] for y,z in [(.89,0),(.86,.01),(.68,.06),(.43,.16),(.19,.25),(.19,.25)]],'VEC3')
doc['animations'].append(anim)
doc['asset']['generator']='Last Archer V2.6 hero slice'
while len(blob)%4:blob.append(0)
doc['buffers'][0]['byteLength']=len(blob)
data=json.dumps(doc,separators=(',',':')).encode();data+=b' '*((-len(data))%4)
path.write_bytes(struct.pack('<4sII',b'glTF',2,28+len(data)+len(blob))+struct.pack('<I4s',len(data),b'JSON')+data+struct.pack('<I4s',len(blob),b'BIN\0')+blob)
record.update(bytes=path.stat().st_size,materials=['VertexPalette','SubtleEyeGlow'],animations=['Idle','Walk','Attack','Death'],description='Layered worker shambler, angular face, individual fingers and subtle emissive eyes; articulated fall with root translation.')
(kit.OUT/'manifest.json').write_text(json.dumps([record],indent=2))
print(json.dumps(record))
