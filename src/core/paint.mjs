// Fill/stroke paint resolution: colors, linear/radial gradients.
import { parseColor, rgba } from './color.mjs';

/**
 * Paint spec:
 *  - CSS color string
 *  - { type:'linear', from:[x,y], to:[x,y], stops:[[0,'#fff'],[1,'#000']] }
 *  - { type:'linear', angle: 90, stops } (relative to `bounds`, 0deg = left->right, 90deg = top->bottom)
 *  - { type:'radial', at:[x,y], radius, stops } or relative { type:'radial', stops } (centered in bounds, radius = half the larger side)
 */
export function makePaint(ctx, spec, bounds) {
  if (spec === undefined || spec === null) return null;
  if (typeof spec === 'string') return spec;
  if (typeof spec !== 'object') return String(spec);
  const stops = (spec.stops || []).map((s) => (Array.isArray(s) ? s : [s.offset, s.color]));
  let g;
  if (spec.type === 'radial') {
    let cx;
    let cy;
    let r;
    if (spec.at) [cx, cy] = spec.at;
    else if (bounds) {
      cx = bounds.x + bounds.width / 2;
      cy = bounds.y + bounds.height / 2;
    } else [cx, cy] = [0, 0];
    if (spec.radius !== undefined) r = spec.radius;
    else r = bounds ? Math.max(bounds.width, bounds.height) / 2 : 100; // fits circles/ellipses exactly
    const [fx, fy] = spec.focus ?? [cx, cy];
    g = ctx.createRadialGradient(fx, fy, spec.innerRadius ?? 0, cx, cy, Math.max(0.001, r));
  } else {
    let x0;
    let y0;
    let x1;
    let y1;
    if (spec.from && spec.to) {
      [x0, y0] = spec.from;
      [x1, y1] = spec.to;
    } else {
      const b = bounds || { x: 0, y: 0, width: 100, height: 100 };
      const a = ((spec.angle ?? 90) * Math.PI) / 180;
      const cx = b.x + b.width / 2;
      const cy = b.y + b.height / 2;
      const half = (Math.abs(Math.cos(a)) * b.width + Math.abs(Math.sin(a)) * b.height) / 2;
      x0 = cx - Math.cos(a) * half;
      y0 = cy - Math.sin(a) * half;
      x1 = cx + Math.cos(a) * half;
      y1 = cy + Math.sin(a) * half;
    }
    g = ctx.createLinearGradient(x0, y0, x1, y1);
  }
  for (const [off, col] of stops) {
    const c = parseColor(col);
    g.addColorStop(Math.max(0, Math.min(1, off)), c ? rgba(c) : col);
  }
  return g;
}

export function applyShadow(ctx, shadow) {
  if (!shadow) return;
  const m = ctx.getTransform();
  const k = Math.hypot(m.a, m.b) || 1;
  ctx.shadowColor = shadow.color ?? 'rgba(0,0,0,0.35)';
  ctx.shadowBlur = (shadow.blur ?? 12) * k;
  ctx.shadowOffsetX = (shadow.x ?? 0) * k;
  ctx.shadowOffsetY = (shadow.y ?? 4) * k;
}

export function clearShadow(ctx) {
  ctx.shadowColor = 'rgba(0,0,0,0)';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
}
