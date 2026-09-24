"""Replace only the foreground asset; preserve V2.6 world and gameplay byte-for-byte."""
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
html=(ROOT/'prototypes/v2.6-hero-slice.html').read_text(encoding='utf-8')
old=(ROOT/'prototypes/v2.6-weapon.js').read_text(encoding='utf-8')
new=(ROOT/'prototypes/v2.6.1-weapon.js').read_text(encoding='utf-8')
assert html.count(old)==1,'V2.6 weapon source must match its generated preview'
html=html.replace(old,new,1).replace('Last Archer V2.6 — Nakamachi','Last Archer V2.6.1 — Bow & hands study')
html=html.replace('LAST ARCHER / V2.6</div>','LAST ARCHER / V2.6.1</div>')
html=html.replace('Local visual preview</div>','Bow & hands study · local preview</div>')
target=ROOT/'prototypes/v2.6.1-bow-study.html'
target.write_text(html,encoding='utf-8')
print(f'{target.name}: {target.stat().st_size/1024:.0f} KiB')
