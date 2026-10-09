// Bottom panel: transport, scene strip, layer rows with keyframes, exposure bars and audio clips.
import {
  S, on, emit, invalidate, scene, entry, timeline, select, setFrame, goScene, edit, live, commit, begin, end,
  nodeKeyFrames, locate,
} from './state.mjs';
import { play } from './view.mjs';
import { h, iconBtn, esc, fmtClock, dragSession, toast } from './ui.mjs';
import { icon } from './icons.mjs';

const ROW = 26;
const PAD = 12;

const transport = document.getElementById('transport');
const strip = document.getElementById('strip');
const ruler = document.getElementById('ruler');
const labels = document.getElementById('tlLabels');
const tracks = document.getElementById('tlTracks');
const scroller = document.getElementById('tlScroll');
const corner = document.getElementById('tlCorner');

let rows = [];
let ppf = 1;
let TW = 100;
const X = (f) => PAD + f * ppf;
const F = (x) => (x - PAD) / ppf;

// ------------------------------------------------------------ transport

let tcEl;
let durEl;
let frEl;
let playBtn;
let modeBtns;
let loopBtn;
let soundBtn;
let akBtn;

function buildTransport() {
  transport.innerHTML = '';
  playBtn = h('button.ib.play', { title: 'Putar / jeda (Spasi)', html: icon('play', 18), onclick: () => play() });
  tcEl = h('span.tc');
  durEl = h('span.tcd');
  frEl = h('span.fr');
  const mode = h('div.seg.small', {});
  modeBtns = [['scene', 'Scene ini'], ['all', 'Semua']].map(([v, l]) => {
    const b = h('button', { type: 'button', title: v === 'scene' ? 'Putar scene ini saja' : 'Putar seluruh video (dengan transisi)' }, l);
    b.onclick = () => {
      if (S.playing) play(false);
      S.playMode = v;
      invalidate('transport');
    };
    mode.append(b);
    return [v, b];
  });
  loopBtn = iconBtn('loop', 'Ulang (loop)', () => {
    S.loop = !S.loop;
    invalidate('transport');
  });
  soundBtn = iconBtn('sound', 'Suara saat diputar', () => {
    S.sound = !S.sound;
    if (!S.sound) document.getElementById('audio').pause();
    emit('soundToggle');
    invalidate('transport');
  });
  akBtn = h('button.btn.small.ghost.autokey', {
    title: 'Auto-key: setiap perubahan posisi/skala/putar langsung jadi keyframe di playhead',
    html: `${icon('record', 14)}<span>Auto-key</span>`,
    onclick: () => {
      S.autokey = !S.autokey;
      invalidate('transport');
    },
  });
  transport.append(
    h('div.tgroup', {},
      iconBtn('start', 'Ke awal (Home)', () => setFrame(0)),
      iconBtn('prev', 'Mundur 1 frame (,)', () => setFrame(S.lf - 1)),
      playBtn,
      iconBtn('next', 'Maju 1 frame (.)', () => setFrame(S.lf + 1)),
      iconBtn('end', 'Ke akhir (End)', () => setFrame(scene().duration - 1))),
    h('div.tgroup.time', {}, tcEl, durEl, frEl),
    h('div.tgroup', {}, mode, loopBtn, soundBtn),
    h('div.spacer'),
    h('div.tgroup', {}, akBtn),
  );
}

function syncTransport() {
  if (!S.doc || !playBtn) return;
  const fps = S.doc.fps;
  const sc = scene();
  if (!sc) return;
  playBtn.innerHTML = icon(S.playing ? 'pause' : 'play', 18);
  if (S.playing && S.playMode === 'all') {
    tcEl.textContent = fmtClock(S.gframe / fps);
    durEl.textContent = ` / ${fmtClock(timeline().total / fps)}`;
    frEl.textContent = `video · f ${S.gframe}`;
  } else {
    tcEl.textContent = fmtClock(S.lf / fps);
    durEl.textContent = ` / ${fmtClock(sc.duration / fps)}`;
    frEl.textContent = `scene ${S.scene + 1} · f ${S.lf}`;
  }
  for (const [v, b] of modeBtns) b.classList.toggle('on', S.playMode === v);
  loopBtn.classList.toggle('on', S.loop);
  soundBtn.classList.toggle('on', S.sound);
  soundBtn.innerHTML = icon(S.sound ? 'sound' : 'mute');
  akBtn.classList.toggle('on', S.autokey);
}

