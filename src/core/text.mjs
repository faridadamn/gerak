// Text layout and animated text drawing. Isomorphic (uses only Canvas2D measureText/fillText).
import { resolveEase } from './easing.mjs';
import { makePaint, applyShadow, clearShadow } from './paint.mjs';
import { clamp, lerp } from './util.mjs';
import { mixColor } from './color.mjs';
import { rng } from './rng.mjs';

export const DEFAULT_FONT = 'Plus Jakarta Sans';
const FALLBACKS = 'Plus Jakarta Sans, Arial, Helvetica, sans-serif';

export function fontString(el, sizeOverride) {
  const size = sizeOverride ?? el.size ?? 48;
  const weight = el.weight ?? 400;
  const style = el.italic ? 'italic ' : '';
  const fams = String(el.font ?? DEFAULT_FONT)
    .split(',')
    .map((f) => f.trim())
    .filter(Boolean)
    .concat(FALLBACKS.split(',').map((f) => f.trim()));
  const uniq = [...new Set(fams)].map((f) => (/^(serif|sans-serif|monospace|cursive|fantasy|system-ui)$/.test(f) ? f : `"${f}"`));
  return `${style}${weight} ${size}px ${uniq.join(', ')}`;
}

function applyCase(text, el) {
  if (el.case === 'upper') return text.toUpperCase();
  if (el.case === 'lower') return text.toLowerCase();
  return text;
}

const layoutCache = new WeakMap();

/**
 * Lay out text into lines and measured units.
 * Returns { lines:[{text, width, baseline, x0, chars:[{ch,x,w}], words:[{text,x,w,c0,c1,index}]}], cap, asc, desc, lineH, width, height }
 * Coordinates are relative to the element (x,y) anchor.
 */
export function layoutText(ctx, el, textOverride, epoch = 0) {
  let perEl = layoutCache.get(el);
  if (!perEl || perEl.epoch !== epoch) {
    perEl = { epoch, map: new Map() };
    layoutCache.set(el, perEl);
  }
  const raw = applyCase(String(textOverride ?? el.text ?? ''), el);
  const hit = perEl.map.get(raw);
  if (hit) return hit;

  const size = el.size ?? 48;
  const ls = el.letterSpacing ?? 0;
  const font = fontString(el);
  ctx.save();
  ctx.font = font;
  if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';
  const measure = (s) => (s.length ? ctx.measureText(s).width + ls * s.length : 0);
  const mH = ctx.measureText('H');
  const mg = ctx.measureText('Hgjpqy');
  const cap = mH.actualBoundingBoxAscent || size * 0.72;
  const asc = mg.actualBoundingBoxAscent || size * 0.78;
  const desc = mg.actualBoundingBoxDescent || size * 0.22;
  const lineH = (el.lineHeight ?? 1.2) * size;
  const maxW = el.maxWidth ?? Infinity;

  // wrap
  const lines = [];
  let wordIndex = 0;
  for (const para of raw.split('\n')) {
    const words = para.split(/ +/);
    let cur = '';
    const flush = () => {
      lines.push(cur);
      cur = '';
    };
    for (const w of words) {
      const cand = cur ? `${cur} ${w}` : w;
      if (cur && measure(cand) - ls > maxW) {
        flush();
        cur = w;
      } else cur = cand;
    }
    flush();
  }
  const align = el.align ?? 'left';
  const out = [];
  let blockW = 0;
  lines.forEach((text, li) => {
    const chars = [];
    // prefix measurement keeps kerning
    for (let i = 0; i < text.length; i++) {
      const x = measure(text.slice(0, i));
      const w = measure(text.slice(0, i + 1)) - x;
      chars.push({ ch: text[i], x, w });
    }
    const width = Math.max(0, measure(text) - (text.length ? ls : 0));
    const words = [];
    const re = /\S+/g;
    let m;
    while ((m = re.exec(text))) {
      const c0 = m.index;
      const c1 = m.index + m[0].length;
      const x = chars[c0].x;
      const w = chars[c1 - 1].x + chars[c1 - 1].w - x - ls;
      words.push({ text: m[0], x, w, c0, c1, index: wordIndex++ });
    }
    const x0 = align === 'center' ? -width / 2 : align === 'right' ? -width : 0;
    out.push({ text, width, x0, baseline: li * lineH, chars, words, index: li });
    blockW = Math.max(blockW, width);
  });
  ctx.restore();

  // vertical anchoring
  const n = out.length;
  const blockH = (n - 1) * lineH + cap;
  const valign = el.valign ?? 'baseline';
  let first;
  if (valign === 'top') first = cap;
  else if (valign === 'middle') first = -blockH / 2 + cap;
  else if (valign === 'bottom') first = -(n - 1) * lineH;
  else first = 0;
  for (const l of out) l.baseline += first;
  const res = {
    lines: out,
    cap,
    asc,
    desc,
    lineH,
    width: blockW,
    height: blockH,
    font,
    bounds: {
      x: align === 'center' ? -blockW / 2 : align === 'right' ? -blockW : 0,
      y: first - asc,
      width: blockW,
      height: (n - 1) * lineH + asc + desc,
    },
    wordCount: wordIndex,
    charCount: out.reduce((s, l) => s + l.text.length, 0),
  };
  if (perEl.map.size > 64) perEl.map.clear();
  perEl.map.set(raw, res);
  return res;
}

