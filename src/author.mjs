// Authoring API: build and revise Gerak documents from code.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, resolve, relative, isAbsolute, basename, extname } from 'node:path';
import { GerakError, toFrames, uniqueId, isPlainObject, deepClone, fmtTime } from './core/util.mjs';
import { evalChannel, putKey, TRANSFORM_DEFAULTS, CAMERA_DEFAULTS } from './core/keys.mjs';
import { resolveEase } from './core/easing.mjs';
import { packPoints } from './core/geom.mjs';
import { resolveBrush } from './core/brush.mjs';
import { buildTimeline } from './core/render.mjs';
import { SFX_TYPES } from './core/synth.mjs';

export const FORMAT = 'gerak';
export const VERSION = 1;

export const PRESETS = Object.freeze({
  reels: [1080, 1920],
  tiktok: [1080, 1920],
  shorts: [1080, 1920],
  story: [1080, 1920],
  vertical: [1080, 1920],
  square: [1080, 1080],
  feed: [1080, 1350],
  portrait: [1080, 1350],
  youtube: [1920, 1080],
  landscape: [1920, 1080],
  hd: [1280, 720],
  '720p': [1280, 720],
  '1080p': [1920, 1080],
  '4k': [3840, 2160],
});

const TRANSFORM_KEYS = new Set(Object.keys(TRANSFORM_DEFAULTS));
const CAMERA_KEYS = new Set(Object.keys(CAMERA_DEFAULTS));

// ------------------------------------------------------------ helpers

function collectIds(doc) {
  const used = new Set();
  const visitNode = (n) => {
    used.add(n.id);
    for (const e of n.elements || []) if (e.id) used.add(e.id);
    for (const c of n.children || []) visitNode(c);
  };
  for (const s of doc.scenes || []) {
    used.add(s.id);
    for (const n of s.layers || []) visitNode(n);
  }
  for (const a of doc.audio || []) used.add(a.id);
  for (const id of Object.keys(doc.assets || {})) used.add(id);
  return used;
}

/** Expand [at, dur] / {at, dur} timing shorthands into frames. */
function timing(v, fps, label, defaults = {}) {
  if (v === undefined || v === null || v === false) return undefined;
  if (v === true) return { at: 0, dur: defaults.dur ?? 12, ...(defaults.ease ? { ease: defaults.ease } : {}) };
  if (Array.isArray(v)) {
    const out = { at: toFrames(v[0], fps, `${label}.at`), dur: toFrames(v[1] ?? defaults.dur ?? 12, fps, `${label}.dur`) };
    if (v[2]) out.ease = v[2];
    return out;
  }
  if (isPlainObject(v)) {
    const out = { ...v };
    for (const k of ['at', 'dur', 'stagger', 'span']) if (out[k] !== undefined) out[k] = toFrames(out[k], fps, `${label}.${k}`);
    if (out.at === undefined) out.at = 0;
    if (out.dur === undefined && defaults.dur !== undefined) out.dur = defaults.dur;
    if (out.ease) resolveEase(out.ease);
    if (Array.isArray(out.times)) out.times = out.times.map((t, i) => toFrames(t, fps, `${label}.times[${i}]`));
    return out;
  }
  throw new GerakError(`${label}: format waktu tidak valid (pakai [at, dur] atau {at, dur})`, 'BAD_TIME');
}

function range(v, fps, label) {
  if (v === undefined || v === null) return undefined;
  if (!Array.isArray(v) || v.length < 1) throw new GerakError(`${label} harus [from, to]`, 'BAD_RANGE');
  const a = toFrames(v[0], fps, `${label}[0]`);
  const b = v[1] === undefined || v[1] === null || v[1] === Infinity ? null : toFrames(v[1], fps, `${label}[1]`);
  return b === null ? [a, 1e9] : [a, b];
}

function gainOf(o) {
  if (o.volume !== undefined) return Math.pow(10, o.volume / 20); // dB
  if (o.db !== undefined) return Math.pow(10, o.db / 20);
  return o.gain ?? 1;
}

// ------------------------------------------------------------ element refs

export class ElementRef {
  constructor(owner, el) {
    this.owner = owner;
    this.el = el;
  }

  get id() {
    return this.el.id;
  }

  /** Merge properties into the element (time-like values still accept "1s"). */
  set(patch) {
    this.el = this.owner._applyElementPatch(this.el, patch);
    return this;
  }

  remove() {
    this.owner.remove(this.el.id);
  }

  toString() {
    return this.el.id;
  }
}

// ------------------------------------------------------------ nodes

export class NodeHandle {
  constructor(project, scene, node) {
    this.project = project;
    this.sceneDoc = scene;
    this.node = node;
  }

  get id() {
    return this.node.id;
  }

  get name() {
    return this.node.name;
  }

  get fps() {
    return this.project.fps;
  }

  t(v, label) {
    return toFrames(v, this.project.fps, label);
  }

  toString() {
    return this.node.id;
  }

  // ---- structure

  _child(type, name, opts = {}) {
    const node = this.project._makeNode(type, name, opts);
    (this.node.children ||= []).push(node);
    return this.project._handle(this.sceneDoc, node);
  }

  /** Add a child layer (holds elements). */
  layer(name, opts) {
    return this._child('layer', name, opts);
  }

  /** Add a child group (holds child layers; moves them together). */
  group(name, opts) {
    return this._child('group', name, opts);
  }

  /** Add a drawing-substitution track (shows one child drawing at a time). */
  track(name, opts) {
    return this._child('track', name, opts);
  }

  /** Set base properties (transform values, blend, clip, shadow, ...). */
  set(opts = {}) {
    this.project._applyNodeOpts(this.node, opts);
    return this;
  }

  /** Limit visibility to [from, to) in scene-local time. Pass null to clear. */
  show(from, to) {
    if (from === null) delete this.node.exposure;
    else this.node.exposure = range([from, to], this.fps, `${this.id}.show`);
    return this;
  }

