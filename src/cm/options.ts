// Celestial Mechanics: the fixed set of customisations and add-ons.
//
// The ids here are the "machine" names used by the builder, the drawings and
// the enquiry email. Their wording (labels and descriptions) lives in the CMS
// (src/content/cm/commission.json and addons.json), so editors can rename an
// option without touching code. Adding a brand-new option means adding its id
// here and its wording in the CMS.

export const SETTINGS = ['indoor', 'outdoor'] as const;
export type Setting = (typeof SETTINGS)[number];

export const GROUPS = {
  scope: ['tellurion', 'inner', 'grand'],
  size: ['small', 'medium', 'large'],
  material: ['pe', 'glass'],
  drive: ['belts', 'gears'],
  sun: ['sphere', 'fireball'],
} as const;
export type GroupId = keyof typeof GROUPS;
export const GROUP_IDS = Object.keys(GROUPS) as GroupId[];

export const ADDONS = ['controller', 'aurora', 'dome', 'pavilion'] as const;
export type AddonId = (typeof ADDONS)[number];

export const DOME_MOUNTS = ['ceiling', 'columns'] as const;
export type DomeMount = (typeof DOME_MOUNTS)[number];

export const AUDIENCES = ['residence', 'institution', 'business'] as const;
export type Audience = (typeof AUDIENCES)[number];

export interface Config {
  setting: Setting;
  scope: (typeof GROUPS.scope)[number];
  size: (typeof GROUPS.size)[number];
  material: (typeof GROUPS.material)[number];
  drive: (typeof GROUPS.drive)[number];
  sun: (typeof GROUPS.sun)[number];
  controller: boolean;
  aurora: boolean;
  dome: boolean;
  domeMount: DomeMount;
  pavilion: boolean;
}

export const DEFAULT_CONFIG: Config = {
  setting: 'indoor',
  scope: 'grand',
  size: 'medium',
  material: 'glass',
  drive: 'belts',
  sun: 'sphere',
  controller: false,
  aurora: false,
  dome: false,
  domeMount: 'ceiling',
  pavilion: false,
};

// Rules between options. Aurora needs the Planetary Controller; the Pavilion
// is for outdoor installations. Returns a corrected copy.
export function normalise(c: Config): Config {
  const n = { ...c };
  if (n.aurora) n.controller = true;
  if (n.setting === 'indoor') n.pavilion = false;
  return n;
}

// Compact, shareable form for links: /commission/?c=…
// order: setting scope size material drive sun, then add-on flags.
export function encode(c: Config): string {
  const idx = (list: readonly string[], v: string) => Math.max(0, list.indexOf(v));
  return [
    idx(SETTINGS, c.setting),
    idx(GROUPS.scope, c.scope),
    idx(GROUPS.size, c.size),
    idx(GROUPS.material, c.material),
    idx(GROUPS.drive, c.drive),
    idx(GROUPS.sun, c.sun),
    c.controller ? 1 : 0,
    c.aurora ? 1 : 0,
    c.dome ? (c.domeMount === 'columns' ? 2 : 1) : 0,
    c.pavilion ? 1 : 0,
  ].join('');
}

export function decode(s: string | null | undefined): Config | null {
  if (!s || !/^\d{10}$/.test(s)) return null;
  const d = s.split('').map(Number);
  const pick = <T extends readonly string[]>(list: T, i: number): T[number] => list[i] ?? list[0];
  return normalise({
    setting: pick(SETTINGS, d[0]),
    scope: pick(GROUPS.scope, d[1]),
    size: pick(GROUPS.size, d[2]),
    material: pick(GROUPS.material, d[3]),
    drive: pick(GROUPS.drive, d[4]),
    sun: pick(GROUPS.sun, d[5]),
    controller: d[6] === 1,
    aurora: d[7] === 1,
    dome: d[8] > 0,
    domeMount: d[8] === 2 ? 'columns' : 'ceiling',
    pavilion: d[9] === 1,
  });
}

// The planets each system carries, sun outward. Pluto rides along with the
// Grand Orrery as a bonus.
export const BODIES = {
  tellurion: ['earth'],
  inner: ['mercury', 'venus', 'earth', 'mars'],
  grand: ['mercury', 'venus', 'earth', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto'],
} as const;
