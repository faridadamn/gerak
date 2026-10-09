// Inspector (right panel): properties of the selected element / layer / clip, or the scene & project.
import {
  S, on, emit, invalidate, scene, entry, selNode, selElement, selClip, select, setFrame, handleOf, sceneHandle,
  edit, live, commit, channelValue, setChannel, hasKeys, keyAt, toggleKey, cameraValue, setCamera, toggleCameraKey,
  patchElement, locate, nodeKeyFrames,
} from './state.mjs';
import {
  h, btn, iconBtn, numField, timeField, textField, selField, checkField, segField, colorField, paintField, section, esc, toast,
} from './ui.mjs';
import { icon } from './icons.mjs';
import { nodeLocalBounds, autoPivot } from './geom.mjs';
import { BRUSHES } from '/core/brush.mjs';
import { EASINGS } from '/core/easing.mjs';
import { BRUSH_LABELS } from './tools.mjs';
import { PRESETS } from '/author.mjs';

const root = document.getElementById('inspector');
let fields = [];
let pendingRebuild = false;

const track = (f) => {
  fields.push(f);
  return f.el;
};

const LIVE = ['view', 'overlay', 'timeline', 'values'];

// ------------------------------------------------------------ option lists

export const EASE_OPTIONS = [
  { group: 'Populer', items: [['in-out-cubic', 'Halus'], ['out-cubic', 'Melambat di akhir'], ['in-cubic', 'Makin cepat'], ['linear', 'Rata (linear)'], ['out-back', 'Lewat sedikit (back)'], ['out-elastic', 'Elastis'], ['out-bounce', 'Memantul'], ['spring', 'Pegas'], ['in-out-sine', 'Lembut'], ['out-expo', 'Ngebut lalu pelan'], ['hold', 'Tahan (lompat)']] },
  { group: 'Semua', items: EASINGS.filter((e) => !/^[a-z]+-(in|out|in-out)$/.test(e) || /^ease-/.test(e)).map((e) => [e, e]) },
];

export const TRANSITIONS = [
  ['cut', 'Potong langsung'],
  ['fade', 'Fade (silang)'],
  ['dip', 'Lewat hitam'],
  ['fade-white', 'Lewat putih'],
  ['flash', 'Kilat'],
  ['slide-left', 'Geser ke kiri'],
  ['slide-right', 'Geser ke kanan'],
  ['slide-up', 'Geser ke atas'],
  ['slide-down', 'Geser ke bawah'],
  ['push-left', 'Dorong ke kiri'],
  ['push-up', 'Dorong ke atas'],
  ['cover-left', 'Tutup dari kanan'],
  ['cover-up', 'Tutup dari bawah'],
  ['wipe-right', 'Sapu ke kanan'],
  ['wipe-left', 'Sapu ke kiri'],
  ['wipe-down', 'Sapu ke bawah'],
  ['wipe-up', 'Sapu ke atas'],
  ['iris', 'Lingkaran membesar'],
  ['zoom', 'Zoom'],
  ['blur', 'Blur'],
];

const BLENDS = [
  ['', 'Normal'], ['multiply', 'Multiply'], ['screen', 'Screen'], ['overlay', 'Overlay'], ['darken', 'Darken'], ['lighten', 'Lighten'],
  ['color-dodge', 'Color dodge'], ['color-burn', 'Color burn'], ['soft-light', 'Soft light'], ['hard-light', 'Hard light'],
  ['difference', 'Difference'], ['exclusion', 'Exclusion'], ['hue', 'Hue'], ['saturation', 'Saturation'], ['color', 'Color'], ['luminosity', 'Luminosity'],
];

const TEXT_ANIMS = [['', 'Tanpa animasi'], ['words', 'Per kata'], ['chars', 'Per huruf'], ['lines', 'Per baris'], ['typewriter', 'Mesin ketik'], ['scramble', 'Acak lalu jadi'], ['count', 'Hitung angka'], ['karaoke', 'Karaoke']];
const TEXT_EFFECTS = [['rise', 'Naik'], ['pop', 'Pop'], ['fade', 'Fade'], ['drop', 'Turun'], ['slide', 'Dari kanan'], ['slide-right', 'Dari kiri'], ['stamp', 'Stempel'], ['blur', 'Blur'], ['spin', 'Putar'], ['none', 'Muncul langsung']];
const HL_STYLES = [['marker', 'Stabilo'], ['box', 'Kotak'], ['underline', 'Garis bawah'], ['strike', 'Coret'], ['circle', 'Lingkari'], ['color', 'Ganti warna']];
const WEIGHTS = [['400', 'Regular'], ['500', 'Medium'], ['600', 'Semibold'], ['700', 'Bold'], ['800', 'Extra bold']];

export const BEHAVIORS = {
  float: { label: 'Melayang', params: [['amp', 'Jarak', 1, 'px'], ['period', 'Periode', 0.1, 'd']], def: { amp: 14, period: 2.5 } },
  wiggle: { label: 'Goyang acak', params: [['amp', 'Jarak', 1, 'px'], ['rot', 'Putar', 0.5, '°'], ['freq', 'Laju', 0.1, 'Hz']], def: { amp: 8, rot: 2, freq: 1.2 } },
  pulse: { label: 'Denyut', params: [['amount', 'Besar', 0.01, ''], ['period', 'Periode', 0.1, 'd']], def: { amount: 0.06, period: 1 } },
  spin: { label: 'Putar terus', params: [['speed', 'Laju', 1, '°/d']], def: { speed: 90 } },
  sway: { label: 'Ayun', params: [['angle', 'Sudut', 0.5, '°'], ['period', 'Periode', 0.1, 'd']], def: { angle: 6, period: 2 } },
  shake: { label: 'Getar', params: [['amp', 'Kuat', 0.5, 'px'], ['freq', 'Laju', 1, 'Hz']], def: { amp: 8, freq: 12 } },
  blink: { label: 'Kedip', params: [['period', 'Periode', 0.05, 'd'], ['duty', 'Nyala', 0.05, '']], def: { period: 0.8, duty: 0.6 } },
};

/** Start time for an entrance that lasts `dur` frames: the playhead, or 0 when it would run past the scene end. */
const inAt = (dur = 12) => (S.lf + dur > scene().duration ? 0 : S.lf);
/** Start time for an exit: the playhead, pulled back so the exit finishes inside the scene. */
const outAt = (dur = 8) => Math.max(0, Math.min(S.lf, scene().duration - dur));

const fontFamilies = () => {
  const set = new Set(S.info.fonts.map((f) => f.family));
  for (const f of S.doc.fonts || []) set.add(f.family);
  return [...set];
};

// ------------------------------------------------------------ key buttons

function keyButtons(getState, toggle, frames) {
  const prev = h('button.kb.nav', { title: 'Keyframe sebelumnya', html: icon('prev', 13) });
  const key = h('button.kb', { title: 'Keyframe di playhead (tambah/hapus)' });
  const next = h('button.kb.nav', { title: 'Keyframe berikutnya', html: icon('next', 13) });
  prev.onclick = () => {
    const f = frames().filter((q) => q < S.lf).pop();
    if (f !== undefined) setFrame(f);
  };
  next.onclick = () => {
    const f = frames().find((q) => q > S.lf);
    if (f !== undefined) setFrame(f);
  };
  key.onclick = () => toggle();
  const el = h('div.keys', {}, prev, key, next);
  const update = () => {
    const st = getState();
    key.className = `kb ${st}`;
    key.innerHTML = icon(st === 'on' ? 'keyOn' : 'key', 14);
    const anim = st !== 'none';
    prev.style.visibility = anim ? '' : 'hidden';
    next.style.visibility = anim ? '' : 'hidden';
  };
  update();
  return { el, update };
}

