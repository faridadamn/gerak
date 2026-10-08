# Referensi API Gerak

Semua yang ada di sini diimpor dari `'gerak'`:

```js
import { project, open, renderMovie, withPressure, catmullRom } from 'gerak';
```

Satuan: posisi/ukuran dalam piksel kanvas, rotasi dalam derajat, opacity 0–1, tekanan 0–1.
Waktu: angka = frame, atau string `'1.5s'`, `'500ms'`, `'12f'`, `'0:02'`. Di dalam scene semua waktu **lokal scene**.
Shorthand timing `[at, dur, ease]` boleh dipakai di mana pun ada opsi `{at, dur, ease}`.

---

## Project

```js
const p = project({
  title: 'Judul',
  preset: 'reels',        // reels|tiktok|shorts|story|vertical 1080×1920 · square 1080² · feed|portrait 1080×1350
                          // youtube|landscape|1080p 1920×1080 · hd|720p 1280×720 · 4k
  width, height,          // override manual
  fps: 30,
  background: '#ffffff',  // warna atau gradien (lihat Paint)
});
```

| Method | Fungsi |
| --- | --- |
| `p.scene(name, {duration, background, transition, notes, id})` | tambah scene (default 3s) |
| `p.scenes`, `p.getScene(idOrName)` | daftar / cari scene |
| `p.moveScene(id, index)`, `p.removeScene(id)` | atur urutan |
| `p.find(id)` | handle layer/group/track, atau `ElementRef` untuk elemen |
| `p.effects({grain, vignette})` | grain kertas `0.08` atau `{amount, animate:true, every:2}`; vignette `0.3` |
| `p.boil(true \| {every:4, variants:3, amount:1} \| false)` | line boil untuk semua brush stroke & sketch |
| `p.font(path, {family, weight, style})` | daftarkan font file (.ttf/.otf) |
| `p.audio(src, opts)` / `p.sfx(type, opts)` | audio di timeline global |
| `p.width`, `p.height`, `p.fps`, `p.duration` (frame), `p.seconds` | info |
| `p.t('1.5s')` | konversi waktu ke frame |
| `p.save(file)` | simpan `.gerak.json` (path aset relatif ke file) |
| `p.info()` | ringkasan: scene, timing, pohon layer, ID, keyframe |
| `open(file)` | buka project tersimpan untuk direvisi |

Script untuk CLI wajib `export default p` (boleh juga `export default async () => p`).

## Scene

```js
const s = p.scene('Intro', { duration: '3s', transition: { type: 'fade', duration: 12, ease: 'in-out-cubic' } });
```

| Method | Fungsi |
| --- | --- |
| `s.layer(name, opts)` / `s.group(name, opts)` / `s.track(name, opts)` | node root (urutan = urutan gambar, yang terakhir paling depan) |
| `s.set({duration, background, transition, name})` | ubah scene |
| `s.transition(type, duration, {ease, color, at})` | transisi masuk ke scene ini (`'cut'`/`null` = potong) |
| `s.note({action, dialog, camera})` | catatan storyboard (muncul di contact sheet) |
| `s.camera` | lihat **Kamera** |
| `s.audio(src, opts)`, `s.sfx(type, opts)` | audio dengan waktu lokal scene (ikut kalau scene dipindah) |
| `s.captions([{text, at, until, style}], style)` | subtitle burn-in di layer `fixed` |
| `s.duration`, `s.start`, `s.id` | info |

**Transisi:** `fade` (`dissolve`, `crossfade`), `dip`/`fade-black`/`fade-white` (`color`), `flash`, `wipe-left|right|up|down`, `slide-*`/`push-*`, `cover-*`, `iris`/`circle` (`at:[x,y]`), `zoom`, `blur` (`amount`).

## Layer, Group, Track (node)

```js
const l = s.layer('Judul', { x: 540, y: 900, pivot: [0, 0], opacity: 1, fixed: true });
```

Opsi node: `x, y, rotation, scale, scaleX, scaleY, skewX, skewY, pivot:[x,y], opacity, blur, depth` (semua bisa di-keyframe), plus
`blend` (`multiply`, `screen`, `overlay`, …), `filter` (CSS filter, mis. `'saturate(1.4)'`), `shadow: {color, blur, x, y}`,
`clip: {rect:[x,y,w,h]} | {d: 'M…'}` (di ruang lokal node), `fixed: true` (abaikan kamera — buat caption/HUD),
`isolate: true` (komposit sebagai satu kesatuan), `show: [from, to]`, `mask: '<id anak>'` + `maskInvert`, `wipe`, `visible`.

