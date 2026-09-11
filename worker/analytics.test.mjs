import { test } from 'node:test';
import assert from 'node:assert/strict';
import { encode } from '@auth/core/jwt';
import { campaignParams, cloudflareCustomer, eventProperties, funnelEvent } from '../src/lib/analytics/shared.mjs';
import { handleAnalyticsContext, handleAnalyticsEvent } from './analytics.js';
import { AnalyticsDelivery } from './analytics-delivery.js';
const secret = 'analytics-test-secret-long-enough-to-sign-sessions';
const cf = { city: 'Paris', regionCode: 'IDF', postalCode: '75001', country: 'FR', latitude: '48.85', longitude: '2.35' };
async function request(path = 'context', { consent = true, signed = true, origin = 'https://perfilisto.com', body, more = {} } = {}) {
  const jwt = signed ? await encode({ secret, salt: '__Secure-authjs.session-token', token: { sub: 'google:test-user', email: 'test@example.com', name: 'Test User' } }) : '';
  const req = new Request(`https://perfilisto.com/api/analytics/${path}`, { method: path === 'context' ? 'GET' : 'POST', headers: { Origin: origin, 'Content-Type': 'application/json', Cookie: `${consent ? 'perfilisto_analytics=yes;' : ''} __Secure-authjs.session-token=${jwt}`, 'CF-Connecting-IP': '203.0.113.5', 'User-Agent': 'Test browser', ...more }, ...(body ? { body: JSON.stringify(body) } : {}) });
  Object.defineProperty(req, 'cf', { value: cf }); return req;
}
function environment() {
  const payloads = [];
  return { payloads, env: { AUTH_SECRET: secret, WHOP_ACCOUNT_ID: 'biz_test', WHOP_EVENTS_API_KEY: 'fake-test-key', ANALYTICS_DELIVERIES: { getByName: () => ({ fetch: async r => { payloads.push(await r.json()); return new Response(null, { status: 202 }); } }) } } };
}
const event = { name: 'onboarding_step', id: 'perfilisto:test:welcome', props: { step: 'welcome' }, url: 'https://perfilisto.com/onboarding?code=secret&order=private', campaign: { utm_source: 'google', gclid: 'test-click', code: 'secret' }, wuid: 'wuid_test' };
test('Cloudflare enrichment is consented, uncached and limited to verified identity and coarse location', async () => {
  const response = await handleAnalyticsContext(await request(), { AUTH_SECRET: secret });
  const user = await response.json();
  assert.equal(user.city, 'Paris'); assert.equal(user.email, 'test@example.com'); assert.match(user.external_id, /^[a-f0-9]{64}$/);
  assert.equal(user.latitude, undefined); assert.equal(user.ip_address, undefined); assert.equal(user.sub, undefined);
  assert.equal(response.headers.get('cache-control'), 'private, no-store');
  for (const options of [{ consent: false }, { more: { 'Sec-GPC': '1' } }, { more: { DNT: '1' } }]) assert.deepEqual(await (await handleAnalyticsContext(await request('context', options), { AUTH_SECRET: secret })).json(), {});
  assert.equal((await handleAnalyticsContext(await request('context', { origin: 'https://evil.test' }), {})).status, 403);
  assert.deepEqual(cloudflareCustomer({ country: 'XX', latitude: 'private' }), {});
});
test('Events use original visitor IP, verified account, and a sanitized campaign URL', async () => {
  const { env, payloads } = environment();
  const result = await handleAnalyticsEvent(await request('events', { body: { ...event, user: { email: 'forged@test.com' }, context: { ip_address: '1.2.3.4' } } }), env);
  assert.equal(result.status, 202);
  const payload = payloads[0];
  assert.equal(payload.event_name, 'onboarding_welcome'); assert.equal(payload.user.email, 'test@example.com'); assert.equal(payload.user.anonymous_id, 'wuid_test');
  assert.equal(payload.context.ip_address, '203.0.113.5'); assert.equal(payload.user.city, 'Paris');
  assert.doesNotMatch(JSON.stringify(payload), /secret|private|forged|latitude/);
  assert.equal(payload.context.gclid, 'test-click');
});
test('No events without consent, across origins, for anonymous onboarding, or unverified purchases/orders', async () => {
  const { env, payloads } = environment();
  assert.equal((await handleAnalyticsEvent(await request('events', { consent: false, body: event }), env)).status, 204);
  assert.equal((await handleAnalyticsEvent(await request('events', { origin: 'https://evil.test', body: event }), env)).status, 403);
  assert.equal((await handleAnalyticsEvent(await request('events', { signed: false, body: event }), env)).status, 401);
  assert.equal((await handleAnalyticsEvent(await request('events', { body: { ...event, name: 'purchase', props: { value: 500 } } }), env)).status, 400);
  assert.equal((await handleAnalyticsEvent(await request('events', { body: { ...event, name: 'add_to_cart' } }), env)).status, 400);
  assert.equal((await handleAnalyticsEvent(await request('events', { body: { ...event, account: 'another-account' } }), env)).status, 403);
  assert.equal(payloads.length, 0);
});
test('Anonymous visits work, raw body IP cannot replace absent edge metadata, and throttling happens before storage', async () => {
  const { env, payloads } = environment();
  const req = await request('events', { signed: false, body: { ...event, name: 'visit' } });
  const withoutCF = new Request(req);
  assert.equal((await handleAnalyticsEvent(withoutCF, env)).status, 202);
  assert.equal(payloads[0].context.ip_address, undefined);
  assert.equal(payloads[0].user.email, undefined);
  env.ANALYTICS_RATE_LIMIT = { limit: async () => ({ success: false }) };
  assert.equal((await handleAnalyticsEvent(await request('events', { body: event }), env)).status, 429);
  assert.equal(payloads.length, 1);
});
test('Property and campaign allowlists exclude photos, profile answers and credentials', () => {
  assert.deepEqual(eventProperties({ gender: 'private', image: 'data:photo', email: 'bad@example.com', plan_id: 'professional', value: 39, currency: 'eur' }), { plan_id: 'professional', value: 39, currency: 'EUR' });
  assert.deepEqual(campaignParams('https://perfilisto.com/?utm_campaign=spring&token=secret&email=private'), { utm_campaign: 'spring' });
  assert.equal(funnelEvent('onboarding_step', { step: 'injected' }), null);
  assert.equal(funnelEvent('purchase'), null); assert.equal(funnelEvent('onboarding_step', null), null);
});
test('Durable delivery retries the same event ID and strips personal payload after success', async () => {
  const data = new Map(); let sent = 0; const ids = [];
  const ctx = { storage: { get: async k => structuredClone(data.get(k)), put: async (k,v) => data.set(k, structuredClone(v)), getAlarm: async () => data.get('alarm'), setAlarm: async t => data.set('alarm', t), deleteAll: async () => data.clear() } };
  const delivery = new AnalyticsDelivery(ctx, { WHOP_EVENTS_API_KEY: 'fake-test-key' });
  const oldFetch = globalThis.fetch;
  globalThis.fetch = async (_url, options) => { ids.push(JSON.parse(options.body).event_id); sent++; return sent === 1 ? new Response(null, { status: 503 }) : Response.json({ id: 'biz:stable' }); };
  try {
    const enqueue = () => delivery.fetch(new Request('https://internal', { method: 'POST', body: JSON.stringify({ event_id: 'stable', user: { email: 'test@example.com' } }) }));
    await Promise.all([enqueue(), enqueue()]);
    await delivery.alarm(); assert.equal(data.get('delivery').status, 'pending');
    await delivery.alarm(); await enqueue(); await delivery.alarm();
    assert.equal(sent, 2); assert.deepEqual(ids, ['stable', 'stable']); assert.equal(data.get('delivery').status, 'sent'); assert.equal(data.get('delivery').payload, undefined);
    data.get('delivery').expires = 0; await delivery.alarm(); assert.equal(data.size, 0);
  } finally { globalThis.fetch = oldFetch; }
});
test('Order event values come from the authenticated order, not browser amounts', async () => {
  const { env, payloads } = environment();
  env.ORDER_PHOTOS = {};
  env.HEADSHOT_ORDERS = { getByName: () => ({ fetch: async r => {
    assert.equal(r.headers.get('X-Order-Owner'), 'google:test-user');
    assert.equal(r.headers.get('Content-Length'), null);
    return Response.json({ planId: 'basic', photos: Array(6).fill({}), status: 'checkout' });
  } }) };
  const body = { ...event, name: 'add_to_cart', id: 'perfilisto:order:11111111-1111-4111-8111-111111111111:cart', props: { plan_id: 'executive', value: 1000, currency: 'usd' } };
  assert.equal((await handleAnalyticsEvent(await request('events', { body }), env)).status, 202);
  assert.equal(payloads[0].value, 29); assert.equal(payloads[0].currency, 'eur'); assert.equal(payloads[0].plan_id, 'plan_a1voNXqHTGoLD');
  env.HEADSHOT_ORDERS.getByName = () => ({ fetch: async () => new Response(null, { status: 404 }) });
  assert.equal((await handleAnalyticsEvent(await request('events', { body }), env)).status, 404);
  assert.equal(payloads.length, 1);
});
