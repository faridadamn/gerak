// Live preview server: serves the isomorphic renderer to the browser and reloads on save.
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { readFileSync, existsSync, statSync, mkdtempSync, rmSync, createReadStream, readdirSync } from 'node:fs';
import { resolve, dirname, join, extname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import os from 'node:os';
import { bundledFonts } from './platform.mjs';
import { renderAudio } from './export.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const CORE_DIR = resolve(HERE, '..', 'core');
const UI_DIR = resolve(HERE, '..', 'preview');
const BIN = resolve(HERE, '..', '..', 'bin', 'gerak.mjs');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.wav': 'audio/wav',
};

export async function startPreview(src, { port = 4300, host = '127.0.0.1' } = {}) {
  const abs = resolve(src);
  if (!existsSync(abs)) throw new Error(`File tidak ditemukan: ${abs}`);
  const isJson = /\.json$/i.test(abs);
  const tmp = mkdtempSync(join(os.tmpdir(), 'gerak-preview-'));
  const state = { doc: null, version: 0, error: null, building: false, pending: false, audioFile: null, audioVersion: -1 };
  const clients = new Set();

  const send = (event, data) => {
    const msg = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    for (const res of clients) res.write(msg);
  };

  const build = () =>
    new Promise((done) => {
      if (state.building) {
        state.pending = true;
        return done();
      }
      state.building = true;
      const t0 = Date.now();
      const outFile = join(tmp, `doc-${Date.now()}.json`);
      const finish = (err) => {
        state.building = false;
        if (err) {
          state.error = err;
          send('error', { message: err });
          console.log(`\x1b[31m✗ ${err.split('\n')[0]}\x1b[0m`);
        } else {
          state.error = null;
          state.version++;
          send('reload', { version: state.version });
          console.log(`\x1b[32m✓\x1b[0m build #${state.version} ${Date.now() - t0}ms`);
        }
        if (state.pending) {
          state.pending = false;
          build().then(done);
        } else done();
      };
      if (isJson) {
        try {
          const doc = JSON.parse(readFileSync(abs, 'utf8'));
          const dir = dirname(abs);
          for (const a of Object.values(doc.assets || {})) if (a.path && !a.path.startsWith('/')) a.path = resolve(dir, a.path);
          for (const f of doc.fonts || []) if (f.path && !f.path.startsWith('/')) f.path = resolve(dir, f.path);
          for (const c of doc.audio || []) if (c.src && !c.src.startsWith('/')) c.src = resolve(dir, c.src);
          state.doc = doc;
          finish(null);
        } catch (e) {
          finish(String(e.message));
        }
        return;
      }
      const child = spawn(process.execPath, [BIN, '__export-json', abs, outFile], { stdio: ['ignore', 'pipe', 'pipe'] });
      let err = '';
      child.stderr.on('data', (d) => (err += d));
      child.stdout.on('data', (d) => process.stdout.write(d));
      child.on('close', (code) => {
        if (code === 0) {
          try {
            state.doc = JSON.parse(readFileSync(outFile, 'utf8'));
            rmSync(outFile, { force: true });
            finish(null);
          } catch (e) {
            finish(String(e.message));
          }
        } else finish(err.replace(/\x1b\[[0-9;]*m/g, '').replace(/^\s*✗\s*/, '').trim() || `exit ${code}`);
      });
    });

  await build();

  // Poll the script folder (scene modules often import helpers). Polling catches in-place
  // writes and atomic renames alike on every platform.
  const watchDir = dirname(abs);
  const WATCH_EXT = /\.(mjs|js|ts|mts|json|png|jpe?g|webp|wav|mp3|m4a|ttf|otf)$/i;
  const signature = () => {
    const parts = [];
    const walk = (dir, depth) => {
      let names = [];
      try {
        names = readdirSync(dir, { withFileTypes: true });
      } catch {
        return;
      }
      for (const d of names) {
        if (d.name.startsWith('.') || d.name === 'node_modules' || d.name === 'output') continue;
        const f = join(dir, d.name);
        if (d.isDirectory()) {
          if (depth < 3) walk(f, depth + 1);
        } else if (WATCH_EXT.test(d.name)) {
          try {
            const st = statSync(f);
            parts.push(`${f}:${st.mtimeMs}:${st.size}`);
          } catch {
            /* ignore */
          }
        }
      }
    };
    if (isJson) {
      const st = statSync(abs);
      return `${st.mtimeMs}:${st.size}`;
    }
    walk(watchDir, 0);
    return parts.sort().join('|');
  };
  let lastSig = signature();
  setInterval(() => {
    const sig = signature();
    if (sig !== lastSig) {
      lastSig = sig;
      build();
    }
  }, 400).unref?.();

  const docForClient = () => {
    const d = JSON.parse(JSON.stringify(state.doc));
    for (const id of Object.keys(d.assets || {})) d.assets[id].url = `/asset/${encodeURIComponent(id)}?v=${state.version}`;
    return d;
  };

  const fontList = () => {
    const list = bundledFonts().map((f, i) => ({ family: f.family, weight: f.weight, style: 'normal', url: `/font/b${i}` }));
    (state.doc?.fonts || []).forEach((f, i) => list.push({ family: f.family, weight: f.weight ?? 400, style: f.style ?? 'normal', url: `/font/d${i}` }));
    return list;
  };

  const serveFile = (res, file, extraHeaders = {}) => {
    if (!file || !existsSync(file) || !statSync(file).isFile()) {
      res.writeHead(404);
      return res.end('not found');
    }
    res.writeHead(200, { 'content-type': MIME[extname(file).toLowerCase()] ?? 'application/octet-stream', 'cache-control': 'no-cache', ...extraHeaders });
    createReadStream(file).pipe(res);
  };

  const server = createServer(async (req, res) => {
    const url = new URL(req.url, 'http://x');
    const p = decodeURIComponent(url.pathname);
    try {
      if (p === '/' || p === '/index.html') return serveFile(res, join(UI_DIR, 'index.html'));
      if (p === '/app.mjs' || p === '/style.css') return serveFile(res, join(UI_DIR, p.slice(1)));
      if (p.startsWith('/core/')) {
        const f = resolve(CORE_DIR, p.slice(6));
        if (!f.startsWith(CORE_DIR)) throw new Error('bad path');
        return serveFile(res, f);
      }
      if (p === '/doc.json') {
        res.writeHead(state.doc ? 200 : 503, { 'content-type': 'application/json', 'cache-control': 'no-cache' });
        return res.end(JSON.stringify({ version: state.version, error: state.error, doc: state.doc ? docForClient() : null, name: basename(abs) }));
      }
      if (p === '/fonts.json') {
        res.writeHead(200, { 'content-type': 'application/json' });
        return res.end(JSON.stringify(fontList()));
      }
      if (p.startsWith('/font/')) {
        const key = p.slice(6);
        const f = key[0] === 'b' ? bundledFonts()[+key.slice(1)]?.path : state.doc?.fonts?.[+key.slice(1)]?.path;
        return serveFile(res, f, { 'cache-control': 'max-age=3600' });
      }
      if (p.startsWith('/asset/')) {
        const a = state.doc?.assets?.[p.slice(7)];
        return serveFile(res, a?.path);
      }
      if (p === '/audio.wav') {
        if (!state.doc || !(state.doc.audio || []).length) {
          res.writeHead(204);
          return res.end();
        }
        if (state.audioVersion !== state.version) {
          const file = join(tmp, `mix-${state.version}.wav`);
          await renderAudio(state.doc, file);
          state.audioFile = file;
          state.audioVersion = state.version;
        }
        return serveFile(res, state.audioFile);
      }
      if (p === '/events') {
        res.writeHead(200, { 'content-type': 'text/event-stream', 'cache-control': 'no-cache', connection: 'keep-alive' });
        res.write(`event: hello\ndata: ${JSON.stringify({ version: state.version })}\n\n`);
        clients.add(res);
        const ping = setInterval(() => res.write(': ping\n\n'), 20000);
        req.on('close', () => {
          clearInterval(ping);
          clients.delete(res);
        });
        return;
      }
      res.writeHead(404);
      res.end('not found');
    } catch (e) {
      res.writeHead(500, { 'content-type': 'text/plain' });
      res.end(String(e.stack || e));
    }
  });

  await new Promise((r) => server.listen(port, host, r));
  const shown = host === '0.0.0.0' ? `http://<ip-vps>:${port}` : `http://${host}:${port}`;
  console.log(`\n\x1b[1mGerak preview\x1b[0m  ${shown}\n  file: ${abs}\n  simpan file → browser otomatis reload. Ctrl+C untuk berhenti.\n`);
  const stop = () => {
    rmSync(tmp, { recursive: true, force: true });
    process.exit(0);
  };
  process.on('SIGINT', stop);
  process.on('SIGTERM', stop);
  return server;
}
