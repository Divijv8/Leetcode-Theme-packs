/* Theme Studio for LeetCode — content script (runs at document_start). */
(function () {
  "use strict";
  const { THEMES, DEFAULTS, getTheme, rgba, hslTriple, hslaList, mix, hexToRgb, sceneUrl } = window.LTS;
  const html = document.documentElement;
  const CACHE_KEY = "lts-cache";

  let S = { ...DEFAULTS };
  let theme = getTheme(S.theme);
  let bootMode = null; // the light/dark mode LeetCode booted with on this page load

  /* ---------------- settings ---------------- */
  function readCache() {
    try { return JSON.parse(localStorage.getItem(CACHE_KEY) || "null"); } catch { return null; }
  }
  function writeCache() {
    try { localStorage.setItem(CACHE_KEY, JSON.stringify(S)); } catch { /* storage blocked */ }
  }
  function save(patch) {
    S = { ...S, ...patch };
    apply();
    try { chrome.storage.sync.set({ lts: S }); } catch { /* extension reloaded */ }
  }

  /* ---------------- theme → CSS variables ---------------- */
  function buildVars(t) {
    const glass = S.scenery && S.glass;
    const fg = t.text;
    const v = {
      "--lt-scheme": t.mode,
      "--lt-bg": t.bg,
      "--lt-layer1": glass ? rgba(t.layer1, t.mode === "dark" ? 0.84 : 0.86) : t.layer1,
      "--lt-layer1-solid": t.layer1,
      "--lt-layer2": glass ? rgba(t.layer2, 0.92) : t.layer2,
      "--lt-layer3": t.layer3,
      "--lt-editor": glass ? rgba(t.layer1, t.mode === "dark" ? 0.9 : 0.92) : t.layer1,
      "--lt-text": fg,
      "--lt-text2": rgba(fg, 0.74),
      "--lt-text3": rgba(fg, 0.55),
      "--lt-text4": rgba(fg, 0.4),
      "--lt-fill1": rgba(fg, 0.16),
      "--lt-fill2": rgba(fg, 0.12),
      "--lt-fill3": rgba(fg, 0.085),
      "--lt-fill4": rgba(fg, 0.055),
      "--lt-border1": rgba(fg, 0.32),
      "--lt-border2": rgba(fg, 0.22),
      "--lt-border3": rgba(fg, 0.15),
      "--lt-border4": rgba(fg, 0.09),
      "--lt-accent": t.accent,
      "--lt-accent-ink": t.ink,
      "--lt-accent2": t.accent2,
      "--lt-accent-soft": rgba(t.accent, 0.16),
      "--lt-accent-faint": rgba(t.accent, 0.28),
      "--lt-accent-line": rgba(t.accent, 0.5),
      "--lt-accent-sel": rgba(t.accent, 0.3),
      "--lt-easy": t.easy,
      "--lt-medium": t.medium,
      "--lt-hard": t.hard,
      "--lt-h-bg": hslTriple(t.bg),
      "--lt-h-text": hslTriple(fg),
      "--lt-h-layer2": hslTriple(t.layer2),
      "--lt-h-layer3": hslTriple(t.layer3),
      "--lt-h-accent": hslTriple(t.accent),
      "--lt-h-ink": hslTriple(t.ink),
      "--lt-h-muted": hslTriple(mix(fg, t.bg, 0.38)),
      "--lt-h-easy": hslTriple(t.easy),
      "--lt-h-medium": hslTriple(t.medium),
      "--lt-h-hard": hslTriple(t.hard),
      "--lt-l-accent": hslaList(t.accent, 0.12),
      "--lt-l-border": hslaList(fg, 0.1),
      "--lt-l-input": hslaList(fg, 0.14),
      "--lt-scene": sceneUrl(t),
      "--lt-dim": String(Math.round((1 - S.strength / 100) * 0.9 * 100) / 100),
    };
    return `html[data-lt]{${Object.entries(v).map(([k, val]) => `${k}:${val}`).join(";")}}`;
  }

  function styleEl() {
    let el = document.getElementById("lt-vars");
    if (!el) {
      el = document.createElement("style");
      el.id = "lt-vars";
      (document.head || html).appendChild(el);
    }
    return el;
  }

  /* ---------------- LeetCode's own light/dark mode ---------------- */
  function syncMode() {
    if (!S.enabled) return;
    const want = theme.mode, other = want === "dark" ? "light" : "dark";
    try {
      if (localStorage.getItem("lc-theme") !== want) localStorage.setItem("lc-theme", want);
    } catch { /* ignore */ }
    if (!html.classList.contains(want) || html.classList.contains(other)) {
      html.classList.remove(other);
      html.classList.add(want);
    }
    if (html.style.colorScheme !== want) html.style.colorScheme = want;
  }
  new MutationObserver(syncMode).observe(html, { attributes: true, attributeFilter: ["class"] });

  /* ---------------- apply ---------------- */
  function apply() {
    theme = getTheme(S.theme);
    writeCache();
    if (!S.enabled) {
      for (const a of ["data-lt", "data-lt-scene", "data-lt-font"]) html.removeAttribute(a);
      document.getElementById("lt-vars")?.remove();
      document.getElementById("lt-scenery")?.remove();
      document.getElementById("lt-switch")?.remove();
      return;
    }
    styleEl().textContent = buildVars(theme);
    html.setAttribute("data-lt", theme.id);
    html.toggleAttribute("data-lt-scene", !!S.scenery);
    html.toggleAttribute("data-lt-font", !!S.font);
    syncMode();
    if (bootMode && bootMode !== theme.mode) offerReload();
    whenBody(() => {
      ensureScenery();
      renderSwitcher();
      scheduleScan();
    });
  }

  function whenBody(fn) {
    if (document.body) fn();
    else document.addEventListener("DOMContentLoaded", fn, { once: true });
  }

  function ensureScenery() {
    if (!S.scenery) { document.getElementById("lt-scenery")?.remove(); return; }
    if (!document.getElementById("lt-scenery")) {
      const d = document.createElement("div");
      d.id = "lt-scenery";
      d.setAttribute("aria-hidden", "true");
      document.body.prepend(d);
    }
  }

  /* Page-sized wrappers painted with the page background would hide the scenery.
     Find them by geometry + color, and mark them transparent. */
  let scanTimer = 0;
  function scheduleScan() {
    if (!S.enabled || !S.scenery) return;
    clearTimeout(scanTimer);
    scanTimer = setTimeout(scan, 250);
  }
  function scan() {
    if (!document.body) return;
    const [r, g, b] = hexToRgb(theme.bg);
    const target = `rgb(${r}, ${g}, ${b})`;
    const vw = innerWidth, vh = innerHeight;
    (function walk(el, depth) {
      for (const c of el.children) {
        if (c.id === "lt-scenery" || c.id === "lt-switch") continue;
        const rect = c.getBoundingClientRect();
        if (rect.width < vw * 0.8 || rect.height < vh * 0.45) continue;
        if (getComputedStyle(c).backgroundColor === target) c.setAttribute("data-lt-clear", "");
        if (depth < 9) walk(c, depth + 1);
      }
    })(document.body, 0);
  }
  addEventListener("resize", scheduleScan);

  /* ---------------- reload prompt (light ↔ dark switch) ---------------- */
  function offerReload() {
    whenBody(() => {
      if (document.getElementById("lt-toast")) return;
      const t = document.createElement("div");
      t.id = "lt-toast";
      t.setAttribute("role", "status");
      t.innerHTML = `<span>Reload to switch the code editor to ${theme.mode} mode.</span>`;
      const go = document.createElement("button");
      go.textContent = "Reload";
      go.onclick = () => location.reload();
      const no = document.createElement("button");
      no.textContent = "Later";
      no.className = "lt-ghost";
      no.onclick = () => t.remove();
      t.append(go, no);
      document.body.appendChild(t);
    });
  }

  /* ---------------- quick switcher ---------------- */
  const PALETTE_ICON = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3a9 9 0 1 0 0 18c1.1 0 1.6-.8 1.6-1.6 0-.5-.2-.8-.5-1.2-.3-.3-.5-.7-.5-1.2 0-.9.7-1.6 1.6-1.6H16a5 5 0 0 0 5-5c0-4-4-7.4-9-7.4Z"/><circle cx="7.5" cy="10.5" r="1.2" fill="currentColor"/><circle cx="11" cy="7" r="1.2" fill="currentColor"/><circle cx="15.5" cy="8" r="1.2" fill="currentColor"/></svg>`;

  function renderSwitcher() {
    let root = document.getElementById("lt-switch");
    if (!S.switcher) { root?.remove(); return; }
    const wasOpen = root?.classList.contains("open");
    if (!root) {
      root = document.createElement("div");
      root.id = "lt-switch";
      document.body.appendChild(root);
      document.addEventListener("pointerdown", (e) => {
        const r = document.getElementById("lt-switch");
        if (r && !r.contains(e.target)) r.classList.remove("open");
      });
    }
    root.className = wasOpen ? "open" : "";
    root.innerHTML = "";

    const tab = document.createElement("button");
    tab.className = "lt-s-tab";
    tab.title = "Theme Studio";
    tab.setAttribute("aria-label", "Open Theme Studio switcher");
    tab.innerHTML = PALETTE_ICON;
    tab.onclick = () => root.classList.toggle("open");

    const panel = document.createElement("div");
    panel.className = "lt-s-panel";
    panel.innerHTML = `<div class="lt-s-title">Theme Studio</div>`;
    for (const t of THEMES) {
      const b = document.createElement("button");
      b.className = "lt-s-item";
      b.setAttribute("aria-current", String(t.id === theme.id));
      b.innerHTML = `<span class="lt-s-sw" style="background:linear-gradient(135deg, ${t.bg} 0 45%, ${t.accent} 45% 72%, ${t.accent2} 72%)"></span><span>${t.name}</span>`;
      b.onclick = () => save({ theme: t.id });
      panel.appendChild(b);
    }
    const row = document.createElement("div");
    row.className = "lt-s-row";
    row.innerHTML = `<span>Next theme</span><kbd>Alt + Shift + T</kbd>`;
    panel.appendChild(row);

    root.append(tab, panel);
  }

  addEventListener("keydown", (e) => {
    if (!S.enabled || !e.altKey || !e.shiftKey || e.code !== "KeyT") return;
    e.preventDefault();
    const i = THEMES.findIndex((t) => t.id === theme.id);
    save({ theme: THEMES[(i + 1) % THEMES.length].id });
  }, true);

  /* ---------------- "Accepted" celebration ---------------- */
  const RESULT = '[data-e2e-locator="submission-result"]';
  const QUIPS = ["Clean solve.", "Another one down.", "Green across the board.", "Ship it.", "Streak alive.", "That's the one.", "Nailed it."];
  let armedUntil = 0, staleNode = null, sawGap = false;

  function arm() {
    armedUntil = Date.now() + 120000;
    staleNode = document.querySelector(RESULT);
    sawGap = false;
  }
  document.addEventListener("click", (e) => {
    if (e.target instanceof Element && e.target.closest('[data-e2e-locator="console-submit-button"]')) arm();
  }, true);
  document.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") arm();
  }, true);

  function checkResult() {
    if (!armedUntil) return;
    if (Date.now() > armedUntil) { armedUntil = 0; return; }
    const node = document.querySelector(RESULT);
    const text = node?.textContent.trim() || "";
    if (!node || !text.startsWith("Accepted")) { if (!node || text) sawGap = true; return; }
    if (node === staleNode && !sawGap) return;
    armedUntil = 0;
    if (S.enabled && S.celebrate) celebrate();
  }

  function celebrate() {
    document.getElementById("lt-celebrate")?.remove();
    const title = document.title.replace(/\s*-\s*LeetCode.*$/i, "").trim();
    const quip = QUIPS[Math.floor(Math.random() * QUIPS.length)];
    const el = document.createElement("div");
    el.id = "lt-celebrate";
    el.setAttribute("role", "status");
    el.innerHTML = `<div class="lt-c-inner"><div class="lt-c-band"></div><div class="lt-c-kicker">SUBMISSION</div><div class="lt-c-word">ACCEPTED</div><div class="lt-c-sub"></div></div>`;
    el.querySelector(".lt-c-sub").textContent = title ? `${title} · ${quip}` : quip;
    const colors = [theme.accent, theme.accent2, theme.easy, "#ffffff"];
    for (let i = 0; i < 44; i++) {
      const s = document.createElement("span");
      s.className = "lt-spark";
      s.style.background = colors[i % colors.length];
      s.style.setProperty("--r", `${Math.random() * 360}deg`);
      s.style.setProperty("--dist", `${180 + Math.random() * 420}px`);
      s.style.setProperty("--d", `${0.2 + Math.random() * 0.25}s`);
      el.appendChild(s);
    }
    el.onclick = () => el.remove();
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 3000);
  }

  /* ---------------- DOM watching ---------------- */
  let pending = false;
  function onMutate() {
    if (pending) return;
    pending = true;
    requestAnimationFrame(() => {
      pending = false;
      checkResult();
      if (S.enabled && S.scenery) {
        if (!document.getElementById("lt-scenery")) ensureScenery();
        scheduleScan();
      }
      if (S.enabled && S.switcher && !document.getElementById("lt-switch")) renderSwitcher();
    });
  }
  whenBody(() => {
    new MutationObserver(onMutate).observe(document.body, { childList: true, subtree: true, characterData: true });
  });

  /* ---------------- boot ---------------- */
  const cached = readCache();
  if (cached) S = { ...DEFAULTS, ...cached };
  if (!S.enabled) {
    // LeetCode's own mode for this page load, so we know if enabling later needs a reload
    let m = null;
    try { m = localStorage.getItem("lc-theme"); } catch { /* ignore */ }
    bootMode = m === "light" || m === "dark" ? m : (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  }
  apply(); // synchronous first paint from the cache — no flash
  if (S.enabled) bootMode = theme.mode;

  try {
    chrome.runtime.onMessage.addListener((msg, _sender, reply) => {
      if (msg?.type === "lts-celebrate") { whenBody(celebrate); reply(true); }
    });
    chrome.storage.sync.get("lts", ({ lts }) => {
      if (lts) { S = { ...DEFAULTS, ...lts }; apply(); }
      else chrome.storage.sync.set({ lts: S });
    });
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area === "sync" && changes.lts?.newValue) {
        S = { ...DEFAULTS, ...changes.lts.newValue };
        apply();
      }
    });
  } catch { /* running without extension APIs */ }
})();
