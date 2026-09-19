"""Stage 8: compact vertex-colour GLBs, a rigid-weight humanoid rig and clips.

Y-up/metres. No external dependencies. Each asset is independently importable.
The Blender recipe imports these exact GLBs instead of recreating other shapes.
"""
import json, math, struct
from pathlib import Path
from build_v25_city_kit import OUT

PAL = {'skin': '#92ac62', 'skinDark':'#657b48', 'jacket':'#364653',
       'cloth':'#202a34', 'hair':'#171e26', 'eye':'#d8cfb9', 'red':'#70413d',
       'wall':'#384650', 'brick':'#60413d', 'trim':'#242e39', 'glass':'#101f2b',
       'amber':'#d69a4a', 'lit':'#bca779', 'metal':'#29343f', 'wood':'#806044',
       'olive':'#52634d', 'road':'#202a34', 'line':'#877f6b','hand':'#b69579'}

def linear(c):
    h=PAL.get(c,c).lstrip('#'); v=[int(h[i:i+2],16)/255 for i in (0,2,4)]
    return [x/12.92 if x<=.04045 else ((x+.055)/1.055)**2.4 for x in v]

class Shape:
    def __init__(self): self.p=[];self.n=[];self.c=[];self.j=[]
    def tri(self,c,points,bone=0):
        a,b,d=points;u=[b[i]-a[i] for i in range(3)];v=[d[i]-a[i] for i in range(3)]
        n=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]]
        length=math.sqrt(sum(x*x for x in n)) or 1;n=[x/length for x in n]
        self.p.extend(points);self.n.extend([n]*3);self.c.extend([linear(c)]*3);self.j.extend([bone]*3)
    def box(self,c,size,center,bone=0):
        x,y,z=center;w,h,d=[v/2 for v in size]
        p=[(x+dx*w,y+dy*h,z+dz*d) for dx,dy,dz in [(-1,-1,-1),(1,-1,-1),(1,1,-1),(-1,1,-1),(-1,-1,1),(1,-1,1),(1,1,1),(-1,1,1)]]
        for a,b,e,f in [(1,0,3,2),(4,5,6,7),(0,4,7,3),(5,1,2,6),(3,7,6,2),(0,1,5,4)]:
            self.tri(c,[p[a],p[b],p[e]],bone);self.tri(c,[p[a],p[e],p[f]],bone)
    def loft(self,c,rings,bone=0,segments=8):
        # Rings are (x,y,z,width,depth); faceted elliptical cross sections.
        rings=[[(x+math.cos(math.tau*i/segments)*w/2,y,z+math.sin(math.tau*i/segments)*d/2) for i in range(segments)] for x,y,z,w,d in rings]
        for lower,upper in zip(rings,rings[1:]):
            for i in range(segments):
                j=(i+1)%segments
                self.tri(c,[lower[i],upper[i],upper[j]],bone);self.tri(c,[lower[i],upper[j],lower[j]],bone)
        for ring,reverse in [(rings[0],True),(rings[-1],False)]:
            for i in range(1,segments-1):
                p=[ring[0],ring[i+1],ring[i]] if not reverse else [ring[0],ring[i],ring[i+1]]
                self.tri(c,p,bone)
    def translate(self,x,y,z):self.p=[(p[0]+x,p[1]+y,p[2]+z) for p in self.p]