  hide() {
    this.node.visible = false;
    return this;
  }

  // ---- keyframes

  _valueAt(ch, f) {
    const base = this.node.transform?.[ch] ?? TRANSFORM_DEFAULTS[ch];
    return evalChannel(this.node.keys?.[ch], f, base);
  }

  /**
   * Keyframe: key(at, {x, y, rotation, scale, scaleX, scaleY, opacity, blur, skewX, skewY, pivotX, pivotY, depth}, ease)
   * The ease shapes the motion from this key to the next.
   */
  key(at, props, ease) {
    const f = this.t(at, `${this.id}.key`);
    const e = ease ?? props.ease;
    if (e !== undefined) resolveEase(e);
    for (const [ch, v] of Object.entries(props)) {
      if (ch === 'ease') continue;
      if (ch === 'pivot') {
        putKey(((this.node.keys ||= {}).pivotX ||= []), f, v[0], e);
        putKey((this.node.keys.pivotY ||= []), f, v[1], e);
        continue;
      }
      if (!TRANSFORM_KEYS.has(ch)) throw new GerakError(`Channel "${ch}" tidak dikenal. Pilihan: ${[...TRANSFORM_KEYS].join(', ')}`, 'BAD_CHANNEL');
      if (typeof v !== 'number' || !Number.isFinite(v)) throw new GerakError(`Nilai key ${ch} harus angka, dapat ${v}`, 'BAD_VALUE');
      putKey(((this.node.keys ||= {})[ch] ||= []), f, v, e);
    }
    return this;
  }

  /** Many keys at once: [[at, props, ease], ...] */
  keys(list) {
    for (const [at, props, ease] of list) this.key(at, props, ease);
    return this;
  }

  /** Animate from -> to over [at, at+dur). Missing `from` values use the current value at `at`. */
  animate({ at = 0, dur = 12, from = {}, to = {}, ease = 'in-out-cubic' } = {}) {
    const f0 = this.t(at, 'animate.at');
    const f1 = f0 + this.t(dur, 'animate.dur');
    const chans = new Set([...Object.keys(from), ...Object.keys(to)]);
    const start = {};
    const end = {};
    for (const ch of chans) {
      start[ch] = from[ch] ?? this._valueAt(ch, f0);
      end[ch] = to[ch] ?? (this.node.transform?.[ch] ?? TRANSFORM_DEFAULTS[ch]);
    }
    this.key(f0, start, ease);
    this.key(f1, end);
    return this;
  }

  /** Move to new values over time: move(at, {x, y, ...}, {dur, ease}). */
  move(at, props, { dur = 12, ease = 'in-out-cubic' } = {}) {
    const f0 = this.t(at);
    const from = {};
    for (const ch of Object.keys(props)) from[ch] = this._valueAt(ch, f0);
    this.key(f0, from, ease);
    this.key(f0 + this.t(dur), props);
    return this;
  }

  removeKeys(channels) {
    if (!this.node.keys) return this;
    for (const ch of channels ?? Object.keys(this.node.keys)) delete this.node.keys[ch];
    return this;
  }

  // ---- presets

  fadeIn(at = 0, dur = 10, ease = 'out-cubic') {
    const f = this.t(at);
    const target = this._valueAt('opacity', f + this.t(dur)) || 1;
    return this.key(f, { opacity: 0 }, ease).key(f + this.t(dur), { opacity: target === 0 ? 1 : target });
  }

  fadeOut(at, dur = 10, ease = 'in-cubic') {
    const f = this.t(at);
    return this.key(f, { opacity: this._valueAt('opacity', f) }, ease).key(f + this.t(dur), { opacity: 0 });
  }

  _offset(dir, distance) {
    switch (dir) {
      case 'left':
        return { x: -distance, y: 0 };
      case 'right':
        return { x: distance, y: 0 };
      case 'top':
      case 'up':
        return { x: 0, y: -distance };
      case 'bottom':
      case 'down':
      default:
        return { x: 0, y: distance };
    }
  }

  slideIn(at = 0, { from = 'bottom', distance = 160, dur = 14, ease = 'out-cubic', fade = true } = {}) {
    const f0 = this.t(at);
    const f1 = f0 + this.t(dur);
    const o = this._offset(from, distance);
    const x = this._valueAt('x', f1);
    const y = this._valueAt('y', f1);
    this.key(f0, { x: x + o.x, y: y + o.y }, ease).key(f1, { x, y });
    if (fade) this.key(f0, { opacity: 0 }, 'out-quad').key(f1, { opacity: this._valueAt('opacity', f1 + 1) || 1 });
    return this;
  }

  slideOut(at, { to = 'bottom', distance = 160, dur = 12, ease = 'in-cubic', fade = true } = {}) {
    const f0 = this.t(at);
    const f1 = f0 + this.t(dur);
    const o = this._offset(to, distance);
    const x = this._valueAt('x', f0);
    const y = this._valueAt('y', f0);
    this.key(f0, { x, y }, ease).key(f1, { x: x + o.x, y: y + o.y });
    if (fade) this.key(f0, { opacity: this._valueAt('opacity', f0) }, 'in-quad').key(f1, { opacity: 0 });
    return this;
  }

  /** Scale up from `from` with overshoot. Set a pivot first if the layer origin isn't its center. */
  pop(at = 0, { dur = 14, from = 0, ease = 'out-back', fade = true } = {}) {
    const f0 = this.t(at);
    const f1 = f0 + this.t(dur);
    const s = this._valueAt('scale', f1);
    this.key(f0, { scale: from }, ease).key(f1, { scale: s });
    if (fade) this.key(f0, { opacity: 0 }, 'out-quad').key(f0 + Math.max(1, this.t(dur) * 0.4), { opacity: 1 });
    return this;
  }

