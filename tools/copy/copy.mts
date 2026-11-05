// Website copy as one plain-text file, for editing outside the CMS.
//
//   npx tsx tools/copy/copy.mts export [file]   write the copy (default: copy.txt)
//   npx tsx tools/copy/copy.mts import <file>   read an edited copy back into src/content/cm/
//
// Each piece of copy sits under a marker line:   >> Heading {home.hero.heading}
// The text in {braces} says where it goes: the content file (home → home.json)
// and the field inside it. Everything up to the next marker is the text.
// Blank lines around it are ignored. Each piece is one paragraph on the site, so
// lines inside it are joined with a space.
//
// Import changes only text that already exists in a content file. It reports
// anything it can't place (an unknown marker, a missing one, text written into
// the page code under "fixed."), so nothing is lost silently.
import { readFileSync, writeFileSync } from 'node:fs';

const ROOT = new URL('../..', import.meta.url).pathname;
const CONTENT = `${ROOT}src/content/cm/`;

// Pages in site order: content file, page title.
const PAGES: [string, string][] = [
  ['site', 'HEADER AND FOOTER (every page)'],
  ['home', 'HOME'],
  ['configurations', 'SIGNATURE CONFIGURATIONS (Home page, and one on each audience page)'],
  ['residences', 'RESIDENCES'],
  ['institutions', 'INSTITUTIONS'],
  ['businesses', 'BUSINESSES'],
  ['addons', 'ADD-ONS'],
  ['commission', 'COMMISSION (the builder and the enquiry form)'],
  ['studio', 'STUDIO'],
];

// Fields that aren't copy: image paths, links, and choices the builder reads.
const SKIP = new Set([
  'image', 'grandOrreryUrl', 'icon', 'for', 'setting', 'scope', 'size', 'material', 'drive', 'sun',
  'controller', 'aurora', 'dome', 'domeMount', 'pavilion', 'configuration', 'noSketch',
]);
// Exceptions: under commission these names are groups of copy, not builder choices.
const KEEP_UNDER = new Set(['commission']);

// Plain-English names for the parts of each page.
const LABELS: Record<string, string> = {
  hero: 'Opening', experience: 'The experience', audiences: 'Made for (the three audiences)',
  residence: 'Residences', institution: 'Institutions', business: 'Businesses',
  bespoke: 'Made, not manufactured', process: 'How an orrery comes to be (shown on every page)',
  grandOrrery: 'The Grand Orrery card', closing: 'Closing call to action', items: 'Item',
  points: 'Point', settings: 'Where it belongs', startingPoint: 'Starting point', steps: 'Step',
  mission: 'Why orreries', principles: 'Our craft', features: 'Feature', controller: 'Planetary Controller',
  aurora: 'Aurora', dome: 'Galaxy Dome', pavilion: 'Celestial Pavilion', groups: 'Builder steps',
  scope: 'Step: the system', size: 'Step: planet size', material: 'Step: planet material',
  drive: 'Step: the mechanism', sun: 'Step: the Sun', setting: 'Step: where it will live',
  options: 'Option', domeMount: 'Galaxy Dome mounting', messages: 'Builder hints', summary: 'Sketch panel',
  form: 'Enquiry form',
  // fields
  preheader: 'Pre-header (small capitals above the heading)', heading: 'Heading', lead: 'Opening paragraph',
  body: 'Text', text: 'Text', title: 'Title', name: 'Name', link: 'Link text', button: 'Button',
  primaryButton: 'Main button', secondaryButton: 'Second button', caption: 'Caption', intro: 'Intro',
  tagline: 'Tagline', note: 'Note', label: 'Name', imageAlt: 'Photo description (read aloud by screen readers)',
  pointsHeading: 'Points heading', settingsHeading: 'Heading', compatibility: 'Compatibility line',
  addonsTitle: 'Add-ons step: title', addonsIntro: 'Add-ons step: intro', elevation: 'Elevation tab',
  plan: 'Plan tab', reset: 'Start over link', share: 'Copy link', copied: 'After copying the link',
  sketchLabel: 'Sketch label', buttonText: 'Button', successHeading: 'Thank-you heading',
  successText: 'Thank-you text', auroraNeedsController: 'When Aurora adds the Controller',
  pavilionOutdoor: 'When the Pavilion is switched off indoors', outdoorSuggestPavilion: 'When someone chooses outdoors',
  navResidences: 'Menu: Residences', navInstitutions: 'Menu: Institutions', navBusinesses: 'Menu: Businesses',
  navAddons: 'Menu: Add-ons', navStudio: 'Menu: Studio', navCommission: 'Menu button', footerLine: 'Footer line',
  copyright: 'Copyright line',
};

