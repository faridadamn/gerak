# Gerak

**Gambar lewat kode. Animasikan. Render jadi video.**

Gerak adalah engine video *code-first* untuk Node.js. Lu (atau coding agent lu) nulis script JavaScript/TypeScript, Gerak menggambar tiap frame — coretan kuas ber-tekanan, bentuk vektor, teks beranimasi, gambar — lalu merender jadi MP4/WebM/MOV/GIF lengkap dengan audio.

Konsepnya terinspirasi dari [Codeboard](https://github.com/nonomnonom/codeboard) (gambar lewat kode, layer bisa direvisi, render jadi film). Kodenya ditulis dari nol dan diarahkan buat konten: preset 9:16, animasi teks ala caption TikTok, SFX sintetis bebas hak cipta, dan live preview di browser.

```
script.mjs ──► project (.gerak.json) ──► preview browser (live reload)
                                     └──► render: MP4 · WebM/MOV transparan · GIF · PNG · contact sheet
```

## Isi

- **Brush engine** — `pen`, `ink`, `fineliner`, `marker`, `highlighter`, `brush`, `dry`, `pencil`, `charcoal`, `chalk`, `crayon`, `airbrush`, `neon`. Tekanan, taper, wobble tangan, tergambar pelan-pelan (`reveal`), penghapus.
- **Vektor** — rect, circle, ellipse, line, arrow, polygon, star, arc, SVG path apa saja; gradien; draw-on; mode **sketch** (garis tangan + arsir ala rough.js).
- **Teks** — wrap, align, outline, shadow, kotak caption, highlight (marker/underline/strike/circle/box), animasi `typewriter`, `chars`, `words`, `lines`, `scramble`, `count` (format Rupiah), `karaoke`.
- **Animasi** — keyframe per channel (x, y, rotation, scale, opacity, blur, skew, pivot, depth) + 40-an easing (termasuk spring & cubic-bezier), preset (`fadeIn`, `slideIn`, `pop`, `dropIn`, `wipeIn`, …), behavior prosedural (`wiggle`, `float`, `spin`, `pulse`, `shake`, `sway`, `blink`).
- **Ala animasi tangan** — *drawing substitution* (track + `cycle` buat walk cycle/ngetik), **line boil** (garis "hidup"), onion skin, grain kertas.
- **Kamera** — pan/zoom/rotate per scene, parallax multiplane (`depth`), shake, handheld, push-in.
- **Transisi** — fade, dip, flash, wipe, slide/push, cover, iris, zoom, blur.
- **Audio** — file audio (trim, gain dB, fade, loop) + 29 SFX sintetis (pop, whoosh, riser, ding, typing, notify, coin, impact, beat, pad, …). Di-mix FFmpeg.
- **Review** — frame tunggal, contact sheet dengan catatan storyboard, onion skin, `info` (pohon layer + ID buat revisi terarah).
- **Render cepat** — worker paralel otomatis, cache bitmap untuk coretan yang sudah selesai.
- **Deterministik** — render ulang = piksel identik.

## Install (VPS / Linux / macOS)

Butuh **Node.js 22.6+** dan **FFmpeg**.

```sh
sudo apt install ffmpeg            # kalau belum ada
cd gerak
npm install                        # cuma 1 dependency: @napi-rs/canvas (prebuilt, tanpa compile)
npm link                           # biar perintah `gerak` bisa dipakai di mana saja
gerak doctor                       # cek semuanya hijau
```

## Mulai dalam 1 menit

```sh
mkdir konten && cd konten
gerak init video.mjs --template basic      # template: basic | story | promo
gerak preview video.mjs --host 0.0.0.0     # buka http://IP-VPS:4300, edit file → auto reload
gerak render video.mjs                     # → output/video.mp4
```

Script minimal:

```js
import { project } from 'gerak';

const p = project({ title: 'Halo', preset: 'reels', fps: 30, background: '#f4efe6' });

const s = p.scene('Pembuka', { duration: '3s' });
const judul = s.layer('Judul', { x: 540, y: 900 });
judul.text('Gambar lewat kode', 0, 0, {
  size: 96, weight: 800, color: '#2D3E8D', align: 'center', valign: 'middle',
  anim: { type: 'words', effect: 'pop', at: 4, stagger: 4 },
});
s.layer('Coretan').stroke([[200, 1050, 0.2], [540, 1020, 1], [880, 1060, 0.3]], {
  brush: 'brush', size: 30, color: '#00B7B3', reveal: [12, 16],
});
s.sfx('pop', { at: 4 });

export default p;
```

## Konsep

| Objek | Isinya | Contoh |
| --- | --- | --- |
| Project | ukuran, fps, background, efek, audio global | satu video |
| Scene | durasi, transisi masuk, kamera, catatan storyboard | satu shot |
| Layer | elemen gambar + transform/keyframe sendiri | "Judul", "Tinta" |
| Group | anak-anak layer yang bergerak bareng | satu karakter |
| Track | menampilkan satu "drawing" (pose) sekaligus | lengan ngetik |
| Element | satu coretan, bentuk, teks, atau gambar | alis, logo |

**Waktu.** Semua waktu di dalam scene itu **lokal** (frame 0 = awal scene), jadi scene bisa diurutkan ulang tanpa merusak timing. Waktu boleh angka frame (`36`) atau string (`'1.5s'`, `'500ms'`, `'12f'`, `'0:02'`). Range pakai ujung eksklusif: `show: [12, 24]` tampil di frame 12–23.

**Transisi** menumpuk: transisi 12 frame ke scene B berarti 12 frame terakhir scene A main bareng 12 frame pertama B. Total durasi = jumlah durasi − overlap.

**Koordinat.** Kanvas dalam piksel, (0,0) kiri-atas. Rotasi dalam **derajat**. Kamera `x` positif = kamera geser ke kanan (gambar bergeser ke kiri).

**ID.** Setiap layer/elemen dapat ID yang stabil (dari nama, mis. `judul`, `text-2`). Lihat semuanya dengan `gerak info video.mjs`. Pakai ID buat revisi tepat sasaran (`p.find('judul').key(...)`).

## CLI

```
gerak init <file> [--template basic|story|promo] [--preset reels|square|feed|youtube]
gerak preview <src> [--port 4300] [--host 0.0.0.0]
gerak render <src> [-o out.mp4|.webm|.mov|.gif] [--draft] [--scale 0.5] [--from 2s --to 5s]
                   [--workers 4] [--crf 18] [--preset medium] [--transparent] [--no-audio]
gerak run <src>             simpan .gerak.json + poster + contact sheet (+ --movie)
gerak frame <src> <f>       frame tunggal (f: 36 | "2.5s" | "50%")
gerak sheet <src>           contact sheet (--every 15 | --per-scene 3 | --thumb 300)
gerak onion <src> <f>       onion skin (--before 2 --after 2 --step 2)
gerak frames <src> <dir>    PNG sequence
gerak audio <src> -o mix.wav
gerak info <src> [--json]   pohon scene/layer/ID/keyframe
gerak sfx <type> -o x.wav   generate SFX (gerak sfx --list)
gerak list                  daftar brush, easing, transisi, sfx, preset, font
gerak doctor
```

`<src>` bisa script (`.mjs` / `.js` / `.ts` yang `export default` project) atau project tersimpan (`.gerak.json`). Script `.ts` jalan langsung di Node 22.18+ (type stripping bawaan).

## Contoh

| | |
| --- | --- |
| `examples/sistem/` | **Satu Orang, Satu Sistem** — animatic gambar tangan 9:16 ±16 detik: siluet tokoh, track lengan ngetik, jam berputar, chat menumpuk dengan clip + scroll, flowchart sketsa, roda gigi, line boil, 5 transisi, SFX + musik pad sintetis. |
| `examples/promo/` | **3 Tools AI Gratis** — listicle brand clean: scramble, karaoke caption, ikon vektor animasi, progres, push transitions, beat. |

```sh
npm run example:sistem    # → out/sistem.mp4
npm run example:promo     # → out/promo.mp4
```

## Dokumentasi

- [`docs/API.md`](docs/API.md) — referensi lengkap API (project, scene, layer, elemen, animasi, kamera, audio, export).
- [`skill/SKILL.md`](skill/SKILL.md) — panduan buat coding agent (Claude Code / Codex): alur kerja brief → script → review sheet → revisi → render.

## Pakai dari kode (tanpa CLI)

```js
import { open, renderMovie, saveFrame, renderSheet } from 'gerak';

const p = open('output/video.gerak.json');      // buka project tersimpan
p.find('judul').key(0, { y: 900 }).key(12, { y: 860 }, 'out-back');
p.save('output/video-v2.gerak.json');
await saveFrame(p, '50%', 'cek.png');
await renderMovie(p, 'video-v2.mp4', { onProgress: console.log });
```

## Batasan

- Render pakai CPU (Skia via `@napi-rs/canvas`). Contoh 16 detik 1080×1920 di VPS 2 core ±50 detik (≈8 fps); makin banyak core makin cepat karena worker paralel otomatis. Pakai `--draft` untuk cek cepat.
- Belum ada klip video sebagai elemen (pakai PNG sequence/gambar dulu), belum ada TTS, dan belum ada rig tulang/IK seperti di Codeboard.
- Font bawaan: Plus Jakarta Sans (400–800), Caveat, Patrick Hand. Font lain: `p.font('fonts/Brand.ttf', { family: 'Brand', weight: 700 })`. Emoji butuh font emoji terpasang di sistem.

## Lisensi

Kode: MIT. Font di `fonts/` berlisensi SIL Open Font License 1.1 (lihat file `OFL-*.txt`). SFX dibuat sintetis oleh engine — bebas dipakai.
