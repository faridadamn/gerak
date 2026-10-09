// Minimal POSIX node:path for the browser (used by src/author.mjs inside Gerak Studio).
const norm = (parts) => {
  const out = [];
  for (const p of parts) {
    if (!p || p === '.') continue;
    if (p === '..') out.pop();
    else out.push(p);
  }
  return out;
};
export const sep = '/';
export const isAbsolute = (p) => String(p).startsWith('/');
export function resolve(...args) {
  let acc = '';
  for (const a of args) {
    if (a === undefined || a === null || a === '') continue;
    acc = isAbsolute(a) ? String(a) : `${acc}/${a}`;
  }
  return `/${norm(acc.split('/')).join('/')}`;
}
export function dirname(p) {
  const s = String(p).replace(/\/+$/, '');
  const i = s.lastIndexOf('/');
  return i <= 0 ? (i === 0 ? '/' : '.') : s.slice(0, i);
}
export function basename(p, ext) {
  const b = String(p).replace(/\/+$/, '').split('/').pop();
  return ext && b.endsWith(ext) ? b.slice(0, -ext.length) : b;
}
export function extname(p) {
  const b = basename(p);
  const i = b.lastIndexOf('.');
  return i > 0 ? b.slice(i) : '';
}
export function relative(from, to) {
  const a = norm(resolve(from).split('/'));
  const b = norm(resolve(to).split('/'));
  let i = 0;
  while (i < a.length && i < b.length && a[i] === b[i]) i++;
  return [...Array(a.length - i).fill('..'), ...b.slice(i)].join('/');
}
export const join = (...p) => norm(p.join('/').split('/')).join('/');
export default { sep, isAbsolute, resolve, dirname, basename, extname, relative, join };
