// 013 · Frasa bergantian di posisi yang sama (masuk + keluar)
// kategori: teks
// fitur: text anim + exit (words) · show range per frasa · jadwal waktu dari array · tick sfx
// pakai: menyampaikan beberapa kalimat pendek berurutan tanpa ganti scene, lirik, poin cepat

import { project } from 'gerak';

const p = project({ title: 'Teks masuk keluar', preset: 'reels', fps: 30, background: '#fff8e7' });
const W = p.width;

const s = p.scene('Frasa', { duration: '6s' });

const frasa = ['Bangun.', 'Cek pesanan.', 'Semua sudah dibalas.', 'Sama sistem lu.'];
const DUR = 42; // frame per frasa

const l = s.layer('Frasa', { fixed: true });
frasa.forEach((teks, i) => {
  const mulai = 6 + i * DUR;
  const selesai = mulai + DUR;
  l.text(teks, W / 2, 940, {
    size: 112,
    weight: 800,
    color: i === frasa.length - 1 ? '#2D3E8D' : '#14161f',
    align: 'center',
    valign: 'middle',
    maxWidth: 900,
    show: [mulai, i === frasa.length - 1 ? null : selesai], // frasa terakhir tetap tampil
    anim: { type: 'words', effect: 'rise', at: mulai, stagger: 3, dur: 10 },
    // exit: animasi keluar, dimulai 10 frame sebelum frasa berakhir
    ...(i < frasa.length - 1 ? { exit: { type: 'words', effect: 'drop', at: selesai - 10, stagger: 2, dur: 8 } } : {}),
  });
  s.sfx('tick', { at: mulai, volume: -10 });
});

// garis aksen di bawah frasa terakhir
const aksen = s.layer('Aksen');
aksen.line(340, 1050, 740, 1050, { stroke: '#00B7B3', strokeWidth: 14, draw: [6 + 3 * DUR + 12, 12, 'out-cubic'] });

export default p;
