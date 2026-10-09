// Canvas tools: select/move/scale/rotate, brush & eraser, text, shapes, image, hand.
import {
  S, on, emit, invalidate, scene, locate, selNode, selElement, select, setFrame, handleOf, sceneHandle,
  begin, end, commit, edit, live, channelValue, setChannel, replaceElement, inTransaction, touch,
} from './state.mjs';
import { V, stage, stagePoint, toDoc, zoomAt, zoomFit, zoomActual, layout, nodeScreenScale } from './view.mjs';
import { chain, hitTest, apply, applyVec, translateElement, nodeLocalBounds, rootParentMatrix, matScale, quad, autoPivot } from './geom.mjs';
import { drawStroke, BRUSHES } from '/core/brush.mjs';
import { h, iconBtn, btn, SWATCHES, toHex, esc } from './ui.mjs';
import { icon } from './icons.mjs';
import { fileUrl } from './api.mjs';

export const TOOLS = [
  { id: 'select', icon: 'select', key: 'v', label: 'Pilih & geser (V)' },
  { id: 'brush', icon: 'brush', key: 'b', label: 'Kuas (B)' },
  { id: 'eraser', icon: 'eraser', key: 'e', label: 'Penghapus (E)' },
  { id: 'text', icon: 'text', key: 't', label: 'Teks (T)' },
  { id: 'rect', icon: 'rect', key: 'r', label: 'Kotak (R)' },
  { id: 'ellipse', icon: 'ellipse', key: 'o', label: 'Lingkaran (O)' },
  { id: 'star', icon: 'star', key: 'p', label: 'Bintang (P)' },
  { id: 'line', icon: 'line', key: 'l', label: 'Garis (L)' },
  { id: 'arrow', icon: 'arrow', key: 'a', label: 'Panah (A)' },
  { id: 'image', icon: 'image', key: 'i', label: 'Gambar / foto (I)' },
  { id: 'hand', icon: 'hand', key: 'h', label: 'Geser kanvas (H)' },
];

export const BRUSH_LABELS = {
  pen: 'Pulpen',
  ink: 'Brush pen (tinta)',
  fineliner: 'Fineliner',
  marker: 'Spidol',
  highlighter: 'Stabilo',
  brush: 'Kuas tinta',
  dry: 'Kuas kering',
  pencil: 'Pensil',
  charcoal: 'Arang',
  chalk: 'Kapur',
  crayon: 'Krayon',
  airbrush: 'Airbrush',
  neon: 'Neon',
};

const SHAPE_TOOLS = new Set(['rect', 'ellipse', 'star', 'line', 'arrow']);
const r2 = (v) => Math.round(v * 100) / 100;
const DEG = Math.PI / 180;

export function setTool(id) {
  if (S.tool === id || D) return;
  S.tool = id;
  S.hover = null;
  stage.dataset.tool = id;
  emit('tool', id);
  invalidate('tools', 'overlay');
}

// ------------------------------------------------------------ helpers

function locked(node) {
  return S.locked.has(node.id);
}

function hit(sx, sy) {
  const [x, y] = toDoc(sx, sy);
  return hitTest(scene(), S.lf, S.doc, S.env, x, y, { tol: 6 / V.k, skip: locked });
}

function handleAt(sx, sy) {
  for (const hd of V.handles) if (Math.hypot(hd.x - sx, hd.y - sy) <= 8) return hd;
  return null;
}

/** Layer that receives brush strokes (selected stroke-only layer), optionally creating one. */
export function drawTarget(create) {
  const loc = selNode();
  if (loc && loc.sceneIdx === S.scene && loc.node.type === 'layer' && (loc.node.elements || []).every((e) => e.type === 'stroke')) return loc;
  if (!create) return null;
  const sc = scene();
  let n = 1;
  const names = new Set();
  sc.layers.forEach((l) => names.add(l.name));
  while (names.has(`Gambar ${n}`)) n++;
  const hd = sceneHandle(sc).layer(`Gambar ${n}`);
  S.sel = { node: hd.id, el: null, clip: null };
  return locate(hd.id);
}

export function newDrawLayer() {
  edit(() => {
    S.sel = { node: null, el: null, clip: null };
    drawTarget(true);
  });
  select({ node: S.sel.node });
}

function rootPoint(x, y) {
  const pm = rootParentMatrix(scene(), S.lf, S.doc);
  return apply(pm.inverse(), x, y);
}

function nameFor(base) {
  const names = new Set();
  const visit = (ns) => ns.forEach((n) => (names.add(n.name), visit(n.children || [])));
  visit(scene().layers);
  if (!names.has(base)) return base;
  let i = 2;
  while (names.has(`${base} ${i}`)) i++;
  return `${base} ${i}`;
}

