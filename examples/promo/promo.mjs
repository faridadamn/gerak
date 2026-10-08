// Contoh: konten listicle 9:16 gaya brand clean — tipografi kinetik, ikon vektor, caption karaoke.
//   gerak preview examples/promo/promo.mjs
//   gerak render  examples/promo/promo.mjs -o out/promo.mp4
import { project } from 'gerak';

const BLUE = '#2D3E8D';
const TEAL = '#00B7B3';
const INK = '#14161f';
const SOFT = '#f5f7fb';
const W = 1080;
const H = 1920;

const p = project({ title: '3 Tools AI Gratis', preset: 'reels', fps: 30, background: SOFT });
p.effects({ grain: 0.035 });

// ---------------------------------------------------------------- helper
/** Titik progres di atas (aktif = teal). */
function progress(scene, active, total = 3) {
  const l = scene.layer('Progres', { fixed: true });
  for (let i = 0; i < total; i++) {
    const on = i === active;
    l.rect(W / 2 - (total * 70) / 2 + i * 70 + 6, 170, 58, 12, { fill: on ? TEAL : 'rgba(45,62,141,0.18)', r: 6 });
  }
  return l;
}

/** Kartu tool: nomor, judul, deskripsi, ikon. */
function toolScene(n, { title, desc, icon, color, transition }) {
  const s = p.scene(`Tool ${n}`, { duration: '3s', transition });
  progress(s, n - 1);
  // bulatan dekor yang melayang
  const deco = s.layer('Dekor');
  deco.circle(W - 120, 420, 220, { fill: color, opacity: 0.12 });
  deco.circle(120, 1500, 160, { fill: BLUE, opacity: 0.07 });
  deco.float({ amp: 14, period: 4 });

  const badge = s.layer('Nomor', { x: 180, y: 420 });
  badge.circle(0, 0, 86, { fill: color });
  badge.text(String(n), 0, 0, { size: 110, weight: 800, color: '#fff', align: 'center', valign: 'middle' });
  badge.pop(2, { dur: 14 });

  const ic = s.layer('Ikon', { x: W / 2, y: 980 });
  icon(ic, color);
  ic.zoomIn(6, { from: 0.6, dur: 18 }).float({ amp: 10, period: 2.5, from: 24 });

  const t = s.layer('Teks', { fixed: true });
  t.text(title, 120, 600, { size: 96, weight: 800, color: INK, maxWidth: W - 240, lineHeight: 1.05, valign: 'top', anim: { type: 'words', effect: 'rise', at: 6, stagger: 4, dur: 12 } });
  t.text(desc, 120, 1340, { size: 50, weight: 500, color: '#4a4f63', maxWidth: W - 240, lineHeight: 1.3, valign: 'top', anim: { type: 'lines', effect: 'fade', at: 22, stagger: 6, dur: 12 } });
  s.sfx('pop', { at: 2, volume: -6 });
  s.sfx('swipe', { at: 0, volume: -10 });
  return s;
}

// ---------------------------------------------------------------- ikon (vektor, digambar lewat kode)
const iconMic = (l, c) => {
  l.rect(-80, -220, 160, 260, { fill: c, r: 80 });
  for (let i = 0; i < 4; i++) l.line(-40, -150 + i * 46, 40, -150 + i * 46, { stroke: 'rgba(255,255,255,0.6)', strokeWidth: 10 });
  l.arc(0, -40, 140, 0, 180, { stroke: INK, strokeWidth: 18, draw: [14, 14] });
  l.line(0, 100, 0, 180, { stroke: INK, strokeWidth: 18 });
  l.line(-80, 190, 80, 190, { stroke: INK, strokeWidth: 18 });
};
const iconChart = (l, c) => {
  l.rect(-220, -200, 440, 400, { fill: '#ffffff', r: 40, shadow: { color: 'rgba(20,22,31,0.12)', blur: 40, y: 18 } });
  const bars = [90, 160, 120, 230];
  bars.forEach((h, i) => {
    const bl = l.group(`bar ${i + 1}`, { x: -150 + i * 100, y: 150, scaleY: 1 });
    bl.layer(`batang ${i + 1}`).rect(-30, -h, 60, h, { fill: i === 3 ? c : '#d6dbef', r: 14 });
    bl.key(10 + i * 4, { scaleY: 0 }, 'out-back').key(26 + i * 4, { scaleY: 1 });
  });
  l.polygon([[-150, 40], [-50, -20], [50, 10], [150, -100]], { closed: false, stroke: INK, strokeWidth: 10, draw: [30, 18], smooth: true });
};
const iconChat = (l, c) => {
  l.rect(-230, -180, 380, 220, { fill: c, r: 60 });
  l.polygon([[-170, 30], [-200, 110], [-110, 40]], { fill: c });
  l.rect(-110, -40, 340, 200, { fill: '#ffffff', r: 56, stroke: INK, strokeWidth: 8 });
  for (let i = 0; i < 3; i++) {
    const d = l.group(`titik ${i + 1}`, { x: -30 + i * 90, y: 60 });
    d.layer(`dot ${i + 1}`).circle(0, 0, 18, { fill: INK });
    d.float({ amp: 10, period: 0.8, phase: i * 0.18, from: 20 });
  }
};

