// Gerak Studio entry: top bar, commands, keyboard shortcuts, boot.
import {
  S, on, emit, invalidate, ALL, scene, entry, selNode, selElement, selClip, select, setFrame, goScene,
  edit, undo, redo, canUndo, canRedo, save, openProject, loadBundledFonts, locate, toggleKey, keyAt, setChannel, channelValue,
  end, inTransaction,
} from './state.mjs';
import { api } from './api.mjs';
import { layout, play, zoomFit, zoomAt } from './view.mjs';
import { initTools, setTool, TOOLS, isDragging } from './tools.mjs';
import './inspector.mjs';
import { initTimeline } from './timeline.mjs';
import { initPanels } from './panels.mjs';
import { showHome, showRender } from './home.mjs';
import { h, toast, modalOpen, confirmBox, iconBtn, btn, openModal, esc } from './ui.mjs';
import { icon } from './icons.mjs';
import { translateElement } from './geom.mjs';

// ------------------------------------------------------------ top bar

const top = document.getElementById('top');
let titleInput;
let fmtChip;
let undoBtn;
let redoBtn;
let saveEl;

function buildTop() {
  top.innerHTML = '';
  titleInput = h('input.title', { type: 'text', spellcheck: 'false', title: 'Judul video' });
  titleInput.addEventListener('change', () => {
    if (!S.doc) return;
    edit(() => (S.doc.title = titleInput.value.trim() || 'Tanpa judul'), ['top', 'inspector']);
  });
  titleInput.addEventListener('keydown', (e) => e.key === 'Enter' && titleInput.blur());
  fmtChip = h('span.chip');
  undoBtn = iconBtn('undo', 'Undo (Ctrl+Z)', () => undo());
  redoBtn = iconBtn('redo', 'Redo (Ctrl+Shift+Z)', () => redo());
  saveEl = h('span.save');
  top.append(
    h('div.brand', { html: '<span class="logo"></span><span>Gerak <b>Studio</b></span>' }),
    btn('Proyek', () => showHome('projects'), 'ghost small', 'folder'),
    h('div.tdiv'),
    titleInput,
    fmtChip,
    h('div.spacer'),
    undoBtn,
    redoBtn,
    saveEl,
    iconBtn('settings', 'Bantuan & pintasan keyboard (?)', () => showHelp()),
    btn('Render', () => showRender(), 'primary', 'film'),
  );
}

function syncTop() {
  if (!titleInput) return;
  const doc = S.doc;
  if (document.activeElement !== titleInput) titleInput.value = doc?.title ?? '';
  titleInput.disabled = !doc;
  fmtChip.textContent = doc ? `${doc.width}×${doc.height} · ${doc.fps} fps` : '';
  undoBtn.disabled = !canUndo();
  redoBtn.disabled = !canRedo();
  const st = { saved: ['Tersimpan', 'ok'], dirty: ['Belum tersimpan…', 'dirty'], saving: ['Menyimpan…', 'dirty'], error: ['Gagal simpan — mencoba lagi', 'err'] }[S.saveState] ?? ['', ''];
  saveEl.textContent = doc ? st[0] : '';
  saveEl.className = `save ${st[1]}`;
  document.title = doc ? `${doc.title} · Gerak Studio` : 'Gerak Studio';
  document.body.classList.toggle('noproject', !doc);
}

