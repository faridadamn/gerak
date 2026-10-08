// 093 · Font kustom + font bawaan
// kategori: lanjut
// fitur: p.font(path, {family, weight}) mendaftarkan file .ttf/.otf (path relatif ke file script) · weight 400–800 · italic · letterSpacing
// pakai: memakai font brand sendiri, membandingkan font, memastikan render sama di VPS & preview

import { project } from 'gerak';

const p = project({ title: 'Font kustom', preset: 'reels', fps: 30, background: '#fffaf0' });
const W = p.width;

// daftarkan font dari file. Path relatif terhadap folder script ini.
// Untuk font brand sendiri: taruh di folder project, mis. p.font('fonts/BrandSans-Bold.ttf', { family: 'Brand', weight: 700 })
const KELUARGA = p.font('../../fonts/PatrickHand-Regular.ttf', { family: 'Tulisan Saya', weight: 400 });

const s = p.scene('Font', { duration: '6s' });
const l = s.layer('Contoh', { fixed: true });

const contoh = [
  { label: `font: '${KELUARGA}' (didaftarkan)`, opsi: { font: KELUARGA, size: 90 } },
  { label: "Plus Jakarta Sans 400", opsi: { weight: 400, size: 80 } },
  { label: "Plus Jakarta Sans 600", opsi: { weight: 600, size: 80 } },
  { label: "Plus Jakarta Sans 800", opsi: { weight: 800, size: 80 } },
  { label: "Caveat 700", opsi: { font: 'Caveat', weight: 700, size: 96 } },
  { label: 'letterSpacing: 12', opsi: { weight: 800, size: 64, letterSpacing: 12, case: 'upper' } },
];
contoh.forEach((c, i) => {
  const y = 300 + i * 240;
  const at = 6 + i * 10;
  l.text(c.label, 90, y, { size: 30, weight: 600, color: '#adb5bd', anim: { type: 'lines', effect: 'fade', at } });
  l.text('Sistem jalan sendiri', 90, y + 100, { color: '#14161f', ...c.opsi, anim: { type: 'lines', effect: 'rise', at: at + 2, dur: 12 } });
});

export default p;
