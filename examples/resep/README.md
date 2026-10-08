# Resep Gerak — 100 contoh siap pakai

Setiap file berdiri sendiri: cukup `import { ... } from 'gerak'`, tanpa helper tambahan.
Cara pakai buat agent: **cari contoh yang paling mirip dengan brief → salin → ubah teks/warna/timing → `gerak run` → cek sheet → render.**

```sh
gerak preview examples/resep/001-hook-kata-pop.mjs     # lihat live
gerak run     examples/resep/001-hook-kata-pop.mjs     # poster + contact sheet
gerak render  examples/resep/001-hook-kata-pop.mjs     # MP4
```

Cari berdasarkan fitur: `grep -l "karaoke" examples/resep/*.mjs` atau buka `katalog.json`.
Aset contoh ada di `assets/` (dibuat ulang dengan `node examples/resep/assets/buat-aset.mjs`).

## Teks & tipografi kinetik

| No | Contoh | Format | Durasi | Fitur yang didemokan | Pakai untuk |
| --- | --- | --- | --- | --- | --- |
| 001 | [Hook kata per kata (pop)](001-hook-kata-pop.mjs) | 9:16 · 30fps | 3.5s | text anim words + effect pop · highlight marker · layer fixed · camera.push · sfx pop per kata | pembuka video 9:16 — kalimat hook di 3 detik pertama yang menahan scroll |
| 002 | [Mesin ketik di kartu catatan](002-typewriter-catatan.mjs) | 9:16 · 30fps | 7.5s | text anim typewriter (cps + kursor) · rect r + shadow · pop kartu · sfx typing sepanjang ketikan | konten "catatan/insight" yang diketik pelan, video storytelling, thread jadi video |
| 003 | [Scramble huruf "RAHASIA"](003-scramble-rahasia.mjs) | 9:16 · 30fps | 3.5s | text anim scramble · letterSpacing · case upper · scanline bergerak (key y) · glitch sfx | hook misteri/teaser, reveal kata kunci, gaya hacker/tech |
| 004 | [Subtitle karaoke tersinkron per kata](004-karaoke-subtitle.mjs) | 9:16 · 30fps | 4s | text anim karaoke (times per kata, color, dim, scale) · box caption · pulse bergelombang · gradien latar | subtitle voice-over/talking head gaya TikTok — kata yang sedang diucapkan menyala |
| 005 | [Caption bergantian di atas foto](005-captions-di-atas-foto.mjs) | 9:16 · 30fps | 7s | scene.captions (subtitle berurutan) · image fit cover · overlay gradien · camera.push (Ken Burns) | video slideshow/foto + narasi teks, B-roll dengan caption, cerita perjalanan |
| 006 | [Kartu statistik dengan angka berjalan](006-counter-statistik.mjs) | 9:16 · 30fps | 5s | text anim count (prefix Rp, decimals, suffix, separator) · fit lebar · slideIn bertahap · sfx coin | pamer hasil/omzet/pencapaian, laporan bulanan, social proof angka |
| 007 | [Lima gaya highlight kata](007-highlight-5-gaya.mjs) | 9:16 · 30fps | 6.5s | highlight style marker / underline / strike / circle / box / color · anim lines fade · berurutan | menekankan kata kunci di teks edukasi, poin penting, before/after kata |
| 008 | [Harga dicoret → harga promo](008-harga-coret.mjs) | 9:16 · 30fps | 4.5s | highlight strike · anim words stamp · image produk + float · star badge pop + spin · pivot · sfx impact/coin | promo diskon, flash sale, harga spesial produk |
| 009 | [Teks meme bergaris tepi](009-teks-meme-outline.mjs) | 9:16 · 30fps | 4s | text stroke (outline) + shadow · case upper · ilustrasi wajah dari bentuk · camera.shake di punchline · show range | konten humor/relatable, format meme atas-bawah, reaction |
| 010 | [Kartu kutipan dengan tanda kutip kuas](010-kutipan-kuas.mjs) | 9:16 · 24fps | 5.5s | brush stroke reveal (SVG path + pressure) · font Caveat · anim lines fade · line boil · grain kertas | quote harian, kata mutiara, kutipan buku, closing reflektif |
| 011 | [Daftar bernomor muncul satu per satu](011-daftar-bernomor.mjs) | 9:16 · 30fps | 7s | loop data → layer per item · slideIn bertahap · lingkaran nomor · teks wrap maxWidth · sfx pop | listicle "5 cara/5 kebiasaan", poin-poin materi, agenda |
| 012 | [Kata raksasa masuk dengan wipe](012-teks-raksasa-wipe.mjs) | 9:16 · 30fps | 4s | wipeIn arah bergantian (clip yang membesar) · case upper · letterSpacing · box di kata terakhir · camera.shake | kalimat manifesto, pernyataan tegas, opening bertenaga, typography poster |
| 013 | [Frasa bergantian di posisi yang sama (masuk + keluar)](013-teks-masuk-keluar.mjs) | 9:16 · 30fps | 6s | text anim + exit (words) · show range per frasa · jadwal waktu dari array · tick sfx | menyampaikan beberapa kalimat pendek berurutan tanpa ganti scene, lirik, poin cepat |
| 014 | [Teks gradien dengan kilau lewat mask](014-teks-gradien-kilau.mjs) | 9:16 · 30fps | 4s | fill gradien linear pada teks · group mask (kilau hanya di dalam huruf) · skewX · blurIn · letterSpacing | judul premium, nama brand, title card mewah, pengumuman |
| 015 | [Hitung mundur 3-2-1](015-hitung-mundur-321.mjs) | 9:16 · 30fps | 4.5s | show range per angka · pop + zoom per detik · arc draw (lingkaran progres) · stamp "MULAI!" · flash · tick/ding | countdown sebelum reveal, giveaway, mulai live, opening tantangan |