def write(name,s,rig=None,clips=None,attachments=None):
    blob=bytearray();views=[];acs=[]
    def acc(values,kind,component=5126,bounds=False):
        n={'SCALAR':1,'VEC3':3,'VEC4':4,'MAT4':16}[kind]
        flat=[v for row in values for v in row] if n>1 else values
        while len(blob)%4:blob.append(0)
        offset=len(blob);fmt={5126:'f',5123:'H'}[component]
        blob.extend(struct.pack('<'+fmt*len(flat),*flat)); vi=len(views)
        views.append({'buffer':0,'byteOffset':offset,'byteLength':len(blob)-offset})
        obj={'bufferView':vi,'componentType':component,'count':len(values),'type':kind}
        if bounds:
            obj['min']=[min(row[i] for row in values) for i in range(n)] if n>1 else [min(values)]
            obj['max']=[max(row[i] for row in values) for i in range(n)] if n>1 else [max(values)]
        acs.append(obj);return len(acs)-1
    attrs={'POSITION':acc(s.p,'VEC3',bounds=True),'NORMAL':acc(s.n,'VEC3'),'COLOR_0':acc(s.c,'VEC3')}
    nodes=[{'name':name.replace('.glb',''),'children':[1]},{'name':'Surface','mesh':0}]
    doc={'asset':{'version':'2.0','generator':'Last Archer Stage 8'},'scene':0,'scenes':[{'nodes':[0]}],
         'nodes':nodes,'meshes':[{'primitives':[{'attributes':attrs,'material':0}]}],
         'materials':[{'name':'VertexPalette','pbrMetallicRoughness':{'baseColorFactor':[1,1,1,1],'metallicFactor':0,'roughnessFactor':1}}]}
    if rig:
        attrs['JOINTS_0']=acc([[j,0,0,0] for j in s.j],'VEC4',5123)
        attrs['WEIGHTS_0']=acc([[1,0,0,0] for _ in s.j],'VEC4')
        for i,(label,parent,pos) in enumerate(rig):
            pp=rig[parent][2] if parent>=0 else (0,0,0)
            nodes.append({'name':label,'translation':[pos[j]-pp[j] for j in range(3)]})
            nodes[parent+2 if parent>=0 else 0].setdefault('children',[]).append(i+2)
        matrices=[]
        for _,_,(x,y,z) in rig:matrices.append([1,0,0,0,0,1,0,0,0,0,1,0,-x,-y,-z,1])
        doc['skins']=[{'name':'ShamblerRig','joints':list(range(2,2+len(rig))),'skeleton':2,'inverseBindMatrices':acc(matrices,'MAT4')}];nodes[1]['skin']=0
        animations=[]
        for label,duration,tracks in clips:
            anim={'name':label,'channels':[],'samplers':[]};time=acc([0,duration/2,duration],'SCALAR',bounds=True)
            for bone,axis,angles in tracks:
                q=[]
                for a in angles:
                    v=[0,0,0,math.cos(a/2)];v[axis]=math.sin(a/2);q.append(v)
                samp=len(anim['samplers']);anim['samplers'].append({'input':time,'output':acc(q,'VEC4'),'interpolation':'LINEAR'})
                anim['channels'].append({'sampler':samp,'target':{'node':bone+2,'path':'rotation'}})
            animations.append(anim)
        doc['animations']=animations
    for label,pos in attachments or []:
        nodes[0]['children'].append(len(nodes));nodes.append({'name':label,'translation':pos})
    while len(blob)%4:blob.append(0)
    doc.update(buffers=[{'byteLength':len(blob)}],bufferViews=views,accessors=acs)
    data=json.dumps(doc,separators=(',',':')).encode();data+=b' '*((-len(data))%4)
    target=OUT/name;target.write_bytes(struct.pack('<4sII',b'glTF',2,28+len(data)+len(blob))+struct.pack('<I4s',len(data),b'JSON')+data+struct.pack('<I4s',len(blob),b'BIN\0')+blob)
    low=[min(p[i] for p in s.p) for i in range(3)];high=[max(p[i] for p in s.p) for i in range(3)]
    return {'file':name,'dimensions_m':[round(high[i]-low[i],3) for i in range(3)],'bounds_min':low,'bounds_max':high,'triangles':len(s.p)//3,'bytes':target.stat().st_size,'materials':['VertexPalette'],'textures':[], 'animations':[c[0] for c in clips or []]}

def building(w=8,h=10,d=5):
    s=Shape();s.box('brick' if h>10 else 'wall',(w,h,d),(0,h/2,0));s.box('trim',(w+.12,.28,d+.12),(0,h-.14,0))
    for y in (3.25,6.35):s.box('trim',(w+.06,.16,d+.06),(0,y,0))
    s.box('brick',(w,.35,.14),(0,.18,-d/2-.07))
    # Both front and flank have windows; three consistent storeys.
    for y in (4.8,8.0):
        for x in (-2.65,0,2.65):
            s.box('trim',(1.65,2.1,.12),(x,y,-d/2-.09));s.box('lit' if x==0 and y>7 else 'glass',(1.39,1.78,.035),(x,y,-d/2-.17))
            s.box('wall',(.075,1.8,.06),(x,y,-d/2-.2))
        for x in (-w/2,w/2):
            for z in (-1.25,1.25):s.box('glass',(.08,1.8,1.55),(x,y,z))
    s.box('trim',(w-.3,.65,.32),(0,2.9,-d/2-.16))
    s.box('glass',(1.2,2.45,.08),(-2.8,1.3,-d/2-.05))
    for x in (-.5,2.3):
        s.box('glass',(2.15,1.85,.10),(x,1.45,-d/2-.06))
        s.box('trim',(2.4,.13,.30),(x,.45,-d/2-.15))
    for x in (-3.85,3.85):s.box('amber',(.11,2.5,.2),(x,1.55,-d/2-.11))
    return s

def zombie():
    s=Shape()
    rig=[('Hips',-1,(0,.9,0)),('Spine',0,(0,1.03,0)),('Head',1,(0,1.5,-.09)),
         ('ArmL',1,(-.30,1.40,0)),('ForearmL',3,(-.38,1.13,-.03)),('ArmR',1,(.30,1.40,0)),('ForearmR',5,(.38,1.13,-.03)),
         ('ThighL',0,(-.15,.89,0)),('ShinL',7,(-.15,.48,0)),('ThighR',0,(.15,.89,0)),('ShinR',9,(.15,.48,0))]
    s.loft('jacket',[(0,.92,0,.46,.28),(0,1.08,-.02,.5,.3),(0,1.38,-.03,.66,.38),(0,1.49,-.05,.52,.30)],1)
    s.loft('cloth',[(0,.81,0,.41,.28),(0,.96,0,.49,.32)],0)
    # Open lapels, shirt, belt, torn hems and angular pockets.
    s.box('cloth',(.14,.40,.08),(0,1.21,-.22),1)
    for x in (-.17,.17):s.box('trim',(.15,.25,.065),(x,1.3,-.22),1)
    for x in (-.18,.18):s.box('metal',(.14,.08,.07),(x,1.12,-.2),1)
    s.box('wood',(.42,.05,.33),(0,.94,0),0)
    s.loft('skinDark',[(0,1.44,-.07,.18,.17),(0,1.59,-.11,.20,.18)],2)
    s.loft('skin',[(0,1.52,-.10,.19,.19),(0,1.61,-.115,.32,.30),(0,1.76,-.10,.36,.31),(0,1.83,-.08,.29,.27)],2)
    # Asymmetric swept hair and angular bangs.
    s.loft('hair',[(0,1.77,-.06,.38,.32),(-.035,1.86,-.02,.34,.30),(-.065,1.90,.01,.14,.12)],2)
    for x,y in [(-.13,1.74),(-.065,1.77),(.075,1.79)]:
        s.tri('hair',[(x-.07,1.81,-.24),(x+.06,1.82,-.23),(x-.015,y,-.26)],2)
    for x in (-.088,.088):
        s.box('hair',(.103,.037,.024),(x,1.713,-.265),2)
        s.box('eye',(.060,.015,.027),(x,1.701,-.271),2)
    s.tri('skinDark',[(-.024,1.70,-.26),(.027,1.65,-.30),(.035,1.65,-.24)],2)
    s.box('red',(.09,.021,.027),(.025,1.61,-.246),2)
    for sign,upper,lower,thigh,shin in [(-1,3,4,7,8),(1,5,6,9,10)]:
        x=sign*.34
        s.loft('jacket',[(x*1.12,1.08,-.03,.19,.22),(x*1.1,1.31,0,.23,.25),(x,1.44,0,.25,.28)],upper)
        s.loft('skinDark',[(x*1.12,.83,-.12,.12,.14),(x*1.16,1.1,-.03,.17,.18)],lower)
        s.loft('skin',[(x*1.1,.72,-.14,.12,.1),(x*1.12,.87,-.12,.15,.14)],lower)
        s.loft('cloth',[(sign*.15,.45,0,.21,.23),(sign*.15,.64,.02,.24,.25),(sign*.15,.86,0,.26,.28)],thigh)
        s.loft('jacket',[(sign*.15,.15,0,.16,.18),(sign*.15,.47,0,.21,.23)],shin)
        s.loft('hair',[(sign*.15,0,-.055,.22,.37),(sign*.15,.12,-.055,.23,.38),(sign*.15,.18,0,.16,.19)],shin)
    clips=[('Idle',2,[(1,2,[-.03,.03,-.03]),(2,0,[-.08,-.03,-.08])]),
           ('Walk',1.1,[(7,0,[-.36,.36,-.36]),(9,0,[.36,-.36,.36]),(8,0,[.1,.32,.1]),(10,0,[.32,.1,.32]),(3,0,[.22,-.22,.22]),(5,0,[-.22,.22,-.22]),(1,2,[-.045,.045,-.045])]),
           ('Attack',.5,[(3,0,[0,-1.0,-.2]),(5,0,[0,-.8,-.2])]),
           ('Hit',.23,[(1,0,[0,-.17,0])]),('Death',.65,[(0,0,[0,.7,1.52])])]
    return s,rig,clips

def bow():
    s=Shape()
    for sign in (-1,1):
        rings=[(0,.70+sign*y,z,w,.032) for y,z,w in [(0,0,.055),(.17,-.035,.045),(.37,-.115,.038),(.56,-.11,.024),(.68,-.015,.017)]]
        if sign<0:rings.reverse()
        s.loft('wood',rings,segments=4)
    s.loft('metal',[(0,.60,0,.075,.08),(0,.70,0,.06,.06),(0,.80,0,.065,.065)],segments=6)
    for y in (.61,.64,.67,.70,.73,.76):s.box('cloth',(.079,.014,.084),(0,y,0))
    s.box('metal',(.07,.017,.065),(-.045,.76,-.006))
    return s

def hand():
    s=Shape();s.loft('cloth',[(0,0,0,.14,.16),(0,.18,0,.12,.13),(0,.26,0,.105,.11)],segments=6)
    s.loft('hand',[(0,.24,0,.105,.11),(0,.33,-.018,.13,.10),(0,.38,-.035,.12,.08)],segments=6)
    for i in range(4):s.box('hand',(.027,.06,.065),(-.047+i*.032,.38,-.052))
    s.box('hand',(.053,.07,.07),(.073,.325,-.04));return s

def main():
    replacements={}
    for name,shape in [('la-city-storefront-facade.glb',building()),('la-city-corner-facade.glb',building(h=12)),('la-bow-recurve-pov.glb',bow()),('la-hand-grip.glb',hand()),('la-hand-draw.glb',hand())]:
        attachments=[('LimbTipUpper',[0,1.38,-.015]),('LimbTipLower',[0,.02,-.015]),('ArrowRest',[-.045,.76,0]),('Nock',[-.045,.76,.16])] if 'bow' in name else None
        replacements[name]=write(name,shape,attachments=attachments)
    s,rig,clips=zombie();replacements['la-zombie-shambler-anime.glb']=write('la-zombie-shambler-anime.glb',s,rig,clips)
    # Re-read originals to retain descriptions without retaining stale dimensions.
    old=json.loads((OUT/'manifest.json').read_text());rows=[]
    for row in old:
        if row['file'] in replacements:
            new=replacements.pop(row['file']);new['description']=row.get('description',row['file']);row=new
        rows.append(row)
    rows+=list(replacements.values())
    descriptions={'la-city-storefront-facade.glb':'Three-storey storefront building with windows on both flanks', 'la-city-corner-facade.glb':'Four-storey brick corner block with windows on both flanks', 'la-zombie-shambler-anime.glb':'Faceted worker shambler, humanoid rig and five in-place clips', 'la-bow-recurve-pov.glb':'Slim recurve bow with grip and named string/arrow attachments', 'la-hand-grip.glb':'Separate gloved-sleeve grip hand', 'la-hand-draw.glb':'Separate gloved-sleeve draw hand'}
    for row in rows:
        row['description']=descriptions.get(row['file'],row.get('description',row['file']));row.setdefault('textures',[]);row.setdefault('animations',[])
    (OUT/'manifest.json').write_text(json.dumps(rows,indent=2))
    lines=['# V2.5 reusable assets — Stage 8 revision','','Metres, Y-up. Each GLB contains its own geometry and colours. No bitmap textures.','', '| File | Dimensions (X × Y × Z) | Triangles | KB | Animation |','|---|---|---:|---:|---|']
    for row in rows:lines.append('| '+row['file']+' | '+' × '.join(str(round(v,3)) for v in row['dimensions_m'])+' | '+str(row['triangles'])+' | '+str(round(row['bytes']/1024,1))+' | '+', '.join(row.get('animations',[]))+' |')
    lines+=['','Character uses a humanoid skeleton with rigid weights and five in-place clips. Bow strings/arrows are dynamic runtime attachments.','The Blender import recipe rebuilds the editable scene from these exact GLBs. The old copied .blend starter is not an authored V2.5 source.']
    (OUT/'manifest.md').write_text('\n'.join(lines)+'\n');print(json.dumps([{'file':r['file'],'triangles':r['triangles'],'bytes':r['bytes']} for r in rows]))

if __name__=='__main__':main()
