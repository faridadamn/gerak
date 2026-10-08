// 094 · Revisi project tersimpan (save → open → edit by ID)
// kategori: lanjut
// fitur: p.save() ke .gerak.json · open() · p.find(id) → layer/elemen · edit elemen (patch) · tambah key · ubah durasi & urutan scene · info()
// pakai: alur revisi agent: render dulu, cek, lalu ubah HANYA bagian yang perlu tanpa menulis ulang semuanya

import { project, open } from 'gerak';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// ---------------------------------------------------------------- v1 (dibuat di sini sebagai contoh)
const v1 = project({ title: 'Revisi v1', preset: 'reels', fps: 30, background: '#f1f3f5' });
const a = v1.scene('Pembuka', { duration: '2s', id: 'pembuka' });
a.layer('Judul', { id: 'judul', x: 540, y: 900 }).text('Versi pertama', 0, 0, { id: 'teks-judul', size: 100, weight: 800, color: '#868e96', align: 'center', valign: 'middle' });
const b = v1.scene('Penutup', { duration: '2s', id: 'penutup', background: '#2D3E8D' });
b.layer('CTA', { id: 'cta', x: 540, y: 900 }).text('Follow ya', 0, 0, { id: 'teks-cta', size: 90, weight: 800, color: '#ffffff', align: 'center', valign: 'middle' });
const file = v1.save(join(tmpdir(), 'gerak-contoh-revisi.gerak.json'));

// ---------------------------------------------------------------- v2: buka file lalu revisi terarah
const p = open(file);
p.doc.title = 'Revisi v2';

// 1) ganti teks & warna satu elemen (pakai ID dari `gerak info`)
p.find('judul').edit('teks-judul', { text: 'Versi kedua (revisi)', color: '#2D3E8D' });
// 2) tambah animasi ke layer yang sudah ada
p.find('judul').pop(0, { dur: 14 });
// 3) ubah durasi scene + tambah transisi
p.getScene('penutup').set({ duration: '3s', transition: { type: 'slide-up', duration: 12 } });
// 4) tambah layer baru ke scene lama
p.getScene('pembuka').layer('Catatan', { fixed: true }).text('diubah via open() + find()', 540, 1100, { size: 44, weight: 600, color: '#00B7B3', align: 'center', anim: { type: 'words', effect: 'fade', at: 14, stagger: 2 } });
// 5) elemen di scene lain
p.find('teks-cta').set({ text: 'Follow buat part 2', color: '#FFD43B' });

// cek hasil (muncul di terminal saat `gerak run`):  console.log(JSON.stringify(p.info(), null, 2));
export default p;