// ------------------------------------------------------------ animation helpers

function unitProgress(spec, index, count, f) {
  const at = spec.at ?? 0;
  const dur = Math.max(0.0001, spec.dur ?? 10);
  let stagger = spec.stagger ?? 3;
  if (spec.span !== undefined && count > 1) stagger = Math.max(0, (spec.span - dur) / (count - 1));
  const order = spec.order === 'reverse' ? count - 1 - index : spec.order === 'center' ? Math.abs(index - (count - 1) / 2) : spec.order === 'random' ? rng(`${spec.seed ?? 1}:${index}`)() * count : index;
  const start = at + order * stagger;
  return clamp((f - start) / dur, 0, 1);
}

function effectState(effect, p, distance, easeSpec) {
  const e = resolveEase(easeSpec ?? (effect === 'pop' || effect === 'stamp' ? 'out-back' : 'out-cubic'));
  const q = e(p);
  const s = { alpha: clamp(p * 1.6, 0, 1), dx: 0, dy: 0, scale: 1, rot: 0, blur: 0 };
  switch (effect) {
    case 'fade':
      s.alpha = e(p);
      break;
    case 'rise':
      s.dy = (1 - q) * distance;
      break;
    case 'drop':
      s.dy = -(1 - q) * distance;
      break;
    case 'slide':
    case 'slide-left':
      s.dx = (1 - q) * distance;
      break;
    case 'slide-right':
      s.dx = -(1 - q) * distance;
      break;
    case 'pop':
      s.scale = lerp(0.3, 1, q);
      break;
    case 'stamp':
      s.scale = lerp(2.2, 1, q);
      s.alpha = clamp(p * 3, 0, 1);
      break;
    case 'blur':
      s.blur = (1 - q) * 12;
      s.alpha = e(p);
      break;
    case 'spin':
      s.rot = (1 - q) * -90;
      s.scale = lerp(0.5, 1, q);
      break;
    case 'none':
      s.alpha = p > 0 ? 1 : 0;
      break;
    default:
      s.dy = (1 - q) * distance;
  }
  return s;
}

const SCRAMBLE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&*+=?';

function formatNumber(v, a) {
  const dec = a.decimals ?? 0;
  let s = Math.abs(v).toFixed(dec);
  let [int, frac] = s.split('.');
  const sep = a.separator ?? '.';
  int = int.replace(/\B(?=(\d{3})+(?!\d))/g, sep);
  s = frac ? `${int}${a.decimal ?? ','}${frac}` : int;
  return `${v < 0 ? '-' : ''}${a.prefix ?? ''}${s}${a.suffix ?? ''}`;
}

