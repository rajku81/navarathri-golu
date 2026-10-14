// Shrinks photos in media/ so iPhone uploads load fast on the website.
//  - HEIC/HEIF photos are converted to JPEG (needs `heif-convert`, installed by the GitHub workflow)
//  - photos bigger than 2000px or 900 KB are resized to 2000px on the long side
//  - references to renamed files (.heic -> .jpg) are updated in content/
// Runs automatically on GitHub after photos are uploaded. Run locally: npm run optimize-images
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const MAX = 2000, MAX_BYTES = 900 * 1024;

const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
  const p = path.join(dir, e.name);
  return e.isDirectory() ? walk(p) : [p];
});
const webPath = (abs) => "/" + path.relative(root, abs).split(path.sep).join("/");

const renames = new Map();
let changed = 0;

for (const file of walk(path.join(root, "media"))) {
  const ext = path.extname(file).toLowerCase();
  let src = file;

  if (ext === ".heic" || ext === ".heif") {
    const jpg = file.replace(/\.(heic|heif)$/i, ".jpg");
    execFileSync("heif-convert", ["-q", "90", file, jpg], { stdio: "ignore" });
    fs.rmSync(file);
    renames.set(webPath(file), webPath(jpg));
    src = jpg;
    changed++;
  } else if (![".jpg", ".jpeg", ".png", ".webp"].includes(ext)) {
    continue;
  }

  const meta = await sharp(src).metadata();
  const big = Math.max(meta.width || 0, meta.height || 0) > MAX || fs.statSync(src).size > MAX_BYTES;
  if (!big) continue;

  let img = sharp(src).rotate().resize({ width: MAX, height: MAX, fit: "inside", withoutEnlargement: true });
  const e = path.extname(src).toLowerCase();
  img = e === ".png" ? img.png({ compressionLevel: 9 }) : e === ".webp" ? img.webp({ quality: 82 }) : img.jpeg({ quality: 82, mozjpeg: true });
  const buf = await img.toBuffer();
  fs.writeFileSync(src, buf);
  console.log(`resized ${webPath(src)} -> ${Math.round(buf.length / 1024)} KB`);
  changed++;
}

if (renames.size) {
  for (const file of walk(path.join(root, "content"))) {
    let text = fs.readFileSync(file, "utf8"), before = text;
    for (const [from, to] of renames) text = text.split(from).join(to);
    if (text !== before) fs.writeFileSync(file, text);
  }
}
console.log(changed ? `Optimized ${changed} photo(s).` : "All photos already web-sized.");
