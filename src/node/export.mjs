// Export: frames, contact sheets, onion skins, movies (MP4/WebM/MOV/GIF), audio mixdowns.
import { spawn, spawnSync } from 'node:child_process';
import { Worker } from 'node:worker_threads';
import { once } from 'node:events';
import { mkdirSync, writeFileSync, renameSync, rmSync, mkdtempSync, existsSync } from 'node:fs';
import { dirname, resolve, extname, join, basename } from 'node:path';
import os from 'node:os';
import { Renderer, buildTimeline } from '../core/render.mjs';
import { makeEnv, createCanvas } from './platform.mjs';
import { synth, encodeWav, RATE } from '../core/synth.mjs';
import { toFrames, GerakError, fmtTime, clamp } from '../core/util.mjs';

export function docOf(x) {
  if (!x) throw new GerakError('Project/doc kosong', 'BAD_INPUT');
  return x.doc ?? x;
}

function frameArg(doc, v, label = 'frame') {
  if (typeof v === 'string' && v.trim().endsWith('%')) return Math.round((parseFloat(v) / 100) * (buildTimeline(doc).total - 1));
  return Math.round(toFrames(v, doc.fps, label));
}

async function setup(doc) {
  const env = await makeEnv(doc);
  return { env, renderer: new Renderer(doc, env) };
}

function encode(canvas, format = 'png', quality = 0.92) {
  if (format === 'jpeg' || format === 'jpg') return canvas.toBuffer('image/jpeg', Math.round(quality * 100));
  if (format === 'webp') return canvas.toBuffer('image/webp', Math.round(quality * 100));
  return canvas.toBuffer('image/png');
}

function writeAtomic(file, buf) {
  const abs = resolve(file);
  mkdirSync(dirname(abs), { recursive: true });
  writeFileSync(abs, buf);
  return abs;
}

// ------------------------------------------------------------ single frames

/** Render one frame to an image Buffer. frame: number, "2.5s", or "50%". */
export async function renderFrameImage(input, frame = 0, opts = {}) {
  const doc = docOf(input);
  const { renderer } = await setup(doc);
  const scale = opts.scale ?? 1;
  const cv = createCanvas(Math.round(doc.width * scale), Math.round(doc.height * scale));
  const f = clamp(frameArg(doc, frame), 0, Math.max(0, renderer.total - 1));
  renderer.renderFrame(cv.getContext('2d'), f, { scale, background: !opts.transparent });
  return encode(cv, opts.format ?? (opts.file && /\.jpe?g$/i.test(opts.file) ? 'jpeg' : 'png'), opts.quality);
}

export async function saveFrame(input, frame, file, opts = {}) {
  return writeAtomic(file, await renderFrameImage(input, frame, { ...opts, file }));
}

/** PNG sequence into a directory: frame-00000.png ... */
export async function saveSequence(input, dir, opts = {}) {
  const doc = docOf(input);
  const { renderer } = await setup(doc);
  const scale = opts.scale ?? 1;
  const cv = createCanvas(Math.round(doc.width * scale), Math.round(doc.height * scale));
  const ctx = cv.getContext('2d');
  const [f0, f1] = frameRange(doc, renderer.total, opts);
  mkdirSync(dir, { recursive: true });
  const files = [];
  for (let f = f0; f < f1; f++) {
    renderer.renderFrame(ctx, f, { scale, background: !opts.transparent });
    const file = join(dir, `frame-${String(f).padStart(5, '0')}.png`);
    writeFileSync(file, cv.toBuffer('image/png'));
    files.push(file);
    opts.onProgress?.({ done: f - f0 + 1, total: f1 - f0 });
  }
  return files;
}

function frameRange(doc, total, opts) {
  const f0 = opts.from !== undefined ? clamp(frameArg(doc, opts.from, 'from'), 0, total) : 0;
  const f1 = opts.to !== undefined ? clamp(frameArg(doc, opts.to, 'to'), f0 + 1, total) : total;
  if (f1 <= f0) throw new GerakError('Range frame kosong', 'BAD_RANGE');
  return [f0, f1];
}

// ------------------------------------------------------------ contact sheet

/**
 * Contact sheet for review.
 * opts: frames:[...], every: N frames | "0.5s", perScene: 3, thumb: px width, cols, scale
 */
