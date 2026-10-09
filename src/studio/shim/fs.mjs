// Browser stand-in for node:fs so the authoring API (src/author.mjs) can run inside Gerak Studio.
// The studio never reads or writes files through it: assets and saving go through the server API.
const unavailable = () => {
  throw new Error('fs tidak tersedia di browser');
};
export const readFileSync = unavailable;
export const writeFileSync = unavailable;
export const existsSync = () => true;
export const mkdirSync = () => {};
export default { readFileSync, writeFileSync, existsSync, mkdirSync };
