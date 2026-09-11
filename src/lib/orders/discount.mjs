// Prices and fixed discounts use major currency units. Round once to cents.
export function discountAmount(price, currency, promo) {
  if (!promo) return 0;
  const amount = promo.amount;
  if (typeof amount !== "number" || !Number.isFinite(amount) || amount < 0)
    return null;
  // Whop's payment/checkout responses express percentages as fractions (0.1 = 10%).
  if (promo.type === "percentage" && amount <= 1)
    return Math.round(price * amount * 100) / 100;
  if (promo.type === "flat_amount" && promo.currency?.toLowerCase() === currency.toLowerCase())
    return Math.min(price, Math.round(amount * 100) / 100);
  return null;
}
