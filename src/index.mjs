// Gerak — code-first video engine. Public API (Node).
export { Project, project, open, PRESETS, NodeHandle, TrackHandle, SceneHandle, CameraHandle, ElementRef } from './author.mjs';
export { Renderer, buildTimeline, totalFrames, frameInfo } from './core/render.mjs';
export { BRUSHES, BRUSH_NAMES, resolveBrush } from './core/brush.mjs';
export { EASINGS, resolveEase, cubicBezier, spring } from './core/easing.mjs';
export {
  catmullRom,
  line,
  ellipsePoints,
  pathPoints,
  withPressure,
  pressureProfile,
  wobble,
  jitter,
  translate,
  scale,
  rotate,
  mirror,
  normalizePoints,
} from './core/geom.mjs';
export { parsePath, pathToString, samplePath, pathBounds, pathLength, rectPath, ellipsePath, polygonPath, smoothPath, starPath, arrowPath, arcPath } from './core/path.mjs';
export { parseColor, mixColor, withAlpha, shade } from './core/color.mjs';
export { rng, noise1 } from './core/rng.mjs';
export { synth, encodeWav, SFX_TYPES } from './core/synth.mjs';
export { GerakError, toFrames, fmtTime } from './core/util.mjs';
export {
  renderFrameImage,
  saveFrame,
  saveSequence,
  renderSheet,
  renderOnion,
  renderMovie,
  renderAudio,
  planAudio,
  ffmpegAvailable,
} from './node/export.mjs';
export { makeEnv, fontFamilies, bundledFonts } from './node/platform.mjs';