function nodeKeys(node, ch) {
  return keyButtons(
    () => (!hasKeys(node, ch) ? 'none' : keyAt(node, ch, S.lf) ? 'on' : 'anim'),
    () => edit(() => toggleKey(node, ch, S.lf), ['view', 'overlay', 'timeline', 'values']),
    () => (node.keys?.[ch] || []).map((k) => k.f),
  );
}

function tfield(node, ch, label, { step = 1, digits = 0, unit = '', min, max, scale = 1 } = {}) {
  const kb = nodeKeys(node, ch);
  fields.push(kb);
  return track(numField({
    label,
    get: () => channelValue(node, ch, S.lf) * scale,
    set: (v) => live(() => setChannel(node, ch, v / scale, S.lf), LIVE),
    commit: () => commit(['view', 'overlay', 'timeline', 'values']),
    step,
    digits,
    unit,
    min,
    max,
    after: kb.el,
  }));
}

function camField(sc, ch, label, opts = {}) {
  const kb = keyButtons(
    () => (!sc.camera?.keys?.[ch]?.length ? 'none' : sc.camera.keys[ch].some((k) => k.f === S.lf) ? 'on' : 'anim'),
    () => edit(() => toggleCameraKey(sc, ch, S.lf), ['view', 'overlay', 'timeline', 'values']),
    () => (sc.camera?.keys?.[ch] || []).map((k) => k.f),
  );
  fields.push(kb);
  return track(numField({
    label,
    get: () => cameraValue(sc, ch, S.lf),
    set: (v) => live(() => setCamera(sc, ch, v, S.lf), LIVE),
    commit: () => commit(['view', 'overlay', 'timeline', 'values']),
    step: opts.step ?? 1,
    digits: opts.digits ?? 0,
    unit: opts.unit ?? '',
    min: opts.min,
    after: kb.el,
  }));
}

// ------------------------------------------------------------ element panel

