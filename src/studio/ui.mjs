// Small DOM toolkit for Gerak Studio: element builder, form fields, modal, toast.
import { icon } from './icons.mjs';
import { parseColor } from '/core/color.mjs';
import { toFrames } from '/core/util.mjs';

const PROPS = new Set(['value', 'checked', 'selected', 'disabled', 'multiple', 'indeterminate']);

/** h('div.a.b', {onclick, style:{}, html}, ...children) */
export function h(tag, attrs, ...kids) {
  const [t, ...cls] = tag.split('.');
  const el = document.createElement(t || 'div');
  if (cls.length) el.className = cls.join(' ');
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v === undefined || v === null || v === false) continue;
    if (k === 'class') el.className = `${el.className} ${v}`.trim();
    else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
    else if (k === 'html') el.innerHTML = v;
    else if (k === 'dataset') Object.assign(el.dataset, v);
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
    else if (PROPS.has(k)) el[k] = v;
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const c of kids.flat(Infinity)) {
    if (c === null || c === undefined || c === false) continue;
    el.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
  return el;
}

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

export function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}

export function iconBtn(name, title, onclick, cls = '') {
  return h(`button.ib${cls ? `.${cls}` : ''}`, { title, 'aria-label': title, onclick, html: icon(name) });
}

export function btn(label, onclick, cls = '', iconName) {
  return h(`button.btn${cls ? `.${cls.split(' ').join('.')}` : ''}`, { onclick, html: `${iconName ? icon(iconName, 16) : ''}<span>${esc(label)}</span>` });
}

// ------------------------------------------------------------ toast & modal

let toastTimer = 0;
export function toast(msg, kind = '') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = `show ${kind}`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (t.className = ''), kind === 'err' ? 5000 : 2600);
}

let modalClose = null;
export function openModal({ title, body, wide = false, onClose, cls = '', closable = !String(cls).includes('noclose') }) {
  closeModal();
  const root = document.getElementById('modal');
  const box = h(`div.mbox${wide ? '.wide' : ''}${cls ? `.${cls}` : ''}`, {},
    h('div.mhead', {}, h('h2', {}, title ?? ''), iconBtn('close', 'Tutup', () => close())),
    h('div.mbody', {}, body));
  root.innerHTML = '';
  root.append(box);
  root.hidden = false;
  const onKey = (e) => {
    if (e.key === 'Escape' && closable) {
      e.stopPropagation();
      close();
    }
  };
  const onBg = (e) => {
    if (e.target === root && closable) close();
  };
  root.addEventListener('pointerdown', onBg);
  window.addEventListener('keydown', onKey, true);
  let closed = false;
  function close() {
    if (closed) return;
    closed = true;
    root.hidden = true;
    root.innerHTML = '';
    root.removeEventListener('pointerdown', onBg);
    window.removeEventListener('keydown', onKey, true);
    if (modalClose === close) modalClose = null;
    onClose?.();
  }
  modalClose = close;
  return { close, box };
}

export function closeModal() {
  modalClose?.();
}

export function modalOpen() {
  return !document.getElementById('modal').hidden;
}

export function confirmBox(message, { ok = 'Ya', cancel = 'Batal', danger = false } = {}) {
  return new Promise((done) => {
    let answered = false;
    const m = openModal({
      title: 'Konfirmasi',
      body: h('div', {},
        h('p.mtext', {}, message),
        h('div.mactions', {},
          btn(cancel, () => m.close(), 'ghost'),
          btn(ok, () => {
            answered = true;
            m.close();
          }, danger ? 'danger' : 'primary'))),
      onClose: () => done(answered),
    });
  });
}