export async function renderSheet(input, file, opts = {}) {
  const doc = docOf(input);
  const { renderer } = await setup(doc);
  const tl = renderer.timeline;
  let frames = [];
  if (opts.frames) frames = opts.frames.map((f) => frameArg(doc, f));
  else if (opts.every) {
    const step = Math.max(1, Math.round(toFrames(opts.every, doc.fps)));
    for (let f = 0; f < tl.total; f += step) frames.push(f);
  } else {
    const per = opts.perScene ?? 3;
    for (const e of tl.entries) {
      const a = e.start + (e.transition ? e.transition.duration : 0);
      const b = e.end - 1;
      for (let i = 0; i < per; i++) frames.push(Math.round(per === 1 ? (a + b) / 2 : a + ((b - a) * (i + 0.5)) / per));
    }
  }
  frames = frames.filter((f) => f >= 0 && f < tl.total);
  const portrait = doc.height > doc.width;
  const thumbW = opts.thumb ?? (portrait ? 240 : 400);
  const scale = thumbW / doc.width;
  const thumbH = Math.round(doc.height * scale);
  const cols = opts.cols ?? Math.min(frames.length, portrait ? 6 : 4);
  const rows = Math.ceil(frames.length / cols);
  const gap = 18;
  const label = 46;
  const notesH = opts.notes === false ? 0 : 40;
  const header = 70;
  const W = cols * thumbW + (cols + 1) * gap;
  const H = header + rows * (thumbH + label + notesH + gap) + gap;
  const sheet = createCanvas(W, H);
  const sx = sheet.getContext('2d');
  sx.fillStyle = '#f4f2ec';
  sx.fillRect(0, 0, W, H);
  sx.fillStyle = '#1d1d1b';
  sx.font = '700 24px "Plus Jakarta Sans", sans-serif';
  sx.fillText(doc.title ?? 'Gerak', gap, 40);
  sx.font = '400 15px "Plus Jakarta Sans", sans-serif';
  sx.fillStyle = '#6b685f';
  sx.fillText(`${doc.width}×${doc.height} · ${doc.fps} fps · ${fmtTime(tl.total, doc.fps)} · ${tl.total} frame · ${doc.scenes.length} scene`, gap, 62);
  const thumb = createCanvas(Math.round(doc.width * scale), thumbH);
  const tctx = thumb.getContext('2d');
  frames.forEach((f, i) => {
    const c = i % cols;
    const r = Math.floor(i / cols);
    const x = gap + c * (thumbW + gap);
    const y = header + gap + r * (thumbH + label + notesH + gap);
    renderer.renderFrame(tctx, f, { scale });
    sx.save();
    sx.shadowColor = 'rgba(0,0,0,0.12)';
    sx.shadowBlur = 8;
    sx.shadowOffsetY = 2;
    sx.drawImage(thumb, x, y);
    sx.restore();
    sx.strokeStyle = 'rgba(0,0,0,0.15)';
    sx.lineWidth = 1;
    sx.strokeRect(x + 0.5, y + 0.5, thumbW - 1, thumbH - 1);
    const e = tl.entries.filter((q) => f >= q.start && f < q.end).pop();
    sx.fillStyle = '#1d1d1b';
    sx.font = '700 14px "Plus Jakarta Sans", sans-serif';
    sx.fillText(`${e ? `${e.index + 1}. ${e.scene.name}` : ''}`.slice(0, 40), x, y + thumbH + 20);
    sx.font = '400 13px "Plus Jakarta Sans", sans-serif';
    sx.fillStyle = '#6b685f';
    sx.fillText(`f ${f} · ${fmtTime(f, doc.fps)}${e ? ` · lokal ${f - e.start}` : ''}`, x, y + thumbH + 38);
    if (notesH && e?.scene.notes) {
      const n = e.scene.notes;
      const txt = [n.action, n.dialog && `“${n.dialog}”`, n.camera && `[${n.camera}]`].filter(Boolean).join(' ');
      sx.fillStyle = '#3b3a36';
      sx.font = 'italic 400 12px "Plus Jakarta Sans", sans-serif';
      wrapText(sx, txt, x, y + thumbH + 56, thumbW, 15, 2);
    }
  });
  return writeAtomic(file, sheet.toBuffer('image/png'));
}

