---
name: gerak
description: Bikin video lewat kode dengan engine Gerak (Node) — animatic gambar tangan, motion graphic, tipografi kinetik, konten 9:16 TikTok/Reels/Shorts, infografis, render MP4/WebM/GIF. Dipakai saat diminta bikin/revisi video, animasi, storyboard, atau aset motion lewat script Gerak (.mjs/.gerak.json), atau saat user menyebut "gerak".
---

# Gerak — panduan untuk agent

Gerak menggambar tiap frame dari script JavaScript lalu merendernya dengan FFmpeg. Kamu menulis script, merender gambar untuk dicek, lalu merevisi dengan target ID yang tepat.

Sumber yang WAJIB dipakai:
- `examples/resep/README.md` — **100 contoh siap salin**, dikelompokkan per kategori, tiap baris berisi fitur & kapan dipakai. Versi mesin: `examples/resep/katalog.json`.
- `docs/API.md` — referensi semua fungsi & opsi.

## Alur kerja

0. **Cari resep paling mirip** dengan brief di `examples/resep/README.md` (atau `grep -l "kata-kunci" examples/resep/*.mjs`). Baca file itu sampai habis. Salin ke folder kerja, lalu ubah. Jangan mulai dari nol kalau ada resep yang mirip. Gabungkan 2–3 resep kalau brief butuh beberapa teknik.
1. **Tentukan format**: `preset: 'reels'` (9:16 TikTok/Reels/Shorts), `square` (1:1), `feed` (4:5), `youtube` (16:9). fps 24 untuk gaya gambar tangan, 30 untuk motion graphic.
2. **Rencanakan scene**: tiap scene = satu gagasan, 2–4 detik. Tulis `s.note({ action, dialog, camera })`.
3. **Tulis script**. Wajib `export default p`. Simpan aset (gambar/audio) di samping script; path relatif terhadap file script.
4. **Cek tanpa render video**:
   - `gerak run video.mjs` → `output/video-sheet.png` + poster. **Buka dan lihat gambarnya.**
   - `gerak sheet video.mjs --every 12` untuk timing rapat; `gerak frame video.mjs 2.5s` untuk satu momen; `gerak onion video.mjs 40` untuk gerak.
   - `gerak info video.mjs` untuk ID layer/elemen dan posisi keyframe.
5. **Revisi terarah**: ubah hanya bagian bermasalah (pakai ID dari `info`). Lihat resep 094 untuk revisi file `.gerak.json`.
6. **Render**: `gerak render video.mjs --draft` (cepat) → kalau oke `gerak render video.mjs -o final.mp4`.
7. Laporkan file output + yang belum dicek (mis. audio belum didengar).

## Aturan yang sering bikin salah

