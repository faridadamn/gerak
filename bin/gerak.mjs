#!/usr/bin/env node
// Gerak CLI
import { resolve, join, dirname, basename } from 'node:path';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import os from 'node:os';

process.stdout.on('error', (e) => {
  if (e.code === 'EPIPE') process.exit(0);
});

const ENGINE_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const pkg = JSON.parse(readFileSync(join(ENGINE_DIR, 'package.json'), 'utf8'));

const C = process.stdout.isTTY
  ? { b: (s) => `\x1b[1m${s}\x1b[0m`, dim: (s) => `\x1b[2m${s}\x1b[0m`, g: (s) => `\x1b[32m${s}\x1b[0m`, r: (s) => `\x1b[31m${s}\x1b[0m`, c: (s) => `\x1b[36m${s}\x1b[0m`, y: (s) => `\x1b[33m${s}\x1b[0m` }
  : { b: (s) => s, dim: (s) => s, g: (s) => s, r: (s) => s, c: (s) => s, y: (s) => s };

function parseArgs(argv) {
  const pos = [];
  const flags = {};
  const alias = { o: 'out', s: 'scale', w: 'workers', p: 'port', h: 'help', t: 'template' };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--') {
      pos.push(...argv.slice(i + 1));
      break;
    }
    if (a.startsWith('--')) {
      let [k, v] = a.slice(2).split(/=(.*)/s);
      if (k.startsWith('no-')) {
        flags[k.slice(3)] = false;
        continue;
      }
      if (v === undefined) {
        const nx = argv[i + 1];
        if (nx !== undefined && !nx.startsWith('-')) {
          v = nx;
          i++;
        } else v = true;
      }
      flags[k] = v;
    } else if (a.startsWith('-') && a.length === 2 && isNaN(+a)) {
      const k = alias[a[1]] ?? a[1];
      const nx = argv[i + 1];
      if (nx !== undefined && !nx.startsWith('-')) {
        flags[k] = nx;
        i++;
      } else flags[k] = true;
    } else pos.push(a);
  }
  return { pos, flags };
}

const num = (v) => (v === undefined || v === true ? undefined : isNaN(+v) ? v : +v);

const HELP = `${C.b('gerak')} ${pkg.version} — engine video code-first

${C.b('Mulai')}
  gerak init scene.mjs [--preset reels|square|youtube|feed] [--template basic|story|promo]
  gerak preview scene.mjs          live preview di browser (auto-reload saat file disimpan)
  gerak render scene.mjs -o out.mp4
  gerak studio [folder]            editor visual di browser (gambar, animasi, render tanpa kode)

${C.b('Perintah')}
  init <file>              bikin scene starter (tidak menimpa file yang ada)
  run <src>                jalankan script → simpan project .gerak.json + poster + contact sheet
  render <src>             render video (.mp4 .webm .mov .gif dari ekstensi -o)
  frame <src> <f>          render satu frame PNG/JPG (f: 36 | "2.5s" | "50%")
  sheet <src>              contact sheet buat review (--every 15 | --per-scene 3)
  onion <src> <f>          onion skin (--before 2 --after 2 --step 2)
  frames <src> <dir>       PNG sequence
  audio <src>              mixdown audio saja (-o mix.wav|mp3)
  info <src>               ringkasan scene, layer, ID, timing (--json)
  preview <src>            server preview (--port 4300 --host 0.0.0.0)
  studio [folder]          Gerak Studio, editor visual (default folder ~/gerak-studio)
                           --port 4400 --host 0.0.0.0 --password rahasia
  sfx <type>               generate efek suara WAV (sfx --list)
  list                     daftar brush, easing, transisi, sfx, preset, font
  doctor                   cek Node, canvas, FFmpeg, font

${C.b('Opsi render')}
  -o, --out <file>         output (default output/<nama>.mp4)
  -s, --scale <n>          skala resolusi (0.5 = setengah, buat draft cepat)
  --from <t> --to <t>      render sebagian (frame atau "2s")
  -w, --workers <n>        jumlah worker paralel (default: CPU-1)
  --draft                  render cepat buat cek (skala 0.5, kualitas draft)
  --crf <n>                kualitas H.264 (default 18, makin kecil makin bagus)
  --preset <x264>          ultrafast..veryslow (default medium)
  --transparent            background transparan (.webm / .mov)
  --no-audio               tanpa audio
  --gif-fps --gif-width    opsi GIF

<src> = script (.mjs/.js/.ts yang "export default" project) atau project .gerak.json
`;