// ------------------------------------------------------------ pointer handling

let D = null; // active drag
let spacePan = false;

function startPan(e, sx, sy) {
  D = { kind: 'pan', sx, sy, px: S.view.panX, py: S.view.panY };
  stage.setPointerCapture(e.pointerId);
}

function onDown(e) {
  if (!S.doc || !scene()) return;
  if (S.playing) return;
  // commit any field being edited in the panels before starting a canvas edit
  const active = document.activeElement;
  if (active && active !== document.body && /INPUT|TEXTAREA|SELECT/.test(active.tagName)) active.blur();
  end();
  const [sx, sy] = stagePoint(e);
  if (e.button === 1 || S.tool === 'hand' || spacePan) {
    e.preventDefault();
    return startPan(e, sx, sy);
  }
  if (e.button !== 0) return;
  stage.setPointerCapture(e.pointerId);
  const tool = S.tool;
  if (tool === 'select') return downSelect(e, sx, sy);
  if (tool === 'brush' || tool === 'eraser') return downBrush(e, sx, sy);
  if (tool === 'text') return downText(sx, sy);
  if (SHAPE_TOOLS.has(tool)) {
    const p = toDoc(sx, sy);
    D = { kind: 'shape', tool, a: p, b: p, sx, sy };
    return;
  }
  if (tool === 'image') {
    const p = toDoc(sx, sy);
    emit('pickImage', { at: p });
  }
}

function downSelect(e, sx, sy) {
  const hd = handleAt(sx, sy);
  const loc = selNode();
  if (hd && loc) return startTransform(hd.type, loc, sx, sy, e);
  const res = hit(sx, sy);
  if (!res) {
    D = { kind: 'none', sx, sy };
    return;
  }
  const ids = res.path.map((n) => n.id);
  const ci = ids.indexOf(S.sel.node);
  let drill = null;
  let target;
  if (ci === -1) {
    target = ids[0];
    select({ node: target });
  } else if (ci < ids.length - 1) {
    target = S.sel.node;
    drill = { node: ids[ci + 1] };
  } else {
    target = S.sel.node;
    const node = res.path.at(-1);
    if (S.sel.el && S.sel.el === res.el.id) {
      return startElementMove(locate(target), res.el, sx, sy);
    }
    if ((node.elements || []).length > 1) drill = { node: target, el: res.el.id };
  }
  startNodeMove(locate(target), sx, sy, drill, e.shiftKey);
}

function startNodeMove(loc, sx, sy, drill) {
  const ch = chain(loc.path, S.lf, loc.scene, S.doc);
  const c = ch.at(-1);
  const b = nodeLocalBounds(loc.node, S.lf, S.doc, S.env);
  let center = null;
  if (b) {
    const q = quad(b, c.world);
    center = [(q[0][0] + q[2][0]) / 2, (q[0][1] + q[2][1]) / 2];
  }
  D = {
    kind: 'move',
    loc,
    sx,
    sy,
    drill,
    moved: false,
    inv: c.parent.inverse(),
    x0: channelValue(loc.node, 'x', S.lf),
    y0: channelValue(loc.node, 'y', S.lf),
    center,
  };
}

function startElementMove(loc, el, sx, sy) {
  const ch = chain(loc.path, S.lf, loc.scene, S.doc);
  D = { kind: 'moveEl', loc, el0: el, cur: el, sx, sy, moved: false, inv: ch.at(-1).world.inverse() };
}

function startTransform(type, loc, sx, sy) {
  const [px, py] = V.pivot ?? [sx, sy];
  D = {
    kind: type,
    loc,
    sx,
    sy,
    px,
    py,
    moved: false,
    s0: channelValue(loc.node, 'scale', S.lf),
    r0: channelValue(loc.node, 'rotation', S.lf),
    d0: Math.max(4, Math.hypot(sx - px, sy - py)),
    a0: Math.atan2(sy - py, sx - px),
  };
}

/** On the first scale/rotate move: centre the pivot when that is invisible, and re-measure from it. */
function firstTransformMove() {
  begin();
  if (!autoPivot(D.loc.node, S.lf, S.doc, S.env)) return;
  const c = chain(D.loc.path, S.lf, D.loc.scene, S.doc).at(-1);
  const sm = new DOMMatrix([V.k, 0, 0, V.k, V.left, V.top]);
  const [px, py] = apply(sm.multiply(c.parent), c.t.x + c.t.pivotX, c.t.y + c.t.pivotY);
  D.px = px;
  D.py = py;
  D.d0 = Math.max(4, Math.hypot(D.sx - px, D.sy - py));
  D.a0 = Math.atan2(D.sy - py, D.sx - px);
}

