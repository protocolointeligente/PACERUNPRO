import json
import re
import unicodedata
from pathlib import Path

import pandas as pd

source_dir = Path(r"C:\Users\pc\enky\enky\videos Treinamento Funcional")
output_path = Path(__file__).parents[1] / "public" / "exercises.json"
catalog = pd.read_excel(source_dir / "catalogo_videos_treinamento_funcional_enky.xlsx", sheet_name="Videos catalogados")
library = json.loads(output_path.read_text(encoding="utf-8"))


def norm(value: object) -> str:
    folded = unicodedata.normalize("NFD", str(value)).encode("ascii", "ignore").decode()
    return re.sub(r"[^a-z0-9]", "", folded.lower())


by_name = {norm(item.get("name", "")): item for item in library}
added = 0
updated = 0

for _, row in catalog.iterrows():
    name = str(row.get("Exercicio", "")).strip()
    url = row.get("Link YouTube")
    if not name or pd.isna(url):
        continue

    url = str(url).strip()
    item = by_name.get(norm(name))
    if item is None:
        source_id = row.get("ID")
        item = {
            "id": f"enky-video-{int(source_id):03d}",
            "name": name,
            "category": "Funcional e HIT",
            "gifUrl": None,
            "imageUrl": None,
            "description": str(row.get("Para que serve", "") or ""),
            "youtubeUrl": url,
        }
        library.append(item)
        by_name[norm(name)] = item
        added += 1
    elif item.get("youtubeUrl") != url:
        item["youtubeUrl"] = url
        updated += 1

output_path.write_text(json.dumps(library, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(f"added={added} updated={updated} total={len(library)}")
