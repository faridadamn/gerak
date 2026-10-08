// Gerak live preview (browser). Uses the same renderer as the Node exporter.
import { Renderer, buildTimeline } from '/core/render.mjs';
import { fmtTime } from '/core/util.mjs';

const $ = (id) => document.getElementById(id);
const view = $('view');
const vctx = view.getContext('2d');
const overlay = $('overlay');
const octx = overlay.getContext('2d');
const tlc = $('timeline');
const tctx = tlc.getContext('2d');
const audio = $('audio');

const env = {
  createCanvas(w, h) {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    return c;
  },
  Path2D: window.Path2D,
  images: new Map(),
  fontEpoch: 0,
};

const S = {
  doc: null,
  renderer: null,
  tl: null,
  frame: 0,
  playing: false,
  acc: 0,
  lastTs: 0,
  dirty: true,
  scale: 1,
  version: -1,
  hidden: new Set(JSON.parse(sessionStorageGet('gerak.hidden') || '[]')),
  audioVersion: -1,
  hasAudio: false,
};

function sessionStorageGet(k) {
  try {
    return sessionStorage.getItem(k);
  } catch {
    return null;
  }
}
function sessionStorageSet(k, v) {
  try {
    sessionStorage.setItem(k, v);
  } catch {
    /* ignore */
  }
}

// ------------------------------------------------------------ loading

async function loadFonts() {
  const list = await (await fetch('/fonts.json')).json();
  const loads = list.map(async (f) => {
    try {
      const face = new FontFace(f.family, `url(${f.url})`, { weight: String(f.weight), style: f.style || 'normal' });
      await face.load();
      document.fonts.add(face);
    } catch (e) {
      console.warn('font gagal', f, e);
    }
  });
  await Promise.all(loads);
  env.fontEpoch++;
}

async function loadImages(doc) {
  const jobs = Object.entries(doc.assets || {}).map(
    ([id, a]) =>
      new Promise((res) => {
        if (a.type !== 'image') return res();
        const img = new Image();
        img.onload = () => {
          env.images.set(id, img);
          res();
        };
        img.onerror = () => res();
        img.src = a.url;
      }),
  );
  await Promise.all(jobs);
}

function applyHidden(doc) {
  const walk = (n) => {
    if (S.hidden.has(n.id)) n.visible = false;
    (n.children || []).forEach(walk);
  };
  doc.scenes.forEach((s) => s.layers.forEach(walk));
}

async function loadDoc() {
  setStatus('busy', 'memuat…');
  const r = await fetch('/doc.json', { cache: 'no-store' });
  const data = await r.json();
  if (data.error) showError(data.error);
  else hideError();
  if (!data.doc) return;
  const doc = data.doc;
  applyHidden(doc);
  env.images = new Map();
  await loadImages(doc);
  S.doc = doc;
  S.version = data.version;
  S.renderer = new Renderer(doc, env);
  S.tl = buildTimeline(doc);
  S.frame = Math.min(S.frame, S.tl.total - 1);
  S.hasAudio = (doc.audio || []).length > 0;
  $('title').textContent = doc.title || data.name;
  document.title = `${doc.title || data.name} · Gerak`;
  $('meta').textContent = `${data.name} · ${doc.width}×${doc.height} · ${doc.fps} fps · ${fmtTime(S.tl.total, doc.fps)} · ${doc.scenes.length} scene`;
  $('fTotal').textContent = S.tl.total - 1;
  buildSide();
  layout();
  if (!data.error) setStatus('ok', `build #${data.version}`);
  S.dirty = true;
  if ($('cAudio').checked) prepareAudio();
}

function setStatus(kind, text) {
  $('status').className = `status ${kind}`;
  $('statusText').textContent = text;
}
function showError(msg) {
  $('error').hidden = false;
  $('errorText').textContent = msg;
  setStatus('err', 'error');
}
function hideError() {
  $('error').hidden = true;
}

// ------------------------------------------------------------ sidebar