  popOut(at, { dur = 10, ease = 'in-back' } = {}) {
    const f0 = this.t(at);
    const f1 = f0 + this.t(dur);
    this.key(f0, { scale: this._valueAt('scale', f0) }, ease).key(f1, { scale: 0 });
    this.key(f1 - 1, { opacity: this._valueAt('opacity', f0) }).key(f1, { opacity: 0 });
    return this;
  }

  zoomIn(at = 0, { from = 1.25, dur = 16, ease = 'out-cubic', fade = true } = {}) {
    const f0 = this.t(at);
    const f1 = f0 + this.t(dur);
    const target = this._valueAt('scale', f1); // read BEFORE adding keys
    this.key(f0, { scale: from }, ease).key(f1, { scale: target });
    if (fade) this.fadeIn(f0, Math.max(1, this.t(dur) * 0.6));
    return this;
  }

  dropIn(at = 0, { height = 300, dur = 22, ease = 'out-bounce' } = {}) {
    const f0 = this.t(at);
    const f1 = f0 + this.t(dur);
    const y = this._valueAt('y', f1);
    this.key(f0, { y: y - height }, ease).key(f1, { y });
    this.key(f0, { opacity: 0 }).key(f0 + 2, { opacity: 1 });
    return this;
  }

  blurIn(at = 0, { amount = 24, dur = 14, ease = 'out-cubic' } = {}) {
    const f0 = this.t(at);
    const f1 = f0 + this.t(dur);
    this.key(f0, { blur: amount, opacity: 0 }, ease).key(f1, { blur: 0, opacity: 1 });
    return this;
  }

  spinIn(at = 0, { turns = 1, dur = 18, ease = 'out-cubic' } = {}) {
    const f0 = this.t(at);
    const f1 = f0 + this.t(dur);
    const r = this._valueAt('rotation', f1);
    const sc = this._valueAt('scale', f1) || 1;
    this.key(f0, { rotation: r - 360 * turns, scale: 0 }, ease).key(f1, { rotation: r, scale: sc });
    return this;
  }

  /** Reveal by a growing clip rectangle. dir: right | left | down | up | center */
  wipeIn(at = 0, { dir = 'right', dur = 14, ease = 'in-out-cubic', rect } = {}) {
    this.node.wipe = { dir, at: this.t(at), dur: this.t(dur), ease, ...(rect ? { rect } : {}) };
    return this;
  }

  wipeOut(at, { dir = 'right', dur = 14, ease = 'in-out-cubic', rect } = {}) {
    this.node.wipe = { dir, at: this.t(at), dur: this.t(dur), ease, out: true, ...(rect ? { rect } : {}) };
    return this;
  }

  // ---- behaviors (procedural, added on top of keys)

  _behavior(type, opts = {}) {
    const b = { type, ...opts };
    if (b.from !== undefined) b.from = this.t(b.from, `${type}.from`);
    if (b.to !== undefined) b.to = this.t(b.to, `${type}.to`);
    if (b.ramp !== undefined) b.ramp = this.t(b.ramp, `${type}.ramp`);
    (this.node.behaviors ||= []).push(b);
    return this;
  }

  /** Smooth random drift. {amp: px | [x,y], rot: deg, scale, freq: Hz, from, to} */
  wiggle(opts) {
    return this._behavior('wiggle', opts);
  }

  /** Gentle sine bob. {amp: px, period: sec, x, rot} */
  float(opts) {
    return this._behavior('float', opts);
  }

  /** Continuous rotation. {speed: deg/sec} — set a pivot to spin around the center. */
  spin(opts) {
    return this._behavior('spin', opts);
  }

  /** Breathing scale. {amount: 0.06, period: sec} */
  pulse(opts) {
    return this._behavior('pulse', opts);
  }

  /** Camera-style shake. {amp, freq, rot, from, to, decay} */
  shake(opts) {
    return this._behavior('shake', opts);
  }

  /** Pendulum rotation. {angle: deg, period: sec} */
  sway(opts) {
    return this._behavior('sway', opts);
  }

  /** On/off flicker. {period: sec, duty: 0..1} */
  blink(opts) {
    return this._behavior('blink', opts);
  }

  // ---- drawing

  _push(el, opts = {}) {
    const fps = this.fps;
    el.id = opts.id ? this.project._claimId(opts.id) : this.project._newId(opts.name ?? el.type);
    if (opts.name) el.name = opts.name;
    for (const k of ['opacity', 'blend', 'shadow', 'hidden', 'boil']) if (opts[k] !== undefined) el[k] = opts[k];
    if (opts.show) el.show = range(opts.show, fps, `${el.id}.show`);
    (this.node.elements ||= []).push(el);
    if (el.erase) this.node.hasErase = true;
    return new ElementRef(this, el);
  }

  _style(el, s, defaults) {
    const fps = this.fps;
    const fill = s.fill ?? (s.stroke === undefined ? defaults.fill : undefined);
    if (fill !== undefined && fill !== null && fill !== 'none') el.fill = fill;
    const stroke = s.stroke ?? defaults.stroke;
    if (stroke !== undefined && stroke !== null && stroke !== 'none') {
      el.stroke = stroke;
      el.strokeWidth = s.strokeWidth ?? s.width ?? defaults.strokeWidth ?? 3;
    }
    for (const k of ['lineCap', 'lineJoin', 'dash', 'fillRule']) if (s[k] !== undefined) el[k] = s[k];
    if (s.draw) el.draw = timing(s.draw, fps, 'draw', { dur: 18 });
    if (s.sketch) el.sketch = s.sketch === true ? { seed: el.id } : { seed: el.id, ...s.sketch };
    return el;
  }

  path(d, style = {}) {
    return this._push(this._style({ type: 'shape', shape: 'path', d }, style, { fill: '#111111' }), style);
  }

  rect(x, y, w, h, style = {}) {
    return this._push(this._style({ type: 'shape', shape: 'rect', x, y, w, h, ...(style.r || style.radius ? { r: style.r ?? style.radius } : {}) }, style, { fill: '#111111' }), style);
  }