// Text written into the page code rather than the CMS. Editable here too;
// on import, changes to these are reported to be made in the code by hand.
export const FIXED: [string, string, string][] = [
  ['fixed.form.name', 'Enquiry form: name field', 'Name'],
  ['fixed.form.email', 'Enquiry form: email field', 'Email'],
  ['fixed.form.phone', 'Enquiry form: phone field', 'Phone'],
  ['fixed.form.for', 'Enquiry form: who it is for', 'This orrery is for'],
  ['fixed.form.choose', 'Enquiry form: who it is for, before choosing', 'Choose one'],
  ['fixed.form.residence', 'Enquiry form: choice 1', 'Residence: a home or garden'],
  ['fixed.form.institution', 'Enquiry form: choice 2', 'Institution: a museum, school or public space'],
  ['fixed.form.business', 'Enquiry form: choice 3', 'Business: a hotel, gallery or building'],
  ['fixed.form.other', 'Enquiry form: choice 4', 'Something else'],
  ['fixed.form.organisation', 'Enquiry form: organisation field', 'Organisation'],
  ['fixed.form.location', 'Enquiry form: location field', 'Location'],
  ['fixed.form.locationHint', 'Enquiry form: location example (grey)', 'City, region'],
  ['fixed.form.timeframe', 'Enquiry form: timeframe field', 'Timeframe'],
  ['fixed.form.timeframeHint', 'Enquiry form: timeframe example (grey)', 'e.g. Spring 2027, or flexible'],
  ['fixed.form.message', 'Enquiry form: message field', 'Tell us about your space'],
  ['fixed.form.messageHint', 'Enquiry form: message example (grey)', "The room or garden, who will gather there, what you'd like them to feel…"],
  ['fixed.form.include', 'Enquiry form: sketch checkbox', 'Include my sketch with this enquiry'],
  ['fixed.form.required', 'Enquiry form: required note', 'Required'],
  ['fixed.form.sending', 'Enquiry form: while sending', 'Sending…'],
  ['fixed.form.missing', 'Enquiry form: when a required field is empty', 'Please add your name, a valid email address and a few words about your space.'],
  ['fixed.form.failed', 'Enquiry form: when sending fails', 'Something went wrong. Please try again in a moment.'],
  ['fixed.form.offline', 'Enquiry form: when the server can’t be reached', 'We couldn’t reach the server. Check your connection and try again.'],
  ['fixed.builder.viewSketch', 'Builder on phones: button on the bar at the bottom', 'View sketch'],
  ['fixed.cards.for', 'Configuration cards: before the audience, as in "For residences"', 'For'],
  ['fixed.addons.try', 'Add-ons page: link under each add-on', 'Try it in the builder'],
  ['fixed.footer.grandOrrery', 'Footer: link to the Grand Orrery site', 'The Grand Orrery'],
  ['fixed.404.preheader', 'Page not found: pre-header', '404'],
  ['fixed.404.heading', 'Page not found: heading', 'This page has drifted out of orbit.'],
  ['fixed.404.lead', 'Page not found: text', "It may have moved, or never existed. Let's get you back to familiar skies."],
  ['fixed.404.home', 'Page not found: main button', 'Return home'],
  ['fixed.404.commission', 'Page not found: second button', 'Begin a commission'],
];

// Builder option ids as people say them.
const OPTION_NAMES: Record<string, string> = {
  inner: 'Inner Planets', grand: 'Grand Orrery', glass: 'Hand-blown glass', belts: 'Motors and belts',
  gears: 'Mechanical gearing', sphere: 'Spherical sun', indoor: 'Indoors', outdoor: 'Outdoors',
  ceiling: 'Hung from the ceiling', columns: 'On free-standing columns',
};

