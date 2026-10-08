// 085 · Visual sinkron dengan ketukan (BPM)
// kategori: audio
// fitur: rumus frame per ketuk = fps × 60 / BPM · key scale di setiap ketuk · latar ganti warna per bar · kata muncul tepat di ketuk · sfx beat
// pakai: video musik/lirik, montage berirama, iklan energik, transisi on-beat

import { project } from 'gerak';

const BPM = 120;
const p = project({ title: 'Sinkron beat', preset: 'reels', fps: 30, background: '#14161f' });
const W = p.width;
const H = p.height;
const KETUK = (p.fps * 60) / BPM; // = 15 frame per ketukan
const BAR = KETUK * 4; // 4 ketuk per bar

const s = p.scene('Beat', { duration: BAR * 4 });

// 1) latar: blok warna yang berganti tiap bar (show range)
const WARNA = ['#2D3E8D', '#c2255c', '#0b7285', '#e8590c'];
WARNA.forEach((w, i) => s.layer(`Latar bar ${i + 1}`, { show: [i * BAR, (i + 1) * BAR] }).rect(0, 0, W, H, { fill: w }));

// 2) lingkaran "menghentak" tiap ketuk: membesar tepat di ketuk lalu mengecil
const dentum = s.layer('Dentum', { x: W / 2, y: 820 });
dentum.circle(0, 0, 260, { fill: 'rgba(255,255,255,0.12)' });
dentum.circle(0, 0, 170, { fill: '#ffffff' });
for (let k = 0; k < 16; k++) {
  const f = k * KETUK;
  dentum.key(f, { scale: k % 4 === 0 ? 1.3 : 1.15 }, 'out-cubic').key(f + KETUK - 1, { scale: 1 });
}

// 3) kata muncul tepat di ketuk (satu kata per ketuk mulai bar ke-2)
const kata = 'jualan · jalan · terus · walau · lu · lagi · tidur'.split(' · ');
const teks = s.layer('Kata', { fixed: true });
kata.forEach((k, i) => {
  const f = BAR + i * KETUK;
  teks.text(k.toUpperCase(), W / 2, 1300, { size: 150, weight: 800, color: '#ffffff', align: 'center', valign: 'middle', show: [f, f + KETUK], anim: { type: 'words', effect: 'pop', at: f, dur: 5 } });
});
teks.text('TIDUR', W / 2, 1300, { size: 150, weight: 800, color: '#FFD43B', align: 'center', valign: 'middle', show: [BAR + kata.length * KETUK, null] });

// 4) beat dengan BPM yang sama → selalu pas
p.sfx('beat', { at: 0, bpm: BPM, bars: 4, volume: -8 });

export default p;
