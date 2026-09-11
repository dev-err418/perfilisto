import templates from "./templates.json" with { type: "json" };
const escape = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
export const validEmail = (value) =>
  typeof value === "string" &&
  value.length <= 254 &&
  /^[^\s<>@,;\r\n]+@[^\s<>@,;\r\n]+\.[^\s<>@,;\r\n]+$/.test(value);
export function emailMessage(kind, order) {
  if (
    !["payment", "ready"].includes(kind) ||
    !validEmail(order.customer?.email)
  )
    throw new Error("Invalid email recipient or template");
  if (!/^[a-f0-9-]{36}$/.test(order.id)) throw new Error("Invalid order");
  const actionUrl = `https://perfilisto.com/${kind === "ready" ? "dashboard" : "onboarding"}?order=${order.id}`;
  const name = String(order.customer.name || "")
    .trim()
    .split(/\s+/)[0]
    .replace(/[\r\n]/g, "")
    .slice(0, 60);
  const values = {
    actionUrl: escape(actionUrl),
    year: new Date().getUTCFullYear(),
  };
  const html = templates[kind].replace(
    /\{\{(\w+)\}\}/g,
    (_, key) => values[key] ?? "",
  );
  return {
    from: { email: "hello@perfilisto.com", name: "Perfilisto" },
    to: order.customer.email,
    replyTo: { email: "hello@perfilisto.com", name: "Perfilisto" },
    subject:
      kind === "payment"
        ? "Your payment has been confirmed"
        : `Your headshots are ready${name ? ", " + name : ""} 🎉`,
    html,
    text:
      kind === "payment"
        ? `Payment confirmed\n\nYour order is confirmed. Thank you for your purchase. Your payment has been received.\n\nHead back to your order to check your photos and confirm your details.\n\nView order: ${actionUrl}\n\nQuestions? Reply to hello@perfilisto.com.\n\nWarmly,\nThe Perfilisto Team\n\nhttps://perfilisto.com/privacy · https://perfilisto.com/terms`
        : `Your order is complete\n\nYour headshots are ready. Your professional headshots have been generated and are ready to view and download.\n\nView my headshots: ${actionUrl}\n\nQuestions? Reply to hello@perfilisto.com.\n\nWarmly,\nThe Perfilisto Team\n\nhttps://perfilisto.com/privacy · https://perfilisto.com/terms`,
  };
}
