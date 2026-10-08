#!/usr/bin/env node
// Bikin examples/resep/README.md + katalog.json dari header tiap contoh.
//   node scripts/katalog.mjs            → tulis katalog
//   node scripts/katalog.mjs --check    → cuma validasi (semua contoh harus bisa di-load)
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadProject } from '../src/node/load.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DIR = join(ROOT, 'examples', 'resep');
const check = process.argv.includes('--check');

const KATEGORI = {
  teks: 'Teks & tipografi kinetik',
  brush: 'Brush & gambar tangan',
  grafis: 'Motion graphic & bentuk',
  data: 'Data, grafik & infografis',
  kamera: 'Kamera & komposisi',
  transisi: 'Transisi',
  karakter: 'Animasi karakter & substitusi gambar',
  konten: 'Format konten sosmed',
  edukasi: 'Edukasi & penjelasan',
  audio: 'Audio & musik',
  lanjut: 'Teknik lanjutan',
};

function parseHeader(src, file) {
  const lines = src.split('\n').slice(0, 14);
  const meta = { file };
  for (const l of lines) {
    let m = l.match(/^\/\/\s*(\d{3})\s*·\s*(.+)$/);
    if (m) {
      meta.no = m[1];
      meta.judul = m[2].trim();
      continue;
    }
    m = l.match(/^\/\/\s*(kategori|fitur|pakai|render)\s*:\s*(.+)$/i);
    if (m) meta[m[1].toLowerCase()] = m[2].trim();
  }
  for (const k of ['no', 'judul', 'kategori', 'fitur', 'pakai']) if (!meta[k]) throw new Error(`${file}: header "${k}" tidak ada`);
  if (!KATEGORI[meta.kategori]) throw new Error(`${file}: kategori "${meta.kategori}" tidak dikenal (${Object.keys(KATEGORI).join(', ')})`);
  return meta;
}

const files = readdirSync(DIR).filter((f) => /^\d{3}-.+\.mjs$/.test(f)).sort();
const items = [];
let failed = 0;
for (const f of files) {
  const src = readFileSync(join(DIR, f), 'utf8');
  let meta;
  try {
    meta = parseHeader(src, f);
    const p = await loadProject(join(DIR, f));
    const info = p.info();
    Object.assign(meta, {
      ukuran: info.size,
      fps: info.fps,
      detik: +(info.frames / info.fps).toFixed(2),
      scene: info.scenes.length,
      audio: info.audio.length,
    });
    items.push(meta);
    if (check) console.log(`✓ ${f}`);
  } catch (e) {
    failed++;
    console.error(`✗ ${f}: ${e.message.split('\n')[0]}`);
  }
}
if (failed) {
  console.error(`\n${failed} contoh gagal`);
  process.exit(1);
}
if (check) {
  console.log(`\n${items.length} contoh OK`);
  process.exit(0);
}

const fmt = (m) => {
  const [w, h] = m.ukuran.split('x').map(Number);
  const r = w / h;
  return r < 0.6 ? '9:16' : r < 0.85 ? '4:5' : r < 1.2 ? '1:1' : '16:9';
};

let md = `# Resep Gerak — ${items.length} contoh siap pakai

Setiap file berdiri sendiri: cukup \`import { ... } from 'gerak'\`, tanpa helper tambahan.
Cara pakai buat agent: **cari contoh yang paling mirip dengan brief → salin → ubah teks/warna/timing → \`gerak run\` → cek sheet → render.**

\`\`\`sh
gerak preview examples/resep/001-hook-kata-pop.mjs     # lihat live
gerak run     examples/resep/001-hook-kata-pop.mjs     # poster + contact sheet
gerak render  examples/resep/001-hook-kata-pop.mjs     # MP4
\`\`\`

Cari berdasarkan fitur: \`grep -l "karaoke" examples/resep/*.mjs\` atau buka \`katalog.json\`.
Aset contoh ada di \`assets/\` (dibuat ulang dengan \`node examples/resep/assets/buat-aset.mjs\`).

`;
for (const [k, label] of Object.entries(KATEGORI)) {
  const list = items.filter((m) => m.kategori === k);
  if (!list.length) continue;
  md += `## ${label}\n\n| No | Contoh | Format | Durasi | Fitur yang didemokan | Pakai untuk |\n| --- | --- | --- | --- | --- | --- |\n`;
  for (const m of list) md += `| ${m.no} | [${m.judul}](${m.file}) | ${fmt(m)} · ${m.fps}fps | ${m.detik}s | ${m.fitur} | ${m.pakai}${m.render ? ` · render: \`${m.render}\`` : ''} |\n`;
  md += '\n';
}
writeFileSync(join(DIR, 'README.md'), md);
writeFileSync(join(DIR, 'katalog.json'), JSON.stringify(items.map((m) => ({ ...m, format: fmt(m) })), null, 2));
console.log(`✓ katalog: ${items.length} contoh → examples/resep/README.md + katalog.json`);
