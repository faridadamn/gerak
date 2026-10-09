// Left panel: scene list, asset library (images & fonts), sound (music clips + SFX palette).
import { S, on, emit, invalidate, scene, entry, timeline, select, goScene, edit, selElement, patchElement } from './state.mjs';
import { api, fileUrl } from './api.mjs';
import { h, btn, iconBtn, esc, toast, openModal, closeModal, fmtBytes, confirmBox } from './ui.mjs';
import { icon } from './icons.mjs';
import { placeImage } from './tools.mjs';
import { setMix } from './view.mjs';

const tabsEl = document.getElementById('lefttabs');
const panes = {
  scenes: document.getElementById('tab-scenes'),
  assets: document.getElementById('tab-assets'),
  sound: document.getElementById('tab-sound'),
};
let tab = 'scenes';

function setTab(t) {
  tab = t;
  for (const b of tabsEl.querySelectorAll('button')) b.classList.toggle('on', b.dataset.tab === t);
  for (const [k, el] of Object.entries(panes)) el.classList.toggle('on', k === t);
  if (t === 'assets') refreshAssets();
  if (t === 'sound') refreshAssets().then(buildSound);
}

// ------------------------------------------------------------ scenes

const thumbCache = new Map(); // sceneId → {key, url}
let thumbQueue = [];
let thumbTimer = 0;

function hashStr(str) {
  let x = 2166136261;
  for (let i = 0; i < str.length; i++) {
    x ^= str.charCodeAt(i);
    x = Math.imul(x, 16777619);
  }
  return (x >>> 0).toString(36);
}

function sceneThumbKey(sc) {
  const d = S.doc;
  return `${hashStr(JSON.stringify(sc))}:${hashStr(JSON.stringify([d.background, d.effects, d.boil, d.width]))}:${S.env.fontEpoch}:${S.env.images.size}`;
}

function renderThumb(i) {
  const sc = S.doc.scenes[i];
  if (!sc) return null;
  const W = S.doc.width;
  const H = S.doc.height;
  const tw = 132;
  const k = tw / W;
  const c = S.env.createCanvas(Math.round(W * k), Math.round(H * k));
  const f = Math.min(sc.duration - 1, Math.round(sc.duration * 0.6));
  try {
    S.renderer.renderSceneFrame(c.getContext('2d'), i, f, { scale: k, effects: false });
  } catch (e) {
    console.warn(e);
  }
  return c;
}

function pumpThumbs() {
  thumbTimer = 0;
  const job = thumbQueue.shift();
  if (!job) return;
  const { i, img, key, id } = job;
  if (S.doc?.scenes[i]?.id === id) {
    const c = renderThumb(i);
    if (c) {
      const url = c.toDataURL('image/png');
      thumbCache.set(id, { key, url });
      img.src = url;
    }
  }
  if (thumbQueue.length) thumbTimer = setTimeout(pumpThumbs, 30);
}

function buildScenes() {
  const pane = panes.scenes;
  pane.innerHTML = '';
  if (!S.doc) return;
  const fps = S.doc.fps;
  const tl = timeline();
  const list = h('div.scenes');
  const portrait = S.doc.height > S.doc.width;
  thumbQueue = [];
  tl.entries.forEach((e, i) => {
    const sc = e.scene;
    const img = h('img.sthumb', { alt: '', style: { aspectRatio: `${S.doc.width} / ${S.doc.height}` } });
    const key = sceneThumbKey(sc);
    const cached = thumbCache.get(sc.id);
    if (cached) img.src = cached.url;
    if (!cached || cached.key !== key) thumbQueue.push({ i, img, key, id: sc.id });
    const card = h(`div.scard${i === S.scene ? '.on' : ''}${portrait ? '.portrait' : ''}`, { onclick: () => goScene(i) },
      img,
      h('div.sinfo', {},
        h('div.stitle', {}, h('b', {}, `${i + 1}`), ` ${sc.name}`),
        h('div.smeta', {}, `${(sc.duration / fps).toFixed(1)} d${e.transition ? ` · ${e.transition.type}` : ''} · ${sc.layers.length} layer`),
        h('div.sact', { onclick: (ev) => ev.stopPropagation() },
          iconBtn('up', 'Pindah ke atas', () => moveScene(i, i - 1)),
          iconBtn('down', 'Pindah ke bawah', () => moveScene(i, i + 1)),
          iconBtn('copy', 'Duplikat scene', () => emit('cmd', { name: 'duplicateScene', index: i })),
          iconBtn('trash', 'Hapus scene', () => emit('cmd', { name: 'deleteScene', index: i })))));
    list.append(card);
  });
  pane.append(
    list,
    h('div.panebtns', {}, btn('Scene baru', () => emit('cmd', 'addScene'), 'small', 'plus'), btn('Duplikat', () => emit('cmd', { name: 'duplicateScene', index: S.scene }), 'small ghost', 'copy')),
    h('p.note.small', {}, `Total ${(tl.total / fps).toFixed(1)} detik · ${S.doc.width}×${S.doc.height} · ${fps} fps`),
  );
  clearTimeout(thumbTimer);
  if (thumbQueue.length) thumbTimer = setTimeout(pumpThumbs, 120);
}

