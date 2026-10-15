(() => {
  "use strict";

  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const h = (tag, attrs = {}, html = "") => {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (k === "style") el.style.cssText = v;
      else if (v !== false && v != null) el.setAttribute(k, v === true ? "" : v);
    }
    if (html) el.innerHTML = html;
    return el;
  };

  const BLOG = window.BLOG, STORIES = window.STORIES, PHOTOS = window.PHOTOS || {}, POSTS = window.POSTS || [];
  const FESTIVAL = window.FESTIVAL, ARCHANA = window.ARCHANA;
  const GROUPS = BLOG.blocks.filter((b) => b.type === "goddess");

  // Archana's own sentences, shown when the Kalasam or the lamps are tapped.
  const NOTES = {
    kalasam: "The first day of Navarathri, a pot filled with water and rice is placed in the middle step with a coconut and mango leaves on top of it. This is called the Kalasam. After this pot is placed on the step, the dolls can no longer be moved till the end of Golu.",
    lamps: "Two beautiful lit lamps are placed on either side of the steps to draw attention to the dolls."
  };

  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const revealObs = "IntersectionObserver" in window && !reduced
    ? new IntersectionObserver((ents) => ents.forEach((en) => { if (en.isIntersecting) { en.target.classList.add("is-in"); revealObs.unobserve(en.target); } }), { rootMargin: "0px 0px -8% 0px" })
    : null;
  function observeReveals() {
    $$(".reveal:not(.is-in)").forEach((el) => (revealObs ? revealObs.observe(el) : el.classList.add("is-in")));
  }

  /* ---------------- shared SVG gradients ---------------- */
  document.body.insertAdjacentHTML("afterbegin", `
    <svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>
      <radialGradient id="g-glow"><stop offset="0" stop-color="#ffd76a" stop-opacity=".75"/><stop offset="1" stop-color="#ff8a00" stop-opacity="0"/></radialGradient>
      <linearGradient id="g-flame" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#ff6a00"/><stop offset=".55" stop-color="#ffc93c"/><stop offset="1" stop-color="#fff6c8"/></linearGradient>
      <linearGradient id="g-clay" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d9733a"/><stop offset="1" stop-color="#7a2f12"/></linearGradient>
      <linearGradient id="g-brass" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#8a5a12"/><stop offset=".45" stop-color="#f3d27a"/><stop offset=".6" stop-color="#d9a640"/><stop offset="1" stop-color="#7a4c0c"/></linearGradient>
      <linearGradient id="g-copper" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#7a3410"/><stop offset=".4" stop-color="#f0a46a"/><stop offset=".6" stop-color="#c8662c"/><stop offset="1" stop-color="#5e260a"/></linearGradient>
    </defs></svg>`);

  const FLAME = (x, y, s = 1) =>
    `<path class="flame" style="transform-box:fill-box" d="M${x} ${y - 22 * s} C${x + 7 * s} ${y - 12 * s} ${x + 8 * s} ${y - 4 * s} ${x} ${y} C${x - 8 * s} ${y - 4 * s} ${x - 7 * s} ${y - 12 * s} ${x} ${y - 22 * s}Z" fill="url(#g-flame)"/>`;

  const DIYA_SVG = `<svg viewBox="0 0 60 70" aria-hidden="true">
      <circle class="glow" cx="30" cy="26" r="30" fill="url(#g-glow)"/>
      ${FLAME(30, 38)}
      <path d="M4 40 Q30 34 56 40 Q52 62 30 64 Q8 62 4 40Z" fill="url(#g-clay)"/>
      <ellipse cx="30" cy="40" rx="26" ry="5" fill="#9a3f18"/>
      <ellipse cx="30" cy="40" rx="20" ry="3" fill="#5a2208"/>
      <path d="M50 40 Q60 36 58 30 Q54 36 46 38Z" fill="#b5541f"/>
    </svg>`;

  const LAMP_SVG = `<svg viewBox="0 0 72 200" aria-hidden="true">
      <circle cx="36" cy="46" r="44" fill="url(#g-glow)"/>
      <path d="M36 4 L42 24 L36 30 L30 24Z" fill="url(#g-brass)"/>
      <circle cx="36" cy="5" r="3" fill="#f3d27a"/>
      <rect x="34" y="28" width="4" height="34" fill="url(#g-brass)"/>
      ${FLAME(12, 62, .9)}${FLAME(36, 58)}${FLAME(60, 62, .9)}
      <path d="M6 62 Q36 84 66 62 Q36 54 6 62Z" fill="url(#g-brass)"/>
      <rect x="31" y="74" width="10" height="100" rx="3" fill="url(#g-brass)"/>
      <ellipse cx="36" cy="96" rx="10" ry="5" fill="url(#g-brass)"/>
      <ellipse cx="36" cy="130" rx="12" ry="6" fill="url(#g-brass)"/>
      <ellipse cx="36" cy="160" rx="10" ry="5" fill="url(#g-brass)"/>
      <path d="M6 194 Q36 158 66 194Z" fill="url(#g-brass)"/>
      <ellipse cx="36" cy="194" rx="32" ry="6" fill="#7a4c0c"/>
    </svg>`;

  const KALASAM_SVG = `<svg viewBox="0 0 78 100" aria-hidden="true">
      <g fill="#2f6b2f">
        <path d="M39 40 C26 30 12 30 2 36 C14 42 28 44 39 40Z"/>
        <path d="M39 40 C52 30 66 30 76 36 C64 42 50 44 39 40Z"/>
        <path d="M39 40 C30 26 18 18 8 18 C14 30 26 38 39 40Z" fill="#3d8a3a"/>
        <path d="M39 40 C48 26 60 18 70 18 C64 30 52 38 39 40Z" fill="#3d8a3a"/>
      </g>
      <ellipse cx="39" cy="28" rx="12" ry="15" fill="#8a5a2b"/>
      <path d="M33 16 Q39 4 45 16 Q39 12 33 16Z" fill="#6b4220"/>
      <ellipse cx="39" cy="22" rx="5" ry="7" fill="#a87a45" opacity=".6"/>
      <rect x="27" y="40" width="24" height="8" rx="2" fill="url(#g-copper)"/>
      <circle cx="39" cy="70" r="27" fill="url(#g-copper)"/>
      <path d="M14 62 Q39 70 64 62" stroke="#fff" stroke-width="1.6" fill="none" stroke-dasharray="3 2"/>
      <path d="M13 70 Q39 78 65 70" stroke="#fff" stroke-width="1.6" fill="none" stroke-dasharray="3 2"/>
      <circle cx="39" cy="82" r="3.5" fill="#b5122e"/><circle cx="29" cy="81" r="2.6" fill="#ffc93c"/><circle cx="49" cy="81" r="2.6" fill="#ffc93c"/>
      <ellipse cx="39" cy="97" rx="22" ry="3" fill="#5e260a"/>
    </svg>`;

  /* ---------------- hero: nine diyas ---------------- */
  const diyaWrap = $("#diyas"), diyaCaption = $("#diyaCaption");
  for (let n = 1; n <= 9; n++) {
    const g = GROUPS.find((x) => x.nights.includes(n));
    const li = h("li");
    const b = h("button", { class: "diya", "data-group": g.id, "data-night": n, "aria-label": `Night ${n} · ${g.name}` },
      DIYA_SVG + `<span class="diya__n">${n}</span>`);
    li.append(b);
    diyaWrap.append(li);
  }
  const diyas = $$(".diya", diyaWrap);
  // During the festival, light one diya per night so far; otherwise light all nine.
  let litCount = 9;
  if (FESTIVAL) {
    const day = (s) => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const start = day(FESTIVAL.start), end = day(FESTIVAL.end);
    const n = Math.round((today - start) / 864e5) + 1;
    const datesEl = $("#heroDates");
    let status = "";
    if (today < start) status = "Coming up";
    else if (n >= 1 && n <= 9) { status = `Tonight is Night ${n}`; litCount = n; }
    else if (today <= end) status = "Today is Vijayadasami";
    datesEl.innerHTML = `<span class="hero__year">Navarathri ${esc(FESTIVAL.year)}</span>` +
      `<span class="hero__range">${esc(FESTIVAL.label)}</span>` +
      (status ? `<span class="hero__status">${esc(status)}</span>` : "");
    datesEl.hidden = false;
  }
  diyas.forEach((d, i) => { if (i < litCount) setTimeout(() => d.classList.add("is-lit"), reduced ? 0 : 500 + i * 320); });
  diyas.forEach((d) => {
    const show = () => (diyaCaption.textContent = d.getAttribute("aria-label"));
    d.addEventListener("mouseenter", show);
    d.addEventListener("focus", show);
    d.addEventListener("mouseleave", () => (diyaCaption.innerHTML = "&nbsp;"));
    d.addEventListener("click", () => {
      const card = $(`#goddess-${d.dataset.group}`);
      card.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "center" });
      card.classList.remove("is-flash"); void card.offsetWidth; card.classList.add("is-flash");
    });
  });

  /* ---------------- blog ---------------- */
  $("#blogTitle").textContent = BLOG.title;
  $("#blogByline").textContent = BLOG.byline;

  const polaroids = $("#polaroids");
  BLOG.photos.forEach((p, i) => {
    const b = h("button", { class: "polaroid reveal", "aria-label": `Open photo: ${p.alt}` }, `<img src="${p.src}" alt="${esc(p.alt)}" loading="lazy">`);
    b.addEventListener("click", () => lightbox.open(BLOG.photos, i));
    polaroids.append(b);
  });

  const usedTerms = new Set();
  const withTerms = (text) => {
    let out = esc(text);
    for (const [key, note] of Object.entries(BLOG.glossary)) {
      if (usedTerms.has(key)) continue;
      const re = new RegExp(`\\b(${key})\\b`, "i");
      if (re.test(out)) {
        usedTerms.add(key);
        out = out.replace(re, `<button type="button" class="term">$1<span class="term__tip" role="tooltip">${esc(note)}</span></button>`);
      }
    }
    return out;
  };

  const article = $("#article");
  let group = null;
  BLOG.blocks.forEach((b) => {
    if (b.type === "goddess") {
      if (!group || !group.classList.contains("goddesses")) { group = h("div", { class: "goddesses" }); article.append(group); }
      group.append(h("div", { class: `goddess goddess--${b.id} reveal`, id: `goddess-${b.id}` },
        `<div class="goddess__nights" aria-label="Nights ${b.nights.join(", ")}">${b.nights.map((n) => `<span>${n}</span>`).join("")}</div>
         <h3 class="goddess__name">${esc(b.name)}</h3><p>${withTerms(b.text)}</p>`));
      return;
    }
    if (b.type === "day") {
      if (!group || !group.classList.contains("days")) { group = h("div", { class: "days" }); article.append(group); }
      group.append(h("div", { class: "day reveal", id: b.id },
        `<div class="day__n" aria-hidden="true">${b.label}</div><div><p class="day__name">${esc(b.name)}</p><p>${withTerms(b.text)}</p></div>`));
      return;
    }
    group = null;
    if (b.type === "heading") article.append(h("h3", {}, esc(b.text)));
    else if (b.type === "quote") article.append(h("blockquote", { class: "pullquote reveal" }, esc(b.text)));
    else article.append(h("p", {}, withTerms(b.text)));
  });
  article.append(h("p", { class: "signoff" }, esc(BLOG.signoff)));
  article.append(h("div", { class: "footnotes" }, Object.values(BLOG.glossary).map((n) => `<p>${esc(n)}</p>`).join("")));

  // tap-to-open for glossary terms on touch screens
  article.addEventListener("click", (e) => {
    const t = e.target.closest(".term");
    $$(".term.is-open", article).forEach((x) => x !== t && x.classList.remove("is-open"));
    if (t) t.classList.toggle("is-open");
  });

  /* ---------------- golu steps ---------------- */
  const STEP_LAYOUT = { 1: { w: 66, h: 14 }, 2: { w: 92, h: 20 }, 3: { w: 100, h: 34 } };
  const stepsEl = $("#steps");
  const dollAspect = {};

  const lettersTile = (s) => `<b>${s.list.items.length}</b><span>${esc(s.title)}</span><em>${s.list.items.map((i) => esc(i.name)).join(" · ")}</em>`;

  const loadAspect = (src) => new Promise((res) => {
    const im = new Image();
    im.onload = () => res(im.naturalWidth / im.naturalHeight);
    im.onerror = () => res(1);
    im.src = src;
  });

  (async () => {
    await Promise.all(STORIES.filter((s) => s.doll).map(async (s) => (dollAspect[s.slug] = await loadAspect(s.doll))));
    Object.entries(STEP_LAYOUT).forEach(([n, cfg]) => {
      const step = h("div", { class: "step reveal", style: `--w:${cfg.w}%` });
      const row = h("div", { class: "step__dolls" });
      const onStep = STORIES.filter((s) => String(s.step) === n);
      onStep.forEach((s, i) => {
        const b = h("button", {
          class: "doll" + (s.doll ? "" : " doll--letters"),
          style: `--h:${cfg.h}cqw; --ar:${s.doll ? dollAspect[s.slug] : 0.8}; --bg:${s.bg};` + (s.doll ? `background-image:url('${s.doll}')` : ""),
          "aria-label": `Read the story: ${s.title}`
        }, (s.doll ? "" : lettersTile(s)) + `<span class="doll__plate">${esc(s.title)}</span>`);
        b.addEventListener("click", () => openStory(s.slug, b));
        row.append(b);
        // the Kalasam sits in the middle step
        if (n === "2" && i === 0) {
          const k = h("button", { class: "kalasam", style: `--h:${cfg.h}cqw`, "data-note": "kalasam", "aria-label": "Kalasam" }, KALASAM_SVG);
          row.append(k);
        }
      });
      const face = h("div", { class: "step__face" }, `<div class="lights">${"<i></i>".repeat(Math.round(cfg.w / 3.2))}</div>`);
      $$("i", face).forEach((el, i) => (el.style.animationDelay = `${(i % 7) * -0.35}s`));
      step.append(row, h("div", { class: "step__top" }), face);
      stepsEl.append(step);
    });
    observeReveals();
  })();

  $$(".lamp").forEach((l) => (l.innerHTML = LAMP_SVG));

  const note = $("#note");
  document.addEventListener("click", (e) => {
    const t = e.target.closest("[data-note]");
    if (!t) return;
    const text = NOTES[t.dataset.note];
    if (!note.hidden && note.dataset.key === t.dataset.note) { note.hidden = true; return; }
    note.dataset.key = t.dataset.note;
    note.innerHTML = `“${esc(text)}”<small>Archana · 2012</small>`;
    note.hidden = false;
  });

  const index = $("#storyIndex");
  STORIES.forEach((s) => {
    const li = h("li");
    const b = h("button", {}, `<i style="--dot:${s.ink}"></i>${esc(s.title)}`);
    b.addEventListener("click", () => openStory(s.slug, b));
    li.append(b); index.append(li);
  });

  /* ---------------- story reader ---------------- */
  const reader = $("#reader"), rScroll = $("#readerScroll");
  let current = -1, kind = "story", opener = null, chipObserver = null;
  const listFor = (k) => (k === "post" ? POSTS : STORIES);
  const fmtDate = (d) => (d ? new Date(d + "T12:00:00").toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "");

  function renderStory(i) {
    const s = STORIES[i];
    current = i; kind = "story";
    stopSpeaking();
    $("#readerCard").hidden = !s.card;
    $("#readerEyebrow").textContent = "by Archana";
    reader.style.setProperty("--bg", s.bg);
    reader.style.setProperty("--ink-accent", s.ink);
    $("#readerTitle").textContent = s.title;
    $("#readerCount").textContent = `${i + 1} of ${STORIES.length}`;

    const doll = $("#readerDoll");
    doll.innerHTML = s.doll
      ? `<img src="${s.doll}" alt="${esc(s.title)} — Golu doll">`
      : `<div class="doll doll--letters">${lettersTile(s)}</div>`;

    let html = "";
    if (s.quotes && s.quotes.length) html += `<div class="reader__quotes">${s.quotes.map((q) => `<p data-say>${esc(q)}</p>`).join("")}</div>`;
    (s.intro || []).forEach((p) => (html += `<p data-say>${esc(p)}</p>`));
    if (s.list) {
      html += `<div class="chips" role="list">${s.list.items.map((it, k) =>
        `<button class="chip" role="listitem" data-k="${k}"><b>${k + 1}</b>${esc(it.name)}</button>`).join("")}</div>`;
      html += `<ol class="items">${s.list.items.map((it, k) =>
        `<li class="item" id="item-${k}" data-say><h4>${esc(it.name)}${it.tag ? `<small>${esc(it.tag)}</small>` : ""}</h4><p>${esc(it.text)}</p></li>`).join("")}</ol>`;
    }
    if (s.subtitle) html += `<h3 class="reader__subtitle" data-say>${esc(s.subtitle)}</h3>`;
    (s.body || []).forEach((p) => (html += `<p data-say>${esc(p)}</p>`));
    if (s.closing) html += `<p class="reader__closing" data-say>${esc(s.closing)}</p>`;
    const body = $("#readerBody");
    body.innerHTML = html;
    rScroll.scrollTop = 0;

    // chips jump to an item and follow along while scrolling
    if (chipObserver) chipObserver.disconnect();
    if (s.list) {
      const chips = $$(".chip", body), items = $$(".item", body);
      const setActive = (k) => {
        chips.forEach((c) => c.classList.toggle("is-active", +c.dataset.k === k));
        items.forEach((it, j) => it.classList.toggle("is-active", j === k));
      };
      chips.forEach((c) => c.addEventListener("click", () => {
        const k = +c.dataset.k;
        setActive(k);
        items[k].scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "center" });
      }));
      chipObserver = new IntersectionObserver((ents) => {
        ents.forEach((en) => en.isIntersecting && setActive(items.indexOf(en.target)));
      }, { root: rScroll, rootMargin: "-45% 0px -45% 0px" });
      items.forEach((it) => chipObserver.observe(it));
    }
  }

  function renderPost(i) {
    const p = POSTS[i];
    current = i; kind = "post";
    stopSpeaking();
    if (chipObserver) chipObserver.disconnect();
    reader.style.setProperty("--bg", "#fffcf6");
    reader.style.setProperty("--ink-accent", "#0f5257");
    $("#readerCard").hidden = true;
    $("#readerEyebrow").textContent = [fmtDate(p.date), p.author].filter(Boolean).join(" · ");
    $("#readerTitle").textContent = p.title;
    $("#readerCount").textContent = `${i + 1} of ${POSTS.length}`;
    const pics = p.photos.length ? p.photos : (p.cover ? [p.cover] : []);
    const lb = pics.map((src) => ({ src, alt: p.title }));
    const doll = $("#readerDoll");
    doll.innerHTML = p.cover ? `<button class="reader__cover" aria-label="Open photo"><img src="${p.cover}" alt="${esc(p.title)}"></button>` : "";
    doll.hidden = !p.cover;
    if (p.cover) $("button", doll).addEventListener("click", () => lightbox.open(lb, Math.max(0, pics.indexOf(p.cover))));
    const body = $("#readerBody");
    body.innerHTML = `<div class="post-body">${p.html}</div>` + (pics.length > 1
      ? `<div class="post-photos">${pics.map((src, k) => `<button data-k="${k}" aria-label="Open photo ${k + 1}"><img src="${src}" alt="" loading="lazy"></button>`).join("")}</div>` : "");
    $$(".post-body p, .post-body h2, .post-body h3, .post-body li, .post-body blockquote", body).forEach((el) => el.setAttribute("data-say", ""));
    $$(".post-photos button", body).forEach((b) => b.addEventListener("click", () => lightbox.open(lb, +b.dataset.k)));
    rScroll.scrollTop = 0;
  }

  function openStory(slug, from) { openItem("story", slug, from); }

  function openItem(k, slug, from) {
    const i = listFor(k).findIndex((s) => s.slug === slug);
    if (i < 0) return;
    opener = from || document.activeElement;
    $("#readerDoll").hidden = false;
    if (k === "post") renderPost(i); else renderStory(i);
    if (reader.hidden) {
      reader.hidden = false;
      document.body.classList.add("no-scroll");
      $("#readerClose").focus({ preventScroll: true });
    }
    const hash = `#${k}/${slug}`;
    if (location.hash !== hash) history.pushState(null, "", hash);
  }

  function closeStory(fromHash = false) {
    if (reader.hidden) return;
    stopSpeaking();
    reader.hidden = true;
    document.body.classList.remove("no-scroll");
    if (!fromHash) history.replaceState(null, "", kind === "post" ? "#posts" : "#golu");
    if (opener && opener.focus) opener.focus({ preventScroll: true });
  }

  const step = (d) => {
    const items = listFor(kind);
    const i = (current + d + items.length) % items.length;
    $("#readerDoll").hidden = false;
    if (kind === "post") renderPost(i); else renderStory(i);
    history.replaceState(null, "", `#${kind}/${items[i].slug}`);
  };
  $("#readerPrev").addEventListener("click", () => step(-1));
  $("#readerNext").addEventListener("click", () => step(1));
  $("#readerClose").addEventListener("click", () => closeStory());
  $("#readerCard").addEventListener("click", () => {
    const s = STORIES[current];
    lightbox.open([{ src: s.card, alt: `Archana’s original card — ${s.title}` }], 0);
  });

  const routeFromHash = () => {
    const m = location.hash.match(/^#(story|post)\/([\w-]+)/);
    if (m) openItem(m[1], m[2]);
    else closeStory(true);
  };
  window.addEventListener("hashchange", routeFromHash);
  window.addEventListener("popstate", routeFromHash);

  /* ---------------- read aloud ---------------- */
  const listenBtn = $("#readerListen");
  const synth = window.speechSynthesis;
  let speaking = false;
  if (!synth) listenBtn.hidden = true;

  function pickVoice() {
    const vs = synth.getVoices();
    return vs.find((v) => v.lang === "en-IN") || vs.find((v) => /en-GB/.test(v.lang)) || vs.find((v) => /^en/.test(v.lang));
  }
  function stopSpeaking() {
    if (!synth) return;
    speaking = false;
    synth.cancel();
    listenBtn.setAttribute("aria-pressed", "false");
    listenBtn.textContent = "Listen";
    $$(".is-speaking", reader).forEach((x) => x.classList.remove("is-speaking"));
  }
  function speakFrom(queue) {
    if (!speaking || !queue.length) { stopSpeaking(); return; }
    const el = queue.shift();
    $$(".is-speaking", reader).forEach((x) => x.classList.remove("is-speaking"));
    el.classList.add("is-speaking");
    el.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "center" });
    const u = new SpeechSynthesisUtterance(el.textContent);
    const v = pickVoice(); if (v) u.voice = v;
    u.rate = 0.95;
    u.onend = () => speakFrom(queue);
    synth.speak(u);
  }
  listenBtn.addEventListener("click", () => {
    if (speaking) { stopSpeaking(); return; }
    speaking = true;
    listenBtn.setAttribute("aria-pressed", "true");
    listenBtn.textContent = "Stop";
    speakFrom([$("#readerTitle"), ...$$("[data-say]", reader)]);
  });

  /* ---------------- meet archana ---------------- */
  if (ARCHANA) {
    $("#archanaTitle").textContent = ARCHANA.title;
    const ph = $("#archanaPhoto"); ph.src = ARCHANA.photo; ph.alt = ARCHANA.photoAlt || "Archana";
    $("#archanaBody").innerHTML = ARCHANA.paragraphs.map((p) => `<p>${esc(p)}</p>`).join("") +
      (ARCHANA.closing ? `<p class="archana__closing">${esc(ARCHANA.closing)}</p>` : "") +
      (ARCHANA.signature ? `<p class="archana__sig">${esc(ARCHANA.signature)}</p>` : "");
  }

  /* ---------------- blog posts ---------------- */
  const postsSection = $("#posts");
  if (!POSTS.length) {
    postsSection.hidden = true;
    $$('a[href="#posts"]').forEach((a) => (a.hidden = true));
  } else {
    const grid = $("#postGrid");
    POSTS.forEach((p) => {
      const text = (h("div", {}, p.html).textContent || "").trim().replace(/\s+/g, " ");
      const card = h("button", { class: "post-card reveal", "aria-label": `Read: ${p.title}` },
        (p.cover ? `<span class="post-card__img"><img src="${p.cover}" alt="" loading="lazy"></span>` : "") +
        `<span class="post-card__text"><span class="post-card__date">${esc([fmtDate(p.date), p.author].filter(Boolean).join(" · "))}</span>` +
        `<span class="post-card__title">${esc(p.title)}</span>` +
        `<span class="post-card__excerpt">${esc(text.length > 170 ? text.slice(0, 170).replace(/\s\S*$/, "") + "…" : text)}</span></span>`);
      card.addEventListener("click", () => openItem("post", p.slug, card));
      grid.append(card);
    });
  }

  /* ---------------- through the years ---------------- */
  const timeline = $("#timeline"), gallery = $("#gallery");
  const lastYear = Math.max(new Date().getFullYear(), ...Object.keys(PHOTOS).map(Number));
  const years = [];
  for (let y = 2005; y <= lastYear; y++) years.push(String(y));
  const yearsWithPhotos = years.filter((y) => (PHOTOS[y] || []).length);

  function showYear(y) {
    $$(".year", timeline).forEach((b) => b.setAttribute("aria-selected", String(b.dataset.year === y)));
    const sel = $(`.year[data-year="${y}"]`, timeline);
    if (sel) timeline.scrollLeft = sel.offsetLeft - timeline.clientWidth / 2 + sel.clientWidth / 2;
    const list = PHOTOS[y] || [];
    gallery.innerHTML = "";
    if (!list.length) {
      gallery.append(h("div", { class: "gallery__empty" }, `<b>${y}</b>No photos added yet.`));
      return;
    }
    const track = h("div", { class: "carousel__track", tabindex: "0", "aria-label": `Golu ${y} photos` });
    const thumbs = h("div", { class: "carousel__thumbs" });
    const count = h("p", { class: "carousel__count", "aria-live": "polite" });
    list.forEach((p, i) => {
      const slide = h("figure", { class: "carousel__slide" });
      const b = h("button", { "aria-label": `Open photo ${i + 1} of ${list.length}` }, `<img src="${p.src}" alt="${esc(p.alt || `Golu ${y}`)}" loading="${i < 2 ? "eager" : "lazy"}">`);
      b.addEventListener("click", () => lightbox.open(list, i));
      slide.append(b); track.append(slide);
      const t = h("button", { class: "carousel__thumb", "aria-label": `Photo ${i + 1}` }, `<img src="${p.src}" alt="" loading="lazy">`);
      t.addEventListener("click", () => go(i));
      thumbs.append(t);
    });
    let at = 0;
    const mark = (i) => {
      at = i;
      count.textContent = `${y} · ${i + 1} / ${list.length}`;
      $$(".carousel__thumb", thumbs).forEach((t, k) => t.classList.toggle("is-active", k === i));
      const t = thumbs.children[i];
      if (t) thumbs.scrollTo({ left: t.offsetLeft - thumbs.clientWidth / 2 + t.clientWidth / 2, behavior: reduced ? "auto" : "smooth" });
    };
    const go = (i) => {
      i = (i + list.length) % list.length;
      track.scrollTo({ left: i * track.clientWidth, behavior: reduced ? "auto" : "smooth" });
      mark(i);
    };
    let tick;
    track.addEventListener("scroll", () => {
      clearTimeout(tick);
      tick = setTimeout(() => { const i = Math.round(track.scrollLeft / track.clientWidth); if (i !== at) mark(i); }, 80);
    });
    track.addEventListener("keydown", (e) => {
      if (e.key === "ArrowLeft") { e.preventDefault(); go(at - 1); }
      if (e.key === "ArrowRight") { e.preventDefault(); go(at + 1); }
    });
    const prev = h("button", { class: "icon-btn carousel__prev", "aria-label": "Previous photo" }, "‹");
    const next = h("button", { class: "icon-btn carousel__next", "aria-label": "Next photo" }, "›");
    prev.addEventListener("click", () => go(at - 1));
    next.addEventListener("click", () => go(at + 1));
    const stage = h("div", { class: "carousel__stage" });
    stage.append(track);
    if (list.length > 1) stage.append(prev, next);
    const wrap = h("div", { class: "carousel" });
    wrap.append(stage, count);
    if (list.length > 1) wrap.append(thumbs);
    gallery.append(wrap);
    mark(0);
  }

  years.forEach((y) => {
    const b = h("button", { class: "year" + ((PHOTOS[y] || []).length ? " has-photos" : ""), role: "tab", "data-year": y, "aria-selected": "false" }, `<i></i>${y}`);
    b.addEventListener("click", () => showYear(y));
    timeline.append(b);
  });
  const startYear = yearsWithPhotos[yearsWithPhotos.length - 1] || years[years.length - 1];
  showYear(startYear);
  requestAnimationFrame(() => {
    const sel = $(`.year[data-year="${startYear}"]`, timeline);
    timeline.scrollLeft = sel.offsetLeft - timeline.clientWidth / 2 + sel.clientWidth / 2;
  });

  /* ---------------- lightbox ---------------- */
  const lightbox = (() => {
    const box = $("#lightbox"), img = $("#lbImg"), cap = $("#lbCap");
    let list = [], idx = 0, prevFocus = null;
    const show = () => {
      const p = list[idx];
      img.src = p.src; img.alt = p.alt || "";
      cap.textContent = p.alt || "";
      $("#lbPrev").hidden = $("#lbNext").hidden = list.length < 2;
    };
    const api = {
      open(l, i) { list = l; idx = i; prevFocus = document.activeElement; show(); box.hidden = false; document.body.classList.add("no-scroll"); $("#lbClose").focus(); },
      close() { box.hidden = true; if (reader.hidden) document.body.classList.remove("no-scroll"); prevFocus && prevFocus.focus(); },
      go(d) { idx = (idx + d + list.length) % list.length; show(); },
      get isOpen() { return !box.hidden; }
    };
    $("#lbClose").addEventListener("click", api.close);
    $("#lbPrev").addEventListener("click", () => api.go(-1));
    $("#lbNext").addEventListener("click", () => api.go(1));
    box.addEventListener("click", (e) => { if (e.target === box) api.close(); });
    return api;
  })();

  document.addEventListener("keydown", (e) => {
    if (lightbox.isOpen) {
      if (e.key === "Escape") lightbox.close();
      if (e.key === "ArrowLeft") lightbox.go(-1);
      if (e.key === "ArrowRight") lightbox.go(1);
      return;
    }
    if (!reader.hidden) {
      if (e.key === "Escape") closeStory();
      if (e.key === "ArrowLeft") step(-1);
      if (e.key === "ArrowRight") step(1);
    }
  });

  /* ---------------- nav + reveal ---------------- */
  const nav = $("#topnav"), hero = $("#hero");
  new IntersectionObserver(([en]) => nav.classList.toggle("is-visible", !en.isIntersecting), { threshold: 0.35 }).observe(hero);
  const navLinks = $$(".topnav__links a");
  const sectionObs = new IntersectionObserver((ents) => {
    ents.forEach((en) => {
      if (en.isIntersecting) navLinks.forEach((a) => a.classList.toggle("is-active", a.getAttribute("href") === `#${en.target.id}`));
    });
  }, { rootMargin: "-50% 0px -50% 0px" });
  ["blog", "archana", "posts", "golu", "years"].forEach((id) => sectionObs.observe(document.getElementById(id)));

  observeReveals();

  routeFromHash();
})();
