// Stage: canvas layout, zoom/pan, frame rendering, selection overlay and playback.
import { S, on, invalidate, scene, entry, timeline, selNode, selElement, setFrame, emit } from './state.mjs';
import { chain, nodeLocalBounds, quad, elementBounds, apply, matScale, autoPivotTarget } from './geom.mjs';
import { evalTransform } from '/core/keys.mjs';

const stage = document.getElementById('stage');
const view = document.getElementById('view');
const overlay = document.getElementById('overlay');
const vctx = view.getContext('2d');
const octx = overlay.getContext('2d');
const audio = document.getElementById('audio');

/** View geometry: k = CSS px per doc px; left/top = doc origin in stage CSS px; rs = render scale. */
export const V = { k: 1, left: 0, top: 0, rs: 1, w: 0, h: 0, dpr: 1, handles: [], hooks: [], guides: [] };

export function layout() {
  if (!S.doc) return;
  const r = stage.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  const W = S.doc.width;
  const H = S.doc.height;
  const pad = 36;
  const fit = Math.max(0.02, Math.min((r.width - pad * 2) / W, (r.height - pad * 2) / H));
  V.fit = fit;
  V.k = fit * S.view.zoom;
  V.dpr = dpr;
  V.w = r.width;
  V.h = r.height;
  const cssW = W * V.k;
  const cssH = H * V.k;
  V.left = (r.width - cssW) / 2 + S.view.panX;
  V.top = (r.height - cssH) / 2 + S.view.panY;
  V.rs = Math.min(1, V.k * dpr);
  const pw = Math.max(1, Math.round(W * V.rs));
  const ph = Math.max(1, Math.round(H * V.rs));
  if (view.width !== pw || view.height !== ph) {
    view.width = pw;
    view.height = ph;
  }
  Object.assign(view.style, { left: `${V.left}px`, top: `${V.top}px`, width: `${cssW}px`, height: `${cssH}px` });
  const ow = Math.round(r.width * dpr);
  const oh = Math.round(r.height * dpr);
  if (overlay.width !== ow || overlay.height !== oh) {
    overlay.width = ow;
    overlay.height = oh;
  }
  overlay.style.width = `${r.width}px`;
  overlay.style.height = `${r.height}px`;
  invalidate('view', 'overlay', 'zoom');
}

/** Client (event) coordinates → stage CSS px. */
export function stagePoint(e) {
  const r = stage.getBoundingClientRect();
  return [e.clientX - r.left, e.clientY - r.top];
}

/** Stage CSS px → document px. */
export const toDoc = (sx, sy) => [(sx - V.left) / V.k, (sy - V.top) / V.k];
export const toStage = (x, y) => [V.left + x * V.k, V.top + y * V.k];
export const screenMatrix = () => new DOMMatrix([V.k, 0, 0, V.k, V.left, V.top]);

export function zoomAt(factor, sx = V.w / 2, sy = V.h / 2) {
  const z0 = S.view.zoom;
  const z1 = Math.max(0.1, Math.min(10, z0 * factor));
  if (z1 === z0) return;
  // keep the doc point under (sx, sy) fixed
  const [dx, dy] = toDoc(sx, sy);
  S.view.zoom = z1;
  layout();
  const [nx, ny] = toStage(dx, dy);
  S.view.panX += sx - nx;
  S.view.panY += sy - ny;
  layout();
}

export function zoomFit() {
  S.view.zoom = 1;
  S.view.panX = 0;
  S.view.panY = 0;
  layout();
}

export function zoomActual() {
  // 1 doc px = 1 CSS px
  zoomAt(1 / V.k);
}

// ------------------------------------------------------------ rendering

let onionCanvas = null;

function renderView() {
  if (!S.doc || !S.renderer || !S.doc.scenes.length) return;
  try {
    if (S.playing && S.playMode === 'all') S.renderer.renderFrame(vctx, S.gframe, { scale: V.rs });
    else if (S.view.onion && !S.playing) drawOnion();
    else S.renderer.renderSceneFrame(vctx, S.scene, S.lf, { scale: V.rs });
  } catch (e) {
    console.error(e);
    emit('renderError', e);
  }
}

function drawOnion() {
  const pw = view.width;
  const ph = view.height;
  if (!onionCanvas || onionCanvas.width !== pw || onionCanvas.height !== ph) onionCanvas = S.env.createCanvas(pw, ph);
  const g = onionCanvas.getContext('2d');
  const sc = scene();
  S.renderer.renderSceneFrame(vctx, S.scene, S.lf, { scale: V.rs });
  const ghost = (f, color, a) => {
    if (f < 0 || f >= sc.duration) return;
    S.renderer.renderSceneFrame(g, S.scene, f, { scale: V.rs, background: false, effects: false });
    g.save();
    g.globalCompositeOperation = 'source-atop';
    g.fillStyle = color;
    g.fillRect(0, 0, pw, ph);
    g.restore();
    vctx.save();
    vctx.globalAlpha = a;
    vctx.drawImage(onionCanvas, 0, 0);
    vctx.restore();
  };
  ghost(S.lf - 4, '#e03131', 0.16);
  ghost(S.lf - 2, '#e03131', 0.3);
  ghost(S.lf + 2, '#1c7ed6', 0.3);
  ghost(S.lf + 4, '#1c7ed6', 0.16);
}

