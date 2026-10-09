# Gerak Studio — editor visual

Gerak Studio adalah editor video di browser untuk engine Gerak. Kamu bisa menggambar pakai mouse atau pen tablet, menaruh teks, bentuk, dan foto, lalu menganimasikannya dengan preset atau keyframe. Setelah itu tambahkan musik dan efek suara, lalu render jadi MP4, GIF, atau video transparan. Semuanya tanpa menulis kode.

Studio memakai renderer yang sama dengan CLI. Yang terlihat di kanvas sama persis dengan hasil render. Proyek disimpan sebagai `.gerak.json` biasa, jadi file yang sama bisa dirender dari terminal (`gerak render proyek.gerak.json`) atau direvisi oleh agent lewat kode.

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ Gerak Studio  [Proyek]  Judul video            ↶ ↷  ● Tersimpan  ⚙  [Render] │
├────────────┬──────────────────────────────────────────────┬──────────────────┤
│ Scene      │ opsi alat (kuas, ukuran, warna, …)   ▦ ⬚ ◎  │ Inspector        │
│ Aset       ├──┬───────────────────────────────────────────┤ · elemen (teks,  │
│ Suara      │✎ │                                           │   bentuk, kuas)  │
│            │T │                 kanvas                    │ · posisi & bentuk│
│ kartu      │□ │                                           │ · animasi cepat  │
│ scene      │○ │                                           │ · gerak terus    │
│            │… │                                [− 44% +]  │ · waktu tampil   │
├────────────┴──┴───────────────────────────────────────────┴──────────────────┤
│ ⏮ ◀ ▶ ▶ ⏭  0:01.20 / 0:03.00   [Scene ini|Semua] 🔁 🔊          ⏺ Auto-key │
│ [1. Pembuka        ][⇢ 2. Isi              ][⇢ 3. Penutup    ] +             │
│ layer      │ 0d      0.5d      1d   ◆    1.5d     ◆   2d        2.5d          │
│ Judul  👁 🔒│ ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬◆▬▬▬▬▬▬▬▬▬◆▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬           │
│ Suara      │            [pop]          [whoosh]                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

## Menjalankan

Lokal:

```sh
gerak studio                    # folder kerja default: ~/gerak-studio
gerak studio ~/konten           # atau folder lain
# buka http://127.0.0.1:4400
```

Di VPS (diakses dari laptop/HP):

```sh
gerak studio ~/gerak-studio --host 0.0.0.0 --port 4400 --password rahasia-kamu
# buka http://IP-VPS:4400 → login: user bebas, password = rahasia-kamu
```

Password juga bisa lewat env `GERAK_STUDIO_PASSWORD`. **Jangan buka Studio ke internet tanpa password**: siapa pun yang punya alamatnya bisa mengunggah file dan merender di server kamu.

Pengaman bawaan: tanpa password dan tanpa `--host`, Studio hanya melayani `localhost`. Permintaan yang mengubah data dari situs lain ditolak. File yang dirujuk proyek harus ada di dalam folder kerja. Unggahan dibatasi 300 MB per file.

Biar jalan terus (systemd):

