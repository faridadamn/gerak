// Render worker: receives frame numbers, returns raw RGBA buffers.
import { parentPort, workerData } from 'node:worker_threads';
import { Renderer } from '../core/render.mjs';
import { makeEnv, createCanvas } from './platform.mjs';

const { doc, scale, background } = workerData;
const env = await makeEnv(doc);
const renderer = new Renderer(doc, env);
const pw = Math.round(doc.width * scale);
const ph = Math.round(doc.height * scale);
const canvas = createCanvas(pw, ph);
const ctx = canvas.getContext('2d');

parentPort.on('message', (msg) => {
  if (msg.type === 'frame') {
    try {
      renderer.renderFrame(ctx, msg.frame, { scale, background });
      const data = ctx.getImageData(0, 0, pw, ph).data;
      const copy = new Uint8Array(data.length);
      copy.set(data);
      parentPort.postMessage({ type: 'frame', frame: msg.frame, buf: copy.buffer }, [copy.buffer]);
    } catch (e) {
      parentPort.postMessage({ type: 'error', frame: msg.frame, message: e.stack || String(e) });
    }
  } else if (msg.type === 'exit') {
    process.exit(0);
  }
});
parentPort.postMessage({ type: 'ready' });