## Brush & gambar tangan

| No | Contoh | Format | Durasi | Fitur yang didemokan | Pakai untuk |
| --- | --- | --- | --- | --- | --- |
| 016 | [Tanda tangan digoreskan + stempel](016-tanda-tangan.mjs) | 9:16 · 30fps | 5s | stroke dari SVG path (brush pen, pressure taper) · reveal lambat · stempel sketch rotasi + pop · sfx scratch | "deal/disetujui", kontrak, sertifikat, closing penjualan, legalitas |
| 017 | [Galeri semua brush](017-galeri-brush.mjs) | 9:16 · 30fps | 6s | 13 preset brush (pen, ink, fineliner, marker, highlighter, brush, dry, pencil, charcoal, chalk, crayon, airbrush, neon) · withPressure · reveal bertahap | referensi memilih brush — lihat karakter tiap kuas sebelum menggambar |
| 018 | [Ilustrasi sketsa rumah (gaya rough)](018-sketsa-rumah.mjs) | 9:16 · 24fps | 6s | shape sketch (garis tangan + arsir hachure / solid) · draw berurutan · boil · font Caveat · polygon | ilustrasi penjelasan sederhana, gaya whiteboard/notebook, konten properti/KPR |
| 019 | [Doodle tangan di sekitar judul](019-doodle-sekitar-teks.mjs) | 9:16 · 24fps | 4.5s | brush ink/marker reveal berurutan · ellipsePoints · wobble · boil · pop judul · sparkle | pengumuman ceria, launching, "save this!", thumbnail hidup |
| 020 | [Whiteboard explainer (alur 3 langkah)](020-whiteboard-explainer.mjs) | 9:16 · 24fps | 8s | kotak & panah digambar marker (stroke titik) · font Patrick Hand · camera.move turun mengikuti alur · boil | video penjelasan alur/proses, funnel bisnis, cara kerja produk, gaya papan tulis |
| 021 | [Papan tulis kapur](021-kapur-papan-tulis.mjs) | 9:16 · 24fps | 7s | brush chalk (tekstur kapur) · bingkai kayu · font Caveat · grafik naik digambar kapur · grain sebagai debu kapur | konten edukasi gaya guru/kelas, rumus, penjelasan konsep sederhana |
| 022 | [Dari sketsa pensil ke ilustrasi berwarna](022-sketsa-pensil.mjs) | 9:16 · 24fps | 7s | brush pencil (garis bantu + arsir) · ellipsePoints · airbrush sebagai cat air · urutan sketsa → tinta → warna | proses menggambar, konten desain/ilustrator, "behind the scenes" produk |
| 023 | [Lingkaran ensō kuas kering + stempel](023-enso-kuas-kering.mjs) | 9:16 · 24fps | 6s | brush dry (serat kering) dengan pressure dinamis · ellipsePoints terbuka · stempel merah pop · grain kertas · font Caveat | konten reflektif/mindset, opening tenang, estetika Jepang/zen |
| 024 | [Papan neon menyala berkedip](024-neon-sign.mjs) | 9:16 · 30fps | 5s | brush neon (glow) · teks dengan shadow glow · blink (kedip) di awal · dinding bata dari rect · tone sebagai dengung | suasana malam/kafe, "OPEN", promo hiburan, estetika retro |
| 025 | [Stabilo di atas dokumen](025-stabilo-dokumen.mjs) | 9:16 · 30fps | 6s | brush highlighter (transparan + multiply) digoreskan di atas teks · kamera zoom ke paragraf · kertas dengan shadow | membedah dokumen/artikel/kontrak, menunjukkan kalimat penting, review bacaan |
| 026 | [Menghapus coretan lalu menulis ulang](026-penghapus.mjs) | 9:16 · 30fps | 6s | layer.erase dengan reveal (penghapus bertahap, hanya menghapus layer itu) · marker · show range · Patrick Hand | "hapus kebiasaan lama", koreksi mitos, before → after kalimat, revisi ide |
| 027 | [Karakter doodle dengan garis "hidup" (line boil)](027-line-boil-karakter.mjs) | 9:16 · 24fps | 5s | boil per elemen (every, variants, amount) · sway + float idle · balon kata sketch · Caveat | maskot sederhana, karakter penjelas, vibe kartun gambar tangan |

