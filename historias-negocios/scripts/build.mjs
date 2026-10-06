// Genera las composiciones raíz a partir de una sola configuración:
//   - index.html            → vídeo completo (4 historias + cortinillas + cierre del interruptor)
//   - .build/<historia>/    → un proyecto HyperFrames por historia suelta (copias reales, sin enlaces)
//
//   node scripts/build.mjs          (lo llama scripts/render.mjs antes de renderizar)
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

// Duración de cada efecto de sonido (s), medida con ffprobe.
const SFX_DUR = {
  "whoosh": 0.575, "whoosh-short": 0.575, "pop": 0.72, "click": 0.366, "click-soft": 0.366,
  "impact-bass-1": 2.116, "sparkle": 1.802, "ping": 1.32, "notification": 2.456,
};

// Escenas y sus sonidos, en tiempo local de cada historia: [efecto, segundo, volumen].
export const STORIES = [
  { id: "hosteleria", dur: 7, sfx: [["pop", 1.25, 0.5], ["pop", 1.39, 0.5], ["pop", 1.53, 0.5]] },
  { id: "comercios", dur: 7, sfx: [["click-soft", 0.62, 0.6], ["pop", 1.3, 0.45], ["pop", 1.44, 0.45], ["pop", 1.58, 0.45]] },
  { id: "oficinas", dur: 7, sfx: [["click-soft", 0.62, 0.6], ["pop", 1.3, 0.45], ["pop", 1.46, 0.45], ["sparkle", 1.5, 0.22]] },
  { id: "varios-locales", dur: 9, sfx: [["pop", 1.0, 0.5], ["pop", 1.3, 0.5], ["pop", 1.6, 0.5], ["pop", 1.9, 0.5], ["impact-bass-1", 2.42, 0.12], ["click-soft", 2.9, 0.6]] },
];

// Vídeo completo
const WIPE = 0.9;
const STARTS = [0, 6.4, 12.8, 19.2];
const OUTRO = 27.8;          // entra el interruptor
const CLICK = 28.8;          // clic y negro
const TOTAL = 30.0;

const W = 1080, H = 1920;
const r3 = (n) => Math.round(n * 1000) / 1000;

function audioTags(cues, firstId) {
  // reparte los efectos en pistas para que no se pisen en el timeline de Studio
  const trackEnds = [];
  return cues.map(([name, t, vol], i) => {
    const d = SFX_DUR[name];
    let k = trackEnds.findIndex((end) => end <= t);
    if (k < 0) { k = trackEnds.length; trackEnds.push(0); }
    trackEnds[k] = t + d;
    return `      <audio id="sfx-${firstId + i}" src="assets/sfx/${name}.mp3" data-start="${r3(t)}" data-duration="${d}" data-track-index="${20 + k}" data-volume="${vol}"></audio>`;
  }).join("\n");
}

function slot(story, start, dur, track, wrapId) {
  const host = `<div id="el-${story.id}" data-composition-id="${story.id}" data-composition-src="compositions/${story.id}.html"
          data-start="${r3(start)}" data-duration="${r3(dur)}" data-track-index="${track}" data-width="${W}" data-height="${H}"></div>`;
  return wrapId ? `      <div class="wipe" id="${wrapId}">\n        ${host}\n      </div>` : `      ${host}`;
}

const HEAD = (title) => `<!doctype html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=${W}, height=${H}" />
    <title>${title}</title>
    <script src="vendor/gsap.min.js"></script>
    <script src="assets/historias.js"></script>`;

