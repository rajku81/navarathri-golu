# Navarathri · Our Golu

Our family's Navarathri and Golu website. All writing is Archana's.

## Adding things from your phone (no computer needed)

1. Open **https://app.pagescms.org** in Safari and sign in with GitHub.
   (Tip: Share → Add to Home Screen, so it opens like an app.)
2. Pick this site, then:
   - **Blog posts** → **Add entry**: title, date, cover photo, more photos, write the post, **Save**.
   - **Photos by year** → open a year (or **Add entry** for a new year) → add photos → **Save**.
   - **Golu doll stories** → add or edit a doll story.
3. The website updates by itself in about a minute.

iPhone photos are shrunk automatically after upload (and HEIC photos are converted to JPEG),
so you can upload straight from the camera roll.

## How it fits together

| Folder | What's in it |
|---|---|
| `content/blog-2012.json` | Archana's 2012 Navarathri post (landing page), word for word |
| `content/stories/` | Archana's Golu doll story cards, word for word |
| `content/years/` | Photo list for each year (the carousel) |
| `content/posts/` | Blog posts (Markdown) |
| `media/` | All photos |
| `public/` | Page design: `index.html`, `styles.css`, `app.js` |
| `scripts/build.mjs` | Builds the site into `dist/` (Vercel runs this) |
| `scripts/optimize-images.mjs` | Shrinks uploaded photos (GitHub runs this) |
| `.pages.yml` | Settings for the phone editor (Pages CMS) |

## On a computer

```
npm install
npm run preview     # builds and serves at http://localhost:8765
```

Add a whole folder of photos sorted into year folders (2005, 2006, …):

```
python3 tools/add_photos.py "/path/to/folder/with/year/folders"
```
