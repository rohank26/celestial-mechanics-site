import { config } from '@keystatic/core';
import { cmSingletons, cmNavigation } from './keystatic.cm';

// The CMS at /keystatic. Every page's wording lives in src/content/cm/ as
// one JSON file per page; the schema for each is in keystatic.cm.ts.
export default config({
  // Edit locally while developing; on the live site, editors sign in through
  // Keystatic Cloud (no GitHub account needed) and edits are saved to the repo.
  // Drafts: "New branch" in the CMS's branch menu creates draft/<name>; saves
  // there stay off the live site until the draft is published (merged into main).
  storage: import.meta.env.PROD ? { kind: 'cloud', branchPrefix: 'draft/' } : { kind: 'local' },
  // Keystatic Cloud project, as "team/project" (see docs/DEPLOY.md § 2).
  cloud: { project: 'the-grand-orrery/celestial-mech-site' },

  ui: {
    brand: { name: 'Celestial Mechanics' },
    navigation: { Pages: cmNavigation },
  },

  singletons: cmSingletons,
});