// What to call the entries of each list.
const LIST_NOUNS: Record<string, string> = {
  'home.items': 'Choice', 'configurations.items': 'Configuration', 'studio.items': 'Principle',
};

type Json = string | number | boolean | null | Json[] | { [k: string]: Json };
const load = (file: string) => JSON.parse(readFileSync(`${CONTENT}${file}.json`, 'utf8')) as Json;

// Every copy string in a content file, as [path, label] in file order.
function walk(v: Json, path: string[], labels: string[], out: [string, string, string][], file: string) {
  if (typeof v === 'string') {
    if (v.trim()) out.push([[file, ...path].join('.'), labels.join(' › '), v]);
    return;
  }
  if (Array.isArray(v)) {
    const key = path[path.length - 1];
    const noun = LIST_NOUNS[`${file}.${key}`] ?? LABELS[key] ?? 'Item';
    v.forEach((x, i) => {
      const named = x && typeof x === 'object' && !Array.isArray(x) && typeof (x as Record<string, Json>).name === 'string';
      const label = `${noun} ${i + 1}${named ? ` (${(x as Record<string, Json>).name})` : ''}`;
      walk(x, [...path, String(i)], [...labels, label], out, file);
    });
    return;
  }
  if (v && typeof v === 'object') {
    for (const [k, x] of Object.entries(v)) {
      const parent = path[path.length - 1];
      const skip = SKIP.has(k) && !(KEEP_UNDER.has(file) && typeof x === 'object');
      if (skip && !(parent === 'items' && file === 'addons')) continue;
      if (k === 'options' && parent === 'domeMount') { walk(x, [...path, k], [...labels], out, file); continue; }
      // Containers that only group things add nothing to the label.
      if (Array.isArray(x) || k === 'options' || (k === 'groups' && file === 'commission')) { walk(x, [...path, k], labels, out, file); continue; }
      const label = parent === 'options' ? `Option: ${OPTION_NAMES[k] ?? k[0].toUpperCase() + k.slice(1)}` : LABELS[k] ?? k;
      walk(x, [...path, k], [...labels, label], out, file);
    }
  }
}

function fields(): { page: string; title: string; items: [string, string, string][] }[] {
  return PAGES.map(([file, title]) => {
    const items: [string, string, string][] = [];
    walk(load(file), [], [], items, file);
    return { page: file, title, items };
  });
}

const RULE = '='.repeat(72);
function exportCopy(target: string) {
  const out: string[] = [
    'CELESTIAL MECHANICS · WEBSITE COPY',
    '',
    'How to edit:',
    '- Change the text below each ">>" line. Leave the ">>" lines themselves as they are:',
    '  the part in {braces} says where the text goes on the site.',
    '- Each piece of text shows as one paragraph on the site; line breaks inside it are ignored.',
    '- To add or remove an item in a list (a point, a feature, a step), copy or delete its',
    '  ">>" blocks and number them in order; tell me when you send the file back.',
    '- Notes for me: put them on a line starting with "//". They are not added to the site.',
    '- Section headings (lines of ===== and ---) are just for reading.',
    '',
  ];
  for (const p of fields()) {
    out.push(RULE, p.title, RULE, '');
    let section = '';
    for (const [key, label, text] of p.items) {
      const parts = label.split(' › ');
      const head = parts.length > 1 ? parts.slice(0, -1).join(' › ') : '';
      if (head !== section) { section = head; out.push(`--- ${head || 'Page text'} ---`, ''); }
      out.push(`>> ${parts[parts.length - 1]} {${key}}`, text, '');
    }
  }
  out.push(RULE, 'FIXED TEXT (written into the page code, not the CMS; edit here and I will update the code)', RULE, '');
  for (const [key, label, text] of FIXED) out.push(`>> ${label} {${key}}`, text, '');
  writeFileSync(target, out.join('\n').replace(/\n{3,}/g, '\n\n'));
  const n = fields().reduce((a, p) => a + p.items.length, 0);
  console.log(`Wrote ${n} CMS fields and ${FIXED.length} fixed texts to ${target}`);
}