function moveScene(from, to) {
  if (to < 0 || to >= S.doc.scenes.length) return;
  const id = S.doc.scenes[from].id;
  edit(() => S.proj.moveScene(id, to));
  goScene(to);
}

// ------------------------------------------------------------ assets

export async function refreshAssets() {
  try {
    S.assets = await api.assets();
  } catch (e) {
    console.warn(e);
  }
  if (tab === 'assets') buildAssets();
  return S.assets;
}

const fileInput = h('input', { type: 'file', multiple: true, hidden: true });
document.body.append(fileInput);
let onPicked = null;
fileInput.addEventListener('change', () => {
  const files = [...fileInput.files];
  fileInput.value = '';
  if (files.length && onPicked) onPicked(files);
});

export function chooseFiles(accept, cb) {
  fileInput.accept = accept;
  onPicked = cb;
  fileInput.click();
}

/** Upload files; returns [{path, type, name}] */
export async function uploadFiles(files) {
  const out = [];
  for (const f of files) {
    try {
      toast(`Mengunggah ${f.name}…`);
      const r = await api.upload(f, f.name);
      out.push(r);
      if (r.type === 'font') registerFont(r.path);
    } catch (e) {
      toast(`${f.name}: ${e.message}`, 'err');
    }
  }
  if (out.length) toast(`${out.length} file diunggah`);
  await refreshAssets();
  return out;
}

function registerFont(path) {
  if ((S.doc.fonts || []).some((f) => f.path === path)) return;
  const base = path.split('/').pop().replace(/\.(ttf|otf)$/i, '');
  const weight = /black|heavy/i.test(base) ? 900 : /extra-?bold/i.test(base) ? 800 : /semi-?bold/i.test(base) ? 600 : /bold/i.test(base) ? 700 : /medium/i.test(base) ? 500 : /light/i.test(base) ? 300 : 400;
  const family = base.replace(/[-_ ]?(regular|bold|medium|light|semibold|semi-bold|extrabold|extra-bold|black|heavy|thin|italic|\d{3})$/gi, '').replace(/[-_]+/g, ' ').trim() || base;
  edit(() => S.doc.fonts.push({ family, path, weight, style: 'normal' }), ['view', 'inspector']);
  toast(`Font “${family}” siap dipakai di teks`);
}

function buildAssets() {
  const pane = panes.assets;
  pane.innerHTML = '';
  const images = S.assets.filter((a) => a.type === 'image');
  const fonts = S.assets.filter((a) => a.type === 'font');
  pane.append(
    h('div.panebtns', {}, btn('Unggah gambar / font', () => chooseFiles('image/*,.ttf,.otf', uploadFiles), 'small', 'upload')),
    h('p.note.small', {}, 'Klik gambar untuk menaruhnya di kanvas. Bisa juga seret file langsung ke kanvas.'),
  );
  if (images.length) {
    const grid = h('div.agrid');
    for (const a of images) {
      grid.append(h('button.acard', { title: `${a.name} · ${fmtBytes(a.size)}`, onclick: () => S.doc && placeImage(a.path) },
        h('img', { src: fileUrl(a.path), alt: a.name, loading: 'lazy' }),
        h('span', {}, a.name)));
    }
    pane.append(h('div.plabel', {}, 'Gambar'), grid);
  } else pane.append(h('div.empty', {}, 'Belum ada gambar. Unggah PNG/JPG/WebP.'));
  if (fonts.length) {
    pane.append(h('div.plabel', {}, 'Font'));
    for (const a of fonts) {
      const used = (S.doc?.fonts || []).find((f) => f.path === a.path);
      pane.append(h('div.arow', {}, h('span', {}, a.name), used ? h('span.tag', {}, used.family) : btn('Pakai', () => registerFont(a.path), 'small ghost')));
    }
  }
}