  circle(cx, cy, r, style = {}) {
    return this._push(this._style({ type: 'shape', shape: 'circle', cx, cy, r }, style, { fill: '#111111' }), style);
  }

  ellipse(cx, cy, rx, ry, style = {}) {
    return this._push(this._style({ type: 'shape', shape: 'ellipse', cx, cy, rx, ry }, style, { fill: '#111111' }), style);
  }

  line(x1, y1, x2, y2, style = {}) {
    return this._push(this._style({ type: 'shape', shape: 'line', x1, y1, x2, y2 }, { ...style, fill: undefined }, { stroke: '#111111', strokeWidth: 4 }), style);
  }

  arrow(x1, y1, x2, y2, style = {}) {
    const el = { type: 'shape', shape: 'arrow', x1, y1, x2, y2 };
    if (style.head) el.head = style.head;
    if (style.headAngle) el.headAngle = style.headAngle;
    return this._push(this._style(el, { ...style, fill: undefined }, { stroke: '#111111', strokeWidth: 4 }), style);
  }

  polygon(points, style = {}) {
    const el = { type: 'shape', shape: 'polygon', points: points.map((p) => (Array.isArray(p) ? [p[0], p[1]] : [p.x, p.y])) };
    if (style.closed === false) el.closed = false;
    if (style.smooth) el.smooth = true;
    return this._push(this._style(el, style, style.closed === false ? { stroke: '#111111', strokeWidth: 4 } : { fill: '#111111' }), style);
  }

  star(cx, cy, r1, r2, n = 5, style = {}) {
    return this._push(this._style({ type: 'shape', shape: 'star', cx, cy, r1, r2, n }, style, { fill: '#111111' }), style);
  }

  arc(cx, cy, r, start, end, style = {}) {
    return this._push(this._style({ type: 'shape', shape: 'arc', cx, cy, r, start, end }, { ...style }, { stroke: '#111111', strokeWidth: 4 }), style);
  }

  /**
   * Brush stroke. `input` is pen points ([[x,y,pressure], ...] or {x,y,p}) or an SVG path string.
   * opts: brush, size, color, seed, reveal:[at,dur,ease], pressure (for SVG paths), erase, minWidth, taper, wobble, ...
   */
  stroke(input, opts = {}) {
    const brush = typeof opts.brush === 'object' ? opts.brush : opts.brush ?? 'ink';
    resolveBrush(brush, opts);
    const el = { type: 'stroke', brush };
    if (typeof input === 'string') {
      el.path = input;
      if (opts.pressure !== undefined) el.pressure = opts.pressure;
    } else el.points = packPoints(input);
    for (const k of ['size', 'minWidth', 'taper', 'wobble', 'flow', 'hardness', 'grain', 'scatter', 'spacing', 'dryness', 'gamma', 'glow', 'bristles', 'smooth', 'glowColor']) if (opts[k] !== undefined) el[k] = opts[k];
    el.color = opts.color ?? '#151515';
    el.seed = opts.seed ?? this.project._seedCounter++;
    if (opts.reveal) el.reveal = timing(opts.reveal, this.fps, 'reveal', { dur: 12 });
    if (opts.erase) el.erase = true;
    return this._push(el, opts);
  }

  /** Eraser stroke (affects only this layer). */
  erase(input, opts = {}) {
    return this.stroke(input, { brush: 'marker', size: 30, ...opts, erase: true });
  }

  /**
   * Text. style: font, size, weight, italic, color, align, valign, maxWidth, lineHeight, letterSpacing,
   * stroke, strokeWidth, shadow, box, highlight, anim, exit, case ('upper'|'lower')
   */
  text(str, x, y, style = {}) {
    const fps = this.fps;
    const el = { type: 'text', text: String(str), x, y };
    for (const k of ['font', 'size', 'weight', 'italic', 'color', 'align', 'valign', 'maxWidth', 'fit', 'lineHeight', 'letterSpacing', 'stroke', 'strokeWidth', 'box', 'case', 'seed']) if (style[k] !== undefined) el[k] = style[k];
    // no default dur here: typewriter uses cps, count defaults to 1s, per-unit effects default to 10 frames in the renderer
    if (style.anim) el.anim = timing(style.anim, fps, 'anim', {});
    if (style.exit) el.exit = timing(style.exit, fps, 'exit', { dur: 8 });
    if (style.highlight) {
      const hl = Array.isArray(style.highlight) ? style.highlight : [style.highlight];
      el.highlight = hl.map((h) => timing(h, fps, 'highlight', { dur: 10 }));
    }
    return this._push(el, style);
  }

  /** Image from a file path (registered as a project asset). */
  image(src, x = 0, y = 0, opts = {}) {
    const id = this.project.asset(src, 'image');
    const el = { type: 'image', src: id, x, y };
    for (const k of ['width', 'height', 'fit', 'radius', 'anchor', 'focus', 'stroke', 'strokeWidth']) if (opts[k] !== undefined) el[k] = opts[k];
    return this._push(el, opts);
  }

  // ---- revise

  element(id) {
    const el = (this.node.elements || []).find((e) => e.id === id);
    return el ? new ElementRef(this, el) : null;
  }

  /** Patch an element by id: edit(id, {color: 'red'}) or edit(id, el => ({...el, size: 20})). */
  edit(id, patch) {
    const list = this.node.elements || [];
    const i = list.findIndex((e) => e.id === (typeof id === 'object' ? id.id : id));
    if (i < 0) throw new GerakError(`Elemen "${id}" tidak ada di layer "${this.id}"`, 'NOT_FOUND');
    if (typeof patch === 'function') {
      const next = patch(deepClone(list[i]));
      list[i] = { ...next, id: list[i].id };
    } else this._applyElementPatch(list[i], patch);
    return this;
  }

