// Renderiza el vídeo completo y las 4 historias sueltas con HyperFrames.
//
//   node scripts/render.mjs                 # todo, calidad "looks" (CRF 16)
//   node scripts/render.mjs --quality draft # rápido, para revisar
//   node scripts/render.mjs comercios main  # solo lo indicado ("main" = vídeo completo)
//
// Usa `npx hyperframes`, o el binario de HYPERFRAMES_BIN si está definido.
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { build, STORIES } from "./build.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const argv = process.argv.slice(2);
const qi = argv.indexOf("--quality");
const quality = qi >= 0 ? argv[qi + 1] : "looks";
const only = argv.filter((a, i) => !a.startsWith("--") && argv[i - 1] !== "--quality");
const want = (id) => !only.length || only.includes(id);

const [bin, ...binArgs] = (process.env.HYPERFRAMES_BIN || "npx --yes hyperframes@0.8.137").split(" ");
const OUT = path.join(ROOT, "video");
fs.mkdirSync(OUT, { recursive: true });

function render(cwd, output) {
  console.log(`\n→ ${path.relative(ROOT, output)}`);
  const r = spawnSync(bin, [...binArgs, "render", "--quality", quality, "--output", output], { cwd, stdio: "inherit" });
  if (r.status !== 0) throw new Error(`falló el render de ${output}`);
}

const { out } = build();
if (want("main")) render(ROOT, path.join(OUT, "historias_negocios_completo.mp4"));
STORIES.forEach((s, i) => {
  if (want(s.id)) render(path.join(out, s.id), path.join(OUT, `0${i + 1}_${s.id}.mp4`));
});
console.log("\n✓ listo: video/");