export function promptBox(title, value = '', { ok = 'Simpan', placeholder = '' } = {}) {
  return new Promise((done) => {
    let result = null;
    const input = h('input.text', { type: 'text', value, placeholder });
    const submit = () => {
      result = input.value;
      m.close();
    };
    input.addEventListener('keydown', (e) => e.key === 'Enter' && submit());
    const m = openModal({
      title,
      body: h('div', {}, input, h('div.mactions', {}, btn('Batal', () => m.close(), 'ghost'), btn(ok, submit, 'primary'))),
      onClose: () => done(result),
    });
    setTimeout(() => {
      input.focus();
      input.select();
    }, 0);
  });
}

// ------------------------------------------------------------ number parsing

export function parseNum(s) {
  const t = String(s).trim().replace(',', '.');
  if (!t) return NaN;
  // allow simple arithmetic like 540+20 or 1080/2
  if (/^[-+*/().\d\s]+$/.test(t)) {
    try {
      const v = Function(`"use strict";return (${t})`)();
      return typeof v === 'number' ? v : NaN;
    } catch {
      return NaN;
    }
  }
  return NaN;
}

/** "1.5" → seconds, "1.5s" / "500ms" / "12f" / "0:02" → time strings. Returns frames. */
export function parseTime(s, fps) {
  const t = String(s).trim().replace(',', '.');
  if (/^-?\d*\.?\d+$/.test(t)) return Math.round(parseFloat(t) * fps);
  try {
    return Math.round(toFrames(t, fps));
  } catch {
    return NaN;
  }
}

export const fmtSec = (f, fps, digits = 2) => (f / fps).toFixed(digits);

// ------------------------------------------------------------ drag sessions

/** True while a field label is being scrubbed (fields must not re-render under the pointer). */
export const drag = { active: 0 };

/**
 * Track a pointer drag on window (survives the source element being re-rendered or removed).
 * move(ev) on every move; end(ev) exactly once on pointerup / pointercancel / blur.
 */
export function dragSession(e, { move, end }) {
  drag.active++;
  const id = e.pointerId;
  let done = false;
  const onMove = (ev) => {
    if (ev.pointerId === id) move?.(ev);
  };
  const finish = (ev) => {
    if (done || (ev && ev.pointerId !== undefined && ev.pointerId !== id)) return;
    done = true;
    drag.active--;
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('pointerup', finish);
    window.removeEventListener('pointercancel', finish);
    window.removeEventListener('blur', finish);
    end?.(ev);
  };
  window.addEventListener('pointermove', onMove);
  window.addEventListener('pointerup', finish);
  window.addEventListener('pointercancel', finish);
  window.addEventListener('blur', finish);
  return finish;
}

// ------------------------------------------------------------ fields
// Every field returns { el, update } — update() re-reads the value (for playhead changes).

function scrubLabel(text, { onStart, onDelta, onEnd }) {
  const lab = h('label.scrub', { title: 'Geser kiri/kanan untuk mengubah nilai' }, text);
  lab.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    e.preventDefault();
    const active = document.activeElement;
    if (active && active !== document.body && active.blur) active.blur();
    const x0 = e.clientX;
    onStart();
    dragSession(e, {
      move: (ev) => onDelta(ev.clientX - x0, ev.shiftKey ? 10 : ev.altKey ? 0.1 : 1),
      end: () => onEnd(),
    });
  });
  return lab;
}

/**
 * Numeric field with a scrub label.
 * opts: label, get(), set(v) live, commit(), step, min, max, digits, unit, after (Node), title
 */