function showHelp() {
  const rows = [
    ['Spasi', 'Putar / jeda'],
    [', .', 'Mundur / maju 1 frame (Shift = 10)'],
    ['Home End', 'Awal / akhir scene'],
    ['[ ]', 'Scene sebelumnya / berikutnya'],
    ...TOOLS.map((t) => [t.key.toUpperCase(), t.label.replace(/ \(.\)$/, '')]),
    ['K', 'Keyframe posisi, skala, putar, opasitas di playhead'],
    ['Del', 'Hapus yang dipilih (layer, elemen, keyframe, suara)'],
    ['Ctrl+D', 'Duplikat'],
    ['Ctrl+C / Ctrl+V', 'Salin / tempel layer'],
    ['Ctrl+] / Ctrl+[', 'Ke depan / ke belakang'],
    ['Panah', 'Geser objek 1 px (Shift = 10 px); tanpa pilihan = pindah frame'],
    ['Esc', 'Naik satu tingkat pilihan / batal pilih'],
    ['Ctrl+Z / Ctrl+Shift+Z', 'Undo / redo'],
    ['Ctrl+S', 'Simpan sekarang (otomatis tersimpan juga)'],
    ['Ctrl + scroll', 'Zoom kanvas · scroll = geser kanvas · F = pas layar'],
    ['G / S', 'Grid sepertiga / area aman 9:16'],
  ];
  openModal({
    title: 'Bantuan',
    body: h('div.help', {},
      h('div.helpcols', {},
        h('div', {},
          h('h3', {}, 'Cara kerja'),
          h('ol', {},
            h('li', {}, 'Pilih alat di kiri kanvas: kuas, teks, bentuk, atau gambar. Tiap teks/bentuk/gambar jadi layer sendiri.'),
            h('li', {}, 'Klik objek untuk memilih. Seret untuk geser, kotak sudut untuk skala, bulatan atas untuk putar.'),
            h('li', {}, 'Animasi: pilih objek → “Animasi cepat” di panel kanan (Pop, Fade, Naik, …). Dipasang mulai di playhead.'),
            h('li', {}, 'Animasi manual: klik ◇ di samping X/Y/Skala untuk keyframe, geser playhead, ubah nilai → keyframe baru otomatis.'),
            h('li', {}, 'Timeline bawah: seret ◆ untuk mengubah waktu, seret ujung batang untuk waktu tampil, seret batang untuk menggeser semua timing layer.'),
            h('li', {}, 'Kuas dengan “Tergambar”: tiap coretan muncul seperti digambar; playhead maju sendiri.'),
            h('li', {}, 'Tab Suara: musik dan 29 efek suara. Klik efek untuk menaruh di playhead.'),
            h('li', {}, 'Render → MP4/GIF/WebM transparan. Proyek tersimpan otomatis sebagai .gerak.json (bisa dirender juga dari CLI).'))),
        h('div', {}, h('h3', {}, 'Pintasan keyboard'), h('table.keys', {}, rows.map(([k, v]) => h('tr', {}, h('td', {}, h('kbd', {}, k)), h('td', {}, v))))))),
    wide: true,
  });
}

// ------------------------------------------------------------ cloning helpers

const baseId = (id) => String(id).replace(/-\d+$/, '');

function cloneNode(node) {
  const map = new Map();
  const c = JSON.parse(JSON.stringify(node));
  const visit = (n) => {
    const nid = S.proj._newId(baseId(n.id));
    map.set(n.id, nid);
    n.id = nid;
    for (const e of n.elements || []) e.id = S.proj._newId(baseId(e.id));
    (n.children || []).forEach(visit);
  };
  visit(c);
  const fix = (n) => {
    if (n.mask && map.has(n.mask)) n.mask = map.get(n.mask);
    for (const d of n.drawings || []) if (d.id && map.has(d.id)) d.id = map.get(d.id);
    (n.children || []).forEach(fix);
  };
  fix(c);
  return c;
}

function offsetNode(node, dx, dy) {
  for (const [ch, d] of [['x', dx], ['y', dy]]) {
    if (node.keys?.[ch]?.length) node.keys[ch] = node.keys[ch].map((k) => ({ ...k, v: k.v + d }));
    else (node.transform ||= {})[ch] = (node.transform?.[ch] ?? 0) + d;
  }
}

let clipboard = null;

// ------------------------------------------------------------ commands

function deleteKeyAtSel() {
  const ks = S.keySel;
  if (!ks) return false;
  edit(() => {
    const keys = ks.camera ? scene().camera?.keys : locate(ks.node)?.node.keys;
    if (!keys) return;
    for (const [ch, arr] of Object.entries(keys)) {
      const i = arr.findIndex((k) => k.f === ks.f);
      if (i < 0) continue;
      const [k] = arr.splice(i, 1);
      if (!arr.length) {
        delete keys[ch];
        if (ks.camera) ((scene().camera.base ||= {})[ch] = k.v);
        else {
          const n = locate(ks.node).node;
          (n.transform ||= {})[ch] = k.v;
        }
      }
    }
  });
  S.keySel = null;
  invalidate(...ALL);
  return true;
}