  _applyElementPatch(el, patch) {
    const fps = this.fps;
    for (const [k, v] of Object.entries(patch)) {
      if (k === 'id') continue;
      if (k === 'reveal' || k === 'draw') el[k] = timing(v, fps, k, { dur: 12 });
      else if (k === 'anim' || k === 'exit') el[k] = timing(v, fps, k, {});
      else if (k === 'show') el.show = range(v, fps, 'show');
      else if (k === 'points') el.points = packPoints(v);
      else if (v === undefined || v === null) delete el[k];
      else el[k] = v;
    }
    // element objects are cache keys in the renderer: replace with a fresh object
    const list = this.node.elements;
    const i = list.indexOf(el);
    const fresh = { ...el };
    if (i >= 0) list[i] = fresh;
    if (fresh.erase) this.node.hasErase = true;
    return fresh;
  }

  remove(id) {
    this.node.elements = (this.node.elements || []).filter((e) => e.id !== id);
    return this;
  }

  clear() {
    this.node.elements = [];
    return this;
  }
}

export class TrackHandle extends NodeHandle {
  /** Create a drawing (pose) inside this track. */
  drawing(name, opts) {
    return this._child('group', name, opts);
  }

  _drawingId(d) {
    if (d === null || d === undefined) return null;
    const id = typeof d === 'string' ? d : d.id;
    if (!(this.node.children || []).some((c) => c.id === id)) throw new GerakError(`Drawing "${id}" bukan anak track "${this.id}"`, 'NOT_FOUND');
    return id;
  }

  /** Show drawing `d` from frame `at` until the next exposure (null = blank). */
  expose(at, d) {
    const f = this.t(at);
    const list = (this.node.drawings ||= []);
    const k = { f, id: this._drawingId(d) };
    const i = list.findIndex((q) => q.f === f);
    if (i >= 0) list[i] = k;
    else list.push(k);
    list.sort((a, b) => a.f - b.f);
    return this;
  }

  /** Replace all exposures: [[at, drawing], ...] */
  sequence(list) {
    this.node.drawings = [];
    for (const [at, d] of list) this.expose(at, d);
    return this;
  }

  /** Loop drawings: cycle([a, b, c], {from, to, every: frames per drawing}). */
  cycle(drawings, { from = 0, to, every = 4 } = {}) {
    const f0 = this.t(from);
    const f1 = to === undefined ? this.sceneDoc.duration : this.t(to);
    const step = this.t(every);
    let i = 0;
    for (let f = f0; f < f1; f += step) this.expose(f, drawings[i++ % drawings.length]);
    return this;
  }

  /** Put drawing `d` on [from, to) and restore what was showing at `to`. */
  range(from, to, d) {
    const f0 = this.t(from);
    const f1 = this.t(to);
    const list = (this.node.drawings ||= []);
    const before = [...list].reverse().find((q) => q.f <= f1);
    const restore = before ? before.id : null;
    this.node.drawings = list.filter((q) => q.f < f0 || q.f >= f1);
    this.expose(f0, d);
    if (!this.node.drawings.some((q) => q.f === f1)) this.expose(f1, restore);
    return this;
  }
}

// ------------------------------------------------------------ camera

export class CameraHandle {
  constructor(project, scene) {
    this.project = project;
    this.scene = scene;
  }

  get cam() {
    return (this.scene.camera ||= {});
  }

  t(v) {
    return toFrames(v, this.project.fps);
  }

  set(props) {
    for (const [k, v] of Object.entries(props)) {
      if (!CAMERA_KEYS.has(k)) throw new GerakError(`Channel kamera "${k}" tidak dikenal (x, y, zoom, rotation)`, 'BAD_CHANNEL');
      (this.cam.base ||= {})[k] = v;
    }
    return this;
  }

  /** key(at, {x, y, zoom, rotation}, ease). Positive x pans right (artwork moves left). */
  key(at, props, ease) {
    const f = this.t(at);
    const e = ease ?? props.ease;
    if (e !== undefined) resolveEase(e);
    for (const [k, v] of Object.entries(props)) {
      if (k === 'ease') continue;
      if (!CAMERA_KEYS.has(k)) throw new GerakError(`Channel kamera "${k}" tidak dikenal (x, y, zoom, rotation)`, 'BAD_CHANNEL');
      putKey(((this.cam.keys ||= {})[k] ||= []), f, v, e);
    }
    return this;
  }

  _valueAt(ch, f) {
    return evalChannel(this.cam.keys?.[ch], f, this.cam.base?.[ch] ?? CAMERA_DEFAULTS[ch]);
  }

  /** Move the camera from its current state to `to` over [at, at+dur). */
  move(at, to, { dur = 24, ease = 'in-out-cubic' } = {}) {
    const f0 = this.t(at);
    const from = {};
    for (const k of Object.keys(to)) from[k] = this._valueAt(k, f0);
    this.key(f0, from, ease).key(f0 + this.t(dur), to);
    return this;
  }

  /** Slow push-in over the whole scene (Ken Burns). */
  push({ zoom = 1.12, x = 0, y = 0, from = 0, to, ease = 'in-out-sine' } = {}) {
    const f1 = to === undefined ? this.scene.duration : this.t(to);
    return this.move(from, { zoom, x, y }, { dur: f1 - this.t(from), ease });
  }

  shake(opts = {}) {
    const b = { type: 'shake', amp: 10, freq: 14, ...opts };
    if (b.from !== undefined) b.from = this.t(b.from);
    if (b.to !== undefined) b.to = this.t(b.to);
    (this.cam.behaviors ||= []).push(b);
    return this;
  }

  /** Handheld drift. */
  handheld(opts = {}) {
    const b = { type: 'wiggle', amp: 6, freq: 0.6, rot: 0.4, ...opts };
    if (b.from !== undefined) b.from = this.t(b.from);
    if (b.to !== undefined) b.to = this.t(b.to);
    (this.cam.behaviors ||= []).push(b);
    return this;
  }
}

// ------------------------------------------------------------ scenes