function masterHtml() {
  const slots = STORIES.map((s, i) => {
    const end = i < 3 ? STARTS[i + 1] + WIPE : TOTAL;
    return slot(s, STARTS[i], end - STARTS[i], 1 + i, `w${i + 1}`);
  }).join("\n");
  const cues = [["whoosh-short", 0.2, 0.45]];
  STORIES.forEach((s, i) => s.sfx.forEach(([n, t, v]) => cues.push([n, STARTS[i] + t, v])));
  [6.4, 12.8, 19.2].forEach((t) => cues.push(["whoosh", t + 0.12, 0.6]));
  cues.push(["whoosh-short", OUTRO, 0.4], ["click", CLICK, 0.9]);
  cues.sort((a, b) => a[1] - b[1]);
  return `${HEAD("Historias NEGOCIOS · completo")}
    <style>
      html, body { margin: 0; width: ${W}px; height: ${H}px; overflow: hidden; background: #0d2720; }
      #root { position: relative; width: 100%; height: 100%; overflow: hidden; }
      .wipe { position: absolute; inset: 0; }
      .wipe > div[data-composition-src] { position: absolute; inset: 0; }
      #edge { position: absolute; left: 0; right: 0; top: 0; height: 6px; background: #c4ec43; z-index: 20; opacity: 0;
        box-shadow: 0 0 28px 6px rgba(196, 236, 67, 0.55), 0 0 90px 20px rgba(196, 236, 67, 0.18); }
      #el-cierre { position: absolute; inset: 0; z-index: 30; }
      #black { position: absolute; inset: 0; z-index: 40; background: #000; }
    </style>
  </head>
  <body>
    <div id="root" data-composition-id="main" data-start="0" data-duration="${TOTAL}" data-width="${W}" data-height="${H}">
${slots}
      <div id="edge"></div>
      <div id="el-cierre" data-composition-id="cierre" data-composition-src="compositions/cierre.html"
        data-start="${OUTRO}" data-duration="${r3(TOTAL - OUTRO)}" data-track-index="6" data-width="${W}" data-height="${H}"></div>
      <div id="black" class="clip" data-start="${r3(CLICK + 0.04)}" data-duration="${r3(TOTAL - CLICK - 0.04)}" data-track-index="7"></div>
      <audio id="cama" src="assets/audio/cama-completo.mp3" data-start="0" data-duration="${TOTAL}" data-track-index="10" data-volume="0.85"></audio>
${audioTags(cues, 1)}
    </div>
    <script>
      const tl = gsap.timeline({ paused: true });
      const WIPE = ${WIPE};
      [["#w1", "#w2", ${STARTS[1]}], ["#w2", "#w3", ${STARTS[2]}], ["#w3", "#w4", ${STARTS[3]}]].forEach(([out, inc, t], i) => {
        tl.fromTo(inc, { clipPath: "inset(100% 0% 0% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: WIPE, ease: "expo.inOut" }, t);
        tl.fromTo("#edge", { y: ${H}, opacity: 1 }, { y: -6, duration: WIPE, ease: "expo.inOut", immediateRender: i === 0 }, t);
        tl.set("#edge", { opacity: 0 }, t + WIPE);
        tl.fromTo(out, { y: 0 }, { y: -220, duration: WIPE, ease: "expo.inOut", immediateRender: false }, t);
      });
      window.__timelines["main"] = tl;
    </script>
  </body>
</html>
`;
}

function soloHtml(story) {
  const cues = [["whoosh-short", 0.2, 0.45], ...story.sfx];
  return `${HEAD(`Historia ${story.id}`)}
    <style>
      html, body { margin: 0; width: ${W}px; height: ${H}px; overflow: hidden; background: #0d2720; }
      #root { position: relative; width: 100%; height: 100%; overflow: hidden; }
      #root > div[data-composition-src] { position: absolute; inset: 0; }
    </style>
  </head>
  <body>
    <div id="root" data-composition-id="main" data-start="0" data-duration="${story.dur}" data-width="${W}" data-height="${H}">
${slot(story, 0, story.dur, 1)}
      <audio id="cama" src="assets/audio/cama-${story.id}.mp3" data-start="0" data-duration="${story.dur}" data-track-index="10" data-volume="0.85"></audio>
${audioTags(cues, 1)}
    </div>
    <script>
      window.__timelines["main"] = gsap.timeline({ paused: true });
    </script>
  </body>
</html>
`;
}

function copyDir(src, dst, skip = () => false) {
  fs.mkdirSync(dst, { recursive: true });
  for (const e of fs.readdirSync(src, { withFileTypes: true })) {
    if (skip(e.name)) continue;
    const a = path.join(src, e.name), b = path.join(dst, e.name);
    e.isDirectory() ? copyDir(a, b, skip) : fs.copyFileSync(a, b);
  }
}

export function build() {
  fs.writeFileSync(path.join(ROOT, "index.html"), masterHtml());
  const out = path.join(ROOT, ".build");
  fs.rmSync(out, { recursive: true, force: true });
  for (const s of STORIES) {
    const d = path.join(out, s.id);
    copyDir(path.join(ROOT, "assets"), path.join(d, "assets"), (n) => n === "cama-completo.mp3" || n.endsWith(".wav"));
    copyDir(path.join(ROOT, "vendor"), path.join(d, "vendor"));
    fs.mkdirSync(path.join(d, "compositions"), { recursive: true });
    fs.copyFileSync(path.join(ROOT, "compositions", `${s.id}.html`), path.join(d, "compositions", `${s.id}.html`));
    fs.copyFileSync(path.join(ROOT, "hyperframes.json"), path.join(d, "hyperframes.json"));
    fs.writeFileSync(path.join(d, "meta.json"), JSON.stringify({ id: `historia-${s.id}`, name: `historia-${s.id}` }, null, 2) + "\n");
    fs.writeFileSync(path.join(d, "index.html"), soloHtml(s));
  }
  return { out, stories: STORIES.map((s) => s.id) };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const r = build();
  console.log(`✓ index.html y ${r.stories.length} proyectos en ${path.relative(ROOT, r.out)}/`);
}
