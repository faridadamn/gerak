// Template konten promo/listicle 9:16 — tipografi kinetik gaya brand.
//   gerak preview promo.mjs
import { project } from 'gerak';

const BLUE = '#2D3E8D';
const TEAL = '#00B7B3';
const W = 1080;

const p = project({ title: 'Promo', preset: 'reels', fps: 30, background: '#f5f7fb' });

// ---------------------------------------------------------------- Hook
const hook = p.scene('Hook', { duration: '2.5s', background: BLUE });
const h = hook.layer('Judul', { fixed: true });
h.text('Stop kerja', 120, 700, { size: 140, weight: 800, color: '#fff', valign: 'top', anim: { type: 'words', effect: 'rise', at: 2, stagger: 5, dur: 12 } });
h.text('MANUAL.', 120, 860, { size: 170, weight: 800, color: TEAL, valign: 'top', anim: { type: 'scramble', at: 12, dur: 16 }, highlight: { words: ['MANUAL'], style: 'strike', color: '#fff', at: 40, dur: 10 } });
hook.sfx('whoosh', { at: 0, volume: -8 });

// ---------------------------------------------------------------- Poin
const poin = p.scene('Poin', { duration: '3s', transition: { type: 'push-left', duration: 10 } });
const kartu = poin.layer('Kartu', { x: W / 2, y: 960, pivot: [0, 0] });
kartu.rect(-420, -300, 840, 600, { fill: '#fff', r: 48, shadow: { color: 'rgba(0,0,0,0.12)', blur: 40, y: 16 } });
kartu.text('Hemat', 0, -120, { size: 64, weight: 600, color: '#666', align: 'center', valign: 'middle' });
kartu.text('0 jam', 0, 20, { size: 160, weight: 800, color: BLUE, align: 'center', valign: 'middle', fit: 760, anim: { type: 'count', from: 0, to: 20, at: 10, dur: 36, suffix: ' jam' } });
kartu.text('per minggu', 0, 170, { size: 64, weight: 600, color: '#666', align: 'center', valign: 'middle' });
kartu.pop(0, { dur: 16 });
poin.sfx('pop', { at: 2 });
poin.sfx('coin', { at: 46, volume: -6 });

// ---------------------------------------------------------------- CTA
const cta = p.scene('CTA', { duration: '2.5s', background: TEAL, transition: { type: 'zoom', duration: 12 } });
const c = cta.layer('Ajakan', { fixed: true });
c.text('Follow buat', W / 2, 860, { size: 110, weight: 800, color: '#fff', align: 'center', valign: 'middle', anim: { type: 'words', effect: 'stamp', at: 2, stagger: 5, dur: 10 } });
c.text('tips otomasi', W / 2, 1000, { size: 90, weight: 700, color: '#14161f', align: 'center', valign: 'middle', box: { color: '#fff', padX: 30, padY: 16, radius: 26 }, anim: { type: 'chars', effect: 'pop', at: 14, stagger: 1, dur: 8 } });
cta.sfx('impact', { at: 2, volume: -10 });

p.sfx('beat', { at: 0, bpm: 100, bars: 4, volume: -16 });

export default p;
