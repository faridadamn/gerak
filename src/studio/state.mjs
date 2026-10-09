// Editor state, document helpers, undo/redo and autosave.
import { Project } from '/author.mjs';
import { Renderer, buildTimeline } from '/core/render.mjs';
import { putKey, evalChannel, TRANSFORM_DEFAULTS, CAMERA_DEFAULTS } from '/core/keys.mjs';
import { api, fileUrl } from './api.mjs';
import { confirmBox } from './ui.mjs';

export const S = {
  file: null,
  doc: null,
  proj: null,
  renderer: null,
  env: {
    createCanvas(w, h) {
      const c = document.createElement('canvas');
      c.width = w;
      c.height = h;
      return c;
    },
    Path2D: window.Path2D,
    images: new Map(),
    fontEpoch: 0,
  },
  imagePaths: new Map(),
  loadedFonts: new Set(),
  info: { fonts: [], sfx: [] },
  assets: [],
  scene: 0,
  lf: 0,
  playing: false,
  playMode: 'scene',
  loop: true,
  sound: true,
  sel: { node: null, el: null, clip: null },
  keySel: null,
  tool: 'select',
  locked: new Set(),
  collapsed: new Set(),
  autokey: false,
  version: 0,
  saveState: 'saved',
  view: { zoom: 1, panX: 0, panY: 0, grid: false, safe: false, onion: false },
  brush: { name: 'ink', size: 12, color: '#151515', appear: 'instant', advance: true, eraseSize: 40 },
  style: { fill: '#00B7B3', stroke: '#111111', strokeWidth: 8, text: '#111111' },
  presetDur: 15,
  textStyle: 'judul',
};

// ------------------------------------------------------------ events

const listeners = {};
export const on = (ev, fn) => (listeners[ev] ||= []).push(fn);
export const emit = (ev, data) => (listeners[ev] || []).forEach((fn) => fn(data));

const flags = new Set();
let raf = 0;
/** Parts: view overlay timeline inspector values scenes assets sound top tools */
export function invalidate(...parts) {
  for (const p of parts) flags.add(p);
  if (!raf) raf = requestAnimationFrame(flush);
}
export const ALL = ['view', 'overlay', 'timeline', 'inspector', 'scenes', 'sound', 'top'];
function flush() {
  raf = 0;
  const f = new Set(flags);
  flags.clear();
  emit('refresh', f);
}

// ------------------------------------------------------------ document helpers

export const scene = (i = S.scene) => S.doc?.scenes[i];
export const timeline = () => buildTimeline(S.doc);
export const entry = (i = S.scene) => timeline().entries[i];
export const globalFrame = () => (entry()?.start ?? 0) + S.lf;
export const fps = () => S.doc.fps;

/** Walk nodes depth-first: fn(node, depth, parent, path). Return false to skip children. */
export function walk(nodes, fn, depth = 0, parent = null, path = []) {
  for (const n of nodes || []) {
    const p = [...path, n];
    if (fn(n, depth, parent, p) === false) continue;
    if (n.children) walk(n.children, fn, depth + 1, n, p);
  }
}

/** Find a node by id: { node, scene, sceneIdx, parent, list, index, path } */
export function locate(id) {
  if (!S.doc || !id) return null;
  for (let si = 0; si < S.doc.scenes.length; si++) {
    const sc = S.doc.scenes[si];
    let hit = null;
    walk(sc.layers, (n, d, parent, path) => {
      if (hit) return false;
      if (n.id === id) {
        const list = parent ? parent.children : sc.layers;
        hit = { node: n, scene: sc, sceneIdx: si, parent, list, index: list.indexOf(n), path };
        return false;
      }
      return true;
    });
    if (hit) return hit;
  }
  return null;
}

export function selNode() {
  return S.sel.node ? locate(S.sel.node) : null;
}

/** The element being edited: explicit selection, or the only element of a single-element layer. */
export function selElement() {
  const loc = selNode();
  if (!loc) return null;
  const els = loc.node.elements || [];
  let el = S.sel.el ? els.find((e) => e.id === S.sel.el) : null;
  if (!el && els.length === 1 && !(loc.node.children || []).length) el = els[0];
  return el ? { ...loc, el, elIndex: els.indexOf(el) } : null;
}

export function selClip() {
  return S.sel.clip ? (S.doc.audio || []).find((c) => c.id === S.sel.clip) : null;
}

export function handleOf(loc) {
  return S.proj._handle(loc.scene, loc.node);
}

export function sceneHandle(sc = scene()) {
  return S.proj.getScene(sc.id);
}

