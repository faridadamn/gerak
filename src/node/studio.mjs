// Gerak Studio server: a visual editor in the browser for .gerak.json projects.
// Serves the studio UI + the isomorphic engine, stores projects/assets in a workspace folder,
// mixes audio for preview and renders videos with the same exporter as the CLI.
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import {
  readFileSync, writeFileSync, existsSync, statSync, mkdirSync, readdirSync, createReadStream, createWriteStream,
  renameSync, copyFileSync, rmSync, mkdtempSync,
} from 'node:fs';
import { resolve, dirname, join, extname, basename, relative, isAbsolute, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import os from 'node:os';
import { bundledFonts } from './platform.mjs';
import { renderAudio, renderMovie, ffmpegAvailable } from './export.mjs';
import { Project } from '../author.mjs';
import { buildTimeline } from '../core/render.mjs';
import { synth, encodeWav, SFX_TYPES } from '../core/synth.mjs';
import { slug } from '../core/util.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const SRC_DIR = resolve(HERE, '..');
const CORE_DIR = join(SRC_DIR, 'core');
const UI_DIR = join(SRC_DIR, 'studio');
const ENGINE_DIR = resolve(SRC_DIR, '..');
const BIN = join(ENGINE_DIR, 'bin', 'gerak.mjs');
const RESEP_DIR = join(ENGINE_DIR, 'examples', 'resep');
const TEMPLATE_DIR = join(ENGINE_DIR, 'templates');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.wav': 'audio/wav',
  '.mp3': 'audio/mpeg',
  '.m4a': 'audio/mp4',
  '.aac': 'audio/aac',
  '.ogg': 'audio/ogg',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mov': 'video/quicktime',
};

const IMAGE_EXT = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif']);
const AUDIO_EXT = new Set(['.mp3', '.wav', '.m4a', '.aac', '.ogg']);
const FONT_EXT = new Set(['.ttf', '.otf']);

export const TEMPLATES = [
  { id: 'basic', judul: 'Dasar', pakai: 'satu scene judul + coretan kuas, titik awal paling simpel' },
  { id: 'story', judul: 'Cerita gambar tangan', pakai: 'animatic 3 scene bergaya sketsa dengan transisi' },
  { id: 'promo', judul: 'Promo brand', pakai: 'listicle bersih dengan teks kinetik dan beat' },
];

const PROJECT_RE = /^[^/\\]+\.gerak\.json$/;
const SCRIPT_RE = /^[^/\\.][^/\\]*\.(mjs|js|ts|mts)$/;

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function assetType(file) {
  const e = extname(file).toLowerCase();
  if (IMAGE_EXT.has(e)) return 'image';
  if (AUDIO_EXT.has(e)) return 'audio';
  if (FONT_EXT.has(e)) return 'font';
  return null;
}

