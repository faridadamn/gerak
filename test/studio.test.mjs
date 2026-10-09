// Gerak Studio server: API round-trips (create, save, import, upload, mix, render, auth, path safety).
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import os from 'node:os';
import { startStudio } from '../src/node/studio.mjs';

let ws;
let studio;
let base;

before(async () => {
  ws = mkdtempSync(join(os.tmpdir(), 'gerak-studio-test-'));
  studio = await startStudio(ws, { port: 0, quiet: true });
  base = `http://127.0.0.1:${studio.port}`;
});

after(async () => {
  await studio.close();
  rmSync(ws, { recursive: true, force: true });
});

const H = { 'x-gerak-studio': '1' };
const json = async (method, path, body) => {
  const r = await fetch(base + path, { method, headers: body ? { ...H, 'content-type': 'application/json' } : H, body: body ? JSON.stringify(body) : undefined });
  return { status: r.status, data: await r.json() };
};

test('UI, engine modules and author API are served', async () => {
  for (const p of ['/', '/studio/studio.mjs', '/studio/shim/path.mjs', '/core/render.mjs', '/author.mjs']) {
    const r = await fetch(base + p);
    assert.equal(r.status, 200, p);
    await r.arrayBuffer();
  }
  const { data } = await json('GET', '/api/info');
  assert.ok(data.fonts.length >= 8);
  assert.ok(data.sfx.includes('pop'));
});

test('create, list, load and save a project', async () => {
  const { data: created } = await json('POST', '/api/project/new', { title: 'Uji Studio', preset: 'square', fps: 24 });
  assert.equal(created.file, 'uji-studio.gerak.json');
  const { data: list } = await json('GET', '/api/projects');
  const item = list.find((p) => p.file === created.file);
  assert.equal(item.width, 1080);
  assert.equal(item.height, 1080);
  assert.equal(item.fps, 24);
  const { data: loaded } = await json('GET', `/api/project?file=${created.file}`);
  const doc = loaded.doc;
  assert.equal(doc.scenes.length, 1);
  doc.scenes[0].layers.push({ id: 'judul', type: 'layer', name: 'Judul', transform: { x: 540, y: 540 }, elements: [{ id: 'text', type: 'text', text: 'Halo', x: 0, y: 0, size: 80 }] });
  const saved = await json('PUT', `/api/project?file=${created.file}`, doc);
  assert.equal(saved.status, 200);
  const disk = JSON.parse(readFileSync(join(ws, created.file), 'utf8'));
  assert.equal(disk.scenes[0].layers[0].elements[0].text, 'Halo');
  // second save keeps a backup of the previous version
  await json('PUT', `/api/project?file=${created.file}`, doc);
  assert.ok(existsSync(join(ws, '.studio', 'backup', created.file)));
  const bad = await json('PUT', `/api/project?file=${created.file}`, { nope: true });
  assert.equal(bad.status, 400);
});