## Motion graphic & bentuk

| No | Contoh | Format | Durasi | Fitur yang didemokan | Pakai untuk |
| --- | --- | --- | --- | --- | --- |
| 028 | [Logo reveal (garis tergambar lalu terisi)](028-logo-reveal.mjs) | 1:1 · 30fps | 4s | preset square · shape draw (stroke tergambar, fill memudar) · spinIn · letterSpacing chars rise · flash · riser + impact | intro/outro brand, watermark animasi, pembuka channel |
| 029 | [Progress bar dengan tahapan](029-progress-bar.mjs) | 1:1 · 30fps | 5s | scaleX dengan pivot kiri (bar mengisi) · count persen · label tahap bergantian (show) · ikon centang draw · square | proses loading, "lagi diproses", progres proyek, tahapan onboarding |
| 034 | [Grid ikon muncul acak (square)](034-grid-ikon.mjs) | 1:1 · 30fps | 4.5s | preset square · rng (acak tapi deterministik) untuk urutan · pop stagger · ikon vektor dari path · hover float | daftar fitur aplikasi, isi paket bundling, layanan, kategori produk |
| 035 | [Ledakan confetti perayaan](035-confetti.mjs) | 9:16 · 30fps | 5s | partikel dari rng (deterministik) · key berantai naik (out-quad) lalu jatuh (in-quad) · spin per partikel · stamp teks · clap/success | milestone tercapai, pesanan ke-1000, ulang tahun, pengumuman pemenang giveaway |
| 036 | [Latar blob blur + kartu kaca (glassmorphism)](036-blob-aesthetic.mjs) | 9:16 · 30fps | 6s | layer blur (channel blur) · float/wiggle lambat · kartu transparan + stroke · blurIn teks · pad ambient | latar estetik untuk quote/pengumuman, intro kalem, template konten "soft" |
| 037 | [Orbit planet (group bersarang berputar)](037-orbit-planet.mjs) | 9:16 · 30fps | 6s | spin pada group (anak ikut berputar) · group bersarang (bulan mengorbit planet) · blink bintang · radial glow · dash orbit | ekosistem produk, "semua terhubung", penjelasan hub & integrasi, intro sci-fi |
| 039 | [Kursor mengklik tombol CTA](039-tombol-cta-klik.mjs) | 9:16 · 30fps | 4.5s | kursor path bergerak (move) · tekan tombol (key scale) · riak lingkaran membesar & memudar · ganti label via show · click/success | tutorial "klik di sini", ajakan daftar, demo UI, CTA link di bio |
| 059 | [Hujan deras + petir](059-hujan-petir.mjs) | 9:16 · 30fps | 5s | lembar hujan berpola dari rng digerakkan linear (loop tanpa sambungan) · kilat petir (opacity hold) · awan float · payung siluet | suasana sedih/sulit, "badai pasti berlalu", latar dramatis, cuaca |
| 072 | [Stiker badge "BARU!" yang loop mulus (GIF)](072-stiker-loop-gif.mjs) | 1:1 · 30fps | 2s | ukuran kustom 600×600 · loop mulus: semua periode membagi durasi (2 detik) · spin 180°/s · pulse · sway · render GIF | stiker/badge animasi untuk story, website, katalog, chat; elemen loop berulang · render: `gerak render examples/resep/072-stiker-loop-gif.mjs -o stiker.gif --gif-width 400` |

## Data, grafik & infografis

| No | Contoh | Format | Durasi | Fitur yang didemokan | Pakai untuk |
| --- | --- | --- | --- | --- | --- |
| 030 | [Grafik batang tumbuh](030-grafik-batang.mjs) | 9:16 · 30fps | 6s | batang scaleY berporos di dasar · nilai count di atas batang · data array → layer · panah + label lonjakan · stagger | pertumbuhan omzet/followers, perbandingan bulanan, laporan data |
| 031 | [Grafik garis tergambar (16:9)](031-grafik-garis.mjs) | 16:9 · 30fps | 6s | preset youtube 16:9 · polygon smooth closed:false dengan draw · area gradien fadeIn · titik pop bertahap · grid | tren data di video YouTube/presentasi, pertumbuhan, harga naik turun |
| 032 | [Tiga donut persentase](032-donut-persen.mjs) | 9:16 · 30fps | 5s | arc draw sebagai progres (start -90°) · count persen di tengah · loop data · lineCap round | survei, tingkat penyelesaian, skill bar, komposisi/proporsi |
| 077 | [Infografis pictogram "7 dari 10"](077-infografis-pictogram.mjs) | 9:16 · 30fps | 6s | ikon orang dari bentuk diulang dalam grid · ikon terisi muncul bertahap (stagger) · count angka besar · sumber data kecil | statistik survei, proporsi populasi, fakta angka yang mudah dicerna |

