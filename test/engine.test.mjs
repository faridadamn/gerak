import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import os from 'node:os';
import {
  project,
  open,
  toFrames,
  resolveEase,
  parsePath,
  pathLength,
  samplePath,
  buildTimeline,
  renderFrameImage,
  synth,
  encodeWav,
  Renderer,
  makeEnv,
  frameInfo,
} from '../src/index.mjs';
import { evalChannel, evalTransform } from '../src/core/keys.mjs';
import { layoutText } from '../src/core/text.mjs';
import { createCanvas } from '../src/node/platform.mjs';

test('time parsing', () => {
  assert.equal(toFrames('1.5s', 30), 45);
  assert.equal(toFrames('500ms', 24), 12);
  assert.equal(toFrames('12f', 30), 12);
  assert.equal(toFrames('0:02', 30), 60);
  assert.equal(toFrames(7, 30), 7);
  assert.throws(() => toFrames('abc', 30), /tidak valid/);
});

test('easing endpoints and names', () => {
  for (const e of ['linear', 'ease-in-out', 'out-back', 'in-out-sine', 'spring', 'cubic-bezier(.2,0,.2,1)', 'steps(4)', [0.4, 0, 0.2, 1]]) {
    const fn = resolveEase(e);
    assert.ok(Math.abs(fn(0)) < 1e-6, `${e}(0)`);
    assert.ok(Math.abs(fn(1) - 1) < 1e-3, `${e}(1)`);
  }
  assert.throws(() => resolveEase('nope'), /tidak dikenal/);
  assert.ok(resolveEase('hold').hold);
});

