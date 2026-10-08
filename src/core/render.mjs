// Frame renderer. Draws a Gerak document onto any Canvas2D context (Node or browser).
import { evalTransform, evalCamera, evalDrawing } from './keys.mjs';
import { resolveEase } from './easing.mjs';
import { drawStroke } from './brush.mjs';
import { drawText } from './text.mjs';
import { shapeCommands, tracePath, flattenPath, polyLength, pathBounds, pathToString, samplePath } from './path.mjs';
import { makePaint, applyShadow } from './paint.mjs';
import { clamp, DEG, smoothstep } from './util.mjs';
import { rng } from './rng.mjs';
import { wobble } from './geom.mjs';

// ------------------------------------------------------------ timeline

const tlCache = new WeakMap();

/**
 * Scene placement on the global timeline. A transition into scene i overlaps
 * the last `duration` frames of scene i-1 with the first frames of scene i.
 */
export function buildTimeline(doc) {
  const hit = tlCache.get(doc);
  if (hit && hit.sig === doc.scenes.length) return hit;
  const entries = [];
  let cursor = 0;
  let prevDur = 0;
  doc.scenes.forEach((s, i) => {
    const dur = Math.max(1, Math.round(s.duration ?? 1));
    let tr = null;
    if (i > 0 && s.transition && s.transition.type && s.transition.type !== 'cut') {
      const d = Math.round(Math.min(s.transition.duration ?? 0, dur, prevDur));
      if (d > 0) tr = { ...s.transition, duration: d };
    }
    const start = tr ? cursor - tr.duration : cursor;
    entries.push({ scene: s, index: i, start, end: start + dur, duration: dur, transition: tr });
    cursor = start + dur;
    prevDur = dur;
  });
  const tl = { entries, total: cursor, sig: doc.scenes.length };
  tlCache.set(doc, tl);
  return tl;
}

export function totalFrames(doc) {
  return buildTimeline(doc).total;
}

/** Which scene(s) are on screen at global frame f. */
export function frameInfo(doc, f) {
  const tl = buildTimeline(doc);
  const active = tl.entries.filter((e) => f >= e.start && f < e.end);
  return active.map((e) => ({ sceneId: e.scene.id, index: e.index, local: f - e.start, start: e.start, end: e.end }));
}

// ------------------------------------------------------------ renderer

export class Renderer {
  /**
   * env: { createCanvas(w,h), Path2D, images: Map<assetId, image>, fontEpoch }
   */
  constructor(doc, env) {
    this.doc = doc;
    this.env = env;
    this.pool = [];
    this.poolUsed = 0;
    this.pathCache = new WeakMap();
    this.sketchCache = new WeakMap();
    this.grainTile = null;
  }

  get timeline() {
    return buildTimeline(this.doc);
  }

  get total() {
    return this.timeline.total;
  }

  _acquire(w, h) {
    let c = this.pool[this.poolUsed];
    if (!c || c.width !== w || c.height !== h) {
      c = this.env.createCanvas(w, h);
      this.pool[this.poolUsed] = c;
    }
    this.poolUsed++;
    const x = c.getContext('2d');
    x.setTransform(1, 0, 0, 1, 0, 0);
    x.globalAlpha = 1;
    x.globalCompositeOperation = 'source-over';
    x.filter = 'none';
    x.clearRect(0, 0, w, h);
    return c;
  }

  _release() {
    this.poolUsed--;
  }

  /**
   * Render global frame f into ctx. The context's canvas should be width*scale x height*scale.
   * opts: { scale=1, background=true, effects=true }
   */
  renderFrame(ctx, f, opts = {}) {
    const doc = this.doc;
    const scale = opts.scale ?? 1;
    const W = doc.width;
    const H = doc.height;
    const pw = Math.round(W * scale);
    const ph = Math.round(H * scale);
    this.pw = pw;
    this.ph = ph;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    ctx.clearRect(0, 0, pw, ph);
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    const tl = this.timeline;
    const active = tl.entries.filter((e) => f >= e.start && f < e.end);
    if (active.length === 0) {
      if (opts.background !== false) this._background(ctx, doc.background ?? '#ffffff');
    } else if (active.length === 1 || !active[active.length - 1].transition) {
      const e = active[active.length - 1];
      this._scene(ctx, e.scene, f - e.start, opts);
    } else {
      const A = active[active.length - 2];
      const B = active[active.length - 1];
      this._transition(ctx, A, B, f, opts, pw, ph, scale);
    }
    if (opts.effects !== false) this._effects(ctx, f, W, H, opts.background === false);
    ctx.restore();
  }