function snapMove(dxDoc, dyDoc, shift) {
  if (shift) {
    if (Math.abs(dxDoc) > Math.abs(dyDoc)) dyDoc = 0;
    else dxDoc = 0;
  }
  V.guides = [];
  if (!D.center) return [dxDoc, dyDoc];
  const W = S.doc.width;
  const H = S.doc.height;
  const tol = 7 / V.k;
  const cx = D.center[0] + dxDoc;
  const cy = D.center[1] + dyDoc;
  if (Math.abs(cx - W / 2) < tol) {
    dxDoc += W / 2 - cx;
    V.guides.push({ x: W / 2 });
  }
  if (Math.abs(cy - H / 2) < tol) {
    dyDoc += H / 2 - cy;
    V.guides.push({ y: H / 2 });
  }
  return [dxDoc, dyDoc];
}

function onMove(e) {
  if (!S.doc) return;
  const [sx, sy] = stagePoint(e);
  S.pointer = [sx, sy];
  if (!D) {
    // hover feedback
    if (S.tool === 'select' && !S.playing && scene()) {
      const res = hit(sx, sy);
      const prev = S.hover;
      S.hover = res;
      const hd = handleAt(sx, sy);
      stage.style.cursor = hd ? (hd.type === 'rotate' ? 'grab' : 'nwse-resize') : res ? 'move' : '';
      if ((prev?.el?.id ?? null) !== (res?.el?.id ?? null)) invalidate('overlay');
    } else if (S.tool === 'brush' || S.tool === 'eraser') invalidate('overlay');
    return;
  }
  const dsx = sx - D.sx;
  const dsy = sy - D.sy;
  if (!D.moved && Math.hypot(dsx, dsy) < 3 && D.kind !== 'brush' && D.kind !== 'pan') return;
  switch (D.kind) {
    case 'pan':
      S.view.panX = D.px + dsx;
      S.view.panY = D.py + dsy;
      layout();
      break;
    case 'move': {
      if (!D.moved) begin();
      D.moved = true;
      const [ddx, ddy] = snapMove(dsx / V.k, dsy / V.k, e.shiftKey);
      const [lx, ly] = applyVec(D.inv, ddx, ddy);
      live(() => {
        setChannel(D.loc.node, 'x', r2(D.x0 + lx), S.lf);
        setChannel(D.loc.node, 'y', r2(D.y0 + ly), S.lf);
      });
      break;
    }
    case 'moveEl': {
      if (!D.moved) begin();
      D.moved = true;
      let ddx = dsx / V.k;
      let ddy = dsy / V.k;
      if (e.shiftKey) {
        if (Math.abs(ddx) > Math.abs(ddy)) ddy = 0;
        else ddx = 0;
      }
      const [lx, ly] = applyVec(D.inv, ddx, ddy);
      live(() => {
        D.cur = replaceElement(D.loc.node, D.cur, { ...translateElement(D.el0, lx, ly), id: D.el0.id });
      });
      break;
    }
    case 'scale': {
      if (!D.moved) firstTransformMove();
      D.moved = true;
      const d = Math.hypot(sx - D.px, sy - D.py);
      let s = D.s0 * (d / D.d0);
      if (e.shiftKey) s = Math.round(s * 10) / 10;
      live(() => setChannel(D.loc.node, 'scale', Math.round(Math.max(0.01, s) * 1000) / 1000, S.lf));
      break;
    }
    case 'rotate': {
      if (!D.moved) firstTransformMove();
      D.moved = true;
      const a = Math.atan2(sy - D.py, sx - D.px);
      let r = D.r0 + (a - D.a0) / DEG;
      if (e.shiftKey) r = Math.round(r / 15) * 15;
      live(() => setChannel(D.loc.node, 'rotation', Math.round(r * 10) / 10, S.lf));
      break;
    }
    case 'brush':
      for (const ev of e.getCoalescedEvents?.() ?? [e]) addBrushPoint(ev);
      invalidate('overlay');
      break;
    case 'shape': {
      D.moved = true;
      let b = toDoc(sx, sy);
      if (e.shiftKey) {
        const [ax, ay] = D.a;
        let dx = b[0] - ax;
        let dy = b[1] - ay;
        if (D.tool === 'line' || D.tool === 'arrow') {
          const ang = Math.round(Math.atan2(dy, dx) / (Math.PI / 4)) * (Math.PI / 4);
          const L = Math.hypot(dx, dy);
          dx = Math.cos(ang) * L;
          dy = Math.sin(ang) * L;
        } else {
          const m = Math.max(Math.abs(dx), Math.abs(dy));
          dx = Math.sign(dx || 1) * m;
          dy = Math.sign(dy || 1) * m;
        }
        b = [ax + dx, ay + dy];
      }
      D.b = b;
      invalidate('overlay');
      break;
    }
    default:
      break;
  }
}

