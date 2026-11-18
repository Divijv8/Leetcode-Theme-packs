/* LeetCode Studio — theme definitions + color helpers.
 * Shared by the content script and the popup (loaded as a plain script). */
(function (root) {
  "use strict";

  const THEMES = [
    {
      id: "ultraviolet", name: "Ultraviolet", tag: "Moonlit lavender", mode: "dark", scene: "moon",
      bg: "#0c0814", layer1: "#150e20", layer2: "#1d1430", layer3: "#271a3e",
      text: "#f1eafc", accent: "#c9a6ff", ink: "#170c26", accent2: "#ff7ac6",
      easy: "#5eead4", medium: "#fcd34d", hard: "#fb7185",
      sky: ["#0c0814", "#241142", "#5a2470"], glow: "#e9d5ff",
    },
    {
      id: "synthwave", name: "Synthwave", tag: "Neon sunset drive", mode: "dark", scene: "grid",
      bg: "#0e0520", layer1: "#170a2c", layer2: "#21103d", layer3: "#2c1650",
      text: "#fdf0ff", accent: "#ff5ccd", ink: "#22041c", accent2: "#29e7ff",
      easy: "#29e7ff", medium: "#ffd166", hard: "#ff4d6d",
      sky: ["#0e0520", "#3b0b5c", "#b0306e"], glow: "#ffb86b",
    },
    {
      id: "aurora", name: "Aurora", tag: "Northern lights", mode: "dark", scene: "aurora",
      bg: "#050f17", layer1: "#0a1822", layer2: "#10222f", layer3: "#172d3d",
      text: "#e6fbff", accent: "#5ef2c2", ink: "#03231b", accent2: "#8ea8ff",
      easy: "#5ef2c2", medium: "#ffd479", hard: "#ff7a90",
      sky: ["#050f17", "#08202c", "#0c3140"], glow: "#5ef2c2",
    },
    {
      id: "ember", name: "Ember", tag: "Desert dusk, warm glow", mode: "dark", scene: "dunes",
      bg: "#110a08", layer1: "#1a110d", layer2: "#241812", layer3: "#302019",
      text: "#fff1e6", accent: "#ff8a4c", ink: "#2a0f02", accent2: "#ffd166",
      easy: "#9be38a", medium: "#ffd166", hard: "#ff5a5f",
      sky: ["#110a08", "#3a160c", "#a2401a"], glow: "#ffb070",
    },
    {
      id: "matcha", name: "Matcha", tag: "Calm, earthy, focused", mode: "dark", scene: "topo",
      bg: "#0d120e", layer1: "#141b15", layer2: "#1b241c", layer3: "#243026",
      text: "#eef5e6", accent: "#b5e07a", ink: "#172208", accent2: "#f1d9a7",
      easy: "#8fe3b0", medium: "#f1d27a", hard: "#ff8a7a",
      sky: ["#0d120e", "#122016", "#1a2e1e"], glow: "#b5e07a",
    },
    {
      id: "abyss", name: "Abyss", tag: "Deep sea, light rays", mode: "dark", scene: "rays",
      bg: "#040a16", layer1: "#081226", layer2: "#0d1a33", layer3: "#142543",
      text: "#e3efff", accent: "#4cc9ff", ink: "#021624", accent2: "#8f7bff",
      easy: "#3ee6c4", medium: "#ffcf5c", hard: "#ff6b8b",
      sky: ["#040a16", "#06213d", "#0a3a63"], glow: "#7fd8ff",
    },
    {
      id: "graphite", name: "Graphite", tag: "Minimal mono, acid lime", mode: "dark", scene: "dots",
      bg: "#0a0a0a", layer1: "#121212", layer2: "#191919", layer3: "#232323",
      text: "#f2f2f2", accent: "#d7ff3a", ink: "#141a00", accent2: "#ffffff",
      easy: "#6ee7b7", medium: "#fde047", hard: "#f87171",
      sky: ["#0a0a0a", "#101010", "#161616"], glow: "#d7ff3a",
    },
    {
      id: "paper", name: "Paper", tag: "Warm light, ink & vermilion", mode: "light", scene: "paper",
      bg: "#efe9df", layer1: "#fbf8f2", layer2: "#f5f0e7", layer3: "#ffffff",
      text: "#1f1b16", accent: "#e2552d", ink: "#ffffff", accent2: "#2f5bd3",
      easy: "#138a72", medium: "#b7791f", hard: "#d1344b",
      sky: ["#efe9df", "#f3ece0", "#f7efe2"], glow: "#e2552d",
    },
  ];

  const DEFAULTS = {
    enabled: true,
    theme: "ultraviolet",
    scenery: true,
    strength: 70,      // 0..100 — how visible the backdrop is
    glass: true,       // translucent panels
    celebrate: true,   // "Accepted" animation
    font: false,       // Space Grotesk for UI text
    switcher: true,    // floating quick-switch tab on the page
  };

  /* ---------- color helpers ---------- */
  function hexToRgb(hex) {
    let h = hex.replace("#", "");
    if (h.length === 3) h = h.split("").map((c) => c + c).join("");
    const n = parseInt(h, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  function rgba(hex, a) {
    const [r, g, b] = hexToRgb(hex);
    return `rgba(${r}, ${g}, ${b}, ${a})`;
  }
  function hsl(hex) {
    let [r, g, b] = hexToRgb(hex).map((v) => v / 255);
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0; const l = (max + min) / 2;
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
      else if (max === g) h = (b - r) / d + 2;
      else h = (r - g) / d + 4;
      h *= 60;
    }
    return [Math.round(h * 10) / 10, Math.round(s * 1000) / 10, Math.round(l * 1000) / 10];
  }
  /** "H S% L%" — the space-separated triple LeetCode's `hsl(var(--sd-*))` expects */
  function hslTriple(hex) { const [h, s, l] = hsl(hex); return `${h} ${s}% ${l}%`; }
  /** "H,S%,L%,A" — the comma form LeetCode uses for --sd-border / --sd-accent */
  function hslaList(hex, a) { const [h, s, l] = hsl(hex); return `${h},${s}%,${l}%,${a}`; }
  function mix(a, b, t) {
    const A = hexToRgb(a), B = hexToRgb(b);
    return "#" + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, "0")).join("");
  }

  function getTheme(id) { return THEMES.find((t) => t.id === id) || THEMES[0]; }

  root.LTS = { THEMES, DEFAULTS, getTheme, hexToRgb, rgba, hsl, hslTriple, hslaList, mix };
})(typeof window !== "undefined" ? window : globalThis);