/** Resolve the string to display at frame f (typewriter count / counter / scramble). */
function displayText(el, f, fps) {
  const a = el.anim;
  if (!a) return { text: el.text ?? '' };
  if (a.type === 'count') {
    const p = clamp((f - (a.at ?? 0)) / Math.max(0.0001, a.dur ?? fps), 0, 1);
    const v = lerp(a.from ?? 0, a.to ?? 100, resolveEase(a.ease ?? 'out-cubic')(p));
    return { text: formatNumber(v, a) };
  }
  return { text: el.text ?? '' };
}

/**
 * Draw a text element at local frame f.
 */
export function drawText(ctx, env, el, f, fps) {
  const { text } = displayText(el, f, fps);
  const L = layoutText(ctx, el, text, env.fontEpoch ?? 0);
  if (!L.lines.length) return;
  const a = el.anim && el.anim.type !== 'count' ? el.anim : null;
  const ex = el.exit || null;
  const ls = el.letterSpacing ?? 0;
  ctx.save();
  ctx.translate(el.x ?? 0, el.y ?? 0);
  // fit: shrink to a maximum width (useful for counters and dynamic text)
  if (el.fit && L.width > el.fit) ctx.scale(el.fit / L.width, el.fit / L.width);
  ctx.font = L.font;
  if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'left';
  const bounds = L.bounds;
  const fill = makePaint(ctx, el.color ?? '#111111', bounds);
  const strokePaint = el.stroke ? makePaint(ctx, el.stroke, bounds) : null;

  // granularity
  const unitKind = (spec) => (spec ? (spec.type === 'words' || spec.type === 'karaoke' ? 'words' : spec.type === 'lines' ? 'lines' : 'chars') : null);
  const needChars = ls !== 0 || a?.type === 'typewriter' || a?.type === 'scramble' || unitKind(a) === 'chars' || unitKind(ex) === 'chars';
  const totalWords = L.wordCount;
  const totalChars = L.charCount;

  // typewriter: number of visible chars
  let visibleChars = Infinity;
  if (a?.type === 'typewriter') {
    const dur = a.dur ?? (totalChars / (a.cps ?? 20)) * fps;
    const p = clamp((f - (a.at ?? 0)) / Math.max(0.0001, dur), 0, 1);
    visibleChars = Math.floor(p * totalChars + 1e-6);
  }
  let scrambleResolved = Infinity;
  let scrambleRng = null;
  if (a?.type === 'scramble') {
    const dur = a.dur ?? fps;
    const p = clamp((f - (a.at ?? 0)) / Math.max(0.0001, dur), 0, 1);
    if (f < (a.at ?? 0)) visibleChars = 0;
    scrambleResolved = Math.floor(p * totalChars);
    scrambleRng = rng(`${el.seed ?? 0}:${Math.floor(f / Math.max(1, Math.round(fps / 15)))}`);
  }

  // highlights / boxes behind text
  if (el.box) {
    // the background box appears with the first unit and leaves with the last one
    let ba = 1;
    const count = (spec) => (unitKind(spec) === 'words' ? totalWords : unitKind(spec) === 'lines' ? L.lines.length : totalChars);
    if (a && (a.type === 'typewriter' || a.type === 'scramble')) ba = f >= (a.at ?? 0) ? 1 : 0;
    else if (a && a.type !== 'karaoke') ba = clamp(unitProgress(a, 0, count(a), f) * 2.5, 0, 1);
    if (ex) ba *= 1 - unitProgress(ex, count(ex) - 1, count(ex), f);
    if (ba > 0.001) {
      ctx.save();
      ctx.globalAlpha *= ba;
      drawBoxes(ctx, el, L);
      ctx.restore();
    }
  }
  if (el.highlight) drawHighlights(ctx, el, L, f, fps, false);

  const unitState = (kind, index, count) => {
    let st = { alpha: 1, dx: 0, dy: 0, scale: 1, rot: 0, blur: 0 };
    if (a && unitKind(a) === kind && a.type !== 'typewriter' && a.type !== 'scramble' && a.type !== 'karaoke') {
      st = effectState(a.effect ?? 'rise', unitProgress(a, index, count, f), a.distance ?? (el.size ?? 48) * 0.6, a.ease);
    }
    if (ex && unitKind(ex) === kind) {
      const p = unitProgress(ex, index, count, f);
      if (p > 0) {
        const o = effectState(ex.effect ?? 'fade', 1 - p, -(ex.distance ?? (el.size ?? 48) * 0.6), ex.ease ?? 'in-cubic');
        st = { alpha: st.alpha * o.alpha, dx: st.dx + o.dx, dy: st.dy + o.dy, scale: st.scale * o.scale, rot: st.rot + o.rot, blur: Math.max(st.blur, o.blur) };
      }
    }
    return st;
  };

  const karaokeColor = (wordIndex) => {
    if (a?.type !== 'karaoke') return null;
    const times = a.times || [];
    const t = times[wordIndex];
    if (t === undefined || f < t) return a.dim ?? null;
    return a.color ?? '#FFD400';
  };
  const karaokeScale = (wordIndex) => {
    if (a?.type !== 'karaoke' || !a.scale) return 1;
    const times = a.times || [];
    const t = times[wordIndex];
    const next = times[wordIndex + 1] ?? t + fps * 0.5;
    if (t === undefined || f < t || f >= next) return 1;
    const p = clamp((f - t) / 4, 0, 1);
    return 1 + (a.scale - 1) * resolveEase('out-back')(p);
  };

  const shadowFirst = el.shadow ? true : false;
  const paintUnit = (str, x, y, st, color, extraScale = 1, uw) => {
    if (st.alpha <= 0.001 || !str.trim()) return;
    ctx.save();
    ctx.globalAlpha *= st.alpha;
    const w = uw ?? ctx.measureText(str).width;
    const cx = x + w / 2;
    const cy = y - L.cap / 2;
    const sc = st.scale * extraScale;
    if (st.dx || st.dy || sc !== 1 || st.rot) {
      ctx.translate(cx + st.dx, cy + st.dy);
      if (st.rot) ctx.rotate((st.rot * Math.PI) / 180);
      if (sc !== 1) ctx.scale(sc, sc);
      ctx.translate(-cx, -cy);
    }
    if (st.blur > 0.05) {
      const k = Math.hypot(ctx.getTransform().a, ctx.getTransform().b);
      ctx.filter = `blur(${(st.blur * k).toFixed(2)}px)`;
    }
    if (shadowFirst) applyShadow(ctx, el.shadow);
    if (strokePaint) {
      ctx.lineJoin = 'round';
      ctx.miterLimit = 2;
      ctx.lineWidth = (el.strokeWidth ?? 4) * 2;
      ctx.strokeStyle = strokePaint;
      ctx.strokeText(str, x, y);
      if (shadowFirst) clearShadow(ctx);
    }
    ctx.fillStyle = color ?? fill;
    ctx.fillText(str, x, y);
    ctx.restore();
  };

  let charCounter = 0;
  for (const line of L.lines) {
    const by = line.baseline;
    const lineSt = unitState('lines', line.index, L.lines.length);
    if (needChars) {
      line.chars.forEach((c, ci) => {
        const gi = charCounter + ci;
        if (gi >= visibleChars) return;
        let ch = c.ch;
        if (scrambleRng && gi >= scrambleResolved && ch.trim()) ch = SCRAMBLE[(scrambleRng() * SCRAMBLE.length) | 0];
        const wordIdx = line.words.find((w) => ci >= w.c0 && ci < w.c1);
        let st = unitState('chars', gi, totalChars);
        if (wordIdx) {
          const ws = unitState('words', wordIdx.index, totalWords);
          st = merge(st, ws);
        }
        st = merge(st, lineSt);
        const kc = wordIdx ? karaokeColor(wordIdx.index) : null;
        paintUnit(ch, line.x0 + c.x, by, st, kc ? makePaint(ctx, kc, bounds) : null, 1, c.w);
      });
    } else if (a && (unitKind(a) === 'words' || unitKind(ex) === 'words' || a.type === 'karaoke')) {
      for (const w of line.words) {
        const st = merge(unitState('words', w.index, totalWords), lineSt);
        const kc = karaokeColor(w.index);
        paintUnit(w.text, line.x0 + w.x, by, st, kc ? makePaint(ctx, kc, bounds) : null, karaokeScale(w.index), w.w);
      }
    } else {
      paintUnit(line.text, line.x0, by, lineSt, null, 1, line.width);
    }
    charCounter += line.text.length;
  }

  // typewriter cursor
  if (a?.type === 'typewriter' && a.cursor !== false && f >= (a.at ?? 0)) {
    const blink = Math.floor(f / Math.max(1, fps / 2)) % 2 === 0 || visibleChars < totalChars;
    if (blink) {
      let rem = Math.min(visibleChars, totalChars);
      let li = 0;
      while (li < L.lines.length - 1 && rem > L.lines[li].text.length) {
        rem -= L.lines[li].text.length;
        li++;
      }
      const line = L.lines[li];
      const cx = line.x0 + (rem > 0 && line.chars[rem - 1] ? line.chars[rem - 1].x + line.chars[rem - 1].w : 0);
      ctx.fillStyle = typeof a.cursor === 'string' && a.cursor.startsWith('#') ? a.cursor : fill;
      ctx.fillRect(cx + 2, line.baseline - L.cap * 1.05, Math.max(2, (el.size ?? 48) * 0.07), L.cap * 1.25);
    }
  }
  if (el.highlight) drawHighlights(ctx, el, L, f, fps, true);
  ctx.restore();
}

