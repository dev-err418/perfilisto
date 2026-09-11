import type { Order } from "./types";

export async function loadCurrentOrder(): Promise<Order | null> {
  const response = await fetch("/api/orders/current", { cache: "no-store" });
  if (response.ok) {
    const order = await response.json();
    if (order?.id) return order;
  } else if (response.status !== 404) {
    throw new Error("Could not restore your headshots. Please try again.");
  }
  // Support orders created before the account dashboard index was introduced.
  let id: string | null = null;
  try { id = localStorage.getItem("perfilisto-active-order"); } catch { /* Optional storage. */ }
  if (!id) return null;
  const saved = await fetch(`/api/orders/${encodeURIComponent(id)}`, { cache: "no-store" });
  if (saved.status === 404 || saved.status === 410) return null;
  if (!saved.ok) throw new Error("Could not restore your headshots. Please try again.");
  return saved.json();
}
