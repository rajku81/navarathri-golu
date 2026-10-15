// Shared helpers for the testimonial endpoints.
// Nothing is stored until you approve: the guest's note travels inside a signed
// link in your email, and approving it commits a file to content/testimonials/.
import crypto from "node:crypto";

export const LIMITS = { name: 80, message: 1500, minMessage: 3 };
const LINK_DAYS = 60;

const secret = () => {
  const s = process.env.TESTIMONIAL_SECRET;
  if (!s) throw new Error("TESTIMONIAL_SECRET is not set");
  return s;
};

export const b64url = (s) => Buffer.from(s, "utf8").toString("base64url");
export const unb64url = (s) => Buffer.from(String(s), "base64url").toString("utf8");

export const sign = (data, action) =>
  crypto.createHmac("sha256", secret()).update(`${action}.${data}`).digest("base64url");

export function verify(data, action, sig) {
  const want = Buffer.from(sign(data, action));
  const got = Buffer.from(String(sig || ""));
  if (want.length !== got.length || !crypto.timingSafeEqual(want, got)) return null;
  let note;
  try { note = JSON.parse(unb64url(data)); } catch { return null; }
  const age = Date.now() - Date.parse(note.submittedAt);
  if (!(age >= 0 && age < LINK_DAYS * 864e5)) return null;
  return note;
}

export const esc = (t) =>
  String(t).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

export const clean = (t, max) =>
  String(t || "").replace(/\r\n?/g, "\n").replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim().slice(0, max);

export const siteUrl = (req) => {
  if (process.env.SITE_URL) return process.env.SITE_URL.replace(/\/$/, "");
  const host = req.headers["x-forwarded-host"] || req.headers.host;
  return `https://${host}`;
};

export const fmtDate = (iso) =>
  new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "America/Indiana/Indianapolis" });

// A small page in the site's colours, for the approve / reject screens.
export function page(title, body) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title><meta name="robots" content="noindex">
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600&family=Spectral:ital@0;1&family=Yeseva+One&display=swap" rel="stylesheet">
<style>
body{margin:0;min-height:100svh;display:grid;place-items:center;padding:24px 16px;background:#0b2f33;font-family:Spectral,Georgia,serif;color:#1e2a2b}
.card{max-width:560px;width:100%;background:#fffcf6;border-radius:18px;padding:28px 24px;box-shadow:0 30px 60px -30px #000}
h1{font-family:"Yeseva One",Georgia,serif;font-weight:400;color:#0f5257;font-size:32px;margin:0 0 12px}
blockquote{margin:16px 0;padding:14px 18px;border-left:4px solid #b0186b;background:#fbf7ef;border-radius:0 12px 12px 0;white-space:pre-wrap;font-size:18px;line-height:1.55}
.who{font-family:"Cormorant Garamond",Georgia,serif;font-weight:600;font-size:20px;color:#0f5257;margin:0}
.muted{color:#5c6a67;font-size:15px}
.row{display:flex;flex-wrap:wrap;gap:10px;margin-top:20px}
button,a.btn{font:600 18px "Cormorant Garamond",Georgia,serif;padding:12px 20px;border-radius:999px;border:0;cursor:pointer;text-decoration:none}
.go{background:#d4a017;color:#0b2f33}.feat{background:#0f5257;color:#fff}.no{background:#fff;color:#b0186b;border:1.5px solid #b0186b}
</style></head><body><main class="card">${body}</main></body></html>`;
}

// Commit one file to the repo through the GitHub API (this is what publishes it).
export async function commitFile(path, content, message) {
  const repo = process.env.GITHUB_REPO || "rajku81/navarathri-golu";
  const token = process.env.GITHUB_TOKEN;
  if (!token) throw new Error("GITHUB_TOKEN is not set");
  const url = `https://api.github.com/repos/${repo}/contents/${path.split("/").map(encodeURIComponent).join("/")}`;
  const headers = { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json", "User-Agent": "navarathri-golu" };
  const existing = await fetch(url, { headers });
  if (existing.ok) return { already: true };
  const res = await fetch(url, {
    method: "PUT",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({ message, content: Buffer.from(content, "utf8").toString("base64"), branch: "main" })
  });
  if (!res.ok) throw new Error(`GitHub ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return { already: false };
}
