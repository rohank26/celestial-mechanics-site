// Engraved line drawings of any orrery configuration, in the brand's brass on
// black. Returns SVG markup as a string, so the same drawing is used at build
// time (signature configurations, audience pages) and live in the builder.
//
//   planSVG(config, id)       top-down view
//   elevationSVG(config, id)  side view
//
// `id` keeps gradient ids unique when several drawings share a page.
// Illustrative only: not to scale.
import { BODIES, type Config } from './options.ts';

const BRASS = '#D8B25C';
const BRONZE = '#806A3C';
const PALE = '#F2D78E';
const INK = '#070605';

const n = (v: number) => (Math.round(v * 10) / 10).toString();

// Planet base radii (plan units) and surface colours (light, mid, dark).
const PLANETS: Record<string, { r: number; g: [string, string, string]; label: string }> = {
  mercury: { r: 4, g: ['#E2DDD6', '#A39C93', '#5E5953'], label: 'Mercury' },
  venus: { r: 6.2, g: ['#FBEBC4', '#E3BF7E', '#9C7A43'], label: 'Venus' },
  earth: { r: 6.6, g: ['#BFE0FF', '#3F86D4', '#1E4A7E'], label: 'Earth' },
  mars: { r: 4.8, g: ['#F2A27E', '#C2552F', '#6E2A14'], label: 'Mars' },
  jupiter: { r: 12.5, g: ['#F6E2C4', '#C99B6D', '#7A5534'], label: 'Jupiter' },
  saturn: { r: 10.5, g: ['#FBEDC6', '#DDBF7C', '#8C7240'], label: 'Saturn' },
  uranus: { r: 8, g: ['#D9F5F7', '#7FCBD4', '#3D7F88'], label: 'Uranus' },
  neptune: { r: 7.8, g: ['#B9C8FF', '#4A69D6', '#22347A'], label: 'Neptune' },
  pluto: { r: 2.8, g: ['#F1E4D2', '#B9A58C', '#6B5C4A'], label: 'Pluto' },
  moon: { r: 2.4, g: ['#FFFFFF', '#CFC6AE', '#6A6250'], label: 'Moon' },
};
const SIZE_SCALE = { small: 0.62, medium: 0.88, large: 1.22 } as const;
// Where each planet sits around its orbit in the plan view (degrees).
const ANGLE: Record<string, number> = { mercury: 300, venus: 140, earth: 30, mars: 215, jupiter: 330, saturn: 160, uranus: 75, neptune: 250, pluto: 115 };

function defs(id: string, c: Config, bodies: readonly string[]) {
  const glass = c.material === 'glass';
  const grads = [...bodies, 'moon'].map((b) => {
    const g = PLANETS[b].g;
    return `<radialGradient id="${id}-${b}" cx=".34" cy=".3" r=".75"><stop offset="0" stop-color="${g[0]}"/><stop offset=".55" stop-color="${g[1]}"/><stop offset="1" stop-color="${g[2]}"/></radialGradient>`;
  });
  return `<defs>${grads.join('')}
<radialGradient id="${id}-sun" cx=".42" cy=".38"><stop offset="0" stop-color="#FFFDF0"/><stop offset=".5" stop-color="#FFE27A"/><stop offset="1" stop-color="#E9A520"/></radialGradient>
<radialGradient id="${id}-glow"><stop offset="0" stop-color="#FFF6D0" stop-opacity=".9"/><stop offset=".3" stop-color="#FFD25A" stop-opacity=".45"/><stop offset="1" stop-color="#FFB800" stop-opacity="0"/></radialGradient>
<radialGradient id="${id}-fire" cx=".5" cy=".62" r=".6"><stop offset="0" stop-color="#FFFBE6"/><stop offset=".35" stop-color="#FFD25A"/><stop offset=".75" stop-color="#F08A24"/><stop offset="1" stop-color="#B8420F"/></radialGradient>
${glass ? '' : ''}</defs>`;
}

