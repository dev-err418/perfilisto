import assert from "node:assert/strict";
import test from "node:test";
import { getToken } from "@auth/core/jwt";
import { EmailAuth } from "./email-auth.js";
import { handleAuth, hasSession } from "../src/lib/auth/server.mjs";
import { normalizeEmail } from "../src/lib/auth/email.mjs";

const origin = "https://perfilisto.com";
function setup(sendFailure = false) {
  const data = new Map(), messages = [], objects = new Map();
  const env = { AUTH_SECRET: "only-a-test-secret", EMAIL: { send: async message => { messages.push(message); if (sendFailure) throw new Error("private provider detail"); return { messageId: "sent" }; } }, AUTH_RATE_LIMIT: { limit: async () => ({ success: true }) } };
  env.EMAIL_AUTH = { getByName: id => {
    if (!objects.has(id)) {
      const state = new Map();data.set(id,state);
      objects.set(id,new EmailAuth({ storage: { get: async k => structuredClone(state.get(k)), put: async (k,v) => state.set(k,structuredClone(v)), setAlarm: async v => state.set("alarm",v), deleteAll: async () => state.clear() } },env));
    }
    return objects.get(id);
  } };
  const req = (action,body, cookie = "", headers = {}) => handleAuth(new Request(`${origin}/api/auth/email/${action}`, { method: "POST", headers: { Origin: origin, "Content-Type": "application/json", "CF-Connecting-IP": "192.0.2.1", Cookie: cookie, ...headers }, body: JSON.stringify(body) }), env);
  const send = async (email = "alice@example.com", locale = "en") => {
    const response = await req("send", { email, locale });
    if (response.ok) await [...objects.values()].at(-1).alarm();
    return { response, cookie: response.headers.getSetCookie()[0]?.split(";")[0], code: messages.at(-1)?.text.match(/\n\n(\d{6})\n/)[1] };
  };
  const record = () => [...data.values()][0];
  return { env, data, messages, objects, req, send, record };
}

test("email code creates an Auth.js-compatible session with a safe redirect and private cookies", async () => {
  const s=setup(), sent=await s.send(" Alice@Example.com ");
  assert.equal(sent.response.status,200);
  assert.equal(s.messages[0].to,"alice@example.com");
  assert.match(sent.response.headers.get("Set-Cookie"), /HttpOnly; SameSite=Lax; Secure/);
  const r=await s.req("verify",{ email:"alice@example.com",code:sent.code,callbackUrl:"/es/onboarding?plan=pro" },sent.cookie);
  assert.equal(r.status,200);
  assert.equal((await r.json()).url,`${origin}/es/onboarding?plan=pro`);
  const cookie=r.headers.getSetCookie().find(c=>c.startsWith("__Secure-authjs.session-token=")).split(";")[0];
  const request=new Request(origin,{headers:{cookie}});
  assert.equal(await hasSession(request,s.env),true);
  const token=await getToken({req:request,secret:s.env.AUTH_SECRET,secureCookie:true});
  assert.match(token.sub,/^email:[a-f0-9]{64}$/);assert.equal(token.email,"alice@example.com");
  assert.equal((await s.req("verify",{email:"alice@example.com",code:sent.code},sent.cookie)).status,400);
});

test("concurrent redemptions accept the code exactly once",async()=>{
  const s=setup(),a=await s.send();
  const results=await Promise.all([1,2,3].map(()=>s.req("verify",{email:"alice@example.com",code:a.code},a.cookie)));
  assert.deepEqual(results.map(r=>r.status).sort(),[200,400,400]);
});

test("wrong browser, wrong email, and cross-origin requests cannot redeem a code",async()=>{
  const s=setup(),a=await s.send();
  for(const [email,cookie,headers] of [["alice@example.com","",{}],["bob@example.com",a.cookie,{}],["alice@example.com",a.cookie,{Origin:"https://evil.example"}]]) {
    const r=await s.req("verify",{email,code:a.code},cookie,headers);assert.ok(r.status>=400);assert.equal(r.headers.has("Set-Cookie"),false);
  }
  assert.equal((await s.req("verify",{email:"alice@example.com",code:a.code},a.cookie)).status,200);
});

test("five incorrect codes invalidate the challenge, and expired codes fail",async()=>{
  const s=setup(),a=await s.send();const wrong=a.code==="000000"?"000001":"000000";
  for(let i=0;i<5;i++)assert.equal((await s.req("verify",{email:"alice@example.com",code:wrong},a.cookie)).status,400);
  assert.equal((await s.req("verify",{email:"alice@example.com",code:a.code},a.cookie)).status,400);
  const other=setup(),b=await other.send();const r=other.record().get("challenge");r.expires=Date.now()-1;
  assert.equal((await other.req("verify",{email:"alice@example.com",code:b.code},b.cookie)).status,400);
});

