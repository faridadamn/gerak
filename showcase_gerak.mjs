import { project } from 'gerak';

// --- Palet Warna Cyber Modern ---
const BG_DARK = '#0B0F19';
const CARD_BG = '#141A29';
const CARD_BORDER = '#222F4C';
const CYAN = '#00F0FF';
const TEAL = '#00E599';
const PURPLE = '#8B5CF6';
const CORAL = '#FF5252';
const AMBER = '#FFB800';
const WHITE = '#FBFCFF';
const GREY = '#94A3B8';

const W = 1080;
const H = 1920;

const p = project({
  title: 'Gerak Engine - Code-First Motion Graphics',
  preset: 'reels',
  fps: 30,
  background: BG_DARK,
});

p.effects({ grain: 0.03, vignette: 0.15 });

// Helper: Vektor Kilat / Lightning Bolt
function drawLightning(layer, x, y, size = 1, color = AMBER) {
  const pts = [
    [-6 * size, -18 * size],
    [5 * size, -18 * size],
    [-2 * size, -2 * size],
    [8 * size, -2 * size],
    [-8 * size, 18 * size],
    [-3 * size, 3 * size],
    [-9 * size, 3 * size]
  ];
  return layer.polygon(pts.map(([px, py]) => [x + px, y + py]), { fill: color, closed: true });
}

// =====================================================================
// SCENE 1: THE HOOK (3.5s = 105 frame)
// Hook tajam: Stop bikin video pakai cara lama!
// =====================================================================
const s1 = p.scene('Hook', {
  duration: '3.5s',
  background: { type: 'radial', at: [W / 2, H / 2], radius: 1000, stops: [[0, '#1E1B4B'], [1, '#070A10']] },
});

// Aksen dekoratif melayang & berputar
const s1_deco1 = s1.layer('DecoStar1', { x: 920, y: 440 });
s1_deco1.star(0, 0, 54, 18, 4, { fill: CYAN });
s1_deco1.pop(6).spin({ speed: 40, from: 6 });

const s1_deco2 = s1.layer('DecoStar2', { x: 160, y: 1420 });
s1_deco2.star(0, 0, 44, 14, 4, { fill: AMBER });
s1_deco2.pop(12).spin({ speed: -45, from: 12 });

// Glowing circle background
const s1_glow = s1.layer('GlowRing', { x: W / 2, y: 920 });
s1_glow.circle(0, 0, 420, { stroke: 'rgba(0,240,255,0.12)', strokeWidth: 4 });
s1_glow.circle(0, 0, 490, { stroke: 'rgba(139,92,246,0.08)', strokeWidth: 2, dash: [12, 12] });
s1_glow.spin({ speed: 15, from: 0 });

// Badge Kategori Atas
const s1_badge = s1.layer('CategoryBadge', { x: W / 2, y: 520 });
s1_badge.rect(-270, -38, 540, 76, { fill: 'rgba(255,255,255,0.08)', r: 38, stroke: CYAN, strokeWidth: 2 });
drawLightning(s1_badge, -200, 0, 1.1, CYAN);
s1_badge.text('REVOLUSI MOTION GRAPHICS', 24, 0, {
  size: 30,
  weight: 800,
  color: CYAN,
  align: 'center',
  valign: 'middle',
  letterSpacing: 2
});
s1_badge.pop(4, { dur: 12 });

// Headline Utama
const s1_txt = s1.layer('Headline', { fixed: true });
s1_txt.text('MASIH BIKIN VIDEO', W / 2, 680, {
  size: 78,
  weight: 800,
  color: WHITE,
  align: 'center',
  anim: { type: 'words', effect: 'rise', at: 8, stagger: 3, dur: 10 }
});

s1_txt.text('PAKAI CARA LAMA?', W / 2, 790, {
  size: 96,
  weight: 900,
  color: CORAL,
  align: 'center',
  anim: { type: 'words', effect: 'pop', at: 18, stagger: 4, dur: 12 },
  highlight: { words: ['LAMA?'], style: 'box', color: '#3A141A', at: 28, dur: 14 }
});

// Sub-punchline
const s1_sub = s1.layer('SubText', { x: W / 2, y: 1140 });
s1_sub.rect(-420, -110, 840, 220, {
  fill: 'rgba(20,26,41,0.85)',
  r: 28,
  stroke: 'rgba(255,255,255,0.1)',
  strokeWidth: 2,
  shadow: { color: 'rgba(0,0,0,0.4)', blur: 30, y: 12 }
});
s1_sub.text('Buka software berat giga-byte,', 0, -40, {
  size: 44,
  weight: 600,
  color: GREY,
  align: 'center',
  valign: 'middle'
});
s1_sub.text('render lama, dan kipas laptop ngebut?', 0, 30, {
  size: 46,
  weight: 700,
  color: WHITE,
  align: 'center',
  valign: 'middle'
});
s1_sub.pop(24, { dur: 14 }).float({ amp: 8, period: 3, from: 35 });

