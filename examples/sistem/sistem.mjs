// Contoh: "Satu Orang, Satu Sistem" — animatic gambar tangan 9:16, ±15 detik.
//   gerak preview examples/sistem/sistem.mjs
//   gerak render  examples/sistem/sistem.mjs -o out/sistem.mp4
import { project } from 'gerak';
import { INK, PAPER, TEAL, BLUE, RED, HAND, NOTE, line, person, typingArms, cupArm, desk, chair, laptop, lamp, lightCone, clock, gear, bulb, box, arrow } from './art.mjs';

const p = project({ title: 'Satu Orang, Satu Sistem', preset: 'reels', fps: 24, background: PAPER });
p.effects({ grain: { amount: 0.09, animate: true, every: 3 }, vignette: 0.18 });
p.boil({ every: 3, variants: 3, amount: 0.6 }); // garis "hidup" ala animasi tangan

// ===================================================================== 1. Jam 2 pagi
const s1 = p.scene('Jam 2 pagi', { duration: '3.5s' });
s1.note({ action: 'Founder solo masih ngetik balesan chat satu-satu, tengah malam.', camera: 'push-in pelan' });

const room = s1.layer('Ruang');
line(room, [[30, 1600], [540, 1592], [1050, 1602]], { size: 8, brush: 'pen', pressure: 'flat' });
const cone = s1.layer('Cahaya layar', { opacity: 0.9 });
lightCone(cone, [[790, 1090], [800, 1280], [420, 960], [420, 900]], TEAL, 0.22);
lightCone(cone, [[1000, 1040], [1060, 1290], [860, 1290]], '#ffd43b', 0.3);
chair(room, { x: 120, y: 1370 });
const orang = person(s1, { x: 330, y: 920, pose: 'hunch' });
typingArms(orang.group, { at: 6, every: 3 });
const meja = s1.layer('Meja');
desk(meja, { y: 1300 });
laptop(meja, { x: 545, y: 1288 });
lamp(meja, { x: 960, y: 1288 });
clock(s1, { x: 820, y: 640, r: 92, fast: 900 });

const cap1 = s1.layer('Caption', { fixed: true });
cap1.text('Jam 2 pagi.', 540, 300, { font: HAND, weight: 700, size: 150, color: INK, align: 'center', valign: 'middle', anim: { type: 'words', effect: 'drop', at: 2, stagger: 6, dur: 10 } });
cap1.text('masih balesin chat satu-satu…', 540, 430, { font: NOTE, size: 58, color: '#5c5850', align: 'center', valign: 'middle', anim: { type: 'typewriter', at: 14, cps: 22, cursor: false } });
s1.camera.push({ zoom: 1.06, y: 20 });
for (let f = 0; f < 84; f += 12) s1.sfx('tick', { at: f, volume: -14 });
s1.sfx('typing', { at: 6, dur: 2.6, volume: -8 });

// ===================================================================== 2. Tumpukan chat
const s2 = p.scene('Tumpukan chat', { duration: '3.5s', transition: { type: 'wipe-left', duration: 10 } });
s2.note({ action: 'HP penuh notifikasi. Angka chat terus naik.', camera: 'getar kecil di akhir' });

const hp = s2.layer('HP', { x: 540, y: 1150 });
hp.rect(-250, -500, 500, 1000, { fill: '#ffffff', r: 60, sketch: { brush: 'pen', size: 6, fill: 'solid', roughness: 1.4, offset: [0, 0] } });
line(hp, [[-60, -462], [60, -462]], { size: 10, brush: 'pen', pressure: 'flat' });

// clip ada di layer induk yang diam; daftar di dalamnya yang menggulung
const layar = s2.group('Layar HP', { x: 540, y: 1150, clip: { rect: [-220, -430, 440, 880] } });
const chats = layar.group('Daftar chat');
const names = ['Kak, ready?', 'Ongkir ke Bdg?', 'Masih ada?', 'Bisa COD?', 'Kak???', 'Min, mau order', 'Harga grosir?', 'Halo kak', 'Restock kapan?', 'Kak tolong bls'];
names.forEach((txt, i) => {
  const at = 6 + i * 6;
  const left = i % 2 === 0;
  const b = chats.group(`chat ${i + 1}`, { x: left ? -40 : 40, y: -340 + i * 118, pivot: [left ? -150 : 150, 0] });
  const l = b.layer(`bubble ${i + 1}`);
  l.rect(-170, -44, 340, 88, { fill: left ? '#e9f9f8' : '#eef0fb', r: 28, stroke: INK, strokeWidth: 4 });
  l.text(txt, -140, 0, { font: NOTE, size: 42, color: INK, valign: 'middle' });
  b.pop(at, { dur: 10, from: 0.5 });
  s2.sfx('notify', { at, volume: -12, pitch: 880 + (i % 3) * 110 });
});
// daftar menggulung ke atas saat chat makin banyak
chats.key(30, { y: 0 }, 'in-out-cubic').key(66, { y: -118 * 4 });

const cap2 = s2.layer('Angka', { fixed: true });
cap2.text('0', 540, 250, { size: 170, weight: 800, color: RED, align: 'center', valign: 'middle', anim: { type: 'count', from: 0, to: 128, at: 4, dur: 64, ease: 'in-quad' } });
cap2.text('chat belum dibalas', 540, 390, { font: HAND, weight: 700, size: 88, color: INK, align: 'center', valign: 'middle' });
s2.camera.shake({ amp: 7, freq: 16, from: 58, to: 84, decay: false, ramp: 4 });
s2.sfx('error', { at: 62, volume: -10 });

