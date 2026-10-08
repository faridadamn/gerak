// Setiap contoh di examples/resep harus: punya header lengkap, bisa di-load, dan bisa dirender
// di awal, tengah, dan akhir tanpa error.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { loadProject } from '../src/node/load.mjs';
import { Renderer } from '../src/core/render.mjs';
import { makeEnv, createCanvas } from '../src/node/platform.mjs';

const DIR = new URL('../examples/resep/', import.meta.url).pathname;
const files = readdirSync(DIR).filter((f) => /^\d{3}-.+\.mjs$/.test(f)).sort();

test('ada 100 contoh bernomor urut', () => {
  assert.equal(files.length, 100);
  files.forEach((f, i) => assert.equal(f.slice(0, 3), String(i + 1).padStart(3, '0'), f));
});

for (const f of files) {
  test(`resep ${f}`, async () => {
    const src = readFileSync(join(DIR, f), 'utf8');
    for (const k of ['kategori:', 'fitur:', 'pakai:']) assert.ok(src.split('\n').slice(0, 8).some((l) => l.includes(k)), `${f}: header "${k}" hilang`);
    assert.match(src, /export default p;/);
    const p = await loadProject(join(DIR, f));
    const doc = p.doc;
    const env = await makeEnv(doc);
    const r = new Renderer(doc, env);
    assert.ok(r.total > 0);
    const scale = 0.1;
    const c = createCanvas(Math.round(doc.width * scale), Math.round(doc.height * scale));
    for (const fr of [0, Math.floor(r.total / 2), r.total - 1]) r.renderFrame(c.getContext('2d'), fr, { scale });
  });
}
