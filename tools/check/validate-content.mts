// Checks every Celestial Mechanics content file (src/content/cm/) against its
// CMS schema (keystatic.cm.ts), reading them the way the CMS does. A mismatch
// would make that page fail to open in the CMS, so run this after changing
// either side:  npx tsx tools/check/validate-content.mts
import { config } from '@keystatic/core';
import { createReader } from '@keystatic/core/reader';
import { readFileSync } from 'node:fs';
import { cmSingletons } from '../../keystatic.cm.ts';

const root = new URL('../..', import.meta.url).pathname;
const reader = createReader(root, config({ storage: { kind: 'local' }, singletons: cmSingletons }));
let bad = 0;
for (const name of Object.keys(cmSingletons)) {
  try {
    const v = await (reader.singletons as Record<string, { readOrThrow: () => Promise<object> }>)[name].readOrThrow();
    // Fields in the file that the schema doesn't know would be dropped on the
    // first save in the CMS.
    const path = (cmSingletons as Record<string, { path?: string }>)[name].path;
    const raw = JSON.parse(readFileSync(`${root}${path}.json`, 'utf8'));
    const lost: string[] = [];
    const walk = (a: unknown, b: unknown, at: string) => {
      if (Array.isArray(a)) return a.forEach((x, i) => walk(x, (b as unknown[])?.[i], `${at}[${i}]`));
      if (a && typeof a === 'object') for (const k of Object.keys(a)) {
        if (!b || typeof b !== 'object' || !(k in b)) lost.push(`${at}.${k}`);
        else walk((a as Record<string, unknown>)[k], (b as Record<string, unknown>)[k], `${at}.${k}`);
      }
    };
    walk(raw, v, name);
    if (lost.length) { bad++; console.log('FAIL', name, 'fields missing from the schema:', lost.join(', ')); }
    else console.log('ok  ', name, `(${Object.keys(v).length} fields)`);
  } catch (e) {
    bad++;
    console.log('FAIL', name, String(e).slice(0, 600));
  }
}
process.exit(bad ? 1 : 0);