function elementPanel(sel) {
  const kind = sel.el.type;
  const getEl = () => selElement()?.el ?? sel.el;
  const patch = (p) => {
    const s = selElement();
    if (s) patchElement(s.node, s.el, p);
  };
  const livePatch = (p) => live(() => patch(p), LIVE);
  const doneEdit = () => commit(['view', 'overlay', 'timeline', 'values', 'scenes']);
  const editPatch = (p) => edit(() => patch(p));
  const fps = S.doc.fps;
  const num = (key, label, opts = {}) =>
    track(numField({
      label,
      get: () => (opts.get ? opts.get(getEl()) : getEl()[key] ?? opts.def),
      set: (v) => livePatch(opts.set ? opts.set(v, getEl()) : { [key]: v }),
      commit: doneEdit,
      step: opts.step ?? 1,
      digits: opts.digits ?? 0,
      unit: opts.unit ?? '',
      min: opts.min,
      max: opts.max,
    }));
  const paint = (key, label, opts = {}) => track(paintField({ label, get: () => getEl()[key], set: (v) => livePatch({ [key]: v }), commit: doneEdit, ...opts }));
  const timing = (key, label, defaults) => {
    // optional {at, dur, ease} object (reveal / draw)
    const wrap = h('div.subgrp');
    const on = checkField({
      label,
      get: () => !!getEl()[key],
      set: (v) => {
        editPatch({ [key]: v ? { at: inAt(defaults.dur), ...defaults } : undefined });
        rebuild();
      },
    });
    fields.push(on);
    wrap.append(on.el);
    if (getEl()[key]) {
      wrap.append(
        track(timeField({ label: 'Mulai', fps, get: () => getEl()[key]?.at ?? 0, set: (v) => livePatch({ [key]: { ...getEl()[key], at: v } }), commit: doneEdit })),
        track(timeField({ label: 'Durasi', fps, min: 1, get: () => getEl()[key]?.dur ?? 12, set: (v) => livePatch({ [key]: { ...getEl()[key], dur: v } }), commit: doneEdit })),
        track(selField({ label: 'Gerak', options: EASE_OPTIONS, get: () => getEl()[key]?.ease ?? 'linear', set: (v) => editPatch({ [key]: { ...getEl()[key], ease: v } }) })),
      );
    }
    return wrap;
  };
  const showRange = () => {
    const wrap = h('div.subgrp');
    const cb = checkField({
      label: 'Tampil sebagian waktu saja',
      get: () => !!getEl().show,
      set: (v) => {
        editPatch({ show: v ? [S.lf, scene().duration] : undefined });
        rebuild();
      },
    });
    fields.push(cb);
    wrap.append(cb.el);
    if (getEl().show) {
      wrap.append(
        track(timeField({ label: 'Dari', fps, get: () => getEl().show?.[0] ?? 0, set: (v) => livePatch({ show: [v, getEl().show[1]] }), commit: doneEdit })),
        track(timeField({ label: 'Sampai', fps, get: () => Math.min(getEl().show?.[1] ?? 0, scene().duration), set: (v) => livePatch({ show: [getEl().show[0], v] }), commit: doneEdit })),
      );
    }
    return wrap;
  };

  const kids = [];
  const titles = { stroke: 'Coretan', shape: 'Bentuk', text: 'Teks', image: 'Gambar' };

  if (kind === 'text') {
    const tf = textField({ label: null, multiline: true, rows: 3, get: () => getEl().text, set: (v) => livePatch({ text: v }), commit: doneEdit });
    tf.input.classList.add('textedit');
    tf.input.id = 'textEdit';
    kids.push(track(tf));
    kids.push(track(selField({ label: 'Font', options: fontFamilies().map((f) => [f, f]), get: () => getEl().font ?? 'Plus Jakarta Sans', set: (v) => editPatch({ font: v }) })));
    kids.push(track(selField({ label: 'Tebal', options: WEIGHTS, get: () => String(getEl().weight ?? 400), set: (v) => editPatch({ weight: +v }) })));
    kids.push(num('size', 'Ukuran', { def: 48, min: 4, unit: 'px' }));
    kids.push(paint('color', 'Warna', { allowNone: false }));
    kids.push(track(segField({ label: 'Rata', options: [['left', 'Kiri', 'alignLeft'], ['center', 'Tengah', 'alignCenter'], ['right', 'Kanan', 'alignRight']], get: () => getEl().align ?? 'left', set: (v) => editPatch({ align: v }) })));
    const more = [
      num('lineHeight', 'Spasi baris', { def: 1.2, step: 0.02, digits: 2, min: 0.5 }),
      num('letterSpacing', 'Spasi huruf', { def: 0, step: 0.5, digits: 1, unit: 'px' }),
      num('maxWidth', 'Lebar maks', { def: 0, min: 0, unit: 'px', set: (v) => ({ maxWidth: v > 0 ? v : undefined }) }),
      track(selField({ label: 'Huruf', options: [['', 'Normal'], ['upper', 'KAPITAL'], ['lower', 'kecil']], get: () => getEl().case ?? '', set: (v) => editPatch({ case: v || undefined }) })),
      paint('stroke', 'Garis tepi (outline)', { noneLabel: 'Tanpa' }),
    ];
    if (getEl().stroke) more.push(num('strokeWidth', 'Tebal tepi', { def: 4, min: 0, step: 0.5, digits: 1, unit: 'px' }));
    kids.push(...more);
    // box
    const box = h('div.subgrp');
    const boxOn = checkField({
      label: 'Kotak latar (caption)',
      get: () => !!getEl().box,
      set: (v) => {
        editPatch({ box: v ? { color: 'rgba(0,0,0,0.75)', mode: 'line' } : undefined });
        rebuild();
      },
    });
    fields.push(boxOn);
    box.append(boxOn.el);
    if (getEl().box) {
      const bx = () => (getEl().box === true ? {} : getEl().box);
      const size = () => getEl().size ?? 48;
      box.append(
        track(paintField({ label: 'Warna kotak', allowNone: false, get: () => bx().color ?? 'rgba(0,0,0,0.75)', set: (v) => livePatch({ box: { ...bx(), color: v } }), commit: doneEdit })),
        track(numField({ label: 'Jarak samping', get: () => bx().padX ?? Math.round(size() * 0.35), set: (v) => livePatch({ box: { ...bx(), padX: v } }), commit: doneEdit, min: 0, unit: 'px' })),
        track(numField({ label: 'Jarak atas', get: () => bx().padY ?? Math.round(size() * 0.18), set: (v) => livePatch({ box: { ...bx(), padY: v } }), commit: doneEdit, min: 0, unit: 'px' })),
        track(numField({ label: 'Sudut bulat', get: () => bx().radius ?? Math.round(size() * 0.2), set: (v) => livePatch({ box: { ...bx(), radius: v } }), commit: doneEdit, min: 0, unit: 'px' })),
        track(segField({ label: 'Bentuk', options: [['line', 'Per baris'], ['block', 'Satu blok']], get: () => bx().mode ?? 'line', set: (v) => editPatch({ box: { ...bx(), mode: v } }) })),
      );
    }
    kids.push(box);
    kids.push(textAnimGroup(getEl, editPatch, livePatch, doneEdit, rebuild));
    kids.push(highlightGroup(getEl, editPatch, livePatch, doneEdit, rebuild));
  }

  if (kind === 'stroke') {
    if (getEl().erase) kids.push(h('p.note', {}, 'Ini goresan penghapus: menghapus coretan di layer yang sama.'));
    else {
      const brushName = typeof getEl().brush === 'string' ? getEl().brush : 'ink';
      kids.push(track(selField({ label: 'Kuas', options: Object.entries(BRUSH_LABELS), get: () => brushName, set: (v) => editPatch({ brush: v }) })));
      kids.push(paint('color', 'Warna', { allowNone: false }));
    }
    kids.push(num('size', 'Ukuran', { get: (el) => el.size ?? BRUSHES[typeof el.brush === 'string' ? el.brush : 'ink']?.size ?? 8, min: 0.5, step: 0.5, digits: 1, unit: 'px' }));
    if (!getEl().erase) kids.push(timing('reveal', 'Tergambar pelan-pelan', { dur: 12, ease: 'in-out-sine' }));
  }

  if (kind === 'shape') {
    const el = getEl();
    if (el.shape === 'rect') {
      kids.push(num('w', 'Lebar', { min: 1, unit: 'px', set: (v, e) => ({ w: v, x: e.x + (e.w - v) / 2 }) }));
      kids.push(num('h', 'Tinggi', { min: 1, unit: 'px', set: (v, e) => ({ h: v, y: e.y + (e.h - v) / 2 }) }));
      kids.push(num('r', 'Sudut bulat', { def: 0, min: 0, unit: 'px' }));
    } else if (el.shape === 'circle') kids.push(num('r', 'Jari-jari', { min: 1, unit: 'px' }));
    else if (el.shape === 'ellipse') {
      kids.push(num('rx', 'Lebar / 2', { min: 1, unit: 'px' }));
      kids.push(num('ry', 'Tinggi / 2', { min: 1, unit: 'px' }));
    } else if (el.shape === 'star') {
      kids.push(num('r1', 'Jari-jari luar', { min: 1, unit: 'px' }));
      kids.push(num('r2', 'Jari-jari dalam', { min: 1, unit: 'px' }));
      kids.push(num('n', 'Jumlah sudut', { def: 5, min: 3, max: 40 }));
    }
    const isLine = el.shape === 'line' || el.shape === 'arrow' || el.shape === 'arc' || (el.shape === 'polygon' && el.closed === false);
    if (!isLine) kids.push(paint('fill', 'Isi', { noneLabel: 'Tanpa isi' }));
    kids.push(paint('stroke', 'Garis tepi', { noneLabel: 'Tanpa garis', allowNone: !isLine }));
    if (getEl().stroke) kids.push(num('strokeWidth', 'Tebal garis', { def: 3, min: 0, step: 0.5, digits: 1, unit: 'px' }));
    if (el.shape === 'arrow') kids.push(num('head', 'Ujung panah', { def: 18, min: 2, unit: 'px' }));
    const sk = h('div.subgrp');
    const skOn = checkField({
      label: 'Gaya sketsa (garis tangan)',
      get: () => !!getEl().sketch,
      set: (v) => {
        editPatch({ sketch: v ? { seed: getEl().id, roughness: 1 } : undefined });
        rebuild();
      },
    });
    fields.push(skOn);
    sk.append(skOn.el);
    if (getEl().sketch) {
      const skv = () => (getEl().sketch === true ? {} : getEl().sketch);
      sk.append(
        track(numField({ label: 'Kekasaran', get: () => skv().roughness ?? 1, set: (v) => livePatch({ sketch: { ...skv(), roughness: v } }), commit: doneEdit, step: 0.1, digits: 1, min: 0 })),
        track(segField({ label: 'Isi', options: [['hachure', 'Arsir'], ['solid', 'Penuh']], get: () => skv().fill ?? 'hachure', set: (v) => editPatch({ sketch: { ...skv(), fill: v } }) })),
      );
    }
    kids.push(sk);
    kids.push(timing('draw', 'Tergambar (draw-on)', { dur: 18, ease: 'in-out-cubic' }));
  }

  if (kind === 'image') {
    kids.push(h('div.field', {}, h('label', {}, 'Sumber'), h('div.fin', {}, btn('Ganti gambar…', () => emit('pickImage', { replace: true }), 'small', 'image'))));
    kids.push(num('width', 'Lebar', { min: 1, unit: 'px' }));
    kids.push(num('height', 'Tinggi', { min: 1, unit: 'px' }));
    kids.push(track(segField({ label: 'Isi bingkai', options: [['cover', 'Penuh'], ['contain', 'Utuh'], ['fill', 'Tarik']], get: () => getEl().fit ?? 'cover', set: (v) => editPatch({ fit: v }) })));
    kids.push(num('radius', 'Sudut bulat', { def: 0, min: 0, unit: 'px' }));
    kids.push(paint('stroke', 'Bingkai', { noneLabel: 'Tanpa' }));
    if (getEl().stroke) kids.push(num('strokeWidth', 'Tebal bingkai', { def: 4, min: 0, unit: 'px' }));
  }

  kids.push(num('opacity', 'Opasitas', { def: 1, get: (e) => Math.round((e.opacity ?? 1) * 100), set: (v) => ({ opacity: v >= 100 ? undefined : Math.max(0, v) / 100 }), min: 0, max: 100, unit: '%' }));
  kids.push(showRange());

  const loc = selNode();
  const actions = (loc?.node.elements || []).length > 1
    ? [iconBtn('trash', 'Hapus elemen ini', () => {
        edit(() => {
          const s = selElement();
          s.node.elements.splice(s.node.elements.indexOf(s.el), 1);
        });
        select({ node: loc.node.id });
      })]
    : null;
  return section(`${titles[kind] ?? kind}`, kids, { id: `el-${kind}`, actions });
}

