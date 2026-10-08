// 087 · Galeri semua SFX sintetis (dengar & lihat namanya)
// kategori: audio
// fitur: SFX_TYPES (daftar semua efek) · grid label · kotak menyala tepat saat suaranya diputar · parameter dur untuk efek panjang
// pakai: referensi memilih efek suara — render jadi MP4, tonton, catat nama efek yang cocok

import { project, SFX_TYPES } from 'gerak';

const p = project({ title: 'Galeri SFX', preset: 'reels', fps: 30, background: '#14161f' });
const W = p.width;
const JEDA = 21; // frame antar efek (0,7 detik)
const daftar = SFX_TYPES.filter((n) => n !== 'silence');

const s = p.scene('SFX', { duration: daftar.length * JEDA + 30 });

const judul = s.layer('Judul', { fixed: true });
judul.text(`${daftar.length} efek suara bawaan`, W / 2, 170, { size: 60, weight: 800, color: '#ffffff', align: 'center' });
judul.text("s.sfx('nama', { at, volume })", W / 2, 245, { size: 36, weight: 600, color: '#00B7B3', align: 'center' });

const KOL = 3;
const LEBAR = 300;
const TINGGI = 128;
const X0 = W / 2 - LEBAR - 10;
daftar.forEach((nama, i) => {
  const x = X0 + (i % KOL) * (LEBAR + 10);
  const y = 380 + Math.floor(i / KOL) * (TINGGI + 10);
  const at = 10 + i * JEDA;
  // kotak dasar
  const l = s.layer(`Label ${nama}`, { x, y });
  l.rect(-LEBAR / 2, -TINGGI / 2, LEBAR, TINGGI, { fill: '#212433', r: 20 });
  l.text(nama, 0, 0, { size: 40, weight: 700, color: '#adb5bd', align: 'center', valign: 'middle' });
  // kotak menyala selama efek ini diputar
  const nyala = s.layer(`Nyala ${nama}`, { x, y, show: [at, at + JEDA] });
  nyala.rect(-LEBAR / 2, -TINGGI / 2, LEBAR, TINGGI, { fill: '#00B7B3', r: 20 });
  nyala.text(nama, 0, 0, { size: 44, weight: 800, color: '#04302f', align: 'center', valign: 'middle' });
  nyala.pop(at, { dur: 6, from: 0.85, fade: false });
  // efek yang aslinya panjang diberi durasi pendek supaya galeri tetap rapi
  const opsi = { at, volume: -8 };
  if (nama === 'pad') Object.assign(opsi, { dur: 0.7 });
  if (nama === 'beat') Object.assign(opsi, { bars: 1, bpm: 140 });
  if (nama === 'riser' || nama === 'typing' || nama === 'whoosh') Object.assign(opsi, { dur: 0.6 });
  if (nama === 'heartbeat') Object.assign(opsi, { beats: 1 });
  s.sfx(nama, opsi);
});

export default p;
