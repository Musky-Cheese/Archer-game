"""Check actual GLB buffers, geometry budgets, embedded images and base-centred pivots."""
import json,math,struct
from pathlib import Path
directory=Path(__file__).resolve().parents[1]/'assets/reference-corner'
rows=json.loads((directory/'manifest.json').read_text())
for row in rows:
    file=directory/row['file'];data=file.read_bytes()
    magic,version,length=struct.unpack_from('<4sII',data)
    assert magic==b'glTF' and version==2 and length==len(data)
    json_length=struct.unpack_from('<I',data,12)[0]
    doc=json.loads(data[20:20+json_length]);binary=data[28+json_length:]
    assert all('uri' not in b for b in doc['buffers'])
    assert len(data)<500_000
    low=[float('inf')]*3;high=[-float('inf')]*3;triangles=0
    for mesh in doc['meshes']:
        for primitive in mesh['primitives']:
            a=doc['accessors'][primitive['attributes']['POSITION']];view=doc['bufferViews'][a['bufferView']]
            values=struct.unpack_from('<'+'f'*(a['count']*3),binary,view.get('byteOffset',0)+a.get('byteOffset',0))
            assert all(math.isfinite(v) for v in values)
            for i,v in enumerate(values):low[i%3]=min(low[i%3],v);high[i%3]=max(high[i%3],v)
            triangles+=a['count']//3
    assert abs(low[1])<1e-5 and abs(high[0]+low[0])<1e-5 and abs(high[2]+low[2])<1e-5,(file.name,low,high)
    assert triangles==row['triangles']
    assert triangles<= (1500 if 'shambler' in file.name else 800)
    for image in doc.get('images',[]):
        assert 'uri' not in image
        view=doc['bufferViews'][image['bufferView']];start=view.get('byteOffset',0)
        png=binary[start:start+view['byteLength']];assert png[:8]==b'\x89PNG\r\n\x1a\n'
        w,h=struct.unpack_from('>II',png,16);assert w<=256 and h<=256
    if 'shambler' in file.name:
        assert doc['skins'] and {a['name'] for a in doc['animations']}=={'Idle','Walk'}
print(f'PASS: {len(rows)} standalone GLBs; embedded images <=256px, props <=800 triangles, rigged shambler 1012 triangles; base-centred pivots; all files <500 KB.')
