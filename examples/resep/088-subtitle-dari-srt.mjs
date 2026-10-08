// 088 · Subtitle dari teks SRT
// kategori: audio
// fitur: parser SRT kecil (bisa dipakai ulang) · hasil → scene.captions · durasi scene ikut subtitle terakhir · gaya caption box
// pakai: memasang subtitle dari file .srt (hasil transkrip Whisper/CapCut/YouTube) ke video Gerak

import { project } from 'gerak';
// untuk file sungguhan: import { readFileSync } from 'node:fs';
//                      const SRT = readFileSync(new URL('./subtitle.srt', import.meta.url), 'utf8');

const SRT = `
1
00:00:00,300 --> 00:00:01,800
Kebanyakan pemilik usaha capek

2
00:00:01,800 --> 00:00:03,400
bukan karena kerjaannya berat,

3
00:00:03,400 --> 00:00:05,200
tapi karena diulang-ulang.

4
00:00:05,200 --> 00:00:07,000
Itu tandanya butuh sistem.
`;

// "00:00:01,800" → detik (number)
const keDetik = (t) => {
  const [h, m, rest] = t.trim().split(':');
  return +h * 3600 + +m * 60 + parseFloat(rest.replace(',', '.'));
};
function parseSRT(teks) {
  return teks
    .trim()
    .split(/\r?\n\r?\n/)
    .map((blok) => {
      const baris = blok.split(/\r?\n/);
      const waktu = baris.find((b) => b.includes('-->'));
      if (!waktu) return null;
      const [a, b] = waktu.split('-->').map(keDetik);
      return { mulai: a, selesai: b, text: baris.slice(baris.indexOf(waktu) + 1).join(' ') };
    })
    .filter(Boolean);
}

const sub = parseSRT(SRT);
const p = project({ title: 'Subtitle dari SRT', preset: 'reels', fps: 30, background: '#1d2b53' });
const W = p.width;
const durasi = sub[sub.length - 1].selesai + 0.5;
const s = p.scene('Video', { duration: `${durasi}s` });

// visual pengganti video (di proyek asli: gambar/klip talking head)
const vis = s.layer('Visual', { x: W / 2, y: 760 });
vis.circle(0, 0, 260, { fill: '#2D3E8D' });
vis.image('assets/avatar.png', 0, 0, { width: 440, height: 440, radius: 220, anchor: 'center' });
vis.pulse({ amount: 0.02, period: 0.4 });

// subtitle: detik → string waktu "1.8s"
s.captions(
  sub.map((c) => ({ text: c.text, at: `${c.mulai}s`, until: `${c.selesai}s` })),
  { y: 1400, size: 62, weight: 800, color: '#ffffff', stroke: null, box: { color: 'rgba(0,0,0,0.55)', padX: 26, padY: 14, radius: 18 }, anim: { type: 'words', effect: 'fade', stagger: 2, dur: 6 } },
);

// ganti dengan audio VO asli: s.audio('vo.mp3', { at: 0 })
p.sfx('pad', { at: 0, dur: durasi, root: 196, chord: [0, 4, 7], volume: -20 });

export default p;