// ------------------------------------------------------------ overlay

function poly(ctx, pts) {
  ctx.beginPath();
  pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.closePath();
}

const motionCache = { key: '', pts: [], keys: [] };

function motionPath(loc) {
  const node = loc.node;
  if (!node.keys?.x?.length && !node.keys?.y?.length) return null;
  const key = `${S.version}:${node.id}:${S.scene}`;
  if (motionCache.key !== key) {
    const sc = loc.scene;
    const pts = [];
    const step = Math.max(1, Math.floor(sc.duration / 240));
    const at = (f) => {
      const ch = chain(loc.path, f, sc, S.doc);
      const c = ch.at(-1);
      return apply(c.parent, c.t.x + c.t.pivotX, c.t.y + c.t.pivotY);
    };
    for (let f = 0; f < sc.duration; f += step) pts.push(at(f));
    const frames = new Set([...(node.keys.x || []), ...(node.keys.y || [])].map((k) => k.f));
    motionCache.key = key;
    motionCache.pts = pts;
    motionCache.keys = [...frames].filter((f) => f >= 0 && f < sc.duration).map((f) => at(f));
  }
  return motionCache;
}

function drawGuides(ctx) {
  const W = S.doc.width;
  const H = S.doc.height;
  const L = V.left;
  const T = V.top;
  const k = V.k;
  if (S.view.grid) {
    ctx.strokeStyle = 'rgba(0,183,179,0.55)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (const q of [1 / 3, 2 / 3]) {
      ctx.moveTo(Math.round(L + W * k * q) + 0.5, T);
      ctx.lineTo(Math.round(L + W * k * q) + 0.5, T + H * k);
      ctx.moveTo(L, Math.round(T + H * k * q) + 0.5);
      ctx.lineTo(L + W * k, Math.round(T + H * k * q) + 0.5);
    }
    ctx.stroke();
    ctx.strokeStyle = 'rgba(0,183,179,0.9)';
    ctx.beginPath();
    ctx.moveTo(L + (W * k) / 2 - 8, T + (H * k) / 2);
    ctx.lineTo(L + (W * k) / 2 + 8, T + (H * k) / 2);
    ctx.moveTo(L + (W * k) / 2, T + (H * k) / 2 - 8);
    ctx.lineTo(L + (W * k) / 2, T + (H * k) / 2 + 8);
    ctx.stroke();
  }
  if (S.view.safe) {
    const portrait = H / W > 1.6;
    ctx.save();
    ctx.font = '600 11px "Plus Jakarta Sans", sans-serif';
    if (portrait) {
      const zones = [
        [0, 0, W, H * 0.09, 'UI atas'],
        [0, H * 0.79, W, H * 0.21, 'caption & musik'],
        [W * 0.86, H * 0.42, W * 0.14, H * 0.37, 'tombol'],
      ];
      for (const [x, y, w, h, label] of zones) {
        ctx.fillStyle = 'rgba(255,80,80,0.16)';
        ctx.fillRect(L + x * k, T + y * k, w * k, h * k);
        ctx.fillStyle = 'rgba(255,200,200,0.95)';
        ctx.fillText(label, L + x * k + 6, T + y * k + 15);
      }
    }
    ctx.strokeStyle = 'rgba(255,140,140,0.8)';
    ctx.setLineDash([5, 4]);
    for (const q of [0.05, 0.1]) ctx.strokeRect(L + W * k * q, T + H * k * q, W * k * (1 - 2 * q), H * k * (1 - 2 * q));
    ctx.restore();
  }
}