  /** Render one scene at a local frame (no transitions). */
  renderSceneFrame(ctx, sceneIndex, lf, opts = {}) {
    const scale = opts.scale ?? 1;
    const scene = this.doc.scenes[sceneIndex];
    this.pw = Math.round(this.doc.width * scale);
    this.ph = Math.round(this.doc.height * scale);
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, Math.round(this.doc.width * scale), Math.round(this.doc.height * scale));
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    this._scene(ctx, scene, lf, opts);
    if (opts.effects !== false) this._effects(ctx, this.timeline.entries[sceneIndex].start + lf, this.doc.width, this.doc.height, opts.background === false);
    ctx.restore();
  }

  _background(ctx, bg) {
    const W = this.doc.width;
    const H = this.doc.height;
    if (!bg || bg === 'transparent') return;
    ctx.save();
    ctx.fillStyle = makePaint(ctx, bg, { x: 0, y: 0, width: W, height: H });
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }

  _scene(ctx, scene, lf, opts) {
    const doc = this.doc;
    if (opts.background !== false) this._background(ctx, scene.background ?? doc.background ?? '#ffffff');
    const cam = evalCamera(scene.camera, lf, doc.fps);
    const rc = { cam, fps: doc.fps, W: doc.width, H: doc.height, root: true, scene };
    for (const node of scene.layers || []) this._node(ctx, node, lf, rc);
  }

  _transition(ctx, A, B, f, opts, pw, ph, scale) {
    const tr = B.transition;
    const W = this.doc.width;
    const H = this.doc.height;
    const raw = clamp((f - B.start) / tr.duration, 0, 1);
    const t = resolveEase(tr.ease ?? 'in-out-cubic')(raw);
    const la = f - A.start;
    const lb = f - B.start;
    const type = tr.type;
    const drawA = (c) => this._scene(c, A.scene, la, opts);
    const drawB = (c) => this._scene(c, B.scene, lb, opts);
    const offscreen = (draw) => {
      const cv = this._acquire(pw, ph);
      const x = cv.getContext('2d');
      x.setTransform(scale, 0, 0, scale, 0, 0);
      draw(x);
      return cv;
    };
    const blit = (cv, alpha = 1, filter) => {
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalAlpha = alpha;
      if (filter) ctx.filter = filter;
      ctx.drawImage(cv, 0, 0);
      ctx.restore();
    };
    switch (type) {
      case 'fade':
      case 'dissolve':
      case 'crossfade': {
        drawA(ctx);
        const b = offscreen(drawB);
        blit(b, t);
        this._release();
        break;
      }
      case 'dip':
      case 'fade-black':
      case 'fade-white': {
        const color = tr.color ?? (type === 'fade-white' ? '#ffffff' : '#000000');
        if (raw < 0.5) drawA(ctx);
        else drawB(ctx);
        const k = raw < 0.5 ? raw * 2 : (1 - raw) * 2;
        ctx.save();
        ctx.globalAlpha = resolveEase('in-out-sine')(k);
        ctx.fillStyle = color;
        ctx.fillRect(0, 0, W, H);
        ctx.restore();
        break;
      }
      case 'flash': {
        if (raw < 0.5) drawA(ctx);
        else drawB(ctx);
        const k = 1 - Math.abs(raw - 0.5) * 2;
        ctx.save();
        ctx.globalAlpha = k * k;
        ctx.fillStyle = tr.color ?? '#ffffff';
        ctx.fillRect(0, 0, W, H);
        ctx.restore();
        break;
      }
      case 'wipe-left':
      case 'wipe-right':
      case 'wipe-up':
      case 'wipe-down': {
        drawA(ctx);
        ctx.save();
        ctx.beginPath();
        if (type === 'wipe-left') ctx.rect(W * (1 - t), 0, W * t + 1, H);
        else if (type === 'wipe-right') ctx.rect(0, 0, W * t, H);
        else if (type === 'wipe-up') ctx.rect(0, H * (1 - t), W, H * t + 1);
        else ctx.rect(0, 0, W, H * t);
        ctx.clip();
        drawB(ctx);
        ctx.restore();
        break;
      }
      case 'slide-left':
      case 'slide-right':
      case 'slide-up':
      case 'slide-down':
      case 'push-left':
      case 'push-right':
      case 'push-up':
      case 'push-down': {
        const dir = type.split('-')[1];
        const dx = dir === 'left' ? -W : dir === 'right' ? W : 0;
        const dy = dir === 'up' ? -H : dir === 'down' ? H : 0;
        ctx.save();
        ctx.translate(dx * t, dy * t);
        drawA(ctx);
        ctx.restore();
        ctx.save();
        ctx.translate(-dx * (1 - t), -dy * (1 - t));
        drawB(ctx);
        ctx.restore();
        break;
      }
      case 'cover-left':
      case 'cover-right':
      case 'cover-up':
      case 'cover-down': {
        const dir = type.split('-')[1];
        const dx = dir === 'left' ? -W : dir === 'right' ? W : 0;
        const dy = dir === 'up' ? -H : dir === 'down' ? H : 0;
        drawA(ctx);
        ctx.save();
        ctx.translate(-dx * (1 - t), -dy * (1 - t));
        ctx.save();
        ctx.shadowColor = 'rgba(0,0,0,0.25)';
        ctx.shadowBlur = 40 * scale;
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, W, H);
        ctx.restore();
        ctx.beginPath();
        ctx.rect(0, 0, W, H);
        ctx.clip();
        drawB(ctx);
        ctx.restore();
        break;
      }
      case 'iris':
      case 'circle': {
        drawA(ctx);
        const [cx, cy] = tr.at ?? [W / 2, H / 2];
        const R = Math.hypot(Math.max(cx, W - cx), Math.max(cy, H - cy));
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, Math.max(0.01, R * t), 0, Math.PI * 2);
        ctx.clip();
        drawB(ctx);
        ctx.restore();
        break;
      }
      case 'zoom': {
        const a = offscreen(drawA);
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        const za = 1 + t * 0.35;
        ctx.translate(pw / 2, ph / 2);
        ctx.scale(za, za);
        ctx.translate(-pw / 2, -ph / 2);
        ctx.globalAlpha = 1;
        ctx.drawImage(a, 0, 0);
        ctx.restore();
        this._release();
        const b = offscreen(drawB);
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        const zb = 0.75 + 0.25 * t;
        ctx.translate(pw / 2, ph / 2);
        ctx.scale(zb, zb);
        ctx.translate(-pw / 2, -ph / 2);
        ctx.globalAlpha = t;
        ctx.drawImage(b, 0, 0);
        ctx.restore();
        this._release();
        break;
      }
      case 'blur': {
        const amt = (tr.amount ?? 24) * scale;
        const a = offscreen(drawA);
        blit(a, 1, `blur(${(amt * Math.min(1, t * 2)).toFixed(2)}px)`);
        this._release();
        const b = offscreen(drawB);
        blit(b, t, `blur(${(amt * Math.min(1, (1 - t) * 2)).toFixed(2)}px)`);
        this._release();
        break;
      }
      default:
        drawB(ctx);
    }
  }

  _effects(ctx, f, W, H, transparent = false) {
    const doc = this.doc;
    const fx = doc.effects;
    if (!fx) return;
    if (fx.vignette && !transparent) {
      const v = typeof fx.vignette === 'number' ? { amount: fx.vignette } : fx.vignette;
      ctx.save();
      const g = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * (v.inner ?? 0.35), W / 2, H / 2, Math.hypot(W, H) / 2);
      g.addColorStop(0, 'rgba(0,0,0,0)');
      g.addColorStop(1, `rgba(0,0,0,${v.amount ?? 0.35})`);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
    }
    if (fx.grain) {
      const gr = typeof fx.grain === 'number' ? { amount: fx.grain } : fx.grain;
      const variant = gr.animate ? Math.floor(f / (gr.every ?? 2)) % 4 : 0;
      const frameGrain = this._grainFrame(this.pw ?? W, this.ph ?? H, variant);
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalAlpha = gr.amount ?? 0.08;
      // on transparent renders keep grain on the artwork only
      ctx.globalCompositeOperation = transparent ? 'source-atop' : gr.blend ?? 'multiply';
      ctx.drawImage(frameGrain, 0, 0);
      ctx.restore();
    }
  }

  /** Full-frame grain built from the tile with drawImage (pattern fills are slow in some backends). */
  _grainFrame(pw, ph, variant) {
    const key = `${pw}x${ph}:${variant}`;
    this.grainFrames ||= new Map();
    let cv = this.grainFrames.get(key);
    if (cv) return cv;
    const tile = this._grain();
    cv = this.env.createCanvas(pw, ph);
    const x = cv.getContext('2d');
    const R = rng(`grain-offset:${variant}`);
    const ox = -Math.floor(R() * 256);
    const oy = -Math.floor(R() * 256);
    for (let yy = oy; yy < ph; yy += 256) for (let xx = ox; xx < pw; xx += 256) x.drawImage(tile, xx, yy);
    this.grainFrames.set(key, cv);
    return cv;
  }

  _grain() {
    if (this.grainTile) return this.grainTile;
    const S = 256;
    const cv = this.env.createCanvas(S, S);
    const x = cv.getContext('2d');
    const img = x.createImageData(S, S);
    const R = rng('paper-grain');
    // fine noise + soft fibres
    const field = new Float32Array(S * S);
    for (let i = 0; i < S * S; i++) field[i] = R();
    for (let i = 0; i < 90; i++) {
      let px = R() * S;
      let py = R() * S;
      let a = R() * Math.PI * 2;
      for (let j = 0; j < 40; j++) {
        a += (R() - 0.5) * 0.4;
        px = (px + Math.cos(a) + S) % S;
        py = (py + Math.sin(a) + S) % S;
        field[(py | 0) * S + (px | 0)] *= 0.55;
      }
    }
    for (let i = 0; i < S * S; i++) {
      const v = Math.round(150 + field[i] * 105);
      img.data[i * 4] = v;
      img.data[i * 4 + 1] = v;
      img.data[i * 4 + 2] = v;
      img.data[i * 4 + 3] = 255;
    }
    x.putImageData(img, 0, 0);
    this.grainTile = cv;
    return cv;
  }

  // ------------------------------------------------------------ nodes

  _node(ctx, node, lf, rc) {
    if (node.visible === false) return;
    if (node.exposure && (lf < node.exposure[0] || lf >= node.exposure[1])) return;
    const t = evalTransform(node, lf, rc.fps);
    if (t.opacity <= 0.0005) return;
    ctx.save();
    if (rc.root && !node.fixed) applyCamera(ctx, rc.cam, t.depth, rc.W, rc.H);
    ctx.translate(t.x, t.y);
    const px = t.pivotX;
    const py = t.pivotY;
    if (px || py) ctx.translate(px, py);
    if (t.rotation) ctx.rotate(t.rotation * DEG);
    if (t.skewX || t.skewY) ctx.transform(1, Math.tan(t.skewY * DEG), Math.tan(t.skewX * DEG), 1, 0, 0);
    const sx = t.scale * t.scaleX;
    const sy = t.scale * t.scaleY;
    if (sx !== 1 || sy !== 1) ctx.scale(sx, sy);
    if (px || py) ctx.translate(-px, -py);
    if (node.clip) {
      ctx.beginPath();
      if (node.clip.d) ctx.clip(this._path2d({ shape: 'path', d: node.clip.d }));
      else if (node.clip.rect) {
        const [x, y, w, h] = node.clip.rect;
        ctx.rect(x, y, w, h);
        ctx.clip();
      }
    }
    if (node.wipe) applyWipe(ctx, node.wipe, lf, rc);
    const childRc = { ...rc, root: false };
    const blurPx = t.blur > 0.01 ? t.blur : 0;
    const isolate = node.isolate || blurPx || node.filter || node.mask || node.hasErase;
    if (isolate) {
      const m = ctx.getTransform();
      const k = Math.hypot(m.a, m.b) || 1;
      const parentAlpha = ctx.globalAlpha;
      const cv = this._acquire(this.pw, this.ph);
      const o = cv.getContext('2d');
      o.setTransform(m);
      this._content(o, node, lf, childRc);
      if (node.mask) {
        const maskNode = (node.children || []).find((c) => c.id === node.mask);
        if (maskNode) {
          // Render the mask into its own buffer with normal compositing, then apply it with drawImage.
          // (Filling a transformed Path2D directly with 'destination-in' is unreliable in some
          // canvas backends: the path can be culled using its untransformed bounds.)
          const mc = this._acquire(this.pw, this.ph);
          const mx = mc.getContext('2d');
          mx.setTransform(m);
          this._node(mx, { ...maskNode, visible: true }, lf, childRc);
          o.save();
          o.setTransform(1, 0, 0, 1, 0, 0);
          o.globalAlpha = 1;
          o.globalCompositeOperation = node.maskInvert ? 'destination-out' : 'destination-in';
          o.drawImage(mc, 0, 0);
          o.restore();
          this._release();
        }
      }
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalAlpha = parentAlpha * t.opacity;
      if (node.blend) ctx.globalCompositeOperation = node.blend;
      const filters = [];
      if (blurPx) filters.push(`blur(${(blurPx * k).toFixed(2)}px)`);
      if (node.filter) filters.push(node.filter);
      if (filters.length) ctx.filter = filters.join(' ');
      if (node.shadow) applyShadow(ctx, { ...node.shadow, blur: (node.shadow.blur ?? 12) * k, x: (node.shadow.x ?? 0) * k, y: (node.shadow.y ?? 4) * k });
      ctx.drawImage(cv, 0, 0);
      this._release();
    } else {
      ctx.globalAlpha *= t.opacity;
      if (node.blend) ctx.globalCompositeOperation = node.blend;
      if (node.shadow) applyShadow(ctx, node.shadow);
      this._content(ctx, node, lf, childRc);
    }
    ctx.restore();
  }

  _content(ctx, node, lf, rc) {
    if (node.elements) for (const el of node.elements) this._element(ctx, el, lf, rc);
    const kids = node.children;
    if (!kids || !kids.length) return;
    if (node.type === 'track' && node.drawings && node.drawings.length) {
      const active = evalDrawing(node.drawings, lf);
      if (!active) return;
      const child = kids.find((c) => c.id === active);
      if (child) this._node(ctx, { ...child, visible: true }, lf, rc);
      return;
    }
    for (const c of kids) {
      if (c.id === node.mask) continue;
      this._node(ctx, c, lf, rc);
    }
  }

  // ------------------------------------------------------------ elements

  _element(ctx, el, lf, rc) {
    if (el.hidden) return;
    if (el.show && (lf < el.show[0] || lf >= (el.show[1] ?? Infinity))) return;
    const env = this.env;
    ctx.save();
    if (el.opacity !== undefined) ctx.globalAlpha *= el.opacity;
    if (el.blend) ctx.globalCompositeOperation = el.blend;
    switch (el.type) {
      case 'shape':
        this._shape(ctx, el, lf, rc);
        break;
      case 'stroke': {
        const p = el.reveal ? revealProgress(el.reveal, lf) : 1;
        if (el.shadow) applyShadow(ctx, el.shadow);
        drawStroke(ctx, env, this._boil(el, lf), p);
        break;
      }
      case 'text':
        drawText(ctx, env, el, lf, rc.fps);
        break;
      case 'image':
        this._image(ctx, el, lf);
        break;
      default:
        break;
    }
    ctx.restore();
  }

  /** Line boil: hand-drawn marks re-drawn with a new wobble every few frames. */
  _boilSpec(el) {
    const b = el.boil ?? this.doc.boil;
    if (!b || el.boil === false) return null;
    return b === true ? { every: 4, variants: 3, amount: 1 } : { every: 4, variants: 3, amount: 1, ...b };
  }

  _boil(el, lf) {
    const b = this._boilSpec(el);
    if (!b) return el;
    const v = Math.floor(Math.max(0, lf) / Math.max(1, b.every)) % Math.max(1, b.variants);
    if (v === 0) return el;
    this.boilCache ||= new WeakMap();
    let arr = this.boilCache.get(el);
    if (!arr) {
      arr = [];
      this.boilCache.set(el, arr);
    }
    if (!arr[v]) {
      // jitter the control points slightly and re-seed the wobble
      const R = rng(`${el.seed ?? 0}:boil:${v}`);
      const amt = b.amount * Math.max(0.6, Math.min(3, (el.size ?? 8) * 0.08));
      const out = { ...el, seed: `${el.seed ?? 0}~${v}` };
      if (el.points) out.points = el.points.map((q) => [q[0] + (R() - 0.5) * 2 * amt, q[1] + (R() - 0.5) * 2 * amt, q[2]]);
      arr[v] = out;
    }
    return arr[v];
  }

  _path2d(el) {
    let p = this.pathCache.get(el);
    if (!p) {
      const cmds = shapeCommands(el);
      p = { path: tracePath(new this.env.Path2D(), cmds), cmds, bounds: null, polys: null, length: null };
      this.pathCache.set(el, p);
    }
    return p.path;
  }

  _pathInfo(el) {
    this._path2d(el);
    const p = this.pathCache.get(el);
    if (!p.bounds) {
      p.polys = flattenPath(p.cmds, 1);
      p.length = p.polys.reduce((s, q) => s + polyLength(q.pts), 0);
      p.bounds = pathBounds(pathToString(p.cmds));
    }
    return p;
  }

  _shape(ctx, el, lf, rc) {
    const prog = el.draw ? revealProgress(el.draw, lf) : 1;
    if (prog <= 0 && el.draw) return;
    if (el.sketch) return this._sketch(ctx, el, lf, prog);
    const path = this._path2d(el);
    const info = this._pathInfo(el);
    if (el.fill) {
      const fa = prog >= 1 ? 1 : el.draw?.fill === 'instant' ? 1 : smoothstep(0.55, 1, prog);
      if (fa > 0) {
        ctx.save();
        ctx.globalAlpha *= fa;
        if (el.shadow) applyShadow(ctx, el.shadow);
        ctx.fillStyle = makePaint(ctx, el.fill, info.bounds);
        ctx.fill(path, el.fillRule ?? 'nonzero');
        ctx.restore();
      }
    }
    if (el.stroke && (el.strokeWidth ?? 2) > 0) {
      ctx.save();
      if (el.shadow && !el.fill) applyShadow(ctx, el.shadow);
      ctx.strokeStyle = makePaint(ctx, el.stroke, info.bounds);
      ctx.lineWidth = el.strokeWidth ?? 2;
      ctx.lineCap = el.lineCap ?? 'round';
      ctx.lineJoin = el.lineJoin ?? 'round';
      if (el.dash) ctx.setLineDash(el.dash);
      if (prog >= 1) ctx.stroke(path);
      else {
        // draw-on: trace flattened polylines up to the revealed length
        let remain = info.length * prog;
        ctx.beginPath();
        for (const poly of info.polys) {
          if (remain <= 0) break;
          const pts = poly.pts;
          ctx.moveTo(pts[0], pts[1]);
          for (let i = 2; i < pts.length; i += 2) {
            const seg = Math.hypot(pts[i] - pts[i - 2], pts[i + 1] - pts[i - 1]);
            if (seg >= remain) {
              const k = remain / seg;
              ctx.lineTo(pts[i - 2] + (pts[i] - pts[i - 2]) * k, pts[i - 1] + (pts[i + 1] - pts[i - 1]) * k);
              remain = 0;
              break;
            }
            ctx.lineTo(pts[i], pts[i + 1]);
            remain -= seg;
          }
        }
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  /** Hand-drawn rendering of a shape using the brush engine (rough.js-like). */
  _sketch(ctx, el, lf, prog) {
    const bs = this._boilSpec(el);
    const variant = bs ? Math.floor(Math.max(0, lf) / Math.max(1, bs.every)) % Math.max(1, bs.variants) : 0;
    let byVariant = this.sketchCache.get(el);
    if (!byVariant) {
      byVariant = [];
      this.sketchCache.set(el, byVariant);
    }
    let c = byVariant[variant];
    const sk0 = el.sketch === true ? {} : el.sketch;
    const sk = variant ? { ...sk0, seed: `${sk0.seed ?? 7}~${variant}` } : sk0;
    if (!c) {
      const cmds = shapeCommands(el);
      const d = pathToString(cmds);
      const info = this._pathInfo(el);
      const R = rng(`${sk.seed ?? 7}:sketch`);
      const rough = sk.roughness ?? 1;
      const size = sk.size ?? el.strokeWidth ?? 3;
      const passes = sk.passes ?? 2;
      const strokes = [];
      const polys = flattenPath(cmds, 3);
      for (let pass = 0; pass < passes; pass++) {
        for (let pi = 0; pi < polys.length; pi++) {
          const poly = polys[pi];
          const sub = pathToString(poly.pts.reduce((acc, v, i) => (i % 2 ? acc : acc.concat([[i === 0 ? 'M' : 'L', v, poly.pts[i + 1]]])), []));
          let pts = samplePath(sub, 5).map((q) => ({ x: q.x, y: q.y, p: 0.8 + R() * 0.2 }));
          const sh = { x: (R() - 0.5) * 2 * rough * 1.5, y: (R() - 0.5) * 2 * rough * 1.5 };
          pts = wobble(pts, rough * (1.2 + pass * 0.6), { seed: `${sk.seed ?? 7}:${pass}:${pi}`, freq: 0.012 });
          pts = pts.map((q) => ({ ...q, x: q.x + sh.x, y: q.y + sh.y }));
          // overshoot / undershoot ends for a loose feel
          if (poly.closed && pts.length > 4) {
            const extra = Math.max(1, Math.floor(pts.length * 0.04 * R()));
            pts = pts.concat(pts.slice(1, 1 + extra));
          }
          strokes.push({ type: 'stroke', points: pts, brush: sk.brush ?? 'pen', size: size * (pass === 0 ? 1 : 0.7), color: sk.color ?? el.stroke ?? '#1a1a1a', seed: `${sk.seed ?? 7}:${pass}:${pi}`, smooth: false });
        }
      }
      const hatch = [];
      if (el.fill && (sk.fill ?? 'hachure') === 'hachure' && info.bounds.width > 0) {
        const gap = sk.gap ?? Math.max(6, size * 3);
        const ang = ((sk.angle ?? -41) * Math.PI) / 180;
        const b = info.bounds;
        const cx = b.x + b.width / 2;
        const cy = b.y + b.height / 2;
        const rad = Math.hypot(b.width, b.height) / 2 + gap;
        const dx = Math.cos(ang);
        const dy = Math.sin(ang);
        for (let o = -rad; o <= rad; o += gap) {
          const ox = cx - dy * o;
          const oy = cy + dx * o;
          const p0 = { x: ox - dx * rad, y: oy - dy * rad, p: 0.8 };
          const p1 = { x: ox + dx * rad, y: oy + dy * rad, p: 0.8 };
          hatch.push({ type: 'stroke', points: wobble([p0, { x: (p0.x + p1.x) / 2, y: (p0.y + p1.y) / 2, p: 0.9 }, p1], rough * 1.2, { seed: `h${o}`, freq: 0.01 }), brush: sk.hatchBrush ?? 'pen', size: (sk.hatchSize ?? size * 0.6), color: typeof el.fill === 'string' ? el.fill : '#888', seed: `h${o}` });
        }
      }
      c = { strokes, hatch, d };
      byVariant[variant] = c;
    }
    const path = this._path2d(el);
    if (el.fill) {
      const fa = prog >= 1 ? 1 : smoothstep(0.5, 1, prog);
      if ((sk.fill ?? 'hachure') === 'solid' && fa > 0) {
        ctx.save();
        ctx.globalAlpha *= fa;
        ctx.translate(sk.offset?.[0] ?? 2, sk.offset?.[1] ?? 2);
        ctx.fillStyle = makePaint(ctx, el.fill, this._pathInfo(el).bounds);
        ctx.fill(path);
        ctx.restore();
      } else if (c.hatch.length && fa > 0) {
        ctx.save();
        ctx.clip(path);
        const n = c.hatch.length;
        c.hatch.forEach((h, i) => {
          const hp = clamp(fa * n - i, 0, 1);
          if (hp > 0) drawStroke(ctx, this.env, h, hp);
        });
        ctx.restore();
      }
    }
    const n = c.strokes.length;
    c.strokes.forEach((s, i) => {
      // passes draw one after another during the reveal
      const sp = clamp(prog * n - i, 0, 1);
      if (sp > 0) drawStroke(ctx, this.env, s, prog >= 1 ? 1 : sp);
    });
  }

  _image(ctx, el) {
    const img = this.env.images?.get(el.src);
    const x = el.x ?? 0;
    const y = el.y ?? 0;
    const iw = img ? img.width || img.naturalWidth : 400;
    const ih = img ? img.height || img.naturalHeight : 300;
    let w = el.width;
    let h = el.height;
    if (w === undefined && h === undefined) {
      w = iw;
      h = ih;
    } else if (w === undefined) w = (h * iw) / ih;
    else if (h === undefined) h = (w * ih) / iw;
    let dx = x;
    let dy = y;
    if (el.anchor === 'center') {
      dx -= w / 2;
      dy -= h / 2;
    }
    ctx.save();
    if (el.shadow) {
      ctx.save();
      applyShadow(ctx, el.shadow);
      ctx.fillStyle = '#000';
      roundRectPath(ctx, dx, dy, w, h, el.radius ?? 0);
      ctx.fill();
      ctx.restore();
    }
    if (el.radius) {
      roundRectPath(ctx, dx, dy, w, h, el.radius);
      ctx.clip();
    }
    if (!img) {
      ctx.fillStyle = '#d9d4c7';
      ctx.fillRect(dx, dy, w, h);
      ctx.strokeStyle = '#8a8475';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(dx, dy);
      ctx.lineTo(dx + w, dy + h);
      ctx.moveTo(dx + w, dy);
      ctx.lineTo(dx, dy + h);
      ctx.stroke();
    } else {
      const fit = el.fit ?? 'cover';
      let sx = 0;
      let sy = 0;
      let sw = iw;
      let sh = ih;
      let ddx = dx;
      let ddy = dy;
      let dw = w;
      let dh = h;
      if (fit === 'cover') {
        const s = Math.max(w / iw, h / ih);
        sw = w / s;
        sh = h / s;
        const [fx, fy] = el.focus ?? [0.5, 0.5];
        sx = (iw - sw) * fx;
        sy = (ih - sh) * fy;
      } else if (fit === 'contain') {
        const s = Math.min(w / iw, h / ih);
        dw = iw * s;
        dh = ih * s;
        ddx = dx + (w - dw) / 2;
        ddy = dy + (h - dh) / 2;
      }
      ctx.drawImage(img, sx, sy, sw, sh, ddx, ddy, dw, dh);
    }
    ctx.restore();
    if (el.stroke) {
      ctx.save();
      ctx.strokeStyle = el.stroke;
      ctx.lineWidth = el.strokeWidth ?? 4;
      roundRectPath(ctx, dx, dy, w, h, el.radius ?? 0);
      ctx.stroke();
      ctx.restore();
    }
  }
}

function roundRectPath(ctx, x, y, w, h, r) {
  r = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export function revealProgress(r, lf) {
  const at = r.at ?? 0;
  const dur = r.dur ?? 12;
  if (dur <= 0) return lf >= at ? 1 : 0;
  return resolveEase(r.ease ?? 'linear')(clamp((lf - at) / dur, 0, 1));
}

export function applyCamera(ctx, cam, depth, W, H) {
  const d = depth > 0 ? depth : 1;
  const z = Math.pow(cam.zoom, 1 / d);
  ctx.translate(W / 2, H / 2);
  if (cam.rotation) ctx.rotate(-cam.rotation * DEG);
  if (z !== 1) ctx.scale(z, z);
  ctx.translate(-W / 2 - cam.x / d, -H / 2 - cam.y / d);
}

function applyWipe(ctx, w, lf, rc) {
  const p = revealProgress({ at: w.at ?? 0, dur: w.dur ?? 12, ease: w.ease ?? 'in-out-cubic' }, lf);
  const [x, y, ww, hh] = w.rect ?? [0, 0, rc.W, rc.H];
  const dir = w.dir ?? 'right';
  const out = w.out === true;
  const q = out ? 1 - p : p;
  ctx.beginPath();
  if (dir === 'right') ctx.rect(x, y, ww * q, hh);
  else if (dir === 'left') ctx.rect(x + ww * (1 - q), y, ww * q, hh);
  else if (dir === 'down') ctx.rect(x, y, ww, hh * q);
  else if (dir === 'up') ctx.rect(x, y + hh * (1 - q), ww, hh * q);
  else if (dir === 'center') ctx.rect(x + (ww * (1 - q)) / 2, y + (hh * (1 - q)) / 2, ww * q, hh * q);
  ctx.clip();
}