- **Waktu di dalam scene itu lokal** (frame 0 = awal scene). Angka = frame; string `'1.5s'`, `'500ms'`. Range `[from, to)` ujung eksklusif.
- **Sebelum key pertama, nilai key pertama yang berlaku.** Objek yang harus muncul belakangan: `l.key(0, { opacity: 0 }, 'hold').key(30, { opacity: 1 })` (resep 015, 028).
- **Ease ada di key AWAL segmen**: `key(0, {x: 0}, 'out-back').key(12, {x: 100})`.
- **Pivot**: `pop`, `spin`, `scale` berporos di origin layer. Gambar objek di sekitar (0,0) dan taruh layer di posisi objek `{ x, y }`. Untuk bar yang tumbuh: origin di dasar/kiri (resep 029, 030).
- **Rotasi dan skala memakai pivot yang sama.** Butuh rotasi di pusat + skala dari dasar → pisah: group diputar, layer di dalamnya diskalakan (resep 089).
- **Clip/wipe memakai koordinat lokal layer.** Layer dengan x/y → beri `rect` sendiri ke `wipeIn` (resep 071). Satu layer hanya satu wipe: masuk di layer, keluar di group induk.
- **Scroll di dalam area terpotong**: clip di group induk yang DIAM, keyframe di group anak (resep 092, 079).
- **Mask**: `group({ mask: 'id-anak' })`; layer anak dengan id itu jadi cetakan, boleh dianimasikan (resep 014, 053, 090).
- **Caption/HUD** pakai `{ fixed: true }` supaya tidak ikut kamera.
- **Pusatkan titik (px, py) dengan kamera**: `camera.key(f, { x: px - W/2, y: py - H/2, zoom })` (resep 042).
- **Loop mulus (GIF/stiker)**: semua periode behavior harus membagi durasi (resep 072).
- **Sinkron musik**: frame per ketuk = `fps * 60 / BPM`; taruh key & SFX di kelipatannya (resep 085).
- **Audio**: `trim`, `fadeIn`, `fadeOut`, `duration` dalam DETIK; `at` dalam waktu biasa. Volume pakai dB: SFX −6…−16, musik latar −16…−22.
- **Typewriter**: kecepatan pakai `cps`; durasi suara ketik = jumlah huruf / cps.
- **Angka**: `anim: { type: 'count', ... }` + `fit: lebarMaks` supaya angka panjang tidak keluar layar.
- **Teks panjang**: selalu beri `maxWidth`. Safe zone 9:16: hindari 9% atas, 21% bawah, 14% kanan.
- **Determinisme**: jangan `Math.random()`; pakai `rng('seed')` dari 'gerak' (resep 035, 097).
- **Data luar**: `JSON.parse(readFileSync(new URL('./data.json', import.meta.url), 'utf8'))` (resep 095). Varian massal: `process.env` (resep 098, 099).
- **Font bawaan**: `Plus Jakarta Sans` (400–800), `Caveat` (400/700), `Patrick Hand`. Font lain: `p.font(path, { family })` (resep 093). Jangan pakai emoji (tidak dijamin ada glyph).
- **Konten jujur**: testimoni, angka hasil, dan klaim harus data asli — resep 065 & 077 hanya template.

## Checklist sebelum render final

- [ ] Sheet sudah dilihat: tidak ada teks terpotong/tumpang tindih, tidak ada objek nongol sebelum waktunya.
- [ ] Teks utama terbaca ≥ 0,3 detik per kata sebelum scene berganti.
- [ ] Transisi tidak menutupi momen penting (transisi memakan durasi scene sebelumnya).
- [ ] SFX jatuh tepat di momen visual (pop teks, garis tergambar, transisi).
- [ ] Format & durasi sesuai platform.

## Kerja bareng Gerak Studio (editor visual)

User bisa mengedit video sendiri di Gerak Studio (`gerak studio`, folder kerja default `~/gerak-studio`). Panduan: `docs/STUDIO.md`.

- **Serahkan script ke Studio**: simpan script `.mjs` di folder kerja Studio. User membukanya lewat *Proyek → Script di folder ini → Buka di Studio*. Studio membuat salinan `.gerak.json`, dan script kamu tidak diubah. Aset yang dipakai script sebaiknya juga ada di folder kerja.
- **Revisi proyek buatan Studio**: file `*.gerak.json` di folder kerja adalah project biasa. Pakai `open(file)` → `p.find(id)` → `p.save(file)` (resep 094). ID terlihat di panel kanan Studio. Path aset di file itu relatif terhadap folder kerja.
- **Jangan menyimpan file yang sedang dibuka user di Studio.** Autosave Studio akan menimpanya. Simpan ke nama baru (`video-v2.gerak.json`) lalu beri tahu user.
- Elemen yang dibuat Studio: teks/bentuk/gambar masing-masing satu layer dengan objek berpusat di (0,0) dan posisi di `transform.x/y`. Coretan kuas ada di layer "Gambar N" dengan koordinat kanvas.

## Kalau ada error

Pesan error Gerak berbahasa Indonesia dan menyebut opsi yang valid (nama brush/easing/channel/transisi). Perbaiki sesuai pesan, jalankan `gerak run` lagi. `gerak doctor` untuk cek Node/FFmpeg/font. `gerak list` untuk daftar brush, easing, transisi, SFX, preset.
