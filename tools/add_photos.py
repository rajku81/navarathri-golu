#!/usr/bin/env python3
"""Add Golu photos from year folders on this Mac.

1. Put photos in folders named by year, e.g.
       navrathri/photo-originals/2005/...jpg
       navrathri/photo-originals/2019/...jpg
   (or pass a different folder: python3 tools/add_photos.py ~/Pictures/Golu)
2. From the site folder run:  python3 tools/add_photos.py
3. Commit and push (or ask Claude to) — the website updates by itself.

Photos are resized (2000px long side, macOS `sips`) into media/<year>/ and
listed in content/years/<year>.json. Existing photos and captions are kept.
"""
import json, os, re, subprocess, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))   # site/
SRC = os.path.abspath(os.path.expanduser(sys.argv[1])) if len(sys.argv) > 1 else os.path.join(os.path.dirname(ROOT), "photo-originals")
EXTS = (".jpg", ".jpeg", ".png", ".heic", ".webp")

def main():
    if not os.path.isdir(SRC):
        sys.exit(f"No folder {SRC}\nCreate it with one sub-folder per year (e.g. 2015) and try again.")
    for year in sorted(os.listdir(SRC)):
        ydir = os.path.join(SRC, year)
        if not (re.fullmatch(r"\d{4}", year) and os.path.isdir(ydir)):
            continue
        manifest = os.path.join(ROOT, "content", "years", f"{year}.json")
        data = json.load(open(manifest, encoding="utf-8")) if os.path.exists(manifest) else {"year": int(year), "photos": []}
        have = {p["image"] for p in data["photos"]}
        os.makedirs(os.path.join(ROOT, "media", year), exist_ok=True)
        added = 0
        for name in sorted(os.listdir(ydir)):
            if not name.lower().endswith(EXTS):
                continue
            base = re.sub(r"[^a-z0-9]+", "-", os.path.splitext(name)[0].lower()).strip("-")
            web = f"/media/{year}/{base}.jpg"
            if web in have:
                continue
            subprocess.run(["sips", "-s", "format", "jpeg", "-s", "formatOptions", "82", "-Z", "2000",
                            os.path.join(ydir, name), "--out", os.path.join(ROOT, web.lstrip("/"))],
                           check=True, stdout=subprocess.DEVNULL)
            data["photos"].append({"image": web, "caption": ""})
            added += 1
        with open(manifest, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False); f.write("\n")
        print(f"{year}: +{added} (total {len(data['photos'])})")

if __name__ == "__main__":
    main()
