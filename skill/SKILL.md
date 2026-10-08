---
name: gerak
description: Bikin video lewat kode dengan engine Gerak (Node) — animatic gambar tangan, motion graphic, tipografi kinetik, konten 9:16 TikTok/Reels/Shorts, render MP4/WebM/GIF. Dipakai saat diminta bikin/revisi video, animasi, storyboard, atau aset motion lewat script Gerak (.mjs/.gerak.json), atau saat user menyebut "gerak".
---

# Gerak — panduan untuk agent

Gerak menggambar tiap frame dari script JavaScript lalu merendernya dengan FFmpeg. Kamu menulis script, merender gambar untuk dicek, lalu merevisi dengan target ID yang tepat. Referensi API lengkap: `docs/API.md` di folder engine (baca bagian yang relevan sebelum memakai fitur yang belum pasti).

## Alur kerja

1. **Pahami brief** → tentukan format (`preset: 'reels'` 9:16 untuk TikTok/Reels/Shorts, `square`, `feed` 4:5, `youtube` 16:9), fps (24 untuk gaya gambar tangan, 30 untuk motion graphic), durasi total, dan gaya visual.
2. **Rencanakan scene** sebelum menulis kode: tiap scene = satu gagasan, 2–4 detik. Tulis `s.note({ action, dialog, camera })` supaya contact sheet terbaca seperti storyboard.
3. **Tulis script** (`gerak init video.mjs --template basic|story|promo` untuk mulai). Wajib `export default p`.
4. **Cek tanpa render video**:
   - `gerak run video.mjs` → `output/video-sheet.png` (3 frame per scene + catatan) dan poster. **Lihat gambarnya.**
   - `gerak sheet video.mjs --every 12` untuk timing yang lebih rapat.
   - `gerak frame video.mjs 2.5s` untuk satu momen; `gerak onion video.mjs 40` untuk mengecek gerak.
   - `gerak info video.mjs` untuk ID layer/elemen dan posisi keyframe.
5. **Revisi terarah**: ubah hanya layer/elemen yang bermasalah (pakai ID dari `info`). Jangan menulis ulang semuanya.
6. **Render**: `gerak render video.mjs --draft` (cepat, setengah resolusi) → kalau oke, `gerak render video.mjs -o final.mp4`.
7. Laporkan file output + ringkasan singkat; sebutkan apa yang belum dicek (mis. audio belum didengar).

## Aturan penting

- **Waktu di dalam scene itu lokal** (frame 0 = awal scene). Angka = frame; string `'1.5s'`, `'500ms'`. Range `[from, to)` ujung eksklusif.
- **Transisi menumpuk** ke scene sebelumnya: transisi 12 frame memotong 12 frame dari total.
- **Rotasi derajat.** Kamera `x` positif = kamera ke kanan (gambar ke kiri).
- **Pivot**: `pop`, `spin`, `scale` berporos di origin layer. Gambar objek di sekitar (0,0) dan taruh layer di posisi objek (`{ x, y }`) — atau set `pivot: [px, py]`.
- **Clip ada di ruang lokal layer** dan ikut bergerak. Untuk daftar yang menggulung: clip di group induk yang diam, keyframe di group anak.
- **Caption/HUD** pakai layer `{ fixed: true }` supaya tidak ikut kamera.
- **Safe zone 9:16**: hindari teks penting di 9% atas, 21% bawah, dan 14% kanan (UI TikTok/Reels). Ukuran teks minimal ~44px untuk body, 90–150px untuk judul di 1080 lebar.
- **Kecepatan baca**: beri waktu ±0.3–0.4 detik per kata sebelum scene berganti.
- **SFX**: pakai `volume` dB negatif (-6 sampai -16); musik latar -16 sampai -22 dB. Sinkronkan `at` SFX dengan momen visualnya (pop teks, garis tergambar, transisi).
- **Determinisme**: jangan pakai `Math.random()`; pakai `seed` atau `rng(seed)` dari 'gerak' supaya render konsisten.
- **Font bawaan**: `Plus Jakarta Sans` (400–800), `Caveat` (tulisan tangan, 400/700), `Patrick Hand`. Emoji tidak dijamin ada.

## Resep cepat

```js
import { project, withPressure } from 'gerak';
const p = project({ title: 'X', preset: 'reels', fps: 30, background: '#f4efe6' });
p.effects({ grain: 0.05 });                    // tekstur kertas
const s = p.scene('Hook', { duration: '3s' });

// judul kata per kata
const t = s.layer('Judul', { fixed: true });
t.text('Kalimat hook', 540, 700, { size: 120, weight: 800, align: 'center', valign: 'middle', maxWidth: 900,
  anim: { type: 'words', effect: 'pop', at: 3, stagger: 4 } });

// coretan kuas yang tergambar
s.layer('Coret').stroke(withPressure([[200, 860], [540, 840], [880, 870]], 'taper'),
  { brush: 'brush', size: 30, color: '#00B7B3', reveal: [14, 14, 'out-cubic'] });

// objek muncul + melayang
const ikon = s.layer('Ikon', { x: 540, y: 1150 });
ikon.circle(0, 0, 120, { fill: '#2D3E8D' });
ikon.pop(10).float({ amp: 10, period: 2.5, from: 24 });

s.camera.push({ zoom: 1.05 });
s.sfx('pop', { at: 3, volume: -8 });

const s2 = p.scene('Isi', { duration: '3s', transition: { type: 'push-left', duration: 10 } });
// ...
export default p;
```

Pola lain:
- Angka naik: `text('0', x, y, { anim: { type: 'count', from: 0, to: 2500000, at: 6, dur: 40, prefix: 'Rp' }, fit: 900 })`
- Subtitle tersinkron: `anim: { type: 'karaoke', times: ['0.2s', '0.5s', ...], color: '#FFD43B' }` atau `s.captions([...])`
- Gaya gambar tangan: `p.boil(true)`, brush `ink`/`brush`/`dry`, bentuk `sketch: true`, font `Caveat`, fps 24.
- Pose bergantian (ngetik, jalan, kedip): `track.drawing(...)` + `track.cycle([a, b], { every: 3 })`.
- Penekanan: `highlight: { words: ['gratis'], style: 'marker'|'underline'|'circle'|'strike', at, dur }`.

## Kalau ada error

Pesan error Gerak berbahasa Indonesia dan menyebut opsi yang valid (mis. nama brush/easing/channel). Perbaiki sesuai pesan, jalankan `gerak run` lagi. `gerak doctor` untuk cek Node/FFmpeg/font.