test('keyframe channels hold, ease and interpolate colors', () => {
  const keys = [
    { f: 0, v: 0, e: 'linear' },
    { f: 10, v: 100, e: 'hold' },
    { f: 20, v: 50 },
  ];
  assert.equal(evalChannel(keys, -5, 9), 0);
  assert.equal(evalChannel(keys, 5, 9), 50);
  assert.equal(evalChannel(keys, 15, 9), 100);
  assert.equal(evalChannel(keys, 30, 9), 50);
  assert.equal(evalChannel([], 3, 9), 9);
  const c = evalChannel([{ f: 0, v: '#000000' }, { f: 10, v: '#ffffff' }], 5);
  assert.match(c, /^rgba\(128,128,128/);
});

test('SVG path parser: relative, H/V, S/T, arcs', () => {
  const cmds = parsePath('m10 10 h 100 v 50 l -20 0 c 0 10 10 10 10 0 s 10 -10 20 0 q 5 5 10 0 t 10 0 a 20 20 0 0 1 40 0 z');
  assert.equal(cmds[0][0], 'M');
  assert.ok(cmds.every((c) => ['M', 'L', 'C', 'Q', 'Z'].includes(c[0])));
  assert.deepEqual(cmds[1], ['L', 110, 10]);
  const L = pathLength('M 0 0 L 100 0');
  assert.ok(Math.abs(L - 100) < 0.01);
  const circle = pathLength('M 100 0 A 100 100 0 1 1 -100 0 A 100 100 0 1 1 100 0');
  assert.ok(Math.abs(circle - 2 * Math.PI * 100) < 2, `circle length ${circle}`);
  assert.equal(samplePath('M 0 0 L 100 0', 10).length, 11);
});

test('timeline overlaps transitions', () => {
  const p = project({ preset: 'hd', fps: 24 });
  p.scene('A', { duration: 48 });
  p.scene('B', { duration: 48, transition: { type: 'fade', duration: 12 } });
  p.scene('C', { duration: '1s', transition: 'cut' });
  const tl = buildTimeline(p.doc);
  assert.deepEqual(
    tl.entries.map((e) => [e.start, e.end]),
    [
      [0, 48],
      [36, 84],
      [84, 108],
    ],
  );
  assert.equal(tl.total, 108);
  assert.equal(frameInfo(p.doc, 40).length, 2);
  assert.equal(p.duration, 108);
});

test('authoring: keys, presets, ids, info', () => {
  const p = project({ preset: 'square', fps: 30 });
  const s = p.scene('Intro', { duration: '2s' });
  const l = s.layer('Judul', { x: 100, y: 200 });
  const t = l.text('Halo', 0, 0, { size: 40 });
  l.slideIn(5, { from: 'left', distance: 100, dur: 10 });
  l.fadeOut('1.5s', 6);
  assert.equal(l.id, 'judul');
  assert.equal(t.id, 'text');
  const tr = evalTransform(l.node, 5, 30);
  assert.equal(tr.x, 0);
  assert.equal(tr.opacity, 0);
  const tr2 = evalTransform(l.node, 15, 30);
  assert.equal(tr2.x, 100);
  assert.equal(evalTransform(l.node, 60, 30).opacity, 0);
  assert.throws(() => l.key(0, { bogus: 1 }), /tidak dikenal/);
  assert.throws(() => s.layer('x', { id: 'judul' }), /sudah dipakai/);
  assert.equal(p.find('judul').id, 'judul');
  assert.equal(p.find('text').id, 'text');
  const info = p.info();
  assert.equal(info.frames, 60);
  assert.equal(info.scenes[0].layers[0].id, 'judul');
});

test('track drawing substitution and cycle', () => {
  const p = project({ preset: 'hd', fps: 24 });
  const s = p.scene('S', { duration: 24 });
  const tr = s.track('Pose');
  const a = tr.drawing('a');
  const b = tr.drawing('b');
  tr.cycle([a, b], { from: 0, to: 24, every: 4 });
  assert.equal(tr.node.drawings.length, 6);
  assert.deepEqual(tr.node.drawings.slice(0, 2).map((d) => d.id), ['a', 'b']);
  tr.range(8, 12, null);
  const ids = tr.node.drawings.map((d) => [d.f, d.id]);
  assert.deepEqual(ids.find((q) => q[0] === 8), [8, null]);
});

test('save/open round trip keeps assets relative', async () => {
  const dir = mkdtempSync(join(os.tmpdir(), 'gerak-test-'));
  const img = createCanvas(4, 4);
  img.getContext('2d').fillRect(0, 0, 4, 4);
  writeFileSync(join(dir, 'pic.png'), img.toBuffer('image/png'));
  const p = project({ preset: 'hd', root: dir });
  const s = p.scene('S', { duration: 10 });
  s.layer('L').image('pic.png', 0, 0, { width: 100 });
  const file = p.save(join(dir, 'out', 'p.gerak.json'));
  const raw = JSON.parse(readFileSync(file, 'utf8'));
  assert.equal(raw.assets.pic.path, '../pic.png');
  const q = open(file);
  assert.equal(q.doc.assets.pic.path, join(dir, 'pic.png'));
  q.find('l').edit(q.doc.scenes[0].layers[0].elements[0].id, { width: 50 });
  assert.equal(q.doc.scenes[0].layers[0].elements[0].width, 50);
  const png = await renderFrameImage(q, 0, { scale: 0.25 });
  assert.ok(png.length > 100);
});

test('rendering is deterministic', async () => {
  const build = () => {
    const p = project({ preset: 'hd', fps: 24, background: '#f4efe6' });
    p.effects({ grain: { amount: 0.1, animate: true } });
    p.boil(true);
    const s = p.scene('S', { duration: 24 });
    const l = s.layer('L');
    l.stroke([[100, 300, 0.2], [400, 200, 1], [800, 400, 0.3]], { brush: 'dry', size: 40, reveal: [0, 20] });
    l.stroke([[100, 500], [800, 520]], { brush: 'pencil', size: 8 });
    l.rect(900, 100, 200, 150, { fill: '#e8590c', sketch: true });
    l.text('Halo', 640, 600, { size: 80, align: 'center', anim: { type: 'scramble', at: 0, dur: 20 } });
    l.wiggle({ amp: 5 });
    return p;
  };
  const a = await renderFrameImage(build(), 10, { scale: 0.5 });
  const b = await renderFrameImage(build(), 10, { scale: 0.5 });
  assert.ok(a.equals(b));
});

test('stroke cache matches direct rendering', async () => {
  const p = project({ preset: 'hd', fps: 24 });
  const s = p.scene('S', { duration: 24 });
  const l = s.layer('L');
  l.stroke([[100, 300, 0.2], [400, 200, 1], [800, 400, 0.3]], { brush: 'ink', size: 30 });
  const env = await makeEnv(p.doc);
  const r1 = new Renderer(p.doc, env);
  const c1 = createCanvas(1280, 720);
  r1.renderFrame(c1.getContext('2d'), 0); // builds cache
  r1.renderFrame(c1.getContext('2d'), 1); // uses cache
  const doc2 = JSON.parse(JSON.stringify(p.doc));
  doc2.scenes[0].layers[0].elements[0].noCache = true;
  const r2 = new Renderer(doc2, env);
  const c2 = createCanvas(1280, 720);
  r2.renderFrame(c2.getContext('2d'), 1);
  const A = c1.getContext('2d').getImageData(0, 0, 1280, 720).data;
  const B = c2.getContext('2d').getImageData(0, 0, 1280, 720).data;
  let diff = 0;
  for (let i = 0; i < A.length; i++) diff = Math.max(diff, Math.abs(A[i] - B[i]));
  assert.ok(diff <= 48, `max channel diff ${diff}`);
});

test('text layout wraps and anchors', () => {
  const ctx = createCanvas(10, 10).getContext('2d');
  const el = { type: 'text', text: 'satu dua tiga empat lima enam', size: 40, maxWidth: 200, align: 'center', valign: 'middle' };
  const L = layoutText(ctx, el);
  assert.ok(L.lines.length >= 2);
  for (const l of L.lines) assert.ok(l.width <= 200 + 1);
  assert.ok(L.lines[0].x0 < 0);
  assert.ok(L.lines[0].baseline < 0 && L.lines[L.lines.length - 1].baseline > 0);
});

test('sfx synthesis and wav encoding', () => {
  const s = synth('pop');
  assert.ok(s.data.length > 1000);
  let peak = 0;
  for (const v of s.data) peak = Math.max(peak, Math.abs(v));
  assert.ok(peak <= 0.951);
  const wav = encodeWav([s.data, s.data], s.rate);
  assert.equal(String.fromCharCode(...wav.slice(0, 4)), 'RIFF');
  assert.equal(wav.length, 44 + s.data.length * 4);
});

test('scene captions helper creates timed text', () => {
  const p = project({ preset: 'reels', fps: 30 });
  const s = p.scene('S', { duration: '3s' });
  const cap = s.captions([{ text: 'satu', at: 0 }, { text: 'dua', at: '1s' }]);
  const els = cap.node.elements;
  assert.deepEqual(els[0].show, [0, 30]);
  assert.deepEqual(els[1].show, [30, 90]);
  assert.ok(cap.node.fixed);
});

test('examples build', async () => {
  const { loadProject } = await import('../src/node/load.mjs');
  for (const f of ['examples/sistem/sistem.mjs', 'examples/promo/promo.mjs', 'templates/basic.mjs', 'templates/story.mjs', 'templates/promo.mjs']) {
    if (!existsSync(f)) continue;
    const p = await loadProject(f);
    assert.ok(p.duration > 0, f);
  }
});