function parse(file: string): Map<string, string> {
  const map = new Map<string, string>();
  let key = '';
  let buf: string[] = [];
  const flush = () => {
    if (!key) return;
    const lines = buf.join('\n').replace(/^\s+|\s+$/g, '');
    // Each piece is one paragraph: join its lines.
    map.set(key, lines.split(/\s*\n\s*/).filter(Boolean).join(' '));
  };
  for (const line of readFileSync(file, 'utf8').replace(/\r\n?/g, '\n').split('\n')) {
    const m = line.match(/^>>.*\{([A-Za-z0-9_.]+)\}\s*$/);
    if (m) { flush(); key = m[1]; buf = []; continue; }
    if (/^(={5,}|---.*---\s*$)/.test(line) || /^\s*\/\//.test(line)) { if (/^={5,}/.test(line)) { flush(); key = ''; buf = []; } continue; }
    if (key) buf.push(line);
  }
  flush();
  return map;
}

function setPath(obj: Json, path: string[], value: string): boolean {
  let cur = obj as Record<string, Json> | Json[];
  for (let i = 0; i < path.length - 1; i++) {
    const k = path[i];
    let next = (cur as Record<string, Json>)[k];
    if (next === undefined && Array.isArray(cur) && Number(k) === cur.length) {
      // A new list item: start it from the previous one's shape.
      const prev = cur[cur.length - 1];
      next = prev && typeof prev === 'object' ? JSON.parse(JSON.stringify(prev)) : '';
      (cur as Json[]).push(next);
    }
    if (next === undefined || next === null || typeof next !== 'object') return false;
    cur = next as Record<string, Json> | Json[];
  }
  const last = path[path.length - 1];
  if (Array.isArray(cur) && Number(last) === cur.length) { cur.push(value); return true; }
  if (typeof (cur as Record<string, Json>)[last] !== 'string') return false;
  (cur as Record<string, Json>)[last] = value;
  return true;
}

function importCopy(source: string) {
  const edited = parse(source);
  const known = new Map(fields().flatMap((p) => p.items.map(([k, , t]) => [k, t] as const)));
  const fixed = new Map(FIXED.map(([k, , t]) => [k, t]));
  const docs = new Map(PAGES.map(([f]) => [f, load(f)]));
  const changed: string[] = [], unplaced: string[] = [], fixedChanged: string[] = [];
  for (const [key, text] of edited) {
    if (fixed.has(key)) { if (fixed.get(key) !== text) fixedChanged.push(`${key}: "${fixed.get(key)}" → "${text}"`); continue; }
    if (known.get(key) === text) continue;
    const [file, ...path] = key.split('.');
    const doc = docs.get(file);
    if (!doc || !setPath(doc, path, text)) { unplaced.push(key); continue; }
    changed.push(key);
  }
  const missing = [...known.keys()].filter((k) => !edited.has(k));
  for (const [file, doc] of docs) {
    const before = readFileSync(`${CONTENT}${file}.json`, 'utf8');
    const after = JSON.stringify(doc, null, 2) + '\n';
    if (JSON.stringify(JSON.parse(before)) !== JSON.stringify(doc)) writeFileSync(`${CONTENT}${file}.json`, after);
  }
  console.log(`Changed ${changed.length} field(s)${changed.length ? ':\n  ' + changed.join('\n  ') : ''}`);
  if (fixedChanged.length) console.log(`Fixed text to change in the code (${fixedChanged.length}):\n  ${fixedChanged.join('\n  ')}`);
  if (unplaced.length) console.log(`Could not place (${unplaced.length}):\n  ${unplaced.join('\n  ')}`);
  if (missing.length) console.log(`Not in the file, left as they were (${missing.length}):\n  ${missing.join('\n  ')}`);
}

const [cmd, file] = process.argv.slice(2);
if (cmd === 'export') exportCopy(file ?? 'copy.txt');
else if (cmd === 'import' && file) importCopy(file);
else { console.log('Usage: npx tsx tools/copy/copy.mts export [file] | import <file>'); process.exit(1); }