function buildSide() {
  const doc = S.doc;
  const ol = $('scenes');
  ol.innerHTML = '';
  S.tl.entries.forEach((e) => {
    const li = document.createElement('li');
    li.dataset.start = e.start;
    li.innerHTML = `<span>${e.index + 1}. ${esc(e.scene.name)}</span><span class="d">${((e.end - e.start) / doc.fps).toFixed(1)}s</span>`;
    li.onclick = () => seek(e.start + (e.transition ? e.transition.duration : 0));
    ol.appendChild(li);
  });
  const tree = $('tree');
  tree.innerHTML = '';
  const row = (n, depth) => {
    const div = document.createElement('div');
    const off = S.hidden.has(n.id);
    div.className = `node${off ? ' off' : ''}`;
    div.style.paddingLeft = `${6 + depth * 14}px`;
    const els = (n.elements || []).length;
    div.innerHTML = `<span class="eye">${off ? '◌' : '●'}</span><span class="id">${esc(n.id)}</span><span class="ty">${n.type}</span>${els ? `<span class="el">${els} el</span>` : ''}`;
    div.querySelector('.eye').onclick = () => {
      if (S.hidden.has(n.id)) S.hidden.delete(n.id);
      else S.hidden.add(n.id);
      sessionStorageSet('gerak.hidden', JSON.stringify([...S.hidden]));
      loadDoc();
    };
    tree.appendChild(div);
    (n.children || []).forEach((c) => row(c, depth + 1));
  };
  doc.scenes.forEach((s) => {
    const h = document.createElement('div');
    h.className = 'scenehdr';
    h.textContent = s.name;
    tree.appendChild(h);
    s.layers.forEach((n) => row(n, 0));
  });
}

function esc(s) {
  return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
}

// ------------------------------------------------------------ layout & drawing

function layout() {
  if (!S.doc) return;
  const wrap = $('stageWrap').getBoundingClientRect();
  const pad = 24;
  const k = Math.min((wrap.width - pad * 2) / S.doc.width, (wrap.height - pad * 2) / S.doc.height);
  const cssW = Math.max(40, Math.floor(S.doc.width * k));
  const cssH = Math.max(40, Math.floor(S.doc.height * k));
  const dpr = window.devicePixelRatio || 1;
  S.scale = Math.min(1, (cssW * dpr) / S.doc.width);
  const pw = Math.round(S.doc.width * S.scale);
  const ph = Math.round(S.doc.height * S.scale);
  for (const c of [view, overlay]) {
    c.width = pw;
    c.height = ph;
    c.style.width = `${cssW}px`;
    c.style.height = `${cssH}px`;
  }
  const r = tlc.getBoundingClientRect();
  tlc.width = Math.round(r.width * dpr);
  tlc.height = Math.round(76 * dpr);
  S.dirty = true;
}

function drawFrame() {
  const doc = S.doc;
  const t0 = performance.now();
  if ($('cOnion').checked && !S.playing) drawOnion();
  else S.renderer.renderFrame(vctx, S.frame, { scale: S.scale });
  const ms = performance.now() - t0;
  $('perf').textContent = `${ms.toFixed(0)} ms`;
  $('fNow').textContent = S.frame;
  $('tNow').textContent = fmtTime(S.frame, doc.fps);
  const cur = S.tl.entries.filter((e) => S.frame >= e.start && S.frame < e.end).pop();
  $('sceneNow').textContent = cur ? `· ${cur.scene.name} (lokal ${S.frame - cur.start})` : '';
  [...$('scenes').children].forEach((li, i) => li.classList.toggle('on', cur && cur.index === i));
  drawOverlay();
  drawTimeline();
}