function wrapText(ctx, text, x, y, maxW, lh, maxLines) {
  const words = String(text).split(/\s+/);
  let line = '';
  let n = 0;
  for (const w of words) {
    const t = line ? `${line} ${w}` : w;
    if (ctx.measureText(t).width > maxW && line) {
      ctx.fillText(line, x, y + n * lh);
      n++;
      line = w;
      if (n >= maxLines) return;
    } else line = t;
  }
  if (line && n < maxLines) ctx.fillText(line, x, y + n * lh);
}

// ------------------------------------------------------------ onion skin

/** Onion skin: neighbours before (red) and after (blue) the frame, ghosted under it. */
export async function renderOnion(input, frame, file, opts = {}) {
  const doc = docOf(input);
  const { renderer } = await setup(doc);
  const scale = opts.scale ?? 1;
  const pw = Math.round(doc.width * scale);
  const ph = Math.round(doc.height * scale);
  const f = frameArg(doc, frame);
  const before = opts.before ?? 2;
  const after = opts.after ?? 2;
  const step = opts.step ?? 2;
  const out = createCanvas(pw, ph);
  const o = out.getContext('2d');
  o.fillStyle = doc.background && typeof doc.background === 'string' ? doc.background : '#ffffff';
  o.fillRect(0, 0, pw, ph);
  const ghost = createCanvas(pw, ph);
  const g = ghost.getContext('2d');
  const draw = (fr, color, alpha) => {
    if (fr < 0 || fr >= renderer.total) return;
    renderer.renderFrame(g, fr, { scale, background: false, effects: false });
    g.save();
    g.globalCompositeOperation = 'source-atop';
    g.fillStyle = color;
    g.fillRect(0, 0, pw, ph);
    g.restore();
    o.globalAlpha = alpha;
    o.drawImage(ghost, 0, 0);
    o.globalAlpha = 1;
  };
  for (let k = before; k >= 1; k--) draw(f - k * step, opts.beforeColor ?? '#e03131', 0.45 / k);
  for (let k = after; k >= 1; k--) draw(f + k * step, opts.afterColor ?? '#1c7ed6', 0.45 / k);
  renderer.renderFrame(g, f, { scale, background: false, effects: false });
  o.drawImage(ghost, 0, 0);
  return writeAtomic(file, out.toBuffer('image/png'));
}

// ------------------------------------------------------------ ffmpeg helpers

export function ffmpegAvailable(bin = 'ffmpeg') {
  try {
    const r = spawnSync(bin, ['-version'], { encoding: 'utf8' });
    return r.status === 0 ? r.stdout.split('\n')[0] : null;
  } catch {
    return null;
  }
}