export function numField({ label, get, set, commit, step = 1, min = -Infinity, max = Infinity, digits = 0, unit = '', after, title, wide = false }) {
  const input = h('input.num', { type: 'text', inputmode: 'decimal', spellcheck: 'false', title });
  const fmt = (v) => (v === undefined || v === null || Number.isNaN(+v) ? '' : String(+(+v).toFixed(digits)));
  const cl = (v) => Math.min(max, Math.max(min, v));
  let v0 = 0;
  const lab = scrubLabel(label, {
    onStart: () => (v0 = +get() || 0),
    onDelta: (dx, k) => {
      const v = cl(+(v0 + dx * step * k).toFixed(Math.max(digits, 3)));
      set(v);
      input.value = fmt(v);
    },
    onEnd: () => commit(),
  });
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') input.blur();
    else if (e.key === 'Escape') {
      input.value = fmt(get());
      input.blur();
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault();
      const d = (e.key === 'ArrowUp' ? 1 : -1) * step * (e.shiftKey ? 10 : 1);
      const v = cl(+((+get() || 0) + d).toFixed(Math.max(digits, 3)));
      set(v);
      commit();
      input.value = fmt(v);
    }
  });
  input.addEventListener('change', () => {
    const v = parseNum(input.value);
    if (Number.isFinite(v)) {
      set(cl(v));
      commit();
    }
    input.value = fmt(get());
  });
  const row = h(`div.field${wide ? '.wide' : ''}`, {}, lab, h('div.fin', {}, input, unit ? h('span.unit', {}, unit) : null), after ?? null);
  const update = () => {
    if (document.activeElement !== input) input.value = fmt(get());
  };
  update();
  return { el: row, update, input };
}

/** Time field: shows seconds, stores frames. */
export function timeField({ label, get, set, commit, fps, min = 0, max = Infinity, after, title }) {
  const input = h('input.num', { type: 'text', spellcheck: 'false', title: title ?? 'detik (boleh juga 12f, 500ms, 0:02)' });
  const fmt = (f) => (f === undefined || f === null || Number.isNaN(+f) ? '' : String(+(f / fps).toFixed(2)));
  const cl = (v) => Math.round(Math.min(max, Math.max(min, v)));
  let f0 = 0;
  const lab = scrubLabel(label, {
    onStart: () => (f0 = +get() || 0),
    onDelta: (dx, k) => {
      const f = cl(f0 + Math.round(dx * 0.5 * k));
      set(f);
      input.value = fmt(f);
    },
    onEnd: () => commit(),
  });
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') input.blur();
    if (e.key === 'Escape') {
      input.value = fmt(get());
      input.blur();
    }
  });
  input.addEventListener('change', () => {
    const f = parseTime(input.value, fps);
    if (Number.isFinite(f)) {
      set(cl(f));
      commit();
    }
    input.value = fmt(get());
  });
  const row = h('div.field', {}, lab, h('div.fin', {}, input, h('span.unit', {}, 'd')), after ?? null);
  const update = () => {
    if (document.activeElement !== input) input.value = fmt(get());
  };
  update();
  return { el: row, update, input };
}

export function textField({ label, get, set, commit, placeholder = '', multiline = false, rows = 3 }) {
  const input = multiline ? h('textarea.text', { rows, placeholder, spellcheck: 'false' }) : h('input.text', { type: 'text', placeholder, spellcheck: 'false' });
  input.addEventListener('input', () => set(input.value));
  input.addEventListener('change', () => commit());
  input.addEventListener('blur', () => commit());
  if (!multiline) input.addEventListener('keydown', (e) => e.key === 'Enter' && input.blur());
  const row = h(`div.field.col`, {}, label ? h('label', {}, label) : null, input);
  const update = () => {
    if (document.activeElement !== input) input.value = get() ?? '';
  };
  update();
  return { el: row, update, input };
}

export function selField({ label, options, get, set, title }) {
  const sel = h('select.sel', { title });
  const build = () => {
    sel.innerHTML = '';
    for (const o of options) {
      if (o && o.group) {
        const g = h('optgroup', { label: o.group });
        for (const [v, t] of o.items) g.append(h('option', { value: v }, t));
        sel.append(g);
      } else {
        const [v, t] = Array.isArray(o) ? o : [o, o];
        sel.append(h('option', { value: v }, t));
      }
    }
  };
  build();
  sel.addEventListener('change', () => {
    set(sel.value);
    sel.blur();
  });
  const row = h('div.field', {}, label ? h('label', {}, label) : null, h('div.fin', {}, sel));
  const update = () => {
    const v = get();
    const s = v === undefined || v === null ? '' : String(v);
    if (![...sel.options].some((o) => o.value === s) && s) sel.append(h('option', { value: s }, s));
    sel.value = s;
  };
  update();
  return { el: row, update, select: sel };
}

