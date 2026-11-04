// A configuration in words, using the CMS wording. Used on the signature
// cards, in the builder's summary and in the enquiry email.
import commission from '../content/cm/commission.json';
import addons from '../content/cm/addons.json';
import { GROUP_IDS, type Config } from './options';

type Groups = Record<string, { title: string; options: Record<string, { label: string }> }>;
const groups = commission.groups as unknown as Groups;
const items = addons.items as Record<string, { name: string }>;

export function describe(c: Config): { label: string; value: string }[] {
  const rows: { label: string; value: string }[] = [];
  rows.push({ label: commission.setting.title.replace(/\?$/, ''), value: (commission.setting.options as Record<string, { label: string }>)[c.setting]?.label ?? c.setting });
  for (const g of GROUP_IDS) {
    rows.push({ label: groups[g].title, value: groups[g].options[(c as unknown as Record<string, string>)[g]]?.label ?? '' });
  }
  const chosen: string[] = [];
  if (c.controller) chosen.push(items.controller.name);
  if (c.aurora) chosen.push(items.aurora.name);
  if (c.dome) chosen.push(`${items.dome.name} (${(commission.domeMount.options as Record<string, { label: string }>)[c.domeMount].label.toLowerCase()})`);
  if (c.pavilion) chosen.push(items.pavilion.name);
  rows.push({ label: commission.addonsTitle, value: chosen.length ? chosen.join(', ') : 'None' });
  return rows;
}

// One line, for cards: "Grand Orrery · Large · Hand-blown glass · Galaxy Dome"
export function summaryLine(c: Config): string {
  const g = groups;
  const parts = [g.scope.options[c.scope].label, g.size.options[c.size].label, g.material.options[c.material].label];
  if (c.dome) parts.push(items.dome.name);
  if (c.pavilion) parts.push(items.pavilion.name);
  if (c.aurora) parts.push(items.aurora.name);
  else if (c.controller) parts.push(items.controller.name);
  return parts.join(' · ');
}
