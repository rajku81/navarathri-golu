// GET  /api/moderate?a=publish|feature|reject&d=…&s=…  -> confirmation page
// POST /api/moderate (same fields)                       -> does it
// The GET only shows a page, so email link-scanners can't publish anything by accident.
import { verify, esc, page, commitFile, fmtDate } from "./_lib.js";

const ACTIONS = { publish: "Publish", feature: "Publish + feature on home page", reject: "Don’t publish" };

export default async function handler(req, res) {
  const q = req.method === "POST" ? (typeof req.body === "string" ? Object.fromEntries(new URLSearchParams(req.body)) : req.body || {}) : req.query || {};
  const action = String(q.a || "");
  const note = ACTIONS[action] ? verify(String(q.d || ""), action, q.s) : null;
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");

  if (!note) {
    return res.status(400).send(page("Link not valid", `<h1>This link isn't valid</h1><p class="muted">It may be incomplete or older than 60 days.</p>`));
  }

  const preview = `<p class="who">${esc(note.name)}</p><blockquote>${esc(note.message)}</blockquote>`;

  if (req.method !== "POST") {
    const hidden = ["a", "d", "s"].map((k) => `<input type="hidden" name="${k}" value="${esc(q[k])}">`).join("");
    const cls = action === "reject" ? "no" : action === "feature" ? "feat" : "go";
    return res.status(200).send(page("Confirm", `<h1>${esc(ACTIONS[action])}?</h1>${preview}
      <form method="post" action="/api/moderate">${hidden}<div class="row"><button class="${cls}" type="submit">Yes, ${esc(ACTIONS[action].toLowerCase())}</button></div></form>`));
  }

  if (action === "reject") {
    return res.status(200).send(page("Not published", `<h1>Not published</h1>${preview}<p class="muted">Nothing was saved. You can close this page.</p>`));
  }

  const publishedAt = new Date().toISOString();
  const slug = note.name.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "guest";
  const path = `content/testimonials/${note.submittedAt.slice(0, 10)}-${slug}-${note.id}.json`;
  const file = JSON.stringify({ name: note.name, message: note.message, submittedAt: note.submittedAt, publishedAt, featured: action === "feature" }, null, 2) + "\n";
  try {
    const r = await commitFile(path, file, `Publish testimonial from ${note.name}`);
    const site = (process.env.SITE_URL || "").replace(/\/$/, "");
    return res.status(200).send(page("Published", `<h1>${r.already ? "Already published" : "Published!"}</h1>${preview}
      <p class="muted">${r.already ? "This note was approved earlier." : `It will be on the website in about a minute${action === "feature" ? ", including the home page" : ""}. Dated ${esc(fmtDate(publishedAt))}.`}</p>
      <div class="row"><a class="btn go" href="${site || ""}/testimonials">See testimonials</a></div>`));
  } catch (e) {
    console.error(e);
    return res.status(500).send(page("Something went wrong", `<h1>Couldn't publish</h1>${preview}<p class="muted">${esc(e.message)}</p>`));
  }
}
