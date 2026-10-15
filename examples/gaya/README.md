# Gaya — 11 referensi desain

Folder `resep/` mengajarkan **teknik** (cara pakai fitur). Folder ini mengajarkan **gaya**: tiap file adalah video 9:16 yang sudah jadi, dengan arah visual yang jelas dan berbeda satu sama lain.

Kalau bikin video baru: ambil teknik dari `resep/`, ambil standar & arah visual dari sini. **Jangan salin warnanya mentah-mentah.** Pilih satu gaya yang cocok dengan brand/brief, lalu sesuaikan palet, font, dan isinya.

```sh
gerak render examples/gaya/01-struk-kasir.mjs
gerak sheet  examples/gaya/01-struk-kasir.mjs --every 15
```

| No | Gaya | Durasi · BPM | Font | Ciri khas | Cocok untuk |
| --- | --- | --- | --- | --- | --- |
| 01 | [Struk kasir](01-struk-kasir.mjs) | 13s · 100 | Space Mono | struk naik dari printer per baris, coretan pulpen merah, stempel LUNAS | jualan langsung tanpa komisi, rekap pesanan, F&B |
| 02 | [Swiss poster](02-swiss-poster.mjs) | 19s · 120 | Archivo Black | grid tegas, angka raksasa bleed, satu merah, layout berganti tiap scene | listicle "3 aturan", edukasi tegas |
| 03 | [Risograph](03-risograph.mjs) | 12s · 120 | Anton | 2 tinta multiply yang meleset & bergetar, halftone | open PO, launching, drop merch |
| 04 | [Editorial serif](04-editorial-serif.mjs) | 18s · 75 | Instrument Serif | foto di bingkai lengkung (clip), serif italic, garis tipis, ritme lambat | brand story, produk premium/handmade |
| 05 | [Blueprint](05-blueprint.mjs) | 13s · 100 | Space Mono | gambar teknik tergambar, kamera menelusuri diagram tinggi, paket bergerak | "cara kerja" sistem, SOP, alur |
| 06 | [Bauhaus](06-bauhaus.mjs) | 12s · 120 | Plus Jakarta 800 | bentuk dasar primer, komposisi runtuh, mesin 2×2 berputar per ketuk | manifesto, before/after, mindset |
| 07 | [Buku tulis](07-buku-tulis.mjs) | 14s · 90 | Patrick Hand + Caveat | tulisan tangan pas di garis, lingkar pulpen, stabilo, sticky note | tutorial hitungan (HPP, margin) |
| 08 | [Retro 70-an](08-retro-70an.mjs) | 14s · 100 | Shrikhand | sunburst, pelangi tebal tergambar, bayangan bertumpuk, lencana gerigi | grand opening, event, promo musiman |
| 09 | [Kolase tempel](09-kolase-tempel.mjs) | 10s · 120 | campur 5 font | huruf guntingan, selotip, kertas sobek, polaroid, stiker | flash sale, giveaway, promo heboh |
| 10 | [Data signal](10-data-signal.mjs) | 13s · 120 | Space Mono + Instrument Serif | satu angka raksasa, grafik satu goresan, anotasi serif | insight angka, edukasi berbasis data |
| 11 | [Satu dunia: perjalanan pesanan](11-satu-dunia-pesanan.mjs) | 14s · 100 | Plus Jakarta | **satu scene**, subjek kardus bermata yang bertahan dari awal–akhir, kamera ganti ukuran shot (close-up → medium → wide), parallax, rute tergambar di akhir | "cara kerja" dengan cerita, explainer, promo layanan |

Font tambahan ada di `fonts/` (semua OFL, lisensi di sebelahnya). Daftarkan dengan `p.font('fonts/…ttf', { family })`.

Data di contoh (harga, kuota, grafik) adalah **ilustrasi**. Ganti dengan data asli sebelum dipakai.

## Standar yang dipegang semua file di sini

1. **Satu arah visual yang dipilih dengan sadar**: palet 2–4 warna, maksimal 2 keluarga font, satu "benda" khas (struk, poster, cetakan riso, buku…).
2. **Layar terisi**: teks utama ≥ 150px, teks pendukung ≥ 48px. Tidak ada setengah layar kosong tanpa alasan.
3. **Ritme**: BPM ditentukan di awal, `K = fps * 60 / BPM`, semua kemunculan penting jatuh di kelipatan `K` (atau `K/2`), SFX di momen yang sama.
4. **Fitur khas Gerak dipakai sebagai bagian cerita**, bukan hiasan: coretan kuas/pulpen, `draw` garis, mask/clip, kamera.
5. **Lolos uji anti-slide** di `skill/SKILL.md`. Catatan jujur: 01–10 masih banyak yang berganti scene ala slide; **11 adalah contoh arah yang dituju** (satu dunia, subjek bertahan, kamera ganti ukuran shot). Bandingkan 05 vs 11: isinya sama, rasanya beda.
6. **Dicek sebelum render**: `gerak sheet` dilihat, tidak ada teks terpotong/bertumpuk, audio tidak terlalu pelan (cek `volumedetect`, rata-rata ≈ −27…−32 dB).
