// Next dev runs the same order engine as Cloudflare, using private local files.
import fs from "node:fs/promises";
import path from "node:path";
import { HeadshotOrder, handleOrders } from "../../../worker/headshot-order.js";
const root = path.join(process.cwd(), ".next", "perfilisto-orders");
const instances = new Map();
const safe = (value) => {
  if (!/^[a-zA-Z0-9/-]+$/.test(value)) throw new Error("Invalid storage key");
  return value;
};
const storageFor = (id) => ({
  async get(key) {
    try {
      return JSON.parse(
        await fs.readFile(path.join(root, id, safe(key) + ".json"), "utf8"),
      );
    } catch (e) {
      if (e.code === "ENOENT") return undefined;
      throw e;
    }
  },
  async put(key, value) {
    const dir = path.join(root, id);
    await fs.mkdir(dir, { recursive: true, mode: 0o700 });
    const target = path.join(dir, safe(key) + ".json");
    await fs.writeFile(target + ".tmp", JSON.stringify(value), { mode: 0o600 });
    await fs.rename(target + ".tmp", target);
  },
  async setAlarm(value) {
    await this.put("alarm", value);
  },
  async deleteAll() {
    await fs.rm(path.join(root, id), { recursive: true, force: true });
  },
});
const ORDER_PHOTOS = {
  async put(key, bytes) {
    const file = path.join(root, "photos", safe(key));
    await fs.mkdir(path.dirname(file), { recursive: true, mode: 0o700 });
    await fs.writeFile(file, bytes, { mode: 0o600 });
  },
  async get(key) {
    try {
      const bytes = await fs.readFile(path.join(root, "photos", safe(key)));
      return {
        body: bytes,
        arrayBuffer: async () =>
          bytes.buffer.slice(
            bytes.byteOffset,
            bytes.byteOffset + bytes.byteLength,
          ),
      };
    } catch (e) {
      if (e.code === "ENOENT") return null;
      throw e;
    }
  },
  async delete(key) {
    await fs.rm(path.join(root, "photos", safe(key)), { force: true });
  },
};
export function localEnv() {
  const env = { ...process.env, ORDER_PHOTOS };
  env.HEADSHOT_ORDERS = {
    getByName(id) {
      if (!instances.has(id))
        instances.set(id, new HeadshotOrder({ storage: storageFor(id) }, env));
      const instance = instances.get(id);
      instance.env = env;
      return instance;
    },
  };
  return env;
}
export async function localOrders(request) {
  return handleOrders(request, localEnv());
}
