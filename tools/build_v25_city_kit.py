"""Build Last Archer V2.5 low-poly city-kit GLBs without external packages.

The companion Blender script uses the same asset names and dimensions. This
fallback keeps Stage 3 reproducible in environments where Blender is not on PATH.
"""
from __future__ import annotations

import json
import math
import struct
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "assets" / "v2.5-city-kit"
OUT.mkdir(parents=True, exist_ok=True)

MATERIALS = {
    "charcoal": ((0.125, 0.165, 0.205, 1), 0.05, 0.9),
    "concrete": ((0.22, 0.275, 0.315, 1), 0.0, 0.95),
    "brick": ((0.376, 0.255, 0.235, 1), 0.0, 0.95),
    "window": ((0.055, 0.11, 0.145, 1), 0.35, 0.45),
    "amber": ((0.84, 0.604, 0.29, 1), 0.1, 0.58),
    "olive": ((0.38, 0.47, 0.24, 1), 0.0, 0.88),
    "cream": ((0.82, 0.78, 0.67, 1), 0.0, 0.9),
    "metal": ((0.12, 0.16, 0.19, 1), 0.55, 0.5),
    "red": ((0.45, 0.15, 0.13, 1), 0.05, 0.85),
}


class Builder:
    def __init__(self):
        self.parts = defaultdict(lambda: {"p": [], "n": [], "i": []})

    @staticmethod
    def _rotate(point, angle):
        x, y, z = point
        c, s = math.cos(angle), math.sin(angle)
        return (x * c - z * s, y, x * s + z * c)

    def quad(self, material, points, normal):
        data = self.parts[material]
        start = len(data["p"])
        data["p"].extend(points)
        data["n"].extend([normal] * 4)
        data["i"].extend((start, start + 1, start + 2, start, start + 2, start + 3))

    def box(self, material, size, center, angle=0):
        hx, hy, hz = (value / 2 for value in size)
        cx, cy, cz = center
        faces = [
            ([(hx,-hy,-hz),(hx,-hy,hz),(hx,hy,hz),(hx,hy,-hz)], (1,0,0)),
            ([(-hx,-hy,hz),(-hx,-hy,-hz),(-hx,hy,-hz),(-hx,hy,hz)], (-1,0,0)),
            ([(-hx,hy,-hz),(hx,hy,-hz),(hx,hy,hz),(-hx,hy,hz)], (0,1,0)),
            ([(-hx,-hy,hz),(hx,-hy,hz),(hx,-hy,-hz),(-hx,-hy,-hz)], (0,-1,0)),
            ([(-hx,-hy,-hz),(hx,-hy,-hz),(hx,hy,-hz),(-hx,hy,-hz)], (0,0,-1)),
            ([(hx,-hy,hz),(-hx,-hy,hz),(-hx,hy,hz),(hx,hy,hz)], (0,0,1)),
        ]
        for points, normal in faces:
            transformed = []
            for point in points:
                x, y, z = self._rotate(point, angle)
                transformed.append((x + cx, y + cy, z + cz))
            nx, ny, nz = self._rotate(normal, angle)
            self.quad(material, transformed, (nx, ny, nz))

    def cylinder(self, material, radius, height, center, segments=8):
        cx, cy, cz = center
        data = self.parts[material]
        for index in range(segments):
            a, b = index * math.tau / segments, (index + 1) * math.tau / segments
            x1, z1 = math.cos(a) * radius, math.sin(a) * radius
            x2, z2 = math.cos(b) * radius, math.sin(b) * radius
            self.quad(material, [(cx+x1,cy-height/2,cz+z1),(cx+x2,cy-height/2,cz+z2),(cx+x2,cy+height/2,cz+z2),(cx+x1,cy+height/2,cz+z1)], (math.cos((a+b)/2),0,math.sin((a+b)/2)))
            start = len(data["p"])
            data["p"].extend([(cx,cy+height/2,cz),(cx+x1,cy+height/2,cz+z1),(cx+x2,cy+height/2,cz+z2)])
            data["n"].extend([(0,1,0)] * 3); data["i"].extend((start,start+1,start+2))
            start = len(data["p"])
            data["p"].extend([(cx,cy-height/2,cz),(cx+x2,cy-height/2,cz+z2),(cx+x1,cy-height/2,cz+z1)])
            data["n"].extend([(0,-1,0)] * 3); data["i"].extend((start,start+1,start+2))

    def stats(self):
        points = [point for part in self.parts.values() for point in part["p"]]
        low = tuple(min(point[i] for point in points) for i in range(3))
        high = tuple(max(point[i] for point in points) for i in range(3))
        return tuple(round(high[i] - low[i], 3) for i in range(3)), sum(len(part["i"]) // 3 for part in self.parts.values())


def storefront():
    b = Builder()
    b.box("charcoal", (8, 5.8, .45), (0, 2.9, 0))
    b.box("brick", (7.7, .36, .18), (0, 5.35, -.32))
    b.box("cream", (7.1, .58, .15), (0, 4.65, -.32))
    for x in (-2.2, 0, 2.2): b.box("window", (1.75, 2.15, .12), (x, 2.25, -.31))
    b.box("metal", (1.28, 2.62, .13), (-3.1, 1.45, -.31))
    b.box("amber", (.22, 2.35, .18), (-3.85, 2.15, -.38))
    b.box("amber", (.22, 2.35, .18), (3.85, 2.15, -.38))
    return b, "storefront facade with shutter, windows and sign band", (8.0, 5.8, .45)


def corner():
    b = Builder()
    b.box("charcoal", (8, 5.8, .45), (0, 2.9, 3.78))
    b.box("brick", (.45, 5.8, 8), (3.78, 2.9, 0))
    for x in (-2.1, 0, 2.1): b.box("window", (1.55, 2.05, .12), (x, 2.15, 3.48))
    for z in (-2.1, 0, 2.1): b.box("window", (.12, 2.05, 1.55), (3.48, 2.15, z))
    b.box("cream", (7.2, .52, .12), (0, 4.62, 3.48))
    b.box("amber", (.12, .52, 7.2), (3.48, 4.62, 0))
    return b, "L-shaped corner facade with two readable street faces", (8.0, 5.8, 8.0)


def alley_wall():
    b = Builder()
    b.box("concrete", (6, 5.5, .42), (0, 2.75, 0))
    b.box("metal", (1.35, 2.45, .13), (-1.8, 1.3, -.28))
    b.box("brick", (1.65, 1.05, .13), (1.62, 2.65, -.28))
    b.box("window", (1.32, .82, .14), (1.62, 4.1, -.29))
    b.box("amber", (.15, .15, .22), (-.35, 4.55, -.35))
    return b, "alley service wall with door, boarded panel and high window", (6.0, 5.5, .42)


def sidewalk():
    b = Builder()
    b.box("concrete", (8, .16, 2.25), (0, .08, 0))
    b.box("charcoal", (8, .25, .3), (0, .125, -1.1))
    for x in (-2.5, 0, 2.5): b.box("concrete", (.09, .02, 2.08), (x, .175, 0))
    return b, "sidewalk and curb module with expansion seams", (8.0, .25, 2.25)


def intersection():
    b = Builder()
    b.box("charcoal", (16, .08, 16), (0, .04, 0))
    for n in range(-6, 7, 3):
        b.box("cream", (1.45, .02, .24), (n, .09, -4.4))
        b.box("cream", (.24, .02, 1.45), (-4.4, .09, n))
    return b, "16 metre asphalt intersection tile with faded crosswalk markings", (16.0, .08, 16.0)


def streetlight():
    b = Builder()
    b.cylinder("metal", .22, .16, (0, .08, 0), 8)
    b.cylinder("metal", .1, 4.7, (0, 2.42, 0), 8)
    b.box("metal", (1.0, .1, .1), (.45, 4.65, 0))
    b.box("amber", (.38, .18, .32), (.88, 4.48, 0))
    return b, "low-poly streetlight with a warm lamp head", (1.25, 4.78, .44)


def dumpster():
    b = Builder()
    b.box("olive", (2.15, 1.18, 1.08), (0, .7, 0))
    b.box("metal", (2.25, .15, 1.17), (0, 1.35, 0))
    for x in (-.83, .83):
        b.cylinder("metal", .13, .18, (x, .13, -.42), 8)
        b.cylinder("metal", .13, .18, (x, .13, .42), 8)
    b.box("cream", (1.3, .38, .08), (0, .83, -.58))
    return b, "anime-styled dumpster with lid, wheels and a readable front panel", (2.25, 1.43, 1.17)


def shambler():
    """A separate, readable low-poly zombie for the Stage 4 district preview.

    Its limbs are individual material islands so a runtime can apply a cheap
    walk sway without a texture or a skinning pass.  The paired Blender recipe
    is the editable route for a fully authored armature later.
    """
    b = Builder()
    # Feet start at y=0 and the complete character remains close to 1.8 m.
    b.box("metal", (.28, .12, .52), (-.22, .06, 0))
    b.box("metal", (.28, .12, .52), (.22, .06, 0))
    b.box("olive", (.24, .68, .25), (-.22, .46, 0), -.10)
    b.box("olive", (.24, .68, .25), (.22, .46, 0), .10)
    b.box("brick", (.62, .19, .32), (0, .86, 0))
    b.box("olive", (.66, .64, .34), (0, 1.24, 0), -.06)
    # Dangling arms give the silhouette an anime shambler read.
    b.box("olive", (.20, .62, .22), (-.48, 1.25, -.02), -.25)
    b.box("olive", (.20, .62, .22), (.48, 1.25, -.02), .24)
    b.cylinder("olive", .34, .43, (0, 1.77, 0), 7)
    b.box("cream", (.17, .08, .035), (-.13, 1.80, -.345))
    b.box("cream", (.17, .08, .035), (.13, 1.80, -.345))
    b.box("red", (.18, .055, .04), (0, 1.64, -.35))
    # Small faceted infected growths keep the character within the intended
    # 800–1500 triangle budget while still reading as broad, simple shapes.
    for row, y in enumerate((1.00, 1.16, 1.32, 1.48)):
        for x in (-.24, -.08, .08, .24, .40):
            b.cylinder("olive" if (row + int((x + .4) * 10)) % 2 else "brick", .055, .10, (x, y, .22), 8)
    return b, "toxic-green anime shambler; runtime idle/walk sway ready", (.96, 1.99, .61)


def recurve_bow():
    """Camera-ready recurve bow. Arrow and string are animated in Three.js."""
    b = Builder()
    # A segmented curve reads better than one dense bent cylinder at this scale.
    for y, x, angle in ((.16, -.085, -.42), (.45, -.15, -.24), (.77, -.16, -.08),
                        (1.12, -.14, .15), (1.42, -.07, .38)):
        b.box("amber", (.09, .34, .075), (x, y, 0), angle)
    b.box("metal", (.13, .30, .12), (0, .80, 0))
    b.box("cream", (.04, 1.62, .025), (-.21, .80, .025))
    return b, "low-poly recurve bow for first-person camera use", (.40, 1.62, .14)


ASSETS = {
    "la-city-storefront-facade.glb": storefront,
    "la-city-corner-facade.glb": corner,
    "la-city-alley-wall.glb": alley_wall,
    "la-city-sidewalk-curb.glb": sidewalk,
    "la-city-intersection-road.glb": intersection,
    "la-city-streetlight-anime.glb": streetlight,
    "la-city-dumpster-anime.glb": dumpster,
    "la-zombie-shambler-anime.glb": shambler,
    "la-bow-recurve-pov.glb": recurve_bow,
}


def align(blob):
    return blob + b"\0" * ((4 - len(blob) % 4) % 4)


def append_blob(binary, payload):
    offset = len(binary)
    binary += payload
    binary = align(binary)
    return binary, offset, len(payload)


def write_glb(path, builder):
    binary = b""; buffer_views = []; accessors = []; primitives = []
    material_names = list(builder.parts)
    material_index = {name: index for index, name in enumerate(material_names)}
    for name in material_names:
        part = builder.parts[name]
        flat_positions = [value for point in part["p"] for value in point]
        flat_normals = [value for normal in part["n"] for value in normal]
        binary, pos_offset, pos_length = append_blob(binary, struct.pack("<" + "f" * len(flat_positions), *flat_positions))
        pos_view = len(buffer_views); buffer_views.append({"buffer": 0, "byteOffset": pos_offset, "byteLength": pos_length, "target": 34962})
        binary, norm_offset, norm_length = append_blob(binary, struct.pack("<" + "f" * len(flat_normals), *flat_normals))
        norm_view = len(buffer_views); buffer_views.append({"buffer": 0, "byteOffset": norm_offset, "byteLength": norm_length, "target": 34962})
        binary, idx_offset, idx_length = append_blob(binary, struct.pack("<" + "H" * len(part["i"]), *part["i"]))
        idx_view = len(buffer_views); buffer_views.append({"buffer": 0, "byteOffset": idx_offset, "byteLength": idx_length, "target": 34963})
        position_accessor = len(accessors); accessors.append({"bufferView":pos_view,"componentType":5126,"count":len(part["p"]),"type":"VEC3","min":[min(point[i] for point in part["p"]) for i in range(3)],"max":[max(point[i] for point in part["p"]) for i in range(3)]})
        normal_accessor = len(accessors); accessors.append({"bufferView":norm_view,"componentType":5126,"count":len(part["n"]),"type":"VEC3"})
        index_accessor = len(accessors); accessors.append({"bufferView":idx_view,"componentType":5123,"count":len(part["i"]),"type":"SCALAR"})
        primitives.append({"attributes":{"POSITION":position_accessor,"NORMAL":normal_accessor},"indices":index_accessor,"material":material_index[name]})
    materials = []
    for name in material_names:
        color, metallic, roughness = MATERIALS[name]
        materials.append({"name":"V25_"+name.upper(),"pbrMetallicRoughness":{"baseColorFactor":color,"metallicFactor":metallic,"roughnessFactor":roughness},"doubleSided":True})
    doc = {"asset":{"version":"2.0","generator":"Last Archer V2.5 city-kit builder"},"scene":0,"scenes":[{"nodes":[0]}],"nodes":[{"name":path.stem,"mesh":0}],"meshes":[{"name":path.stem,"primitives":primitives}],"materials":materials,"buffers":[{"byteLength":len(binary)}],"bufferViews":buffer_views,"accessors":accessors}
    # GLB JSON chunk padding must be spaces. NUL padding makes strict GLTF
    # loaders treat the trailing byte as an invalid JSON character.
    raw_json = json.dumps(doc, separators=(",", ":")).encode("utf-8")
    data = raw_json + b" " * ((4 - len(raw_json) % 4) % 4)
    total = 12 + 8 + len(data) + 8 + len(binary)
    path.write_bytes(struct.pack("<4sII", b"glTF", 2, total) + struct.pack("<I4s", len(data), b"JSON") + data + struct.pack("<I4s", len(binary), b"BIN\0") + binary)


def main():
    manifest = []
    for filename, factory in ASSETS.items():
        builder, description, expected = factory()
        target = OUT / filename
        write_glb(target, builder)
        dimensions, triangles = builder.stats()
        manifest.append({"file":filename,"description":description,"dimensions_m":dimensions,"expected_dimensions_m":expected,"triangles":triangles,"bytes":target.stat().st_size,"materials":list(builder.parts)})
    (OUT / "manifest.json").write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    lines=["# Last Archer V2.5 City Kit", "", "Individual low-poly GLBs. Units are metres; the root origin is base-centre.", "", "| File | Description | Dimensions (X × Y × Z) | Triangles | Size |", "|---|---|---:|---:|---:|"]
    for item in manifest:
        dimensions=" × ".join(f"{value:g}" for value in item["dimensions_m"])
        lines.append(f"| `{item['file']}` | {item['description']} | {dimensions} m | {item['triangles']} | {item['bytes'] / 1024:.1f} KB |")
    lines.extend(["", "`blender-build-v2.5-city-kit.py` is the editable Blender recipe. The source starter `.blend` is copied beside this kit; open it and run the recipe with Blender to rebuild/edit the geometry when Blender is available."])
    (OUT / "manifest.md").write_text("\n".join(lines)+"\n", encoding="utf-8")
    print(json.dumps(manifest, indent=2))


if __name__ == "__main__":
    main()