// ------------------------------------------------------------ scene strip

function buildStrip() {
  strip.innerHTML = '';
  if (!S.doc) return;
  const tl = timeline();
  const fps = S.doc.fps;
  const total = S.doc.scenes.reduce((s, q) => s + q.duration, 0);
  const inner = h('div.sinner');
  tl.entries.forEach((e, i) => {
    const sc = e.scene;
    const b = h(`div.sblock${i === S.scene ? '.on' : ''}`, { style: { flexGrow: String(sc.duration), flexBasis: '0' }, title: `${sc.name} · ${(sc.duration / fps).toFixed(2)} d${e.transition ? ` · transisi ${e.transition.type}` : ''}` });
    if (e.transition) b.append(h('span.str', { title: `Transisi: ${e.transition.type}` }, '⇢'));
    b.append(h('span.sname', {}, `${i + 1}. ${sc.name}`), h('span.sdur', {}, `${(sc.duration / fps).toFixed(1)}d`));
    const grip = h('div.sgrip', { title: 'Tarik untuk mengubah durasi scene' });
    b.append(grip);
    b.addEventListener('click', (ev) => {
      if (ev.target === grip) return;
      if (i !== S.scene) goScene(i);
    });
    grip.addEventListener('pointerdown', (ev) => {
      ev.stopPropagation();
      ev.preventDefault();
      blurField();
      const pxPerFrame = inner.getBoundingClientRect().width / total;
      const x0 = ev.clientX;
      const d0 = sc.duration;
      let moved = false;
      dragSession(ev, {
        move: (m) => {
          const d = Math.max(1, d0 + Math.round((m.clientX - x0) / pxPerFrame));
          if (d !== sc.duration) {
            moved = true;
            live(() => {
              sc.duration = d;
              if (i === S.scene && S.lf >= d) S.lf = d - 1;
            }, ['view', 'overlay', 'timeline', 'values']);
            b.querySelector('.sdur').textContent = `${(d / fps).toFixed(1)}d`;
          }
        },
        end: () => (moved ? commit() : end()),
      });
    });
    inner.append(b);
  });
  strip.append(inner, iconBtn('plus', 'Tambah scene', () => emit('cmd', 'addScene'), 'addscene'));
}

// ------------------------------------------------------------ rows

function buildRows(sc) {
  const out = [];
  if (sc.camera && (Object.keys(sc.camera.keys || {}).length || sc.camera.behaviors?.length)) out.push({ kind: 'camera' });
  const visit = (nodes, depth, parent) => {
    for (let i = nodes.length - 1; i >= 0; i--) {
      const n = nodes[i];
      const isMask = parent && parent.mask === n.id;
      out.push({ kind: 'node', node: n, depth, parent, isMask });
      if (n.children?.length && !S.collapsed.has(n.id)) visit(n.children, depth + 1, n);
    }
  };
  visit(sc.layers, 0, null);
  out.push({ kind: 'audio' });
  return out;
}

function sceneClips(sc) {
  const e = entry();
  const out = [];
  for (const c of S.doc.audio || []) {
    if (c.scene === sc.id) out.push({ clip: c, f: c.at ?? 0 });
    else if (!c.scene && e) out.push({ clip: c, f: (c.at ?? 0) - e.start });
  }
  return out;
}

function clipFrames(c) {
  const fps = S.doc.fps;
  if (c.sfx) return Math.round(fps * (typeof c.sfx.dur === 'number' ? c.sfx.dur : 0.45));
  if (c.duration) return Math.round(c.duration * fps);
  if (c.trim && c.trim[1] != null) return Math.round((c.trim[1] - c.trim[0]) * fps);
  return Math.round(timeline().total);
}

let labelSig = '';

