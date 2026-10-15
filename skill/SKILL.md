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

0. **Pilih gaya, lalu cari teknik.** Baca bagian *Aturan desain* di bawah dan pilih arah visual (referensi: `examples/gaya/README.md`). Lalu cari resep yang tekniknya paling mirip dengan brief di `examples/resep/README.md` (atau `grep -l "kata-kunci" examples/resep/*.mjs`), baca sampai habis, ambil tekniknya — **bukan warna & tata letaknya**. Gabungkan 2–3 resep kalau brief butuh beberapa teknik.
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

## Aturan desain (WAJIB — ini yang membedakan video bagus dari template)

Resep di `examples/resep/` mengajarkan **teknik**, bukan gaya. Banyak di antaranya sengaja polos (kartu putih, teal + navy). Kalau gayanya ikut disalin, hasilnya generik.

1. **Pilih arah visual dulu, sebelum menulis kode.** Tulis 1 kalimat di komentar atas script: benda/dunia apa (struk kasir, poster Swiss, buku tulis, cetakan riso…), palet 2–4 warna, 1–2 font. Lihat `examples/gaya/README.md` untuk 10 referensi gaya yang standarnya sudah benar.
2. **Hindari gaya bawaan AI**: latar gelap + neon cyan/ungu + kartu membulat + ikon bintang. Hindari juga palet teal `#00B7B3` + navy `#2D3E8D` dari resep kecuali brand-nya memang itu.
3. **Isi layar.** 9:16 itu tinggi: teks utama ≥ 150px, teks pendukung ≥ 48px, dan jangan biarkan setengah layar kosong. Satu gagasan per scene, ditulis besar.
4. **Ritme dari musik.** Tentukan BPM di awal (`const K = p.fps * 60 / BPM`). Kemunculan penting, SFX, dan pergantian scene jatuh di kelipatan `K`.
5. **Pakai kekuatan Gerak sebagai bagian cerita**: coretan kuas/pulpen yang tergambar (`reveal`), garis `draw`, lingkaran tangan, stabilo, mask/clip, kamera yang bergerak. Video tanpa satu pun dari ini biasanya terasa seperti slide.
6. **Font**: font bawaan cukup untuk banyak hal, tapi gaya tertentu butuh karakter (serif editorial, condensed, mono, retro). Contoh font OFL ada di `examples/gaya/fonts/`.
7. **Lihat sebelum render final**: `gerak sheet` → cek teks terpotong/bertumpuk, ruang kosong, objek nongol terlalu awal. Revisi, sheet lagi, baru render. Cek level audio: `ffmpeg -i out.mp4 -af volumedetect -f null -` (rata-rata ≈ −27…−32 dB).
8. **Path aset relatif ke script**, jangan path absolut VPS (`/home/ubuntu/...`), biar bisa dirender di mana saja.

Alur yang benar: brief → pilih gaya (lihat `examples/gaya/`) → ambil teknik dari resep → tulis script dengan palet & font gaya itu → sheet → revisi → render.

## Uji anti-slide (WAJIB sebelum render final)

Penyakit paling umum video buatan AI: rapi, tapi terasa **presentasi yang di-autoplay**. Diadaptasi dari aturan [Bang Motion](https://github.com/bangtutorial/bang-motion) (MIT) ke API Gerak. Cek **kode dan sheet**, bukan perasaan. Gagal satu poin → rombak dulu.

1. **Ganti scene ≠ ganti slide.** Kalau ≥ 3 scene yang tiap scene-nya latar baru + teks baru lalu `transition`, itu slide deck. Utamakan **satu dunia** yang disusuri kamera: satu `p.scene()` panjang, dunia lebih luas dari frame, cerita pindah karena `s.camera` bergerak. Scene terpisah boleh, asal ada benang merah (lihat no. 2).
2. **Ada subjek yang bertahan** > 60% durasi: satu tokoh/benda (kardus, HP, karakter, produk) yang dibawa penonton dari awal sampai akhir. Contoh: `examples/gaya/11-satu-dunia-pesanan.mjs`.
3. **Maksimal 2 tingkat teks per shot**: satu kalimat/angka besar + satu label. Kicker + judul + body + chip = PPT. **≤ 5 kata per shot**; lebih dari itu pecah jadi dua shot atau ubah jadi visual.
4. **Zoom = ganti ukuran shot, bukan napas kamera.** `camera.push({ zoom: 1.04 })` hampir tak terlihat. Kamera harus **pindah ke elemen yang sedang bercerita**: close-up (`zoom` 1.6–2) → medium (1.0) → wide (0.6–0.8), lalu balik. Pusatkan titik `(px, py)`: `camera.key(f, { x: px - W/2, y: py - H/2, zoom })`. Dua tempo: pindah shot cepat (`in-out-cubic`, 10–16 frame), menahan dengan push pelan (`in-out-sine`). Teks muncul **setelah** kamera tiba. Dua shot berurutan jangan sama ukurannya.
5. **Miniatur = slide.** Extreme wide yang bikin dunia jadi garis tipis di tengah layar dan sisanya kosong → isi ruangnya (mis. tulisan raksasa yang "dicat" di dunia) atau jangan sejauh itu.
6. **Latar tidak pernah diam**, tapi juga tidak berisik: parallax `depth` (awan 3, bukit 2, rumput depan 0.85), awan drift, grain, bentuk besar berputar pelan, gradien. Latar flat satu warna dari awal sampai akhir = gagal (kecuali gaya poster yang memang ganti warna per ketuk).
7. **Label di lapisan layar, benda di dunia.** Caption pakai layer `{ fixed: true }` supaya tidak ikut zoom/terpotong; papan, chat bubble, stempel, angka yang "ditulis di dunia" ikut kamera.
8. **Transisi tidak seragam.** Satu jenis transisi di semua pergantian = template. Pilih dari: kamera pindah shot, benda yang menutup lensa, `iris`/mask berbentuk benda, push, koreografi elemen keluar-masuk beririsan. Wipe blok warna datar maksimal 2× per video.
9. **Tipografi hidup**: sentence case bobot 600–700 sebagai default; KAPITAL + 800 hanya untuk satu momen penekanan. Judul pendek **tanpa titik** kecuali disengaja. Ukuran, posisi, dan arah masuk berganti antar shot.
10. **Keluar lebih cepat dari masuk**: masuk 0.6–1.2 dtk (`out-cubic`/`out-back`), keluar 0.3–0.5 dtk (`in-quad`). Simetris terasa mekanis.

Heuristik cepat dari sheet: *bisakah frame ini jadi slide korporat tanpa diubah?* Kalau ya, rombak. *Apakah ada yang bergerak karena kamera, bukan cuma elemen yang menganimasikan dirinya sendiri?* Harus ya di setiap pergantian.

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