function onUp(e) {
  if (!D) return;
  const d = D;
  D = null;
  try {
    stage.releasePointerCapture(e.pointerId);
  } catch {
    /* already released */
  }
  V.guides = [];
  switch (d.kind) {
    case 'none':
      select({});
      break;
    case 'move':
      if (d.moved) commit();
      else if (d.drill) select(d.drill);
      break;
    case 'moveEl':
    case 'scale':
    case 'rotate':
      if (d.moved) commit();
      break;
    case 'brush':
      finishBrush(d);
      break;
    case 'shape':
      finishShape(d);
      break;
    default:
      break;
  }
  invalidate('overlay');
}

function onDbl(e) {
  if (S.tool !== 'select' || !S.doc) return;
  const [sx, sy] = stagePoint(e);
  const res = hit(sx, sy);
  if (!res) return;
  const layer = res.path.at(-1);
  select({ node: layer.id, el: (layer.elements || []).length > 1 ? res.el.id : null });
  if (res.el.type === 'text') emit('focusText');
}

function onWheel(e) {
  if (!S.doc) return;
  e.preventDefault();
  const [sx, sy] = stagePoint(e);
  if (e.ctrlKey || e.metaKey) zoomAt(Math.exp(-e.deltaY * (e.deltaMode ? 0.05 : 0.0025)), sx, sy);
  else {
    S.view.panX -= e.deltaX;
    S.view.panY -= e.deltaY;
    layout();
  }
}

// ------------------------------------------------------------ brush

function brushOpts() {
  return BRUSHES[S.brush.name] ?? BRUSHES.ink;
}

function downBrush(e, sx, sy) {
  begin();
  const loc = drawTarget(true);
  const ch = chain(loc.path, S.lf, loc.scene, S.doc);
  const world = ch.at(-1).world;
  D = { kind: 'brush', loc, world, inv: world.inverse(), scale: matScale(world), pts: [], last: null, p: 0.55, erase: S.tool === 'eraser', sx, sy, moved: true };
  addBrushPoint(e);
  invalidate('overlay', 'timeline');
}

function addBrushPoint(ev) {
  const [sx, sy] = stagePoint(ev);
  const t = ev.timeStamp || performance.now();
  if (D.last) {
    const dist = Math.hypot(sx - D.last.sx, sy - D.last.sy);
    if (dist < 1.5) return;
    let p;
    if (ev.pointerType === 'pen' && ev.pressure > 0) p = ev.pressure;
    else {
      // mouse / touch: slower = thicker
      const v = dist / Math.max(1, t - D.last.t);
      const target = Math.max(0.28, Math.min(1, 1.08 - v * 0.33));
      p = D.p * 0.75 + target * 0.25;
    }
    D.p = p;
  } else if (ev.pointerType === 'pen' && ev.pressure > 0) D.p = ev.pressure;
  const [x, y] = apply(D.inv, ...toDoc(sx, sy));
  D.pts.push([r2(x), r2(y), Math.round(D.p * 100) / 100]);
  D.last = { sx, sy, t };
}

function strokeLen(pts) {
  let L = 0;
  for (let i = 1; i < pts.length; i++) L += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
  return L;
}

function finishBrush(d) {
  const pts = d.pts;
  if (!pts.length) {
    end();
    return;
  }
  if (pts.length === 1) pts.push([pts[0][0] + 0.6, pts[0][1] + 0.4, pts[0][2]]);
  // soften the first/last samples so mouse strokes taper naturally
  if (pts.length > 4) {
    pts[0][2] = Math.min(pts[0][2], 0.35);
    pts[pts.length - 1][2] = Math.min(pts[pts.length - 1][2], 0.4);
  }
  const hd = handleOf(d.loc);
  let advance = 0;
  if (d.erase) hd.erase(pts, { size: r2(S.brush.eraseSize / d.scale) });
  else {
    const opts = { brush: S.brush.name, size: r2(S.brush.size / d.scale), color: S.brush.color, seed: Math.floor(Math.random() * 1e6) };
    if (S.brush.appear === 'draw') {
      const len = strokeLen(pts) * d.scale;
      const dur = Math.max(4, Math.min(60, Math.round(len / (1500 / S.doc.fps))));
      opts.reveal = [S.lf, dur, 'in-out-sine'];
      if (S.brush.advance) advance = dur;
    }
    hd.stroke(pts, opts);
  }
  S.sel = { node: d.loc.node.id, el: null, clip: null };
  if (!end()) touch();
  if (advance) setFrame(Math.min(scene().duration - 1, S.lf + advance));
  invalidate('view', 'overlay', 'timeline', 'inspector', 'scenes', 'tools');
}

