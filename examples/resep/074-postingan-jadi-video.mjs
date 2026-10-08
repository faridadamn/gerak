// 074 · Postingan teks jadi video (kartu post generik)
// kategori: konten
// fitur: kartu post (avatar, nama, waktu) · teks diketik · counter suka/komentar/bagikan naik · ikon hati pop + pulse
// pakai: repurpose tulisan/thread jadi video, "postingan viral", quote dari akun sendiri

import { project } from 'gerak';

// ganti dengan isi postingan sendiri
const POST = {
  nama: 'Nama Akun',
  handle: '@namaakun · 2j',
  isi: 'Bisnis kecil nggak butuh tim besar.\n\nYang dibutuhkan: proses yang jelas, dicatat, lalu diotomatiskan satu per satu.',
  suka: 12840,
  komentar: 431,
  bagikan: 2210,
};

const p = project({ title: 'Postingan jadi video', preset: 'reels', fps: 30, background: '#f1f3f5' });
const W = p.width;

const s = p.scene('Post', { duration: '7s' });

const kartu = s.layer('Kartu', { x: W / 2, y: 960 });
kartu.rect(-460, -440, 920, 880, { fill: '#ffffff', r: 36, shadow: { color: 'rgba(0,0,0,0.08)', blur: 30, y: 10 } });
kartu.image('assets/avatar.png', -360, -330, { width: 120, height: 120, radius: 60, anchor: 'center' });
kartu.text(POST.nama, -280, -350, { size: 46, weight: 800, color: '#14161f', valign: 'middle' });
kartu.text(POST.handle, -280, -300, { size: 36, weight: 500, color: '#868e96', valign: 'middle' });
kartu.line(-420, 300, 420, 300, { stroke: '#f1f3f5', strokeWidth: 4 });
kartu.slideIn(0, { from: 'bottom', distance: 120, dur: 16 });

const isi = s.layer('Isi', { x: W / 2, y: 960 });
isi.text(POST.isi, -400, -220, { size: 50, weight: 500, color: '#212529', valign: 'top', maxWidth: 800, lineHeight: 1.35, anim: { type: 'typewriter', at: 18, cps: 30, cursor: false } });

// baris aksi: ikon + angka (count)
const MULAI = 18 + Math.ceil((POST.isi.length / 30) * 30) + 6;
const aksi = [
  { x: -360, nilai: POST.suka, warna: '#e03131' },
  { x: -60, nilai: POST.komentar, warna: '#495057' },
  { x: 220, nilai: POST.bagikan, warna: '#495057' },
];
const baris = s.layer('Aksi', { x: W / 2, y: 960 + 370 });
baris.path('M -360 14 C -390 -6 -396 -26 -380 -38 C -370 -46 -360 -40 -360 -30 C -360 -40 -350 -46 -340 -38 C -324 -26 -330 -6 -360 14 Z', { fill: '#e03131' });
baris.rect(-90, -36, 56, 44, { fill: 'none', stroke: '#495057', strokeWidth: 6, r: 12 });
baris.polygon([[190, -20], [220, -40], [220, 0]], { fill: '#495057' });
aksi.forEach((a) => baris.text('0', a.x + 30, -12, { size: 40, weight: 700, color: a.warna, valign: 'middle', anim: { type: 'count', from: 0, to: a.nilai, at: MULAI, dur: 40, ease: 'out-expo' } }));
baris.fadeIn(MULAI - 6, 8);

// hati besar pop di tengah (gaya "double tap")
const hati = s.layer('Hati besar', { x: W / 2, y: 960 });
hati.path('M 0 120 C -160 20 -180 -80 -110 -130 C -60 -165 0 -130 0 -90 C 0 -130 60 -165 110 -130 C 180 -80 160 20 0 120 Z', { fill: '#ff6b6b' });
hati.key(0, { opacity: 0 }, 'hold').key(MULAI + 10, { opacity: 0, scale: 0.3 }, 'out-back').key(MULAI + 20, { opacity: 0.95, scale: 1.1 }).key(MULAI + 34, { opacity: 0, scale: 1.3 });

s.sfx('typing', { at: 18, dur: POST.isi.length / 30, volume: -14 });
s.sfx('pop', { at: MULAI + 10, volume: -6, pitch: 700 });

export default p;