## Kamera & komposisi

| No | Contoh | Format | Durasi | Fitur yang didemokan | Pakai untuk |
| --- | --- | --- | --- | --- | --- |
| 040 | [Ken Burns dua potongan foto + judul lokasi](040-ken-burns-foto.mjs) | 9:16 · 30fps | 7.4s | image fit cover + focus berbeda · camera.key zoom & pan · crossfade antar scene · ikon pin path · vignette | slideshow foto produk/lokasi, travel, properti, dokumentasi acara |
| 041 | [Parallax multiplane (depth)](041-parallax-pemandangan.mjs) | 9:16 · 30fps | 6s | depth per layer root (jauh > 1 bergerak lambat, dekat < 1 bergerak cepat) · camera pan x · layer lebih lebar dari layar · fixed teks | kesan kedalaman/sinematik dari gambar datar, opening dramatis, scene perjalanan |
| 042 | [Kamera zoom ke detail UI satu per satu](042-zoom-ke-detail.mjs) | 9:16 · 30fps | 9s | rumus kamera memusatkan titik (x = px − W/2, y = py − H/2) · zoom bertahap · caption fixed bergantian (show) · mockup aplikasi dari bentuk | demo fitur aplikasi/dashboard, menunjuk bagian penting layar, review produk digital |
| 043 | [Hantaman teks + guncangan kamera](043-impact-shake.mjs) | 9:16 · 30fps | 3.5s | key scale besar → normal (slam) · camera.shake decay · sinar sunburst (polygon berulang) spin · flash · boom/impact | angka hasil besar, momen klimaks, "plot reveal", konten hype |
| 044 | [Gaya dokumenter: kamera handheld + REC + lower third](044-handheld-dokumenter.mjs) | 9:16 · 30fps | 6s | camera.handheld (goyang tangan) · grain animasi · titik REC blink · timecode count · lower third slideIn/slideOut | konten "behind the scene", testimoni gaya dokumenter, vlog bisnis, liputan |
| 045 | [Pan panorama kota malam (16:9)](045-pan-panorama.mjs) | 16:9 · 30fps | 8s | dunia 3× lebar layar · camera pan x dengan ease · gedung dari rng · jendela berkedip (blink beda periode) · bulan glow | establishing shot, latar kota, transisi tempat, intro channel bertema urban |
| 046 | [Plot twist: kamera miring (dutch angle) + tint merah](046-dutch-angle-plot-twist.mjs) | 9:16 · 30fps | 6s | camera rotation (derajat) + zoom · overlay warna dengan blend multiply · teks shake · heartbeat sfx · 2 scene cut | twist cerita, "tapi ternyata…", ketegangan, konten storytelling dramatis |
| 047 | [Split screen atas-bawah: manual vs otomatis](047-split-screen.mjs) | 9:16 · 30fps | 6s | group dengan clip rect (isi tidak bocor ke panel lain) · konten beranimasi di tiap panel · garis pembagi draw · count jam | perbandingan before/after berdampingan, A vs B, cara lama vs cara baru |

## Transisi

| No | Contoh | Format | Durasi | Fitur yang didemokan | Pakai untuk |
| --- | --- | --- | --- | --- | --- |
| 048 | [Galeri semua transisi](048-galeri-transisi.mjs) | 9:16 · 30fps | 12s | 12 scene, tiap scene masuk dengan transisi berbeda (fade, dip, flash, wipe, slide, push, cover, iris, zoom, blur) + potongan kode-nya | referensi memilih transisi; salin spesifikasi { type, duration } yang tertulis di layar |
| 049 | [Transisi iris dari titik tertentu](049-iris-dari-titik.mjs) | 9:16 · 30fps | 4.9s | transition iris dengan at:[x,y] (lingkaran membesar dari tombol) · pulse tombol · ripple · scene kedua dengan isi baru | "klik untuk membuka", masuk ke detail, transisi dari ikon/logo/avatar |
| 050 | [Carousel 3 varian produk (satu gambar, filter warna)](050-carousel-produk.mjs) | 9:16 · 30fps | 6.7s | transition push-left berantai · filter hue-rotate pada layer (varian warna dari 1 aset) · indikator titik · fungsi pembuat scene | katalog varian rasa/warna, slide produk, "swipe untuk lihat", menu |
| 051 | [Kartu bab dengan dip ke hitam + letterbox](051-chapter-dip-hitam.mjs) | 9:16 · 24fps | 7.5s | transition dip (color) · letterbox sinematik (fixed rect) · fungsi pembuat scene · typewriter judul bab · lines blur | video panjang dengan bab, cerita bersambung, mini-dokumenter, materi kursus |
| 052 | [Efek glitch RGB split](052-glitch-rgb.mjs) | 9:16 · 30fps | 4.8s | salinan teks merah/cyan dengan blend screen · shake dengan jendela waktu (from/to) · garis distorsi blink · flash · glitch sfx | transisi gaya digital/tech, "versi baru", reveal produk tech, error → solved |
| 053 | [Slider sebelum / sesudah](053-sebelum-sesudah-slider.mjs) | 9:16 · 30fps | 6s | group mask dengan layer mask yang dianimasikan (scaleX berporos kiri) · filter grayscale/blur untuk "sebelum" · garis slider ikut bergerak | before-after foto/edit/desain, hasil filter, perbandingan kualitas, renovasi |