const commands = {
  delete() {
    if (S.keySel) return deleteKeyAtSel();
    const clip = selClip();
    if (clip) {
      edit(() => S.doc.audio.splice(S.doc.audio.indexOf(clip), 1));
      return select({});
    }
    const loc = selNode();
    if (!loc) return;
    if (S.sel.el && (loc.node.elements || []).length > 1) {
      edit(() => (loc.node.elements = loc.node.elements.filter((e) => e.id !== S.sel.el)));
      return select({ node: loc.node.id });
    }
    edit(() => {
      loc.list.splice(loc.list.indexOf(loc.node), 1);
      if (loc.parent && loc.parent.mask === loc.node.id) delete loc.parent.mask;
    });
    select(loc.parent ? { node: loc.parent.id } : {});
  },
  deleteKey: deleteKeyAtSel,
  duplicate() {
    const clip = selClip();
    if (clip) {
      let id;
      edit(() => {
        const c = JSON.parse(JSON.stringify(clip));
        c.id = S.proj._newId(baseId(clip.id));
        c.at = (c.at ?? 0) + Math.round(S.doc.fps / 2);
        S.doc.audio.push(c);
        id = c.id;
      });
      return select({ clip: id });
    }
    const loc = selNode();
    if (!loc) return;
    const sel = S.sel.el ? selElement() : null;
    if (sel) {
      let id;
      edit(() => {
        const c = { ...translateElement(sel.el, 24, 24), id: S.proj._newId(baseId(sel.el.id)) };
        sel.node.elements.splice(sel.elIndex + 1, 0, c);
        id = c.id;
      });
      return select({ node: loc.node.id, el: id });
    }
    let id;
    edit(() => {
      const c = cloneNode(loc.node);
      c.name = `${loc.node.name ?? loc.node.id} salinan`;
      offsetNode(c, 24, 24);
      loc.list.splice(loc.list.indexOf(loc.node) + 1, 0, c);
      id = c.id;
    });
    select({ node: id });
  },
  copy() {
    const loc = selNode();
    if (!loc) return;
    clipboard = JSON.stringify(loc.node);
    toast(`“${loc.node.name}” disalin`);
  },
  paste() {
    if (!clipboard || !scene()) return;
    let id;
    edit(() => {
      const c = cloneNode(JSON.parse(clipboard));
      offsetNode(c, 24, 24);
      scene().layers.push(c);
      id = c.id;
    });
    select({ node: id });
  },
  raise() {
    const loc = selNode();
    if (!loc || loc.index >= loc.list.length - 1) return;
    edit(() => {
      loc.list.splice(loc.index, 1);
      loc.list.splice(loc.index + 1, 0, loc.node);
    });
  },
  lower() {
    const loc = selNode();
    if (!loc || loc.index <= 0) return;
    edit(() => {
      loc.list.splice(loc.index, 1);
      loc.list.splice(loc.index - 1, 0, loc.node);
    });
  },
  addScene() {
    const n = S.doc.scenes.length + 1;
    edit(() => {
      const sh = S.proj.scene(`Scene ${n}`, { duration: '3s' });
      const prev = scene();
      if (prev?.background !== undefined) sh.scene.background = JSON.parse(JSON.stringify(prev.background));
      if (S.doc.scenes.length > 1) sh.transition('fade', Math.round(S.doc.fps * 0.4));
      S.proj.moveScene(sh.id, S.scene + 1);
    });
    goScene(S.scene + 1);
    toast('Scene baru ditambahkan (transisi fade)');
  },
  duplicateScene({ index = S.scene } = {}) {
    const sc = S.doc.scenes[index];
    if (!sc) return;
    edit(() => {
      const c = JSON.parse(JSON.stringify(sc));
      c.id = S.proj._newId(baseId(sc.id));
      c.name = `${sc.name} (salinan)`;
      c.layers = sc.layers.map(cloneNode);
      S.doc.scenes.splice(index + 1, 0, c);
      for (const a of S.doc.audio.filter((q) => q.scene === sc.id)) {
        S.doc.audio.push({ ...JSON.parse(JSON.stringify(a)), id: S.proj._newId(baseId(a.id)), scene: c.id });
      }
    });
    goScene(index + 1);
  },
  async deleteScene({ index = S.scene } = {}) {
    const sc = S.doc.scenes[index];
    if (!sc) return;
    if (S.doc.scenes.length === 1) return toast('Minimal harus ada satu scene', 'err');
    if (sc.layers.length && !(await confirmBox(`Hapus scene “${sc.name}” beserta isinya?`, { ok: 'Hapus', danger: true }))) return;
    edit(() => S.proj.removeScene(sc.id));
    goScene(Math.min(index, S.doc.scenes.length - 1));
  },
};

