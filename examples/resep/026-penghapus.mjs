// 026 · Menghapus coretan lalu menulis ulang
// kategori: brush
// fitur: layer.erase dengan reveal (penghapus bertahap, hanya menghapus layer itu) · marker · show range · Patrick Hand
// pakai: "hapus kebiasaan lama", koreksi mitos, before → after kalimat, revisi ide

import { project } from 'gerak';

const INK = '#1f2a44';
const p = project({ title: 'Penghapus', preset: 'reels', fps: 30, background: '#ffffff' });
const W = p.width;

const s = p.scene('Hapus', { duration: '6s' });

// 1) tulisan lama di layer sendiri (supaya penghapus tidak menghapus latar)
const lama = s.layer('Tulisan lama');
lama.text('Kerja lembur\ntiap hari', W / 2, 820, { font: 'Patrick Hand', size: 130, color: '#c92a2a', align: 'center', valign: 'middle', lineHeight: 1.05, anim: { type: 'chars', effect: 'fade', at: 2, stagger: 1, dur: 4 } });
// coretan silang di atasnya
lama.stroke([[200, 690, 1], [880, 960, 1]], { brush: 'marker', size: 16, color: '#c92a2a', reveal: [40, 8] });
lama.stroke([[880, 690, 1], [200, 960, 1]], { brush: 'marker', size: 16, color: '#c92a2a', reveal: [48, 8] });

// 2) penghapus: zig-zag besar yang menghapus layer "Tulisan lama" sedikit demi sedikit
const zig = [];
for (let i = 0; i <= 8; i++) zig.push([170 + (i % 2) * 740, 640 + i * 46, 1]);
lama.erase(zig, { size: 150, reveal: [70, 30, 'in-out-sine'], smooth: false });

// 3) tulisan baru muncul setelah terhapus
const baru = s.layer('Tulisan baru');
baru.text('Kerja pakai\nsistem', W / 2, 820, { font: 'Patrick Hand', size: 140, color: INK, align: 'center', valign: 'middle', lineHeight: 1.05, anim: { type: 'chars', effect: 'pop', at: 104, stagger: 1.5, dur: 8 } });
baru.stroke([[300, 1010, 0.6], [540, 995, 1], [780, 1012, 0.6]], { brush: 'marker', size: 14, color: '#00B7B3', reveal: [130, 10] });

s.sfx('scratch', { at: 40, dur: 0.6, volume: -10 });
s.sfx('scratch', { at: 70, dur: 1, volume: -6 });
s.sfx('success', { at: 130, volume: -12 });

export default p;
