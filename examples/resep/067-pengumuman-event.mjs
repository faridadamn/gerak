// 067 · Pengumuman event (format feed 4:5)
// kategori: konten
// fitur: preset feed 1080×1350 · ikon kalender/jam/pin dari bentuk · baris info slideIn bertahap · CTA berdenyut · dekor lingkaran
// pakai: webinar, kelas online, kopdar, workshop, launching offline

import { project } from 'gerak';

const BLUE = '#2D3E8D';
const TEAL = '#00B7B3';
const p = project({ title: 'Pengumuman event', preset: 'feed', fps: 30, background: BLUE });
const W = p.width; // 1080
const H = p.height; // 1350

const s = p.scene('Event', { duration: '6s' });

const dekor = s.layer('Dekor');
dekor.circle(W - 80, 120, 260, { fill: TEAL, opacity: 0.25 });
dekor.circle(60, H - 60, 200, { fill: '#ffffff', opacity: 0.06 });
dekor.float({ amp: 10, period: 5 });

const atas = s.layer('Judul', { fixed: true });
atas.text('WEBINAR GRATIS', 90, 170, { size: 40, weight: 800, color: TEAL, letterSpacing: 6, anim: { type: 'chars', effect: 'fade', stagger: 0.8 } });
atas.text('Bikin Toko Online\nyang Jalan Sendiri', 90, 240, { size: 92, weight: 800, color: '#ffffff', valign: 'top', lineHeight: 1.05, anim: { type: 'words', effect: 'rise', at: 6, stagger: 3, dur: 12 } });

// ikon kecil di sekitar (0,0), ukuran ±34
const ikon = {
  kalender: (l) => {
    l.rect(-34, -28, 68, 62, { fill: '#ffffff', r: 10 });
    l.rect(-34, -28, 68, 18, { fill: TEAL, r: [10, 10, 0, 0] });
    l.rect(-18, -40, 8, 20, { fill: '#ffffff', r: 4 });
    l.rect(10, -40, 8, 20, { fill: '#ffffff', r: 4 });
  },
  jam: (l) => {
    l.circle(0, 0, 34, { fill: '#ffffff' });
    l.polygon([[0, -20], [0, 0], [16, 10]], { closed: false, stroke: BLUE, strokeWidth: 7 });
  },
  pin: (l) => {
    l.path('M 0 -36 C -22 -36 -32 -18 -32 -4 C -32 18 0 40 0 40 C 0 40 32 18 32 -4 C 32 -18 22 -36 0 -36 Z', { fill: '#ffffff' });
    l.circle(0, -6, 11, { fill: BLUE });
  },
};
const info = [
  { ikon: 'kalender', teks: 'Sabtu, 18 Oktober 2026' },
  { ikon: 'jam', teks: '19.30 – 21.00 WIB' },
  { ikon: 'pin', teks: 'Online via Zoom' },
];
info.forEach((d, i) => {
  const at = 30 + i * 10;
  const baris = s.layer(`Info ${i + 1}`, { x: 90, y: 620 + i * 130 });
  baris.rect(0, -55, W - 180, 110, { fill: 'rgba(255,255,255,0.08)', r: 24 });
  const g = baris.group(`Ikon ${d.ikon}`, { x: 70 });
  ikon[d.ikon](g.layer(`gambar ${d.ikon}`));
  baris.text(d.teks, 140, 0, { size: 48, weight: 700, color: '#ffffff', valign: 'middle' });
  baris.slideIn(at, { from: 'left', distance: 120, dur: 14 });
  s.sfx('pop', { at, volume: -14 });
});

const cta = s.layer('CTA', { x: W / 2, y: 1100 });
cta.rect(-330, -62, 660, 124, { fill: TEAL, r: 62 });
cta.text('Daftar — link di bio', 0, 0, { size: 52, weight: 800, color: '#04302f', align: 'center', valign: 'middle' });
cta.pop(66, { dur: 14 }).pulse({ amount: 0.03, period: 0.9, from: 80 });

s.sfx('notify', { at: 66, volume: -10 });

export default p;