function safeName(name) {
  const ext = extname(name).toLowerCase();
  const base = basename(name, extname(name))
    .normalize('NFKD')
    .replace(/[^\w.-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()
    .slice(0, 60);
  return `${base || 'file'}${ext}`;
}

function hashFile(file) {
  return createHash('sha1').update(readFileSync(file)).digest('hex');
}

function readBody(req, limit = 300 * 1024 * 1024) {
  return new Promise((done, fail) => {
    const chunks = [];
    let size = 0;
    req.on('data', (c) => {
      size += c.length;
      if (size > limit) {
        fail(new HttpError(413, 'File terlalu besar'));
        req.destroy();
      } else chunks.push(c);
    });
    req.on('end', () => done(Buffer.concat(chunks)));
    req.on('error', fail);
  });
}

async function readJson(req) {
  const buf = await readBody(req, 50 * 1024 * 1024);
  try {
    return JSON.parse(buf.toString('utf8') || '{}');
  } catch {
    throw new HttpError(400, 'Body bukan JSON yang valid');
  }
}

function sendJson(res, status, data) {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' });
  res.end(JSON.stringify(data));
}

function serveFile(req, res, file, { cache = 'no-cache' } = {}) {
  let st;
  try {
    st = statSync(file);
  } catch {
    st = null;
  }
  if (!st || !st.isFile()) {
    res.writeHead(404, { 'content-type': 'text/plain' });
    return res.end('tidak ditemukan');
  }
  const type = MIME[extname(file).toLowerCase()] ?? 'application/octet-stream';
  const range = req.headers.range && /^bytes=(\d*)-(\d*)$/.exec(req.headers.range);
  if (range) {
    let start = range[1] === '' ? st.size - Number(range[2]) : Number(range[1]);
    let end = range[1] === '' || range[2] === '' ? st.size - 1 : Number(range[2]);
    start = Math.max(0, start);
    end = Math.min(st.size - 1, end);
    if (start > end) {
      res.writeHead(416, { 'content-range': `bytes */${st.size}` });
      return res.end();
    }
    res.writeHead(206, { 'content-type': type, 'content-length': end - start + 1, 'content-range': `bytes ${start}-${end}/${st.size}`, 'accept-ranges': 'bytes', 'cache-control': cache });
    return createReadStream(file, { start, end }).pipe(res);
  }
  res.writeHead(200, { 'content-type': type, 'content-length': st.size, 'accept-ranges': 'bytes', 'cache-control': cache });
  createReadStream(file).pipe(res);
}

/** Resolve `rel` inside `root`, refusing anything that escapes it. */
function inside(root, rel) {
  const abs = resolve(root, rel);
  if (abs !== root && !abs.startsWith(root + sep)) throw new HttpError(403, 'Path di luar folder');
  return abs;
}

function exportScript(src) {
  return new Promise((done, fail) => {
    const tmp = mkdtempSync(join(os.tmpdir(), 'gerak-studio-'));
    const out = join(tmp, 'doc.json');
    const child = spawn(process.execPath, [BIN, '__export-json', src, out], { stdio: ['ignore', 'ignore', 'pipe'] });
    let err = '';
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      child.kill('SIGKILL');
    }, 60000);
    child.stderr.on('data', (d) => {
      if (err.length < 65536) err += d;
    });
    child.on('close', (code) => {
      clearTimeout(timer);
      try {
        if (timedOut) throw new Error('Script terlalu lama (lebih dari 60 detik) dan dihentikan');
        if (code !== 0) throw new Error(err.replace(/\x1b\[[0-9;]*m/g, '').trim() || `exit ${code}`);
        done(JSON.parse(readFileSync(out, 'utf8')));
      } catch (e) {
        fail(e);
      } finally {
        rmSync(tmp, { recursive: true, force: true });
      }
    });
  });
}

/**
 * Start the studio. `dir` is the workspace: projects (*.gerak.json) live in its root,
 * uploads in assets/, renders in output/.
 */
export async function startStudio(dir = '.', { port = 4400, host = '127.0.0.1', password = process.env.GERAK_STUDIO_PASSWORD, quiet = false } = {}) {
  const WS = resolve(dir);
  for (const d of ['', 'assets', 'output', '.studio', '.studio/thumbs', '.studio/backup', '.studio/trash', '.studio/mix']) mkdirSync(join(WS, d), { recursive: true });
  const log = quiet ? () => {} : (...a) => console.log(...a);

  const projectPath = (file) => {
    if (typeof file !== 'string' || !PROJECT_RE.test(file)) throw new HttpError(400, 'Nama file project harus "nama.gerak.json"');
    return join(WS, file);
  };

  const uniqueFile = (base) => {
    const s = slug(base) || 'video';
    let name = `${s}.gerak.json`;
    for (let i = 2; existsSync(join(WS, name)); i++) name = `${s}-${i}.gerak.json`;
    return name;
  };

  /** Make every path in the doc absolute (relative paths are relative to the workspace). */
  const absolutize = (doc) => {
    const abs = (p) => (p && !isAbsolute(p) ? resolve(WS, p) : p);
    for (const a of Object.values(doc.assets || {})) a.path = abs(a.path);
    for (const f of doc.fonts || []) f.path = abs(f.path);
    for (const c of doc.audio || []) if (c.src) c.src = abs(c.src);
    return doc;
  };

  /** Copy a file into the workspace (dedupe by content) and return its workspace-relative path. */
  const adoptFile = (abs, subdir) => {
    if (abs.startsWith(WS + sep)) return relative(WS, abs).split(sep).join('/');
    const destDir = join(WS, subdir);
    mkdirSync(destDir, { recursive: true });
    const name = safeName(basename(abs));
    let dest = join(destDir, name);
    if (existsSync(dest)) {
      const h = hashFile(abs);
      if (hashFile(dest) !== h) {
        const ext = extname(name);
        const b = basename(name, ext);
        let i = 2;
        for (; existsSync(join(destDir, `${b}-${i}${ext}`)); i++) if (hashFile(join(destDir, `${b}-${i}${ext}`)) === h) break;
        dest = join(destDir, `${b}-${i}${ext}`);
      }
    }
    if (!existsSync(dest)) copyFileSync(abs, dest);
    return relative(WS, dest).split(sep).join('/');
  };

  const adoptDoc = (doc, subdir) => {
    const adopt = (p) => (p && isAbsolute(p) && existsSync(p) ? adoptFile(p, subdir) : p);
    for (const a of Object.values(doc.assets || {})) a.path = adopt(a.path);
    for (const f of doc.fonts || []) f.path = adopt(f.path);
    for (const c of doc.audio || []) if (c.src) c.src = adopt(c.src);
    return doc;
  };

  /** Every file a document points at must live inside the workspace. */
  const checkPaths = (doc) => {
    const ok = (p) => {
      if (p === undefined || p === null) return;
      const abs = typeof p === 'string' && !isAbsolute(p) ? resolve(WS, p) : null;
      if (!abs || !abs.startsWith(WS + sep)) throw new HttpError(400, `Path aset harus relatif di dalam folder kerja: ${p}`);
    };
    for (const a of Object.values(doc.assets || {})) ok(a.path);
    for (const f of doc.fonts || []) ok(f.path);
    for (const c of doc.audio || []) if (c.src !== undefined) ok(c.src);
  };

  const backupTimes = new Map();
  const saveDoc = (file, doc) => {
    if (!doc || doc.format !== 'gerak' || !Array.isArray(doc.scenes) || !doc.scenes.length) throw new HttpError(400, 'Bukan dokumen Gerak (minimal satu scene)');
    checkPaths(doc);
    const abs = projectPath(file);
    if (existsSync(abs)) {
      // rolling history: the latest previous version, plus one snapshot every 5 minutes (20 kept)
      const bdir = join(WS, '.studio', 'backup');
      copyFileSync(abs, join(bdir, file));
      const last = backupTimes.get(file) ?? 0;
      if (Date.now() - last > 5 * 60 * 1000) {
        backupTimes.set(file, Date.now());
        const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        copyFileSync(abs, join(bdir, `${file}.${stamp}.json`));
        const mine = readdirSync(bdir).filter((n) => n.startsWith(`${file}.`) && n.endsWith('.json')).sort();
        for (const old of mine.slice(0, Math.max(0, mine.length - 20))) rmSync(join(bdir, old), { force: true });
      }
    }
    const tmp = `${abs}.tmp-${process.pid}`;
    writeFileSync(tmp, JSON.stringify(doc));
    renameSync(tmp, abs);
  };

  const listProjects = () => {
    const out = [];
    for (const name of readdirSync(WS)) {
      if (!PROJECT_RE.test(name)) continue;
      const abs = join(WS, name);
      try {
        const st = statSync(abs);
        const doc = JSON.parse(readFileSync(abs, 'utf8'));
        if (doc.format !== 'gerak') continue;
        const tl = buildTimeline(doc);
        const thumb = join(WS, '.studio', 'thumbs', `${name}.png`);
        out.push({
          file: name,
          title: doc.title,
          width: doc.width,
          height: doc.height,
          fps: doc.fps,
          frames: tl.total,
          seconds: tl.total / doc.fps,
          scenes: doc.scenes.length,
          mtime: st.mtimeMs,
          thumb: existsSync(thumb) ? `/files/.studio/thumbs/${encodeURIComponent(name)}.png?v=${Math.round(statSync(thumb).mtimeMs)}` : null,
        });
      } catch {
        /* skip unreadable files */
      }
    }
    return out.sort((a, b) => b.mtime - a.mtime);
  };

  const listAssets = () => {
    const out = [];
    const walk = (d, depth) => {
      let names = [];
      try {
        names = readdirSync(d, { withFileTypes: true });
      } catch {
        return;
      }
      for (const n of names) {
        if (n.name.startsWith('.')) continue;
        const abs = join(d, n.name);
        if (n.isDirectory()) {
          if (depth < 3) walk(abs, depth + 1);
          continue;
        }
        const type = assetType(n.name);
        if (!type) continue;
        const st = statSync(abs);
        out.push({ path: relative(WS, abs).split(sep).join('/'), name: n.name, type, size: st.size, mtime: st.mtimeMs });
      }
    };
    walk(join(WS, 'assets'), 0);
    return out.sort((a, b) => b.mtime - a.mtime);
  };

  // ---------------------------------------------------------- audio preview & sfx
  const sfxCache = new Map();
  const sfxWav = (type) => {
    if (!SFX_TYPES.includes(type)) throw new HttpError(404, `SFX "${type}" tidak ada`);
    if (!sfxCache.has(type)) {
      const s = synth(type, {});
      sfxCache.set(type, Buffer.from(encodeWav(s.data, s.rate)));
    }
    return sfxCache.get(type);
  };

  const mixDoc = async (doc) => {
    if (!(doc.audio || []).length) return null;
    checkPaths(doc);
    const tl = buildTimeline(doc);
    const key = createHash('sha1')
      .update(JSON.stringify({ a: doc.audio, s: tl.entries.map((e) => [e.scene.id, e.start, e.end]), fps: doc.fps, t: tl.total }))
      .digest('hex')
      .slice(0, 16);
    const file = join(WS, '.studio', 'mix', `${key}.wav`);
    if (!existsSync(file)) {
      const tmp = `${file}.tmp.wav`;
      await renderAudio(absolutize(JSON.parse(JSON.stringify(doc))), tmp);
      renameSync(tmp, file);
      // keep the mix cache small
      const all = readdirSync(join(WS, '.studio', 'mix')).filter((n) => n.endsWith('.wav')).map((n) => ({ n, t: statSync(join(WS, '.studio', 'mix', n)).mtimeMs }));
      all.sort((a, b) => b.t - a.t).slice(12).forEach((q) => rmSync(join(WS, '.studio', 'mix', q.n), { force: true }));
    }
    return `/files/.studio/mix/${key}.wav`;
  };

  let uploading = 0;

  // ---------------------------------------------------------- render jobs
  const jobs = new Map();
  const queue = [];
  let running = null;
  const hasFfmpeg = Boolean(ffmpegAvailable());

  const RENDER_FORMATS = {
    mp4: { ext: '.mp4', opts: {} },
    gif: { ext: '.gif', opts: {} },
    webm: { ext: '.webm', opts: { transparent: true } },
    mov: { ext: '.mov', opts: { transparent: true } },
  };

  const pump = async () => {
    if (running || !queue.length) return;
    const job = queue.shift();
    running = job;
    job.state = 'rendering';
    job.startedAt = Date.now();
    try {
      const p = Project.open(projectPath(job.file));
      const fmt = RENDER_FORMATS[job.format];
      const base = job.file.replace(/\.gerak\.json$/, '');
      const outName = `${base}${job.quality === 'draft' ? '-draft' : ''}${fmt.ext}`;
      const out = join(WS, 'output', outName);
      const opts = { ...fmt.opts, workers: 'auto', onProgress: (q) => Object.assign(job, { done: q.done, total: q.total, eta: q.eta }) };
      if (job.quality === 'draft') Object.assign(opts, { scale: 0.5, crf: 26, preset: 'veryfast' });
      if (job.format === 'gif') Object.assign(opts, { scale: job.quality === 'draft' ? 0.5 : 1 });
      await renderMovie(p, out, opts);
      job.state = 'done';
      job.url = `/files/output/${encodeURIComponent(outName)}?v=${Date.now()}`;
      job.output = `output/${outName}`;
      job.size = statSync(out).size;
      log(`\x1b[32m✓\x1b[0m render ${outName} ${((Date.now() - job.startedAt) / 1000).toFixed(1)}s`);
    } catch (e) {
      job.state = 'error';
      job.error = String(e.message || e);
      log(`\x1b[31m✗ render ${job.file}: ${job.error}\x1b[0m`);
    } finally {
      job.finishedAt = Date.now();
      running = null;
      pump();
    }
  };

  // ---------------------------------------------------------- auth
  const authOk = (req) => {
    if (!password) return true;
    const h = req.headers.authorization || '';
    if (!h.startsWith('Basic ')) return false;
    const [, pass = ''] = Buffer.from(h.slice(6), 'base64').toString('utf8').split(/:(.*)/s);
    const a = Buffer.from(createHash('sha256').update(pass).digest());
    const b = Buffer.from(createHash('sha256').update(String(password)).digest());
    return timingSafeEqual(a, b);
  };

  // ---------------------------------------------------------- request guards
  const LOOPBACK = new Set(['localhost', '127.0.0.1', '::1', '[::1]']);
  const hostName = (h) => String(h || '').replace(/:\d+$/, '').toLowerCase();
  const loopbackOnly = !password && (host === '127.0.0.1' || host === 'localhost' || host === '::1');
  /** Blocks DNS rebinding (local, no password) and cross-site requests that change things. */
  const guardOk = (req, p) => {
    if (loopbackOnly && !LOOPBACK.has(hostName(req.headers.host))) return 'Host tidak dikenal';
    const origin = req.headers.origin;
    if (origin && origin !== 'null') {
      let oh = '';
      try {
        oh = new URL(origin).host.toLowerCase();
      } catch {
        return 'Origin tidak valid';
      }
      if (oh !== String(req.headers.host || '').toLowerCase()) return 'Permintaan dari situs lain ditolak';
    }
    if (p.startsWith('/api/') && req.method !== 'GET' && req.headers['x-gerak-studio'] !== '1') return 'Permintaan tanpa header studio ditolak';
    return null;
  };

  // ---------------------------------------------------------- routes
  const api = async (req, res, p, url) => {
    const m = req.method;
    const q = (k) => url.searchParams.get(k);

    if (p === '/api/info' && m === 'GET') {
      return sendJson(res, 200, {
        workspace: WS,
        ffmpeg: hasFfmpeg,
        fonts: bundledFonts().map((f, i) => ({ family: f.family, weight: f.weight, style: 'normal', url: `/font/b${i}` })),
        sfx: SFX_TYPES,
        cores: os.cpus().length,
      });
    }

    if (p === '/api/projects' && m === 'GET') return sendJson(res, 200, listProjects());

    if (p === '/api/project') {
      const file = q('file');
      const abs = projectPath(file);
      if (m === 'GET') {
        if (!existsSync(abs)) throw new HttpError(404, `Project ${file} tidak ada`);
        return sendJson(res, 200, { file, doc: JSON.parse(readFileSync(abs, 'utf8')) });
      }
      if (m === 'PUT') {
        const doc = await readJson(req);
        saveDoc(file, doc);
        return sendJson(res, 200, { ok: true, file, savedAt: Date.now() });
      }
      if (m === 'DELETE') {
        if (existsSync(abs)) renameSync(abs, join(WS, '.studio', 'trash', `${Date.now()}-${file}`));
        return sendJson(res, 200, { ok: true });
      }
    }

    if (p === '/api/project/new' && m === 'POST') {
      const o = await readJson(req);
      const proj = Project.create({ title: o.title || 'Video baru', preset: o.preset || undefined, width: o.width, height: o.height, fps: o.fps || 30, background: o.background || '#ffffff', root: WS });
      proj.scene('Scene 1', { duration: o.duration || '3s' });
      const file = uniqueFile(o.title || 'video');
      saveDoc(file, proj.serialize(WS));
      return sendJson(res, 200, { file });
    }

    if (p === '/api/project/duplicate' && m === 'POST') {
      const { file, title } = await readJson(req);
      const doc = JSON.parse(readFileSync(projectPath(file), 'utf8'));
      doc.title = title || `${doc.title} (salinan)`;
      const next = uniqueFile(doc.title);
      saveDoc(next, doc);
      return sendJson(res, 200, { file: next });
    }

    if (p === '/api/library' && m === 'GET') {
      let resep = [];
      try {
        resep = JSON.parse(readFileSync(join(RESEP_DIR, 'katalog.json'), 'utf8'));
      } catch {
        /* no catalog */
      }
      return sendJson(res, 200, { resep, templates: TEMPLATES });
    }

    if (p === '/api/scripts' && m === 'GET') {
      const list = readdirSync(WS)
        .filter((n) => SCRIPT_RE.test(n))
        .map((n) => ({ file: n, mtime: statSync(join(WS, n)).mtimeMs }))
        .sort((a, b) => b.mtime - a.mtime);
      return sendJson(res, 200, list);
    }

    if (p === '/api/import' && m === 'POST') {
      const { kind, id } = await readJson(req);
      let src;
      let label;
      if (kind === 'script') {
        if (typeof id !== 'string' || !SCRIPT_RE.test(id)) throw new HttpError(400, 'Script harus file .mjs/.js/.ts di folder kerja');
        src = join(WS, id);
        if (!existsSync(src)) throw new HttpError(404, `Script ${id} tidak ada`);
        label = id.replace(/\.(mjs|js|ts|mts)$/, '');
      } else if (kind === 'resep') {
        const cat = JSON.parse(readFileSync(join(RESEP_DIR, 'katalog.json'), 'utf8'));
        const r = cat.find((x) => x.file === id || x.no === id);
        if (!r) throw new HttpError(404, `Resep ${id} tidak ada`);
        src = join(RESEP_DIR, r.file);
        label = `${r.no}-${r.judul}`;
      } else if (kind === 'template') {
        const t = TEMPLATES.find((x) => x.id === id);
        if (!t) throw new HttpError(404, `Template ${id} tidak ada`);
        src = join(TEMPLATE_DIR, `${t.id}.mjs`);
        label = t.judul;
      } else throw new HttpError(400, 'kind harus resep atau template');
      const doc = await exportScript(src);
      adoptDoc(doc, `assets/${slug(label).slice(0, 40)}`);
      const file = uniqueFile(doc.title || label);
      saveDoc(file, doc);
      return sendJson(res, 200, { file });
    }

    if (p === '/api/assets' && m === 'GET') return sendJson(res, 200, listAssets());

    if (p === '/api/upload' && m === 'POST') {
      const name = safeName(q('name') || 'file');
      const type = assetType(name);
      if (!type) throw new HttpError(400, 'Format belum didukung. Gambar: png/jpg/webp/gif · Audio: mp3/wav/m4a/ogg · Font: ttf/otf');
      if (uploading >= 3) throw new HttpError(429, 'Masih mengunggah file lain, coba lagi sebentar');
      uploading++;
      const tmp = join(WS, '.studio', `upload-${randomBytes(6).toString('hex')}`);
      try {
        // stream to disk (never hold the whole file in memory), hashing on the way
        const hash = createHash('sha1');
        let size = 0;
        await new Promise((done, fail) => {
          const out = createWriteStream(tmp);
          req.on('data', (c) => {
            size += c.length;
            if (size > 300 * 1024 * 1024) {
              req.destroy();
              out.destroy();
              fail(new HttpError(413, 'File terlalu besar (maks 300 MB)'));
              return;
            }
            hash.update(c);
          });
          req.on('error', fail);
          out.on('error', fail);
          out.on('finish', done);
          req.pipe(out);
        });
        if (!size) throw new HttpError(400, 'File kosong');
        const h = hash.digest('hex');
        const dir = join(WS, 'assets');
        const ext = extname(name);
        const b = basename(name, ext);
        let dest = join(dir, name);
        for (let i = 2; existsSync(dest); i++) {
          if (hashFile(dest) === h) break;
          dest = join(dir, `${b}-${i}${ext}`);
        }
        if (!existsSync(dest)) renameSync(tmp, dest);
        return sendJson(res, 200, { path: relative(WS, dest).split(sep).join('/'), name: basename(dest), type });
      } finally {
        uploading--;
        rmSync(tmp, { force: true });
      }
    }

    if (p === '/api/thumb' && m === 'POST') {
      const file = q('file');
      projectPath(file);
      const buf = await readBody(req, 5 * 1024 * 1024);
      writeFileSync(join(WS, '.studio', 'thumbs', `${file}.png`), buf);
      return sendJson(res, 200, { ok: true });
    }

    if (p.startsWith('/api/sfx/') && m === 'GET') {
      const type = basename(p, '.wav');
      const buf = sfxWav(type);
      res.writeHead(200, { 'content-type': 'audio/wav', 'content-length': buf.length, 'cache-control': 'max-age=86400' });
      return res.end(buf);
    }

    if (p === '/api/mix' && m === 'POST') {
      const doc = await readJson(req);
      return sendJson(res, 200, { url: await mixDoc(doc) });
    }

    if (p === '/api/render' && m === 'POST') {
      if (!hasFfmpeg) throw new HttpError(500, 'FFmpeg tidak ditemukan di server. Install: sudo apt install ffmpeg');
      const { file, format = 'mp4', quality = 'final' } = await readJson(req);
      projectPath(file);
      if (!RENDER_FORMATS[format]) throw new HttpError(400, `Format ${format} tidak didukung (mp4, gif, webm, mov)`);
      const id = randomBytes(6).toString('hex');
      const job = { id, file, format, quality, state: 'queued', done: 0, total: 0, createdAt: Date.now() };
      jobs.set(id, job);
      queue.push(job);
      pump();
      return sendJson(res, 200, job);
    }

    if (p.startsWith('/api/jobs/') && m === 'GET') {
      const job = jobs.get(p.slice(10));
      if (!job) throw new HttpError(404, 'Job tidak ada');
      return sendJson(res, 200, { ...job, position: job.state === 'queued' ? queue.indexOf(job) + 1 : 0 });
    }

    if (p === '/api/outputs' && m === 'GET') {
      const dirOut = join(WS, 'output');
      const list = readdirSync(dirOut)
        .filter((n) => /\.(mp4|webm|mov|gif)$/i.test(n))
        .map((n) => {
          const st = statSync(join(dirOut, n));
          return { name: n, size: st.size, mtime: st.mtimeMs, url: `/files/output/${encodeURIComponent(n)}?v=${Math.round(st.mtimeMs)}` };
        })
        .sort((a, b) => b.mtime - a.mtime);
      return sendJson(res, 200, list);
    }

    throw new HttpError(404, `API ${m} ${p} tidak ada`);
  };

  const server = createServer(async (req, res) => {
    const url = new URL(req.url, 'http://x');
    let p;
    try {
      p = decodeURIComponent(url.pathname);
    } catch {
      res.writeHead(400);
      return res.end();
    }
    try {
      if (!authOk(req)) {
        res.writeHead(401, { 'www-authenticate': 'Basic realm="Gerak Studio", charset="UTF-8"', 'content-type': 'text/plain' });
        return res.end('Butuh password');
      }
      const denied = guardOk(req, p);
      if (denied) return sendJson(res, 403, { error: denied });
      if (p === '/' || p === '/index.html') return serveFile(req, res, join(UI_DIR, 'index.html'));
      if (p.startsWith('/studio/')) return serveFile(req, res, inside(UI_DIR, p.slice(8)));
      if (p.startsWith('/core/')) return serveFile(req, res, inside(CORE_DIR, p.slice(6)));
      if (p === '/author.mjs') return serveFile(req, res, join(SRC_DIR, 'author.mjs'));
      if (p.startsWith('/font/b')) return serveFile(req, res, bundledFonts()[+p.slice(7)]?.path ?? '', { cache: 'max-age=86400' });
      if (p.startsWith('/files/')) return serveFile(req, res, inside(WS, p.slice(7)));
      if (p.startsWith('/api/')) return await api(req, res, p, url);
      res.writeHead(404, { 'content-type': 'text/plain' });
      res.end('tidak ditemukan');
    } catch (e) {
      const status = e.status ?? 500;
      if (status === 500) log(`\x1b[31m✗ ${req.method} ${p}: ${e.stack || e}\x1b[0m`);
      if (!res.headersSent) sendJson(res, status, { error: String(e.message || e) });
      else res.end();
    }
  });

  await new Promise((r, fail) => {
    server.once('error', fail);
    server.listen(port, host, r);
  });
  const actualPort = server.address().port;
  const shown = host === '0.0.0.0' ? `http://<ip-vps>:${actualPort}` : `http://${host}:${actualPort}`;
  log(`\n\x1b[1mGerak Studio\x1b[0m  ${shown}\n  folder kerja: ${WS}\n  ${password ? 'password: aktif (user bebas)' : host === '0.0.0.0' ? '\x1b[33mperingatan: tanpa password — pakai --password atau GERAK_STUDIO_PASSWORD\x1b[0m' : 'lokal saja (tambah --host 0.0.0.0 untuk akses dari luar)'}\n  ${hasFfmpeg ? '' : '\x1b[33mFFmpeg tidak ditemukan: render video tidak bisa dipakai\x1b[0m'}\n  Ctrl+C untuk berhenti.\n`);
  return { server, port: actualPort, workspace: WS, close: () => new Promise((r) => server.close(r)) };
}
