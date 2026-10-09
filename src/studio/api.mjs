// HTTP client for the studio server.
async function call(method, url, body) {
  // the custom header marks requests as coming from the studio page (the server refuses state changes without it)
  const init = { method, headers: { 'x-gerak-studio': '1' } };
  if (body !== undefined) {
    if (body instanceof Blob || body instanceof ArrayBuffer) init.body = body;
    else {
      init.headers['content-type'] = 'application/json';
      init.body = JSON.stringify(body);
    }
  }
  const r = await fetch(url, init);
  let data = null;
  try {
    data = await r.json();
  } catch {
    data = null;
  }
  if (!r.ok) throw new Error(data?.error || `${r.status} ${r.statusText}`);
  return data;
}

const enc = encodeURIComponent;

export const api = {
  info: () => call('GET', '/api/info'),
  projects: () => call('GET', '/api/projects'),
  load: (file) => call('GET', `/api/project?file=${enc(file)}`),
  save: (file, doc) => call('PUT', `/api/project?file=${enc(file)}`, doc),
  create: (opts) => call('POST', '/api/project/new', opts),
  duplicate: (file, title) => call('POST', '/api/project/duplicate', { file, title }),
  remove: (file) => call('DELETE', `/api/project?file=${enc(file)}`),
  library: () => call('GET', '/api/library'),
  scripts: () => call('GET', '/api/scripts'),
  importItem: (kind, id) => call('POST', '/api/import', { kind, id }),
  assets: () => call('GET', '/api/assets'),
  upload: (file, name) => call('POST', `/api/upload?name=${enc(name ?? file.name)}`, file),
  thumb: (file, blob) => call('POST', `/api/thumb?file=${enc(file)}`, blob),
  mix: (doc) => call('POST', '/api/mix', doc),
  render: (opts) => call('POST', '/api/render', opts),
  job: (id) => call('GET', `/api/jobs/${enc(id)}`),
  outputs: () => call('GET', '/api/outputs'),
};

/** URL for a workspace-relative file. */
export const fileUrl = (path) => `/files/${String(path).split('/').map(enc).join('/')}`;
