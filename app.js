(() => {
  "use strict";

  const API = window.REWARD_BRIEF_CONFIG.apiUrl;
  const CATEGORIES = ["CEO Pay", "Executive Compensation", "Policy & Practice", "Legislation & Regulation", "Benefits"];

  const el = {
    stories: document.getElementById("stories"),
    filters: document.getElementById("filters"),
    archive: document.getElementById("archive"),
    select: document.getElementById("dateSelect"),
    prev: document.getElementById("prevDay"),
    next: document.getElementById("nextDay"),
    kicker: document.getElementById("editionKicker"),
    greeting: document.getElementById("greeting"),
    title: document.getElementById("editionTitle"),
  };

  const state = { date: null, dates: [], items: [], filter: "All" };

  // ---------- helpers ----------
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const safeUrl = (u) => { try { const x = new URL(u); return /^https?:$/.test(x.protocol) ? x.href : "#"; } catch { return "#"; } };
  const parseDate = (d) => { const [y, m, day] = d.split("-").map(Number); return new Date(y, m - 1, day); };
  const fmt = (d, opts) => parseDate(d).toLocaleDateString("en-GB", opts);
  const todayIso = () => { const n = new Date(); return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}-${String(n.getDate()).padStart(2, "0")}`; };
  const host = (u) => { try { return new URL(u).hostname.replace(/^www\./, ""); } catch { return ""; } };

  const ICON_PIN = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></svg>';
  const ICON_OUT = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17L17 7M9 7h8v8"/></svg>';

  // ---------- data ----------
  async function load(date) {
    renderSkeleton();
    try {
      const url = date ? `${API}?date=${encodeURIComponent(date)}` : API;
      const res = await fetch(url, { headers: { accept: "application/json" } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      state.date = data.date;
      state.dates = data.dates || [];
      state.items = (data.items || []).sort((a, b) => a.rank - b.rank);
      state.filter = "All";
      syncUrl();
      render();
    } catch (err) {
      console.error(err);
      renderError();
    }
  }

  function syncUrl() {
    const url = new URL(location.href);
    if (state.date && state.date !== state.dates[0]) url.searchParams.set("date", state.date);
    else url.searchParams.delete("date");
    history.replaceState(null, "", url);
  }

  // ---------- render ----------
  function render() {
    renderHeader();
    renderDateNav();
    renderFilters();
    renderStories();
    renderArchive();
  }

  function greeting() {
    const h = new Date().getHours();
    if (h < 5) return "Burning the midnight oil, Jorge? 🌙";
    if (h < 12) return "Good morning, Jorge ☕";
    if (h < 18) return "Good afternoon, Jorge 👋";
    return "Good evening, Jorge 🍷";
  }

  function renderHeader() {
    el.greeting.textContent = greeting();
    if (!state.date) { el.kicker.textContent = "The Echapresto Brief"; el.title.textContent = "No editions yet"; return; }
    const isToday = state.date === todayIso();
    const isLatest = state.date === state.dates[0];
    el.kicker.textContent = isToday ? "Today's edition" : isLatest ? "Latest edition" : "Archive edition";
    el.title.textContent = fmt(state.date, { weekday: "long", day: "numeric", month: "long", year: "numeric" });
    document.title = `Echapresto Brief · ${fmt(state.date, { day: "numeric", month: "short" })}`;
  }

  function renderDateNav() {
    el.select.innerHTML = state.dates.map((d) =>
      `<option value="${d}" ${d === state.date ? "selected" : ""}>${esc(fmt(d, { weekday: "short", day: "numeric", month: "short" }))}</option>`
    ).join("");
    const i = state.dates.indexOf(state.date);
    el.prev.disabled = i < 0 || i >= state.dates.length - 1; // older
    el.next.disabled = i <= 0;                                 // newer
  }

  function renderFilters() {
    const counts = CATEGORIES.map((c) => [c, state.items.filter((it) => it.category === c).length]).filter(([, n]) => n > 0);
    if (!state.items.length) { el.filters.innerHTML = ""; return; }
    const chips = [["All", state.items.length], ...counts];
    el.filters.innerHTML = chips.map(([c, n]) =>
      `<button class="chip" type="button" data-filter="${esc(c)}" aria-pressed="${state.filter === c}">${esc(c)}<span class="chip__count">${n}</span></button>`
    ).join("");
  }

  function storyCard(it, lead) {
    const pub = it.published_at ? fmt(it.published_at, { day: "numeric", month: "short", year: "numeric" }) : "";
    const href = safeUrl(it.url);
    return `
      <article class="card${lead ? " card--lead" : ""}" lang="${esc(it.language || "en")}">
        <div class="card__top">
          <span class="rank" aria-label="Rank ${it.rank}">${it.rank}</span>
          <span class="cat" data-cat="${esc(it.category)}">${esc(it.category)}</span>
          ${it.region ? `<span class="region">${ICON_PIN}${esc(it.region)}</span>` : ""}
        </div>
        <h2 class="card__title"><a href="${href}" target="_blank" rel="noopener noreferrer">${esc(it.title)}</a></h2>
        <p class="card__summary">${esc(it.summary)}</p>
        ${it.why_it_matters ? `<p class="why"><strong>Why it matters</strong>${esc(it.why_it_matters)}</p>` : ""}
        <div class="card__foot">
          <span class="meta"><b>${esc(it.source || host(it.url))}</b>${pub ? ` · ${esc(pub)}` : ""}</span>
          <a class="read" href="${href}" target="_blank" rel="noopener noreferrer">Read full article ${ICON_OUT}</a>
        </div>
      </article>`;
  }

  function renderStories() {
    if (!state.date || !state.items.length) {
      el.stories.innerHTML = `<div class="state"><h2>Nothing here yet</h2><p>Jorge's next edition lands tomorrow morning, presto.</p></div>`;
      return;
    }
    const list = state.filter === "All" ? state.items : state.items.filter((it) => it.category === state.filter);
    el.stories.innerHTML = list.map((it, i) => storyCard(it, i === 0 && state.filter === "All")).join("");
  }

  function renderArchive() {
    el.archive.innerHTML = state.dates.map((d, i) => `
      <li><button type="button" data-date="${d}" ${d === state.date ? 'aria-current="date"' : ""}>
        <span>${esc(fmt(d, { weekday: "short", day: "numeric", month: "short" }))}</span>
        ${i === 0 ? "<small>latest</small>" : ""}
      </button></li>`).join("") || "<li><small>No editions yet</small></li>";
  }

  function renderSkeleton() {
    el.stories.innerHTML = ['card--lead', '', ''].map((c) =>
      `<article class="card ${c} skeleton" aria-hidden="true"><div></div><div></div><div></div></article>`).join("");
  }

  function renderError() {
    el.stories.innerHTML = `<div class="state"><h2>Couldn't load the news</h2><p>Check your connection and try again.</p><button class="chip" type="button" id="retry">Retry</button></div>`;
    document.getElementById("retry").addEventListener("click", () => load(state.date));
  }

  // ---------- events ----------
  el.filters.addEventListener("click", (e) => {
    const b = e.target.closest("[data-filter]"); if (!b) return;
    state.filter = b.dataset.filter; renderFilters(); renderStories();
  });
  el.archive.addEventListener("click", (e) => {
    const b = e.target.closest("[data-date]"); if (!b) return;
    load(b.dataset.date); window.scrollTo({ top: 0, behavior: "smooth" });
  });
  el.select.addEventListener("change", () => load(el.select.value));
  el.prev.addEventListener("click", () => { const i = state.dates.indexOf(state.date); if (i < state.dates.length - 1) load(state.dates[i + 1]); });
  el.next.addEventListener("click", () => { const i = state.dates.indexOf(state.date); if (i > 0) load(state.dates[i - 1]); });

  // ---------- boot ----------
  const initial = new URL(location.href).searchParams.get("date");
  load(/^\d{4}-\d{2}-\d{2}$/.test(initial || "") ? initial : null);
})();
