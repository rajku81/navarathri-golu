// Builds the website into dist/.
//   public/   page, styles and script (copied as is)
//   media/    photos (copied to /media)
//   content/  words and photo lists (bundled into /data.js)
// Run: npm run build
import fs from "node:fs";
import path from "node:path";
import yaml from "js-yaml";
import { marked } from "marked";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");
const read = (p) => fs.readFileSync(path.join(root, p), "utf8");
const list = (dir, ext) => {
  const d = path.join(root, dir);
  return fs.existsSync(d) ? fs.readdirSync(d).filter((f) => f.endsWith(ext)).sort() : [];
};
const slugOf = (f) => path.basename(f).replace(/\.[^.]+$/, "");

// ---- Archana's 2012 post ----
const blog = JSON.parse(read("content/blog-2012.json"));
blog.photos = blog.photos.map((p) => ({ src: p.image, alt: p.caption || "Golu 2012" }));

// ---- Golu doll stories ----
const stories = list("content/stories", ".json")
  .map((f) => {
    const s = JSON.parse(read(`content/stories/${f}`));
    const clean = (a) => (a || []).map((x) => String(x).trim()).filter(Boolean);
    const items = (s.items || []).filter((it) => it && it.name);
    return {
      slug: slugOf(f),
      title: s.title,
      step: Math.min(3, Math.max(1, Number(s.step) || 3)),
      order: Number.isFinite(Number(s.order)) && s.order !== "" ? Number(s.order) : 99,
      doll: s.doll || null,
      card: s.card || null,
      bg: s.bg || "#fff7ea",
      ink: s.ink || "#6d1426",
      quotes: clean(s.quotes),
      intro: clean(s.intro),
      list: items.length ? { items } : null,
      subtitle: s.subtitle || "",
      body: clean(s.body),
      closing: s.closing || "",
      tileMark: s.tileMark || "",
      tileNote: s.tileNote || "",
      sourceLabel: s.sourceLabel || "",
      sourceUrl: s.sourceUrl || ""
    };
  })
  .sort((a, b) => a.step - b.step || a.order - b.order);

// ---- Photos by year ----
const photos = {};
for (const f of list("content/years", ".json")) {
  const y = JSON.parse(read(`content/years/${f}`));
  const year = String(y.year || slugOf(f));
  const ps = (y.photos || [])
    .map((p) => (typeof p === "string" ? { image: p } : p))
    .filter((p) => p && p.image)
    .map((p) => ({ src: p.image, alt: p.caption || `Golu ${year}` }));
  if (ps.length) photos[year] = (photos[year] || []).concat(ps);
}

// ---- Blog posts (Markdown with front matter) ----
const posts = list("content/posts", ".md")
  .map((f) => {
    const raw = read(`content/posts/${f}`);
    const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
    const meta = m ? yaml.load(m[1]) || {} : {};
    const body = (m ? m[2] : raw).trim();
    if (meta.draft) return null;
    const date = meta.date ? new Date(meta.date) : null;
    const gallery = [].concat(meta.photos || []).filter(Boolean).map((p) => (typeof p === "string" ? p : p.image)).filter(Boolean);
    return {
      slug: slugOf(f),
      title: meta.title || slugOf(f),
      date: date && !isNaN(date) ? date.toISOString().slice(0, 10) : "",
      author: meta.author || "",
      cover: meta.cover || gallery[0] || null,
      photos: gallery,
      html: /<\/?(p|h\d|ul|ol|img|br)\b/i.test(body) ? body : marked.parse(body)
    };
  })
  .filter(Boolean)
  .sort((a, b) => (b.date || "").localeCompare(a.date || ""));

// ---- Festival dates and Meet Archana ----
const festival = JSON.parse(read("content/festival.json"));
const archana = JSON.parse(read("content/archana.json"));

// ---- Recipes ----
const recipes = list("content/recipes", ".json")
  .map((f) => {
    const r = JSON.parse(read(`content/recipes/${f}`));
    const clean = (a) => (a || []).map((x) => String(x).trim()).filter(Boolean);
    return { ...r, slug: slugOf(f), order: Number(r.order) || 99,
      story: clean(r.story), ingredients: clean(r.ingredients), steps: clean(r.steps) };
  })
  .sort((a, b) => a.order - b.order);

const recipesIntro = fs.existsSync(path.join(root, "content/recipes-intro.json")) ? JSON.parse(read("content/recipes-intro.json")) : null;

// ---- Testimonials (approved notes from guests) ----
const testimonials = list("content/testimonials", ".json")
  .map((f) => JSON.parse(read(`content/testimonials/${f}`)))
  .filter((t) => t && t.name && t.message && !t.hidden)
  .map((t) => ({ name: t.name, message: t.message, publishedAt: t.publishedAt || t.submittedAt, featured: !!t.featured }))
  .sort((a, b) => String(b.publishedAt).localeCompare(String(a.publishedAt)));

// ---- This year's update (shown near the top of the home page) ----
const update = fs.existsSync(path.join(root, "content/update.json")) ? JSON.parse(read("content/update.json")) : null;

// ---- Concert (videos + photos) ----
const concertRaw = fs.existsSync(path.join(root, "content/concert.json")) ? JSON.parse(read("content/concert.json")) : null;
const concert = concertRaw && concertRaw.show !== false ? concertRaw : null;

// ---- write dist ----
fs.rmSync(dist, { recursive: true, force: true });
fs.cpSync(path.join(root, "public"), dist, { recursive: true });
fs.cpSync(path.join(root, "media"), path.join(dist, "media"), { recursive: true });
const json = (v) => JSON.stringify(v).replace(/</g, "\\u003c");
fs.writeFileSync(path.join(dist, "data.js"),
  `window.BLOG=${json(blog)};\nwindow.STORIES=${json(stories)};\nwindow.PHOTOS=${json(photos)};\nwindow.POSTS=${json(posts)};\nwindow.FESTIVAL=${json(festival)};\nwindow.ARCHANA=${json(archana)};\nwindow.RECIPES=${json(recipes)};\nwindow.RECIPES_INTRO=${json(recipesIntro)};\nwindow.TESTIMONIALS=${json(testimonials)};\nwindow.CONCERT=${json(concert)};\nwindow.UPDATE=${json(update && update.show !== false ? (({ asideDraft, ...u }) => u)(update) : null)};\n`);

console.log(`Built: ${stories.length} stories, ${recipes.length} recipes, ${testimonials.length} testimonials, ${Object.keys(photos).length} photo years, ${posts.length} posts`);
