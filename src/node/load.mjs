// Load a project from a scene script (.mjs/.js/.ts) or a saved project (.json).
import { register } from 'node:module';
import { resolve, dirname, basename, extname } from 'node:path';
import { pathToFileURL } from 'node:url';
import { existsSync } from 'node:fs';
import { Project } from '../author.mjs';
import { GerakError } from '../core/util.mjs';

let hooked = false;
export function installHooks() {
  if (hooked) return;
  register('./hooks.mjs', import.meta.url);
  hooked = true;
}

export function sourceName(src) {
  return basename(src).replace(/\.gerak\.json$/i, '').replace(/\.(mjs|cjs|js|ts|mts|json)$/i, '');
}

export async function loadProject(src) {
  const abs = resolve(src);
  if (!existsSync(abs)) throw new GerakError(`File tidak ditemukan: ${abs}`, 'NOT_FOUND');
  if (/\.json$/i.test(abs)) return Project.open(abs);
  installHooks();
  process.env.GERAK_ROOT = dirname(abs);
  const prevCwd = process.cwd();
  let mod;
  try {
    mod = await import(`${pathToFileURL(abs).href}?v=${Date.now()}`);
  } catch (e) {
    if (e instanceof GerakError) throw e;
    throw e;
  } finally {
    if (process.cwd() !== prevCwd) process.chdir(prevCwd);
  }
  let v = mod.default ?? mod.project;
  if (typeof v === 'function') v = await v();
  if (v instanceof Project) return v;
  if (v && v.doc && v.doc.format === 'gerak') return v; // Project from a different module instance
  if (v && v.format === 'gerak') return new Project(v, { root: dirname(abs) });
  throw new GerakError(
    `${basename(abs)} harus "export default" sebuah project. Contoh:\n  import { project } from 'gerak';\n  const p = project({ preset: 'reels' });\n  ...\n  export default p;`,
    'NO_PROJECT',
  );
}

export { extname };