// Audio Scene 1
s1.sfx('impact', { at: 4, volume: -6 });
s1.sfx('swoosh', { at: 18, volume: -8 });
s1.sfx('pop', { at: 24, volume: -8 });
s1.camera.push({ zoom: 1.06 });

// =====================================================================
// SCENE 2: THE NEW WAY (4.0s = 120 frame)
// Bikin video cukup pakai KODE JavaScript!
// =====================================================================
const s2 = p.scene('CodeMockup', {
  duration: '4.0s',
  background: BG_DARK,
  transition: { type: 'push-left', duration: 12, ease: 'in-out-quart' }
});

const s2_txt = s2.layer('TeksS2', { fixed: true });
s2_txt.text('DI 2026, KITA BIKIN VIDEO...', W / 2, 380, {
  size: 56,
  weight: 700,
  color: GREY,
  align: 'center',
  anim: { type: 'words', effect: 'fade', at: 2, stagger: 2, dur: 8 }
});

s2_txt.text('CUKUP PAKE KODE!', W / 2, 470, {
  size: 98,
  weight: 900,
  color: CYAN,
  align: 'center',
  anim: { type: 'words', effect: 'rise', at: 10, stagger: 3, dur: 12 },
  highlight: { words: ['KODE!'], style: 'underline', color: TEAL, at: 24, dur: 12 }
});

// Terminal IDE Mockup Box
const s2_codeBox = s2.layer('TerminalBox', { x: W / 2, y: 1100 });
s2_codeBox.rect(-450, -380, 900, 760, {
  fill: '#0F1626',
  r: 32,
  stroke: CARD_BORDER,
  strokeWidth: 3,
  shadow: { color: 'rgba(0,240,255,0.1)', blur: 45, y: 18 }
});

// Header Bar Terminal
s2_codeBox.rect(-450, -380, 900, 72, { fill: '#182238', r: [32, 32, 0, 0] });
// Dot buttons
s2_codeBox.circle(-400, -344, 14, { fill: '#FF5F56' });
s2_codeBox.circle(-360, -344, 14, { fill: '#FFBD2E' });
s2_codeBox.circle(-320, -344, 14, { fill: '#27C93F' });
// File Tab Label
s2_codeBox.text('video.mjs — Gerak Engine', 0, -344, {
  size: 30,
  weight: 600,
  color: '#8A99AD',
  align: 'center',
  valign: 'middle'
});

// Code Snippet Lines
const codeLines = [
  { t: "import { project } from 'gerak';", c: CYAN, y: -240 },
  { t: "const p = project({ preset: 'reels' });", c: WHITE, y: -160 },
  { t: "const s = p.scene('Hook', { dur: '3s' });", c: '#A78BFA', y: -80 },
  { t: "s.layer('Judul').text('Halo Dunia!');", c: TEAL, y: 0 },
  { t: "s.sfx('impact', { at: 5 });", c: AMBER, y: 80 },
  { t: "export default p;", c: CYAN, y: 160 }
];

codeLines.forEach((line) => {
  s2_codeBox.text(line.t, -390, line.y, {
    size: 38,
    weight: 600,
    color: line.c,
    valign: 'middle'
  });
});

// Output Badge di bawah terminal
s2_codeBox.rect(-380, 250, 760, 80, {
  fill: 'rgba(0,229,153,0.12)',
  r: 20,
  stroke: TEAL,
  strokeWidth: 2
});
s2_codeBox.text('▶ gerak render video.mjs → video.mp4 ✓', 0, 290, {
  size: 32,
  weight: 800,
  color: TEAL,
  align: 'center',
  valign: 'middle'
});

s2_codeBox.zoomIn(6, { from: 0.85, dur: 16 });

// Audio Scene 2
s2.sfx('whoosh', { at: 0, volume: -10 });
s2.sfx('pop', { at: 6, volume: -8 });
s2.sfx('typing', { at: 20, dur: 2.0, volume: -10 });
s2.sfx('notify', { at: 65, volume: -8 });

// =====================================================================
// SCENE 3: 3 SUPERPOWERS (4.0s = 120 frame)
// 90 FPS, 29 SFX, 100% Deterministic
// =====================================================================
const s3 = p.scene('Superpowers', {
  duration: '4.0s',
  background: BG_DARK,
  transition: { type: 'push-left', duration: 12, ease: 'in-out-quart' }
});

const s3_title = s3.layer('S3Title', { fixed: true });
s3_title.text('KENAPA GERAK BEDA?', W / 2, 340, {
  size: 78,
  weight: 900,
  color: WHITE,
  align: 'center',
  anim: { type: 'words', effect: 'rise', at: 4, stagger: 3, dur: 10 }
});

