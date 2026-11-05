// CMS pages for the Celestial Mechanics site (src/content/cm/), used by
// keystatic.config.ts. One singleton (one JSON file) per page.
import { fields, singleton } from '@keystatic/core';
import configurations from './src/content/cm/configurations.json';
import { GROUPS, SETTINGS, DOME_MOUNTS, AUDIENCES } from './src/cm/options';

const text = (label: string, description?: string) => fields.text({ label, description });
const para = (label: string, description?: string) => fields.text({ label, description, multiline: true });
const opts = (list: readonly string[], labels: Record<string, string> = {}) => list.map((v) => ({ value: v, label: labels[v] ?? v[0].toUpperCase() + v.slice(1) }));
const page = (label: string, path: string, schema: Parameters<typeof singleton>[0]['schema']) =>
  singleton({ label, path: `src/content/cm/${path}`, format: { data: 'json' }, schema });
const closing = () => fields.object({ heading: text('Heading'), text: text('Line'), button: text('Button') }, { label: 'Closing call to action' });
const optionText = (label: string) => fields.object({ label: text('Name'), text: text('Description') }, { label });

const ICONS = ['residence', 'institution', 'business', 'conversation', 'pavilion', 'heirloom', 'learn', 'aurora', 'controller', 'landmark', 'story', 'rocket', 'system', 'planets', 'mechanism', 'sun', 'craft', 'unique', 'lasting'];
const configNames = configurations.items.map((c) => ({ value: c.name, label: c.name }));

const audiencePage = (label: string, path: string) =>
  page(label, path, {
    preheader: text('Pre-header'),
    heading: text('Heading'),
    lead: para('Opening paragraph'),
    image: fields.image({ label: 'Photo (optional)', description: 'Leave empty to show an engraved drawing of the starting-point configuration.', directory: `public/images/cm/${path}`, publicPath: `/images/cm/${path}/` }),
    imageAlt: text('Photo description (for screen readers)'),
    pointsHeading: text('Points heading'),
    points: fields.array(
      fields.object({ title: text('Title'), text: para('Text'), icon: fields.select({ label: 'Icon', options: opts(ICONS), defaultValue: 'unique' }) }),
      { label: 'Points', itemLabel: (p) => p.fields.title.value || 'Point' }
    ),
    settingsHeading: text('Settings heading'),
    settings: fields.array(text('Setting'), { label: 'Where it belongs', itemLabel: (p) => p.value || 'Setting' }),
    startingPoint: fields.object(
      {
        heading: text('Heading'),
        text: para('Text'),
        configuration: fields.select({ label: 'Configuration', description: 'One of the signature configurations. New ones appear here after the site rebuilds (about two minutes).', options: configNames, defaultValue: configNames[0]?.value ?? '' }),
      },
      { label: 'Starting point' }
    ),
    closing: closing(),
  });