// ------------------------------------------------------------ text / shapes / image

export const TEXT_STYLES = {
  judul: { label: 'Judul tebal', make: (W, H) => ({ size: Math.round(Math.min(W, H) * 0.075), weight: 800, color: S.style.text }) },
  caption: { label: 'Caption (kotak)', make: (W, H) => ({ size: Math.round(Math.min(W, H) * 0.052), weight: 800, color: '#ffffff', box: { color: 'rgba(0,0,0,0.78)', mode: 'line' } }) },
  outline: { label: 'Tepi hitam', make: (W, H) => ({ size: Math.round(Math.min(W, H) * 0.068), weight: 800, color: '#ffffff', stroke: '#111111', strokeWidth: Math.max(4, Math.round(Math.min(W, H) * 0.008)) }) },
  tangan: { label: 'Tulisan tangan', make: (W, H) => ({ font: 'Caveat', size: Math.round(Math.min(W, H) * 0.09), weight: 700, color: S.style.text }) },
  biasa: { label: 'Paragraf', make: (W, H) => ({ size: Math.round(Math.min(W, H) * 0.042), weight: 500, color: S.style.text, lineHeight: 1.35 }) },
};

function downText(sx, sy) {
  // clicking an existing text edits it instead of stacking a new one
  const res = hit(sx, sy);
  if (res && res.el.type === 'text') {
    const layer = res.path.at(-1);
    select({ node: layer.id, el: (layer.elements || []).length > 1 ? res.el.id : null });
    setTool('select');
    emit('focusText', { selectAll: false });
    return;
  }
  const [x, y] = rootPoint(...toDoc(sx, sy));
  const W = S.doc.width;
  const H = S.doc.height;
  const style = (TEXT_STYLES[S.textStyle] ?? TEXT_STYLES.judul).make(W, H);
  let id;
  edit(() => {
    const hd = sceneHandle().layer(nameFor('Teks'), { x: r2(x), y: r2(y) });
    hd.text('Teks baru', 0, 0, { align: 'center', valign: 'middle', maxWidth: Math.round(W * 0.82), ...style });
    id = hd.id;
  });
  select({ node: id });
  setTool('select');
  emit('focusText', { selectAll: true });
}

function finishShape(d) {
  const tool = d.tool;
  const W = S.doc.width;
  const H = S.doc.height;
  let [ax, ay] = rootPoint(...d.a);
  let [bx, by] = rootPoint(...d.b);
  if (Math.hypot(bx - ax, by - ay) < 6) {
    const s = Math.min(W, H) * 0.28;
    if (tool === 'line' || tool === 'arrow') {
      ax -= s / 2;
      bx = ax + s;
      by = ay;
    } else {
      ax -= s / 2;
      ay -= s / 2;
      bx = ax + s;
      by = ay + s;
    }
  }
  const cx = r2((ax + bx) / 2);
  const cy = r2((ay + by) / 2);
  const w = r2(Math.abs(bx - ax));
  const hh = r2(Math.abs(by - ay));
  const names = { rect: 'Kotak', ellipse: 'Lingkaran', star: 'Bintang', line: 'Garis', arrow: 'Panah' };
  let id;
  edit(() => {
    const hd = sceneHandle().layer(nameFor(names[tool]), { x: cx, y: cy });
    const fill = S.style.fill;
    if (tool === 'rect') hd.rect(-w / 2, -hh / 2, w, hh, { fill, r: Math.round(Math.min(w, hh) * 0.08) });
    else if (tool === 'ellipse') hd.ellipse(0, 0, w / 2, hh / 2, { fill });
    else if (tool === 'star') {
      const r = Math.max(w, hh) / 2;
      hd.star(0, 0, r2(r), r2(r * 0.45), 5, { fill });
    } else {
      const st = { stroke: S.style.stroke, strokeWidth: S.style.strokeWidth };
      const coords = [r2(ax - cx), r2(ay - cy), r2(bx - cx), r2(by - cy)];
      if (tool === 'line') hd.line(...coords, st);
      else hd.arrow(...coords, { ...st, head: Math.max(18, S.style.strokeWidth * 3.2) });
    }
    id = hd.id;
  });
  select({ node: id });
  setTool('select');
}