function planet(id: string, body: string, x: number, y: number, r: number, c: Config, sat = false) {
  const glass = c.material === 'glass';
  const fill = `url(#${id}-${body})`;
  let s = '';
  if (sat) s += `<ellipse cx="${n(x)}" cy="${n(y)}" rx="${n(r * 2.1)}" ry="${n(r * 0.62)}" fill="none" stroke="${PALE}" stroke-width="1.4" transform="rotate(-20 ${n(x)} ${n(y)})" opacity=".85"/>`;
  if (glass) {
    s += `<circle cx="${n(x)}" cy="${n(y)}" r="${n(r)}" fill="${fill}" fill-opacity=".78" stroke="#FFF6E0" stroke-opacity=".75" stroke-width=".8"/>`;
    s += `<ellipse cx="${n(x - r * 0.36)}" cy="${n(y - r * 0.4)}" rx="${n(r * 0.32)}" ry="${n(r * 0.18)}" fill="#FFFFFF" opacity=".8" transform="rotate(-35 ${n(x - r * 0.36)} ${n(y - r * 0.4)})"/>`;
  } else {
    s += `<circle cx="${n(x)}" cy="${n(y)}" r="${n(r)}" fill="${fill}" stroke="${INK}" stroke-width=".8"/>`;
  }
  return s;
}

function sun(id: string, c: Config, x: number, y: number, r: number) {
  if (c.sun === 'fireball') {
    const pts: string[] = [];
    const k = 18;
    for (let i = 0; i <= k * 2; i++) {
      const a = (Math.PI * 2 * i) / (k * 2) - Math.PI / 2;
      const up = Math.max(0, -Math.sin(a)); // flames lick upward
      const rr = i % 2 === 0 ? r * (1.05 + 0.75 * up) : r * (0.72 + 0.2 * up);
      pts.push(`${n(x + Math.cos(a) * rr)} ${n(y + Math.sin(a) * rr)}`);
    }
    return `<circle cx="${n(x)}" cy="${n(y)}" r="${n(r * 3)}" fill="url(#${id}-glow)"/>` +
      `<path d="M${pts.join(' L')} Z" fill="url(#${id}-fire)" stroke="#FFE9A0" stroke-width=".6" stroke-linejoin="round"/>` +
      `<circle cx="${n(x)}" cy="${n(y + r * 0.15)}" r="${n(r * 0.45)}" fill="#FFFBEA" opacity=".9"/>`;
  }
  return `<circle cx="${n(x)}" cy="${n(y)}" r="${n(r * 2.6)}" fill="url(#${id}-glow)"/><circle cx="${n(x)}" cy="${n(y)}" r="${n(r)}" fill="url(#${id}-sun)"/>`;
}

function gearPath(cx: number, cy: number, rRoot: number, rTip: number, teeth: number) {
  const pts: string[] = [];
  for (let i = 0; i < teeth; i++) {
    const a0 = (Math.PI * 2 * i) / teeth;
    const s = (Math.PI * 2) / teeth;
    for (const [f, r] of [[0, rRoot], [0.12, rRoot], [0.22, rTip], [0.48, rTip], [0.58, rRoot]] as const) {
      const a = a0 + s * f;
      pts.push(`${n(cx + r * Math.cos(a))} ${n(cy + r * Math.sin(a))}`);
    }
  }
  return `M${pts.join(' L')} Z`;
}