let ghost = null;
function drawOnion() {
  const pw = view.width;
  const ph = view.height;
  if (!ghost || ghost.width !== pw || ghost.height !== ph) ghost = env.createCanvas(pw, ph);
  const g = ghost.getContext('2d');
  vctx.save();
  vctx.setTransform(1, 0, 0, 1, 0, 0);
  vctx.fillStyle = typeof S.doc.background === 'string' ? S.doc.background : '#fff';
  vctx.fillRect(0, 0, pw, ph);
  const draw = (f, color, a) => {
    if (f < 0 || f >= S.tl.total) return;
    S.renderer.renderFrame(g, f, { scale: S.scale, background: false, effects: false });
    g.save();
    g.globalCompositeOperation = 'source-atop';
    g.fillStyle = color;
    g.fillRect(0, 0, pw, ph);
    g.restore();
    vctx.globalAlpha = a;
    vctx.drawImage(ghost, 0, 0);
  };
  draw(S.frame - 4, '#e03131', 0.2);
  draw(S.frame - 2, '#e03131', 0.4);
  draw(S.frame + 4, '#1c7ed6', 0.2);
  draw(S.frame + 2, '#1c7ed6', 0.4);
  vctx.globalAlpha = 1;
  S.renderer.renderFrame(g, S.frame, { scale: S.scale, background: false, effects: false });
  vctx.drawImage(ghost, 0, 0);
  vctx.restore();
}

function drawOverlay() {
  const W = overlay.width;
  const H = overlay.height;
  octx.clearRect(0, 0, W, H);
  if ($('cGrid').checked) {
    octx.strokeStyle = 'rgba(0,183,179,0.7)';
    octx.lineWidth = 1;
    octx.beginPath();
    for (const k of [1 / 3, 2 / 3]) {
      octx.moveTo(Math.round(W * k) + 0.5, 0);
      octx.lineTo(Math.round(W * k) + 0.5, H);
      octx.moveTo(0, Math.round(H * k) + 0.5);
      octx.lineTo(W, Math.round(H * k) + 0.5);
    }
    octx.moveTo(W / 2 - 10, H / 2);
    octx.lineTo(W / 2 + 10, H / 2);
    octx.moveTo(W / 2, H / 2 - 10);
    octx.lineTo(W / 2, H / 2 + 10);
    octx.stroke();
  }
  if ($('cSafe').checked) {
    const portrait = S.doc.height / S.doc.width > 1.6;
    octx.fillStyle = 'rgba(255, 80, 80, 0.18)';
    octx.strokeStyle = 'rgba(255, 120, 120, 0.9)';
    octx.font = `${Math.max(10, W * 0.022)}px sans-serif`;
    if (portrait) {
      // approximate TikTok / Reels UI coverage
      const zones = [
        [0, 0, W, H * 0.09, 'UI atas'],
        [0, H * 0.79, W, H * 0.21, 'caption / musik'],
        [W * 0.86, H * 0.42, W * 0.14, H * 0.37, 'tombol'],
      ];
      for (const [x, y, w, h, label] of zones) {
        octx.fillRect(x, y, w, h);
        octx.fillStyle = 'rgba(255,220,220,0.95)';
        octx.fillText(label, x + 6, y + Math.max(12, W * 0.03));
        octx.fillStyle = 'rgba(255, 80, 80, 0.18)';
      }
    }
    octx.setLineDash([6, 4]);
    for (const k of [0.05, 0.1]) octx.strokeRect(W * k, H * k, W * (1 - 2 * k), H * (1 - 2 * k));
    octx.setLineDash([]);
  }
}