/** Place an image asset (workspace path) on the canvas. at = doc point (default centre). */
export function placeImage(path, at) {
  const W = S.doc.width;
  const H = S.doc.height;
  const img = new Image();
  img.onload = () => {
    const [x, y] = rootPoint(...(at ?? [W / 2, H / 2]));
    const iw = img.naturalWidth || 400;
    const ih = img.naturalHeight || 300;
    const maxW = W * 0.7;
    const maxH = H * 0.6;
    const k = Math.min(1, maxW / iw, maxH / ih);
    let id;
    edit(() => {
      const base = path.split('/').pop().replace(/\.[^.]+$/, '');
      const hd = sceneHandle().layer(nameFor(base.slice(0, 24) || 'Gambar'), { x: r2(x), y: r2(y) });
      const ref = hd.image(path, 0, 0, { width: Math.round(iw * k), height: Math.round(ih * k), anchor: 'center' });
      const assetId = ref.el.src;
      S.env.images.set(assetId, img);
      S.imagePaths.set(assetId, path);
      id = hd.id;
    });
    select({ node: id });
    setTool('select');
  };
  img.onerror = () => emit('toast', ['Gambar gagal dimuat', 'err']);
  img.src = fileUrl(path);
}

// ------------------------------------------------------------ overlay previews

V.hooks.push((ctx, sm) => {
  if (!S.doc) return;
  if (D?.kind === 'brush' && D.pts.length) {
    const m = sm.multiply(D.world);
    ctx.setTransform(V.dpr * m.a, V.dpr * m.b, V.dpr * m.c, V.dpr * m.d, V.dpr * m.e, V.dpr * m.f);
    if (D.erase) {
      ctx.globalAlpha = 0.45;
      drawStroke(ctx, S.env, { type: 'stroke', brush: 'marker', size: S.brush.eraseSize / D.scale, color: '#ff6b6b', points: D.pts, seed: 1, noCache: true }, 1);
    } else {
      drawStroke(ctx, S.env, { type: 'stroke', brush: S.brush.name, size: S.brush.size / D.scale, color: S.brush.color, points: D.pts, seed: 1, noCache: true }, 1);
    }
    return;
  }
  if (D?.kind === 'shape') {
    const [ax, ay] = apply(sm, ...D.a);
    const [bx, by] = apply(sm, ...D.b);
    ctx.strokeStyle = '#00B7B3';
    ctx.fillStyle = 'rgba(0,183,179,0.15)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    if (D.tool === 'rect') ctx.rect(Math.min(ax, bx), Math.min(ay, by), Math.abs(bx - ax), Math.abs(by - ay));
    else if (D.tool === 'ellipse' || D.tool === 'star') ctx.ellipse((ax + bx) / 2, (ay + by) / 2, Math.abs(bx - ax) / 2 || 1, Math.abs(by - ay) / 2 || 1, 0, 0, Math.PI * 2);
    else {
      ctx.moveTo(ax, ay);
      ctx.lineTo(bx, by);
    }
    ctx.fill();
    ctx.stroke();
    return;
  }
  if ((S.tool === 'brush' || S.tool === 'eraser') && S.pointer && !S.playing) {
    const loc = drawTarget(false);
    const k = loc ? nodeScreenScale(loc) / matScale(chain(loc.path, S.lf, loc.scene, S.doc).at(-1).world) : V.k;
    const size = S.tool === 'eraser' ? S.brush.eraseSize : S.brush.size;
    const r = Math.max(1.5, (size * k) / 2);
    const [x, y] = S.pointer;
    ctx.strokeStyle = 'rgba(255,255,255,0.9)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(0,0,0,0.5)';
    ctx.beginPath();
    ctx.arc(x, y, r + 1, 0, Math.PI * 2);
    ctx.stroke();
  }
});

// ------------------------------------------------------------ tool rail & options bar

const rail = document.getElementById('toolrail');
const optbar = document.getElementById('optbar');

function buildRail() {
  rail.innerHTML = '';
  for (const t of TOOLS) {
    const b = h('button.tool', { title: t.label, 'aria-label': t.label, html: icon(t.icon, 20), dataset: { tool: t.id } });
    b.addEventListener('click', () => setTool(t.id));
    rail.append(b);
    if (t.id === 'eraser' || t.id === 'arrow' || t.id === 'image') rail.append(h('div.railsep'));
  }
}

function syncRail() {
  for (const b of rail.querySelectorAll('.tool')) b.classList.toggle('on', b.dataset.tool === S.tool);
}