function buildLabels() {
  const sig = JSON.stringify([S.scene, S.sel.node, S.sel.clip, [...S.locked], [...S.collapsed], rows.map((r) => (r.kind === 'node' ? [r.node.id, r.node.name, r.node.visible, r.depth] : r.kind)), (S.doc.audio || []).length]);
  if (sig === labelSig) return;
  labelSig = sig;
  labels.innerHTML = '';
  for (const r of rows) {
    if (r.kind === 'camera') {
      labels.append(h('div.tlrow.special', {}, h('span.ty', { html: icon('camera', 14) }), h('span.nm', {}, 'Kamera')));
      continue;
    }
    if (r.kind === 'audio') {
      const n = sceneClips(scene()).length;
      labels.append(h(`div.tlrow.special${S.sel.clip ? '.sel' : ''}`, {}, h('span.ty', { html: icon('music', 14) }), h('span.nm', {}, `Suara${n ? ` (${n})` : ''}`)));
      continue;
    }
    const n = r.node;
    const off = n.visible === false;
    const lockOn = S.locked.has(n.id);
    const row = h(`div.tlrow${S.sel.node === n.id ? '.sel' : ''}${off ? '.off' : ''}`, { style: { paddingLeft: `${4 + r.depth * 14}px` }, draggable: 'true', dataset: { id: n.id } });
    const tw = n.children?.length
      ? h('button.tw', { html: icon(S.collapsed.has(n.id) ? 'chevron' : 'chevronDown', 12), onclick: (e) => {
          e.stopPropagation();
          if (S.collapsed.has(n.id)) S.collapsed.delete(n.id);
          else S.collapsed.add(n.id);
          invalidate('timeline');
        } })
      : h('span.twsp');
    const nm = h('span.nm', { title: `${n.name} (${n.id})` }, n.name ?? n.id);
    nm.addEventListener('dblclick', (e) => {
      e.stopPropagation();
      const input = h('input.text.rename', { type: 'text', value: n.name ?? '' });
      nm.replaceWith(input);
      input.focus();
      input.select();
      const done = (ok) => {
        if (ok && input.value.trim() && input.value !== n.name) edit(() => (n.name = input.value.trim()), ['timeline', 'inspector', 'tools']);
        else invalidate('timeline');
        labelSig = '';
      };
      input.addEventListener('keydown', (ev) => {
        if (ev.key === 'Enter') input.blur();
        if (ev.key === 'Escape') {
          input.removeEventListener('blur', onBlur);
          done(false);
        }
      });
      const onBlur = () => done(true);
      input.addEventListener('blur', onBlur);
    });
    const eye = h('button.mini', { title: off ? 'Tampilkan' : 'Sembunyikan (tidak ikut render)', html: icon(off ? 'eyeOff' : 'eye', 14), onclick: (e) => {
      e.stopPropagation();
      edit(() => (off ? delete n.visible : (n.visible = false)), ['view', 'overlay', 'timeline', 'scenes']);
    } });
    const lk = h(`button.mini${lockOn ? '.on' : ''}`, { title: lockOn ? 'Buka kunci' : 'Kunci (tidak bisa dipilih di kanvas)', html: icon(lockOn ? 'lock' : 'unlock', 13), onclick: (e) => {
      e.stopPropagation();
      if (lockOn) S.locked.delete(n.id);
      else S.locked.add(n.id);
      if (S.locked.has(n.id) && S.sel.node === n.id) select({});
      invalidate('timeline', 'overlay');
    } });
    const ty = h('span.ty', { html: icon(r.isMask ? 'target' : n.type === 'group' ? 'group' : n.type === 'track' ? 'track' : 'layer', 13), title: r.isMask ? 'Cetakan mask' : n.type });
    row.append(tw, ty, nm, eye, lk);
    row.addEventListener('click', () => select({ node: n.id }));
    // drag to reorder (same parent list)
    row.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('text/gerak-node', n.id);
      e.dataTransfer.effectAllowed = 'move';
    });
    row.addEventListener('dragover', (e) => {
      if (![...e.dataTransfer.types].includes('text/gerak-node')) return;
      e.preventDefault();
      const rr = row.getBoundingClientRect();
      row.classList.toggle('dropabove', e.clientY < rr.top + rr.height / 2);
      row.classList.toggle('dropbelow', e.clientY >= rr.top + rr.height / 2);
    });
    row.addEventListener('dragleave', () => row.classList.remove('dropabove', 'dropbelow'));
    row.addEventListener('drop', (e) => {
      e.preventDefault();
      const above = row.classList.contains('dropabove');
      row.classList.remove('dropabove', 'dropbelow');
      const id = e.dataTransfer.getData('text/gerak-node');
      if (!id || id === n.id) return;
      const src = locate(id);
      const dst = locate(n.id);
      if (!src || !dst || src.sceneIdx !== dst.sceneIdx) return;
      if (src.parent !== dst.parent) {
        toast('Urutan hanya bisa diubah di dalam grup yang sama', 'err');
        return;
      }
      edit(() => {
        src.list.splice(src.list.indexOf(src.node), 1);
        const i = dst.list.indexOf(dst.node);
        // list is shown front-first: "above" = in front = later in the array
        dst.list.splice(above ? i + 1 : i, 0, src.node);
      });
    });
    labels.append(row);
  }
}

