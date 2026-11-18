/* LeetCode Studio — generative backdrops.
 * Every scene is a single SVG built from the theme's colors, so there are no image assets. */
(function (root) {
  "use strict";
  const W = 1600, H = 900;

  function rng(seed) {
    return function () {
      seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const f = (n) => Math.round(n * 10) / 10;

  function skyGrad(t, id = "sky") {
    return `<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${t.sky[0]}"/><stop offset=".55" stop-color="${t.sky[1]}"/><stop offset="1" stop-color="${t.sky[2]}"/></linearGradient>`;
  }
  function stars(r, n, color, maxY = H * 0.7, maxR = 1.6) {
    let s = "";
    for (let i = 0; i < n; i++) {
      const x = r() * W, y = r() * maxY, rad = 0.4 + r() * maxR, o = 0.25 + r() * 0.75;
      s += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(rad)}" fill="${color}" opacity="${f(o)}"/>`;
    }
    return s;
  }
  /** A jagged ridge line from left to right, closed to the bottom edge. */
  function ridge(r, baseY, amp, step, color, opacity = 1) {
    let d = `M0 ${H} L0 ${f(baseY)}`;
    let y = baseY;
    for (let x = 0; x <= W + step; x += step) {
      y = baseY + (r() - 0.5) * amp * 2;
      d += ` L${f(x)} ${f(y)}`;
    }
    return `<path d="${d} L${W} ${H} Z" fill="${color}" opacity="${opacity}"/>`;
  }
  /** A smooth rolling curve (for dunes / hills). */
  function wave(r, baseY, amp, color, opacity = 1, segs = 5) {
    const pts = [];
    for (let i = 0; i <= segs; i++) pts.push([(W / segs) * i, baseY + (r() - 0.5) * amp * 2]);
    let d = `M0 ${H} L${pts[0][0]} ${f(pts[0][1])}`;
    for (let i = 1; i < pts.length; i++) {
      const [x0, y0] = pts[i - 1], [x1, y1] = pts[i], cx = (x0 + x1) / 2;
      d += ` C${f(cx)} ${f(y0)} ${f(cx)} ${f(y1)} ${f(x1)} ${f(y1)}`;
    }
    return `<path d="${d} L${W} ${H} Z" fill="${color}" opacity="${opacity}"/>`;
  }

  const SCENES = {
    moon(t) {
      const r = rng(7), m = LTS.mix;
      return `<defs>${skyGrad(t)}
        <radialGradient id="mg" cx=".42" cy=".38" r=".7"><stop offset="0" stop-color="#fff"/><stop offset=".55" stop-color="${t.glow}"/><stop offset="1" stop-color="${t.accent}"/></radialGradient>
        <radialGradient id="halo"><stop offset="0" stop-color="${t.glow}" stop-opacity=".55"/><stop offset="1" stop-color="${t.glow}" stop-opacity="0"/></radialGradient></defs>
        <rect width="${W}" height="${H}" fill="url(#sky)"/>
        ${stars(r, 140, "#fff")}
        <circle cx="1240" cy="330" r="420" fill="url(#halo)"/>
        <circle cx="1240" cy="330" r="168" fill="url(#mg)"/>
        <circle cx="1190" cy="300" r="26" fill="${t.accent}" opacity=".18"/><circle cx="1290" cy="380" r="40" fill="${t.accent}" opacity=".14"/><circle cx="1215" cy="420" r="16" fill="${t.accent}" opacity=".16"/>
        ${ridge(r, 600, 60, 80, m(t.sky[2], t.bg, 0.45), 0.9)}
        ${ridge(r, 690, 45, 60, m(t.sky[1], t.bg, 0.55))}
        ${ridge(r, 790, 30, 40, t.bg)}`;
    },

    grid(t) {
      const r = rng(11), hz = 560;
      let stripes = "";
      for (let i = 0; i < 7; i++) {
        const y = 470 + i * 28, h = 3 + i * 2.2;
        stripes += `<rect x="0" y="${f(y)}" width="${W}" height="${f(h)}" fill="#000"/>`;
      }
      let grid = "";
      for (let i = 1; i < 18; i++) {
        const y = hz + Math.pow(i / 17, 2.1) * (H - hz);
        grid += `<line x1="0" y1="${f(y)}" x2="${W}" y2="${f(y)}"/>`;
      }
      for (let i = -24; i <= 24; i++) {
        grid += `<line x1="800" y1="${hz}" x2="${800 + i * 140}" y2="${H}"/>`;
      }
      return `<defs>${skyGrad(t)}
        <linearGradient id="sun" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${t.glow}"/><stop offset="1" stop-color="${t.accent}"/></linearGradient>
        <linearGradient id="gnd" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${LTS.mix(t.sky[1], t.bg, .4)}"/><stop offset="1" stop-color="${t.bg}"/></linearGradient>
        <mask id="cut"><rect width="${W}" height="${H}" fill="#fff"/>${stripes}</mask>
        <radialGradient id="halo"><stop offset="0" stop-color="${t.accent}" stop-opacity=".5"/><stop offset="1" stop-color="${t.accent}" stop-opacity="0"/></radialGradient></defs>
        <rect width="${W}" height="${H}" fill="url(#sky)"/>
        ${stars(r, 90, "#fff", 380, 1.2)}
        <circle cx="800" cy="470" r="420" fill="url(#halo)"/>
        <circle cx="800" cy="440" r="230" fill="url(#sun)" mask="url(#cut)"/>
        ${ridge(r, hz - 30, 40, 70, LTS.mix(t.sky[1], t.bg, .5))}
        <rect y="${hz}" width="${W}" height="${H - hz}" fill="url(#gnd)"/>
        <g stroke="${t.accent2}" stroke-width="1.6" opacity=".55">${grid}</g>
        <line x1="0" y1="${hz}" x2="${W}" y2="${hz}" stroke="${t.accent}" stroke-width="2.5" opacity=".9"/>`;
    },

    aurora(t) {
      const r = rng(23);
      const band = (y, c, o, k) =>
        `<path d="M-100 ${y} C 300 ${y - 160 * k} 600 ${y + 120 * k} 900 ${y - 60 * k} S 1400 ${y - 200 * k} 1700 ${y - 40 * k} L1700 ${y + 60} C 1300 ${y - 80 * k} 1000 ${y + 140 * k} 700 ${y + 60} S 200 ${y - 40 * k} -100 ${y + 90} Z" fill="${c}" opacity="${o}"/>`;
      return `<defs>${skyGrad(t)}<filter id="b" x="-20%" y="-50%" width="140%" height="200%"><feGaussianBlur stdDeviation="38"/></filter></defs>
        <rect width="${W}" height="${H}" fill="url(#sky)"/>
        ${stars(r, 170, "#fff", H * 0.75, 1.3)}
        <g filter="url(#b)">${band(300, t.accent, .55, 1)}${band(380, t.accent2, .4, -.8)}${band(220, t.glow, .3, .6)}</g>
        ${wave(r, 720, 40, LTS.mix(t.sky[2], t.bg, .4), 1, 6)}
        ${ridge(r, 800, 22, 18, t.bg)}`;
    },

    dunes(t) {
      const r = rng(31), m = LTS.mix;
      let embers = "";
      for (let i = 0; i < 70; i++) {
        embers += `<circle cx="${f(r() * W)}" cy="${f(200 + r() * 600)}" r="${f(0.8 + r() * 2.4)}" fill="${r() > .5 ? t.accent : t.accent2}" opacity="${f(.2 + r() * .6)}"/>`;
      }
      return `<defs>${skyGrad(t)}
        <radialGradient id="sun" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fff3d6"/><stop offset=".25" stop-color="${t.glow}"/><stop offset="1" stop-color="${t.accent}" stop-opacity="0"/></radialGradient></defs>
        <rect width="${W}" height="${H}" fill="url(#sky)"/>
        ${stars(r, 60, "#ffe9d6", 300, 1)}
        <circle cx="420" cy="560" r="360" fill="url(#sun)" opacity=".85"/>
        ${wave(r, 560, 60, m(t.sky[2], t.bg, .45), 1, 4)}
        ${wave(r, 650, 50, m(t.sky[2], t.bg, .68), 1, 5)}
        ${wave(r, 760, 40, m(t.sky[1], t.bg, .7), 1, 4)}
        ${wave(r, 850, 25, t.bg, 1, 5)}
        ${embers}`;
    },

    topo(t) {
      const r = rng(41);
      let lines = "";
      const centers = [[1180, 260, 15], [300, 700, 12], [820, 980, 9]];
      for (const [cx, cy, rings] of centers) {
        const ph = r() * 6;
        for (let k = 1; k <= rings; k++) {
          const base = k * 34;
          let d = "";
          for (let a = 0; a <= 64; a++) {
            const th = (a / 64) * Math.PI * 2;
            const rad = base * (1 + 0.18 * Math.sin(th * 3 + ph + k * 0.3) + 0.08 * Math.sin(th * 5 - ph));
            d += `${a ? "L" : "M"}${f(cx + Math.cos(th) * rad * 1.25)} ${f(cy + Math.sin(th) * rad)}`;
          }
          lines += `<path d="${d}Z" opacity="${f(0.15 + (k % 5 === 0 ? 0.35 : 0))}" stroke-width="${k % 5 === 0 ? 1.8 : 1}"/>`;
        }
      }
      return `<defs>${skyGrad(t)}
        <radialGradient id="g" cx=".75" cy=".25" r=".6"><stop offset="0" stop-color="${t.accent}" stop-opacity=".16"/><stop offset="1" stop-color="${t.accent}" stop-opacity="0"/></radialGradient></defs>
        <rect width="${W}" height="${H}" fill="url(#sky)"/><rect width="${W}" height="${H}" fill="url(#g)"/>
        <g fill="none" stroke="${t.accent}">${lines}</g>`;
    },

    rays(t) {
      const r = rng(53);
      let rays = "", bubbles = "";
      for (let i = 0; i < 9; i++) {
        const x = 150 + i * 170 + r() * 80, w = 30 + r() * 90, sk = 220 + r() * 260;
        rays += `<path d="M${f(x)} -20 L${f(x + w)} -20 L${f(x + w + sk)} ${H} L${f(x + sk - w)} ${H} Z" opacity="${f(.05 + r() * .1)}"/>`;
      }
      for (let i = 0; i < 46; i++) {
        bubbles += `<circle cx="${f(r() * W)}" cy="${f(r() * H)}" r="${f(1.5 + r() * 6)}" opacity="${f(.15 + r() * .4)}"/>`;
      }
      return `<defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${t.sky[2]}"/><stop offset=".55" stop-color="${t.sky[1]}"/><stop offset="1" stop-color="${t.sky[0]}"/></linearGradient>
        <filter id="b"><feGaussianBlur stdDeviation="14"/></filter></defs>
        <rect width="${W}" height="${H}" fill="url(#sky)"/>
        <g fill="${t.glow}" filter="url(#b)">${rays}</g>
        <g fill="none" stroke="${t.glow}" stroke-width="1.2">${bubbles}</g>
        ${wave(r, 830, 30, t.bg, 1, 7)}`;
    },

    dots(t) {
      let dots = "";
      for (let y = 20; y < H; y += 36) for (let x = 20; x < W; x += 36) dots += `<circle cx="${x}" cy="${y}" r="1.3"/>`;
      return `<defs><radialGradient id="g" cx=".85" cy=".1" r=".75"><stop offset="0" stop-color="${t.accent}" stop-opacity=".22"/><stop offset="1" stop-color="${t.accent}" stop-opacity="0"/></radialGradient>
        <radialGradient id="v" cx=".5" cy=".5" r=".75"><stop offset=".4" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".7"/></radialGradient></defs>
        <rect width="${W}" height="${H}" fill="${t.bg}"/>
        <g fill="#fff" opacity=".11">${dots}</g>
        <rect width="${W}" height="${H}" fill="url(#g)"/>
        <circle cx="1300" cy="180" r="260" fill="none" stroke="${t.accent}" stroke-opacity=".22" stroke-width="1.5"/>
        <circle cx="1300" cy="180" r="180" fill="none" stroke="${t.accent}" stroke-opacity=".12" stroke-dasharray="4 10"/>
        <rect width="${W}" height="${H}" fill="url(#v)"/>`;
    },

    paper(t) {
      let grid = "";
      for (let x = 0; x <= W; x += 40) grid += `<line x1="${x}" y1="0" x2="${x}" y2="${H}" stroke-width="${x % 200 ? .6 : 1.2}"/>`;
      for (let y = 0; y <= H; y += 40) grid += `<line x1="0" y1="${y}" x2="${W}" y2="${y}" stroke-width="${y % 200 ? .6 : 1.2}"/>`;
      return `<defs><filter id="b"><feGaussianBlur stdDeviation="70"/></filter></defs>
        <rect width="${W}" height="${H}" fill="${t.bg}"/>
        <g filter="url(#b)"><circle cx="1300" cy="160" r="240" fill="${t.accent}" opacity=".22"/><circle cx="220" cy="760" r="260" fill="${t.accent2}" opacity=".16"/></g>
        <g stroke="${t.accent2}" opacity=".13">${grid}</g>`;
    },
  };

  const cache = new Map();
  /** CSS `url(...)` for a theme's scene */
  function sceneUrl(theme) {
    if (cache.has(theme.id)) return cache.get(theme.id);
    const body = (SCENES[theme.scene] || SCENES.dots)(theme);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice">${body}</svg>`;
    const url = `url("data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg.replace(/\s{2,}/g, " "))}")`;
    cache.set(theme.id, url);
    return url;
  }

  root.LTS.sceneUrl = sceneUrl;
})(typeof window !== "undefined" ? window : globalThis);