function drawOverlay() {
  const ctx = octx;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, overlay.width, overlay.height);
  if (!S.doc) return;
  ctx.setTransform(V.dpr, 0, 0, V.dpr, 0, 0);
  const W = S.doc.width;
  const H = S.doc.height;
  // frame edge
  ctx.strokeStyle = 'rgba(255,255,255,0.18)';
  ctx.lineWidth = 1;
  ctx.strokeRect(Math.round(V.left) - 0.5, Math.round(V.top) - 0.5, Math.round(W * V.k) + 1, Math.round(H * V.k) + 1);
  drawGuides(ctx);
  V.handles = [];
  if (S.playing) return;
  const sm = screenMatrix();

  // hover outline
  if (S.hover && S.tool === 'select') {
    const { path, el } = S.hover;
    if (path.at(-1)?.id !== S.sel.node || el?.id !== S.sel.el) {
      const ch = chain(path, S.lf, scene(), S.doc);
      const b = elementBounds(el, S.env);
      if (b) {
        ctx.strokeStyle = 'rgba(0,183,179,0.75)';
        ctx.lineWidth = 1;
        poly(ctx, quad(b, sm.multiply(ch.at(-1).world)));
        ctx.stroke();
      }
    }
  }

  const loc = selNode();
  if (loc && loc.sceneIdx === S.scene) {
    const ch = chain(loc.path, S.lf, loc.scene, S.doc);
    const c = ch.at(-1);
    const wm = sm.multiply(c.world);
    // motion path
    const mp = motionPath(loc);
    if (mp && mp.pts.length > 1) {
      ctx.save();
      ctx.strokeStyle = 'rgba(255,212,59,0.7)';
      ctx.setLineDash([3, 4]);
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      mp.pts.forEach(([x, y], i) => {
        const [sx, sy] = apply(sm, x, y);
        if (i) ctx.lineTo(sx, sy);
        else ctx.moveTo(sx, sy);
      });
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = '#ffd43b';
      for (const [x, y] of mp.keys) {
        const [sx, sy] = apply(sm, x, y);
        ctx.beginPath();
        ctx.moveTo(sx, sy - 5);
        ctx.lineTo(sx + 5, sy);
        ctx.lineTo(sx, sy + 5);
        ctx.lineTo(sx - 5, sy);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    }
    const b = nodeLocalBounds(loc.node, S.lf, S.doc, S.env);
    if (b) {
      const q = quad(b, wm);
      ctx.strokeStyle = '#00B7B3';
      ctx.lineWidth = 1.5;
      poly(ctx, q);
      ctx.stroke();
      const sel = selElement();
      if (S.sel.el && sel) {
        const eb = elementBounds(sel.el, S.env);
        if (eb) {
          ctx.save();
          ctx.setLineDash([4, 3]);
          ctx.strokeStyle = '#ffffff';
          poly(ctx, quad(eb, wm));
          ctx.stroke();
          ctx.restore();
        }
      }
      if (!S.sel.el && S.tool === 'select') {
        // pivot (rotation & scale centre); where it will be auto-centred, show that point
        const ap = autoPivotTarget(loc.node, S.lf, S.doc, S.env);
        const [px, py] = ap ? apply(wm, ap[0], ap[1]) : apply(sm.multiply(c.parent), c.t.x + c.t.pivotX, c.t.y + c.t.pivotY);
        V.pivot = [px, py];
        // scale handles
        for (const [hx, hy] of q) {
          V.handles.push({ type: 'scale', x: hx, y: hy });
          ctx.fillStyle = '#ffffff';
          ctx.strokeStyle = '#00B7B3';
          ctx.lineWidth = 1.5;
          ctx.fillRect(hx - 4.5, hy - 4.5, 9, 9);
          ctx.strokeRect(hx - 4.5, hy - 4.5, 9, 9);
        }
        // rotation knob above the top edge
        const tm = [(q[0][0] + q[1][0]) / 2, (q[0][1] + q[1][1]) / 2];
        const bm = [(q[3][0] + q[2][0]) / 2, (q[3][1] + q[2][1]) / 2];
        let ux = tm[0] - bm[0];
        let uy = tm[1] - bm[1];
        const ul = Math.hypot(ux, uy) || 1;
        ux /= ul;
        uy /= ul;
        const rk = [tm[0] + ux * 26, tm[1] + uy * 26];
        ctx.beginPath();
        ctx.moveTo(tm[0], tm[1]);
        ctx.lineTo(rk[0], rk[1]);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(rk[0], rk[1], 5.5, 0, Math.PI * 2);
        ctx.fillStyle = '#00B7B3';
        ctx.fill();
        V.handles.push({ type: 'rotate', x: rk[0], y: rk[1] });
        // pivot marker
        ctx.beginPath();
        ctx.arc(px, py, 4, 0, Math.PI * 2);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(px - 8, py);
        ctx.lineTo(px + 8, py);
        ctx.moveTo(px, py - 8);
        ctx.lineTo(px, py + 8);
        ctx.strokeStyle = 'rgba(255,255,255,0.7)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }
  }

  // snapping guides
  if (V.guides.length) {
    ctx.save();
    ctx.strokeStyle = '#ff6bcb';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (const g of V.guides) {
      if (g.x !== undefined) {
        const [sx] = toStage(g.x, 0);
        ctx.moveTo(Math.round(sx) + 0.5, V.top);
        ctx.lineTo(Math.round(sx) + 0.5, V.top + H * V.k);
      } else {
        const [, sy] = toStage(0, g.y);
        ctx.moveTo(V.left, Math.round(sy) + 0.5);
        ctx.lineTo(V.left + W * V.k, Math.round(sy) + 0.5);
      }
    }
    ctx.stroke();
    ctx.restore();
  }

  for (const hook of V.hooks) {
    ctx.save();
    try {
      hook(ctx, sm);
    } finally {
      ctx.restore();
    }
  }
}

/** Screen scale of a node (for brush size previews). */
export function nodeScreenScale(loc) {
  if (!loc) return V.k;
  const ch = chain(loc.path, S.lf, loc.scene, S.doc);
  return matScale(ch.at(-1).world) * V.k;
}

// ------------------------------------------------------------ playback

S.gframe = 0;
let acc = 0;
let lastTs = 0;

function sceneAtGlobal(g) {
  const tl = timeline();
  let idx = 0;
  tl.entries.forEach((e, i) => {
    if (g >= e.start && g < e.end) idx = i;
  });
  return idx;
}

function audioTime() {
  return (S.playMode === 'all' ? S.gframe : (entry()?.start ?? 0) + S.lf) / S.doc.fps;
}

function syncAudio(force = false) {
  if (!S.sound || !S.mixUrl || !S.playing) return;
  if (!audio.src.endsWith(S.mixUrl)) audio.src = S.mixUrl;
  const t = audioTime();
  if (force || Math.abs(audio.currentTime - t) > 0.2) {
    try {
      audio.currentTime = t;
    } catch {
      /* not ready */
    }
  }
  if (audio.paused) audio.play().catch(() => {});
}

/** Play a short range of the current scene (used to preview a preset), then stop at `to` or jump `back`. */
export function playRange(from, to, back = null) {
  if (!S.doc || S.playing) return;
  S.range = { to, back, mode: S.playMode };
  S.playMode = 'scene';
  S.lf = from;
  play(true);
}

export function play(on = !S.playing) {
  if (!S.doc) return;
  if (!on && S.range) {
    const r = S.range;
    S.range = null;
    S.playMode = r.mode;
    if (r.back !== null && r.back !== undefined) S.lf = r.back;
  }
  S.playing = on;
  if (on) {
    const sc = scene();
    if (S.playMode === 'all') {
      S.gframe = (entry()?.start ?? 0) + S.lf;
      if (S.gframe >= timeline().total - 1) S.gframe = 0;
    } else if (S.lf >= sc.duration - 1) S.lf = 0;
    acc = 0;
    lastTs = performance.now();
    syncAudio(true);
  } else {
    audio.pause();
    emit('stopped');
  }
  emit('play', on);
  invalidate('view', 'overlay', 'timeline', 'values', 'transport', 'scenes', 'inspector');
}

export function setMix(url) {
  S.mixUrl = url;
  if (!url) {
    audio.pause();
    audio.removeAttribute('src');
  } else if (S.playing) syncAudio(true);
}

function tick(ts) {
  if (S.playing && S.doc) {
    const fps = S.doc.fps;
    const dt = Math.min(0.25, (ts - lastTs) / 1000);
    acc += dt * fps;
    const whole = Math.floor(acc);
    if (whole > 0) {
      acc -= whole;
      if (S.playMode === 'all') {
        const total = timeline().total;
        let g = S.gframe + whole;
        if (g >= total) {
          if (S.loop) {
            g %= total;
            syncAudio(true);
          } else {
            g = total - 1;
            S.gframe = g;
            play(false);
          }
        }
        S.gframe = g;
        const idx = sceneAtGlobal(g);
        if (idx !== S.scene) {
          S.scene = idx;
          invalidate('scenes', 'timeline');
          emit('sceneChange');
        }
        S.lf = g - timeline().entries[idx].start;
      } else {
        const dur = scene().duration;
        let lf = S.lf + whole;
        if (S.range && lf >= S.range.to) {
          S.lf = S.range.to;
          play(false);
          lastTs = ts;
          requestAnimationFrame(tick);
          return;
        }
        if (lf >= dur) {
          if (S.loop) {
            lf %= dur;
            syncAudio(true);
          } else {
            lf = dur - 1;
            S.lf = lf;
            play(false);
          }
        }
        S.lf = lf;
      }
      syncAudio();
      invalidate('view', 'overlay', 'timeline', 'values', 'transport');
    }
  }
  lastTs = ts;
  requestAnimationFrame(tick);
}

on('refresh', (f) => {
  if (f.has('view')) renderView();
  if (f.has('overlay') || f.has('view')) drawOverlay();
});

new ResizeObserver(() => layout()).observe(stage);
window.addEventListener('resize', layout);
on('doc', () => layout());
on('previewRange', ({ from, to, back }) => playRange(from, to, back));
requestAnimationFrame(tick);

export { stage, view, overlay, evalTransform, setFrame };