// ---------------------------------------------------------------- 0. Hook
const hook = p.scene('Hook', { duration: '3s', background: { type: 'linear', angle: 120, stops: [[0, '#2D3E8D'], [1, '#18235a']] } });
const sparkle = hook.layer('Kilau', { x: 860, y: 520 });
sparkle.star(0, 0, 70, 22, 4, { fill: TEAL });
sparkle.pop(18).spin({ speed: 90, from: 18 });
const h = hook.layer('Judul', { fixed: true });
h.text('3 tools AI', 120, 640, { size: 150, weight: 800, color: '#ffffff', valign: 'top', anim: { type: 'chars', effect: 'rise', at: 2, stagger: 1.5, dur: 10 } });
h.text('GRATIS', 120, 820, {
  size: 190,
  weight: 800,
  color: TEAL,
  valign: 'top',
  letterSpacing: 4,
  anim: { type: 'scramble', at: 12, dur: 18 },
  highlight: { words: ['GRATIS'], style: 'underline', color: '#ffffff', at: 30, dur: 10 },
});
h.text('yang kupakai tiap hari', 120, 1060, { size: 64, weight: 600, color: '#cdd6ff', valign: 'top', anim: { type: 'words', effect: 'fade', at: 34, stagger: 3, dur: 10 } });
// caption karaoke (contoh sinkron dengan voice-over: tiap kata punya waktu mulai)
const cap = hook.layer('Caption', { fixed: true });
cap.text('Simpan dulu, nanti nyesel kalau lupa', W / 2, 1460, {
  size: 58,
  weight: 800,
  color: '#ffffff',
  align: 'center',
  valign: 'middle',
  maxWidth: 860,
  box: { color: 'rgba(0,0,0,0.35)', padX: 26, padY: 14, radius: 22 },
  anim: { type: 'karaoke', times: ['1.4s', '1.6s', '1.85s', '2.05s', '2.2s', '2.4s', '2.55s'], color: '#FFD43B', scale: 1.08 },
});
hook.camera.push({ zoom: 1.05 });
hook.sfx('glitch', { at: 12, dur: 0.5, volume: -14 });
hook.sfx('whoosh', { at: 0, volume: -8 });

// ---------------------------------------------------------------- 1..3 Tools
toolScene(1, { title: 'Notulen rapat otomatis', desc: 'Rekam meeting, dapat ringkasan + to-do. Nggak perlu nyatat manual lagi.', icon: iconMic, color: TEAL, transition: { type: 'push-left', duration: 10, ease: 'in-out-quart' } });
toolScene(2, { title: 'Laporan penjualan sekali klik', desc: 'Tempel data dari spreadsheet, langsung jadi grafik dan insight.', icon: iconChart, color: BLUE, transition: { type: 'push-left', duration: 10, ease: 'in-out-quart' } });
toolScene(3, { title: 'Balas chat pelanggan 24 jam', desc: 'Jawab pertanyaan yang sama berulang-ulang, otomatis, tetap sopan.', icon: iconChat, color: TEAL, transition: { type: 'push-left', duration: 10, ease: 'in-out-quart' } });

// ---------------------------------------------------------------- CTA
const cta = p.scene('CTA', { duration: '2.5s', background: TEAL, transition: { type: 'zoom', duration: 12 } });
const c = cta.layer('Ajakan', { fixed: true });
c.text('Mau link-nya?', W / 2, 820, { size: 120, weight: 800, color: '#ffffff', align: 'center', valign: 'middle', anim: { type: 'words', effect: 'stamp', at: 2, stagger: 5, dur: 10 } });
c.text('komen "AI" ya', W / 2, 990, { size: 84, weight: 700, color: INK, align: 'center', valign: 'middle', box: { color: '#ffffff', padX: 34, padY: 18, radius: 28 }, anim: { type: 'chars', effect: 'pop', at: 18, stagger: 1, dur: 8 } });
const arrowL = cta.layer('Panah', { x: W / 2, y: 1220 });
arrowL.arrow(0, -60, 0, 80, { stroke: '#ffffff', strokeWidth: 16, head: 40, draw: [30, 10] });
arrowL.float({ amp: 12, period: 0.9, from: 40 });
cta.sfx('impact', { at: 2, volume: -10 });
cta.sfx('notify', { at: 18, volume: -8 });

// musik: beat sederhana + pad (disintesis)
p.sfx('beat', { at: 0, bpm: 104, bars: 6, volume: -16 });
p.sfx('pad', { at: 0, dur: p.seconds, root: 220, chord: [0, 4, 7, 11], volume: -22 });

export default p;
