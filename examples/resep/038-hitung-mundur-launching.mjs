// 038 · Hitung mundur launching (hari:jam:menit:detik)
// kategori: konten
// fitur: count mundur (from > to, ease linear) · kotak angka · pulse detik · preset square · tick tiap detik
// pakai: teaser launching produk, countdown promo 10.10, pre-order, webinar

import { project } from 'gerak';

const TEAL = '#00B7B3';
const p = project({ title: 'Countdown launching', preset: 'square', fps: 30, background: '#14161f' });
const W = p.width;
const FPS = p.fps;

const s = p.scene('Countdown', { duration: '5s' });

const judul = s.layer('Judul', { fixed: true });
judul.text('LAUNCHING', W / 2, 220, { size: 110, weight: 800, color: '#ffffff', align: 'center', valign: 'middle', letterSpacing: 10, anim: { type: 'chars', effect: 'rise', stagger: 2 } });
judul.text('Kelas Otomasi · 10.10', W / 2, 330, { size: 48, weight: 600, color: TEAL, align: 'center', valign: 'middle', anim: { type: 'lines', effect: 'fade', at: 14 } });

// angka awal tiap kotak, dan apakah berjalan
const kotak = [
  { label: 'HARI', dari: 3, ke: 3 },
  { label: 'JAM', dari: 12, ke: 12 },
  { label: 'MENIT', dari: 45, ke: 45 },
  { label: 'DETIK', dari: 30, ke: 25 }, // detik berkurang 5 dalam 5 detik
];
const UK = 210;
const GAP = 24;
const X0 = W / 2 - 1.5 * (UK + GAP);
kotak.forEach((k, i) => {
  const l = s.layer(`Kotak ${k.label}`, { x: X0 + i * (UK + GAP), y: 600 });
  l.rect(-UK / 2, -UK / 2, UK, UK, { fill: '#232634', r: 28, stroke: i === 3 ? TEAL : 'rgba(255,255,255,0.08)', strokeWidth: 4 });
  l.text(String(k.dari), 0, -6, {
    size: 110,
    weight: 800,
    color: '#ffffff',
    align: 'center',
    valign: 'middle',
    // count turun: from > to. ease 'linear' supaya tiap detik pas
    anim: k.dari === k.ke ? undefined : { type: 'count', from: k.dari, to: k.ke, at: 0, dur: 5 * FPS - 1, ease: 'linear' },
  });
  l.text(k.label, 0, UK / 2 + 46, { size: 34, weight: 700, color: '#8a90a2', align: 'center', valign: 'middle', letterSpacing: 4 });
  l.pop(4 + i * 4, { dur: 12 });
  if (i === 3) l.pulse({ amount: 0.03, period: 1, from: 20 });
});

const cta = s.layer('CTA', { x: W / 2, y: 930 });
cta.rect(-280, -60, 560, 120, { fill: TEAL, r: 60 });
cta.text('Ingatkan saya', 0, 0, { size: 52, weight: 800, color: '#06302f', align: 'center', valign: 'middle' });
cta.slideIn(30, { from: 'bottom', distance: 80 });

for (let d = 0; d < 5; d++) s.sfx('tick', { at: d * FPS, volume: -10 });

export default p;