on('cmd', (c) => {
  if (!S.doc) return;
  const name = typeof c === 'string' ? c : c.name;
  commands[name]?.(typeof c === 'object' ? c : undefined);
});

on('toast', ([msg, kind]) => toast(msg, kind));
let lastRenderErr = 0;
on('renderError', (e) => {
  if (Date.now() - lastRenderErr > 4000) toast(`Render error: ${e.message}`, 'err');
  lastRenderErr = Date.now();
});

// ------------------------------------------------------------ keyboard

function nudge(dx, dy) {
  const loc = selNode();
  if (!loc) return false;
  const sel = S.sel.el ? selElement() : null;
  edit(() => {
    if (sel) {
      const n = translateElement(sel.el, dx, dy);
      sel.node.elements[sel.elIndex] = { ...n, id: sel.el.id };
    } else {
      setChannel(loc.node, 'x', channelValue(loc.node, 'x', S.lf) + dx, S.lf);
      setChannel(loc.node, 'y', channelValue(loc.node, 'y', S.lf) + dy, S.lf);
    }
  }, ['view', 'overlay', 'timeline', 'values']);
  return true;
}

window.addEventListener('keydown', (e) => {
  if (modalOpen()) return;
  const t = e.target;
  const typing = t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable);
  const mod = e.ctrlKey || e.metaKey;
  const k = e.key.toLowerCase();
  if (mod && k === 's') {
    e.preventDefault();
    if (t?.blur && typing) t.blur();
    end();
    save().then(() => toast(S.saveState === 'saved' ? 'Tersimpan' : 'Belum tersimpan — dicoba lagi otomatis', S.saveState === 'saved' ? '' : 'err'));
    return;
  }
  if (typing) {
    if (e.key === 'Escape') t.blur();
    return;
  }
  if (!S.doc) return;
  if (mod && k === 'z') {
    e.preventDefault();
    if (e.shiftKey) redo();
    else undo();
    return;
  }
  if (mod && k === 'y') {
    e.preventDefault();
    return redo();
  }
  if (mod && k === 'd') {
    e.preventDefault();
    return commands.duplicate();
  }
  if (mod && k === 'c') return commands.copy();
  if (mod && k === 'v') return commands.paste();
  if (mod && e.key === ']') return commands.raise();
  if (mod && e.key === '[') return commands.lower();
  if (mod) return;
  if (e.code === 'Space') {
    e.preventDefault();
    return play();
  }
  if (e.key === 'Delete' || e.key === 'Backspace') {
    e.preventDefault();
    return commands.delete();
  }
  if (e.key === 'Escape') {
    if (S.tool !== 'select') return setTool('select');
    if (S.keySel) {
      S.keySel = null;
      return invalidate('timeline', 'inspector');
    }
    if (S.sel.el) return select({ node: S.sel.node });
    const loc = selNode();
    if (loc?.parent) return select({ node: loc.parent.id });
    return select({});
  }
  const big = e.shiftKey ? 10 : 1;
  if (e.key.startsWith('Arrow')) {
    e.preventDefault();
    const dx = e.key === 'ArrowLeft' ? -big : e.key === 'ArrowRight' ? big : 0;
    const dy = e.key === 'ArrowUp' ? -big : e.key === 'ArrowDown' ? big : 0;
    if (S.sel.node && S.tool === 'select' && nudge(dx, dy)) return;
    if (dx) setFrame(S.lf + dx);
    return;
  }
  if (e.key === ',' || e.key === '<') return setFrame(S.lf - big);
  if (e.key === '.' || e.key === '>') return setFrame(S.lf + big);
  if (e.key === 'Home') return setFrame(0);
  if (e.key === 'End') return setFrame(scene().duration - 1);
  if (e.key === '[') return S.scene > 0 && goScene(S.scene - 1);
  if (e.key === ']') return S.scene < S.doc.scenes.length - 1 && goScene(S.scene + 1);
  if (e.key === '?') return showHelp();
  if (k === 'f') return zoomFit();
  if (k === '+' || k === '=') return zoomAt(1.25);
  if (k === '-') return zoomAt(0.8);
  if (k === 'g') {
    S.view.grid = !S.view.grid;
    return invalidate('overlay', 'tools');
  }
  if (k === 's') {
    S.view.safe = !S.view.safe;
    return invalidate('overlay', 'tools');
  }
  if (k === 'k') {
    const loc = selNode();
    if (!loc) return;
    edit(() => {
      for (const ch of ['x', 'y', 'scale', 'rotation', 'opacity']) if (!keyAt(loc.node, ch, S.lf)) toggleKey(loc.node, ch, S.lf);
    }, ['view', 'overlay', 'timeline', 'values']);
    return toast('Keyframe ditambahkan');
  }
  if (e.shiftKey && k === 'o') {
    S.view.onion = !S.view.onion;
    return invalidate('view', 'tools');
  }
  const tool = TOOLS.find((q) => q.key === k);
  if (tool && !e.shiftKey && !e.altKey) setTool(tool.id);
});