function textAnimGroup(getEl, editPatch, livePatch, doneEdit, rebuild) {
  const fps = S.doc.fps;
  const wrap = h('div.subgrp');
  const a = () => getEl().anim;
  const setA = (p) => livePatch({ anim: { ...a(), ...p } });
  const typeSel = selField({
    label: 'Animasi masuk',
    options: TEXT_ANIMS,
    get: () => a()?.type ?? '',
    set: (v) => {
      const words0 = String(getEl().text ?? '').split(/\s+/).filter(Boolean).length;
      const at = inAt(Math.max(12, words0 * 4));
      const words = String(getEl().text ?? '').split(/\s+/).filter(Boolean);
      const defs = {
        words: { type: 'words', effect: 'pop', at, stagger: 4, dur: 10 },
        chars: { type: 'chars', effect: 'rise', at, stagger: 1, dur: 10 },
        lines: { type: 'lines', effect: 'rise', at, stagger: 8, dur: 14 },
        typewriter: { type: 'typewriter', at, cps: 18 },
        scramble: { type: 'scramble', at, dur: Math.round(fps * 0.8) },
        count: { type: 'count', at, dur: Math.round(fps * 1.5), from: 0, to: parseFloat(String(getEl().text).replace(/[^\d.,-]/g, '').replace(/\./g, '').replace(',', '.')) || 100 },
        karaoke: { type: 'karaoke', times: words.map((w, i) => at + i * 8), color: '#ffd43b' },
      };
      editPatch({ anim: v ? defs[v] : undefined });
      rebuild();
    },
  });
  fields.push(typeSel);
  wrap.append(typeSel.el);
  const t = a()?.type;
  if (t) {
    if (t !== 'karaoke') wrap.append(track(timeField({ label: 'Mulai', fps, get: () => a().at ?? 0, set: (v) => setA({ at: v }), commit: doneEdit })));
    if (t === 'words' || t === 'chars' || t === 'lines') {
      wrap.append(
        track(selField({ label: 'Efek', options: TEXT_EFFECTS, get: () => a().effect ?? 'rise', set: (v) => editPatch({ anim: { ...a(), effect: v } }) })),
        track(timeField({ label: 'Jeda antar', fps, get: () => a().stagger ?? 3, set: (v) => setA({ stagger: v }), commit: doneEdit })),
        track(timeField({ label: 'Durasi tiap', fps, min: 1, get: () => a().dur ?? 10, set: (v) => setA({ dur: v }), commit: doneEdit })),
      );
    }
    if (t === 'typewriter') {
      wrap.append(track(numField({ label: 'Huruf/detik', get: () => a().cps ?? 20, set: (v) => setA({ cps: v, dur: undefined }), commit: doneEdit, min: 1, step: 1 })));
      // the renderer shows the cursor unless cursor === false
      wrap.append(track(checkField({ label: 'Kursor berkedip', get: () => a().cursor !== false, set: (v) => editPatch({ anim: { ...a(), cursor: v ? undefined : false } }) })));
    }
    if (t === 'scramble') wrap.append(track(timeField({ label: 'Durasi', fps, min: 1, get: () => a().dur ?? 24, set: (v) => setA({ dur: v }), commit: doneEdit })));
    if (t === 'count') {
      wrap.append(
        track(numField({ label: 'Dari', get: () => a().from ?? 0, set: (v) => setA({ from: v }), commit: doneEdit, step: 1 })),
        track(numField({ label: 'Sampai', get: () => a().to ?? 100, set: (v) => setA({ to: v }), commit: doneEdit, step: 1 })),
        track(timeField({ label: 'Durasi', fps, min: 1, get: () => a().dur ?? fps, set: (v) => setA({ dur: v }), commit: doneEdit })),
        track(textField({ label: 'Awalan (mis. Rp)', get: () => a().prefix ?? '', set: (v) => setA({ prefix: v || undefined }), commit: doneEdit })),
        track(textField({ label: 'Akhiran (mis. %)', get: () => a().suffix ?? '', set: (v) => setA({ suffix: v || undefined }), commit: doneEdit })),
        track(numField({ label: 'Desimal', get: () => a().decimals ?? 0, set: (v) => setA({ decimals: v || undefined }), commit: doneEdit, min: 0, max: 4 })),
      );
    }
    if (t === 'karaoke') {
      wrap.append(
        h('p.note', {}, 'Tiap kata menyala bergantian. Atur jarak antar kata:'),
        track(timeField({
          label: 'Mulai',
          fps,
          get: () => a().times?.[0] ?? 0,
          set: (v) => {
            const ts = a().times || [];
            const d = v - (ts[0] ?? 0);
            setA({ times: ts.map((q) => q + d) });
          },
          commit: doneEdit,
        })),
        track(timeField({
          label: 'Jarak kata',
          fps,
          min: 1,
          get: () => {
            const ts = a().times || [];
            return ts.length > 1 ? ts[1] - ts[0] : 8;
          },
          set: (v) => {
            const ts = a().times || [];
            setA({ times: ts.map((q, i) => (ts[0] ?? 0) + i * v) });
          },
          commit: doneEdit,
        })),
        track(paintField({ label: 'Warna menyala', allowNone: false, get: () => a().color ?? '#ffd43b', set: (v) => setA({ color: v }), commit: doneEdit })),
      );
    }
  }
  // exit
  const ex = () => getEl().exit;
  const exitSel = selField({
    label: 'Animasi keluar',
    options: [['', 'Tanpa'], ['words', 'Per kata'], ['chars', 'Per huruf'], ['lines', 'Per baris']],
    get: () => ex()?.type ?? '',
    set: (v) => {
      editPatch({ exit: v ? { type: v, effect: 'fade', at: outAt(12), stagger: v === 'chars' ? 1 : 3, dur: 8 } : undefined });
      rebuild();
    },
  });
  fields.push(exitSel);
  wrap.append(exitSel.el);
  if (ex()) {
    wrap.append(
      track(selField({ label: 'Efek keluar', options: TEXT_EFFECTS, get: () => ex().effect ?? 'fade', set: (v) => editPatch({ exit: { ...ex(), effect: v } }) })),
      track(timeField({ label: 'Mulai keluar', fps, get: () => ex().at ?? 0, set: (v) => livePatch({ exit: { ...ex(), at: v } }), commit: doneEdit })),
    );
  }
  return wrap;
}