## Animasi karakter & substitusi gambar

| No | Contoh | Format | Durasi | Fitur yang didemokan | Pakai untuk |
| --- | --- | --- | --- | --- | --- |
| 054 | [Karakter berkedip & melirik](054-kedip-mata.mjs) | 9:16 · 24fps | 5s | track + drawing (mata buka / tutup) · sequence dengan handle drawing · pupil dianimasikan key x (melirik) · pulse napas | maskot hidup, avatar penjelas, reaksi karakter, konten anak/edukasi |
| 055 | [Mulut bicara sinkron dengan subtitle (lip-flap)](055-mulut-bicara.mjs) | 9:16 · 24fps | 4.5s | track mulut 4 bentuk (tutup/A/E/O) · data viseme [waktu, bentuk] → expose · karaoke subtitle · alis naik turun | karakter narator, maskot yang "ngomong", animasi edukasi dengan dialog |
| 056 | [Walk cycle tokoh garis (4 pose)](056-jalan-cycle.mjs) | 9:16 · 24fps | 5s | fungsi pose dari sudut sendi · track.cycle tiap 3 frame · group bergerak menyeberang layar · bob naik-turun · tanah bergaris | karakter berjalan/berangkat, "perjalanan", transisi naratif, animasi penjelas |
| 057 | [Bola memantul dengan squash & stretch](057-bola-memantul.mjs) | 9:16 · 30fps | 5s | prinsip animasi (ease out-quad naik, in-quad turun) · squash/stretch scaleX/scaleY di titik tumbukan · bayangan mengikuti tinggi · spin | belajar timing animasi, ikon/logo memantul, transisi playful, maskot bola |
| 058 | [Bendera berkibar (siklus 4 gambar)](058-bendera-berkibar.mjs) | 9:16 · 24fps | 4s | fungsi pembuat path gelombang (fase berbeda) · track.cycle tiap 4 frame · tiang & tali · Caveat | konten hari besar/kemerdekaan, animasi loop sederhana, simbol semangat |
| 060 | [Api unggun (siklus api + percikan)](060-api-unggun.mjs) | 9:16 · 24fps | 5s | track 3 bentuk api cycle tiap 3 frame · percikan naik & pudar (key berulang) · glow radial pulse · boil · bintang blink | suasana hangat/cerita malam, "semangat menyala", latar storytelling |
| 061 | [Kucing tidur bernapas + "Zzz" melayang](061-kucing-tidur.mjs) | 9:16 · 24fps | 6s | napas = pulse scaleY dengan origin di dasar badan · huruf Z naik-memudar berulang (key loop) · jendela + bulan · Caveat | "bisnis jalan saat tidur", konten santai/istirahat, maskot lucu, malam hari |

## Format konten sosmed

