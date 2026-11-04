// Commission enquiry form: POST /api/contact (src/pages/commission.astro)
//
// Spam filtering, in order:
//   1. Honeypot: a hidden "website" field people never see; bots fill it.
//   2. Timing: the page's script stamps when the form was shown; submissions
//      sent faster than a person could type are dropped. No stamp = no script
//      ran, which almost always means a bot.
//   3. Content: too many links, or a message that's mostly links, is dropped.
//   4. Rate limit: at most 5 submissions per IP address per hour.
// Spam gets the same "thank you" response as real enquiries, so bots learn
// nothing.
//
// Delivery: every real enquiry is saved in KV (ENQUIRIES) first, so nothing
// is lost, then emailed to CONTACT_TO through the CONTACT_EMAIL send_email
// binding. The sender address must be on a domain in this Cloudflare account
// with Email Routing turned on and CONTACT_TO verified as a destination; until
// the studio has its own domain that's thegrandorrery.art. Anything not yet
// sent is retried by the hourly cron (retryUnsent).

import { EmailMessage } from 'cloudflare:email';

export interface ContactEnv {
  ENQUIRIES?: KVNamespace; // keys prefixed "contact:"
  CONTACT_EMAIL?: { send: (msg: unknown) => Promise<unknown> };
}

const CONTACT_TO = 'rohank@gmail.com';
const CONTACT_FROM = 'website@thegrandorrery.art';
const MIN_FILL_MS = 4000;
const RATE_LIMIT = 5;

const TYPES: Record<string, string> = {
  residence: 'Residence (a home or garden)',
  institution: 'Institution (museum, school or public space)',
  business: 'Business (hotel, gallery or building)',
  other: 'Something else',
};

const SITE = { name: 'Celestial Mechanics website', subject: 'Commission enquiry', page: '/commission/', anchor: 'enquire', intro: 'New commission enquiry from the Celestial Mechanics website' };

interface Enquiry {
  id: string;
  receivedAt: string;
  name: string;
  email: string;
  organisation: string;
  type: string;
  location: string;
  dates: string;
  message: string;
  phone?: string;
  configuration?: string;
  sketchUrl?: string;
  page: string;
  sent: boolean;
  attempts: number;
  lastError?: string;
}

const clean = (v: FormDataEntryValue | null, max: number) =>
  String(v ?? '').replace(/\r\n?/g, '\n').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').trim().slice(0, max);