// ------------------------------------------------------------ thumbnails

on('thumb', () => {
  if (!S.doc || !S.file) return;
  const file = S.file;
  const W = S.doc.width;
  const H = S.doc.height;
  const k = 320 / Math.max(W, H);
  const c = S.env.createCanvas(Math.round(W * k), Math.round(H * k));
  try {
    const sc = S.doc.scenes[0];
    S.renderer.renderSceneFrame(c.getContext('2d'), 0, Math.min(sc.duration - 1, Math.round(sc.duration * 0.7)), { scale: k });
    c.toBlob((b) => b && api.thumb(file, b).catch(() => {}), 'image/png');
  } catch (e) {
    console.warn(e);
  }
});

// ------------------------------------------------------------ boot

on('refresh', (f) => {
  if (f.has('top')) syncTop();
});
on('changed', () => invalidate('top'));
on('opened', () => {
  syncTop();
  layout();
});

window.addEventListener('beforeunload', (e) => {
  end();
  if (S.file && S.saveState !== 'saved') {
    save();
    e.preventDefault();
    e.returnValue = '';
  }
});

document.addEventListener('visibilitychange', () => {
  if (document.hidden && S.file && S.saveState !== 'saved' && !inTransaction()) save();
});

async function boot() {
  buildTop();
  try {
    S.info = await api.info();
  } catch (e) {
    toast(`Server tidak merespons: ${e.message}`, 'err');
    return;
  }
  await loadBundledFonts();
  initTools();
  initTimeline();
  initPanels();
  syncTop();
  let file = new URL(location.href).searchParams.get('p');
  if (!file) {
    try {
      file = localStorage.getItem('gerak.studio.last');
    } catch {
      file = null;
    }
  }
  if (file) {
    try {
      await openProject(file);
    } catch (e) {
      toast(`Proyek ${file} tidak bisa dibuka: ${e.message}`, 'err');
      try {
        localStorage.removeItem('gerak.studio.last');
      } catch {
        /* ignore */
      }
      const u = new URL(location.href);
      u.searchParams.delete('p');
      history.replaceState(null, '', u);
    }
  }
  if (!S.file) showHome('projects');
  document.body.classList.add('ready');
}

boot();

export { esc, isDragging, entry, icon, play, emit };
