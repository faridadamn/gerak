// Home (projects, new project, recipe library) and render dialogs.
import { S, openProject, save, timeline, end } from './state.mjs';
import { api } from './api.mjs';
import { h, btn, iconBtn, esc, toast, openModal, closeModal, confirmBox, promptBox, fmtBytes } from './ui.mjs';
import { icon } from './icons.mjs';

const FORMATS = [
  { preset: 'reels', label: 'Reels / TikTok', ratio: '9:16', w: 1080, h: 1920 },
  { preset: 'feed', label: 'Feed IG', ratio: '4:5', w: 1080, h: 1350 },
  { preset: 'square', label: 'Kotak', ratio: '1:1', w: 1080, h: 1080 },
  { preset: 'youtube', label: 'YouTube', ratio: '16:9', w: 1920, h: 1080 },
];

const CATS = {
  teks: 'Teks & tipografi',
  brush: 'Brush & gambar tangan',
  grafis: 'Motion graphic',
  data: 'Data & infografis',
  kamera: 'Kamera',
  transisi: 'Transisi',
  karakter: 'Karakter',
  konten: 'Format konten',
  edukasi: 'Edukasi',
  audio: 'Audio & musik',
  lanjut: 'Teknik lanjutan',
};

function ago(ms) {
  const s = (Date.now() - ms) / 1000;
  if (s < 60) return 'baru saja';
  if (s < 3600) return `${Math.floor(s / 60)} menit lalu`;
  if (s < 86400) return `${Math.floor(s / 3600)} jam lalu`;
  return `${Math.floor(s / 86400)} hari lalu`;
}

function ratioOf(w, hh) {
  const f = FORMATS.find((q) => q.w === w && q.h === hh);
  return f ? f.ratio : `${w}×${hh}`;
}

async function open(file, m) {
  try {
    await openProject(file);
    m?.close();
  } catch (e) {
    if (e.message !== 'dibatalkan') toast(`Gagal membuka: ${e.message}`, 'err');
  }
}