Transform: `translate(x,y) → rotate/skew/scale di sekitar pivot`. Origin layer = (0,0) lokal; gambar elemen relatif ke situ.

### Keyframe

```js
l.key(0, { y: 960, opacity: 0 }, 'out-back')   // ease membentuk gerak dari key ini ke key berikutnya
 .key(12, { y: 900, opacity: 1 });
l.keys([[0, { x: 0 }], [24, { x: 300 }, 'in-out-sine']]);
l.animate({ at: 0, dur: 12, from: { scale: 0.5 }, to: { scale: 1 }, ease: 'spring' });
l.move('2s', { x: 800 }, { dur: 18, ease: 'in-out-quart' });  // dari posisi saat itu
l.removeKeys(['x']);
```

Sebelum key pertama nilai key pertama yang berlaku; setelah key terakhir nilai terakhir bertahan.

**Easing:** `linear`, `hold`, `ease`, `ease-in`, `ease-out`, `ease-in-out`, `in|out|in-out-{sine,quad,cubic,quart,quint,expo,circ,back,elastic,bounce}`,
alias `in`, `out`, `in-out`, `smooth`, `snap`, `pop`, `anticipate`, `spring`, `spring-soft|stiff|bouncy`, `cubic-bezier(a,b,c,d)`, `[a,b,c,d]`, `steps(4)`, `{type:'spring', stiffness, damping, mass}`.

### Preset animasi (semua mengembalikan node, bisa di-chain)

| Preset | Opsi |
| --- | --- |
| `fadeIn(at, dur, ease)` / `fadeOut(at, dur, ease)` | |
| `slideIn(at, {from:'bottom'\|'top'\|'left'\|'right', distance, dur, ease, fade})` | |
| `slideOut(at, {to, distance, dur, ease, fade})` | |
| `pop(at, {dur, from, ease, fade})` / `popOut(at, {dur, ease})` | skala dari `from` (set `pivot` ke tengah objek) |
| `zoomIn(at, {from, dur, ease, fade})` | |
| `dropIn(at, {height, dur, ease})` | default `out-bounce` |
| `blurIn(at, {amount, dur, ease})` | |
| `spinIn(at, {turns, dur, ease})` | |
| `wipeIn(at, {dir:'right'\|'left'\|'down'\|'up'\|'center', dur, ease, rect})` / `wipeOut(...)` | clip yang membesar |

### Behavior (prosedural, ditambahkan di atas keyframe)

`from`/`to` membatasi waktu aktif, `ramp` (frame) menghaluskan masuk/keluar.

| Behavior | Opsi |
| --- | --- |
| `wiggle({amp, rot, scale, freq, seed})` | gerak acak halus (`amp` px atau `[x,y]`, `rot` derajat, `freq` Hz) |
| `float({amp, period, x, rot, phase})` | naik-turun sinus |
| `spin({speed})` | derajat/detik |
| `pulse({amount, period})` | skala berdenyut |
| `shake({amp, freq, rot, decay})` | getar |
| `sway({angle, period, phase})` | ayunan |
| `blink({period, duty})` | kedip |

### Track (drawing substitution)

```js
const lengan = s.track('Lengan');
const a = lengan.drawing('naik');  a.layer('…').stroke(...);
const b = lengan.drawing('turun'); b.layer('…').stroke(...);
lengan.expose(0, a);                       // tampilkan a mulai frame 0 (null = kosong)
lengan.sequence([[0, a], [6, b], [12, a]]);
lengan.cycle([a, b], { from: 0, to: 48, every: 3 });  // loop tiap 3 frame
lengan.range(20, 30, null);                // kosongkan 20–29, pulihkan setelahnya
```

Track tidak menginterpolasi bentuk; dia mengganti gambar. Gerak (posisi/rotasi) tetap lewat keyframe.

## Elemen

Semua method gambar mengembalikan `ElementRef` (`.id`, `.set(patch)`, `.remove()`). Opsi umum: `id`, `name`, `opacity`, `blend`, `shadow`, `show:[from,to]`, `boil`.

### Bentuk vektor