// ---------------------------------------------------------------- plan
export function planSVG(c: Config, id = 'p'): string {
  const bodies = BODIES[c.scope];
  const k = SIZE_SCALE[c.size] * (c.scope === 'tellurion' ? 1.6 : c.scope === 'inner' ? 1.25 : 1);
  const o: string[] = [];
  const rad = (d: number) => (d * Math.PI) / 180;

  // instrument dial
  o.push(`<circle r="192" fill="none" stroke="${BRONZE}" stroke-width="1"/>`);
  const ticks: string[] = [];
  for (let d = 0; d < 360; d += 5) {
    const L = d % 30 === 0 ? 10 : 5;
    ticks.push(`M${n(Math.cos(rad(d)) * 192)} ${n(Math.sin(rad(d)) * 192)} L${n(Math.cos(rad(d)) * (192 - L))} ${n(Math.sin(rad(d)) * (192 - L))}`);
  }
  o.push(`<path d="${ticks.join(' ')}" stroke="${BRONZE}" stroke-width="1"/>`);

  // Celestial Pavilion: octagonal plinth and eight columns
  if (c.pavilion) {
    const oct = Array.from({ length: 8 }, (_, i) => rad(22.5 + i * 45)).map((a) => [Math.cos(a) * 176, Math.sin(a) * 176]);
    o.push(`<path d="M${oct.map(([x, y]) => `${n(x)} ${n(y)}`).join(' L')} Z" fill="none" stroke="${BRASS}" stroke-width="1.4"/>`);
    o.push(`<path d="M${oct.map(([x, y]) => `${n(x * 0.94)} ${n(y * 0.94)}`).join(' L')} Z" fill="none" stroke="${BRONZE}" stroke-width=".8"/>`);
    for (const [x, y] of oct) o.push(`<circle cx="${n(x)}" cy="${n(y)}" r="8" fill="${INK}" stroke="${BRASS}" stroke-width="1.4"/><circle cx="${n(x)}" cy="${n(y)}" r="4.5" fill="none" stroke="${BRASS}" stroke-width=".8"/>`);
  }

  // Galaxy Dome: ribs studded with lights
  if (c.dome) {
    const R = c.pavilion ? 164 : 168;
    for (let i = 0; i < 16; i++) {
      const a = rad(i * 22.5);
      o.push(`<line x1="${n(Math.cos(a) * 26)}" y1="${n(Math.sin(a) * 26)}" x2="${n(Math.cos(a) * R)}" y2="${n(Math.sin(a) * R)}" stroke="${BRASS}" stroke-opacity=".38" stroke-width=".9"/>`);
      const dots: string[] = [];
      for (let r = 40; r < R; r += 13) dots.push(`<circle cx="${n(Math.cos(a) * r)}" cy="${n(Math.sin(a) * r)}" r="1.15"/>`);
      o.push(`<g fill="${PALE}" opacity="${i % 2 ? '.55' : '.85'}">${dots.join('')}</g>`);
    }
    o.push(`<circle r="${R}" fill="none" stroke="${BRASS}" stroke-width="1.3"/><circle r="26" fill="none" stroke="${BRASS}" stroke-opacity=".6" stroke-width="1"/>`);
    if (!c.pavilion && c.domeMount === 'columns') {
      for (let i = 0; i < 8; i++) {
        const a = rad(22.5 + i * 45); const x = Math.cos(a) * (R + 6); const y = Math.sin(a) * (R + 6);
        o.push(`<rect x="${n(x - 6)}" y="${n(y - 6)}" width="12" height="12" fill="${INK}" stroke="${BRASS}" stroke-width="1.3" transform="rotate(${22.5 + i * 45} ${n(x)} ${n(y)})"/>`);
      }
    }
    if (!c.pavilion && c.domeMount === 'ceiling') {
      for (let i = 0; i < 4; i++) {
        const a = rad(45 + i * 90); const x = Math.cos(a) * R; const y = Math.sin(a) * R;
        o.push(`<circle cx="${n(x)}" cy="${n(y)}" r="5" fill="${INK}" stroke="${BRASS}" stroke-width="1.2"/><path d="M${n(x - 3)} ${n(y)} L${n(x + 3)} ${n(y)} M${n(x)} ${n(y - 3)} L${n(x)} ${n(y + 3)}" stroke="${BRASS}" stroke-width=".9"/>`);
      }
    }
  }

  // orbits
  const inner = c.scope === 'tellurion' ? 112 : 50;
  const outer = c.scope === 'tellurion' ? 112 : c.scope === 'inner' ? 140 : 150;
  const radii = bodies.map((_, i) => (bodies.length === 1 ? inner : inner + ((outer - inner) * i) / (bodies.length - 1)));
  bodies.forEach((b, i) => {
    if (b === 'pluto') o.push(`<ellipse rx="${n(radii[i])}" ry="${n(radii[i] * 0.9)}" fill="none" stroke="${BRASS}" stroke-opacity=".5" stroke-width="1" stroke-dasharray="3 4" transform="rotate(17)"/>`);
    else o.push(`<circle r="${n(radii[i])}" fill="none" stroke="${BRASS}" stroke-opacity="${i % 2 ? '.4' : '.6'}" stroke-width="1.1"/>`);
  });

  // Aurora: orbits traced in light
  if (c.aurora) {
    bodies.forEach((b, i) => {
      if (b === 'earth' || b === 'jupiter' || (c.scope !== 'grand' && b === 'mars')) o.push(`<circle r="${n(radii[i])}" fill="none" stroke="${PALE}" stroke-opacity=".45" stroke-width="3.2"/>`);
    });
  }

  // positions
  const pos = bodies.map((b, i) => {
    const a = rad(ANGLE[b] ?? 0);
    const r = b === 'pluto' ? radii[i] * 0.95 : radii[i];
    return { b, x: Math.cos(a) * r, y: Math.sin(a) * r, a };
  });

  // mechanism
  if (c.drive === 'gears') {
    o.push(`<path d="${gearPath(0, 0, 30, 36, 28)}" fill="${INK}" stroke="${BRASS}" stroke-width="1.2"/>`);
    o.push(`<circle r="22" fill="none" stroke="${BRONZE}" stroke-width=".9"/>`);
    o.push(`<path d="${gearPath(40, -26, 9, 13, 10)}" fill="${INK}" stroke="${BRASS}" stroke-width="1"/>`);
  } else {
    pos.forEach(({ a }) => {
      const mx = Math.cos(a) * 32; const my = Math.sin(a) * 32;
      o.push(`<rect x="${n(mx - 4.5)}" y="${n(my - 3.5)}" width="9" height="7" fill="${INK}" stroke="${BRASS}" stroke-width="1" transform="rotate(${n((a * 180) / Math.PI)} ${n(mx)} ${n(my)})"/>`);
    });
    o.push(`<circle r="22" fill="none" stroke="${BRONZE}" stroke-width=".9"/>`);
  }
  // arms
  pos.forEach(({ x, y }) => o.push(`<line x1="0" y1="0" x2="${n(x)}" y2="${n(y)}" stroke="${BRONZE}" stroke-width="1.6"/>`));
  if (c.drive === 'belts') pos.forEach(({ a }) => o.push(`<line x1="${n(Math.cos(a) * 36.5)}" y1="${n(Math.sin(a) * 36.5)}" x2="${n(Math.cos(a) * 52)}" y2="${n(Math.sin(a) * 52)}" stroke="${PALE}" stroke-width=".8" stroke-dasharray="2 2"/>`));

  o.push(sun(`${id}`, c, 0, 0, c.scope === 'tellurion' ? 17 : 15));

  // planets
  pos.forEach(({ b, x, y, a }) => {
    const r = PLANETS[b].r * k;
    o.push(planet(id, b, x, y, r, c, b === 'saturn'));
    if (b === 'earth') {
      const mr = c.scope === 'tellurion' ? 26 : 14;
      if (c.scope === 'tellurion') o.push(`<circle cx="${n(x)}" cy="${n(y)}" r="${mr}" fill="none" stroke="${BRASS}" stroke-opacity=".55" stroke-width=".9"/>`);
      const ma = a + 2.2;
      o.push(`<line x1="${n(x)}" y1="${n(y)}" x2="${n(x + Math.cos(ma) * mr)}" y2="${n(y + Math.sin(ma) * mr)}" stroke="${BRONZE}" stroke-width="1"/>`);
      o.push(planet(id, 'moon', x + Math.cos(ma) * mr, y + Math.sin(ma) * mr, PLANETS.moon.r * k, c));
    }
  });

  // Aurora: labels, a comet and viewfinder corners
  if (c.aurora) {
    const labelled = pos.filter((p) => ['earth', 'mars', 'jupiter', 'saturn', 'venus'].includes(p.b)).slice(0, 4);
    labelled.forEach(({ b, x, y }) => {
      const dx = x >= 0 ? 1 : -1; const ex = x + dx * 26; const ey = y - 18;
      o.push(`<path d="M${n(x + dx * 6)} ${n(y - 5)} L${n(ex)} ${n(ey)} L${n(ex + dx * 22)} ${n(ey)}" fill="none" stroke="${PALE}" stroke-width=".7"/>`);
      o.push(`<text x="${n(ex + dx * 2)}" y="${n(ey - 3)}" text-anchor="${dx > 0 ? 'start' : 'end'}" fill="${PALE}" font-family="Cinzel, serif" font-size="7.5" letter-spacing=".8">${PLANETS[b].label.toUpperCase()}</text>`);
    });
    o.push(`<path d="M-120 -150 Q-150 -140 -172 -112" fill="none" stroke="${PALE}" stroke-opacity=".5" stroke-width="1.6" stroke-linecap="round"/><circle cx="-118" cy="-151" r="2.4" fill="#FFF6E0"/>`);
    const L = 18;
    for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
      const x = sx * 196; const y = sy * 196;
      o.push(`<path d="M${x} ${y - sy * L} L${x} ${y} L${x - sx * L} ${y}" fill="none" stroke="${PALE}" stroke-width="1.4"/>`);
    }
  }

  // Planetary Controller: a touch panel on its plinth
  if (c.controller) {
    o.push(`<g transform="translate(168 168) rotate(-45)"><rect x="-15" y="-10" width="30" height="20" rx="2" fill="${INK}" stroke="${BRASS}" stroke-width="1.3"/><rect x="-11" y="-6.5" width="22" height="13" fill="none" stroke="${PALE}" stroke-width=".7"/><circle r="3.2" fill="none" stroke="${PALE}" stroke-width=".7"/><circle cx="3.2" r="1" fill="${PALE}"/></g>`);
  }

  return `<svg viewBox="-205 -205 410 410" xmlns="http://www.w3.org/2000/svg" role="img" aria-hidden="true">${defs(id, c, bodies)}${o.join('')}</svg>`;
}