// 3 Kartu Keunggulan
const features = [
  {
    num: '01',
    title: 'RENDER 90+ FPS',
    desc: 'Headless di server VPS, tanpa GPU mahal',
    color: CYAN,
    y: 570
  },
  {
    num: '02',
    title: '29 SFX SINTETIS',
    desc: 'Audio sound design otomatis & bebas royalti',
    color: TEAL,
    y: 910
  },
  {
    num: '03',
    title: '100% DETERMINISTIK',
    desc: 'Presisi tiap pixel, mudah di-automate bot',
    color: PURPLE,
    y: 1250
  }
];

features.forEach((item, idx) => {
  const card = s3.layer(`Card_${idx}`, { x: W / 2, y: item.y });
  card.rect(-440, -130, 880, 260, {
    fill: CARD_BG,
    r: 28,
    stroke: CARD_BORDER,
    strokeWidth: 2,
    shadow: { color: 'rgba(0,0,0,0.3)', blur: 25, y: 12 }
  });
  // Strip Aksen
  card.rect(-440, -130, 20, 260, { fill: item.color, r: [28, 0, 0, 28] });
  // Badge Nomor
  card.circle(-340, 0, 52, { fill: 'rgba(255,255,255,0.06)', stroke: item.color, strokeWidth: 2 });
  card.text(item.num, -340, 0, { size: 48, weight: 800, color: item.color, align: 'center', valign: 'middle' });
  // Judul & Desc
  card.text(item.title, -240, -32, { size: 52, weight: 800, color: WHITE });
  card.text(item.desc, -240, 40, { size: 36, weight: 500, color: GREY });

  card.pop(10 + idx * 10, { dur: 14 });
  s3.sfx('pop', { at: 10 + idx * 10, volume: -10 });
});

s3.sfx('whoosh', { at: 0, volume: -10 });
s3.sfx('coin', { at: 45, volume: -8 });

// =====================================================================
// SCENE 4: CTA & OUTRO (3.5s = 105 frame)
// =====================================================================
const s4 = p.scene('OutroCTA', {
  duration: '3.5s',
  background: { type: 'radial', at: [W / 2, 700], radius: 950, stops: [[0, '#1E1B4B'], [1, '#070A10']] },
  transition: { type: 'zoom', duration: 12 }
});

// Logo Emblem GERAK
const s4_logo = s4.layer('LogoBadge', { x: W / 2, y: 560 });
s4_logo.circle(0, 0, 110, { fill: 'rgba(0,240,255,0.12)', stroke: CYAN, strokeWidth: 4 });
drawLightning(s4_logo, 0, -22, 1.8, CYAN);
s4_logo.text('GERAK', 0, 48, { size: 36, weight: 900, color: CYAN, align: 'center', valign: 'middle', letterSpacing: 4 });
s4_logo.pop(6, { dur: 16 }).pulse({ amount: 0.05, period: 2.2 });

// Teks CTA
const s4_txt = s4.layer('TeksCTA', { fixed: true });
s4_txt.text('COBAIN SEKARANG!', W / 2, 800, {
  size: 88,
  weight: 900,
  color: WHITE,
  align: 'center',
  anim: { type: 'words', effect: 'rise', at: 12, stagger: 3, dur: 10 }
});

s4_txt.text('Live Editor & Render Langsung di Browser:', W / 2, 920, {
  size: 42,
  weight: 500,
  color: GREY,
  align: 'center',
  anim: { type: 'words', effect: 'fade', at: 20, stagger: 2, dur: 10 }
});

// URL Pill Button
const s4_pill = s4.layer('URLButton', { x: W / 2, y: 1180 });
s4_pill.rect(-420, -68, 840, 136, {
  r: 68,
  fill: TEAL,
  shadow: { color: 'rgba(0,229,153,0.3)', blur: 40, y: 14 }
});
s4_pill.text('faridadamn.my.id/gerak', 0, 0, {
  size: 52,
  weight: 900,
  color: '#070A10',
  align: 'center',
  valign: 'middle'
});
s4_pill.pop(28, { dur: 14 }).float({ amp: 8, period: 2.5, from: 35 });

// Watermark Credit
const s4_wm = s4.layer('Watermark', { fixed: true });
s4_wm.text('Ditenagai Gerak Engine · Node.js & Canvas Skia', W / 2, 1420, {
  size: 32,
  weight: 600,
  color: 'rgba(255,255,255,0.4)',
  align: 'center'
});

s4.sfx('impact', { at: 6, volume: -8 });
s4.sfx('ding', { at: 28, volume: -6 });

// Backsound Global Sintetis
p.sfx('beat', { at: 0, bpm: 114, bars: 8, volume: -14 });
p.sfx('pad', { at: 0, dur: p.seconds, root: 220, chord: [0, 4, 7, 11], volume: -20 });

export default p;