function drawTimeline() {
  const dpr = window.devicePixelRatio || 1;
  const W = tlc.width;
  const H = tlc.height;
  const doc = S.doc;
  const total = S.tl.total;
  const x = (f) => (f / total) * W;
  tctx.clearRect(0, 0, W, H);
  // ruler
  tctx.fillStyle = '#8a909c';
  tctx.font = `${10 * dpr}px sans-serif`;
  const secs = total / doc.fps;
  const step = secs > 120 ? 10 : secs > 40 ? 5 : secs > 12 ? 2 : 1;
  for (let s = 0; s <= secs; s += step) {
    const xx = x(s * doc.fps);
    tctx.fillRect(xx, 0, 1, 6 * dpr);
    tctx.fillText(`${s}s`, xx + 3 * dpr, 10 * dpr);
  }
  // scenes
  const y0 = 16 * dpr;
  const h = 30 * dpr;
  S.tl.entries.forEach((e, i) => {
    const a = x(e.start);
    const b = x(e.end);
    tctx.fillStyle = i % 2 ? '#2d3e8d' : '#3a4fae';
    tctx.fillRect(a, y0, b - a - 1, h);
    if (e.transition) {
      tctx.fillStyle = 'rgba(0,183,179,0.55)';
      tctx.fillRect(a, y0, x(e.start + e.transition.duration) - a, h);
    }
    tctx.fillStyle = '#fff';
    tctx.font = `${11 * dpr}px sans-serif`;
    tctx.save();
    tctx.beginPath();
    tctx.rect(a, y0, b - a - 2, h);
    tctx.clip();
    tctx.fillText(`${i + 1}. ${e.scene.name}`, a + 6 * dpr, y0 + 19 * dpr);
    tctx.restore();
  });
  // audio markers
  const ay = y0 + h + 6 * dpr;
  for (const c of doc.audio || []) {
    let f = c.at || 0;
    if (c.scene) {
      const e = S.tl.entries.find((q) => q.scene.id === c.scene);
      if (!e) continue;
      f += e.start;
    }
    tctx.fillStyle = c.sfx ? '#ffc857' : '#00b7b3';
    tctx.fillRect(x(f), ay, Math.max(2, 3 * dpr), 14 * dpr);
  }
  tctx.fillStyle = '#8a909c';
  tctx.font = `${9 * dpr}px sans-serif`;
  if ((doc.audio || []).length) tctx.fillText('audio', 2 * dpr, ay + 22 * dpr);
  // playhead
  const px = x(S.frame);
  tctx.fillStyle = '#ff6b6b';
  tctx.fillRect(px - dpr, 0, 2 * dpr, H);
}

// ------------------------------------------------------------ transport

function seek(f) {
  if (!S.tl) return;
  S.frame = Math.max(0, Math.min(S.tl.total - 1, Math.round(f)));
  S.acc = 0;
  if (S.playing && $('cAudio').checked && audio.src) audio.currentTime = S.frame / S.doc.fps;
  S.dirty = true;
}

function play(on = !S.playing) {
  if (!S.doc) return;
  S.playing = on;
  $('bPlay').textContent = on ? '⏸' : '▶';
  S.lastTs = performance.now();
  S.acc = 0;
  if (on && S.frame >= S.tl.total - 1) S.frame = 0;
  if ($('cAudio').checked && S.hasAudio && audio.src) {
    if (on) {
      audio.currentTime = S.frame / S.doc.fps;
      audio.playbackRate = +$('speed').value;
      audio.play().catch(() => {});
    } else audio.pause();
  }
  S.dirty = true;
}

function prepareAudio() {
  if (!S.hasAudio) {
    audio.removeAttribute('src');
    return;
  }
  if (S.audioVersion !== S.version) {
    audio.src = `/audio.wav?v=${S.version}`;
    S.audioVersion = S.version;
  }
}

function tick(ts) {
  if (S.doc && S.playing) {
    const fps = S.doc.fps;
    // wall clock drives playback; audio follows (and leads only while it is actually playing)
    const wantAudio = $('cAudio').checked && S.hasAudio && audio.src && !audio.paused;
    const audioLive = wantAudio && audio.readyState >= 3 && audio.currentTime > 0;
    const dt = Math.min(0.25, (ts - S.lastTs) / 1000);
    S.acc += dt * fps * +$('speed').value;
    const whole = Math.floor(S.acc);
    let next = S.frame;
    if (whole > 0) {
      S.acc -= whole;
      next = S.frame + whole;
    }
    if (audioLive) {
      const af = Math.floor(audio.currentTime * fps);
      if (Math.abs(af - next) <= fps * 0.25) next = Math.max(af, S.frame); // lock to audio when close
      else audio.currentTime = next / fps; // resync drifted audio
    }
    if (next !== S.frame) {
      S.frame = next;
      if (S.frame >= S.tl.total) {
        if ($('cLoop').checked) {
          S.frame %= S.tl.total;
          if (wantAudio) audio.currentTime = S.frame / fps;
        } else {
          S.frame = S.tl.total - 1;
          play(false);
        }
      }
      S.dirty = true;
    }
  }
  S.lastTs = ts;
  if (S.doc && S.dirty) {
    S.dirty = false;
    try {
      drawFrame();
    } catch (e) {
      showError(`Render error di browser: ${e.stack || e}`);
      play(false);
    }
  }
  requestAnimationFrame(tick);
}