export function pickImage(cb) {
  const body = h('div.picker');
  const render = () => {
    body.innerHTML = '';
    const images = S.assets.filter((a) => a.type === 'image');
    body.append(h('div.panebtns', {}, btn('Unggah gambar baru…', () => chooseFiles('image/*', async (files) => {
      const up = await uploadFiles(files);
      const img = up.find((u) => u.type === 'image');
      if (img) {
        closeModal();
        cb(img.path);
      } else render();
    }), 'primary', 'upload')));
    if (!images.length) body.append(h('div.empty', {}, 'Belum ada gambar di folder kerja.'));
    const grid = h('div.agrid.big');
    for (const a of images) {
      grid.append(h('button.acard', { onclick: () => (closeModal(), cb(a.path)) }, h('img', { src: fileUrl(a.path), alt: a.name, loading: 'lazy' }), h('span', {}, a.name)));
    }
    body.append(grid);
  };
  refreshAssets().then(render);
  render();
  openModal({ title: 'Pilih gambar', body, wide: true });
}

on('pickImage', ({ at, replace } = {}) => {
  pickImage((path) => {
    if (replace) {
      const sel = selElement();
      if (!sel || sel.el.type !== 'image') return;
      const id = S.proj.asset(path, 'image');
      const img = new Image();
      img.onload = () => {
        S.env.images.set(id, img);
        S.imagePaths.set(id, path);
        const el = sel.el;
        const w = el.width ?? img.naturalWidth;
        const patch = { src: id };
        if (el.height !== undefined && el.width !== undefined && el.fit === 'fill') patch.height = Math.round((w * img.naturalHeight) / img.naturalWidth);
        edit(() => patchElement(sel.node, el, patch));
      };
      img.src = fileUrl(path);
    } else placeImage(path, at);
  });
});

on('dropFiles', async ({ files, at }) => {
  const up = await uploadFiles(files);
  let k = 0;
  for (const u of up) {
    if (u.type === 'image') {
      placeImage(u.path, [at[0] + k * 30, at[1] + k * 30]);
      k++;
    } else if (u.type === 'audio') addMusic(u.path);
  }
});

// ------------------------------------------------------------ sound

const previewAudio = new Audio();
export function previewSfx(type) {
  previewAudio.src = `/api/sfx/${encodeURIComponent(type)}.wav`;
  previewAudio.play().catch(() => {});
}
on('previewSfx', previewSfx);

function addMusic(path) {
  let id;
  edit(() => {
    const base = path.split('/').pop().replace(/\.[^.]+$/, '');
    id = S.proj._newId(base);
    S.doc.audio.push({ id, src: path, at: 0, gain: Math.pow(10, -14 / 20), fadeOut: 1 });
  });
  select({ clip: id });
  toast('Musik ditambahkan dari awal video (−14 dB). Atur di panel kanan.');
}

function addSfx(type) {
  let id;
  edit(() => {
    id = sceneHandleSfx(type);
  });
  select({ clip: id });
  previewSfx(type);
}

function sceneHandleSfx(type) {
  return S.proj.getScene(scene().id).sfx(type, { at: S.lf, volume: -8 });
}

