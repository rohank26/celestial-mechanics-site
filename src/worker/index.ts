// Worker entry point: Astro's handler for the site and the CMS, the
// commission enquiry form, and an hourly cron that retries any enquiry whose
// email didn't go out. Pages, images and fonts are static files that
// Cloudflare serves before this runs.
import { handle } from '@astrojs/cloudflare/handler';
import { handleContact, retryUnsent, type ContactEnv } from './contact';

export default {
  async fetch(request, env, ctx) {
    const { pathname } = new URL(request.url);
    if (pathname === '/api/contact') {
      return handleContact(request, env as ContactEnv, ctx);
    }
    return handle(request, env, ctx);
  },
  async scheduled(_event, env, ctx) {
    ctx.waitUntil(retryUnsent(env as ContactEnv));
  },
} satisfies ExportedHandler<Env>;