export function checkField({ label, get, set, title }) {
  const cb = h('input', { type: 'checkbox' });
  cb.addEventListener('change', () => set(cb.checked));
  const row = h('label.check', { title }, cb, h('span', {}, label));
  const update = () => (cb.checked = !!get());
  update();
  return { el: row, update, input: cb };
}

/** Segmented buttons: options [[value, label|{icon}], ...] */
export function segField({ label, options, get, set }) {
  const wrap = h('div.seg');
  const btns = options.map(([v, l, ic]) => {
    const b = h('button', { type: 'button', title: typeof l === 'string' ? l : '', html: ic ? icon(ic, 16) : esc(l) });
    b.addEventListener('click', () => set(v));
    wrap.append(b);
    return [v, b];
  });
  const row = h('div.field', {}, label ? h('label', {}, label) : null, h('div.fin', {}, wrap));
  const update = () => {
    const cur = get();
    for (const [v, b] of btns) b.classList.toggle('on', v === cur);
  };
  update();
  return { el: row, update };
}

export const SWATCHES = ['#111111', '#ffffff', '#2D3E8D', '#00B7B3', '#f4efe6', '#ff6b6b', '#ffd43b', '#51cf66', '#845ef7', '#ff922b', '#74c0fc', '#868e96'];

export function toHex(c) {
  const rgb = parseColor(c);
  if (!rgb) return '#000000';
  return `#${rgb.slice(0, 3).map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('')}`;
}

function colorInputs(get, set, commit) {
  const pick = h('input.color', { type: 'color' });
  const txt = h('input.text.hex', { type: 'text', spellcheck: 'false' });
  pick.addEventListener('input', () => {
    set(pick.value);
    txt.value = pick.value;
  });
  pick.addEventListener('change', () => commit());
  txt.addEventListener('keydown', (e) => e.key === 'Enter' && txt.blur());
  txt.addEventListener('change', () => {
    const v = txt.value.trim();
    if (parseColor(v)) {
      set(v);
      commit();
    } else txt.value = get() ?? '';
  });
  const update = () => {
    const v = get();
    if (typeof v === 'string') {
      pick.value = toHex(v);
      if (document.activeElement !== txt) txt.value = v;
    }
  };
  return { pick, txt, update };
}

/** Solid colour field with swatches. */
export function colorField({ label, get, set, commit, swatches = true }) {
  const c = colorInputs(get, set, commit);
  const sw = swatches
    ? h('div.swatches', {}, SWATCHES.map((s) => h('button.sw', { type: 'button', title: s, style: { background: s }, onclick: () => (set(s), commit(), update()) })))
    : null;
  const row = h('div.field.col', {}, label ? h('label', {}, label) : null, h('div.crow', {}, c.pick, c.txt), sw);
  const update = () => c.update();
  update();
  return { el: row, update };
}

/**
 * Paint: none | solid colour | linear/radial gradient (2 stops).
 * get() → string | {type, angle, stops} | undefined
 */
