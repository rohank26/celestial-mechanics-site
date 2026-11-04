// @ts-check
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import react from '@astrojs/react';
import keystatic from '@keystatic/astro';

// Pages are prerendered to static HTML at build time. Only the CMS
// (/keystatic and /api/keystatic) runs on demand on Cloudflare.
export default defineConfig({
  output: 'static',
  // No Cloudflare Images or KV sessions needed: images are pre-compressed and
  // the CMS keeps its own login cookie.
  adapter: cloudflare({ imageService: 'passthrough' }),
  session: false,
  integrations: [react(), keystatic()],
});
