from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
source = ROOT / "prototypes" / "v2.6-hero-slice.html"
old_weapon = ROOT / "prototypes" / "v2.6-weapon.js"
new_weapon = ROOT / "prototypes" / "v2.8-arm-motion.js"
target = ROOT / "prototypes" / "v2.8-arm-motion.html"

html = source.read_text(encoding="utf-8")
old = old_weapon.read_text(encoding="utf-8")
new = new_weapon.read_text(encoding="utf-8")
count = html.count(old)
if count != 1:
    raise RuntimeError(f"Expected one V2.6 weapon block, found {count}.")

html = html.replace(old, new, 1)
html = html.replace("Last Archer V2.6 — Nakamachi", "Last Archer V2.8a — First-Person Arm Motion")
html = html.replace("LAST ARCHER / V2.6", "LAST ARCHER / V2.8a")
html = html.replace("Local visual preview", "First-person arm motion · local preview")
target.write_text(html, encoding="utf-8")
print(target)