| No | Contoh | Format | Durasi | Fitur yang didemokan | Pakai untuk |
| --- | --- | --- | --- | --- | --- |
| 038 | [Hitung mundur launching (hari:jam:menit:detik)](038-hitung-mundur-launching.mjs) | 1:1 · 30fps | 5s | count mundur (from > to, ease linear) · kotak angka · pulse detik · preset square · tick tiap detik | teaser launching produk, countdown promo 10.10, pre-order, webinar |
| 062 | [Konten tips 3 poin (hook + 3 tips + CTA)](062-tips-3-poin.mjs) | 9:16 · 30fps | 14.1s | struktur konten lengkap · fungsi scene tip(data) · bar progres per segmen di atas · push transition · ikon nomor besar · beat | format konten edukasi paling umum di TikTok/Reels: "3 tips …" |
| 063 | [Format masalah → solusi](063-masalah-solusi.mjs) | 9:16 · 30fps | 6.1s | dua scene kontras (merah/teal) · tanda X dan centang digambar (draw) · shake di masalah · wipe-up transisi · sfx error/success | konten problem-solution, iklan produk, "kesalahan umum → cara benar" |
| 064 | [Perbandingan angka sebelum vs sesudah (2 kolom)](064-umkm-sebelum-sesudah.mjs) | 9:16 · 30fps | 6s | tabel 2 kolom dari data · count di kedua kolom · panah naik muncul · kolom "sesudah" disorot · fit lebar teks | studi kasus klien, hasil program/kelas, before-after bisnis dengan angka |
| 065 | [Template kartu testimoni (isi dengan testimoni ASLI)](065-testimoni-template.mjs) | 9:16 · 30fps | 6s | image avatar radius bulat · bintang pop berurutan · teks kutipan typewriter · konstanta data di atas file untuk diganti | social proof — WAJIB pakai kutipan, nama, dan izin dari pelanggan sungguhan |
| 066 | [Flash sale energik (3 scene cepat)](066-flash-sale.mjs) | 9:16 · 30fps | 7.6s | garis diagonal berjalan (linear x) · stamp + shake · count mundur timer · harga coret · flash transition · beat cepat | promo kilat, harbolnas 10.10/11.11/12.12, diskon terbatas, launching promo |
| 067 | [Pengumuman event (format feed 4:5)](067-pengumuman-event.mjs) | 4:5 · 30fps | 6s | preset feed 1080×1350 · ikon kalender/jam/pin dari bentuk · baris info slideIn bertahap · CTA berdenyut · dekor lingkaran | webinar, kelas online, kopdar, workshop, launching offline |
| 068 | [Quote harian (square 1:1)](068-quote-harian-square.mjs) | 1:1 · 30fps | 5s | preset square · gradien diagonal · words blur bertahap · garis kuas di bawah kata kunci · handle akun di pojok · vignette | quote/motivasi harian untuk feed IG/Threads/FB, konten rutin harian dari template |
| 069 | [Carousel 4 slide jadi video (4:5)](069-carousel-ig-4x5.mjs) | 4:5 · 30fps | 10.8s | preset feed · array slide → scene · indikator "1/4" + titik · ajakan "geser →" berayun · slide-left transition | ubah carousel IG/LinkedIn jadi video, edukasi berurutan, poin-poin per halaman |
| 070 | [Intro channel YouTube (16:9, 4 detik)](070-youtube-intro.mjs) | 16:9 · 30fps | 4s | preset youtube · pita miring menyapu layar (key x berantai) · logo pop + spin cincin · nama chars rise · riser → impact → chime | intro/outro channel, opening video tutorial, bumper brand |
| 071 | [Lower third dengan latar transparan (overlay)](071-lower-third-transparan.mjs) | 16:9 · 30fps | 5s | background 'transparent' · render --transparent ke .webm/.mov (alpha) · wipeIn per bar + wipeOut di group · 16:9 | overlay nama narasumber/judul untuk ditumpuk di editor video (CapCut, Premiere, DaVinci) · render: `gerak render examples/resep/071-lower-third-transparan.mjs --transparent -o lower-third.webm` |
| 073 | [Polling ala story (bar persen terisi)](073-polling-story.mjs) | 9:16 · 30fps | 5s | kartu sticker · bar terisi scaleX berporos kiri · count persen · pilihan terpilih disorot + centang · tap kursor | hasil polling/vote, riset audiens, "kalian pilih mana?", engagement story |
| 074 | [Postingan teks jadi video (kartu post generik)](074-postingan-jadi-video.mjs) | 9:16 · 30fps | 7s | kartu post (avatar, nama, waktu) · teks diketik · counter suka/komentar/bagikan naik · ikon hati pop + pulse | repurpose tulisan/thread jadi video, "postingan viral", quote dari akun sendiri |

## Edukasi & penjelasan