function probeDuration(file, ffprobe = 'ffprobe') {
  const r = spawnSync(ffprobe, ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', file], { encoding: 'utf8' });
  const d = parseFloat(r.stdout);
  if (!Number.isFinite(d)) throw new GerakError(`Tidak bisa membaca durasi audio: ${file}`, 'AUDIO');
  return d;
}

/**
 * Resolve audio clips to absolute timing. Synthesized SFX are written as WAV into tmpDir.
 * Returns [{path, start, trimStart, dur, gain, fadeIn, fadeOut, loop}]
 */
export function planAudio(doc, tmpDir, { from = 0, to } = {}) {
  const tl = buildTimeline(doc);
  const fps = doc.fps;
  const total = (to ?? tl.total) / fps;
  const offset = from / fps;
  const plan = [];
  let n = 0;
  for (const c of doc.audio || []) {
    let startF = c.at ?? 0;
    if (c.scene) {
      const e = tl.entries.find((q) => q.scene.id === c.scene);
      if (!e) continue;
      startF += e.start;
    }
    let path;
    let fileDur;
    if (c.sfx) {
      const { type, ...params } = c.sfx;
      const s = synth(type, params);
      path = join(tmpDir, `sfx-${n++}-${type}.wav`);
      writeFileSync(path, encodeWav([s.data], s.rate));
      fileDur = s.data.length / s.rate;
    } else {
      path = c.src;
      if (!existsSync(path)) throw new GerakError(`File audio hilang: ${path}`, 'NOT_FOUND');
      fileDur = c.loop ? Infinity : probeDuration(path);
    }
    let start = startF / fps - offset;
    let trimStart = c.trim?.[0] ?? 0;
    const trimEnd = c.trim?.[1] ?? null;
    let dur = c.duration ?? (trimEnd !== null ? trimEnd - trimStart : fileDur - trimStart);
    if (!Number.isFinite(dur)) dur = total - offset - start;
    if (start < 0) {
      // clip starts before the export range: skip into it
      trimStart += -start;
      dur -= -start;
      start = 0;
    }
    dur = Math.min(dur, total - offset - start);
    if (dur <= 0.001) continue;
    plan.push({ path, start, trimStart, dur, gain: c.gain ?? 1, fadeIn: c.fadeIn ?? 0, fadeOut: c.fadeOut ?? 0, loop: !!c.loop, id: c.id });
  }
  return plan;
}

function audioFilter(plan, firstInput, totalSec) {
  const parts = [];
  plan.forEach((a, i) => {
    const idx = firstInput + i;
    const chain = [
      `atrim=start=${a.trimStart.toFixed(4)}:duration=${a.dur.toFixed(4)}`,
      'asetpts=PTS-STARTPTS',
      `aresample=${RATE}`,
      'aformat=sample_fmts=fltp:channel_layouts=stereo',
      `volume=${a.gain.toFixed(4)}`,
    ];
    if (a.fadeIn > 0) chain.push(`afade=t=in:st=0:d=${Math.min(a.fadeIn, a.dur).toFixed(4)}`);
    if (a.fadeOut > 0) chain.push(`afade=t=out:st=${Math.max(0, a.dur - a.fadeOut).toFixed(4)}:d=${Math.min(a.fadeOut, a.dur).toFixed(4)}`);
    const ms = Math.round(a.start * 1000);
    if (ms > 0) chain.push(`adelay=${ms}:all=1`);
    parts.push(`[${idx}:a]${chain.join(',')}[a${i}]`);
  });
  const ins = plan.map((_, i) => `[a${i}]`).join('');
  parts.push(
    `${ins}amix=inputs=${plan.length}:normalize=0:dropout_transition=0,alimiter=limit=0.97:level=false,apad,atrim=duration=${totalSec.toFixed(4)}[aout]`,
  );
  return parts.join(';');
}

function audioInputs(plan) {
  const args = [];
  for (const a of plan) {
    if (a.loop) args.push('-stream_loop', '-1');
    args.push('-i', a.path);
  }
  return args;
}

/** Mix all audio to a file (wav/mp3/m4a/ogg). Returns the path, or null when there is no audio. */
export async function renderAudio(input, file, opts = {}) {
  const doc = docOf(input);
  const tl = buildTimeline(doc);
  const tmp = mkdtempSync(join(os.tmpdir(), 'gerak-audio-'));
  try {
    const plan = planAudio(doc, tmp);
    if (!plan.length) return null;
    const total = tl.total / doc.fps;
    const out = resolve(file);
    mkdirSync(dirname(out), { recursive: true });
    const args = ['-y', '-v', 'error', ...audioInputs(plan), '-filter_complex', audioFilter(plan, 0, total), '-map', '[aout]'];
    const ext = extname(out).toLowerCase();
    if (ext === '.mp3') args.push('-c:a', 'libmp3lame', '-b:a', '192k');
    else if (ext === '.m4a' || ext === '.aac') args.push('-c:a', 'aac', '-b:a', '192k');
    else if (ext === '.ogg' || ext === '.opus') args.push('-c:a', 'libopus', '-b:a', '160k');
    else args.push('-c:a', 'pcm_s16le');
    args.push(out);
    await run(opts.ffmpeg ?? 'ffmpeg', args);
    return out;
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
}

function run(bin, args, stdinWriter) {
  return new Promise((res, rej) => {
    const p = spawn(bin, args, { stdio: ['pipe', 'ignore', 'pipe'] });
    let err = '';
    p.stderr.on('data', (d) => {
      err = (err + d).slice(-4000);
    });
    p.on('error', (e) => rej(new GerakError(`Gagal menjalankan ${bin}: ${e.message}. Install FFmpeg dulu.`, 'FFMPEG')));
    p.on('close', (code) => (code === 0 ? res() : rej(new GerakError(`${bin} gagal (exit ${code}):\n${err}`, 'FFMPEG'))));
    if (stdinWriter) stdinWriter(p.stdin).catch((e) => {
      p.kill('SIGKILL');
      rej(e);
    });
    else p.stdin.end();
  });
}

// ------------------------------------------------------------ frame producers

async function* framesInline(doc, f0, f1, scale, background) {
  const { renderer } = await setup(doc);
  const pw = Math.round(doc.width * scale);
  const ph = Math.round(doc.height * scale);
  const cv = createCanvas(pw, ph);
  const ctx = cv.getContext('2d');
  for (let f = f0; f < f1; f++) {
    renderer.renderFrame(ctx, f, { scale, background });
    yield ctx.getImageData(0, 0, pw, ph).data;
  }
}

async function* framesParallel(doc, f0, f1, scale, background, nWorkers) {
  const url = new URL('./worker.mjs', import.meta.url);
  const workers = [];
  const ready = [];
  for (let i = 0; i < nWorkers; i++) {
    const w = new Worker(url, { workerData: { doc, scale, background } });
    workers.push(w);
    ready.push(once(w, 'message'));
  }
  try {
    await Promise.all(ready);
    const results = new Map();
    let waiting = null;
    let failure = null;
    const idle = [...workers];
    let next = f0;
    const maxInFlight = nWorkers * 2;
    let inflight = 0;
    const queue = new Map(workers.map((w) => [w, 0]));
    const dispatch = () => {
      while (next < f1 && inflight < maxInFlight) {
        // round-robin: pick worker with the fewest queued frames
        let best = workers[0];
        for (const w of workers) if (queue.get(w) < queue.get(best)) best = w;
        best.postMessage({ type: 'frame', frame: next });
        queue.set(best, queue.get(best) + 1);
        next++;
        inflight++;
      }
    };
    for (const w of workers) {
      w.on('message', (m) => {
        queue.set(w, queue.get(w) - 1);
        if (m.type === 'error') failure = new GerakError(`Render frame ${m.frame} gagal:\n${m.message}`, 'RENDER');
        else results.set(m.frame, new Uint8Array(m.buf));
        if (waiting) {
          const r = waiting;
          waiting = null;
          r();
        }
      });
      w.on('error', (e) => {
        failure = e;
        if (waiting) {
          const r = waiting;
          waiting = null;
          r();
        }
      });
    }
    void idle;
    dispatch();
    for (let f = f0; f < f1; f++) {
      while (!results.has(f)) {
        if (failure) throw failure;
        await new Promise((r) => {
          waiting = r;
        });
      }
      const buf = results.get(f);
      results.delete(f);
      inflight--;
      dispatch();
      yield buf;
    }
  } finally {
    for (const w of workers) w.terminate();
  }
}

// ------------------------------------------------------------ movie

/**
 * Render a movie. Format follows the file extension: .mp4 (H.264), .webm (VP9), .mov (ProRes 4444), .gif
 * opts: scale, from, to, crf, preset, workers ('auto'|n), audio (true), transparent, onProgress, ffmpeg, gifFps, gifWidth
 */
export async function renderMovie(input, file, opts = {}) {
  const doc = docOf(input);
  const ffmpeg = opts.ffmpeg ?? 'ffmpeg';
  if (!ffmpegAvailable(ffmpeg)) throw new GerakError('FFmpeg tidak ditemukan. Install: sudo apt install ffmpeg', 'FFMPEG');
  const tl = buildTimeline(doc);
  const [f0, f1] = frameRange(doc, tl.total, opts);
  const scale = opts.scale ?? 1;
  const pw = Math.round(doc.width * scale);
  const ph = Math.round(doc.height * scale);
  const out = resolve(file);
  const ext = extname(out).toLowerCase() || '.mp4';
  const transparent = !!opts.transparent && (ext === '.webm' || ext === '.mov');
  if (opts.transparent && !transparent) process.emitWarning?.('Transparan hanya untuk .webm/.mov — render pakai background.');
  const fps = doc.fps;
  const totalSec = (f1 - f0) / fps;
  mkdirSync(dirname(out), { recursive: true });
  const tmpDir = mkdtempSync(join(os.tmpdir(), 'gerak-'));
  const tmpOut = join(dirname(out), `.${basename(out, ext)}.part${ext}`);
  const wantAudio = opts.audio !== false && ext !== '.gif';
  try {
    const plan = wantAudio ? planAudio(doc, tmpDir, { from: f0, to: f1 }) : [];
    const args = ['-y', '-v', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgba', '-s', `${pw}x${ph}`, '-framerate', String(fps), '-i', 'pipe:0'];
    args.push(...audioInputs(plan));
    const filters = [];
    const evenPad = pw % 2 || ph % 2 ? 'pad=ceil(iw/2)*2:ceil(ih/2)*2' : null;
    if (ext === '.gif') {
      const gfps = opts.gifFps ?? Math.min(fps, 15);
      const gw = opts.gifWidth ?? Math.min(pw, 540);
      filters.push(`[0:v]fps=${gfps},scale=${gw}:-1:flags=lanczos,split[ga][gb];[ga]palettegen=stats_mode=diff[gp];[gb][gp]paletteuse=dither=bayer:bayer_scale=4[vout]`);
    } else if (evenPad) filters.push(`[0:v]${evenPad}[vout]`);
    if (plan.length) filters.push(audioFilter(plan, 1, totalSec));
    if (filters.length) args.push('-filter_complex', filters.join(';'));
    args.push('-map', filters.some((f) => f.includes('[vout]')) ? '[vout]' : '0:v');
    if (plan.length) args.push('-map', '[aout]');
    if (ext === '.webm') {
      args.push('-c:v', 'libvpx-vp9', '-b:v', '0', '-crf', String(opts.crf ?? 30), '-row-mt', '1', '-deadline', 'good', '-cpu-used', '2');
      args.push('-pix_fmt', transparent ? 'yuva420p' : 'yuv420p');
      if (plan.length) args.push('-c:a', 'libopus', '-b:a', '160k');
    } else if (ext === '.mov') {
      args.push('-c:v', 'prores_ks', '-profile:v', transparent ? '4444' : '3', '-pix_fmt', transparent ? 'yuva444p10le' : 'yuv422p10le');
      if (plan.length) args.push('-c:a', 'pcm_s16le');
    } else if (ext === '.gif') {
      args.push('-loop', '0');
    } else {
      args.push('-c:v', 'libx264', '-preset', opts.preset ?? 'medium', '-crf', String(opts.crf ?? 18), '-pix_fmt', 'yuv420p', '-movflags', '+faststart');
      if (opts.tune) args.push('-tune', opts.tune);
      if (plan.length) args.push('-c:a', 'aac', '-b:a', '192k');
    }
    args.push('-r', String(ext === '.gif' ? opts.gifFps ?? Math.min(fps, 15) : fps), tmpOut);

    let nWorkers = opts.workers === undefined || opts.workers === 'auto' ? Math.max(1, Math.min(os.availableParallelism?.() ?? os.cpus().length, 8) - 1) : Number(opts.workers);
    const n = f1 - f0;
    if (n < 24) nWorkers = 1;
    const source = nWorkers > 1 ? framesParallel(doc, f0, f1, scale, !transparent, nWorkers) : framesInline(doc, f0, f1, scale, !transparent);
    const t0 = Date.now();
    await run(ffmpeg, args, async (stdin) => {
      let i = 0;
      stdin.on('error', () => {});
      for await (const buf of source) {
        if (!stdin.write(buf)) await once(stdin, 'drain');
        i++;
        if (opts.onProgress) {
          const el = (Date.now() - t0) / 1000;
          opts.onProgress({ done: i, total: n, fps: i / Math.max(el, 0.001), eta: ((n - i) * el) / i });
        }
      }
      stdin.end();
    });
    renameSync(tmpOut, out);
    return { file: out, frames: n, seconds: totalSec, width: pw + (pw % 2), height: ph + (ph % 2), audioClips: plan.length, workers: nWorkers, renderSeconds: (Date.now() - t0) / 1000 };
  } catch (e) {
    rmSync(tmpOut, { force: true });
    throw e;
  } finally {
    rmSync(tmpDir, { recursive: true, force: true });
  }
}
