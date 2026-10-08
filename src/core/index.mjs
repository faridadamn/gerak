// Isomorphic core (no Node APIs): safe to import in the browser.
export { Renderer, buildTimeline, totalFrames, frameInfo, applyCamera, revealProgress } from './render.mjs';
export { BRUSHES, BRUSH_NAMES, resolveBrush, drawStroke, strokeGeometry } from './brush.mjs';
export { EASINGS, resolveEase, cubicBezier, spring } from './easing.mjs';
export { evalChannel, evalTransform, evalCamera, evalDrawing } from './keys.mjs';
export { drawText, layoutText, fontString } from './text.mjs';
export { synth, encodeWav, SFX_TYPES, RATE } from './synth.mjs';
export { parsePath, samplePath, pathBounds } from './path.mjs';
export { parseColor, mixColor } from './color.mjs';
export { GerakError, toFrames, fmtTime } from './util.mjs';