function merge(a, b) {
  return { alpha: a.alpha * b.alpha, dx: a.dx + b.dx, dy: a.dy + b.dy, scale: a.scale * b.scale, rot: a.rot + b.rot, blur: Math.max(a.blur, b.blur) };
}

function roundRect(ctx, x, y, w, h, r) {
  r = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawBoxes(ctx, el, L) {
  const b = el.box === true ? {} : el.box;
  const padX = b.padX ?? (el.size ?? 48) * 0.35;
  const padY = b.padY ?? (el.size ?? 48) * 0.18;
  const r = b.radius ?? (el.size ?? 48) * 0.2;
  ctx.save();
  ctx.fillStyle = makePaint(ctx, b.color ?? 'rgba(0,0,0,0.75)', L.bounds);
  if (b.shadow) applyShadow(ctx, b.shadow);
  if (b.mode === 'block') {
    const bb = L.bounds;
    roundRect(ctx, bb.x - padX, bb.y - padY, bb.width + padX * 2, bb.height + padY * 2, r);
    ctx.fill();
  } else {
    for (const l of L.lines) {
      if (!l.text.trim()) continue;
      roundRect(ctx, l.x0 - padX, l.baseline - L.asc - padY, l.width + padX * 2, L.asc + L.desc + padY * 2, r);
      ctx.fill();
    }
  }
  ctx.restore();
}

function matchesWord(h, word) {
  if (Array.isArray(h.words)) {
    return h.words.some((w) => (typeof w === 'number' ? w === word.index : String(w).toLowerCase() === word.text.toLowerCase().replace(/[.,!?;:"'()]/g, '')));
  }
  return false;
}

function drawHighlights(ctx, el, L, f, fps, front) {
  const list = Array.isArray(el.highlight) ? el.highlight : [el.highlight];
  for (const h of list) {
    const style = h.style ?? 'marker';
    const isFront = style === 'underline' || style === 'strike' || style === 'circle';
    if (isFront !== front) continue;
    const at = h.at ?? 0;
    const dur = h.dur ?? 10;
    const p = resolveEase(h.ease ?? 'out-cubic')(clamp((f - at) / Math.max(0.0001, dur), 0, 1));
    if (p <= 0) continue;
    for (const line of L.lines) {
      // group consecutive matching words into runs
      const runs = [];
      let cur = null;
      for (const w of line.words) {
        if (matchesWord(h, w)) {
          if (cur) cur.x1 = w.x + w.w;
          else cur = { x0: w.x, x1: w.x + w.w };
        } else if (cur) {
          runs.push(cur);
          cur = null;
        }
      }
      if (cur) runs.push(cur);
      for (const r of runs) {
        const x0 = line.x0 + r.x0;
        const width = (r.x1 - r.x0) * p;
        const pad = h.pad ?? (el.size ?? 48) * 0.12;
        ctx.save();
        ctx.fillStyle = h.color ?? '#FFE066';
        ctx.strokeStyle = h.color ?? '#E03131';
        if (style === 'marker') {
          // slightly skewed marker band over the lower 60% of the glyphs
          const top = line.baseline - L.cap * 0.62;
          const hgt = L.cap * 0.62 + L.desc * 0.55;
          ctx.globalAlpha *= h.opacity ?? 0.9;
          ctx.beginPath();
          ctx.moveTo(x0 - pad, top + 2);
          ctx.lineTo(x0 - pad + width + pad * 2, top - 1);
          ctx.lineTo(x0 - pad + width + pad * 2, top + hgt - 2);
          ctx.lineTo(x0 - pad, top + hgt + 1);
          ctx.closePath();
          ctx.fill();
        } else if (style === 'box') {
          roundRect(ctx, x0 - pad, line.baseline - L.asc - pad * 0.6, width + pad * 2, L.asc + L.desc + pad * 1.2, h.radius ?? pad);
          ctx.fill();
        } else if (style === 'underline') {
          ctx.lineCap = 'round';
          ctx.lineWidth = h.width ?? Math.max(3, (el.size ?? 48) * 0.08);
          ctx.beginPath();
          ctx.moveTo(x0, line.baseline + L.desc * 0.55);
          ctx.lineTo(x0 + width, line.baseline + L.desc * 0.35);
          ctx.stroke();
        } else if (style === 'strike') {
          ctx.lineCap = 'round';
          ctx.lineWidth = h.width ?? Math.max(3, (el.size ?? 48) * 0.07);
          ctx.beginPath();
          ctx.moveTo(x0 - pad * 0.5, line.baseline - L.cap * 0.45);
          ctx.lineTo(x0 - pad * 0.5 + width + pad, line.baseline - L.cap * 0.5);
          ctx.stroke();
        } else if (style === 'circle') {
          const cx = x0 + (r.x1 - r.x0) / 2;
          const cy = line.baseline - L.cap / 2;
          const rx = (r.x1 - r.x0) / 2 + pad * 2;
          const ry = L.cap / 2 + pad * 2;
          ctx.lineWidth = h.width ?? Math.max(3, (el.size ?? 48) * 0.06);
          ctx.lineCap = 'round';
          ctx.beginPath();
          const start = -Math.PI * 0.6;
          ctx.ellipse(cx, cy, rx, ry, -0.04, start, start + Math.PI * 2.1 * p);
          ctx.stroke();
        } else if (style === 'color') {
          // handled by re-drawing words in color on top
        }
        ctx.restore();
      }
    }
    if (style === 'color' && front === false) {
      // nothing behind; color handled in front pass below
    }
  }
  if (front) {
    for (const h of list) {
      if ((h.style ?? 'marker') !== 'color') continue;
      const p = clamp((f - (h.at ?? 0)) / Math.max(0.0001, h.dur ?? 6), 0, 1);
      if (p <= 0) continue;
      ctx.save();
      for (const line of L.lines) {
        for (const w of line.words) {
          if (!matchesWord(h, w)) continue;
          ctx.globalAlpha = p;
          ctx.fillStyle = h.color ?? '#E03131';
          if (el.letterSpacing) {
            for (let ci = w.c0; ci < w.c1; ci++) ctx.fillText(line.chars[ci].ch, line.x0 + line.chars[ci].x, line.baseline);
          } else ctx.fillText(w.text, line.x0 + w.x, line.baseline);
        }
      }
      ctx.restore();
    }
  }
}

export function textBounds(ctx, el, epoch = 0) {
  const L = layoutText(ctx, el, undefined, epoch);
  return { x: (el.x ?? 0) + L.bounds.x, y: (el.y ?? 0) + L.bounds.y, width: L.bounds.width, height: L.bounds.height };
}

export { mixColor };