export function paintField({ label, get, set, commit, allowNone = true, noneLabel = 'Kosong' }) {
  const mode = h('select.sel.mode');
  const modes = [...(allowNone ? [['none', noneLabel]] : []), ['color', 'Warna'], ['linear', 'Gradien'], ['radial', 'Gradien bulat']];
  for (const [v, t] of modes) mode.append(h('option', { value: v }, t));
  const kind = () => {
    const v = get();
    if (v === undefined || v === null || v === 'none') return 'none';
    if (typeof v === 'string') return 'color';
    return v.type === 'radial' ? 'radial' : 'linear';
  };
  const stops = () => {
    const v = get();
    if (typeof v === 'string') return [v, v];
    if (v && v.stops && v.stops.length) return [v.stops[0][1], v.stops[v.stops.length - 1][1]];
    return ['#2D3E8D', '#00B7B3'];
  };
  const body = h('div.pbody');
  const swatches = h('div.swatches');
  const setStop = (i, c, live = true) => {
    const k = kind();
    if (k === 'color' || k === 'none') set(c);
    else {
      const v = { ...get() };
      const st = stops();
      st[i] = c;
      v.stops = [[0, st[0]], [1, st[1]]];
      set(v);
    }
    if (!live) commit();
  };
  const render = () => {
    body.innerHTML = '';
    const k = kind();
    mode.value = k;
    if (k === 'none') {
      swatches.hidden = true;
      return;
    }
    swatches.hidden = false;
    const st = stops();
    if (k === 'color') {
      const c = colorInputs(() => get(), (v) => set(v), commit);
      c.update();
      body.append(h('div.crow', {}, c.pick, c.txt));
    } else {
      const a = colorInputs(() => stops()[0], (v) => setStop(0, v), commit);
      const b = colorInputs(() => stops()[1], (v) => setStop(1, v), commit);
      a.update();
      b.update();
      body.append(h('div.crow', {}, a.pick, a.txt), h('div.crow', {}, b.pick, b.txt));
      if (k === 'linear') {
        const ang = numField({
          label: 'Sudut',
          get: () => get()?.angle ?? 90,
          set: (v) => set({ ...get(), angle: v }),
          commit,
          step: 1,
          unit: '°',
        });
        body.append(ang.el);
      }
      void st;
    }
  };
  for (const s of SWATCHES) {
    swatches.append(h('button.sw', {
      type: 'button',
      title: s,
      style: { background: s },
      onclick: () => {
        setStop(0, s, false);
        render();
      },
    }));
  }
  mode.addEventListener('change', () => {
    const st = stops();
    const m = mode.value;
    if (m === 'none') set(undefined);
    else if (m === 'color') set(st[0]);
    else if (m === 'linear') set({ type: 'linear', angle: 90, stops: [[0, st[0]], [1, st[1] === st[0] ? '#00B7B3' : st[1]]] });
    else set({ type: 'radial', stops: [[0, st[0]], [1, st[1] === st[0] ? '#2D3E8D' : st[1]]] });
    commit();
    render();
    mode.blur();
  });
  const row = h('div.field.col.paint', {}, h('div.prow', {}, label ? h('label', {}, label) : null, mode), body, swatches);
  let shown = '';
  const renderIfChanged = () => {
    const now = JSON.stringify(get() ?? null);
    if (now === shown) return;
    shown = now;
    render();
  };
  const update = () => {
    if (drag.active || row.contains(document.activeElement)) return;
    renderIfChanged();
  };
  renderIfChanged();
  return { el: row, update };
}

/** Collapsible inspector section. */
export function section(title, kids, { id, open = true, actions } = {}) {
  const key = id ? `gerak.sec.${id}` : null;
  let isOpen = open;
  try {
    if (key && localStorage.getItem(key) !== null) isOpen = localStorage.getItem(key) === '1';
  } catch {
    /* storage unavailable */
  }
  const body = h('div.secbody', {}, kids);
  const head = h('div.sechead', {}, h('span.chev', { html: icon('chevronDown', 14) }), h('span.sectitle', {}, title), actions ? h('span.secact', { onclick: (e) => e.stopPropagation() }, actions) : null);
  const sec = h(`section.sec${isOpen ? '' : '.closed'}`, {}, head, body);
  head.addEventListener('click', () => {
    sec.classList.toggle('closed');
    try {
      if (key) localStorage.setItem(key, sec.classList.contains('closed') ? '0' : '1');
    } catch {
      /* ignore */
    }
  });
  return sec;
}

export function fmtBytes(n) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

export function fmtClock(sec) {
  const m = Math.floor(sec / 60);
  const s = sec - m * 60;
  return `${m}:${s.toFixed(2).padStart(5, '0')}`;
}