export class SceneHandle {
  constructor(project, scene) {
    this.project = project;
    this.scene = scene;
    this.camera = new CameraHandle(project, scene);
  }

  get id() {
    return this.scene.id;
  }

  get duration() {
    return this.scene.duration;
  }

  get name() {
    return this.scene.name;
  }

  /** Global start frame of this scene on the timeline. */
  get start() {
    const e = buildTimelineFresh(this.project.doc).entries.find((q) => q.scene === this.scene);
    return e ? e.start : 0;
  }

  t(v, label) {
    return toFrames(v, this.project.fps, label);
  }

  toString() {
    return this.scene.id;
  }

  _root(type, name, opts) {
    const node = this.project._makeNode(type, name, opts);
    this.scene.layers.push(node);
    return this.project._handle(this.scene, node);
  }

  layer(name, opts) {
    return this._root('layer', name, opts);
  }

  group(name, opts) {
    return this._root('group', name, opts);
  }

  track(name, opts) {
    return this._root('track', name, opts);
  }

  set({ duration, background, transition, name } = {}) {
    if (duration !== undefined) this.scene.duration = Math.max(1, Math.round(this.t(duration, 'duration')));
    if (background !== undefined) this.scene.background = background;
    if (name !== undefined) this.scene.name = name;
    if (transition !== undefined) this.transition(transition);
    return this;
  }

  /** Transition into this scene: transition('fade', '0.5s') or transition({type, duration, ease, color}). */
  transition(type, duration = 12, opts = {}) {
    if (type === null || type === 'cut') {
      delete this.scene.transition;
      return this;
    }
    const spec = typeof type === 'object' ? { ...type } : { type, duration, ...opts };
    spec.duration = Math.round(this.t(spec.duration ?? 12, 'transition.duration'));
    if (spec.ease) resolveEase(spec.ease);
    this.scene.transition = spec;
    return this;
  }

  /** Storyboard notes shown on contact sheets: {action, dialog, camera, notes}. */
  note(n) {
    this.scene.notes = { ...(this.scene.notes || {}), ...n };
    return this;
  }

  /** Audio clip placed at scene-local time. */
  audio(src, opts = {}) {
    return this.project._audio(src, opts, this.scene.id);
  }

  /** Synthesized sound effect at scene-local time: sfx('pop', {at: 12}). */
  sfx(type, opts = {}) {
    return this.project._sfx(type, opts, this.scene.id);
  }

  /**
   * Burned-in captions on a fixed layer: captions([{text, at, until}], style)
   * Each item shows from `at` to `until` (or to the next caption's `at`).
   */
  captions(items, style = {}) {
    const W = this.project.width;
    const H = this.project.height;
    const layer = this.layer(style.layerName ?? 'Captions', { fixed: true });
    const st = {
      size: Math.round(W * 0.058),
      weight: 800,
      color: '#ffffff',
      align: 'center',
      valign: 'middle',
      maxWidth: W * 0.8,
      stroke: '#000000',
      strokeWidth: Math.round(W * 0.006),
      ...style,
    };
    const x = style.x ?? W / 2;
    const y = style.y ?? H * 0.68;
    items.forEach((it, i) => {
      const at = this.t(it.at, 'caption.at');
      const until = it.until !== undefined ? this.t(it.until) : items[i + 1] ? this.t(items[i + 1].at) : this.scene.duration;
      const s = { ...st, ...(it.style || {}), show: [at, until] };
      if (st.anim || it.anim) s.anim = { ...(st.anim || {}), ...(it.anim || {}), at: at + this.t((it.anim || st.anim).at ?? 0) };
      delete s.layerName;
      delete s.x;
      delete s.y;
      layer.text(it.text, x, y, s);
    });
    return layer;
  }

  find(id) {
    return this.project.find(id);
  }
}

function buildTimelineFresh(doc) {
  // timeline cache is keyed on scene count; build fresh for authoring queries
  return buildTimeline({ ...doc, scenes: doc.scenes.slice() });
}

// ------------------------------------------------------------ project

export class Project {
  constructor(doc, { root, file } = {}) {
    this.doc = doc;
    this.root = root ?? process.env.GERAK_ROOT ?? process.cwd();
    this.file = file;
    this._used = collectIds(doc);
    this._handles = new WeakMap();
    this._seedCounter = 1;
  }

  /** Create a new project. opts: {title, preset, width, height, fps, background, root} */
  static create(opts = {}) {
    let [w, h] = [1080, 1920];
    if (opts.preset) {
      const p = PRESETS[opts.preset];
      if (!p) throw new GerakError(`Preset "${opts.preset}" tidak ada. Pilihan: ${Object.keys(PRESETS).join(', ')}`, 'BAD_PRESET');
      [w, h] = p;
    }
    if (opts.width) w = opts.width;
    if (opts.height) h = opts.height;
    const doc = {
      format: FORMAT,
      version: VERSION,
      title: opts.title ?? 'Untitled',
      width: Math.round(w),
      height: Math.round(h),
      fps: opts.fps ?? 30,
      background: opts.background ?? '#ffffff',
      scenes: [],
      audio: [],
      assets: {},
      fonts: [],
    };
    if (opts.effects) doc.effects = opts.effects;
    return new Project(doc, { root: opts.root });
  }

  /** Open a saved .gerak.json project. */
  static open(file) {
    const abs = resolve(file);
    const doc = JSON.parse(readFileSync(abs, 'utf8'));
    if (doc.format !== FORMAT) throw new GerakError(`${file} bukan project Gerak`, 'BAD_FORMAT');
    const dir = dirname(abs);
    for (const a of Object.values(doc.assets || {})) if (a.path && !isAbsolute(a.path)) a.path = resolve(dir, a.path);
    for (const f of doc.fonts || []) if (f.path && !isAbsolute(f.path)) f.path = resolve(dir, f.path);
    for (const c of doc.audio || []) if (c.src && !isAbsolute(c.src)) c.src = resolve(dir, c.src);
    return new Project(doc, { root: dir, file: abs });
  }