// ------------------------------------------------------------ drawing

function sizeCanvas(c, w, hgt) {
  const dpr = window.devicePixelRatio || 1;
  const pw = Math.max(1, Math.round(w * dpr));
  const ph = Math.max(1, Math.round(hgt * dpr));
  if (c.width !== pw || c.height !== ph) {
    c.width = pw;
    c.height = ph;
  }
  c.style.width = `${w}px`;
  c.style.height = `${hgt}px`;
  const ctx = c.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return ctx;
}

function roundRect(ctx, x, y, w, hh, r) {
  r = Math.max(0, Math.min(r, w / 2, hh / 2));
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + hh, r);
  ctx.arcTo(x + w, y + hh, x, y + hh, r);
  ctx.arcTo(x, y + hh, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function diamond(ctx, x, y, r) {
  ctx.beginPath();
  ctx.moveTo(x, y - r);
  ctx.lineTo(x + r, y);
  ctx.lineTo(x, y + r);
  ctx.lineTo(x - r, y);
  ctx.closePath();
}

const TYPE_COLOR = { layer: '#00B7B3', group: '#5c7cfa', track: '#b197fc' };

function drawRuler() {
  const sc = scene();
  const ctx = sizeCanvas(ruler, TW, 22);
  ctx.clearRect(0, 0, TW, 22);
  const fps = S.doc.fps;
  const dur = sc.duration;
  ctx.fillStyle = '#8a909c';
  ctx.font = '600 10px "Plus Jakarta Sans", sans-serif';
  const pxPerSec = ppf * fps;
  const stepSec = pxPerSec > 120 ? 0.5 : pxPerSec > 50 ? 1 : pxPerSec > 20 ? 2 : 5;
  const minor = ppf >= 7 ? 1 : ppf >= 2 ? 5 : fps;
  for (let f = 0; f <= dur; f += minor) {
    ctx.fillRect(Math.round(X(f)), 17, 1, 5);
  }
  for (let s = 0; s * fps <= dur + 0.001; s += stepSec) {
    const x = Math.round(X(s * fps));
    ctx.fillRect(x, 10, 1, 12);
    ctx.fillText(`${+s.toFixed(1)}d`, x + 3, 10);
  }
  // playhead
  const px = X(S.lf);
  ctx.fillStyle = '#ff6b6b';
  ctx.beginPath();
  ctx.moveTo(px - 6, 12);
  ctx.lineTo(px + 6, 12);
  ctx.lineTo(px, 22);
  ctx.closePath();
  ctx.fill();
}

function drawTracks() {
  const sc = scene();
  const fps = S.doc.fps;
  const dur = sc.duration;
  const H = Math.max(rows.length * ROW, scroller.clientHeight - 2);
  const ctx = sizeCanvas(tracks, TW, H);
  ctx.clearRect(0, 0, TW, H);
  // end of scene shading
  rows.forEach((r, i) => {
    const y = i * ROW;
    const sel = (r.kind === 'node' && r.node.id === S.sel.node) || (r.kind === 'audio' && S.sel.clip);
    ctx.fillStyle = sel ? '#22304f' : i % 2 ? '#1a1d24' : '#1d2028';
    ctx.fillRect(0, y, TW, ROW);
    if (r.kind === 'node') {
      const n = r.node;
      const f0 = Math.max(0, n.exposure?.[0] ?? 0);
      const f1 = Math.min(dur, n.exposure?.[1] ?? dur);
      if (f1 > f0) {
        const col = r.isMask ? '#ff922b' : TYPE_COLOR[n.type] ?? '#00B7B3';
        ctx.globalAlpha = n.visible === false ? 0.18 : sel ? 0.55 : 0.36;
        ctx.fillStyle = col;
        roundRect(ctx, X(f0), y + 5, Math.max(3, X(f1) - X(f0)), ROW - 10, 4);
        ctx.fill();
        ctx.globalAlpha = 1;
        if (n.exposure) {
          ctx.fillStyle = col;
          if (n.exposure[0] > 0) ctx.fillRect(X(f0), y + 5, 3, ROW - 10);
          if (n.exposure[1] < dur) ctx.fillRect(X(f1) - 3, y + 5, 3, ROW - 10);
        }
      }
      // element timings (reveal / draw / text anim / show)
      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      for (const el of n.elements || []) {
        const t = el.reveal ?? el.draw;
        if (t) ctx.fillRect(X(t.at ?? 0), y + ROW - 7, Math.max(2, (t.dur ?? 12) * ppf), 2);
        if (el.anim && el.anim.at !== undefined) {
          const ax = X(el.anim.at);
          ctx.beginPath();
          ctx.moveTo(ax, y + 5);
          ctx.lineTo(ax + 5, y + 5);
          ctx.lineTo(ax, y + 10);
          ctx.closePath();
          ctx.fill();
        }
      }
      if (n.behaviors?.length) {
        ctx.strokeStyle = 'rgba(255,212,59,0.8)';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        const bx = X(f0) + 4;
        for (let k = 0; k <= 12; k++) {
          const xx = bx + k;
          const yy = y + ROW / 2 + Math.sin(k * 0.9) * 3;
          if (k) ctx.lineTo(xx, yy);
          else ctx.moveTo(xx, yy);
        }
        ctx.stroke();
      }
      if (n.wipe) {
        ctx.fillStyle = 'rgba(116,192,252,0.8)';
        ctx.fillRect(X(n.wipe.at ?? 0), y + 4, Math.max(2, (n.wipe.dur ?? 12) * ppf), 2);
      }
      // keyframes
      for (const f of nodeKeyFrames(n)) {
        const isSel = S.keySel && S.keySel.node === n.id && S.keySel.f === f;
        const k0 = Object.values(n.keys).flat().find((q) => q.f === f);
        ctx.fillStyle = isSel ? '#ffd43b' : '#e9ecf2';
        ctx.strokeStyle = '#11131a';
        ctx.lineWidth = 1;
        if (k0?.e === 'hold') {
          ctx.beginPath();
          ctx.rect(X(f) - 4, y + ROW / 2 - 4, 8, 8);
        } else diamond(ctx, X(f), y + ROW / 2, 5.5);
        ctx.fill();
        ctx.stroke();
      }
    } else if (r.kind === 'camera') {
      const frames = new Set(Object.values(sc.camera.keys || {}).flat().map((k) => k.f));
      for (const f of frames) {
        const isSel = S.keySel?.camera && S.keySel.f === f;
        ctx.fillStyle = isSel ? '#ffd43b' : '#c5f6fa';
        diamond(ctx, X(f), y + ROW / 2, 5.5);
        ctx.fill();
      }
      for (const b of sc.camera.behaviors || []) {
        const a = Math.max(0, b.from ?? 0);
        const z = Math.min(dur, b.to ?? dur);
        ctx.fillStyle = 'rgba(255,212,59,0.35)';
        ctx.fillRect(X(a), y + ROW - 7, X(z) - X(a), 3);
      }
    } else if (r.kind === 'audio') {
      ctx.font = '600 10px "Plus Jakarta Sans", sans-serif';
      for (const { clip, f } of sceneClips(sc)) {
        const w = Math.max(10, clipFrames(clip) * ppf);
        const x = X(f);
        if (x > TW || x + w < 0) continue;
        const isSel = S.sel.clip === clip.id;
        ctx.fillStyle = clip.sfx ? (isSel ? '#ffd43b' : 'rgba(255,200,87,0.75)') : isSel ? '#63e6be' : 'rgba(0,183,179,0.55)';
        roundRect(ctx, x, y + 4, w, ROW - 8, 3);
        ctx.fill();
        ctx.save();
        ctx.beginPath();
        ctx.rect(x, y, w, ROW);
        ctx.clip();
        ctx.fillStyle = '#10131a';
        ctx.fillText(clip.sfx ? clip.sfx.type : clip.src.split('/').pop(), x + 4, y + ROW / 2 + 3.5);
        ctx.restore();
      }
    }
  });
  // scene end
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.fillRect(X(dur), 0, TW - X(dur), H);
  // incoming transition zone
  const e = entry();
  if (e?.transition) {
    ctx.fillStyle = 'rgba(0,183,179,0.08)';
    ctx.fillRect(X(0), 0, e.transition.duration * ppf, H);
  }
  // playhead
  ctx.fillStyle = '#ff6b6b';
  ctx.fillRect(Math.round(X(S.lf)) - 1, 0, 2, H);
  void fps;
}

function render() {
  if (!S.doc || !scene()) return;
  const sc = scene();
  rows = buildRows(sc);
  TW = Math.max(100, tracks.parentElement.clientWidth - labels.offsetWidth - 1);
  ppf = (TW - PAD * 2) / Math.max(1, sc.duration);
  corner.textContent = `${sc.layers.length} layer`;
  buildLabels();
  drawRuler();
  drawTracks();
}

// ------------------------------------------------------------ track interaction

function moveKeys(keys, from, to) {
  for (const arr of Object.values(keys || {})) {
    const k = arr.find((q) => q.f === from);
    if (!k) continue;
    const clash = arr.findIndex((q) => q.f === to && q !== k);
    if (clash >= 0) arr.splice(clash, 1);
    k.f = to;
    arr.sort((a, b) => a.f - b.f);
  }
}

function shiftTiming(node, df) {
  const sh = (v) => v + df;
  for (const arr of Object.values(node.keys || {})) for (const k of arr) k.f = sh(k.f);
  if (node.exposure) node.exposure = [sh(node.exposure[0]), node.exposure[1] >= 1e8 ? node.exposure[1] : sh(node.exposure[1])];
  for (const b of node.behaviors || []) {
    if (Number.isFinite(b.from)) b.from = sh(b.from);
    if (Number.isFinite(b.to)) b.to = sh(b.to);
  }
  if (node.wipe) node.wipe.at = sh(node.wipe.at ?? 0);
  for (const d of node.drawings || []) d.f = sh(d.f);
  node.elements = (node.elements || []).map((el) => {
    const e = { ...el };
    for (const k of ['reveal', 'draw', 'anim', 'exit']) if (e[k]) e[k] = { ...e[k], at: sh(e[k].at ?? 0) };
    if (e.anim?.times) e.anim.times = e.anim.times.map(sh);
    if (e.highlight) e.highlight = (Array.isArray(e.highlight) ? e.highlight : [e.highlight]).map((q) => ({ ...q, at: sh(q.at ?? 0) }));
    if (e.show) e.show = [sh(e.show[0]), e.show[1] >= 1e8 ? e.show[1] : sh(e.show[1])];
    return e;
  });
  if (!node.elements.length && node.type !== 'layer') delete node.elements;
  for (const c of node.children || []) shiftTiming(c, df);
  return node;
}

function replaceNodeContents(node, fresh) {
  for (const k of Object.keys(node)) delete node[k];
  Object.assign(node, fresh);
}

let D = null;

function localXY(e) {
  const r = tracks.getBoundingClientRect();
  return [e.clientX - r.left, e.clientY - r.top];
}

function blurField() {
  const a = document.activeElement;
  if (a && a !== document.body && /INPUT|TEXTAREA|SELECT/.test(a.tagName)) a.blur();
  end();
}

tracks.addEventListener('pointerdown', (e) => {
  if (!S.doc || e.button !== 0) return;
  if (S.playing) play(false);
  blurField();
  const [x, y] = localXY(e);
  const sc = scene();
  const dur = sc.duration;
  const f = Math.max(0, Math.min(dur - 1, Math.round(F(x))));
  const row = rows[Math.floor(y / ROW)];
  tracks.setPointerCapture(e.pointerId);
  const base = { x0: x, moved: false, f };
  if (!row) {
    D = { ...base, kind: 'scrub' };
    setFrame(f);
    return;
  }
  if (row.kind === 'node') {
    const n = row.node;
    const kf = nodeKeyFrames(n).find((k) => Math.abs(X(k) - x) <= 6);
    if (kf !== undefined) {
      if (S.sel.node !== n.id) select({ node: n.id });
      S.keySel = { node: n.id, f: kf };
      invalidate('timeline', 'inspector');
      D = { ...base, kind: 'key', node: n, f0: kf, orig: JSON.stringify(n.keys) };
      return;
    }
    const f0 = Math.max(0, n.exposure?.[0] ?? 0);
    const f1 = Math.min(dur, n.exposure?.[1] ?? dur);
    if (Math.abs(x - X(f0)) <= 5 && (n.exposure || f0 === 0)) {
      D = { ...base, kind: 'exp0', node: n, e0: n.exposure ? [...n.exposure] : [0, 1e9] };
      if (S.sel.node !== n.id) select({ node: n.id });
      return;
    }
    if (Math.abs(x - X(f1)) <= 5) {
      D = { ...base, kind: 'exp1', node: n, e0: n.exposure ? [...n.exposure] : [0, 1e9] };
      if (S.sel.node !== n.id) select({ node: n.id });
      return;
    }
    if (S.sel.node !== n.id) select({ node: n.id });
    if (x >= X(f0) && x <= X(f1) && (n.exposure || nodeKeyFrames(n).length || (n.elements || []).some((q) => q.reveal || q.draw || q.anim))) {
      D = { ...base, kind: 'shift', node: n, orig: JSON.stringify(n) };
      return;
    }
    D = { ...base, kind: 'scrub' };
    setFrame(f);
    return;
  }
  if (row.kind === 'camera') {
    const frames = [...new Set(Object.values(sc.camera?.keys || {}).flat().map((k) => k.f))];
    const kf = frames.find((k) => Math.abs(X(k) - x) <= 6);
    if (kf !== undefined) {
      S.keySel = { camera: true, f: kf };
      D = { ...base, kind: 'camkey', f0: kf, orig: JSON.stringify(sc.camera.keys) };
      invalidate('timeline');
      return;
    }
    D = { ...base, kind: 'scrub' };
    setFrame(f);
    return;
  }
  if (row.kind === 'audio') {
    const hitClip = sceneClips(sc).reverse().find(({ clip, f: cf }) => x >= X(cf) - 2 && x <= X(cf) + Math.max(10, clipFrames(clip) * ppf));
    if (hitClip) {
      select({ clip: hitClip.clip.id });
      D = { ...base, kind: 'clip', clip: hitClip.clip, at0: hitClip.clip.at ?? 0 };
      return;
    }
    D = { ...base, kind: 'scrub' };
    setFrame(f);
  }
});

tracks.addEventListener('pointermove', (e) => {
  const [x, y] = localXY(e);
  if (!D) {
    // cursor feedback
    const row = rows[Math.floor(y / ROW)];
    let cur = '';
    if (row?.kind === 'node') {
      const n = row.node;
      const dur = scene().duration;
      if (nodeKeyFrames(n).some((k) => Math.abs(X(k) - x) <= 6)) cur = 'grab';
      else if (Math.abs(x - X(Math.max(0, n.exposure?.[0] ?? 0))) <= 5 || Math.abs(x - X(Math.min(dur, n.exposure?.[1] ?? dur))) <= 5) cur = 'ew-resize';
    } else if (row?.kind === 'audio' && sceneClips(scene()).some(({ clip, f }) => x >= X(f) && x <= X(f) + Math.max(10, clipFrames(clip) * ppf))) cur = 'grab';
    tracks.style.cursor = cur;
    return;
  }
  const df = Math.round((x - D.x0) / ppf);
  if (!D.moved && Math.abs(x - D.x0) < 3) return;
  const dur = scene().duration;
  if (D.kind !== 'scrub' && !D.moved) begin();
  D.moved = true;
  switch (D.kind) {
    case 'scrub':
      setFrame(Math.max(0, Math.min(dur - 1, Math.round(F(x)))));
      break;
    case 'key': {
      const to = Math.max(0, D.f0 + df);
      live(() => {
        D.node.keys = JSON.parse(D.orig);
        moveKeys(D.node.keys, D.f0, to);
        S.keySel = { node: D.node.id, f: to };
      }, ['view', 'overlay', 'timeline', 'values']);
      break;
    }
    case 'camkey': {
      const sc = scene();
      const to = Math.max(0, D.f0 + df);
      live(() => {
        sc.camera.keys = JSON.parse(D.orig);
        moveKeys(sc.camera.keys, D.f0, to);
        S.keySel = { camera: true, f: to };
      }, ['view', 'overlay', 'timeline', 'values']);
      break;
    }
    case 'exp0':
      live(() => {
        const end = D.e0[1];
        D.node.exposure = [Math.max(0, Math.min((end >= 1e8 ? dur : end) - 1, D.e0[0] + df)), end];
      }, ['view', 'overlay', 'timeline', 'values']);
      break;
    case 'exp1':
      live(() => {
        const endF = Math.max(D.e0[0] + 1, Math.min(dur, (D.e0[1] >= 1e8 ? dur : D.e0[1]) + df));
        D.node.exposure = [D.e0[0], endF >= dur ? 1e9 : endF];
      }, ['view', 'overlay', 'timeline', 'values']);
      break;
    case 'shift':
      live(() => replaceNodeContents(D.node, shiftTiming(JSON.parse(D.orig), df)), ['view', 'overlay', 'timeline', 'values']);
      break;
    case 'clip':
      live(() => (D.clip.at = Math.max(D.clip.scene ? -9999 : 0, D.at0 + df)), ['timeline', 'values']);
      break;
    default:
      break;
  }
});

function endDrag(e) {
  if (!D) return;
  const d = D;
  D = null;
  try {
    tracks.releasePointerCapture(e.pointerId);
  } catch {
    /* ignore */
  }
  if (d.kind === 'scrub') return;
  if (d.moved) {
    if (d.kind === 'exp0' && d.node.exposure && d.node.exposure[0] <= 0 && d.node.exposure[1] >= 1e8) delete d.node.exposure;
    if (d.kind === 'exp1' && d.node.exposure && d.node.exposure[0] <= 0 && d.node.exposure[1] >= 1e8) delete d.node.exposure;
    commit(['view', 'overlay', 'timeline', 'inspector', 'sound']);
  } else if (d.kind === 'key' || d.kind === 'camkey') setFrame(d.f0);
  else setFrame(d.f);
}
tracks.addEventListener('pointerup', endDrag);
tracks.addEventListener('pointercancel', endDrag);
tracks.addEventListener('lostpointercapture', endDrag);
tracks.addEventListener('dblclick', (e) => {
  // double-click a row to open its keyframe/ease panel; on empty audio row: nothing
  const [, y] = localXY(e);
  const row = rows[Math.floor(y / ROW)];
  if (row?.kind === 'node') select({ node: row.node.id });
});

// ruler scrub
ruler.addEventListener('pointerdown', (e) => {
  if (!S.doc) return;
  if (S.playing) play(false);
  blurField();
  const seek = (ev) => {
    const r = ruler.getBoundingClientRect();
    setFrame(Math.round(F(ev.clientX - r.left)));
  };
  seek(e);
  dragSession(e, { move: seek });
});

// panel resize
const resizer = document.getElementById('resizer');
resizer.addEventListener('pointerdown', (e) => {
  e.preventDefault();
  const y0 = e.clientY;
  const h0 = document.getElementById('bottom').getBoundingClientRect().height;
  dragSession(e, {
    move: (ev) => {
      const hgt = Math.max(150, Math.min(window.innerHeight * 0.7, h0 - (ev.clientY - y0)));
      document.documentElement.style.setProperty('--tlh', `${hgt}px`);
    },
    end: () => {
      try {
        localStorage.setItem('gerak.tlh', document.documentElement.style.getPropertyValue('--tlh'));
      } catch {
        /* ignore */
      }
      invalidate('timeline');
    },
  });
});
try {
  const saved = localStorage.getItem('gerak.tlh');
  if (saved) document.documentElement.style.setProperty('--tlh', saved);
} catch {
  /* ignore */
}

on('refresh', (f) => {
  if (f.has('transport') || f.has('timeline') || f.has('values')) syncTransport();
  if (f.has('timeline') || f.has('scenes')) {
    if (f.has('scenes') || f.has('inspector')) buildStrip();
    render();
  }
});
on('doc', () => {
  labelSig = '';
  buildStrip();
});
on('sceneChange', () => {
  labelSig = '';
  buildStrip();
});
new ResizeObserver(() => invalidate('timeline')).observe(scroller);

export function initTimeline() {
  buildTransport();
  syncTransport();
}

export { shiftTiming, esc };