async function main() {
  const [cmd, ...rest] = process.argv.slice(2);
  const { pos, flags } = parseArgs(rest);
  if (!cmd || cmd === 'help' || cmd === '--help' || cmd === '-h' || flags.help) {
    console.log(HELP);
    return;
  }
  if (cmd === '--version' || cmd === '-v' || cmd === 'version') {
    console.log(pkg.version);
    return;
  }
  const E = await import('../src/index.mjs');
  const L = await import('../src/node/load.mjs');

  const need = (v, msg) => {
    if (v === undefined) {
      console.error(C.r(msg));
      process.exit(2);
    }
    return v;
  };
  const outDir = (src) => resolve(flags.dir ?? join(dirname(resolve(src)), 'output'));
  const progress = (label) => {
    let last = 0;
    return ({ done, total, fps, eta }) => {
      const now = Date.now();
      if (now - last < 120 && done < total) return;
      last = now;
      const w = 28;
      const k = Math.round((done / total) * w);
      const line = `${label} [${'█'.repeat(k)}${'░'.repeat(w - k)}] ${done}/${total}${fps ? ` · ${fps.toFixed(1)} fps` : ''}${eta !== undefined && done < total ? ` · sisa ${Math.ceil(eta)}s` : ''}`;
      if (process.stdout.isTTY) process.stdout.write(`\r${line}  `);
      else if (done === total || done % 60 === 0) console.log(line);
      if (done === total && process.stdout.isTTY) process.stdout.write('\n');
    };
  };

  switch (cmd) {
    case 'init': {
      const file = resolve(pos[0] ?? 'scene.mjs');
      if (existsSync(file)) {
        console.error(C.r(`${basename(file)} sudah ada — tidak ditimpa. Pakai nama lain.`));
        process.exit(1);
      }
      const tpl = flags.template ?? 'basic';
      const tplFile = join(ENGINE_DIR, 'templates', `${tpl}.mjs`);
      if (!existsSync(tplFile)) {
        console.error(C.r(`Template "${tpl}" tidak ada. Pilihan: basic, story, promo`));
        process.exit(1);
      }
      let src = readFileSync(tplFile, 'utf8');
      if (flags.preset) src = src.replace(/preset: '[a-z0-9]+'/, `preset: '${flags.preset}'`);
      mkdirSync(dirname(file), { recursive: true });
      writeFileSync(file, src);
      console.log(`${C.g('✓')} ${basename(file)} dibuat dari template ${tpl}`);
      console.log(`  Lanjut: ${C.c(`gerak preview ${pos[0] ?? 'scene.mjs'}`)}  atau  ${C.c(`gerak render ${pos[0] ?? 'scene.mjs'}`)}`);
      return;
    }
    case 'run': {
      const src = need(pos[0], 'Pakai: gerak run scene.mjs');
      const p = await L.loadProject(src);
      const name = L.sourceName(src);
      const dir = outDir(src);
      const jsonFile = p.save(join(dir, `${name}.gerak.json`));
      const poster = await E.saveFrame(p, flags.frame ?? '50%', join(dir, `${name}.png`), { scale: num(flags.scale) ?? 1 });
      const sheet = await E.renderSheet(p, join(dir, `${name}-sheet.png`), {});
      const info = p.info();
      console.log(`${C.g('✓')} ${C.b(info.title)} · ${info.size} · ${info.fps} fps · ${info.duration} (${info.frames} frame) · ${info.scenes.length} scene`);
      for (const s of info.scenes) console.log(`  ${C.dim(s.time)}  ${s.name} ${C.dim(`[${s.id}] ${s.transition}`)}`);
      console.log(`  project → ${jsonFile}\n  poster  → ${poster}\n  sheet   → ${sheet}`);
      if (flags.movie) {
        const out = join(dir, `${name}.mp4`);
        const r = await E.renderMovie(p, out, { scale: num(flags.scale), workers: num(flags.workers), onProgress: progress('render') });
        console.log(`  movie   → ${r.file}`);
      }
      return;
    }
    case 'render': {
      const src = need(pos[0], 'Pakai: gerak render scene.mjs -o out.mp4');
      const p = await L.loadProject(src);
      const out = resolve(typeof flags.out === 'string' ? flags.out : join(outDir(src), `${L.sourceName(src)}.mp4`));
      const info = p.info();
      console.log(`${C.b(info.title)} · ${info.size}${flags.scale ? ` ×${flags.scale}` : ''} · ${info.fps} fps · ${info.duration}`);
      const draft = !!flags.draft;
      const r = await E.renderMovie(p, out, {
        scale: num(flags.scale) ?? (draft ? 0.5 : undefined),
        from: num(flags.from),
        to: num(flags.to),
        workers: num(flags.workers),
        crf: num(flags.crf) ?? (draft ? 26 : undefined),
        preset: flags.preset ?? (draft ? 'veryfast' : undefined),
        transparent: !!flags.transparent,
        audio: flags.audio !== false,
        gifFps: num(flags['gif-fps']),
        gifWidth: num(flags['gif-width']),
        onProgress: progress('render'),
      });
      console.log(`${C.g('✓')} ${r.file} · ${r.width}×${r.height} · ${r.seconds.toFixed(2)}s · ${r.frames} frame · ${r.audioClips} klip audio · ${r.renderSeconds.toFixed(1)}s render (${r.workers} worker)`);
      return;
    }
    case 'frame': {
      const src = need(pos[0], 'Pakai: gerak frame scene.mjs 36');
      const f = num(pos[1] ?? flags.frame ?? 0);
      const p = await L.loadProject(src);
      const out = typeof flags.out === 'string' ? flags.out : join(outDir(src), `${L.sourceName(src)}-f${String(f).replace(/[^0-9a-z.%]/gi, '')}.png`);
      const file = await E.saveFrame(p, f, out, { scale: num(flags.scale), transparent: !!flags.transparent });
      console.log(`${C.g('✓')} ${file}`);
      return;
    }
    case 'sheet': {
      const src = need(pos[0], 'Pakai: gerak sheet scene.mjs');
      const p = await L.loadProject(src);
      const out = typeof flags.out === 'string' ? flags.out : join(outDir(src), `${L.sourceName(src)}-sheet.png`);
      const file = await E.renderSheet(p, out, { every: num(flags.every), perScene: num(flags['per-scene']), thumb: num(flags.thumb), cols: num(flags.cols), notes: flags.notes });
      console.log(`${C.g('✓')} ${file}`);
      return;
    }
    case 'onion': {
      const src = need(pos[0], 'Pakai: gerak onion scene.mjs 24');
      const p = await L.loadProject(src);
      const f = num(need(pos[1], 'Frame wajib: gerak onion scene.mjs 24'));
      const out = typeof flags.out === 'string' ? flags.out : join(outDir(src), `${L.sourceName(src)}-onion-${f}.png`);
      const file = await E.renderOnion(p, f, out, { before: num(flags.before), after: num(flags.after), step: num(flags.step), scale: num(flags.scale) });
      console.log(`${C.g('✓')} ${file}`);
      return;
    }
    case 'frames': {
      const src = need(pos[0], 'Pakai: gerak frames scene.mjs out-dir');
      const p = await L.loadProject(src);
      const dir = resolve(pos[1] ?? join(outDir(src), `${L.sourceName(src)}-frames`));
      const files = await E.saveSequence(p, dir, { scale: num(flags.scale), from: num(flags.from), to: num(flags.to), transparent: !!flags.transparent, onProgress: progress('frames') });
      console.log(`${C.g('✓')} ${files.length} PNG → ${dir}`);
      return;
    }
    case 'audio': {
      const src = need(pos[0], 'Pakai: gerak audio scene.mjs -o mix.wav');
      const p = await L.loadProject(src);
      const out = typeof flags.out === 'string' ? flags.out : join(outDir(src), `${L.sourceName(src)}-mix.wav`);
      const file = await E.renderAudio(p, out);
      console.log(file ? `${C.g('✓')} ${file}` : C.y('Project ini tidak punya audio.'));
      return;
    }
    case 'info': {
      const src = need(pos[0], 'Pakai: gerak info scene.mjs');
      const p = await L.loadProject(src);
      const info = p.info();
      if (flags.json) {
        console.log(JSON.stringify(info, null, 2));
        return;
      }
      console.log(`${C.b(info.title)} · ${info.size} · ${info.fps} fps · ${info.duration} · ${info.frames} frame`);
      const tree = (n, d) => {
        const pad = '  '.repeat(d);
        console.log(`${pad}${C.c(n.id)} ${C.dim(n.type)}${n.show ? C.dim(` show[${n.show[0]},${n.show[1] >= 1e9 ? '∞' : n.show[1]})`) : ''}${n.keys ? C.dim(` keys{${Object.entries(n.keys).map(([k, v]) => `${k}:${v.join('/')}`).join(' ')}}`) : ''}`);
        for (const e of n.elements || []) console.log(`${pad}  ${C.dim('•')} ${e}`);
        for (const c of n.children || []) tree(c, d + 1);
      };
      for (const s of info.scenes) {
        console.log(`\n${C.b(s.name)} ${C.dim(`[${s.id}] ${s.time} · frame ${s.start}-${s.end} · masuk: ${s.transition}`)}`);
        for (const n of s.layers) tree(n, 1);
      }
      if (info.audio.length) {
        console.log(`\n${C.b('Audio')}`);
        for (const a of info.audio) console.log(`  ${C.c(a.id)} ${a.src} @${a.at}${a.scene ? ` (scene ${a.scene})` : ''}`);
      }
      return;
    }
    case 'preview': {
      const src = need(pos[0], 'Pakai: gerak preview scene.mjs');
      const { startPreview } = await import('../src/node/preview.mjs');
      await startPreview(src, { port: num(flags.port) ?? 4300, host: typeof flags.host === 'string' ? flags.host : '127.0.0.1', open: flags.open });
      return;
    }
    case 'studio': {
      const { startStudio } = await import('../src/node/studio.mjs');
      await startStudio(pos[0] ?? join(os.homedir(), 'gerak-studio'), {
        port: num(flags.port) ?? 4400,
        host: typeof flags.host === 'string' ? flags.host : '127.0.0.1',
        password: typeof flags.password === 'string' ? flags.password : process.env.GERAK_STUDIO_PASSWORD,
      });
      return;
    }
    case '__export-json': {
      // internal: used by the preview watcher (fresh process per rebuild)
      const p = await L.loadProject(pos[0]);
      writeFileSync(pos[1], JSON.stringify(p.serialize()));
      return;
    }
    case 'sfx': {
      if (flags.list || !pos[0]) {
        console.log(E.SFX_TYPES.join(', '));
        return;
      }
      const params = {};
      for (const [k, v] of Object.entries(flags)) if (k !== 'out') params[k] = num(v) ?? v;
      const s = E.synth(pos[0], params);
      const out = resolve(typeof flags.out === 'string' ? flags.out : `${pos[0]}.wav`);
      mkdirSync(dirname(out), { recursive: true });
      writeFileSync(out, E.encodeWav([s.data, s.data], s.rate));
      console.log(`${C.g('✓')} ${out} · ${(s.data.length / s.rate).toFixed(2)}s`);
      return;
    }
    case 'list': {
      const { PRESETS } = E;
      console.log(`${C.b('Preset ukuran')}  ${Object.entries(PRESETS).map(([k, v]) => `${k} ${v[0]}×${v[1]}`).join(' · ')}`);
      console.log(`${C.b('Brush')}          ${E.BRUSH_NAMES.join(', ')}`);
      console.log(`${C.b('Easing')}         ${E.EASINGS.filter((e) => !/-(in|out|in-out)$/.test(e) || /^ease/.test(e)).join(', ')}`);
      console.log(`${C.b('Transisi')}       cut, fade, dissolve, dip, fade-black, fade-white, flash, wipe-left/right/up/down, slide-left/right/up/down, cover-left/right/up/down, iris, zoom, blur`);
      console.log(`${C.b('Animasi teks')}   typewriter, chars, words, lines, scramble, count, karaoke · efek: fade, rise, drop, slide, pop, stamp, blur, spin`);
      console.log(`${C.b('Behavior')}       wiggle, float, spin, pulse, shake, sway, blink`);
      console.log(`${C.b('SFX')}            ${E.SFX_TYPES.join(', ')}`);
      console.log(`${C.b('Font')}           ${[...new Set(E.fontFamilies())].filter((f) => /Jakarta|Caveat|Patrick/.test(f)).join(', ')} (+ font sistem, + project.font())`);
      return;
    }
    case 'doctor': {
      const ok = (b, msg, fix) => console.log(`${b ? C.g('✓') : C.r('✗')} ${msg}${!b && fix ? `\n    ${C.dim(fix)}` : ''}`);
      const [maj, min] = process.versions.node.split('.').map(Number);
      ok(maj > 22 || (maj === 22 && min >= 6), `Node ${process.versions.node}`, 'Butuh Node 22.6+ (nvm install 22)');
      let canvasOk = false;
      try {
        const { createCanvas } = await import('@napi-rs/canvas');
        canvasOk = !!createCanvas(4, 4).getContext('2d');
      } catch (e) {
        void e;
      }
      ok(canvasOk, '@napi-rs/canvas', 'Jalankan: npm install (di folder gerak)');
      const ff = E.ffmpegAvailable();
      ok(!!ff, ff ? ff.split(' ').slice(0, 3).join(' ') : 'FFmpeg', 'Install: sudo apt install ffmpeg');
      const fams = new Set(E.fontFamilies());
      ok(fams.has('Plus Jakarta Sans'), 'Font bawaan (Plus Jakarta Sans, Caveat, Patrick Hand)');
      console.log(`${C.dim(`CPU: ${os.availableParallelism?.() ?? os.cpus().length} core → render paralel ${Math.max(1, Math.min(os.availableParallelism?.() ?? 1, 8) - 1)} worker`)}`);
      return;
    }
    default:
      console.error(C.r(`Perintah "${cmd}" tidak dikenal.`));
      console.log(HELP);
      process.exit(2);
  }
}

main().catch((e) => {
  const msg = e && e.name === 'GerakError' ? e.message : e?.stack || String(e);
  console.error(`\n${C.r('✗')} ${msg}`);
  process.exit(1);
});