  static fromJSON(doc, opts) {
    return new Project(deepClone(doc), opts);
  }

  get width() {
    return this.doc.width;
  }

  get height() {
    return this.doc.height;
  }

  get fps() {
    return this.doc.fps;
  }

  get title() {
    return this.doc.title;
  }

  /** Total frames (transitions overlap scenes). */
  get duration() {
    return buildTimelineFresh(this.doc).total;
  }

  get seconds() {
    return this.duration / this.fps;
  }

  /** Convert "1.5s" / "500ms" / frames to frames. */
  t(v, label) {
    return toFrames(v, this.fps, label);
  }

  _newId(base) {
    return uniqueId(base, this._used);
  }

  _claimId(id) {
    if (this._used.has(id)) throw new GerakError(`ID "${id}" sudah dipakai`, 'DUPLICATE_ID');
    this._used.add(id);
    return id;
  }

  _makeNode(type, name, opts = {}) {
    const node = { id: opts.id ? this._claimId(opts.id) : this._newId(name ?? type), type, name: name ?? type };
    if (type === 'layer') node.elements = [];
    if (type === 'group' || type === 'track') node.children = [];
    this._applyNodeOpts(node, opts);
    return node;
  }

  _applyNodeOpts(node, opts) {
    const fps = this.fps;
    for (const [k, v] of Object.entries(opts)) {
      if (k === 'id') continue;
      if (TRANSFORM_KEYS.has(k)) (node.transform ||= {})[k] = v;
      else if (k === 'pivot') {
        (node.transform ||= {}).pivotX = v[0];
        node.transform.pivotY = v[1];
      } else if (k === 'show' || k === 'exposure') node.exposure = range(v, fps, `${node.id}.show`);
      else if (['blend', 'filter', 'shadow', 'clip', 'fixed', 'isolate', 'visible', 'mask', 'maskInvert'].includes(k)) node[k] = v;
      else if (k === 'wipe') node.wipe = { ...v, at: toFrames(v.at ?? 0, fps), dur: toFrames(v.dur ?? 12, fps) };
      else if (k === 'name') node.name = v;
      else throw new GerakError(`Opsi layer "${k}" tidak dikenal`, 'BAD_OPTION');
    }
  }

  _handle(scene, node) {
    let h = this._handles.get(node);
    if (!h) {
      h = node.type === 'track' ? new TrackHandle(this, scene, node) : new NodeHandle(this, scene, node);
      this._handles.set(node, h);
    }
    return h;
  }

  /** Add a scene. opts: {id, duration, background, transition: {type, duration} | 'fade'} */
  scene(name, opts = {}) {
    const s = {
      id: opts.id ? this._claimId(opts.id) : this._newId(name ?? 'scene'),
      name: name ?? `Scene ${this.doc.scenes.length + 1}`,
      duration: Math.max(1, Math.round(this.t(opts.duration ?? '3s', 'duration'))),
      layers: [],
    };
    if (opts.background !== undefined) s.background = opts.background;
    this.doc.scenes.push(s);
    const h = new SceneHandle(this, s);
    if (opts.transition) {
      if (typeof opts.transition === 'string') h.transition(opts.transition, opts.transitionDuration ?? 12);
      else h.transition(opts.transition);
    }
    if (opts.notes) h.note(opts.notes);
    return h;
  }

  get scenes() {
    return this.doc.scenes.map((s) => new SceneHandle(this, s));
  }

  getScene(idOrName) {
    const s = this.doc.scenes.find((q) => q.id === idOrName || q.name === idOrName);
    return s ? new SceneHandle(this, s) : null;
  }

  /** Move a scene to a new index. */
  moveScene(id, index) {
    const i = this.doc.scenes.findIndex((s) => s.id === id);
    if (i < 0) throw new GerakError(`Scene "${id}" tidak ada`, 'NOT_FOUND');
    const [s] = this.doc.scenes.splice(i, 1);
    this.doc.scenes.splice(index, 0, s);
    return this;
  }

  removeScene(id) {
    this.doc.scenes = this.doc.scenes.filter((s) => s.id !== id);
    this.doc.audio = this.doc.audio.filter((a) => a.scene !== id);
    return this;
  }

  /** Find a layer/group/track handle (or element ref) by id anywhere in the project. */
  find(id) {
    for (const s of this.doc.scenes) {
      const stack = [...s.layers];
      while (stack.length) {
        const n = stack.pop();
        if (n.id === id) return this._handle(s, n);
        for (const e of n.elements || []) if (e.id === id) return new ElementRef(this._handle(s, n), e);
        stack.push(...(n.children || []));
      }
    }
    return null;
  }

  /** Register a project font file: font('fonts/Brand.ttf', {family:'Brand', weight: 700}) */
  font(path, { family, weight = 400, style = 'normal' } = {}) {
    const abs = resolve(this.root, path);
    if (!existsSync(abs)) throw new GerakError(`File font tidak ditemukan: ${abs}`, 'NOT_FOUND');
    const fam = family ?? basename(path, extname(path)).replace(/[-_](Regular|Bold|Medium|Light|SemiBold|ExtraBold|Black|Thin|\d+)$/i, '');
    this.doc.fonts.push({ family: fam, path: abs, weight, style });
    return fam;
  }

  /** Register an asset file and return its id. */
  asset(path, type = 'image') {
    const abs = resolve(this.root, path);
    for (const [id, a] of Object.entries(this.doc.assets)) if (a.path === abs) return id;
    if (!existsSync(abs)) throw new GerakError(`File tidak ditemukan: ${abs}`, 'NOT_FOUND');
    const id = this._newId(basename(path, extname(path)));
    this.doc.assets[id] = { type, path: abs };
    return id;
  }