export function showHome(startTab = 'projects') {
  const canClose = !!S.file;
  const body = h('div.home');
  const tabs = h('div.htabs');
  const pane = h('div.hpane');
  let m;
  const show = (t) => {
    for (const b of tabs.children) b.classList.toggle('on', b.dataset.t === t);
    pane.innerHTML = '';
    if (t === 'new') pane.append(newPane());
    else if (t === 'library') pane.append(libraryPane());
    else pane.append(projectsPane());
  };
  for (const [t, label, ic] of [['projects', 'Proyek kamu', 'folder'], ['new', 'Buat baru', 'plus'], ['library', 'Mulai dari resep', 'sparkle']]) {
    tabs.append(h('button', { dataset: { t }, html: `${icon(ic, 16)}<span>${label}</span>`, onclick: () => show(t) }));
  }
  body.append(tabs, pane);

  function projectsPane() {
    const wrap = h('div');
    const grid = h('div.pgrid', {}, h('div.empty', {}, 'Memuat…'));
    const scripts = h('div.scripts');
    wrap.append(grid, scripts);
    api.scripts().then((list) => {
      if (!list.length) return;
      scripts.append(h('label.hl', {}, 'Script di folder ini (misalnya buatan agent)'), h('p.note', {}, 'Buka script .mjs sebagai proyek Studio: hasilnya salinan .gerak.json yang bisa kamu edit visual. Script aslinya tidak diubah.'));
      for (const s of list) {
        const go = btn('Buka di Studio', async () => {
          go.disabled = true;
          try {
            const { file } = await api.importItem('script', s.file);
            await open(file, m);
          } catch (e) {
            toast(e.message, 'err');
            go.disabled = false;
          }
        }, 'small ghost');
        scripts.append(h('div.arow', {}, h('span', { html: icon('film', 14) }), h('span.aname', {}, s.file), h('span.tag', {}, ago(s.mtime)), go));
      }
    }).catch(() => {});
    api.projects().then((list) => {
      grid.innerHTML = '';
      if (!list.length) {
        grid.append(h('div.empty.big', {}, h('p', {}, 'Belum ada proyek di folder ini.'), btn('Buat video pertama', () => show('new'), 'primary', 'plus'), ' ', btn('Lihat resep', () => show('library'), 'ghost', 'sparkle')));
        return;
      }
      for (const p of list) {
        const portrait = p.height > p.width;
        const card = h(`div.pcard${p.file === S.file ? '.on' : ''}`, { onclick: () => open(p.file, m) },
          h(`div.pthumb${portrait ? '.portrait' : ''}`, { style: { aspectRatio: `${p.width} / ${p.height}` } }, p.thumb ? h('img', { src: p.thumb, alt: '' }) : h('span', { html: icon('film', 28) })),
          h('div.pinfo', {},
            h('b', {}, p.title || p.file),
            h('span', {}, `${ratioOf(p.width, p.height)} · ${p.seconds.toFixed(1)} d · ${p.scenes} scene`),
            h('span.dim', {}, `${ago(p.mtime)} · ${p.file}`)),
          h('div.pact', { onclick: (e) => e.stopPropagation() },
            iconBtn('copy', 'Duplikat', async () => {
              const title = await promptBox('Nama salinan', `${p.title} (salinan)`, { ok: 'Duplikat' });
              if (title === null) return showHome('projects');
              await api.duplicate(p.file, title);
              showHome('projects');
            }),
            iconBtn('trash', 'Hapus', async () => {
              const ok = await confirmBox(`Hapus proyek “${p.title}”? File dipindah ke folder .studio/trash.`, { ok: 'Hapus', danger: true });
              if (ok) {
                await api.remove(p.file);
                if (p.file === S.file) S.file = null;
              }
              showHome('projects');
            })));
        grid.append(card);
      }
    }).catch((e) => {
      grid.innerHTML = '';
      grid.append(h('div.empty', {}, `Gagal memuat: ${e.message}`));
    });
    return wrap;
  }

  function newPane() {
    let fmt = FORMATS[0];
    let fps = 30;
    const title = h('input.text', { type: 'text', value: 'Video baru', placeholder: 'Judul video' });
    const bg = h('input.color', { type: 'color', value: '#ffffff' });
    const fmtRow = h('div.fmtrow');
    const drawFmt = () => {
      fmtRow.innerHTML = '';
      for (const f of FORMATS) {
        const k = 56 / Math.max(f.w, f.h);
        fmtRow.append(h(`button.fmt${f === fmt ? '.on' : ''}`, { onclick: () => ((fmt = f), drawFmt()) },
          h('div.fbox', {}, h('div', { style: { width: `${f.w * k}px`, height: `${f.h * k}px` } })),
          h('b', {}, f.ratio),
          h('span', {}, f.label)));
      }
    };
    drawFmt();
    const fpsSeg = h('div.seg');
    const drawFps = () => {
      fpsSeg.innerHTML = '';
      for (const [v, l] of [[24, '24 fps · gaya gambar tangan'], [30, '30 fps · motion graphic'], [60, '60 fps · sangat halus']]) {
        fpsSeg.append(h(`button${fps === v ? '.on' : ''}`, { type: 'button', onclick: () => ((fps = v), drawFps()) }, l));
      }
    };
    drawFps();
    const create = async () => {
      try {
        const { file } = await api.create({ title: title.value.trim() || 'Video baru', preset: fmt.preset, fps, background: bg.value });
        await open(file, m);
      } catch (e) {
        toast(e.message, 'err');
      }
    };
    title.addEventListener('keydown', (e) => e.key === 'Enter' && create());
    setTimeout(() => title.select(), 30);
    return h('div.newp', {},
      h('label.hl', {}, 'Judul'), title,
      h('label.hl', {}, 'Format'), fmtRow,
      h('label.hl', {}, 'Kehalusan gerak'), fpsSeg,
      h('label.hl', {}, 'Warna latar'), h('div.crow', {}, bg, h('span.note', {}, 'bisa diganti nanti')),
      h('div.mactions', {}, btn('Buat proyek', create, 'primary big', 'plus')));
  }

  function libraryPane() {
    const wrap = h('div.lib');
    const search = h('input.text', { type: 'search', placeholder: 'Cari: caption, karaoke, grafik, kamera, transisi…' });
    const chips = h('div.chips');
    const list = h('div.liblist', {}, h('div.empty', {}, 'Memuat…'));
    let cat = '';
    let data = { resep: [], templates: [] };
    const render = () => {
      chips.innerHTML = '';
      chips.append(h(`button.btn.chip${cat === '' ? '.on' : ''}`, { onclick: () => ((cat = ''), render()) }, 'Semua'));
      for (const [k, l] of Object.entries(CATS)) chips.append(h(`button.btn.chip${cat === k ? '.on' : ''}`, { onclick: () => ((cat = k), render()) }, l));
      list.innerHTML = '';
      const q = search.value.trim().toLowerCase();
      if (!cat && !q) {
        list.append(h('div.plabel', {}, 'Template'));
        for (const t of data.templates) list.append(row({ kind: 'template', id: t.id, no: 'T', judul: t.judul, pakai: t.pakai, meta: 'template' }));
        list.append(h('div.plabel', {}, '100 resep'));
      }
      const items = data.resep.filter((r) => (!cat || r.kategori === cat) && (!q || `${r.no} ${r.judul} ${r.fitur} ${r.pakai} ${r.kategori}`.toLowerCase().includes(q)));
      for (const r of items) list.append(row({ kind: 'resep', id: r.file, no: r.no, judul: r.judul, pakai: r.pakai, meta: `${r.format} · ${r.detik} d · ${CATS[r.kategori] ?? r.kategori}` }));
      if (!items.length) list.append(h('div.empty', {}, 'Tidak ada yang cocok.'));
    };
    const row = (it) => {
      const go = btn('Pakai', async () => {
        go.disabled = true;
        go.querySelector('span').textContent = 'Menyiapkan…';
        try {
          const { file } = await api.importItem(it.kind, it.id);
          await open(file, m);
          toast(`“${it.judul}” siap diedit — ini salinanmu sendiri`);
        } catch (e) {
          toast(e.message, 'err');
          go.disabled = false;
          go.querySelector('span').textContent = 'Pakai';
        }
      }, 'small primary');
      return h('div.librow', {}, h('span.libno', {}, it.no), h('div.libtxt', {}, h('b', {}, it.judul), h('span', {}, it.pakai), h('span.dim', {}, it.meta)), go);
    };
    search.addEventListener('input', render);
    api.library().then((d) => {
      data = d;
      render();
    }).catch((e) => {
      list.innerHTML = '';
      list.append(h('div.empty', {}, e.message));
    });
    wrap.append(h('p.note', {}, 'Pilih resep untuk dijadikan proyek baru. Semua bisa diedit: teks, warna, gambar, waktu, animasi.'), search, chips, list);
    return wrap;
  }

  m = openModal({ title: 'Gerak Studio', body, wide: true, cls: canClose ? '' : 'noclose' });
  show(startTab);
  return m;
}