| No | Contoh | Format | Durasi | Fitur yang didemokan | Pakai untuk |
| --- | --- | --- | --- | --- | --- |
| 033 | [Roadmap horizontal dengan kamera pan](033-roadmap-timeline.mjs) | 16:9 · 30fps | 9s | dunia lebih lebar dari layar · camera.key x (pan) · milestone pop saat kamera sampai · garis draw · 16:9 | roadmap produk, perjalanan bisnis, rencana kuartal, sejarah singkat |
| 075 | [Resep minuman: bahan + langkah](075-resep-masakan.mjs) | 9:16 · 30fps | 10.53s | scene bahan (daftar dengan centang draw) → scene langkah (kartu bernomor) · image produk · transisi cover-up · tick sfx | resep masakan/minuman, tutorial DIY, daftar alat & bahan, cara pakai produk |
| 076 | [FAQ gaya chat (tanya → titik mengetik → jawab)](076-faq-chat.mjs) | 9:16 · 30fps | 9s | bubble kiri/kanan · indikator mengetik (3 titik float dengan phase) · show range · loop data pertanyaan → posisi otomatis | FAQ produk, jawab pertanyaan pembeli, simulasi customer service/chatbot |
| 078 | [Tabel perbandingan fitur (✓ / ✗ digambar)](078-tabel-perbandingan.mjs) | 9:16 · 30fps | 7s | grid baris × kolom dari data · ikon centang/silang dengan draw bertahap · kolom unggulan disorot · zebra baris | membandingkan paket/harga/produk/tools, "kenapa pilih kami", A vs B fitur |
| 079 | [Tutorial 5 langkah dengan kamera scroll vertikal](079-tutorial-langkah-scroll.mjs) | 9:16 · 30fps | 10s | konten lebih tinggi dari layar · camera.key y mengikuti langkah aktif · garis penghubung draw · langkah aktif disorot (pulse) | tutorial step-by-step panjang, cara setting aplikasi, alur pendaftaran, SOP |
| 080 | [Flowchart keputusan (ya / tidak)](080-flowchart-keputusan.mjs) | 9:16 · 30fps | 7s | belah ketupat (polygon) untuk keputusan · panah bercabang (path draw) · label Ya/Tidak · node muncul berurutan · fungsi pembuat node | alur kerja/SOP, decision tree, logika chatbot, "kalau begini → lakukan itu" |
| 081 | [Kuis pilihan ganda dengan timer](081-kuis-pilihan-ganda.mjs) | 9:16 · 30fps | 8s | bar timer menyusut (scaleX 1→0) · 4 opsi dari data · reveal jawaban: opsi benar hijau + centang, opsi lain meredup (show range) · tick/ding | kuis interaktif, tebak-tebakan, materi belajar, engagement "jawab di komen" |
| 082 | [Timeline vertikal zig-zag](082-timeline-vertikal.mjs) | 9:16 · 30fps | 8s | garis tengah tumbuh (scaleY dari atas) · kartu kiri/kanan bergantian (slideIn dari sisi) · titik tahun pop · data array | perjalanan bisnis/karier, sejarah produk, milestone tahunan, "dari 0 sampai sekarang" |
| 083 | [Penjelasan rumus (Pythagoras 3-4-5)](083-rumus-pythagoras.mjs) | 9:16 · 30fps | 8s | segitiga polygon draw · label sisi pop · kotak siku-siku · rumus chars rise · contoh angka count · highlight circle | konten belajar matematika/fisika, menjelaskan rumus dengan gambar, edukasi singkat |
| 084 | [Checklist dicentang satu per satu + progres](084-checklist.mjs) | 9:16 · 30fps | 7s | kotak + centang draw · teks dicoret setelah centang (highlight strike) · counter "x/5 selesai" · bar progres per langkah | to-do harian, checklist persiapan launching, SOP, daftar kebiasaan |

## Audio & musik

| No | Contoh | Format | Durasi | Fitur yang didemokan | Pakai untuk |
| --- | --- | --- | --- | --- | --- |
| 085 | [Visual sinkron dengan ketukan (BPM)](085-sinkron-beat.mjs) | 9:16 · 30fps | 8s | rumus frame per ketuk = fps × 60 / BPM · key scale di setiap ketuk · latar ganti warna per bar · kata muncul tepat di ketuk · sfx beat | video musik/lirik, montage berirama, iklan energik, transisi on-beat |
| 086 | [Musik dari file + equalizer bergoyang](086-musik-dari-file.mjs) | 9:16 · 30fps | 7s | p.audio(file, {volume dB, trim, fadeIn, fadeOut}) · equalizer dari rng per ketuk (deterministik) · pulse sesuai BPM · judul lagu | video dengan backsound sendiri, podcast/audiogram, preview musik, konten dengan lagu bebas royalti · render: `gerak render examples/resep/086-musik-dari-file.mjs -o musik.mp4` |
| 087 | [Galeri semua SFX sintetis (dengar & lihat namanya)](087-galeri-sfx.mjs) | 9:16 · 30fps | 20.6s | SFX_TYPES (daftar semua efek) · grid label · kotak menyala tepat saat suaranya diputar · parameter dur untuk efek panjang | referensi memilih efek suara — render jadi MP4, tonton, catat nama efek yang cocok |
| 088 | [Subtitle dari teks SRT](088-subtitle-dari-srt.mjs) | 9:16 · 30fps | 7.5s | parser SRT kecil (bisa dipakai ulang) · hasil → scene.captions · durasi scene ikut subtitle terakhir · gaya caption box | memasang subtitle dari file .srt (hasil transkrip Whisper/CapCut/YouTube) ke video Gerak |
| 089 | [Visualizer radial di sekitar foto (audiogram)](089-visualizer-radial.mjs) | 9:16 · 30fps | 7s | 48 batang melingkar (rotation per layer) · scaleY per ketuk dari rng · foto bulat berdenyut di ketuk · p.audio musik | audiogram podcast, potongan siaran/VO, preview musik dengan foto profil |