/** Replace an element (new object → renderer caches refresh). */
export function replaceElement(node, oldEl, next) {
  const i = node.elements.indexOf(oldEl);
  if (i >= 0) node.elements[i] = next;
  if (next.erase) node.hasErase = true;
  return next;
}

export function patchElement(node, el, patch) {
  const next = { ...el };
  for (const [k, v] of Object.entries(patch)) {
    if (v === undefined || v === null) delete next[k];
    else next[k] = v;
  }
  return replaceElement(node, el, next);
}

// ------------------------------------------------------------ channels (transform / camera)

export function channelValue(node, ch, f) {
  return evalChannel(node.keys?.[ch], f, node.transform?.[ch] ?? TRANSFORM_DEFAULTS[ch]);
}

export function hasKeys(node, ch) {
  return !!node.keys?.[ch]?.length;
}

export function keyAt(node, ch, f) {
  return node.keys?.[ch]?.find((k) => k.f === f) ?? null;
}

function easeFor(arr, f) {
  const same = arr.find((k) => k.f === f);
  if (same) return same.e;
  let prev = null;
  for (const k of arr) if (k.f < f) prev = k;
  return prev?.e ?? 'in-out-cubic';
}

/**
 * Set a transform channel at local frame f. Animated channels (or auto-key mode) get a key;
 * otherwise the base value changes.
 */
export function setChannel(node, ch, v, f, autokey = S.autokey) {
  const arr = node.keys?.[ch];
  if (arr?.length) {
    putKey(arr, f, v, easeFor(arr, f));
  } else if (autokey) {
    const keys = (node.keys ||= {});
    keys[ch] = [];
    const before = node.transform?.[ch] ?? TRANSFORM_DEFAULTS[ch];
    if (f > 0 && before !== v) putKey(keys[ch], 0, before, 'in-out-cubic');
    putKey(keys[ch], f, v, 'in-out-cubic');
  } else {
    (node.transform ||= {})[ch] = v;
  }
}

/** Toggle a key at f for a channel (adds current value, or removes the key). */
export function toggleKey(node, ch, f) {
  const arr = node.keys?.[ch];
  const k = arr?.find((q) => q.f === f);
  if (k) {
    arr.splice(arr.indexOf(k), 1);
    if (!arr.length) {
      // keep the value the user was looking at
      (node.transform ||= {})[ch] = k.v;
      delete node.keys[ch];
      if (!Object.keys(node.keys).length) delete node.keys;
    }
    return false;
  }
  const v = channelValue(node, ch, f);
  putKey(((node.keys ||= {})[ch] ||= []), f, v, arr?.length ? easeFor(arr, f) : 'in-out-cubic');
  return true;
}

export function cameraValue(sc, ch, f) {
  return evalChannel(sc.camera?.keys?.[ch], f, sc.camera?.base?.[ch] ?? CAMERA_DEFAULTS[ch]);
}

export function setCamera(sc, ch, v, f, autokey = S.autokey) {
  const cam = (sc.camera ||= {});
  const arr = cam.keys?.[ch];
  if (arr?.length) putKey(arr, f, v, easeFor(arr, f));
  else if (autokey) {
    const keys = (cam.keys ||= {});
    keys[ch] = [];
    const before = cam.base?.[ch] ?? CAMERA_DEFAULTS[ch];
    if (f > 0 && before !== v) putKey(keys[ch], 0, before, 'in-out-cubic');
    putKey(keys[ch], f, v, 'in-out-cubic');
  } else (cam.base ||= {})[ch] = v;
}

export function toggleCameraKey(sc, ch, f) {
  const cam = (sc.camera ||= {});
  const arr = cam.keys?.[ch];
  const k = arr?.find((q) => q.f === f);
  if (k) {
    arr.splice(arr.indexOf(k), 1);
    if (!arr.length) {
      (cam.base ||= {})[ch] = k.v;
      delete cam.keys[ch];
    }
    return;
  }
  putKey(((cam.keys ||= {})[ch] ||= []), f, cameraValue(sc, ch, f), arr?.length ? easeFor(arr, f) : 'in-out-cubic');
}

/** All key frames of a node (union over channels). */
export function nodeKeyFrames(node) {
  const set = new Set();
  for (const arr of Object.values(node.keys || {})) for (const k of arr) set.add(k.f);
  return [...set].sort((a, b) => a - b);
}

// ------------------------------------------------------------ history

const H = { undo: [], redo: [], pending: null, since: 0 };