// ------------------------------------------------------------ render dialog

export function showRender() {
  if (!S.doc) return;
  let format = 'mp4';
  let quality = 'final';
  const body = h('div.render');
  const fmts = [
    ['mp4', 'MP4', 'video + audio, siap upload'],
    ['gif', 'GIF', 'animasi tanpa suara, untuk stiker/preview'],
    ['webm', 'WebM transparan', 'latar tembus pandang, untuk overlay'],
    ['mov', 'MOV transparan', 'ProRes 4444 untuk editor video'],
  ];
  const fmtRow = h('div.fmtrow.wide');
  const drawFmt = () => {
    fmtRow.innerHTML = '';
    for (const [v, l, d] of fmts) fmtRow.append(h(`button.fmt.txt${format === v ? '.on' : ''}`, { onclick: () => ((format = v), drawFmt()) }, h('b', {}, l), h('span', {}, d)));
  };
  drawFmt();
  const qSeg = h('div.seg');
  const drawQ = () => {
    qSeg.innerHTML = '';
    for (const [v, l] of [['draft', 'Draft cepat (½ resolusi)'], ['final', 'Final (resolusi penuh)']]) qSeg.append(h(`button${quality === v ? '.on' : ''}`, { type: 'button', onclick: () => ((quality = v), drawQ()) }, l));
  };
  drawQ();
  const tl = timeline();
  const status = h('div.rstatus');
  const startBtn = btn('Mulai render', () => start(), 'primary big', 'film');
  const outputs = h('div.outputs');
  body.append(
    h('p.note', {}, `${S.doc.title} · ${S.doc.width}×${S.doc.height} · ${(tl.total / S.doc.fps).toFixed(1)} detik · ${S.doc.scenes.length} scene`),
    h('label.hl', {}, 'Format'), fmtRow,
    h('label.hl', {}, 'Kualitas'), qSeg,
    h('div.mactions', {}, startBtn),
    status,
    h('label.hl', {}, 'Hasil sebelumnya'), outputs,
  );
  const loadOutputs = () => api.outputs().then((list) => {
    outputs.innerHTML = '';
    if (!list.length) outputs.append(h('div.empty', {}, 'Belum ada.'));
    for (const o of list.slice(0, 8)) {
      outputs.append(h('div.arow', {}, h('span.aname', {}, o.name), h('span.tag', {}, `${fmtBytes(o.size)} · ${ago(o.mtime)}`), h('a.btn.small.ghost', { href: o.url, download: o.name, html: `${icon('download', 14)}<span>Unduh</span>` })));
    }
  }).catch(() => {});
  loadOutputs();
  let polling = 0;
  async function start() {
    startBtn.disabled = true;
    status.innerHTML = '';
    const bar = h('div.bar', {}, h('div.fill'));
    const txt = h('div.rtxt', {}, 'Menyimpan…');
    status.append(bar, txt);
    try {
      end();
      await save();
      if (S.saveState !== 'saved') throw new Error('proyek belum tersimpan ke server, coba lagi sebentar');
      const job = await api.render({ file: S.file, format, quality });
      txt.textContent = 'Antre…';
      const poll = async () => {
        let j;
        try {
          j = await api.job(job.id);
        } catch (e) {
          txt.textContent = e.message;
          startBtn.disabled = false;
          return;
        }
        if (j.state === 'queued') txt.textContent = `Antre (urutan ${j.position})…`;
        if (j.state === 'rendering') {
          const p = j.total ? j.done / j.total : 0;
          bar.firstChild.style.width = `${(p * 100).toFixed(1)}%`;
          txt.textContent = j.total ? `Merender frame ${j.done}/${j.total}${j.eta ? ` · sisa ±${Math.ceil(j.eta)} d` : ''}` : 'Menyiapkan…';
        }
        if (j.state === 'done') {
          bar.firstChild.style.width = '100%';
          status.innerHTML = '';
          const name = j.output.split('/').pop();
          const media = format === 'gif' ? h('img.rprev', { src: j.url, alt: '' }) : h('video.rprev', { src: j.url, controls: true, playsinline: true, autoplay: true, muted: format !== 'mp4' });
          status.append(
            h('div.rdone', {}, h('span', { html: icon('check', 18) }), h('span', {}, `Selesai: ${name} (${fmtBytes(j.size)})`)),
            media,
            h('div.mactions', {}, h('a.btn.primary', { href: j.url, download: name, html: `${icon('download', 16)}<span>Unduh ${name}</span>` })),
          );
          startBtn.disabled = false;
          loadOutputs();
          return;
        }
        if (j.state === 'error') {
          txt.textContent = `Gagal: ${j.error}`;
          txt.classList.add('err');
          startBtn.disabled = false;
          return;
        }
        polling = setTimeout(poll, 600);
      };
      poll();
    } catch (e) {
      txt.textContent = `Gagal: ${e.message}`;
      txt.classList.add('err');
      startBtn.disabled = false;
    }
  }
  openModal({ title: 'Render video', body, onClose: () => clearTimeout(polling) });
}

export { closeModal, esc };