test('import a recipe copies its assets into the workspace', async () => {
  const { status, data } = await json('POST', '/api/import', { kind: 'resep', id: '089' });
  assert.equal(status, 200, JSON.stringify(data));
  const doc = JSON.parse(readFileSync(join(ws, data.file), 'utf8'));
  const img = Object.values(doc.assets)[0];
  assert.match(img.path, /^assets\//);
  assert.ok(existsSync(join(ws, img.path)));
  assert.match(doc.audio[0].src, /^assets\/.*musik\.mp3$/);
  const t = await json('POST', '/api/import', { kind: 'template', id: 'basic' });
  assert.equal(t.status, 200);
});

test('a script in the workspace opens as a project copy', async () => {
  const { writeFileSync } = await import('node:fs');
  writeFileSync(join(ws, 'dari-agent.mjs'), `import { project } from 'gerak';\nconst p = project({ title: 'Dari Agent', preset: 'square' });\np.scene('A', { duration: '1s' }).layer('Judul', { x: 540, y: 540 }).text('Halo', 0, 0, { size: 90 });\nexport default p;\n`);
  const { data: list } = await json('GET', '/api/scripts');
  assert.ok(list.some((s) => s.file === 'dari-agent.mjs'));
  const { status, data } = await json('POST', '/api/import', { kind: 'script', id: 'dari-agent.mjs' });
  assert.equal(status, 200, JSON.stringify(data));
  assert.equal(data.file, 'dari-agent.gerak.json');
  const doc = JSON.parse(readFileSync(join(ws, data.file), 'utf8'));
  assert.equal(doc.scenes[0].layers[0].elements[0].text, 'Halo');
  const bad = await json('POST', '/api/import', { kind: 'script', id: '../etc/x.mjs' });
  assert.equal(bad.status, 400);
});

test('upload, asset list, preview mix and SFX', async () => {
  const png = readFileSync(new URL('../examples/resep/assets/produk.png', import.meta.url));
  const r = await fetch(`${base}/api/upload?name=Foto Produk.PNG`, { method: 'POST', headers: H, body: png });
  const up = await r.json();
  assert.equal(up.type, 'image');
  assert.equal(up.path, 'assets/foto-produk.png');
  const again = await (await fetch(`${base}/api/upload?name=Foto Produk.PNG`, { method: 'POST', headers: H, body: png })).json();
  assert.equal(again.path, up.path, 'same content reuses the file');
  const rejected = await fetch(`${base}/api/upload?name=evil.exe`, { method: 'POST', headers: H, body: 'x' });
  assert.equal(rejected.status, 400);
  const { data: assets } = await json('GET', '/api/assets');
  assert.ok(assets.some((a) => a.path === up.path));
  const sfx = await fetch(`${base}/api/sfx/pop.wav`);
  assert.equal(sfx.headers.get('content-type'), 'audio/wav');
  assert.ok((await sfx.arrayBuffer()).byteLength > 1000);
  const { data: proj } = await json('POST', '/api/project/new', { title: 'Mix', preset: 'reels' });
  const { data: loaded } = await json('GET', `/api/project?file=${proj.file}`);
  const doc = loaded.doc;
  doc.audio.push({ id: 'sfx-pop', sfx: { type: 'pop' }, at: 10, gain: 0.5, scene: doc.scenes[0].id });
  const { data: mix } = await json('POST', '/api/mix', doc);
  assert.match(mix.url, /^\/files\/\.studio\/mix\/.+\.wav$/);
  const wav = await fetch(base + mix.url);
  assert.equal(wav.status, 200);
  assert.ok((await wav.arrayBuffer()).byteLength > 10000);
});

test('render job produces a downloadable file', async () => {
  const { data: proj } = await json('POST', '/api/project/new', { title: 'Render kecil', width: 160, height: 90, fps: 12, duration: '0.5s' });
  const { data: job } = await json('POST', '/api/render', { file: proj.file, format: 'gif', quality: 'draft' });
  let j = job;
  for (let i = 0; i < 120 && j.state !== 'done' && j.state !== 'error'; i++) {
    await new Promise((r) => setTimeout(r, 250));
    j = (await json('GET', `/api/jobs/${job.id}`)).data;
  }
  assert.equal(j.state, 'done', j.error);
  const file = await fetch(base + j.url);
  assert.equal(file.headers.get('content-type'), 'image/gif');
  const { data: outs } = await json('GET', '/api/outputs');
  assert.ok(outs.some((o) => o.name === 'render-kecil-draft.gif'));
});

test('files outside the workspace are refused', async () => {
  const r = await fetch(`${base}/files/..%2f..%2fetc%2fpasswd`);
  assert.equal(r.status, 403);
  const bad = await json('GET', '/api/project?file=../x.gerak.json');
  assert.equal(bad.status, 400);
  // documents may only point at files inside the workspace
  const { data: proj } = await json('POST', '/api/project/new', { title: 'Jalur', preset: 'square' });
  const { data: loaded } = await json('GET', `/api/project?file=${proj.file}`);
  const doc = loaded.doc;
  doc.audio.push({ id: 'x', src: '../../../etc/hostname', at: 0, gain: 1 });
  assert.equal((await json('PUT', `/api/project?file=${proj.file}`, doc)).status, 400);
  assert.equal((await json('POST', '/api/mix', doc)).status, 400);
  doc.audio[0].src = '/etc/hostname';
  assert.equal((await json('PUT', `/api/project?file=${proj.file}`, doc)).status, 400);
  doc.audio = [];
  doc.scenes = [];
  assert.equal((await json('PUT', `/api/project?file=${proj.file}`, doc)).status, 400, 'a project needs a scene');
});

test('cross-site and rebinding requests are refused', async () => {
  // state changes need the studio header (forms / text/plain posts from other sites can't send it)
  const noHeader = await fetch(`${base}/api/project/new`, { method: 'POST', headers: { 'content-type': 'text/plain' }, body: '{"title":"csrf"}' });
  assert.equal(noHeader.status, 403);
  const otherOrigin = await fetch(`${base}/api/project/new`, { method: 'POST', headers: { ...H, origin: 'https://evil.example', 'content-type': 'application/json' }, body: '{"title":"csrf"}' });
  assert.equal(otherOrigin.status, 403);
  // local studio without password only answers to loopback host names (DNS rebinding)
  const { request } = await import('node:http');
  const rebindStatus = await new Promise((done, fail) => {
    const rq = request({ host: '127.0.0.1', port: studio.port, path: '/api/projects', headers: { host: 'evil.example:4400' } }, (r) => {
      r.resume();
      done(r.statusCode);
    });
    rq.on('error', fail);
    rq.end();
  });
  assert.equal(rebindStatus, 403);
  const same = await fetch(`${base}/api/project/new`, { method: 'POST', headers: { ...H, origin: base, 'content-type': 'application/json' }, body: '{"title":"Sama"}' });
  assert.equal(same.status, 200);
});

test('password protects every route', async () => {
  const ws2 = mkdtempSync(join(os.tmpdir(), 'gerak-studio-auth-'));
  const s = await startStudio(ws2, { port: 0, quiet: true, password: 'rahasia' });
  try {
    const url = `http://127.0.0.1:${s.port}`;
    assert.equal((await fetch(`${url}/`)).status, 401);
    assert.equal((await fetch(`${url}/api/projects`)).status, 401);
    const ok = await fetch(`${url}/api/projects`, { headers: { authorization: `Basic ${Buffer.from('adam:rahasia').toString('base64')}` } });
    assert.equal(ok.status, 200);
    const wrong = await fetch(`${url}/api/projects`, { headers: { authorization: `Basic ${Buffer.from('adam:salah').toString('base64')}` } });
    assert.equal(wrong.status, 401);
  } finally {
    await s.close();
    rmSync(ws2, { recursive: true, force: true });
  }
});
