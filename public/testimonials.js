(() => {
  "use strict";
  const $ = (s) => document.querySelector(s);
  const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const fmt = (iso) => new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  const items = window.TESTIMONIALS || [];

  // ---- list ----
  const list = $("#tList");
  list.innerHTML = items.length
    ? items.map((t) => `
      <figure class="t-card">
        <blockquote>${esc(t.message).replace(/\n/g, "<br>")}</blockquote>
        <figcaption><span class="t-card__name">${esc(t.name)}</span><span class="t-card__date">Shared ${esc(fmt(t.publishedAt))}</span></figcaption>
      </figure>`).join("")
    : `<p class="t-empty">No notes yet. Be the first!</p>`;

  // ---- form ----
  const form = $("#noteForm"), status = $("#tStatus"), btn = $("#tSubmit"), msg = $("#tMessage");
  const startedAt = Date.now();
  msg.addEventListener("input", () => ($("#tCount").textContent = `${msg.value.length} / 1500`));

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = $("#tName").value.trim(), message = msg.value.trim();
    if (!name || message.length < 3) {
      status.className = "t-status is-error";
      status.textContent = !name ? "Please add your name." : "Please write a few words.";
      return;
    }
    btn.disabled = true; btn.textContent = "Sending…"; status.className = "t-status"; status.textContent = "";
    try {
      const r = await fetch("/api/testimonial", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, message, website: form.website.value, startedAt })
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data.error || "Something went wrong. Please try again.");
      form.reset(); $("#tCount").textContent = "0 / 1500";
      status.className = "t-status is-ok";
      status.textContent = "Thank you! Your note is on its way to Raj and Archana. It will appear here once they’ve read it.";
    } catch (err) {
      status.className = "t-status is-error";
      status.textContent = err.message;
    } finally {
      btn.disabled = false; btn.textContent = "Send my note";
    }
  });
})();