// ---------------------------------------------------------------- elevation
export function elevationSVG(c: Config, id = 'e'): string {
  const bodies = BODIES[c.scope];
  const k = SIZE_SCALE[c.size] * (c.scope === 'tellurion' ? 1.6 : c.scope === 'inner' ? 1.25 : 1);
  const G = 150; // ground line
  const o: string[] = [];
  const hasDome = c.dome || c.pavilion;
  const domeRim = c.pavilion ? -52 : -36;
  const domeR = c.pavilion ? 168 : 158;

  // ground with hatching
  const hatch: string[] = [];
  for (let x = -196; x < 196; x += 9) hatch.push(`M${x} ${G + 1} L${x - 6} ${G + 8}`);
  o.push(`<path d="${hatch.join(' ')}" stroke="${BRONZE}" stroke-width=".8" opacity=".6"/><line x1="-200" y1="${G}" x2="200" y2="${G}" stroke="${BRASS}" stroke-width="1.2"/>`);

  // ceiling, when the dome hangs from it
  if (c.dome && !c.pavilion && c.domeMount === 'ceiling') {
    const ch: string[] = [];
    for (let x = -196; x < 196; x += 9) ch.push(`M${x} -186 L${x + 6} -193`);
    o.push(`<path d="${ch.join(' ')}" stroke="${BRONZE}" stroke-width=".8" opacity=".6"/><line x1="-200" y1="-185" x2="200" y2="-185" stroke="${BRASS}" stroke-width="1.2"/>`);
    for (const x of [-118, 0, 118]) {
      const y2 = x === 0 ? domeRim - domeR * 0.66 : domeRim - Math.sqrt(Math.max(0, 1 - (x / domeR) ** 2)) * domeR * 0.66;
      o.push(`<line x1="${x}" y1="-185" x2="${x}" y2="${n(y2)}" stroke="${BRONZE}" stroke-width="1" stroke-dasharray="1 0"/>`);
    }
  }

  // columns (Pavilion, or Galaxy Dome on columns)
  const columns = c.pavilion || (c.dome && c.domeMount === 'columns');
  if (c.pavilion) {
    o.push(`<rect x="-182" y="${G - 10}" width="364" height="10" fill="${INK}" stroke="${BRASS}" stroke-width="1.2"/><rect x="-176" y="${G - 16}" width="352" height="6" fill="${INK}" stroke="${BRONZE}" stroke-width=".9"/>`);
  }
  if (columns) {
    const base = c.pavilion ? G - 16 : G;
    const top = domeRim + 6;
    const xs = [-domeR + 8, -domeR * 0.56, domeR * 0.56, domeR - 8];
    xs.forEach((x, i) => {
      const w = i === 0 || i === 3 ? 11 : 9;
      const op = i === 1 || i === 2 ? '.55' : '1';
      o.push(`<g opacity="${op}"><rect x="${n(x - w / 2)}" y="${top}" width="${w}" height="${base - top}" fill="${INK}" stroke="${BRASS}" stroke-width="1.1"/>` +
        `<rect x="${n(x - w / 2 - 3)}" y="${top - 5}" width="${w + 6}" height="5" fill="${INK}" stroke="${BRASS}" stroke-width="1"/>` +
        `<rect x="${n(x - w / 2 - 3)}" y="${base - 5}" width="${w + 6}" height="5" fill="${INK}" stroke="${BRASS}" stroke-width="1"/>` +
        `<line x1="${n(x)}" y1="${top + 4}" x2="${n(x)}" y2="${base - 6}" stroke="${BRONZE}" stroke-width=".7"/></g>`);
    });
  }

  // dome (Galaxy Dome lights, Pavilion roof, or both)
  if (hasDome) {
    const ry = domeR * 0.66;
    const apex = domeRim - ry;
    o.push(`<path d="M${-domeR} ${domeRim} A${domeR} ${n(ry)} 0 0 1 ${domeR} ${domeRim}" fill="${c.pavilion ? 'rgba(13,10,6,.55)' : 'none'}" stroke="${BRASS}" stroke-width="${c.pavilion ? 2 : 1.4}"/>`);
    // ribs: half-ellipses from apex to rim
    for (const f of [-0.72, -0.38, 0, 0.38, 0.72]) {
      const rx = Math.abs(f) * domeR;
      if (f === 0) o.push(`<line x1="0" y1="${n(apex)}" x2="0" y2="${domeRim}" stroke="${BRASS}" stroke-opacity=".55" stroke-width=".9"/>`);
      else o.push(`<path d="M0 ${n(apex)} A${n(rx)} ${n(ry)} 0 0 ${f > 0 ? 1 : 0} ${n(f * domeR)} ${domeRim}" fill="none" stroke="${BRASS}" stroke-opacity=".55" stroke-width=".9"/>`);
      if (c.dome) {
        const dots: string[] = [];
        for (let t = 0.12; t < 1; t += 0.11) {
          const th = (t * Math.PI) / 2;
          dots.push(`<circle cx="${n(f * domeR * Math.sin(th))}" cy="${n(domeRim - ry * Math.cos(th))}" r="1.5"/>`);
        }
        o.push(`<g fill="${PALE}" opacity=".85">${dots.join('')}</g>`);
      }
    }
    o.push(`<path d="M${-domeR} ${domeRim} L${domeR} ${domeRim}" stroke="${BRASS}" stroke-width="${c.pavilion ? 3 : 1.4}"/>`);
    if (c.pavilion) {
      o.push(`<rect x="${-domeR - 4}" y="${domeRim}" width="${2 * domeR + 8}" height="7" fill="${INK}" stroke="${BRASS}" stroke-width="1.1"/>`);
      o.push(`<path d="M0 ${n(apex)} L0 ${n(apex - 14)}" stroke="${BRASS}" stroke-width="2"/><circle cx="0" cy="${n(apex - 18)}" r="4.5" fill="${INK}" stroke="${BRASS}" stroke-width="1.4"/><path d="M0 ${n(apex - 30)} L2.5 ${n(apex - 24)} L0 ${n(apex - 22.5)} L-2.5 ${n(apex - 24)} Z" fill="${BRASS}"/>`);
    }
  }

  // the orrery: plinth, central shaft, tiered arms
  const reach = hasDome ? domeR - 26 : 168;
  const n0 = bodies.length;
  // Under a dome the orrery rises to fill it; on its own it stands a little lower.
  const shaftTop = hasDome ? domeRim + 30 : -52;
  const tierTop = shaftTop + 30;
  const tierStep = n0 > 1 ? Math.min(13, 86 / (n0 - 1)) : 0;
  o.push(`<ellipse cx="0" cy="${G - (c.pavilion ? 16 : 0)}" rx="38" ry="7" fill="${INK}" stroke="${BRASS}" stroke-width="1.2"/>`);
  const floor = G - (c.pavilion ? 16 : 0);
  o.push(`<path d="M-14 ${floor - 2} L-5 ${floor - 30} L5 ${floor - 30} L14 ${floor - 2}" fill="${INK}" stroke="${BRASS}" stroke-width="1.1"/>`);
  o.push(`<rect x="-2.6" y="${shaftTop}" width="5.2" height="${floor - 30 - shaftTop}" fill="${BRASS}"/>`);

  // mechanism at the hub
  if (c.drive === 'gears') {
    for (let i = 0; i < Math.min(n0, 6); i++) {
      const y = tierTop + i * tierStep;
      const w = 16 - i * 1.4;
      const teeth: string[] = [];
      for (let x = -w; x <= w; x += 3) teeth.push(`M${n(x)} ${n(y - 3.4)} L${n(x)} ${n(y + 3.4)}`);
      o.push(`<rect x="${n(-w)}" y="${n(y - 3.4)}" width="${n(2 * w)}" height="6.8" fill="${INK}" stroke="${BRASS}" stroke-width="1"/><path d="${teeth.join(' ')}" stroke="${BRONZE}" stroke-width=".7"/>`);
    }
  } else {
    // a motor at the base for each arm, belts running up the shaft
    for (let i = 0; i < n0; i++) {
      const side = i % 2 ? -1 : 1;
      const mx = side * (12 + Math.floor(i / 2) * 9);
      const my = floor - 44 - Math.floor(i / 2) * 2;
      o.push(`<rect x="${n(mx - 3.5)}" y="${n(my)}" width="7" height="9" fill="${INK}" stroke="${BRASS}" stroke-width=".9"/>`);
      const ty = tierTop + i * tierStep;
      o.push(`<path d="M${n(mx)} ${n(my)} L${n(side * 4)} ${n(ty + 3)}" stroke="${PALE}" stroke-width=".55" stroke-dasharray="2 2" opacity=".75"/>`);
    }
  }

  // arms and planets
  const placed: { b: string; x: number; y: number }[] = [];
  bodies.forEach((b, i) => {
    const side = i % 2 ? -1 : 1;
    const y = tierTop + i * tierStep;
    const len = n0 === 1 ? reach * 0.72 : 44 + ((reach - 44) * i) / (n0 - 1);
    const x = side * len;
    const drop = 12 + PLANETS[b].r * k;
    o.push(`<path d="M${side * 3} ${n(y)} L${n(x)} ${n(y)} L${n(x)} ${n(y + drop - PLANETS[b].r * k)}" fill="none" stroke="${BRONZE}" stroke-width="1.5"/>`);
    o.push(`<circle cx="${side * 3}" cy="${n(y)}" r="2.2" fill="${BRASS}"/>`);
    const py = y + drop;
    placed.push({ b, x, y: py });
  });

  // Aurora: orbit paths in perspective, behind the planets
  if (c.aurora) {
    placed.forEach(({ x, y }, i) => {
      if (i % 2 === 0 || n0 < 4) o.push(`<ellipse cx="0" cy="${n(y)}" rx="${n(Math.abs(x))}" ry="${n(Math.abs(x) * 0.16)}" fill="none" stroke="${PALE}" stroke-opacity=".5" stroke-width="1.2" stroke-dasharray="4 3"/>`);
    });
  }

  o.push(defs(id, c, bodies));
  o.push(sun(id, c, 0, shaftTop - 12, c.scope === 'tellurion' ? 16 : 14));
  placed.forEach(({ b, x, y }) => {
    o.push(planet(id, b, x, y, PLANETS[b].r * k, c, b === 'saturn'));
    if (b === 'earth') {
      const mr = c.scope === 'tellurion' ? 24 : 13;
      const dir = x > 0 ? -1 : 1;
      o.push(`<line x1="${n(x)}" y1="${n(y)}" x2="${n(x + dir * mr)}" y2="${n(y - 2)}" stroke="${BRONZE}" stroke-width="1"/>`);
      o.push(planet(id, 'moon', x + dir * mr, y - 2, PLANETS.moon.r * k, c));
    }
  });

  if (c.aurora) {
    // labels sit above the topmost arm, with leaders down to their planet
    const labelY = tierTop - 22;
    placed.filter((p) => ['venus', 'earth', 'mars'].includes(p.b)).forEach(({ b, x, y }, i) => {
      const r = PLANETS[b].r * k;
      const tx = x + (x >= 0 ? 10 : -10);
      const ty = labelY - i * 11;
      o.push(`<path d="M${n(x)} ${n(y - r - 2)} L${n(x)} ${n(ty + 3)} L${n(tx)} ${n(ty + 3)}" fill="none" stroke="${PALE}" stroke-width=".6" stroke-dasharray="1.5 1.5"/>`);
      o.push(`<text x="${n(tx + (x >= 0 ? 2 : -2))}" y="${n(ty + 5.5)}" text-anchor="${x >= 0 ? 'start' : 'end'}" fill="${PALE}" font-family="Cinzel, serif" font-size="7.5" letter-spacing=".8">${PLANETS[b].label.toUpperCase()}</text>`);
    });
    const L = 16;
    for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
      const x = sx * 196; const y = sy < 0 ? -190 : G - 10;
      o.push(`<path d="M${x} ${y - sy * L} L${x} ${y} L${x - sx * L} ${y}" fill="none" stroke="${PALE}" stroke-width="1.3"/>`);
    }
  }

  // Planetary Controller: a lectern with an angled touch screen
  if (c.controller) {
    const x = hasDome ? 186 : 176;
    o.push(`<g transform="translate(${x} ${G})"><line x1="0" y1="0" x2="0" y2="-44" stroke="${BRASS}" stroke-width="2.2"/><ellipse cx="0" cy="0" rx="10" ry="2.5" fill="${INK}" stroke="${BRASS}" stroke-width="1"/><path d="M-11 -42 L11 -50 L11 -44 L-11 -36 Z" fill="${INK}" stroke="${BRASS}" stroke-width="1.1"/><path d="M-8 -41 L8 -47" stroke="${PALE}" stroke-width=".8"/></g>`);
  }

  return `<svg viewBox="-205 -200 410 365" xmlns="http://www.w3.org/2000/svg" role="img" aria-hidden="true">${o.join('')}</svg>`;
}
