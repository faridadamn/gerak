// Scene starter Gerak. Jalankan:
//   gerak preview scene.mjs     → live preview di browser
//   gerak render scene.mjs      → output/scene.mp4
import { project } from 'gerak';

const p = project({ title: 'Video Pertama', preset: 'reels', fps: 30, background: '#f4efe6' });
p.effects({ grain: 0.05 }); // tekstur kertas tipis

// ---------------------------------------------------------------- Scene 1
const s1 = p.scene('Pembuka', { duration: '3s' });

// Coretan kuas yang "tergambar" dari frame 6 selama 18 frame
const ink = s1.layer('Coretan');
ink.stroke(
  [[180, 1180, 0.2], [420, 1120, 1], [700, 1170, 0.8], [900, 1110, 0.2]],
  { brush: 'brush', size: 34, color: '#00B7B3', reveal: [6, 18, 'out-cubic'] },
);

// Judul: kata per kata muncul dengan efek pop
const judul = s1.layer('Judul', { x: 540, y: 900 });
judul.text('Gambar lewat kode,\njadi video.', 0, 0, {
  size: 96, weight: 800, color: '#2D3E8D', align: 'center', valign: 'middle',
  anim: { type: 'words', effect: 'pop', at: 4, stagger: 4, dur: 12 },
});

s1.camera.push({ zoom: 1.05 }); // dorongan kamera pelan
s1.sfx('pop', { at: 4 });
s1.sfx('swoosh', { at: 6 });

// ---------------------------------------------------------------- Scene 2
const s2 = p.scene('Isi', { duration: '3s', transition: { type: 'slide-left', duration: 12 } });

const kartu = s2.layer('Kartu', { x: 540, y: 960, pivot: [0, 0] });
kartu.rect(-380, -260, 760, 520, { fill: '#ffffff', r: 36, shadow: { color: 'rgba(0,0,0,0.12)', blur: 30, y: 12 } });
kartu.text('Rp0', 0, -40, {
  size: 150, weight: 800, color: '#111', align: 'center', valign: 'middle', fit: 680,
  anim: { type: 'count', from: 0, to: 2500000, at: 10, dur: 40, prefix: 'Rp' },
});
kartu.text('omzet bulan ini', 0, 120, { size: 52, weight: 600, color: '#6b6b6b', align: 'center', valign: 'middle' });
kartu.pop(2, { dur: 16 });

s2.sfx('coin', { at: 50 });

export default p;