function scrub(ev) {
  const r = tlc.getBoundingClientRect();
  const k = Math.max(0, Math.min(1, (ev.clientX - r.left) / r.width));
  seek(k * (S.tl.total - 1));
}

$('bPlay').onclick = () => play();
$('bPrev').onclick = () => seek(S.frame - 1);
$('bNext').onclick = () => seek(S.frame + 1);
$('bStart').onclick = () => seek(0);
$('bEnd').onclick = () => seek(S.tl.total - 1);
for (const id of ['cSafe', 'cGrid', 'cOnion']) $(id).onchange = () => (S.dirty = true);
$('cAudio').onchange = () => {
  if ($('cAudio').checked) prepareAudio();
  else audio.pause();
  if (S.playing) play(true);
};
$('speed').onchange = () => {
  audio.playbackRate = +$('speed').value;
};
$('bPng').onclick = () => {
  const c = env.createCanvas(S.doc.width, S.doc.height);
  S.renderer.renderFrame(c.getContext('2d'), S.frame, { scale: 1 });
  c.toBlob((b) => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(b);
    a.download = `frame-${S.frame}.png`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  });
};
let dragging = false;
tlc.addEventListener('pointerdown', (e) => {
  dragging = true;
  tlc.setPointerCapture(e.pointerId);
  scrub(e);
});
tlc.addEventListener('pointermove', (e) => dragging && scrub(e));
tlc.addEventListener('pointerup', () => (dragging = false));
window.addEventListener('resize', layout);
window.addEventListener('keydown', (e) => {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
  const big = e.shiftKey ? 10 : 1;
  if (e.code === 'Space') {
    e.preventDefault();
    play();
  } else if (e.key === 'ArrowLeft') seek(S.frame - big);
  else if (e.key === 'ArrowRight') seek(S.frame + big);
  else if (e.key === 'Home') seek(0);
  else if (e.key === 'End') seek(S.tl.total - 1);
  else if (e.key === '[' || e.key === ']') {
    const starts = S.tl.entries.map((q) => q.start + (q.transition ? q.transition.duration : 0));
    const next = e.key === ']' ? starts.find((s) => s > S.frame) : [...starts].reverse().find((s) => s < S.frame);
    if (next !== undefined) seek(next);
  } else if (e.key === 'o') {
    $('cOnion').checked = !$('cOnion').checked;
    S.dirty = true;
  } else if (e.key === 'g') {
    $('cGrid').checked = !$('cGrid').checked;
    S.dirty = true;
  } else if (e.key === 's') {
    $('cSafe').checked = !$('cSafe').checked;
    S.dirty = true;
  }
});

// keep keyboard shortcuts working after clicking a control
for (const el of document.querySelectorAll('footer input, footer select, footer button')) {
  el.addEventListener(el.tagName === 'BUTTON' ? 'click' : 'change', () => setTimeout(() => el.blur(), 0));
}

// live reload
function connect() {
  const es = new EventSource('/events');
  es.addEventListener('reload', () => loadDoc());
  es.addEventListener('error', (ev) => {
    if (ev.data) showError(JSON.parse(ev.data).message);
  });
  es.onerror = () => setStatus('err', 'server putus — mencoba lagi');
  es.addEventListener('hello', () => setStatus('ok', 'terhubung'));
}

await loadFonts();
await loadDoc();
connect();
requestAnimationFrame(tick);