// pointers currently pressed anywhere (a transaction left open with no pointer down is a leak)
const pressed = new Set();
window.addEventListener('pointerdown', (e) => pressed.add(e.pointerId), true);
window.addEventListener('pointerup', (e) => pressed.delete(e.pointerId), true);
window.addEventListener('pointercancel', (e) => pressed.delete(e.pointerId), true);
window.addEventListener('blur', () => pressed.clear());

export function begin() {
  if (H.pending === null && S.doc) {
    H.pending = JSON.stringify(S.doc);
    H.since = Date.now();
  }
}

/** Mark the document changed outside a transaction (still saved, no undo step). */
export function touch() {
  changed();
}

export function end() {
  if (H.pending === null) return false;
  const before = H.pending;
  H.pending = null;
  const now = JSON.stringify(S.doc);
  if (now === before) return false;
  H.undo.push(before);
  if (H.undo.length > 100) H.undo.shift();
  H.redo = [];
  changed();
  return true;
}

export const inTransaction = () => H.pending !== null;

/** One undoable change. */
export function edit(fn, parts = ALL) {
  begin();
  try {
    fn();
  } finally {
    end();
  }
  invalidate(...parts);
}

/** Continuous change (drag/scrub/typing): call commit() when done. */
export function live(fn, parts = ['view', 'overlay', 'timeline', 'values']) {
  begin();
  fn();
  invalidate(...parts);
}

export function commit(parts = ALL) {
  end();
  invalidate(...parts);
}

export function canUndo() {
  return H.undo.length > 0;
}
export function canRedo() {
  return H.redo.length > 0;
}

export function undo() {
  end();
  if (!H.undo.length) return;
  H.redo.push(JSON.stringify(S.doc));
  setDoc(JSON.parse(H.undo.pop()), { keepView: true });
  changed();
}

export function redo() {
  end();
  if (!H.redo.length) return;
  H.undo.push(JSON.stringify(S.doc));
  setDoc(JSON.parse(H.redo.pop()), { keepView: true });
  changed();
}

function changed() {
  S.version++;
  scheduleSave();
  emit('changed');
}

// ------------------------------------------------------------ loading

function patchProject(p) {
  // assets are workspace-relative paths in the studio (the server resolves them)
  p.asset = (path, type = 'image') => {
    for (const [id, a] of Object.entries(p.doc.assets)) if (a.path === path) return id;
    const base = String(path).split('/').pop().replace(/\.[^.]+$/, '');
    const id = p._newId(base);
    p.doc.assets[id] = { type, path };
    return id;
  };
  return p;
}

export function setDoc(doc, { keepView = false, file } = {}) {
  doc.scenes ||= [];
  doc.audio ||= [];
  doc.assets ||= {};
  doc.fonts ||= [];
  S.doc = doc;
  if (file !== undefined) S.file = file;
  S.proj = patchProject(new Project(doc, { root: '/' }));
  if (!doc.scenes.length) S.proj.scene('Scene 1', { duration: '3s' });
  S.renderer = new Renderer(doc, S.env);
  if (!keepView) {
    S.scene = 0;
    S.lf = 0;
    S.sel = { node: null, el: null, clip: null };
    S.keySel = null;
  }
  S.scene = Math.max(0, Math.min(S.scene, doc.scenes.length - 1));
  const sc = scene();
  S.lf = sc ? Math.max(0, Math.min(S.lf, sc.duration - 1)) : 0;
  if (S.sel.node && !locate(S.sel.node)) S.sel = { node: null, el: null, clip: null };
  if (S.sel.el) {
    const loc = locate(S.sel.node);
    if (!loc || !(loc.node.elements || []).some((e) => e.id === S.sel.el)) S.sel.el = null;
  }
  if (S.sel.clip && !doc.audio.some((c) => c.id === S.sel.clip)) S.sel.clip = null;
  S.keySel = null;
  S.version++;
  ensureMedia();
  emit('doc');
  invalidate(...ALL);
}

/** Load images and fonts referenced by the document. */
export function ensureMedia() {
  const doc = S.doc;
  for (const [id, a] of Object.entries(doc.assets || {})) {
    if (a.type !== 'image') continue;
    if (S.imagePaths.get(id) === a.path && S.env.images.has(id)) continue;
    S.imagePaths.set(id, a.path);
    const img = new Image();
    img.onload = () => {
      S.env.images.set(id, img);
      invalidate('view', 'overlay', 'scenes');
    };
    img.onerror = () => console.warn('gambar gagal dimuat', a.path);
    img.src = fileUrl(a.path);
  }
  for (const f of doc.fonts || []) {
    const key = `${f.family}|${f.path}|${f.weight ?? 400}`;
    if (S.loadedFonts.has(key)) continue;
    S.loadedFonts.add(key);
    const face = new FontFace(f.family, `url("${fileUrl(f.path)}")`, { weight: String(f.weight ?? 400), style: f.style ?? 'normal' });
    face
      .load()
      .then(() => {
        document.fonts.add(face);
        S.env.fontEpoch++;
        invalidate('view', 'overlay', 'scenes', 'inspector');
      })
      .catch((e) => console.warn('font gagal', f, e));
  }
}