```js
l.rect(x, y, w, h, { fill, stroke, strokeWidth, r: 24 /* atau [tl,tr,br,bl] */ })
l.circle(cx, cy, r, style)       l.ellipse(cx, cy, rx, ry, style)
l.line(x1, y1, x2, y2, style)    l.arrow(x1, y1, x2, y2, { head: 24, headAngle: 28, ...style })
l.polygon([[x,y], ...], { closed: false, smooth: true, ...style })
l.star(cx, cy, rLuar, rDalam, jumlahUjung, style)
l.arc(cx, cy, r, startDeg, endDeg, style)
l.path('M 0 0 C …', style)       // SVG path lengkap: M L H V C S Q T A Z, relatif & absolut
```

Style: `fill`, `stroke`, `strokeWidth`, `lineCap`, `lineJoin`, `dash:[10,6]`, `fillRule:'evenodd'`, `shadow`,
`draw: [at, dur, ease]` (garis tergambar; fill memudar masuk di akhir), `sketch: true | {brush, size, roughness, passes, fill:'hachure'|'solid'|'none', gap, angle, hatchSize, offset, color, seed}`.

### Brush stroke

```js
l.stroke(points, { brush: 'ink', size: 12, color: '#111', reveal: [at, dur, ease], seed })
l.stroke('M 100 100 C …', { brush: 'pencil', pressure: 'taper' })   // dari SVG path
l.erase(points, { size: 30 })                                         // hanya menghapus layer ini
```

`points`: `[[x, y, tekanan], …]` atau `{x, y, p}`. Override brush: `size, minWidth, taper:[awal,akhir], wobble, flow, hardness, grain, scatter, spacing, dryness, gamma, glow, bristles, smooth`.

| Brush | Karakter |
| --- | --- |
| `pen`, `fineliner` | garis rapi, sedikit getar tangan |
| `ink` | brush pen, kontras tebal-tipis |
| `marker`, `highlighter` | rata; highlighter transparan + multiply |
| `brush`, `dry` | kuas tinta dengan serat kering |
| `pencil`, `charcoal`, `chalk`, `crayon`, `airbrush` | dab bertekstur |
| `neon` | garis bercahaya |

Helper titik: `catmullRom(pts, n)`, `line(x1,y1,x2,y2,{n,pressure})`, `ellipsePoints(cx,cy,rx,ry,{start,end,n,pressure})`,
`pathPoints(d,{spacing,pressure})`, `withPressure(pts, 'taper'|'in'|'out'|'swell'|'flat'|angka|fn)`, `wobble(pts, amount, {seed, freq})`, `jitter`, `translate`, `scale`, `rotate`, `mirror`.

### Teks

```js
l.text('Halo dunia', x, y, {
  font: 'Plus Jakarta Sans', size: 64, weight: 800, italic: false, color: '#111',
  align: 'left'|'center'|'right', valign: 'baseline'|'top'|'middle'|'bottom',
  maxWidth: 800, fit: 900, lineHeight: 1.2, letterSpacing: 2, case: 'upper',
  stroke: '#000', strokeWidth: 6, shadow: {...},
  box: { color, padX, padY, radius, mode: 'line'|'block' },
  highlight: { words: ['dunia'] /* atau index kata */, style: 'marker'|'box'|'underline'|'strike'|'circle'|'color', color, at, dur },
  anim: {...}, exit: {...},
});
```

`fit` mengecilkan teks kalau lebarnya melebihi angka itu (cocok buat counter).

**`anim`**

| type | Opsi |
| --- | --- |
| `typewriter` | `at`, `dur` atau `cps`, `cursor: false\|true\|'#warna'` |
| `chars` / `words` / `lines` | `effect: fade\|rise\|drop\|slide\|slide-right\|pop\|stamp\|blur\|spin\|none`, `at`, `dur` (per unit), `stagger`, `span` (total), `order: 'reverse'\|'center'\|'random'`, `distance`, `ease` |
| `scramble` | `at`, `dur` |
| `count` | `from`, `to`, `at`, `dur`, `ease`, `decimals`, `prefix`, `suffix`, `separator` (`.`), `decimal` (`,`) |
| `karaoke` | `times: [waktu tiap kata]`, `color`, `dim`, `scale` |

`exit` memakai bentuk yang sama (`type: 'words'`, `effect`, `at`, …) untuk animasi keluar.

### Gambar

```js
l.image('foto.jpg', x, y, { width: 600, height, fit: 'cover'|'contain'|'fill', focus: [0.5, 0.3], radius: 24, anchor: 'center', stroke, strokeWidth })
```

