// 021 · Papan tulis kapur
// kategori: brush
// fitur: brush chalk (tekstur kapur) · bingkai kayu · font Caveat · grafik naik digambar kapur · grain sebagai debu kapur
// pakai: konten edukasi gaya guru/kelas, rumus, penjelasan konsep sederhana

import { project, withPressure } from 'gerak';

const KAPUR = '#f1f3ee';
const p = project({ title: 'Papan tulis kapur', preset: 'reels', fps: 24, background: '#1f3a2e' });
p.effects({ grain: { amount: 0.12, blend: 'screen' }, vignette: 0.35 });
const W = p.width;
const H = p.height;

const s = p.scene('Papan', { duration: '7s' });

// 1) bingkai kayu
const bingkai = s.layer('Bingkai');
bingkai.rect(30, 30, W - 60, H - 60, { fill: 'none', stroke: '#8a5a2b', strokeWidth: 40, r: 12 });
bingkai.rect(50, 50, W - 100, H - 100, { fill: 'none', stroke: '#5e3b1a', strokeWidth: 6, r: 6 });

// helper goresan kapur
const kapur = (l, titik, at, dur = 10, size = 14) => l.stroke(withPressure(titik, 'swell'), { brush: 'chalk', size, color: KAPUR, reveal: [at, dur, 'in-out-sine'] });

// 2) judul + garis bawah kapur
const teks = s.layer('Tulisan');
teks.text('Kenapa omzet stagnan?', W / 2, 330, { font: 'Caveat', weight: 700, size: 110, color: KAPUR, align: 'center', anim: { type: 'chars', effect: 'fade', at: 4, stagger: 0.8, dur: 6 } });
const garis = s.layer('Goresan');
kapur(garis, [[200, 380], [540, 372], [880, 384]], 26, 10, 16);

// 3) grafik: sumbu + garis naik turun lalu naik tajam
kapur(garis, [[200, 1300], [200, 640]], 38, 8);
kapur(garis, [[200, 1300], [900, 1300]], 44, 8);
kapur(garis, [[200, 1200], [330, 1150], [460, 1180], [590, 1160], [720, 900], [880, 700]], 52, 22, 16);
kapur(garis, [[820, 690], [880, 700], [860, 760]], 74, 6, 16);

// 4) catatan di papan
teks.text('tanpa sistem: datar', 240, 1420, { font: 'Caveat', size: 76, color: '#cfd8d0', anim: { type: 'chars', effect: 'fade', at: 84, stagger: 0.8, dur: 6 } });
teks.text('pakai sistem: naik!', 240, 1520, { font: 'Caveat', weight: 700, size: 86, color: '#ffe066', anim: { type: 'chars', effect: 'fade', at: 104, stagger: 0.8, dur: 6 } });

for (const at of [4, 26, 38, 44, 52, 84, 104]) s.sfx('scratch', { at, dur: 0.5, volume: -10 });

export default p;
