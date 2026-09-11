import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EmailDelivery } from './email-delivery.js';
import { emailMessage } from '../src/lib/email/messages.mjs';
const order = { id: '11111111-1111-4111-8111-111111111111', customer: { email: 'owner@example.com', name: 'Arthur Example' } };
function setup(send = async () => ({ messageId: 'sent-one' })) {
  const data = new Map();
  const storage = {
    get: async k => structuredClone(data.get(k)),
    put: async (k,v) => data.set(k, structuredClone(v)),
    getAlarm: async () => data.get('alarm'),
    setAlarm: async v => data.set('alarm', v),
    deleteAll: async () => data.clear(),
  };
  const delivery = new EmailDelivery({ storage }, { EMAIL: { send } });
  const enqueue = () => delivery.fetch(new Request('https://internal/deliver', { method: 'POST', body: JSON.stringify({ kind: 'payment', order }) }));
  return { delivery, data, enqueue };
}
test('Email templates use Perfilisto, private order links and no Aragon tracking', () => {
  for (const kind of ['payment','ready']) {
    const m = emailMessage(kind, order);
    assert.equal(m.from.email, 'hello@perfilisto.com');
    assert.equal(m.replyTo.email, 'hello@perfilisto.com');
    assert.equal(m.to, order.customer.email);
    assert.match(m.html, /Perfilisto/);
    assert.doesNotMatch(m.html, /aragon|sendgrid|\{\{|wf\/open/i);
    assert.match(m.html, new RegExp(`https://perfilisto.com/${kind === 'ready' ? 'dashboard' : 'onboarding'}\\?order=${order.id}`));
    for (const url of m.html.matchAll(/(?:href|src)="([^"]+)"/g))
      assert.ok(url[1].startsWith('https://perfilisto.com/') || url[1] === 'mailto:hello@perfilisto.com', url[1]);
  }
  assert.match(emailMessage('ready', order).subject, /Arthur 🎉$/);
  assert.throws(() => emailMessage('ready', {...order, customer: {email: 'victim@example.com\r\nBcc: other@example.com'}}));
  assert.throws(() => emailMessage('ready', {...order, id: '<script>'}));
});
test('Duplicate events and alarms send once and remove recipient/body after delivery', async () => {
  let sends = 0;
  const s = setup(async () => { sends++; return { messageId: 'sent-one' }; });
  await Promise.all([s.enqueue(), s.enqueue()]);
  await s.delivery.alarm();
  await s.enqueue();
  await s.delivery.alarm();
  assert.equal(sends, 1);
  const record = s.data.get('delivery');
  assert.equal(record.status, 'sent');
  assert.equal(record.message, undefined);
});
test('Transient failures retry the stored message; enqueue repairs an interrupted alarm', async () => {
  let sends = 0;
  const s = setup(async () => { if (++sends === 1) throw Object.assign(new Error(), {code:'E_INTERNAL_SERVER_ERROR'}); return {messageId:'recovered'}; });
  await s.enqueue();
  s.data.delete('alarm');
  await s.enqueue();
  assert.ok(s.data.get('alarm'));
  await s.delivery.alarm();
  assert.equal(s.data.get('delivery').status, 'pending');
  assert.ok(s.data.get('alarm') > Date.now());
  await s.delivery.alarm();
  assert.equal(s.data.get('delivery').messageId, 'recovered');
});
test('Suppressed recipients are not retried; expired records are deleted', async () => {
  let sends = 0;
  const s = setup(async () => { sends++; throw Object.assign(new Error(), {code:'E_RECIPIENT_SUPPRESSED'}); });
  await s.enqueue();
  await s.delivery.alarm();
  await s.delivery.alarm();
  assert.equal(sends, 1);
  assert.equal(s.data.get('delivery').status, 'failed');
  assert.equal(s.data.get('delivery').message, undefined);
  s.data.get('delivery').expiresAt = 0;
  await s.delivery.alarm();
  assert.equal(s.data.size, 0);
});
