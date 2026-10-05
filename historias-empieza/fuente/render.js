// Renderiza las historias fotograma a fotograma y las codifica con ffmpeg.
//   node render.js            -> todos los vídeos + PNG finales
//   node render.js s2 master  -> solo los indicados
// Requiere: playwright (chromium), ffmpeg y python3 con numpy + scipy (para el sonido).
const path = require('path');
const fs = require('fs');
const { spawn, execFileSync } = require('child_process');
let chromium;
try { ({ chromium } = require('playwright')); } catch { ({ chromium } = require('/opt/node22/lib/node_modules/playwright')); }

const FPS = 30;
const ROOT = path.resolve(__dirname, '..');
const HTML = 'file://' + path.join(__dirname, 'historias.html');
const TMP = path.join(__dirname, '.tmp');
const JOBS = {
  s1: '01_historia', s2: '02_historia', s3: '03_historia', s4: '04_historia',
  master: 'historias_empieza_completo',
};
const want = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(JOBS);
fs.mkdirSync(TMP, { recursive: true });
fs.mkdirSync(path.join(ROOT, 'video'), { recursive: true });
fs.mkdirSync(path.join(ROOT, 'png'), { recursive: true });

async function open(browser, query) {
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
  page.on('pageerror', e => console.error('pageerror', e.message));
  await page.goto(`${HTML}?${query}`);
  await page.waitForFunction(() => window.READY === true, null, { timeout: 20000 });
  return page;
}

async function video(browser, mode) {
  const name = JOBS[mode];
  const page = await open(browser, `mode=${mode}`);
  const { duration, cues } = await page.evaluate(() => ({ duration: window.DURATION, cues: window.CUES }));
  const frames = Math.round(duration * FPS);
  const silent = path.join(TMP, `${name}_v.mp4`);
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-i', '-',
    '-vf', 'scale=out_color_matrix=bt709:out_range=tv,format=yuv420p',
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '16', '-profile:v', 'high', '-tune', 'animation',
    '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-r', String(FPS), silent],
    { stdio: ['pipe', 'inherit', 'inherit'] });
  const done = new Promise((res, rej) => ff.on('close', c => c ? rej(new Error('ffmpeg ' + c)) : res()));
  const t0 = Date.now();
  for (let f = 0; f < frames; f++) {
    await page.evaluate(t => window.seek(t), f / FPS);
    const buf = await page.screenshot({ type: 'png' });
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    if (f % 60 === 0) console.log(`${name}: ${f}/${frames}  (${((Date.now() - t0) / 1000).toFixed(0)}s)`);
  }
  ff.stdin.end(); await done; await page.close();

  const cuesFile = path.join(TMP, `${name}_cues.json`);
  const wav = path.join(TMP, `${name}.wav`);
  fs.writeFileSync(cuesFile, JSON.stringify({ duration, cues, master: mode === 'master', story: mode === 'master' ? 0 : +mode.slice(1) - 1 }));
  execFileSync('python3', [path.join(__dirname, 'sonido.py'), cuesFile, wav], { stdio: 'inherit' });
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', silent, '-i', wav, '-map', '0:v', '-map', '1:a',
    '-c:v', 'copy', '-af', 'volume=7dB,alimiter=limit=0.84:attack=1:release=80:level=disabled', '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-shortest', '-movflags', '+faststart',
    path.join(ROOT, 'video', `${name}.mp4`)]);
  console.log(`✓ video/${name}.mp4  ${duration.toFixed(2)}s`);
}

async function still(browser, mode) {
  const page = await open(browser, `mode=${mode}&still`);
  await page.screenshot({ path: path.join(ROOT, 'png', `${JOBS[mode]}.png`) });
  await page.close();
  console.log(`✓ png/${JOBS[mode]}.png`);
}

(async () => {
  const browser = await chromium.launch();
  for (const m of want.filter(m => m !== 'master' && !process.env.NO_STILLS)) await still(browser, m);
  await browser.close();
  // en paralelo, un navegador por proceso (el máster primero porque es el más largo)
  const queue = [...want].sort((a, b) => (b === 'master') - (a === 'master'));
  const workers = Array.from({ length: 3 }, async () => {
    const br = await chromium.launch();
    while (queue.length) await video(br, queue.shift());
    await br.close();
  });
  await Promise.all(workers);
  fs.rmSync(TMP, { recursive: true, force: true });
})().catch(e => { console.error(e); process.exit(1); });