test("resends are throttled per email and rotate the code and browser binding",async()=>{
  const s=setup(),a=await s.send();
  assert.equal((await s.send("ALICE@example.com")).response.status,429);
  s.record().get("challenge").nextSend=Date.now()-1;
  const b=await s.send();assert.equal(b.response.status,200);
  assert.equal((await s.req("verify",{email:"alice@example.com",code:a.code},a.cookie)).status,400);
  assert.equal((await s.req("verify",{email:"alice@example.com",code:b.code},b.cookie)).status,200);
  s.record().get("challenge").nextSend=Date.now()-1;s.record().get("challenge").sends=5;
  assert.equal((await s.send()).response.status,429);
});

test("IP limits, input bounds, origin, and delivery failures fail safely",async()=>{
  const s=setup();s.env.AUTH_RATE_LIMIT.limit=async()=>({success:false});assert.equal((await s.send()).response.status,429);assert.equal(s.messages.length,0);
  s.env.AUTH_RATE_LIMIT.limit=async()=>({success:true});
  assert.equal((await s.req("send",{email:"alice@example.com"},"",{Origin:"https://evil.example"})).status,403);
  assert.equal((await s.req("send",{email:"a".repeat(3000)})).status,413);
  assert.equal((await s.send("a@example.com\r\nBcc: victim@example.com")).response.status,400);
  const failed=setup(true),r=await failed.send();assert.equal(r.response.status,200);assert.ok(r.cookie);assert.ok(failed.record().get("challenge").delivery);
  assert.equal(JSON.stringify(await r.response.json()).includes("private provider detail"),false);
});

test("storage holds no email or plaintext code; cleanup removes expired challenge material",async()=>{
  const s=setup(),a=await s.send("alice@example.com","es");const record=s.record().get("challenge");
  assert.deepEqual(Object.keys(record).sort(),["attempts","challenge","digest","expires","nextSend","sends","windowEnds"].sort());
  assert.notEqual(record.digest,a.code);assert.match(s.messages[0].subject,/código/);
  record.expires=Date.now()-1;await [...s.objects.values()][0].alarm();assert.equal(s.record().get("challenge").digest,undefined);
  s.record().get("challenge").windowEnds=Date.now()-1;await [...s.objects.values()][0].alarm();assert.equal(s.record().size,0);
});

test("email status is unavailable without bindings and redirects cannot leave Perfilisto",async()=>{
  assert.equal(normalizeEmail(" Alice@Example.com "),"alice@example.com");
  const disabled=await handleAuth(new Request(`${origin}/api/auth/email/status`),{AUTH_SECRET:"test"});assert.deepEqual(await disabled.json(),{enabled:false});
  const s=setup(),a=await s.send();const r=await s.req("verify",{email:"alice@example.com",code:a.code,callbackUrl:"https://evil.example/onboarding"},a.cookie);
  assert.equal((await r.json()).url,origin+"/dashboard");
});


test("send returns the browser cookie before slow delivery, and verification does not wait for acknowledgement", async () => {
  const s = setup();
  let acknowledge;
  s.env.EMAIL.send = async message => {
    s.messages.push(message);
    return new Promise(resolve => { acknowledge = resolve; });
  };
  const response = await s.req("send", { email: "alice@example.com" });
  assert.equal(response.status, 200);
  assert.equal(s.messages.length, 0);
  const stored = JSON.stringify(s.record().get("challenge"));
  assert.equal(stored.includes("alice@example.com"), false);
  const delivery = [...s.objects.values()][0].alarm();
  while (!acknowledge) await new Promise(resolve => setImmediate(resolve));
  const code = s.messages[0].text.match(/\n\n(\d{6})\n/)[1];
  const cookie = response.headers.getSetCookie()[0].split(";")[0];
  const verified = await s.req("verify", { email: "alice@example.com", code }, cookie);
  assert.equal(verified.status, 200);
  acknowledge({ messageId: "sent" });
  await delivery;
  assert.equal(s.record().get("challenge").delivery, undefined);
});

test("delivery failures retry the same encrypted code", async () => {
  const s = setup(true);
  const first = await s.send();
  s.env.EMAIL.send = async message => { s.messages.push(message); return { messageId: "sent" }; };
  await [...s.objects.values()][0].alarm();
  assert.equal(s.messages[1].text, s.messages[0].text);
  assert.equal(s.record().get("challenge").delivery, undefined);
  assert.equal((await s.req("verify", { email: "alice@example.com", code: first.code }, first.cookie)).status, 200);
});