// ===================================================================== 3. Ide: bikin sistem
const s3 = p.scene('Bikin sistem', { duration: '4.5s', transition: { type: 'flash', duration: 8 } });
s3.note({ action: 'Lampu ide menyala. Alur otomatis digambar: chat → auto-balas → order tercatat.' });

bulb(s3, { x: 540, y: 380, at: 2 });
s3.sfx('ding', { at: 20, volume: -6, pitch: 988 });

box(s3, { x: 540, y: 820, label: 'Chat masuk', at: 30, color: '#d3f4f3', name: 'kotak 1' });
const panah = s3.layer('Panah');
arrow(panah, { x1: 540, y1: 905, x2: 540, y2: 1005, at: 40 });
box(s3, { x: 540, y: 1090, label: 'Auto-balas + katalog', at: 46, color: '#dfe3f7', name: 'kotak 2' });
arrow(panah, { x1: 540, y1: 1175, x2: 540, y2: 1275, at: 56 });
box(s3, { x: 540, y: 1360, label: 'Order tercatat', at: 62, color: '#d3f4f3', name: 'kotak 3' });
for (const at of [30, 46, 62]) s3.sfx('pop', { at, volume: -8 });
for (const at of [40, 56]) s3.sfx('scratch', { at, dur: 0.35, volume: -10 });

const cap3 = s3.layer('Caption', { fixed: true });
cap3.text('Bikin sistemnya sekali.', 540, 1640, {
  font: HAND,
  weight: 700,
  size: 112,
  color: INK,
  align: 'center',
  valign: 'middle',
  anim: { type: 'words', effect: 'rise', at: 72, stagger: 4, dur: 10 },
  highlight: { words: ['sekali'], style: 'marker', color: TEAL, at: 86, dur: 10, opacity: 0.45 },
});
s3.camera.key(0, { zoom: 1.12, y: -260 }, 'in-out-cubic').key(28, { zoom: 1, y: 0 });
s3.sfx('swoosh', { at: 4, volume: -8 });

// ===================================================================== 4. Jalan sendiri
const s4 = p.scene('Jalan sendiri', { duration: '3.5s', transition: { type: 'slide-up', duration: 12 } });
s4.note({ action: 'Roda gigi berputar sendiri. Founder santai ngopi.' });

gear(s4, { x: 430, y: 430, r: 180, teeth: 12, color: TEAL, speed: 50, name: 'Gir besar' });
gear(s4, { x: 704, y: 294, r: 112, teeth: 8, color: '#8fa0e8', speed: -76, name: 'Gir kecil' });
const floor4 = s4.layer('Lantai');
line(floor4, [[30, 1720], [540, 1712], [1050, 1722]], { size: 8, brush: 'pen', pressure: 'flat' });
chair(floor4, { x: 210, y: 1490 });
const santai = person(s4, { x: 430, y: 1050, pose: 'relax' });
cupArm(santai.group, { steamAt: 6 });
santai.group.float({ amp: 4, period: 3 });
const cap4 = s4.layer('Caption', { fixed: true });
cap4.text('Biar jalan sendiri.', 540, 790, { font: HAND, weight: 700, size: 120, color: BLUE, align: 'center', valign: 'middle', anim: { type: 'chars', effect: 'pop', at: 10, stagger: 1.2, dur: 8 } });
s4.sfx('whoosh', { at: 0, volume: -8 });
s4.sfx('success', { at: 14, volume: -8 });

// ===================================================================== 5. Penutup brand
const s5 = p.scene('Penutup', { duration: '3s', background: BLUE, transition: { type: 'iris', duration: 14 } });
const brand = s5.layer('Brand', { fixed: true });
brand.text('Farid Adam', 540, 900, { size: 132, weight: 800, color: '#ffffff', align: 'center', valign: 'middle', anim: { type: 'chars', effect: 'rise', at: 6, stagger: 1.5, dur: 12 } });
line(brand, [[300, 1000], [540, 990], [790, 1004]], { size: 26, brush: 'brush', color: TEAL, at: 20, dur: 12 });
brand.text('OTOMASI · SISTEM · ENABLEMENT', 540, 1090, { size: 40, weight: 600, color: '#cdd6ff', align: 'center', valign: 'middle', letterSpacing: 6, anim: { type: 'chars', effect: 'fade', at: 28, stagger: 0.6, dur: 8 } });
const cta = s5.layer('Ajakan', { fixed: true, opacity: 0 });
cta.text('ikuti buat tips sistem & AI', 540, 1300, { font: HAND, weight: 700, size: 78, color: '#ffffff', align: 'center', valign: 'middle' });
cta.fadeIn(40, 10);
s5.sfx('riser', { at: 0, dur: 0.8, volume: -16 });
s5.sfx('impact', { at: 18, volume: -12 });

// musik latar ambien (disintesis, bebas hak cipta)
p.sfx('pad', { at: 0, dur: p.seconds, root: 196, chord: [0, 3, 7, 10], brightness: 1100, volume: -20 });

export default p;