Path relatif terhadap folder script.

### Revisi

```js
l.edit('text-2', { color: 'red' });             // patch
l.edit('stroke-3', (el) => ({ ...el, size: 20 }));
const ref = l.text(...); ref.set({ size: 80 });
l.remove('shape'); l.clear();
p.find('judul').set({ x: 500 });
```

## Paint (warna & gradien)

```js
'#2D3E8D' | 'rgba(0,0,0,0.5)' | 'hsl(180 100% 36%)'
{ type: 'linear', angle: 90, stops: [[0, '#2D3E8D'], [1, '#00B7B3']] }    // relatif ke bounds bentuk
{ type: 'linear', from: [0, 0], to: [0, 400], stops }                     // absolut
{ type: 'radial', stops } | { type: 'radial', at: [x, y], radius: 200, stops }
```

## Kamera

```js
s.camera.set({ zoom: 1.1 });
s.camera.key(0, { x: 0, y: 0, zoom: 1 }, 'in-out-cubic').key(72, { x: 60, zoom: 1.3 });
s.camera.move(24, { zoom: 1.5 }, { dur: 18 });
s.camera.push({ zoom: 1.08 });                  // push-in sepanjang scene
s.camera.shake({ amp: 10, freq: 14, from: 30, to: 40, decay: true });
s.camera.handheld({ amp: 6 });
```

Parallax: beri root layer `depth` (1 = normal, <1 lebih dekat/gerak lebih cepat, >1 latar jauh). Layer `fixed: true` tidak terpengaruh kamera.

## Audio

```js
p.audio('musik.mp3', { at: 0, volume: -12 /* dB */, trim: [5, 35], fadeIn: 1, fadeOut: 2, loop: true, duration: 20 });
s.audio('vo.wav', { at: '0.5s', gain: 1 });
s.sfx('whoosh', { at: 10, volume: -8, dur: 0.6, dir: 'down' });
```

Opsi audio pakai **detik** untuk `trim`, `fadeIn`, `fadeOut`, `duration`; `at` adalah waktu (frame/string) seperti biasa.

SFX: `tone`, `pop`, `bubble`, `click`, `tick`, `tap`, `whoosh`, `swoosh`, `swipe`, `riser`, `impact`, `boom`, `kick`, `hat`, `snare`, `clap`, `ding`, `chime`, `coin`, `notify`, `success`, `error`, `typing`, `scratch`, `glitch`, `heartbeat`, `pad` (`root`, `chord`, `dur`, `brightness`), `beat` (`bpm`, `bars`, `kick`, `snare`, `hat` pola 16 langkah), `silence`.
Parameter umum: `pitch`, `dur`, `seed`, `pitchShift`.

## Export (Node)

```js
await renderMovie(p, 'out.mp4', { scale, from, to, workers, crf, preset, transparent, audio, onProgress, gifFps, gifWidth });
await saveFrame(p, '2.5s', 'frame.png', { scale, transparent });
await renderFrameImage(p, 36, { format: 'jpeg' });  // Buffer
await renderSheet(p, 'sheet.png', { every: 15 | perScene: 3, thumb: 300, cols, notes });
await renderOnion(p, 24, 'onion.png', { before: 2, after: 2, step: 2 });
await saveSequence(p, 'frames/', { from, to, transparent });
await renderAudio(p, 'mix.wav');
```

Format movie dari ekstensi: `.mp4` (H.264 + AAC), `.webm` (VP9 + Opus, alpha kalau `transparent`), `.mov` (ProRes 4444 alpha / 422 HQ), `.gif` (palet).

## Renderer (isomorfik)

`gerak/core` berisi renderer yang sama dengan yang dipakai preview browser:

```js
import { Renderer } from 'gerak/core';
const r = new Renderer(doc, { createCanvas, Path2D, images: new Map(), fontEpoch: 0 });
r.renderFrame(ctx, frame, { scale: 0.5, background: true });
```

## Format file `.gerak.json`

JSON biasa: `{format:'gerak', version:1, title, width, height, fps, background, effects, boil, scenes:[…], audio:[…], assets:{id:{type,path}}, fonts:[…]}`.
Scene → `layers` (node: `id, type, name, transform, keys:{channel:[{f,v,e}]}, behaviors, exposure, elements, children, drawings`).
Aman diedit tangan atau oleh agent; buka lagi dengan `open()`.