## Teknik lanjutan

| No | Contoh | Format | Durasi | Fitur yang didemokan | Pakai untuk |
| --- | --- | --- | --- | --- | --- |
| 090 | [Foto di dalam huruf (mask teks)](090-mask-teks-foto.mjs) | 9:16 · 30fps | 5s | group.mask = layer teks (foto hanya terlihat di dalam huruf) · foto bergerak di dalam mask · outline teks di atasnya · zoomIn | title card travel/produk, judul dengan tekstur foto, poster tipografi |
| 091 | [Blend mode: screen vs multiply](091-blend-mode.mjs) | 9:16 · 30fps | 6s | opsi layer blend ('screen', 'multiply', 'overlay', 'difference'…) · lingkaran RGB bergerak (float beda fase) · dua panel perbandingan | efek cahaya (screen), bayangan/tinta (multiply), tekstur & overlay warna, gaya poster |
| 092 | [Percakapan chat dengan auto-scroll](092-scroll-chat.mjs) | 9:16 · 30fps | 9s | pola clip + scroll: clip di group induk yang DIAM, isi di group anak yang DIGESER (key y) · tinggi bubble dihitung · bubble pop berurutan | simulasi chat WhatsApp/DM, demo chatbot, cerita lewat percakapan, testimoni chat (pakai yang asli) |
| 093 | [Font kustom + font bawaan](093-font-kustom.mjs) | 9:16 · 30fps | 6s | p.font(path, {family, weight}) mendaftarkan file .ttf/.otf (path relatif ke file script) · weight 400–800 · italic · letterSpacing | memakai font brand sendiri, membandingkan font, memastikan render sama di VPS & preview |
| 094 | [Revisi project tersimpan (save → open → edit by ID)](094-revisi-project.mjs) | 9:16 · 30fps | 4.6s | p.save() ke .gerak.json · open() · p.find(id) → layer/elemen · edit elemen (patch) · tambah key · ubah durasi & urutan scene · info() | alur revisi agent: render dulu, cek, lalu ubah HANYA bagian yang perlu tanpa menulis ulang semuanya |
| 095 | [Video dari data JSON (satu scene per item)](095-data-dari-json.mjs) | 9:16 · 30fps | 9.8s | baca file JSON dengan readFileSync + import.meta.url · loop data → scene · format Rupiah via count · filter varian · ranking | video katalog otomatis, laporan produk terlaris, konten massal dari spreadsheet/database (ekspor ke JSON) |
| 096 | [Komponen & template lewat fungsi](096-template-fungsi.mjs) | 9:16 · 30fps | 11.33s | fungsi komponen (judul, badge, kartuPoin) dipakai ulang · fungsi scene(p, opsi) · konfigurasi di satu array · gaya konsisten | bikin "design system" video sendiri: sekali tulis komponen, puluhan video tinggal ganti data |
| 097 | [Seni generatif dari seed](097-generatif-seed.mjs) | 9:16 · 30fps | 6s | rng(seed) → bentuk/warna/rotasi acak tapi identik tiap render · reveal berdasarkan jarak dari pusat · spin halus per tile · ganti SEED = karya baru | latar abstrak unik, cover/thumbnail generatif, pola brand, konten "art of the day" |
| 098 | [Banyak varian dari satu script (variabel lingkungan)](098-varian-env.mjs) | 9:16 · 30fps | 3.5s | process.env untuk memilih varian (teks, warna, preset) · satu file → banyak MP4 · loop bash untuk render massal | A/B test hook, versi per produk/kota, konten massal, varian bahasa · render: `for v in 1 2 3; do VARIAN=$v gerak render examples/resep/098-varian-env.mjs -o varian-$v.mp4; done` |
| 099 | [Satu desain untuk 9:16, 1:1, dan 16:9 (layout responsif)](099-multi-format.mjs) | 9:16 · 30fps | 4s | FORMAT dari env · posisi & ukuran relatif (persen W/H, satuan U = sisi terpendek) · tata letak kolom vs baris otomatis | satu konten untuk Reels + feed + YouTube sekaligus tanpa menulis 3 script · render: `for f in reels square youtube; do FORMAT=$f gerak render examples/resep/099-multi-format.mjs -o promo-$f.mp4; done` |
| 100 | [Showcase lengkap (gabungan banyak teknik dalam 1 video)](100-showcase-lengkap.mjs) | 9:16 · 30fps | 14.8s | hook kinetik + scramble · brush reveal · grafik naik · parallax kamera · mask foto · counter · confetti · outro brand · 6 transisi · SFX + musik | contoh struktur video utuh ±16 detik — salin kerangkanya lalu ganti isi tiap scene |

