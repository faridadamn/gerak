// Module resolve hook: lets scenes `import ... from 'gerak'` without a local install.
const ENGINE = new URL('../index.mjs', import.meta.url).href;
const CORE = new URL('../core/index.mjs', import.meta.url).href;

export async function resolve(specifier, context, next) {
  if (specifier === 'gerak') return { url: ENGINE, shortCircuit: true };
  if (specifier === 'gerak/core') return { url: CORE, shortCircuit: true };
  return next(specifier, context);
}
