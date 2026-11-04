// Links between Celestial Mechanics pages.
//
// `cm()` is the one place to change every internal link, should the pages
// ever move under a prefix (e.g. if this site is folded into another).
export const cm = (path: string) => path;

export const PAGES = {
  home: '/',
  residences: '/residences/',
  institutions: '/institutions/',
  businesses: '/businesses/',
  addons: '/add-ons/',
  studio: '/studio/',
  commission: '/commission/',
} as const;

export const AUDIENCE_PAGE = {
  residence: PAGES.residences,
  institution: PAGES.institutions,
  business: PAGES.businesses,
} as const;
