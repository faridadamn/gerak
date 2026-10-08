// 062 · Konten tips 3 poin (hook + 3 tips + CTA)
// kategori: konten
// fitur: struktur konten lengkap · fungsi scene tip(data) · bar progres per segmen di atas · push transition · ikon nomor besar · beat
// pakai: format konten edukasi paling umum di TikTok/Reels: "3 tips …"

import { project } from 'gerak';

const BLUE = '#2D3E8D';
const TEAL = '#00B7B3';
const p = project({ title: 'Tips 3 poin', preset: 'reels', fps: 30, background: '#f5f7fb' });
const W = p.width;

const TIPS = [
  { judul: 'Simpan template balasan', isi: 'Pertanyaan yang sama dijawab sekali, dipakai ratusan kali.' },
  { judul: 'Jadwalkan konten seminggu', isi: 'Satu sore bikin 7 konten, sisanya tinggal posting otomatis.' },
  { judul: 'Rekap angka tiap Jumat', isi: '10 menit lihat omzet & produk terlaris. Keputusan jadi jelas.' },
];

// bar progres 3 segmen di atas (aktif = teal)
function progres(scene, aktif) {
  const l = scene.layer('Progres', { fixed: true });
  const lebar = (W - 160 - 2 * 16) / 3;
  TIPS.forEach((_, i) => {
    const x = 80 + i * (lebar + 16);
    l.rect(x, 180, lebar, 12, { fill: 'rgba(45,62,141,0.15)', r: 6 });
    if (i < aktif) l.rect(x, 180, lebar, 12, { fill: TEAL, r: 6 });
  });
  if (aktif >= 1) {
    // segmen aktif terisi sepanjang scene (scaleX dengan origin di kiri segmen)
    const isi = scene.layer('Progres isi', { fixed: true, x: 80 + (aktif - 1) * (lebar + 16) });
    isi.rect(0, 180, lebar, 12, { fill: TEAL, r: 6 });
    isi.key(0, { scaleX: 0 }, 'linear').key(scene.duration, { scaleX: 1 });
  }
}

// ---- hook
const hook = p.scene('Hook', { duration: '2.5s', background: BLUE });
const h = hook.layer('Hook', { fixed: true });
h.text('3 kebiasaan kecil', W / 2, 820, { size: 96, weight: 800, color: '#ffffff', align: 'center', valign: 'middle', anim: { type: 'words', effect: 'pop', stagger: 4 } });
h.text('yang hemat 10 jam/minggu', W / 2, 950, { size: 66, weight: 700, color: TEAL, align: 'center', valign: 'middle', anim: { type: 'words', effect: 'rise', at: 16, stagger: 3 } });
hook.sfx('whoosh', { at: 0, volume: -10 });

// ---- 3 tip
TIPS.forEach((t, i) => {
  const s = p.scene(`Tip ${i + 1}`, { duration: '3.5s', transition: { type: 'push-left', duration: 10, ease: 'in-out-quart' } });
  progres(s, i + 1);
  const nomor = s.layer('Nomor', { x: 220, y: 560 });
  nomor.text(String(i + 1), 0, 0, { size: 380, weight: 800, color: 'rgba(0,183,179,0.18)', align: 'center', valign: 'middle' });
  nomor.slideIn(4, { from: 'left', distance: 120, dur: 16 });
  const teks = s.layer('Teks', { fixed: true });
  teks.text(t.judul, 100, 760, { size: 90, weight: 800, color: '#14161f', valign: 'top', maxWidth: 880, lineHeight: 1.05, anim: { type: 'words', effect: 'rise', at: 8, stagger: 3, dur: 10 } });
  teks.text(t.isi, 100, 1100, { size: 52, weight: 500, color: '#4a4f63', valign: 'top', maxWidth: 860, lineHeight: 1.3, anim: { type: 'lines', effect: 'fade', at: 26, stagger: 6, dur: 12 } });
  s.sfx('swipe', { at: 0, volume: -12 });
});

// ---- CTA
const cta = p.scene('CTA', { duration: '2.5s', background: TEAL, transition: { type: 'zoom', duration: 12 } });
const c = cta.layer('CTA', { fixed: true });
c.text('Simpan biar nggak lupa', W / 2, 900, { size: 84, weight: 800, color: '#ffffff', align: 'center', valign: 'middle', maxWidth: 900, anim: { type: 'words', effect: 'pop', stagger: 4 } });
c.text('follow untuk part 2', W / 2, 1040, { size: 56, weight: 700, color: '#04302f', align: 'center', valign: 'middle', anim: { type: 'lines', effect: 'rise', at: 18 } });
cta.sfx('notify', { at: 18, volume: -8 });

p.sfx('beat', { at: 0, bpm: 110, bars: 7, volume: -18, hat: 'x.x.x.x.x.x.xxx.' });

export default p;