  _audio(src, opts, sceneId) {
    const abs = resolve(this.root, src);
    if (!existsSync(abs)) throw new GerakError(`File audio tidak ditemukan: ${abs}`, 'NOT_FOUND');
    const clip = {
      id: opts.id ? this._claimId(opts.id) : this._newId(basename(src, extname(src))),
      src: abs,
      at: this.t(opts.at ?? 0, 'audio.at'),
      gain: gainOf(opts),
    };
    if (sceneId) clip.scene = sceneId;
    if (opts.trim) clip.trim = [toSecondsLoose(opts.trim[0], this.fps), opts.trim[1] === undefined ? null : toSecondsLoose(opts.trim[1], this.fps)];
    if (opts.duration !== undefined) clip.duration = toSecondsLoose(opts.duration, this.fps);
    if (opts.fadeIn !== undefined) clip.fadeIn = toSecondsLoose(opts.fadeIn, this.fps);
    if (opts.fadeOut !== undefined) clip.fadeOut = toSecondsLoose(opts.fadeOut, this.fps);
    if (opts.loop) clip.loop = true;
    if (opts.duck) clip.duck = opts.duck;
    this.doc.audio.push(clip);
    return clip.id;
  }

  _sfx(type, opts, sceneId) {
    if (!SFX_TYPES.includes(type)) throw new GerakError(`SFX "${type}" tidak ada. Pilihan: ${SFX_TYPES.join(', ')}`, 'BAD_SFX');
    const { at, gain, volume, db, id, ...params } = opts;
    const clip = {
      id: id ? this._claimId(id) : this._newId(`sfx-${type}`),
      sfx: { type, ...params },
      at: this.t(at ?? 0, 'sfx.at'),
      gain: gainOf({ gain, volume, db }),
    };
    if (sceneId) clip.scene = sceneId;
    this.doc.audio.push(clip);
    return clip.id;
  }

  /** Audio clip on the global timeline. opts: {at, gain|volume(dB), trim:[start,end], fadeIn, fadeOut, loop, duration} */
  audio(src, opts = {}) {
    return this._audio(src, opts, null);
  }

  /** Synthesized sound effect on the global timeline. */
  sfx(type, opts = {}) {
    return this._sfx(type, opts, null);
  }

  /**
   * Line boil for every brush stroke and sketch shape: lines are redrawn with fresh wobble
   * every `every` frames, cycling `variants` versions (classic hand-drawn "living line").
   * boil(true) | boil({every: 4, variants: 3, amount: 1}) | boil(false)
   */
  boil(spec = true) {
    if (spec === false) delete this.doc.boil;
    else this.doc.boil = spec === true ? { every: 4, variants: 3, amount: 1 } : { every: 4, variants: 3, amount: 1, ...spec };
    return this;
  }

  /** Whole-frame effects: {grain: 0.08 | {amount, animate}, vignette: 0.3} */
  effects(fx) {
    this.doc.effects = { ...(this.doc.effects || {}), ...fx };
    return this;
  }

  toJSON() {
    return this.doc;
  }

  /** Serializable copy with paths relative to `baseDir`. */
  serialize(baseDir) {
    const doc = deepClone(this.doc);
    const rel = (p) => (p && baseDir ? relative(baseDir, p).split('\\').join('/') : p);
    for (const a of Object.values(doc.assets || {})) a.path = rel(a.path);
    for (const f of doc.fonts || []) f.path = rel(f.path);
    for (const c of doc.audio || []) if (c.src) c.src = rel(c.src);
    return doc;
  }

  /** Save as .gerak.json (asset paths stored relative to the file). */
  save(file) {
    const abs = resolve(file);
    mkdirSync(dirname(abs), { recursive: true });
    writeFileSync(abs, JSON.stringify(this.serialize(dirname(abs))));
    this.file = abs;
    return abs;
  }

  /** Human/agent-readable summary: scenes, timings, layer tree. */
  info() {
    const tl = buildTimelineFresh(this.doc);
    const fps = this.fps;
    const tree = (n) => {
      const o = { id: n.id, type: n.type, name: n.name };
      if (n.elements?.length) o.elements = n.elements.map((e) => `${e.id}:${e.type}${e.shape ? `/${e.shape}` : ''}${e.text ? ` "${String(e.text).replace(/\n/g, ' ⏎ ').slice(0, 28)}"` : ''}`);
      if (n.keys) o.keys = Object.fromEntries(Object.entries(n.keys).map(([k, v]) => [k, v.map((q) => q.f)]));
      if (n.exposure) o.show = n.exposure;
      if (n.drawings) o.drawings = n.drawings.map((d) => [d.f, d.id]);
      if (n.children?.length) o.children = n.children.map(tree);
      return o;
    };
    return {
      title: this.doc.title,
      size: `${this.width}x${this.height}`,
      fps,
      frames: tl.total,
      duration: fmtTime(tl.total, fps),
      scenes: tl.entries.map((e) => ({
        id: e.scene.id,
        name: e.scene.name,
        start: e.start,
        end: e.end,
        time: `${fmtTime(e.start, fps)}-${fmtTime(e.end, fps)}`,
        transition: e.transition ? `${e.transition.type}/${e.transition.duration}f` : 'cut',
        notes: e.scene.notes,
        layers: e.scene.layers.map(tree),
      })),
      audio: this.doc.audio.map((a) => ({ id: a.id, src: a.src ? basename(a.src) : `sfx:${a.sfx.type}`, scene: a.scene ?? null, at: a.at })),
      assets: Object.keys(this.doc.assets),
    };
  }
}

function toSecondsLoose(v, fps) {
  // audio options: numbers are SECONDS here (more natural for audio), strings parsed as time
  if (v === null || v === undefined) return v;
  if (typeof v === 'number') return v;
  return toFrames(v, fps) / fps;
}

/** Shorthand: project({preset:'reels', fps:30, ...}) */
export function project(opts) {
  return Project.create(opts);
}

export function open(file) {
  return Project.open(file);
}