function highlightGroup(getEl, editPatch, livePatch, doneEdit, rebuild) {
  const fps = S.doc.fps;
  const wrap = h('div.subgrp');
  const hl = () => (Array.isArray(getEl().highlight) ? getEl().highlight[0] : getEl().highlight);
  const setHl = (p) => livePatch({ highlight: [{ ...hl(), ...p }, ...(Array.isArray(getEl().highlight) ? getEl().highlight.slice(1) : [])] });
  const on = checkField({
    label: 'Sorot kata',
    get: () => !!getEl().highlight,
    set: (v) => {
      const words = String(getEl().text ?? '').split(/\s+/).filter(Boolean);
      editPatch({ highlight: v ? [{ words: [words.at(-1)?.replace(/[.,!?;:"'()]/g, '') ?? ''], style: 'marker', color: '#ffd43b', at: inAt(10), dur: 10 }] : undefined });
      rebuild();
    },
  });
  fields.push(on);
  wrap.append(on.el);
  if (getEl().highlight) {
    wrap.append(
      track(textField({
        label: 'Kata (pisahkan koma)',
        get: () => (hl().words || []).join(', '),
        set: (v) => setHl({ words: v.split(',').map((s) => s.trim()).filter(Boolean) }),
        commit: doneEdit,
      })),
      track(selField({ label: 'Gaya', options: HL_STYLES, get: () => hl().style ?? 'marker', set: (v) => editPatch({ highlight: [{ ...hl(), style: v }] }) })),
      track(paintField({ label: 'Warna sorot', allowNone: false, get: () => hl().color ?? '#ffd43b', set: (v) => setHl({ color: v }), commit: doneEdit })),
      track(timeField({ label: 'Mulai', fps, get: () => hl().at ?? 0, set: (v) => setHl({ at: v }), commit: doneEdit })),
      track(timeField({ label: 'Durasi', fps, min: 1, get: () => hl().dur ?? 10, set: (v) => setHl({ dur: v }), commit: doneEdit })),
    );
  }
  return wrap;
}

// ------------------------------------------------------------ layer panel

function wipeRect(loc) {
  const b = nodeLocalBounds(loc.node, S.lf, S.doc, S.env);
  return b ? [Math.floor(b.x - 4), Math.floor(b.y - 4), Math.ceil(b.w + 8), Math.ceil(b.h + 8)] : undefined;
}

function layerPanel(loc) {
  const node = loc.node;
  const fps = S.doc.fps;
  const out = [];
  const typeName = { layer: 'Layer', group: 'Grup', track: 'Track (ganti gambar)' }[node.type] ?? node.type;

  // header
  const name = h('input.text.name', { type: 'text', value: node.name ?? node.id, spellcheck: 'false' });
  name.addEventListener('change', () => edit(() => (node.name = name.value.trim() || node.id), ['timeline', 'inspector', 'tools']));
  name.addEventListener('keydown', (e) => e.key === 'Enter' && name.blur());
  out.push(h('div.ihead', {},
    h('span.itype', { html: icon(node.type === 'group' ? 'group' : node.type === 'track' ? 'track' : 'layer', 16) }),
    h('div.iname', {}, name, h('span.iid', {}, `${typeName} · ${node.id}`)),
    iconBtn('copy', 'Duplikat (Ctrl+D)', () => emit('cmd', 'duplicate')),
    iconBtn('trash', 'Hapus (Del)', () => emit('cmd', 'delete'))));

  // transform
  const tr = [
    tfield(node, 'x', 'X', { unit: 'px' }),
    tfield(node, 'y', 'Y', { unit: 'px' }),
    tfield(node, 'scale', 'Skala', { step: 0.01, digits: 2 }),
    tfield(node, 'rotation', 'Putar', { step: 1, digits: 1, unit: '°' }),
    tfield(node, 'opacity', 'Opasitas', { step: 1, scale: 100, min: 0, max: 100, unit: '%' }),
    tfield(node, 'blur', 'Blur', { step: 0.5, digits: 1, min: 0, unit: 'px' }),
  ];
  const keyAll = btn('Kunci semua di sini', () => {
    edit(() => {
      for (const ch of ['x', 'y', 'scale', 'rotation', 'opacity']) if (!keyAt(node, ch, S.lf)) toggleKey(node, ch, S.lf);
    }, ['view', 'overlay', 'timeline', 'values']);
    toast('Keyframe posisi, skala, putar, opasitas ditambahkan di playhead');
  }, 'small ghost', 'key');
  out.push(section('Posisi & bentuk', [h('p.note.tip', {}, 'Klik ◇ untuk mulai animasi. Setelah ada keyframe, geser playhead lalu ubah nilai — keyframe baru dibuat otomatis.'), ...tr, h('div.rowbtns', {}, keyAll)], { id: 'transform' }));

  const adv = [
    tfield(node, 'scaleX', 'Skala X', { step: 0.01, digits: 2 }),
    tfield(node, 'scaleY', 'Skala Y', { step: 0.01, digits: 2 }),
    tfield(node, 'skewX', 'Miring X', { step: 0.5, digits: 1, unit: '°' }),
    tfield(node, 'skewY', 'Miring Y', { step: 0.5, digits: 1, unit: '°' }),
    tfield(node, 'pivotX', 'Poros X', { unit: 'px' }),
    tfield(node, 'pivotY', 'Poros Y', { unit: 'px' }),
  ];
  if (loc.path.length === 1) adv.push(tfield(node, 'depth', 'Kedalaman', { step: 0.05, digits: 2, min: 0.05 }));
  adv.push(h('div.rowbtns', {}, btn('Poros ke tengah', () => {
    const b = nodeLocalBounds(node, S.lf, S.doc, S.env);
    if (!b) return;
    const animated = ['scale', 'scaleX', 'scaleY', 'rotation', 'skewX', 'skewY', 'pivotX', 'pivotY'].filter((ch) => node.keys?.[ch]?.length);
    if (animated.length) {
      toast('Poros tidak bisa dipindah otomatis karena skala/putar/miring layer ini beranimasi. Atur Poros X/Y manual.', 'err');
      return;
    }
    edit(() => {
      const t = (node.transform ||= {});
      const nx = Math.round(b.x + b.w / 2);
      const ny = Math.round(b.y + b.h / 2);
      const px0 = t.pivotX ?? 0;
      const py0 = t.pivotY ?? 0;
      // keep the content still: x' = x + (I − M)(p − p') with M = rotate · skew · scale
      const D2R = Math.PI / 180;
      const M = new DOMMatrix()
        .rotate(t.rotation ?? 0)
        .multiply(new DOMMatrix([1, Math.tan((t.skewY ?? 0) * D2R), Math.tan((t.skewX ?? 0) * D2R), 1, 0, 0]))
        .scale((t.scale ?? 1) * (t.scaleX ?? 1), (t.scale ?? 1) * (t.scaleY ?? 1));
      const dx = px0 - nx;
      const dy = py0 - ny;
      const ex = dx - (M.a * dx + M.c * dy);
      const ey = dy - (M.b * dx + M.d * dy);
      t.pivotX = nx;
      t.pivotY = ny;
      for (const [ch, d] of [['x', ex], ['y', ey]]) {
        if (Math.abs(d) < 0.001) continue;
        if (node.keys?.[ch]?.length) node.keys[ch] = node.keys[ch].map((k) => ({ ...k, v: k.v + d }));
        else t[ch] = (t[ch] ?? 0) + d;
      }
    });
  }, 'small ghost', 'target')));
  out.push(section('Lanjutan', adv, { id: 'transform-adv', open: false }));

  // presets
  const dur = () => S.presetDur;
  const dist = () => Math.round(Math.max(120, Math.min(S.doc.width, S.doc.height) * 0.16));
  const apply = (fn, label, isOut) => () => {
    const d = Math.max(1, dur());
    const sc = scene();
    let f = S.lf;
    if (isOut && f + d > sc.duration) f = Math.max(0, sc.duration - d);
    if (!isOut && f + d > sc.duration) f = 0;
    edit(() => {
      autoPivot(node, S.lf, S.doc, S.env);
      fn(handleOf(loc), f, d);
    }, ['view', 'overlay', 'timeline', 'values', 'inspector']);
    toast(`${label} ditambahkan di ${(f / fps).toFixed(2)} d`);
    emit('previewRange', { from: f, to: Math.min(sc.duration - 1, f + Math.round(d * (label.includes('Jatuh') ? 1.5 : 1)) + 2), back: isOut ? f : null });
  };
  const IN = [
    ['Fade', (hd, f, d) => hd.fadeIn(f, d)],
    ['Pop', (hd, f, d) => hd.pop(f, { dur: d })],
    ['Zoom', (hd, f, d) => hd.zoomIn(f, { dur: d })],
    ['Naik', (hd, f, d) => hd.slideIn(f, { from: 'bottom', dur: d, distance: dist() })],
    ['Turun', (hd, f, d) => hd.slideIn(f, { from: 'top', dur: d, distance: dist() })],
    ['Dari kiri', (hd, f, d) => hd.slideIn(f, { from: 'left', dur: d, distance: dist() })],
    ['Dari kanan', (hd, f, d) => hd.slideIn(f, { from: 'right', dur: d, distance: dist() })],
    ['Jatuh', (hd, f, d) => hd.dropIn(f, { dur: Math.round(d * 1.5) })],
    ['Blur', (hd, f, d) => hd.blurIn(f, { dur: d })],
    ['Putar', (hd, f, d) => hd.spinIn(f, { dur: d })],
    ['Sapu', (hd, f, d) => hd.wipeIn(f, { dur: d, dir: 'right', rect: wipeRect(loc) })],
  ];
  const OUT = [
    ['Fade', (hd, f, d) => hd.fadeOut(f, d)],
    ['Pop', (hd, f, d) => hd.popOut(f, { dur: d })],
    ['Turun', (hd, f, d) => hd.slideOut(f, { to: 'bottom', dur: d, distance: dist() })],
    ['Naik', (hd, f, d) => hd.slideOut(f, { to: 'top', dur: d, distance: dist() })],
    ['Ke kiri', (hd, f, d) => hd.slideOut(f, { to: 'left', dur: d, distance: dist() })],
    ['Ke kanan', (hd, f, d) => hd.slideOut(f, { to: 'right', dur: d, distance: dist() })],
    ['Sapu', (hd, f, d) => hd.wipeOut(f, { dur: d, dir: 'right', rect: wipeRect(loc) })],
  ];
  const durField = timeField({ label: 'Durasi', fps, min: 1, get: () => S.presetDur, set: (v) => (S.presetDur = v), commit: () => {} });
  fields.push(durField);
  out.push(section('Animasi cepat', [
    h('p.note', {}, 'Dipasang mulai di playhead.'),
    h('div.plabel', {}, 'Masuk'),
    h('div.chips', {}, IN.map(([l, fn]) => btn(l, apply(fn, `Masuk: ${l}`), 'chip'))),
    h('div.plabel', {}, 'Keluar'),
    h('div.chips', {}, OUT.map(([l, fn]) => btn(l, apply(fn, `Keluar: ${l}`, true), 'chip'))),
    durField.el,
    h('div.rowbtns', {}, btn('Hapus semua animasi', () => {
      edit(() => {
        const hd = handleOf(loc);
        // keep what is visible at the playhead
        for (const ch of Object.keys(node.keys || {})) (node.transform ||= {})[ch] = channelValue(node, ch, S.lf);
        hd.removeKeys();
        delete node.keys;
        delete node.wipe;
        delete node.behaviors;
      });
    }, 'small ghost danger', 'trash')),
  ], { id: 'presets' }));

  // behaviors
  const behKids = [h('div.chips', {}, Object.entries(BEHAVIORS).map(([type, b]) => btn(b.label, () => edit(() => {
    autoPivot(node, S.lf, S.doc, S.env);
    (node.behaviors ||= []).push({ type, ...b.def });
  }, ['view', 'overlay', 'timeline', 'inspector']), 'chip')))];
  (node.behaviors || []).forEach((b, i) => {
    const spec = BEHAVIORS[b.type];
    const rows = (spec?.params ?? []).map(([key, label, step, unit]) => track(numField({
      label,
      get: () => (Array.isArray(node.behaviors[i]?.[key]) ? node.behaviors[i][key][0] : node.behaviors[i]?.[key] ?? spec.def[key] ?? 0),
      set: (v) => live(() => (node.behaviors[i] = { ...node.behaviors[i], [key]: v }), LIVE),
      commit: () => commit(['view', 'overlay', 'timeline', 'values']),
      step,
      digits: step < 1 ? 2 : 0,
      unit,
    })));
    behKids.push(h('div.behav', {},
      h('div.behead', {}, h('b', {}, spec?.label ?? b.type), iconBtn('close', 'Hapus gerak ini', () => edit(() => {
        node.behaviors.splice(i, 1);
        if (!node.behaviors.length) delete node.behaviors;
      }))),
      rows));
  });
  out.push(section('Gerak terus-menerus', behKids, { id: 'behaviors', open: !!node.behaviors?.length }));

  // visibility window
  const visKids = [];
  const visOn = checkField({
    label: 'Tampil sebagian waktu saja',
    get: () => !!node.exposure,
    set: (v) => edit(() => {
      if (v) node.exposure = [S.lf, 1e9];
      else delete node.exposure;
    }),
  });
  fields.push(visOn);
  visKids.push(visOn.el);
  if (node.exposure) {
    visKids.push(
      track(timeField({ label: 'Muncul', fps, get: () => node.exposure?.[0] ?? 0, set: (v) => live(() => (node.exposure = [v, node.exposure[1]]), LIVE), commit: () => commit() })),
      track(timeField({ label: 'Hilang', fps, get: () => Math.min(node.exposure?.[1] ?? 0, scene().duration), set: (v) => live(() => (node.exposure = [node.exposure[0], v >= scene().duration ? 1e9 : v]), LIVE), commit: () => commit() })),
      h('div.rowbtns', {},
        btn('Muncul di playhead', () => edit(() => (node.exposure = [S.lf, node.exposure[1]])), 'small ghost'),
        btn('Hilang di playhead', () => edit(() => (node.exposure = [node.exposure[0], Math.max(node.exposure[0] + 1, S.lf)])), 'small ghost')),
    );
  }
  out.push(section('Waktu tampil', visKids, { id: 'exposure', open: !!node.exposure }));

  // look
  const look = [
    track(selField({ label: 'Blend', options: BLENDS, get: () => node.blend ?? '', set: (v) => edit(() => (v ? (node.blend = v) : delete node.blend)) })),
  ];
  if (loc.path.length === 1) look.push(track(checkField({ label: 'Tidak ikut kamera (caption / HUD)', get: () => !!node.fixed, set: (v) => edit(() => (v ? (node.fixed = true) : delete node.fixed)) })));
  const shOn = checkField({
    label: 'Bayangan',
    get: () => !!node.shadow,
    set: (v) => edit(() => (v ? (node.shadow = { color: 'rgba(0,0,0,0.35)', blur: 24, y: 10 }) : delete node.shadow)),
  });
  fields.push(shOn);
  look.push(shOn.el);
  if (node.shadow) {
    look.push(
      track(colorField({ label: 'Warna bayangan', swatches: false, get: () => node.shadow?.color, set: (v) => live(() => (node.shadow = { ...node.shadow, color: v }), LIVE), commit: () => commit() })),
      track(numField({ label: 'Lembut', get: () => node.shadow?.blur ?? 12, set: (v) => live(() => (node.shadow = { ...node.shadow, blur: v }), LIVE), commit: () => commit(), min: 0, unit: 'px' })),
      track(numField({ label: 'Geser Y', get: () => node.shadow?.y ?? 4, set: (v) => live(() => (node.shadow = { ...node.shadow, y: v }), LIVE), commit: () => commit(), unit: 'px' })),
    );
  }
  out.push(section('Tampilan', look, { id: 'look', open: false }));

  // selected keyframe
  if (S.keySel && S.keySel.node === node.id) out.unshift(keyPanel(node));

  // brush strokes: animate the whole drawing in one go
  const strokes = (node.elements || []).filter((e) => e.type === 'stroke' && !e.erase);
  if (strokes.length > 1) {
    const total = { f: S.drawDur ?? Math.round(fps * 2) };
    const lenOf = (el) => {
      const pts = el.points || [];
      let L = 0;
      for (let i = 1; i < pts.length; i++) L += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
      return Math.max(L, 20);
    };
    const durF = timeField({ label: 'Total waktu', fps, min: 2, get: () => S.drawDur ?? Math.round(fps * 2), set: (v) => (S.drawDur = v), commit: () => {} });
    fields.push(durF);
    out.push(section(`Coretan (${strokes.length})`, [
      h('p.note', {}, 'Buat semua coretan di layer ini tergambar satu per satu, mulai dari playhead. Coretan panjang dapat waktu lebih lama.'),
      durF.el,
      h('div.rowbtns', {},
        btn('Tergambar berurutan', () => {
          const T = Math.max(strokes.length, S.drawDur ?? total.f);
          const start = S.lf + T > scene().duration ? 0 : S.lf;
          const lens = strokes.map(lenOf);
          const sum = lens.reduce((a, b) => a + b, 0);
          edit(() => {
            let t = start;
            node.elements = node.elements.map((el) => {
              const i = strokes.indexOf(el);
              if (i < 0) return el;
              const d = Math.max(1, Math.round((lens[i] / sum) * T));
              const next = { ...el, reveal: { at: Math.round(t), dur: d, ease: 'in-out-sine' } };
              t += d;
              return next;
            });
          });
          emit('previewRange', { from: start, to: Math.min(scene().duration - 1, start + T + 2) });
        }, 'small primary', 'brush'),
        btn('Langsung tampil', () => edit(() => {
          node.elements = node.elements.map((el) => (el.reveal ? (({ reveal, ...rest }) => (void reveal, rest))(el) : el));
        }), 'small ghost')),
    ], { id: 'strokes' }));
  }

  // element list for multi-element layers
  const els = node.elements || [];
  if (els.length > 1) {
    const list = h('div.ellist');
    els.slice().reverse().forEach((el) => {
      const label = el.type === 'text' ? `“${String(el.text).slice(0, 22)}”` : el.type === 'shape' ? el.shape : el.type === 'stroke' ? (el.erase ? 'penghapus' : `coretan ${el.brush ?? ''}`) : el.type;
      const row = h(`div.elrow${S.sel.el === el.id ? '.on' : ''}`, { onclick: () => select({ node: node.id, el: el.id }) },
        h('span.eltype', {}, el.type === 'stroke' ? '✎' : el.type === 'text' ? 'T' : el.type === 'image' ? '▣' : '◆'),
        h('span', {}, label),
        h('span.elid', {}, el.id));
      list.append(row);
    });
    out.push(section(`Isi layer (${els.length})`, [list], { id: 'ellist', open: els.length < 30 }));
  }
  return out;
}

function keyPanel(node) {
  const f = S.keySel.f;
  const chans = Object.entries(node.keys || {}).filter(([, arr]) => arr.some((k) => k.f === f));
  const first = chans[0]?.[1].find((k) => k.f === f);
  const LABEL = { x: 'X', y: 'Y', scale: 'Skala', rotation: 'Putar', opacity: 'Opasitas', blur: 'Blur', scaleX: 'Skala X', scaleY: 'Skala Y', skewX: 'Miring X', skewY: 'Miring Y', pivotX: 'Poros X', pivotY: 'Poros Y', depth: 'Kedalaman' };
  const kids = [
    h('p.note', {}, `Keyframe di ${(f / S.doc.fps).toFixed(2)} d (frame ${f}): ${chans.map(([c, arr]) => `${LABEL[c] ?? c} ${+(+arr.find((k) => k.f === f).v).toFixed(2)}`).join(' · ')}`),
    track(selField({
      label: 'Gerak ke berikutnya',
      options: EASE_OPTIONS,
      get: () => first?.e ?? 'linear',
      set: (v) => edit(() => {
        for (const [, arr] of chans) {
          const k = arr.find((q) => q.f === f);
          if (!k) continue;
          if (v === 'linear') delete k.e;
          else k.e = v;
        }
      }, ['view', 'overlay', 'timeline', 'inspector']),
    })),
    h('div.rowbtns', {},
      btn('Ke keyframe ini', () => setFrame(f), 'small ghost'),
      btn('Hapus keyframe', () => emit('cmd', 'deleteKey'), 'small ghost danger', 'trash')),
  ];
  return section('Keyframe terpilih', kids, { id: 'keysel' });
}

// ------------------------------------------------------------ clip panel

function clipPanel(clip) {
  const fps = S.doc.fps;
  const sc = clip.scene ? S.doc.scenes.find((s) => s.id === clip.scene) : null;
  const liveClip = (p) => live(() => Object.assign(clip, p), ['timeline', 'values']);
  const done = () => commit(['timeline', 'values', 'sound']);
  const db = () => (clip.gain > 0 ? 20 * Math.log10(clip.gain) : -60);
  const kids = [];
  if (clip.sfx) {
    kids.push(track(selField({ label: 'Jenis', options: S.info.sfx.map((t) => [t, t]), get: () => clip.sfx.type, set: (v) => edit(() => (clip.sfx = { ...clip.sfx, type: v }), ['timeline', 'sound', 'inspector']) })));
    kids.push(h('div.rowbtns', {}, btn('Dengar', () => emit('previewSfx', clip.sfx.type), 'small ghost', 'play')));
  } else {
    kids.push(h('p.note', {}, clip.src));
  }
  kids.push(track(timeField({ label: 'Mulai', fps, get: () => clip.at ?? 0, set: (v) => liveClip({ at: v }), commit: done })));
  kids.push(track(numField({ label: 'Volume', get: () => Math.round(db() * 10) / 10, set: (v) => liveClip({ gain: Math.pow(10, v / 20) }), commit: done, step: 0.5, digits: 1, min: -60, max: 12, unit: 'dB' })));
  if (!clip.sfx) {
    const sec = (key, label, opts = {}) => track(numField({
      label,
      get: () => (opts.get ? opts.get() : clip[key] ?? opts.def ?? 0),
      set: (v) => liveClip(opts.set ? opts.set(v) : { [key]: v > 0 ? v : undefined }),
      commit: done,
      step: 0.1,
      digits: 2,
      min: 0,
      unit: 'd',
    }));
    kids.push(
      sec('trim', 'Potong awal', { get: () => clip.trim?.[0] ?? 0, set: (v) => ({ trim: v > 0 ? [v, clip.trim?.[1] ?? null] : undefined }) }),
      sec('duration', 'Durasi (0 = penuh)'),
      sec('fadeIn', 'Fade in'),
      sec('fadeOut', 'Fade out'),
      track(checkField({ label: 'Ulang terus (loop)', get: () => !!clip.loop, set: (v) => edit(() => (v ? (clip.loop = true) : delete clip.loop), ['timeline', 'sound']) })),
    );
  }
  kids.push(h('p.note', {}, sc ? `Ikut scene “${sc.name}” — pindah scene, suaranya ikut.` : 'Global: diukur dari awal video.'));
  const scopeBtn = sc
    ? btn('Jadikan global', () => edit(() => {
        const e = entry(S.doc.scenes.indexOf(sc));
        clip.at = (clip.at ?? 0) + (e?.start ?? 0);
        delete clip.scene;
      }, ['timeline', 'sound', 'inspector']), 'small ghost')
    : btn('Ikatkan ke scene ini', () => edit(() => {
        const e = entry();
        clip.at = Math.max(0, (clip.at ?? 0) - (e?.start ?? 0));
        clip.scene = scene().id;
      }, ['timeline', 'sound', 'inspector']), 'small ghost');
  kids.push(h('div.rowbtns', {}, scopeBtn, btn('Hapus suara', () => emit('cmd', 'delete'), 'small ghost danger', 'trash')));
  return [h('div.ihead', {}, h('span.itype', { html: icon(clip.sfx ? 'sparkle' : 'music', 16) }), h('div.iname', {}, h('b', {}, clip.sfx ? `SFX ${clip.sfx.type}` : clip.src.split('/').pop()), h('span.iid', {}, clip.id))), section('Suara', kids, { id: 'clip' })];
}

// ------------------------------------------------------------ scene & project panel

function scenePanel() {
  const sc = scene();
  if (!sc) return [h('p.note', {}, 'Belum ada scene.')];
  const fps = S.doc.fps;
  const idx = S.scene;
  const out = [];
  if (!sc.layers.length) {
    out.push(h('div.welcome', {},
      h('b', {}, 'Scene ini masih kosong'),
      h('ul', {},
        h('li', { html: `${icon('brush', 14)} <b>Kuas (B)</b> — gambar langsung di kanvas` }),
        h('li', { html: `${icon('text', 14)} <b>Teks (T)</b> — klik di kanvas, lalu ketik` }),
        h('li', { html: `${icon('rect', 14)} <b>Bentuk (R/O/P)</b> — tarik di kanvas` }),
        h('li', { html: `${icon('image', 14)} <b>Gambar (I)</b> — atau seret foto ke kanvas` }),
        h('li', { html: `${icon('wand', 14)} Pilih objek → <b>Animasi cepat</b> di panel ini` }))));
  }
  const name = textField({ label: 'Nama scene', get: () => sc.name, set: (v) => live(() => (sc.name = v), ['scenes', 'timeline']), commit: () => commit(['scenes', 'timeline']) });
  const kids = [
    track(name),
    track(timeField({ label: 'Durasi', fps, min: 1, get: () => sc.duration, set: (v) => live(() => {
      sc.duration = Math.max(1, v);
      if (S.lf >= sc.duration) S.lf = sc.duration - 1;
    }, ['view', 'overlay', 'timeline', 'values', 'scenes']), commit: () => commit() })),
    track(paintField({ label: 'Latar scene', noneLabel: 'Ikut proyek', get: () => sc.background, set: (v) => live(() => (v === undefined ? delete sc.background : (sc.background = v)), ['view', 'scenes']), commit: () => commit(['view', 'scenes']) })),
  ];
  if (idx > 0) {
    kids.push(track(selField({
      label: 'Transisi masuk',
      options: TRANSITIONS,
      get: () => sc.transition?.type ?? 'cut',
      set: (v) => edit(() => {
        if (v === 'cut') delete sc.transition;
        else sc.transition = { ...(sc.transition || {}), type: v, duration: sc.transition?.duration ?? Math.round(fps * 0.5) };
      }),
    })));
    if (sc.transition) {
      kids.push(track(timeField({ label: 'Lama transisi', fps, min: 1, get: () => sc.transition?.duration ?? 12, set: (v) => live(() => (sc.transition = { ...sc.transition, duration: v }), ['timeline', 'scenes', 'values']), commit: () => commit() })));
      if (['dip', 'flash', 'fade-white', 'fade-black'].includes(sc.transition.type)) {
        kids.push(track(colorField({ label: 'Warna transisi', get: () => sc.transition?.color ?? (sc.transition.type === 'dip' ? '#000000' : '#ffffff'), set: (v) => live(() => (sc.transition = { ...sc.transition, color: v }), ['view']), commit: () => commit(['view']) })));
      }
    }
  } else kids.push(h('p.note', {}, 'Scene pertama tidak punya transisi masuk.'));
  out.push(section(`Scene ${idx + 1}`, kids, { id: 'scene' }));

  // camera
  const camKids = [
    camField(sc, 'x', 'Geser X', { unit: 'px' }),
    camField(sc, 'y', 'Geser Y', { unit: 'px' }),
    camField(sc, 'zoom', 'Zoom', { step: 0.01, digits: 2, min: 0.05 }),
    camField(sc, 'rotation', 'Putar', { step: 0.5, digits: 1, unit: '°' }),
    h('div.chips', {},
      btn('Dorong pelan', () => edit(() => sceneHandle(sc).camera.push({ zoom: 1.12, from: S.lf })), 'chip'),
      btn('Tarik mundur', () => edit(() => {
        const cam = sceneHandle(sc).camera;
        cam.key(S.lf, { zoom: 1.18 }, 'in-out-sine').key(sc.duration - 1, { zoom: 1 });
      }), 'chip'),
      btn('Kamera tangan', () => edit(() => sceneHandle(sc).camera.handheld({ amp: 6 })), 'chip'),
      btn('Guncang di sini', () => edit(() => sceneHandle(sc).camera.shake({ amp: 14, freq: 16, from: S.lf, to: Math.min(sc.duration, S.lf + Math.round(fps * 0.4)), decay: true })), 'chip'),
      btn('Reset kamera', () => edit(() => delete sc.camera), 'chip')),
  ];
  if (sc.camera?.behaviors?.length) camKids.push(h('p.note', {}, `Gerak kamera: ${sc.camera.behaviors.map((b) => (b.type === 'wiggle' ? 'tangan' : 'guncang')).join(', ')}`));
  out.push(section('Kamera', camKids, { id: 'camera', open: false }));

  // project
  const doc = S.doc;
  const fx = () => doc.effects || {};
  const setFx = (k, v) => {
    const e = { ...fx() };
    if (!v) delete e[k];
    else e[k] = v;
    if (Object.keys(e).length) doc.effects = e;
    else delete doc.effects;
  };
  const preset = Object.entries(PRESETS).find(([, [w, hh]]) => w === doc.width && hh === doc.height)?.[0];
  const projKids = [
    track(textField({ label: 'Judul', get: () => doc.title, set: (v) => live(() => (doc.title = v), ['top']), commit: () => commit(['top']) })),
    h('div.field', {}, h('label', {}, 'Ukuran'), h('div.fin.static', {}, `${doc.width} × ${doc.height}${preset ? ` (${preset})` : ''} · ${doc.fps} fps`)),
    track(paintField({ label: 'Latar proyek', allowNone: false, get: () => doc.background, set: (v) => live(() => (doc.background = v), ['view', 'scenes']), commit: () => commit(['view', 'scenes']) })),
    track(numField({ label: 'Grain kertas', get: () => Math.round((typeof fx().grain === 'number' ? fx().grain : fx().grain?.amount ?? 0) * 100), set: (v) => live(() => setFx('grain', v > 0 ? { amount: v / 100, animate: true } : 0), ['view']), commit: () => commit(['view', 'scenes']), min: 0, max: 40, unit: '%' })),
    track(numField({ label: 'Vignette', get: () => Math.round((typeof fx().vignette === 'number' ? fx().vignette : fx().vignette?.amount ?? 0) * 100), set: (v) => live(() => setFx('vignette', v > 0 ? v / 100 : 0), ['view']), commit: () => commit(['view', 'scenes']), min: 0, max: 90, unit: '%' })),
    track(checkField({ label: 'Garis hidup (line boil) untuk coretan', get: () => !!doc.boil, set: (v) => edit(() => (v ? (doc.boil = { every: 4, variants: 3, amount: 1 }) : delete doc.boil)) })),
  ];
  out.push(section('Proyek', projKids, { id: 'project', open: false }));
  return out;
}

// ------------------------------------------------------------ build

function rebuild() {
  invalidate('inspector');
}

export function buildInspector(force = false) {
  const ae = document.activeElement;
  if (!force && root.contains(ae) && ae.matches('input[type=text], textarea')) {
    pendingRebuild = true;
    return;
  }
  pendingRebuild = false;
  const scrollTop = root.scrollTop;
  fields = [];
  root.innerHTML = '';
  if (!S.doc) return;
  const clip = selClip();
  if (clip) root.append(...clipPanel(clip));
  else {
    const loc = selNode();
    if (loc) {
      const sel = selElement();
      if (sel) root.append(elementPanel(sel));
      root.append(...layerPanel(loc));
    } else root.append(...scenePanel());
  }
  root.scrollTop = scrollTop;
}

function refreshValues() {
  for (const f of fields) f.update();
}

root.addEventListener('focusout', () => {
  setTimeout(() => {
    if (pendingRebuild && !root.contains(document.activeElement)) buildInspector();
  }, 0);
});

on('refresh', (f) => {
  if (f.has('inspector')) buildInspector();
  else if (f.has('values')) refreshValues();
});

on('focusText', (opts) => {
  setTimeout(() => {
    buildInspector(true);
    const ta = document.getElementById('textEdit');
    if (ta) {
      ta.focus();
      if (opts?.selectAll) ta.select();
    }
  }, 30);
});

export { locate, nodeKeyFrames, esc };
