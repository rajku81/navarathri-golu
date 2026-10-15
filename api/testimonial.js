// POST /api/testimonial  { name, message, website (honeypot), startedAt }
// Emails the moderator a preview with Publish / Feature / Don't publish links.
import { LIMITS, b64url, sign, esc, clean, siteUrl } from "./_lib.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Use POST" });
  const body = typeof req.body === "string" ? safeJson(req.body) : req.body || {};

  // Quiet spam checks: a hidden field bots fill in, and forms sent impossibly fast.
  const tooFast = Number(body.startedAt) && Date.now() - Number(body.startedAt) < 2500;
  if (body.website || tooFast) return res.status(200).json({ ok: true });

  const name = clean(body.name, LIMITS.name);
  const message = clean(body.message, LIMITS.message);
  if (!name) return res.status(400).json({ error: "Please add your name." });
  if (message.length < LIMITS.minMessage) return res.status(400).json({ error: "Please write a few words." });

  const note = { id: Math.random().toString(36).slice(2, 10), name, message, submittedAt: new Date().toISOString() };
  const data = b64url(JSON.stringify(note));
  const base = siteUrl(req);
  const link = (action) => `${base}/api/moderate?a=${action}&d=${data}&s=${sign(data, action)}`;

  const to = process.env.MODERATOR_EMAIL;
  const key = process.env.RESEND_API_KEY;
  if (!to || !key) return res.status(500).json({ error: "Testimonials aren't switched on yet." });

  const btn = (href, label, bg, fg) =>
    `<a href="${href}" style="display:inline-block;margin:4px 6px 4px 0;padding:12px 20px;border-radius:999px;background:${bg};color:${fg};font:600 16px Georgia,serif;text-decoration:none">${label}</a>`;
  const html = `<div style="font-family:Georgia,serif;max-width:560px;color:#1e2a2b">
    <p style="color:#5c6a67;margin:0 0 8px">New note from a Golu guest — nothing is on the website until you choose.</p>
    <p style="font-size:20px;font-weight:bold;color:#0f5257;margin:16px 0 4px">${esc(name)}</p>
    <blockquote style="margin:0 0 18px;padding:12px 16px;border-left:4px solid #b0186b;background:#fbf7ef;white-space:pre-wrap;font-size:17px;line-height:1.5">${esc(message)}</blockquote>
    ${btn(link("publish"), "Publish", "#d4a017", "#0b2f33")}
    ${btn(link("feature"), "Publish + feature on home page", "#0f5257", "#ffffff")}
    ${btn(link("reject"), "Don’t publish", "#ffffff", "#b0186b")}
    <p style="color:#5c6a67;font-size:13px;margin-top:18px">Each button opens a page where you confirm. Links work for 60 days.</p>
  </div>`;

  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.MAIL_FROM || "Navarathri Golu <onboarding@resend.dev>",
      to: [to],
      subject: `Golu note from ${name}: publish it?`,
      html
    })
  });
  if (!r.ok) {
    console.error("Resend", r.status, await r.text());
    return res.status(502).json({ error: "Couldn't send your note just now. Please try again." });
  }
  return res.status(200).json({ ok: true });
}

function safeJson(s) { try { return JSON.parse(s); } catch { return {}; } }
