"use client";

import { useT } from "@/i18n/client";

import { Spinner } from "@/components/ui/spinner";

import { checkoutAttribution } from "@/lib/analytics/client";
import { useRef, useState } from "react";
import Link from "@/i18n/navigation";
import { WhopCheckoutEmbed, useCheckoutEmbedControls, type WhopCheckoutPromoCode } from "@whop/checkout/react";
import { discountAmount } from "@/lib/orders/discount.mjs";
import { IconLock } from "@tabler/icons-react";
import { useMessages } from "@/i18n/client";
import type { Order } from "@/lib/orders/types";
import { useLocale } from "@/i18n/client";
import { getPlans } from "@/lib/orders/catalog.mjs";
import { TrustRating } from "../landing/trust-rating";
import { PRIMARY_TINT_BUTTON_CLASS } from "../landing/button-styles";

export function CheckoutPage({ order, waitingPayment, onComplete }: {
  order: Order;
  waitingPayment: boolean;
  onComplete: (receipt?: string) => void;
}) {
  const t = useT();
  const messages = useMessages();
  const locale = useLocale();
  const plans = getPlans(locale);
  const controls = useCheckoutEmbedControls();
  // Whop snapshots initial props. Keep campaign tags on the first mount and never reset entered card details.
  const [attribution] = useState(checkoutAttribution);
  const [state, setState] = useState<"loading" | "ready" | "disabled">("loading");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [promo, setPromo] = useState<WhopCheckoutPromoCode | null>(null);
  const submitLock = useRef(false);
  const formatter = new Intl.NumberFormat(locale === "es" ? "es-ES" : "en-US", {
    style: "currency", currency: order.currency,
  });
  const amount = formatter.format(order.price);
  const discount = discountAmount(order.price, order.currency, promo);
  const discounted = !!promo;
  const subtotal = discount === null ? null : formatter.format(order.price - discount);
  const processing = submitting || waitingPayment;

  async function pay() {
    if (submitLock.current || state !== "ready" || waitingPayment || !controls.current) return;
    submitLock.current = true;
    setSubmitting(true);
    setError("");
    try {
      await controls.current.submit();
    } catch {
      setError(t("Please check your payment details and try again."));
    } finally {
      submitLock.current = false;
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto grid w-full max-w-6xl overflow-hidden rounded-[28px] border border-black/[0.06] bg-white lg:min-h-[700px] lg:grid-cols-[1.45fr_1fr]">
      <section aria-label={t("Payment details")} className="min-w-0 px-3 py-8 sm:px-8 lg:px-10 lg:py-12">
        <div className="px-4">
          <h1 className="text-3xl font-semibold tracking-tight">{t("Complete your order")}</h1>
          <p className="mt-3 text-sm text-neutral-500">{t("Pay once. No subscription.")}</p>
        </div>
        <div className="mt-7 min-h-80">
          {state === "loading" && <p role="status" className="flex items-center gap-2 px-4 py-4 text-sm text-neutral-500"><Spinner aria-hidden="true" />{t("Loading secure payment form…")}</p>}
          <WhopCheckoutEmbed
            {...attribution}
            ref={controls}
            sessionId={order.checkoutId!}
            returnUrl={`${typeof window !== "undefined" ? window.location.origin : "https://perfilisto.com"}/${locale}/onboarding?order=${order.id}`}
            locale={locale}
            theme="light"
            adaptivePricing={false}
            prefill={order.checkoutEmail ? { email: order.checkoutEmail } : undefined}
            hideEmail={!!order.checkoutEmail}
            disableEmail={!!order.checkoutEmail}
            hideSubmitButton
            hideTermsAndConditions
            themeOptions={{ accentColor: "#ff7416", borderRadius: 12 }}
            onStateChange={setState}
            onPromoCodeChanged={setPromo}
            onPaymentError={(failure) => {
              setError(failure.message || t("Your payment could not be completed. Please try again."));
              submitLock.current = false;
              setSubmitting(false);
            }}
            onComplete={(_plan, receipt) => onComplete(receipt)}
          />
        </div>
        <div className="px-4">
          {error && <p role="alert" className="mb-4 text-sm text-red-600">{error}</p>}
          <button
            type="button"
            onClick={() => void pay()}
            disabled={state !== "ready" || processing}
            aria-busy={processing}
            className={`${PRIMARY_TINT_BUTTON_CLASS} inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-full px-7 py-3 font-semibold disabled:pointer-events-none disabled:opacity-40`}
          >
            {state === "loading" && !processing ? <><Spinner className="size-5" aria-hidden="true" />{t("Loading checkout…")}</> : processing ? <><Spinner className="size-5" />{waitingPayment ? t("Confirming payment…") : t("Processing payment…")}</> : discounted ? t("Pay securely") : t("Pay {v0}", { v0: amount })}
          </button>
          <p className="mt-3 text-center text-xs text-neutral-500">{t("Made in")} <span aria-hidden="true">🇪🇸</span> {t("Spain")}</p>
          <p role="status" className="mt-3 flex items-center justify-center gap-2 text-center text-xs text-neutral-500">
            {waitingPayment && <Spinner aria-hidden="true" />}
            {waitingPayment ? t("Waiting for secure payment confirmation…") : t("Your payment details are encrypted and securely processed by Whop.")}
          </p>
          <p className="mt-4 text-center text-xs leading-relaxed text-neutral-500">{t("By purchasing, you agree to Perfilisto’s")} <Link href="/terms" target="_blank" className="underline underline-offset-2">{t("Terms")}</Link> {t("and")} <Link href="/privacy" target="_blank" className="underline underline-offset-2">{t("Privacy Policy")}</Link>.
          </p>
        </div>
      </section>
      <aside className="min-w-0 border-t border-black/[0.06] bg-[#fafafa] px-7 py-9 sm:px-10 lg:border-t-0 lg:border-l lg:py-12">
        <h2 className="text-2xl font-semibold tracking-tight">{t("Price breakdown")}</h2>
        <p className="mt-7 text-sm text-neutral-500">{t("One-time payment")}</p>
        <p className="mt-2 text-4xl font-semibold tracking-tight" aria-live="polite">{subtotal ?? t("See payment form")}</p>
        <div className="mt-8 flex items-start justify-between gap-4 border-b border-black/10 pb-6 text-sm">
          <div><p className="font-medium">{t(order.name)} {t("headshots")}</p><p className="mt-2 text-neutral-500">{order.photoCount} {t("personalized headshots · Qty: 1")}</p></div>
          <span>{amount}</span>
        </div>
        <dl className="space-y-4 border-b border-black/10 py-6 text-sm">
          <div className="flex justify-between gap-4"><dt>{t("Package price")}</dt><dd>{amount}</dd></div>
          {promo && <div className="flex justify-between gap-4 text-primary"><dt>{t("Discount ·")} {promo.code}</dt><dd>{discount === null ? t("Applied in payment form") : `−${formatter.format(discount)}`}</dd></div>}
          <div className="flex justify-between gap-4"><dt>{t("Delivery")}</dt><dd>{t("Within")} {t(order.deliveryTime || plans.find(p => p.id === order.planId)?.deliveryTime || "")}</dd></div>
        </dl>
        <div className="mt-6 flex justify-between gap-4 font-semibold" aria-live="polite"><span>{discounted ? t("Subtotal after discount") : t("Subtotal")}</span><span>{subtotal ?? t("See payment form")}</span></div>
        <p className="mt-3 text-xs leading-relaxed text-neutral-500">{t("The payment form shows the final total, including any applicable taxes or discounts, before you pay.")}</p>
        <div className="mt-10 border-t border-black/10 pt-7">
          <h3 className="text-lg font-semibold">{t("A first impression you’ll love")}</h3>
          <TrustRating messages={messages} className="mt-5 flex-wrap" />
          <p className="mt-6 flex items-start gap-3 text-sm leading-relaxed text-neutral-500"><IconLock className="mt-0.5 size-5 shrink-0 text-primary" />{t("Your photos stay private. We use them to create your headshots.")}</p>
        </div>
      </aside>
    </div>
  );
}