const oneLine = (s: string) => s.replace(/\s+/g, ' ').trim();
const EMAIL_RE = /^[^\s@<>()",;:]+@[^\s@<>()",;:]+\.[^\s@<>()",;:]{2,}$/;

function respond(request: Request, ok: boolean, message: string, status = 200): Response {
  const wantsJson = (request.headers.get('accept') ?? '').includes('application/json');
  if (wantsJson) {
    return new Response(JSON.stringify({ ok, message }), {
      status,
      headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
    });
  }
  // Without JavaScript the browser posted the form normally: send it back to the page.
  const back = new URL(SITE.page, request.url);
  back.searchParams.set(ok ? 'sent' : 'error', '1');
  back.hash = SITE.anchor;
  return Response.redirect(back.toString(), 303);
}

function emailBody(e: Enquiry): string {
  const site = SITE;
  const rows = [
    ['Name', e.name],
    ['Email', e.email],
    ['Phone', e.phone ?? ''],
    ['Organisation', e.organisation],
    ['For', TYPES[e.type] ?? e.type],
    ['Location', e.location],
    ['Dates or timeframe', e.dates],
  ].filter(([, v]) => v);
  const sketch = e.configuration
    ? ['', 'Their sketch:', e.configuration, ...(e.sketchUrl ? [`Open it in the builder: ${e.sketchUrl}`] : [])]
    : [];
  return [
    site.intro,
    '',
    ...rows.map(([k, v]) => `${k}: ${v}`),
    ...sketch,
    '',
    'Message:',
    e.message,
    '',
    '—',
    `Received ${e.receivedAt}. Reply to this email to answer ${e.name} directly.`,
  ].join('\n');
}

async function deliver(env: ContactEnv, e: Enquiry): Promise<void> {
  if (!env.CONTACT_EMAIL) throw new Error('CONTACT_EMAIL binding missing');
  const site = SITE;
  const subject = oneLine(`${site.subject}: ${e.name}${e.organisation ? ` (${e.organisation})` : ''}`).slice(0, 180);
  const text = emailBody(e);
  try {
    // Cloudflare's structured send API.
    await env.CONTACT_EMAIL.send({
      from: { name: site.name, email: CONTACT_FROM },
      to: CONTACT_TO,
      replyTo: { name: e.name, email: e.email },
      subject,
      text,
    });
  } catch (structuredError) {
    // Older runtimes only accept a raw MIME message.
    const b64 = (s: string) => btoa(String.fromCharCode(...new TextEncoder().encode(s)));
    const raw = [
      `From: "${site.name}" <${CONTACT_FROM}>`,
      `To: <${CONTACT_TO}>`,
      `Reply-To: =?UTF-8?B?${b64(e.name)}?= <${e.email}>`,
      `Subject: =?UTF-8?B?${b64(subject)}?=`,
      `Message-ID: <${e.id}@thegrandorrery.art>`,
      `Date: ${new Date(e.receivedAt).toUTCString()}`,
      'MIME-Version: 1.0',
      'Content-Type: text/plain; charset=utf-8',
      'Content-Transfer-Encoding: base64',
      '',
      b64(text).replace(/.{76}/g, '$&\r\n'),
    ].join('\r\n');
    try {
      await env.CONTACT_EMAIL.send(new EmailMessage(CONTACT_FROM, CONTACT_TO, raw));
    } catch (rawError) {
      throw new Error(`${(structuredError as Error)?.message ?? structuredError} / ${(rawError as Error)?.message ?? rawError}`);
    }
  }
}

async function trySend(env: ContactEnv, e: Enquiry): Promise<void> {
  try {
    await deliver(env, e);
    e.sent = true;
    delete e.lastError;
  } catch (err) {
    e.lastError = err instanceof Error ? err.message : String(err);
    console.error('Contact email failed:', e.lastError);
  }
  e.attempts += 1;
  await env.ENQUIRIES?.put(`contact:${e.id}`, JSON.stringify(e), {
    // Keep sent enquiries for a year as a backup; unsent ones until delivered.
    expirationTtl: e.sent ? 60 * 60 * 24 * 365 : undefined,
  });
}

export async function handleContact(request: Request, env: ContactEnv, ctx: ExecutionContext): Promise<Response> {
  if (request.method !== 'POST') return new Response('Method not allowed', { status: 405, headers: { allow: 'POST' } });

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return respond(request, false, 'Something went wrong reading the form. Please try again.', 400);
  }

  const thanks = () => respond(request, true, 'Thank you. Your message is on its way, and we’ll be in touch soon.');

  // 1. Honeypot
  if (clean(form.get('website'), 200)) return thanks();
  // 2. Timing
  const shownAt = Number(form.get('t'));
  if (!shownAt || Date.now() - shownAt < MIN_FILL_MS) return thanks();

  const e: Enquiry = {
    id: `${Date.now().toString(36)}-${crypto.randomUUID().slice(0, 8)}`,
    receivedAt: new Date().toISOString(),
    name: oneLine(clean(form.get('name'), 120)),
    email: oneLine(clean(form.get('email'), 200)),
    organisation: oneLine(clean(form.get('organisation'), 160)),
    type: oneLine(clean(form.get('type'), 40)),
    location: oneLine(clean(form.get('location'), 160)),
    dates: oneLine(clean(form.get('dates'), 160)),
    message: clean(form.get('message'), 5000),
    page: oneLine(clean(request.headers.get('referer'), 300)),
    sent: false,
    attempts: 0,
  };

  {
    const phone = oneLine(clean(form.get('phone'), 40));
    if (phone) e.phone = phone;
    const configuration = clean(form.get('configuration'), 1500);
    if (configuration) e.configuration = configuration;
    const code = clean(form.get('code'), 16);
    if (/^\d{10}$/.test(code)) e.sketchUrl = `${new URL(request.url).origin}/commission/?c=${code}#builder`;
  }

  if (!e.name || !EMAIL_RE.test(e.email) || e.message.length < 2) {
    return respond(request, false, 'Please add your name, a valid email address and a message.', 400);
  }

  // 3. Content
  const links = (e.message.match(/https?:\/\/|www\./gi) ?? []).length;
  const linkChars = (e.message.match(/https?:\/\/\S+/gi) ?? []).join('').length;
  if (links > 3 || (links > 0 && linkChars / e.message.length > 0.5)) return thanks();

  // 4. Rate limit per IP
  const ip = request.headers.get('cf-connecting-ip') ?? 'unknown';
  if (env.ENQUIRIES) {
    const key = `contact-rate:${ip}`;
    const count = Number((await env.ENQUIRIES.get(key)) ?? 0);
    if (count >= RATE_LIMIT) {
      return respond(request, false, 'Thanks, we’ve already received several messages from you this hour. Please try again later or email us directly.', 429);
    }
    await env.ENQUIRIES.put(key, String(count + 1), { expirationTtl: 3600 });
  }

  if (!env.ENQUIRIES && !env.CONTACT_EMAIL) {
    return respond(request, false, 'The contact form isn’t available right now. Please try again later.', 503);
  }
  // Save first, then send in the background so the visitor isn't kept waiting.
  await env.ENQUIRIES?.put(`contact:${e.id}`, JSON.stringify(e));
  ctx.waitUntil(trySend(env, e));
  return thanks();
}

// Hourly: retry any enquiries whose email hasn't gone out yet.
export async function retryUnsent(env: ContactEnv): Promise<void> {
  if (!env.ENQUIRIES) return;
  const list = await env.ENQUIRIES.list({ prefix: 'contact:' });
  for (const k of list.keys) {
    const e = await env.ENQUIRIES.get<Enquiry>(k.name, 'json');
    if (e && !e.sent && e.attempts < 200) await trySend(env, e);
  }
}