function buildSound() {
  const pane = panes.sound;
  pane.innerHTML = '';
  if (!S.doc) return;
  const audios = S.assets.filter((a) => a.type === 'audio');
  pane.append(h('div.plabel', {}, 'Musik & rekaman'), h('div.panebtns', {}, btn('Unggah audio', () => chooseFiles('audio/*,.mp3,.wav,.m4a,.ogg', async (files) => {
    const up = await uploadFiles(files);
    up.filter((u) => u.type === 'audio').forEach((u) => addMusic(u.path));
    buildSound();
  }), 'small', 'upload')));
  for (const a of audios) {
    pane.append(h('div.arow', {},
      iconBtn('play', 'Dengar', () => {
        previewAudio.src = fileUrl(a.path);
        previewAudio.play().catch(() => {});
      }),
      h('span.aname', { title: a.path }, a.name),
      btn('Pakai', () => addMusic(a.path), 'small ghost')));
  }
  const clips = S.doc.audio || [];
  if (clips.length) {
    pane.append(h('div.plabel', {}, `Di video ini (${clips.length})`));
    const fps = S.doc.fps;
    for (const c of clips) {
      const sc = c.scene ? S.doc.scenes.find((q) => q.id === c.scene) : null;
      const where = sc ? `${sc.name} @ ${((c.at ?? 0) / fps).toFixed(2)} d` : `global @ ${((c.at ?? 0) / fps).toFixed(2)} d`;
      pane.append(h(`div.arow.clip${S.sel.clip === c.id ? '.on' : ''}`, {
        onclick: () => {
          if (sc) {
            const i = S.doc.scenes.indexOf(sc);
            if (i !== S.scene) goScene(i);
          }
          select({ clip: c.id });
        },
      }, h('span.ty', { html: icon(c.sfx ? 'sparkle' : 'music', 14) }), h('span.aname', {}, c.sfx ? c.sfx.type : c.src.split('/').pop()), h('span.tag', {}, where)));
    }
  }
  pane.append(h('div.plabel', {}, 'Efek suara (klik = taruh di playhead)'));
  const grid = h('div.sfxgrid');
  for (const t of S.info.sfx) {
    grid.append(h('div.sfx', {},
      h('button.sfxadd', { title: `Taruh “${t}” di playhead`, onclick: () => addSfx(t) }, t),
      h('button.sfxplay', { title: 'Dengar dulu', html: icon('play', 12), onclick: () => previewSfx(t) })));
  }
  pane.append(grid);
}

// ------------------------------------------------------------ preview mix

let mixSig = '';
let mixTimer = 0;
let mixBusy = false;

function audioSignature() {
  if (!S.doc) return '';
  const tl = timeline();
  return JSON.stringify([S.doc.audio, tl.entries.map((e) => [e.scene.id, e.start, e.end]), tl.total]);
}

async function refreshMix() {
  if (!S.doc || !S.sound) return;
  const sig = audioSignature();
  if (sig === mixSig) return;
  if (mixBusy) {
    mixTimer = setTimeout(refreshMix, 400);
    return;
  }
  mixBusy = true;
  try {
    if (!S.doc.audio.length) {
      setMix(null);
      mixSig = sig;
    } else {
      const { url } = await api.mix(S.doc);
      mixSig = sig;
      setMix(url);
    }
  } catch (e) {
    console.warn('mix gagal', e);
    toast(`Audio preview gagal: ${e.message}`, 'err');
    mixSig = sig;
  } finally {
    mixBusy = false;
  }
}

function scheduleMix() {
  clearTimeout(mixTimer);
  mixTimer = setTimeout(refreshMix, 700);
}

on('changed', scheduleMix);
on('opened', () => {
  mixSig = '';
  scheduleMix();
});
on('soundToggle', () => S.sound && scheduleMix());
on('play', (playing) => {
  if (playing && audioSignature() !== mixSig) refreshMix();
});

// ------------------------------------------------------------ wiring

tabsEl.addEventListener('click', (e) => {
  const b = e.target.closest('button[data-tab]');
  if (b) setTab(b.dataset.tab);
});

on('refresh', (f) => {
  if (f.has('scenes') && !S.playing) buildScenes();
  else if (f.has('scenes')) {
    for (const [i, c] of [...panes.scenes.querySelectorAll('.scard')].entries()) c.classList.toggle('on', i === S.scene);
  }
  if (f.has('sound') && tab === 'sound') buildSound();
});
on('sceneChange', () => {
  for (const [i, c] of [...panes.scenes.querySelectorAll('.scard')].entries()) c.classList.toggle('on', i === S.scene);
});

export function initPanels() {
  setTab('scenes');
}

export { esc, confirmBox, entry, invalidate };