function colorChip(get, set) {
  const pick = h('input.color', { type: 'color', value: toHex(get()), title: 'Warna' });
  pick.addEventListener('input', () => set(pick.value));
  const wrap = h('div.chips.nowrap', {}, pick, SWATCHES.slice(0, 6).map((c) => h('button.sw', { type: 'button', title: c, style: { background: c }, onclick: () => (set(c), (pick.value = toHex(c))) })));
  return wrap;
}

function rangeNum(label, get, set, min, max, step = 1) {
  const rng = h('input.range', { type: 'range', min, max, step, value: get() });
  const num = h('input.num.small', { type: 'text', value: get() });
  rng.addEventListener('input', () => {
    set(+rng.value);
    num.value = rng.value;
  });
  num.addEventListener('change', () => {
    const v = Math.max(min, Math.min(max, +num.value || get()));
    set(v);
    rng.value = v;
    num.value = v;
  });
  return h('label.opt', {}, h('span', {}, label), rng, num);
}

function viewToggles() {
  const tg = (key, ic, title) => {
    const b = iconBtn(ic, title, () => {
      S.view[key] = !S.view[key];
      b.classList.toggle('on', S.view[key]);
      invalidate('view', 'overlay');
    });
    b.classList.toggle('on', !!S.view[key]);
    return b;
  };
  return h('div.viewtg', {}, tg('grid', 'grid', 'Grid sepertiga (G)'), tg('safe', 'safe', 'Area aman TikTok/Reels (S)'), tg('onion', 'onion', 'Onion skin: lihat frame sebelum/sesudah (O+Shift)'));
}

function buildOptbar() {
  optbar.innerHTML = '';
  const t = S.tool;
  const left = h('div.optleft');
  if (t === 'brush' || t === 'eraser') {
    if (t === 'brush') {
      const sel = h('select.sel', { title: 'Jenis kuas' });
      for (const [k, label] of Object.entries(BRUSH_LABELS)) sel.append(h('option', { value: k }, label));
      sel.value = S.brush.name;
      sel.addEventListener('change', () => {
        S.brush.name = sel.value;
        S.brush.size = BRUSHES[sel.value].size;
        buildOptbar();
        sel.blur();
      });
      left.append(sel);
      left.append(rangeNum('Ukuran', () => S.brush.size, (v) => (S.brush.size = v), 1, 160));
      left.append(colorChip(() => S.brush.color, (c) => (S.brush.color = c)));
      const appear = h('select.sel', { title: 'Cara coretan muncul di video' });
      appear.append(h('option', { value: 'instant' }, 'Langsung ada'), h('option', { value: 'draw' }, 'Tergambar (animasi)'));
      appear.value = S.brush.appear;
      appear.addEventListener('change', () => {
        S.brush.appear = appear.value;
        buildOptbar();
        appear.blur();
      });
      left.append(appear);
      if (S.brush.appear === 'draw') {
        const cb = h('input', { type: 'checkbox', checked: S.brush.advance });
        cb.addEventListener('change', () => (S.brush.advance = cb.checked));
        left.append(h('label.opt.check', { title: 'Setelah satu coretan, playhead maju sepanjang durasi coretan itu — coretan berikutnya tergambar sesudahnya' }, cb, h('span', {}, 'Maju otomatis')));
      }
    } else {
      left.append(rangeNum('Ukuran', () => S.brush.eraseSize, (v) => (S.brush.eraseSize = v), 4, 300));
    }
    const target = drawTarget(false);
    left.append(
      h('span.tag.layerbtn', { title: target ? `Coretan masuk ke layer “${target.node.name}”` : 'Coretan pertama otomatis membuat layer gambar baru' }, target ? target.node.name : 'layer baru'),
      iconBtn('plus', 'Layer gambar baru: coretan berikutnya masuk ke layer terpisah (bisa dianimasikan sendiri)', () => newDrawLayer()),
    );
  } else if (t === 'text') {
    const st = h('select.sel', { title: 'Gaya teks baru' });
    for (const [k, v] of Object.entries(TEXT_STYLES)) st.append(h('option', { value: k }, v.label));
    st.value = S.textStyle ?? 'judul';
    st.addEventListener('change', () => {
      S.textStyle = st.value;
      st.blur();
    });
    left.append(h('label.opt', {}, h('span', {}, 'Gaya'), st), colorChip(() => S.style.text, (c) => (S.style.text = c)), h('span.opthint', {}, 'Klik di kanvas untuk menaruh teks, lalu ketik.'));
  } else if (SHAPE_TOOLS.has(t)) {
    if (t === 'line' || t === 'arrow') {
      left.append(h('span.opthint', {}, 'Tarik untuk menggambar. Shift = lurus 45°.'), colorChip(() => S.style.stroke, (c) => (S.style.stroke = c)));
      left.append(rangeNum('Tebal', () => S.style.strokeWidth, (v) => (S.style.strokeWidth = v), 1, 60));
    } else {
      left.append(h('span.opthint', {}, 'Tarik untuk menggambar. Shift = sama sisi.'), colorChip(() => S.style.fill, (c) => (S.style.fill = c)));
    }
  } else if (t === 'image') {
    left.append(h('span.opthint', {}, 'Klik di kanvas untuk menaruh gambar, atau seret file gambar ke kanvas.'), btn('Pilih gambar…', () => emit('pickImage', {}), 'small', 'image'));
  } else if (t === 'hand') {
    left.append(h('span.opthint', {}, 'Tarik untuk menggeser kanvas. Ctrl + scroll untuk zoom.'));
  } else {
    const loc = selNode();
    if (loc) {
      left.append(
        h('span.optname', { html: `${icon(loc.node.type === 'group' ? 'group' : loc.node.type === 'track' ? 'track' : 'layer', 15)} ${esc(loc.node.name)}${S.sel.el ? ` <em>› ${esc(S.sel.el)}</em>` : ''}` }),
        btn('Duplikat', () => emit('cmd', 'duplicate'), 'small ghost', 'copy'),
        btn('Hapus', () => emit('cmd', 'delete'), 'small ghost', 'trash'),
        btn('Ke depan', () => emit('cmd', 'raise'), 'small ghost', 'up'),
        btn('Ke belakang', () => emit('cmd', 'lower'), 'small ghost', 'down'),
      );
      left.append(h('span.opthint', {}, S.sel.el ? 'Geser = pindah elemen ini saja · Esc = kembali ke layer' : 'Seret = geser · kotak sudut = skala · bulatan atas = putar · klik lagi = elemen di dalamnya'));
    } else left.append(h('span.opthint', {}, 'Klik objek untuk memilih. Pilih alat di kiri untuk menggambar, menulis teks, atau menaruh bentuk.'));
  }
  optbar.append(left, viewToggles());
}

