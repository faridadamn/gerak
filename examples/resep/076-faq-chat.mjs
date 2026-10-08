// 076 · FAQ gaya chat (tanya → titik mengetik → jawab)
// kategori: edukasi
// fitur: bubble kiri/kanan · indikator mengetik (3 titik float dengan phase) · show range · loop data pertanyaan → posisi otomatis
// pakai: FAQ produk, jawab pertanyaan pembeli, simulasi customer service/chatbot

import { project } from 'gerak';

const p = project({ title: 'FAQ chat', preset: 'reels', fps: 30, background: '#e9eef6' });
const W = p.width;

const s = p.scene('FAQ', { duration: '9s' });

const header = s.layer('Header', { fixed: true });
header.rect(0, 0, W, 230, { fill: '#2D3E8D' });
header.text('Tanya Admin', W / 2, 150, { size: 56, weight: 800, color: '#ffffff', align: 'center', valign: 'middle' });

const faq = [
  { q: 'Bisa kirim ke luar Jawa?', a: 'Bisa kak, semua kota. Ongkir otomatis muncul saat checkout.' },
  { q: 'Kalau barang rusak gimana?', a: 'Kirim video unboxing, kami ganti baru tanpa biaya.' },
  { q: 'Bisa bayar COD?', a: 'Bisa untuk area tertentu. Cek di halaman pembayaran ya.' },
];

let y = 330;
faq.forEach((f, i) => {
  const at = 10 + i * 80;
  // pertanyaan (kiri, putih)
  const q = s.layer(`Tanya ${i + 1}`, { x: 70, y });
  q.text(f.q, 36, 50, { size: 44, weight: 600, color: '#14161f', valign: 'middle', maxWidth: 680, box: { color: '#ffffff', padX: 34, padY: 22, radius: 30, mode: 'block' } });
  q.pop(at, { dur: 10, from: 0.6 });
  s.sfx('notify', { at, volume: -16 });
  y += 150;
  // titik mengetik (kanan) selama 24 frame
  const titik = s.layer(`Mengetik ${i + 1}`, { x: W - 250, y, show: [at + 12, at + 36] });
  titik.rect(-20, 0, 190, 90, { fill: '#00B7B3', r: 45 });
  for (let k = 0; k < 3; k++) {
    const d = titik.group(`titik ${k + 1}`, { x: 30 + k * 52, y: 45 });
    d.layer(`bulat ${k + 1}`).circle(0, 0, 13, { fill: '#ffffff' });
    d.float({ amp: 8, period: 0.6, phase: k * 0.2 });
  }
  // jawaban (kanan, teal)
  const a = s.layer(`Jawab ${i + 1}`, { x: W - 70, y });
  a.text(f.a, -36, 50, { size: 44, weight: 600, color: '#ffffff', align: 'right', valign: 'top', maxWidth: 700, lineHeight: 1.25, box: { color: '#00B7B3', padX: 34, padY: 22, radius: 30, mode: 'block' }, show: [at + 36, null] });
  a.pop(at + 36, { dur: 10, from: 0.6 });
  s.sfx('pop', { at: at + 36, volume: -12 });
  y += 260;
});

export default p;