```ini
# /etc/systemd/system/gerak-studio.service
[Unit]
Description=Gerak Studio
After=network.target

[Service]
User=adam
Environment=GERAK_STUDIO_PASSWORD=rahasia-kamu
ExecStart=/usr/bin/env gerak studio /home/adam/gerak-studio --host 127.0.0.1 --port 4400
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

```sh
sudo systemctl enable --now gerak-studio
```

Di belakang Nginx (HTTPS + domain), Studio harus di root domain/subdomain (mis. `studio.domainmu.com`), bukan sub-path:

```nginx
server {
  server_name studio.domainmu.com;
  client_max_body_size 300m;          # upload foto/musik
  location / {
    proxy_pass http://127.0.0.1:4400;
    proxy_set_header Host $host;
    proxy_read_timeout 600s;          # render panjang
  }
}
```

## Folder kerja

```
~/gerak-studio/
├── video-promo.gerak.json      ← proyek (satu file per video)
├── assets/                     ← foto, musik, font yang diunggah + aset dari resep
├── output/                     ← hasil render (video-promo.mp4, video-promo-draft.mp4, …)
├── naskah-agent.mjs            ← script dari agent (bisa dibuka di Studio)
└── .studio/                    ← thumbnail, cadangan versi sebelumnya, tempat sampah, cache audio
```

- Proyek tersimpan **otomatis** sekitar 1 detik setelah perubahan. Status ada di kanan atas. `Ctrl+S` menyimpan saat itu juga.
- Riwayat cadangan ada di `.studio/backup/`: versi tepat sebelum simpanan terakhir, plus satu salinan tiap 5 menit (20 terakhir per proyek). Proyek yang dihapus dipindah ke `.studio/trash/`.
- Path aset di dalam `.gerak.json` relatif terhadap folder kerja. Folder ini bisa dipindah atau di-zip utuh.

## Mulai

Klik **Proyek** di kiri atas:

- **Buat baru**: pilih judul, format (9:16 Reels/TikTok, 4:5 Feed, 1:1, 16:9 YouTube), fps (24 untuk gaya gambar tangan, 30 untuk motion graphic), dan warna latar.
- **Mulai dari resep**: 100 resep + 3 template dari `examples/resep/`. Cari pakai kata kunci (caption, karaoke, grafik, kamera, …). Studio membuat salinan proyek beserta asetnya, jadi resep aslinya tidak berubah.
- **Proyek kamu**: semua `.gerak.json` di folder kerja, plus script `.mjs` yang ada di folder itu (lihat [Kerja bareng agent](#kerja-bareng-agent--kode)).

## Alat

| Alat | Tombol | Cara pakai |
| --- | --- | --- |
| Pilih | `V` | Klik objek untuk memilih. Seret untuk geser, kotak sudut untuk skala, bulatan di atas untuk putar. Shift = lurus / putar per 15°. |
| Kuas | `B` | Gambar langsung. 13 jenis kuas (pulpen, tinta, spidol, stabilo, pensil, arang, kapur, krayon, airbrush, neon, …). Pen tablet memakai tekanan asli; mouse memakai kecepatan (pelan = tebal). |
| Penghapus | `E` | Menghapus coretan di layer gambar yang sedang aktif saja. |
| Teks | `T` | Klik di kanvas lalu ketik. Gaya awal bisa dipilih: judul tebal, caption berkotak, tepi hitam, tulisan tangan, paragraf. Klik teks yang sudah ada untuk mengeditnya. |
| Kotak, Lingkaran, Bintang | `R` `O` `P` | Tarik di kanvas. Shift = sama sisi. Klik saja = ukuran standar. |
| Garis, Panah | `L` `A` | Tarik dari titik awal ke akhir. Shift = kelipatan 45°. |
| Gambar | `I` | Klik di kanvas lalu pilih/unggah foto. Bisa juga seret file dari komputer langsung ke kanvas. |
| Geser kanvas | `H` | Tarik untuk menggeser tampilan. Scroll juga menggeser; `Ctrl` + scroll = zoom; `F` = pas layar. |

Tombol di kanan bar opsi: **grid sepertiga** (`G`), **area aman 9:16** (`S`, menandai area yang ketutup UI TikTok/Reels), **onion skin** (`Shift+O`, lihat frame sebelum/sesudah dengan warna merah/biru).

### Layer dan elemen

- Setiap teks, bentuk, dan gambar baru menjadi **layer sendiri** dengan titik poros di tengah objek, jadi bisa langsung dianimasikan.
- Coretan kuas masuk ke **layer gambar** yang sedang dipilih. Tombol `+` di bar kuas membuat layer gambar baru, misalnya kalau mata dan badan mau bergerak terpisah.
- Klik pertama memilih layer. Klik lagi pada objek di layer yang sama memilih **elemen** di dalamnya (satu coretan, misalnya), lalu geser untuk memindahkan elemen itu saja. `Esc` naik lagi ke layer.
- Proyek dari resep bisa punya **grup**. Klik pertama memilih grup, klik berikutnya masuk ke dalamnya.
- Daftar layer ada di timeline bawah. Ikon mata = sembunyikan (ikut render), gembok = kunci (tidak bisa diklik di kanvas). Seret baris untuk mengubah urutan depan/belakang. Klik dua kali nama untuk mengganti nama.

## Animasi

Semua waktu dihitung per scene: 0 = awal scene.

**1. Animasi cepat.** Pilih objek, lalu di panel kanan klik **Masuk** (Fade, Pop, Zoom, Naik, Turun, Dari kiri/kanan, Jatuh, Blur, Putar, Sapu) atau **Keluar**. Animasi dipasang mulai di playhead dengan durasi yang bisa diatur, lalu langsung diputar sekali sebagai preview.

**2. Keyframe manual.** Di bagian *Posisi & bentuk*, klik ◇ di samping X, Y, Skala, Putar, Opasitas, atau Blur untuk membuat keyframe. Geser playhead, lalu ubah nilainya (ketik, seret label, atau seret objek di kanvas). Keyframe baru dibuat otomatis karena properti itu sudah beranimasi. Tanda ◆ kuning berarti ada keyframe tepat di playhead; ‹ › melompat ke keyframe sebelum/sesudahnya. `K` membuat keyframe posisi, skala, putar, dan opasitas sekaligus.

**Auto-key** (tombol ⏺ di kanan transport): selama aktif, setiap perubahan di kanvas langsung jadi keyframe, juga untuk properti yang belum beranimasi. Ini cara paling cepat untuk "merekam" gerakan: pindah ke detik 1, geser objek; pindah ke detik 2, geser lagi.

**3. Gerak terus-menerus.** Melayang, goyang acak, denyut, putar terus, ayun, getar, kedip. Gerakan ini ditambahkan di atas keyframe dan nilainya bisa diatur.

**Kuas tergambar.** Di bar kuas pilih *Muncul: Tergambar*. Setiap coretan muncul seperti sedang digambar, dan playhead maju sendiri sehingga coretan berikutnya tergambar sesudahnya. Untuk gambar yang sudah jadi: pilih layernya → *Coretan → Tergambar berurutan* untuk membagi waktu ke semua coretan (coretan panjang dapat waktu lebih lama).

**Teks beranimasi.** Pilih teks → *Animasi masuk*: per kata, per huruf, per baris (efek naik/pop/fade/turun/stempel/blur/putar), mesin ketik, acak lalu jadi, hitung angka (dengan awalan "Rp" / akhiran "%"), karaoke. Ada juga *Animasi keluar* dan *Sorot kata* (stabilo, kotak, garis bawah, coret, lingkari, ganti warna).

### Timeline

- **Batang** = waktu layer tampil. Seret ujungnya untuk mengatur kapan layer muncul/hilang. Seret batangnya untuk menggeser **semua** timing layer itu (keyframe, coretan tergambar, animasi teks) maju/mundur.
- **◆** = keyframe. Seret untuk mengubah waktunya. Klik untuk memilihnya; panel kanan lalu menampilkan pilihan *Gerak ke berikutnya* (halus, melambat, memantul, pegas, tahan, …). `Del` menghapus keyframe terpilih.
- Garis putih tipis di bawah batang = coretan/bentuk yang tergambar; segitiga kecil = mulai animasi teks; gelombang kuning = ada gerak terus-menerus.
- Baris **Suara**: klip musik dan SFX scene ini. Seret untuk menggeser waktunya, klik untuk mengatur volume.
- Klik/seret penggaris atau area kosong untuk memindah playhead. Batas atas panel timeline bisa ditarik untuk memperbesar.

## Scene, transisi, kamera

- Panel **Scene** di kiri: tambah, duplikat, pindah urutan, hapus. Strip scene di atas timeline: klik untuk pindah scene, tarik tepi kanannya untuk mengubah durasi.
- Klik area kosong di kanvas untuk membuka pengaturan **scene**: nama, durasi, latar, dan **transisi masuk** (fade, lewat hitam/putih, kilat, geser, dorong, tutup, sapu, lingkaran, zoom, blur). Transisi memakan ujung scene sebelumnya.
- **Kamera** per scene: geser, zoom, putar dengan keyframe, plus preset dorong pelan, tarik mundur, kamera tangan, dan guncang. Layer yang dicentang *Tidak ikut kamera* (caption/HUD) diam saat kamera bergerak.
- **Proyek**: judul, latar, grain kertas, vignette, dan *garis hidup* (line boil) untuk semua coretan.
- Tombol putar: **Scene ini** memutar scene yang sedang diedit; **Semua** memutar seluruh video lengkap dengan transisi.

## Gambar, font, suara

- **Aset**: unggah PNG/JPG/WebP/GIF lalu klik untuk menaruhnya di kanvas. Gambar terpilih bisa diganti sumbernya, diberi sudut bulat, bingkai, dan mode isi (penuh/utuh/tarik).
- **Font**: unggah `.ttf`/`.otf` di tab Aset dan font langsung terdaftar di proyek. Nama keluarga diambil dari nama file (`Poppins-Bold.ttf` → "Poppins", tebal 700). Font bawaan: Plus Jakarta Sans, Caveat, Patrick Hand.
- **Suara**: unggah MP3/WAV/M4A lalu *Pakai* (masuk dari awal video, −14 dB, fade out 1 detik). 29 efek suara sintetis bisa didengar dulu (▶), dan klik namanya untuk menaruhnya di playhead. Klip yang dipilih bisa diatur mulai, volume (dB), potong awal, durasi, fade, dan loop. *Ikatkan ke scene* membuat suara ikut kalau scene dipindah.

## Render

Klik **Render** → pilih format:

| Format | Untuk |
| --- | --- |
| MP4 | video + audio, siap upload |
| GIF | stiker/preview tanpa suara |
| WebM transparan | overlay (latar tembus pandang) |
| MOV transparan | ProRes 4444 untuk Premiere/CapCut/DaVinci |

*Draft cepat* merender setengah resolusi untuk cek. Render berjalan di server dengan worker paralel; progres dan perkiraan sisa waktu tampil di dialog. Hasilnya bisa diputar dan diunduh langsung, dan tersimpan di `output/`.

## Kerja bareng agent / kode

Studio dan kode memakai format yang sama, jadi alurnya bisa bolak-balik:

- **Script → Studio**: taruh script `.mjs` (misalnya buatan agent) di folder kerja. Script itu muncul di *Proyek → Script di folder ini*. *Buka di Studio* menjalankan script dan membuat salinan `.gerak.json` yang bisa diedit visual. Script aslinya tidak diubah.
- **Studio → kode**: proyek Studio adalah `.gerak.json` biasa. Agent bisa membuka dan merevisinya dengan `open('proyek.gerak.json')`, lalu `p.find('judul').key(...)` dan `p.save(...)` (lihat resep 094). ID layer/elemen tampil di panel kanan (abu-abu di bawah nama). Hindari agent menyimpan file yang sama saat Studio sedang membukanya, karena simpanan terakhir yang menang.
- **Render dari terminal**: `gerak render ~/gerak-studio/proyek.gerak.json -o final.mp4` memberi hasil yang sama dengan tombol Render.

## Pintasan keyboard

| Tombol | Fungsi |
| --- | --- |
| `Spasi` | putar / jeda |
| `,` `.` | mundur / maju 1 frame (`Shift` = 10) |
| `Home` `End` | awal / akhir scene |
| `[` `]` | scene sebelumnya / berikutnya |
| `V B E T R O P L A I H` | ganti alat |
| `K` | keyframe posisi/skala/putar/opasitas di playhead |
| `Del` | hapus yang dipilih (layer, elemen, keyframe, suara) |
| `Ctrl+D` | duplikat |
| `Ctrl+C` `Ctrl+V` | salin / tempel layer |
| `Ctrl+]` `Ctrl+[` | ke depan / ke belakang |
| panah | geser objek 1 px (`Shift` = 10); tanpa pilihan: pindah frame |
| `Esc` | naik satu tingkat pilihan / batal pilih |
| `Ctrl+Z` `Ctrl+Shift+Z` | undo / redo |
| `Ctrl+S` | simpan sekarang |
| `F` `+` `-` | pas layar / zoom |
| `G` `S` `Shift+O` | grid / area aman / onion skin |
| `?` | bantuan |

## Batasan

- Satu proyek sebaiknya dibuka di satu tab. Dua tab yang mengedit proyek yang sama saling menimpa saat menyimpan.
- Fitur lanjutan engine yang belum punya kontrol visual (mask, track ganti-gambar, clip, beberapa highlight sekaligus, gradien lebih dari 2 warna) tetap dirender dengan benar dan tetap utuh saat diedit, tapi pengaturannya lewat kode.
- Ukuran dan fps proyek tidak bisa diubah setelah dibuat. Untuk versi format lain, buat proyek baru atau pakai resep 099 (layout multi-format).
- Studio harus dipasang di root domain/subdomain, bukan sub-path.
