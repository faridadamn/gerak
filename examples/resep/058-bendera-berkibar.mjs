// 058 · Bendera berkibar (siklus 4 gambar)
// kategori: karakter
// fitur: fungsi pembuat path gelombang (fase berbeda) · track.cycle tiap 4 frame · tiang & tali · Caveat
// pakai: konten hari besar/kemerdekaan, animasi loop sederhana, simbol semangat

import { project } from 'gerak';

const p = project({ title: 'Bendera berkibar', preset: 'reels', fps: 24, background: { type: 'linear', angle: 90, stops: [[0, '#a5d8ff'], [1, '#e7f5ff']] } });
const W = p.width;
const X0 = 300; // tepi bendera di tiang
const Y0 = 420;
const PANJANG = 560;
const TINGGI = 360;

// path bendera bergelombang: tepi atas, tengah, bawah mengikuti sinus dengan fase
function gelombang(fase, yAtas, yBawah) {
  const n = 12;
  const titik = (y, i) => {
    const t = i / n;
    const x = X0 + t * PANJANG;
    return [x - Math.sin(t * Math.PI) * 6, y + Math.sin(t * Math.PI * 2 + fase) * 26 * t];
  };
  const atas = [...Array(n + 1).keys()].map((i) => titik(yAtas, i));
  const bawah = [...Array(n + 1).keys()].map((i) => titik(yBawah, i)).reverse();
  return 'M ' + [...atas, ...bawah].map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join(' L ') + ' Z';
}

const s = p.scene('Bendera', { duration: '4s' });

const tiang = s.layer('Tiang');
tiang.rect(X0 - 22, Y0 - 40, 16, 1300, { fill: '#868e96', r: 8 });
tiang.circle(X0 - 14, Y0 - 50, 20, { fill: '#ffd43b' });

const bendera = s.track('Bendera');
const frame = [0, 1, 2, 3].map((k) => {
  const d = bendera.drawing(`fase ${k}`);
  const fase = (k / 4) * Math.PI * 2;
  const l = d.layer('kain');
  l.path(gelombang(fase, Y0, Y0 + TINGGI / 2), { fill: '#e03131' });
  l.path(gelombang(fase, Y0 + TINGGI / 2, Y0 + TINGGI), { fill: '#ffffff' });
  l.path(gelombang(fase, Y0, Y0 + TINGGI), { fill: 'none', stroke: 'rgba(0,0,0,0.15)', strokeWidth: 4 });
  return d;
});
bendera.cycle(frame, { every: 4 });

const teks = s.layer('Teks', { fixed: true });
teks.text('Merdeka', W / 2, 1180, { font: 'Caveat', weight: 700, size: 170, color: '#c92a2a', align: 'center', valign: 'middle', anim: { type: 'chars', effect: 'rise', at: 6, stagger: 2, dur: 12 } });
teks.text('dari kerja yang diulang-ulang', W / 2, 1320, { size: 52, weight: 600, color: '#1d2b53', align: 'center', valign: 'middle', anim: { type: 'words', effect: 'fade', at: 30, stagger: 3 } });

s.sfx('whoosh', { at: 0, dur: 4, low: 200, high: 600, volume: -24 });

export default p;
