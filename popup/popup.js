(function () {
  "use strict";
  const { THEMES, DEFAULTS, getTheme, rgba, sceneUrl } = window.LTS;
  const $ = (id) => document.getElementById(id);
  const TOGGLES = ["enabled", "scenery", "glass", "celebrate", "font", "switcher"];
  let S = { ...DEFAULTS };

  function paint() {
    const t = getTheme(S.theme);
    const r = document.documentElement.style;
    r.setProperty("--bg", t.bg);
    r.setProperty("--layer", t.layer1);
    r.setProperty("--layer2", t.layer2);
    r.setProperty("--text", t.text);
    r.setProperty("--muted", rgba(t.text, 0.58));
    r.setProperty("--line", rgba(t.text, 0.1));
    r.setProperty("--accent", t.accent);
    r.setProperty("--ink", t.ink);
    r.setProperty("--accent2", t.accent2);
    r.setProperty("--easy", t.easy);
    r.setProperty("--medium", t.medium);
    r.setProperty("--hard", t.hard);
    r.setProperty("--scene", sceneUrl(t));
    r.colorScheme = t.mode;

    $("heroName").textContent = t.name;
    $("heroTag").textContent = t.tag;
    $("heroMode").textContent = t.mode === "dark" ? "Dark world" : "Light world";

    for (const k of TOGGLES) $(k).checked = !!S[k];
    $("strength").value = S.strength;
    $("strengthVal").textContent = `${S.strength}%`;
    $("strengthRow").classList.toggle("disabled", !S.scenery);
    document.body.classList.toggle("off", !S.enabled);

    for (const card of document.querySelectorAll(".card")) {
      card.setAttribute("aria-checked", String(card.dataset.id === t.id));
      card.tabIndex = card.dataset.id === t.id ? 0 : -1;
    }
  }

  function save(patch) {
    S = { ...S, ...patch };
    paint();
    chrome.storage.sync.set({ lts: S });
  }

  function buildGrid() {
    const grid = $("grid");
    for (const t of THEMES) {
      const b = document.createElement("button");
      b.className = "card";
      b.dataset.id = t.id;
      b.setAttribute("role", "radio");
      b.setAttribute("aria-label", `${t.name}: ${t.tag}`);
      b.innerHTML = `
        <span class="sc" style='background-image:${sceneUrl(t)}'></span>
        ${t.mode === "light" ? '<span class="mode">Light</span>' : ""}
        <span class="tick" style="background:${t.accent};color:${t.ink}">✓</span>
        <span class="lbl"><span class="nm">${t.name}</span>
          <span class="sw"><i style="background:${t.accent}"></i><i style="background:${t.accent2}"></i><i style="background:${t.easy}"></i></span></span>`;
      b.addEventListener("click", () => save({ theme: t.id }));
      grid.appendChild(b);
    }
    // arrow-key navigation across the radio group
    grid.addEventListener("keydown", (e) => {
      const keys = { ArrowRight: 1, ArrowDown: 2, ArrowLeft: -1, ArrowUp: -2 };
      if (!(e.key in keys)) return;
      e.preventDefault();
      const i = THEMES.findIndex((t) => t.id === S.theme);
      const n = (i + keys[e.key] + THEMES.length) % THEMES.length;
      save({ theme: THEMES[n].id });
      grid.querySelector(`[data-id="${THEMES[n].id}"]`).focus();
    });
  }

  function wire() {
    for (const k of TOGGLES) $(k).addEventListener("change", (e) => save({ [k]: e.target.checked }));
    $("strength").addEventListener("input", (e) => save({ strength: Number(e.target.value) }));
    $("preview").addEventListener("click", async () => {
      const status = $("status");
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        await chrome.tabs.sendMessage(tab.id, { type: "lts-celebrate" });
        status.textContent = "";
        window.close();
      } catch {
        status.textContent = "Open a LeetCode tab first.";
      }
    });
  }

  buildGrid();
  wire();
  paint();
  const ready = () => requestAnimationFrame(() => document.body.classList.add("ready"));
  try {
    chrome.storage.sync.get("lts", ({ lts }) => {
      if (lts) S = { ...DEFAULTS, ...lts };
      paint();
      ready();
    });
  } catch { ready(); }
})();
