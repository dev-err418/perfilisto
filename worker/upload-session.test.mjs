import test from "node:test";
import assert from "node:assert/strict";
import { UploadSession } from "./upload-session.js";

function fixture() {
  const values = new Map();
  const storage = {
    alarmAt: null,
    async get(key) {
      return Array.isArray(key)
        ? new Map(key.map((k) => [k, structuredClone(values.get(k))]))
        : structuredClone(values.get(key));
    },
    async put(key, value) { values.set(key, structuredClone(value)); },
    async delete(keys) { for (const key of [].concat(keys)) values.delete(key); },
    async deleteAll() { values.clear(); this.alarmAt = null; },
    async setAlarm(time) { this.alarmAt = time; },
    async transaction(fn) { return fn(this); },
  };
  const object = new UploadSession({ storage, blockConcurrencyWhile: (fn) => fn() });
  const request = (method, body, query = "") => object.fetch(new Request(`https://perfilisto.com/api/upload-sessions/test${query}`, {
    method,
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  }));
  return { request, object, storage, values };
}
const photo = (id) => ({ id, name: `${id}.jpg`, dataUrl: "data:image/jpeg;base64," + "A".repeat(300_000) });

test("retries deduplicate photos, known photos omit payloads, and deleting frees capacity", async () => {
  const { request } = fixture();
  await request("POST");
  const photos = Array.from({ length: 10 }, (_, i) => photo(`photo-${i}`));
  assert.equal((await request("PUT", { photos })).status, 200);
  assert.equal((await request("PUT", { photos })).status, 200);
  assert.equal((await request("PUT", { photos: [photo("overflow")] })).status, 400);
  const delta = await (await request("GET", undefined, `?known=${photos.slice(0, 9).map((p) => p.id).join(",")}`)).json();
  assert.equal(delta.ids.length, 10);
  assert.deepEqual(delta.photos, [photos[9]]);
  await request("DELETE", { id: photos[0].id });
  assert.equal((await request("PUT", { photos: [photo("replacement")] })).status, 200);
  const final = await (await request("GET")).json();
  assert.equal(final.photos.length, 10);
  assert.ok(!final.ids.includes(photos[0].id));
});

test("expired sessions reject reads and writes, and cleanup removes photo data", async () => {
  const { request, storage, values, object } = fixture();
  await request("POST");
  await request("PUT", { photos: [photo("one")] });
  const session = await storage.get("session");
  await storage.put("session", { ...session, expiresAt: Date.now() - 1 });
  assert.equal((await request("GET")).status, 404);
  assert.equal(values.size, 0);
  assert.equal((await request("PUT", { photos: [photo("two")] })).status, 404);
  await request("POST");
  await request("PUT", { photos: [photo("three")] });
  await object.alarm();
  assert.equal(values.size, 0);
});

test("invalid photo input cannot partially add a batch", async () => {
  const { request } = fixture();
  await request("POST");
  assert.equal((await request("PUT", { photos: [photo("good"), { ...photo("bad"), dataUrl: "not an image" }] })).status, 400);
  assert.deepEqual((await (await request("GET")).json()).photos, []);
});