// ------------------------------------------------------------ zoom control

const zoomctl = document.getElementById('zoomctl');
function buildZoom() {
  zoomctl.innerHTML = '';
  const pct = h('button.zpct', { title: 'Ukuran asli (1:1)', onclick: () => zoomActual() }, `${Math.round(V.k * 100)}%`);
  zoomctl.append(iconBtn('zoomOut', 'Perkecil', () => zoomAt(1 / 1.25)), pct, iconBtn('zoomIn', 'Perbesar', () => zoomAt(1.25)), iconBtn('fit', 'Pas layar (F)', () => zoomFit()));
}

// ------------------------------------------------------------ drag & drop files onto the stage

stage.addEventListener('dragover', (e) => {
  if ([...(e.dataTransfer?.types || [])].includes('Files')) {
    e.preventDefault();
    stage.classList.add('drop');
  }
});
stage.addEventListener('dragleave', () => stage.classList.remove('drop'));
stage.addEventListener('drop', (e) => {
  e.preventDefault();
  stage.classList.remove('drop');
  const files = [...(e.dataTransfer?.files || [])];
  if (!files.length || !S.doc) return;
  const at = toDoc(...stagePoint(e));
  emit('dropFiles', { files, at });
});

// ------------------------------------------------------------ wiring

stage.addEventListener('pointerdown', onDown);
stage.addEventListener('pointermove', onMove);
stage.addEventListener('pointerup', onUp);
stage.addEventListener('pointercancel', onUp);
stage.addEventListener('pointerleave', () => {
  S.pointer = null;
  if (S.hover) {
    S.hover = null;
    invalidate('overlay');
  }
});
stage.addEventListener('dblclick', onDbl);
stage.addEventListener('wheel', onWheel, { passive: false });
stage.addEventListener('contextmenu', (e) => e.preventDefault());

window.addEventListener('keydown', (e) => {
  if (e.code === 'Space' && S.tool !== 'hand' && e.target === document.body && e.altKey) spacePan = true;
});
window.addEventListener('keyup', (e) => {
  if (e.code === 'Space') spacePan = false;
});

on('refresh', (f) => {
  if (f.has('tools') || f.has('inspector')) {
    syncRail();
    buildOptbar();
  }
  if (f.has('zoom')) buildZoom();
});

export function initTools() {
  buildRail();
  syncRail();
  buildOptbar();
  buildZoom();
  stage.dataset.tool = S.tool;
}

export const isDragging = () => D !== null || inTransaction();
