# Setting up hosting and the CMS

The site is an [Astro](https://astro.build) project hosted on **Cloudflare Workers**, in the same Cloudflare account as The Grand Orrery. Pages are built to static HTML; only the CMS (`/keystatic`) and the enquiry form (`/api/contact`) run on demand. Every push to `main` deploys automatically.

## 1. Connect the repository to Cloudflare (one time)

1. Sign in at [dash.cloudflare.com](https://dash.cloudflare.com) and open **Workers & Pages** (under Compute).
2. Click **Create application**, then **Import a repository**.
3. If asked, let Cloudflare's GitHub app see `celestial-mechanics-site` (GitHub → Settings → Applications → Cloudflare Workers and Pages → Configure → add the repository).
4. Select `rohank26/celestial-mechanics-site` and use these settings:

   | Setting | Value |
   | --- | --- |
   | Project name | `celestial-mechanics-site` (must match `name` in `wrangler.jsonc`) |
   | Production branch | `main` |
   | Build command | `npm run build` |
   | Deploy command | `npx wrangler deploy` |

5. Click **Save and Deploy**. After a minute or two the site is live at `https://celestial-mechanics-site.rohank.workers.dev`.

On that first deploy Cloudflare also creates the storage that keeps a copy of every enquiry (the `ENQUIRIES` KV namespace in `wrangler.jsonc`), so there's nothing to set up for it.

The site sends `noindex` to search engines and has a `robots.txt` that blocks crawlers, so the link stays unlisted.

## 2. Turn on the CMS (one time)

Editors sign in through **Keystatic Cloud**, so they don't need GitHub accounts.

1. Go to [keystatic.cloud](https://keystatic.cloud) and sign in.
2. Open the **the-grand-orrery** team (the one the Grand Orrery's CMS uses) and create a project named **celestial-mechanics-site**, connected to the GitHub repository `rohank26/celestial-mechanics-site`.
3. If you name the team or project differently, change `cloud.project` in `keystatic.config.ts` to `team/project` and push.
4. Open `https://celestial-mechanics-site.rohank.workers.dev/keystatic` and sign in.

To give someone access, invite them to the team at keystatic.cloud.

## 3. Enquiry emails

Enquiries are emailed to rohank@gmail.com, sent from `website@thegrandorrery.art`. That works because thegrandorrery.art already has Cloudflare Email Routing turned on with rohank@gmail.com verified, and it's in the same account. When the studio has its own domain, turn on Email Routing there and change `CONTACT_FROM` in `src/worker/contact.ts`.

If an email can't be sent, the enquiry stays saved and is retried every hour.

## 4. A custom domain (later)

1. Register the domain (e.g. at Namecheap) and **Add a domain** in Cloudflare (Free plan); copy the two Cloudflare nameservers into Namecheap under **Nameservers → Custom DNS**.
2. Once Cloudflare marks it **Active**: Worker `celestial-mechanics-site` → **Settings → Domains & Routes → Add → Custom domain**: add the domain and its `www`.
3. Use the CMS from the new address.

## Running locally

```sh
npm install
npm run dev        # http://localhost:4321 (Astro 7 runs this in the background; `npx astro dev stop` to stop)
npm run preview    # production build in Cloudflare's local runtime
```

The visual CMS editor only works on the live site; locally, edit the files in `src/content/cm/` directly and run `npx tsx tools/check/validate-content.mts` afterwards.