export async function loadBundledFonts() {
  await Promise.all(
    S.info.fonts.map(async (f) => {
      try {
        const face = new FontFace(f.family, `url(${f.url})`, { weight: String(f.weight), style: f.style || 'normal' });
        await face.load();
        document.fonts.add(face);
      } catch (e) {
        console.warn('font gagal', f, e);
      }
    }),
  );
  S.env.fontEpoch++;
}

export async function openProject(file) {
  end();
  if (S.file && S.saveState !== 'saved') {
    await save();
    if (S.saveState !== 'saved') {
      const ok = await confirmBox('Perubahan di proyek ini belum tersimpan (server tidak merespons). Tetap buka proyek lain dan buang perubahan itu?', { ok: 'Buang & buka', danger: true });
      if (!ok) throw new Error('dibatalkan');
    }
  }
  const { doc } = await api.load(file);
  H.undo = [];
  H.redo = [];
  H.pending = null;
  S.locked = new Set();
  S.collapsed = new Set();
  setDoc(doc, { file });
  // land where the first scene shows its content (most things have animated in by then)
  const first = doc.scenes[0];
  if (first?.layers.length) S.lf = Math.min(first.duration - 1, Math.round(first.duration * 0.6));
  S.saveState = 'saved';
  lastThumb = 0;
  try {
    localStorage.setItem('gerak.studio.last', file);
  } catch {
    /* ignore */
  }
  const u = new URL(location.href);
  u.searchParams.set('p', file);
  history.replaceState(null, '', u);
  emit('opened');
}

// ------------------------------------------------------------ saving

let saveTimer = 0;
let saving = null;
let lastThumb = 0;

function setSaveState(s) {
  S.saveState = s;
  invalidate('top');
}

export function scheduleSave(ms = 1200) {
  if (!S.file) return;
  setSaveState('dirty');
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => save(), ms);
}

export async function save() {
  if (!S.file || !S.doc) return;
  clearTimeout(saveTimer);
  if (H.pending !== null) {
    // a transaction that outlived every pointer is a leak: close it so nothing is lost
    if (!pressed.size && Date.now() - H.since > 3000) end();
    else {
      // mid-drag: try again shortly
      setSaveState('dirty');
      saveTimer = setTimeout(() => save(), 500);
      return;
    }
  }
  if (saving) {
    await saving;
    if (S.saveState === 'saved') return;
  }
  const file = S.file;
  const body = JSON.parse(JSON.stringify(S.doc));
  const v = S.version;
  setSaveState('saving');
  saving = api
    .save(file, body)
    .then(() => {
      if (S.version === v) setSaveState('saved');
      else scheduleSave(600);
      if (Date.now() - lastThumb > 15000) {
        lastThumb = Date.now();
        emit('thumb');
      }
    })
    .catch((e) => {
      console.error(e);
      setSaveState('error');
      saveTimer = setTimeout(() => save(), 4000);
    })
    .finally(() => (saving = null));
  await saving;
}

// ------------------------------------------------------------ selection & time

export function select(sel) {
  S.sel = { node: null, el: null, clip: null, ...sel };
  S.keySel = null;
  emit('select');
  invalidate('overlay', 'timeline', 'inspector', 'sound', 'tools');
}

export function setFrame(lf, { sceneIdx } = {}) {
  if (sceneIdx !== undefined && sceneIdx !== S.scene) {
    S.scene = Math.max(0, Math.min(sceneIdx, S.doc.scenes.length - 1));
    emit('sceneChange');
    invalidate('scenes', 'inspector', 'timeline');
  }
  const sc = scene();
  if (!sc) return;
  S.lf = Math.max(0, Math.min(sc.duration - 1, Math.round(lf)));
  emit('frame');
  invalidate('view', 'overlay', 'timeline', 'values');
}

export function goScene(i) {
  if (!S.doc.scenes[i]) return;
  if (i !== S.scene) {
    S.sel = { node: null, el: null, clip: null };
    S.keySel = null;
  }
  setFrame(i === S.scene ? S.lf : 0, { sceneIdx: i });
  invalidate(...ALL);
}

/** Frames per second helper for UI code. */
export const f2s = (f) => f / S.doc.fps;
