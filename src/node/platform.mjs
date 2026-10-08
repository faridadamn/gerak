// Node rendering platform: canvas binding, fonts, images.
import { createCanvas, Path2D, GlobalFonts, loadImage } from '@napi-rs/canvas';
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { GerakError } from '../core/util.mjs';

export const ENGINE_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
export const FONT_DIR = join(ENGINE_DIR, 'fonts');

let bundledDone = false;
const registered = new Set();

export function bundledFonts() {
  const list = JSON.parse(readFileSync(join(FONT_DIR, 'fonts.json'), 'utf8'));
  return list.map((f) => ({ ...f, path: join(FONT_DIR, f.file) }));
}

export function registerBundledFonts() {
  if (bundledDone) return;
  for (const f of bundledFonts()) {
    if (existsSync(f.path)) GlobalFonts.registerFromPath(f.path, f.family);
  }
  bundledDone = true;
}

export function registerDocFonts(doc) {
  registerBundledFonts();
  for (const f of doc.fonts || []) {
    const key = `${f.path}|${f.family}`;
    if (registered.has(key)) continue;
    if (!existsSync(f.path)) throw new GerakError(`Font tidak ditemukan: ${f.path}`, 'NOT_FOUND');
    GlobalFonts.registerFromPath(f.path, f.family);
    registered.add(key);
  }
}

export function fontFamilies() {
  registerBundledFonts();
  return GlobalFonts.families.map((f) => f.family).sort();
}

export async function loadDocImages(doc) {
  const images = new Map();
  for (const [id, a] of Object.entries(doc.assets || {})) {
    if (a.type !== 'image') continue;
    try {
      images.set(id, await loadImage(readFileSync(a.path)));
    } catch (e) {
      throw new GerakError(`Gagal memuat gambar "${id}" (${a.path}): ${e.message}`, 'ASSET');
    }
  }
  return images;
}

/** Build a renderer environment for a document. */
export async function makeEnv(doc) {
  registerDocFonts(doc);
  const images = await loadDocImages(doc);
  return { createCanvas, Path2D, images, fontEpoch: 0 };
}

export { createCanvas, Path2D };