export const cmSingletons = {
  cmSite: page('Header and footer', 'site', {
    navResidences: text('Menu: Residences'),
    navInstitutions: text('Menu: Institutions'),
    navBusinesses: text('Menu: Businesses'),
    navAddons: text('Menu: Add-ons'),
    navStudio: text('Menu: Studio'),
    navCommission: text('Menu button: commission'),
    footerLine: text('Footer line'),
    copyright: text('Copyright line'),
    grandOrreryUrl: fields.url({ label: 'The Grand Orrery link' }),
  }),

  cmHome: page('Home', 'home', {
    hero: fields.object({ preheader: text('Pre-header'), heading: text('Heading'), lead: para('Opening paragraph'), primaryButton: text('Main button'), secondaryButton: text('Second button') }, { label: 'Opening' }),
    experience: fields.object({ preheader: text('Pre-header'), heading: text('Heading'), body: para('Text'), caption: text('Animation caption') }, { label: 'The experience' }),
    audiences: fields.object(
      {
        preheader: text('Pre-header'),
        heading: text('Heading'),
        residence: fields.object({ title: text('Title'), text: para('Text'), link: text('Link text') }, { label: 'Residences' }),
        institution: fields.object({ title: text('Title'), text: para('Text'), link: text('Link text') }, { label: 'Institutions' }),
        business: fields.object({ title: text('Title'), text: para('Text'), link: text('Link text') }, { label: 'Businesses' }),
      },
      { label: 'Made for (the three audiences)' }
    ),
    bespoke: fields.object(
      {
        preheader: text('Pre-header'),
        heading: text('Heading'),
        body: para('Text'),
        items: fields.array(fields.object({ title: text('Title'), text: para('Text') }), { label: 'Choices', itemLabel: (p) => p.fields.title.value || 'Choice' }),
        button: text('Button'),
      },
      { label: 'Made, not manufactured' }
    ),
    process: fields.object(
      {
        preheader: text('Pre-header'),
        heading: text('Heading'),
        steps: fields.array(fields.object({ title: text('Title'), text: para('Text') }), { label: 'Steps', itemLabel: (p) => p.fields.title.value || 'Step' }),
      },
      { label: 'How a commission unfolds (also on the other pages)' }
    ),
    grandOrrery: fields.object(
      {
        preheader: text('Pre-header'),
        heading: text('Heading'),
        body: para('Text'),
        button: text('Button'),
        image: fields.image({ label: 'Photo', directory: 'public/images/cm/home', publicPath: '/images/cm/home/' }),
        imageAlt: text('Photo description (for screen readers)'),
      },
      { label: 'The Grand Orrery card' }
    ),
    closing: closing(),
  }),

  cmResidences: audiencePage('Residences', 'residences'),
  cmInstitutions: audiencePage('Institutions', 'institutions'),
  cmBusinesses: audiencePage('Businesses', 'businesses'),

  cmAddons: page('Add-ons', 'addons', {
    preheader: text('Pre-header'),
    heading: text('Heading'),
    lead: para('Opening paragraph'),
    items: fields.object(
      Object.fromEntries(
        (['controller', 'aurora', 'dome', 'pavilion'] as const).map((id) => [
          id,
          fields.object(
            {
              name: text('Name'),
              tagline: text('Tagline'),
              body: para('Description'),
              features: fields.array(text('Feature'), { label: 'Features', itemLabel: (p) => p.value || 'Feature' }),
              note: text('Note', 'Small line under the features, e.g. "Requires the Planetary Controller." Leave empty to hide.'),
            },
            { label: { controller: 'Planetary Controller', aurora: 'Aurora', dome: 'Galaxy Dome', pavilion: 'Celestial Pavilion' }[id] }
          ),
        ])
      ),
      { label: 'Add-ons' }
    ),
    compatibility: para('Compatibility line'),
    closing: closing(),
  }),

  cmConfigurations: page('Signature configurations', 'configurations', {
    preheader: text('Pre-header'),
    heading: text('Heading'),
    intro: para('Intro'),
    items: fields.array(
      fields.object({
        name: text('Name'),
        for: fields.select({ label: 'Suggested for', options: opts(AUDIENCES), defaultValue: 'residence' }),
        text: para('Description'),
        setting: fields.select({ label: 'Setting', options: opts(SETTINGS), defaultValue: 'indoor' }),
        scope: fields.select({ label: 'System', options: opts(GROUPS.scope, { tellurion: 'Tellurion', inner: 'Inner planets', grand: 'Grand Orrery' }), defaultValue: 'grand' }),
        size: fields.select({ label: 'Planet size', options: opts(GROUPS.size), defaultValue: 'medium' }),
        material: fields.select({ label: 'Planet material', options: opts(GROUPS.material, { pe: 'PE material', glass: 'Hand-blown glass' }), defaultValue: 'glass' }),
        drive: fields.select({ label: 'Mechanism', options: opts(GROUPS.drive, { belts: 'Motors and belts', gears: 'Mechanical gearing' }), defaultValue: 'belts' }),
        sun: fields.select({ label: 'Sun', options: opts(GROUPS.sun, { sphere: 'Spherical', fireball: 'Fireball' }), defaultValue: 'sphere' }),
        controller: fields.checkbox({ label: 'Planetary Controller' }),
        aurora: fields.checkbox({ label: 'Aurora (adds the Controller)' }),
        dome: fields.checkbox({ label: 'Galaxy Dome' }),
        domeMount: fields.select({ label: 'Galaxy Dome mounting', options: opts(DOME_MOUNTS, { ceiling: 'Hung from the ceiling', columns: 'On free-standing columns' }), defaultValue: 'ceiling' }),
        pavilion: fields.checkbox({ label: 'Celestial Pavilion (outdoor only)' }),
      }),
      { label: 'Configurations', description: 'Shown on the home page; each audience page features one. Drawings update automatically.', itemLabel: (p) => p.fields.name.value || 'Configuration' }
    ),
    button: text('Button text'),
  }),

  cmCommission: page('Commission (builder and enquiry form)', 'commission', {
    preheader: text('Pre-header'),
    heading: text('Heading'),
    lead: para('Opening paragraph'),
    setting: fields.object({ title: text('Question'), intro: text('Intro'), options: fields.object({ indoor: optionText('Indoors'), outdoor: optionText('Outdoors') }, { label: 'Options' }) }, { label: 'Step: setting' }),
    groups: fields.object(
      Object.fromEntries(
        (Object.keys(GROUPS) as (keyof typeof GROUPS)[]).map((g) => [
          g,
          fields.object(
            { title: text('Title'), intro: text('Intro'), options: fields.object(Object.fromEntries(GROUPS[g].map((o) => [o, optionText(o)])), { label: 'Options' }) },
            { label: `Step: ${{ scope: 'the system', size: 'planet size', material: 'planet material', drive: 'the mechanism', sun: 'the Sun' }[g]}` }
          ),
        ])
      ),
      { label: 'Builder steps' }
    ),
    addonsTitle: text('Add-ons step: title'),
    addonsIntro: text('Add-ons step: intro'),
    domeMount: fields.object({ title: text('Title'), options: fields.object({ ceiling: optionText('Ceiling'), columns: optionText('Columns') }, { label: 'Options' }) }, { label: 'Galaxy Dome mounting' }),
    messages: fields.object(
      {
        auroraNeedsController: text('When Aurora adds the Controller'),
        pavilionOutdoor: text('When the Pavilion is switched off for indoors'),
        outdoorSuggestPavilion: text('When someone chooses outdoors'),
      },
      { label: 'Builder hints' }
    ),
    summary: fields.object(
      { heading: text('Heading'), elevation: text('Elevation tab'), plan: text('Plan tab'), caption: text('Drawing caption'), button: text('Enquire button'), reset: text('Start over link'), share: text('Copy link'), copied: text('Link copied message') },
      { label: 'Sketch panel' }
    ),
    form: fields.object(
      { preheader: text('Pre-header'), heading: text('Heading'), intro: para('Intro'), sketchLabel: text('Sketch label'), noSketch: text('No sketch message'), buttonText: text('Button'), successHeading: text('Thank-you heading'), successText: para('Thank-you text') },
      { label: 'Enquiry form' }
    ),
  }),

  cmStudio: page('Studio', 'studio', {
    preheader: text('Pre-header'),
    heading: text('Heading'),
    lead: para('Opening paragraph'),
    mission: fields.object({ preheader: text('Pre-header'), heading: text('Heading'), body: para('Text') }, { label: 'Why orreries' }),
    principles: fields.object(
      { preheader: text('Pre-header'), heading: text('Heading'), items: fields.array(fields.object({ title: text('Title'), text: para('Text') }), { label: 'Principles', itemLabel: (p) => p.fields.title.value || 'Principle' }) },
      { label: 'Our craft' }
    ),
    closing: closing(),
  }),
};

export const cmNavigation = ['cmSite', 'cmHome', 'cmResidences', 'cmInstitutions', 'cmBusinesses', 'cmAddons', 'cmConfigurations', 'cmCommission', 'cmStudio'];
