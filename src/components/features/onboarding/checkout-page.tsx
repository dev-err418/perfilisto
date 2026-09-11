"use client";

import { Spinner } from "@/components/ui/spinner";

import { useRef, useState } from "react";
import Link from "next/link";
import { WhopCheckoutEmbed, useCheckoutEmbedControls } from "@whop/checkout/react";
import { IconLock, IconShieldCheck } from "@tabler/icons-react";
import { getMessages } from "@/i18n";
import type { Order } from "@/lib/orders/types";
import plans from "@/lib/orders/plans.json";
import { TrustRating } from "../landing/trust-rating";
import { PRIMARY_TINT_BUTTON_CLASS } from "../landing/button-styles";

export function CheckoutPage({ order, waitingPayment, onComplete }: {
  order: Order;
  waitingPayment: boolean;
  onComplete: (receipt?: string) => void;
}) {
  const controls = useCheckoutEmbedControls();
  const [state, setState] = useState<"loading" | "ready" | "disabled">("loading");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [discounted, setDiscounted] = useState(false);
  const submitLock = useRef(false);
  const amount = new Intl.NumberFormat("en-IE", {
    style: "currency", currency: order.currency,
  }).format(order.price);
  const processing = submitting || waitingPayment;

  async function pay() {
    if (submitLock.current || state !== "ready" || waitingPayment || !controls.current) return;
    submitLock.current = true;
    setSubmitting(true);
    setError("");
    try {
      await controls.current.submit();
    } catch {
      setError("Please check your payment details and try again.");
    } finally {
      submitLock.current = false;
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto grid w-full max-w-6xl overflow-hidden rounded-[28px] border border-black/[0.06] bg-white lg:min-h-[700px] lg:grid-cols-[1.45fr_1fr]">
      <section aria-label="Payment details" className="min-w-0 px-3 py-8 sm:px-8 lg:px-10 lg:py-12">
        <div className="px-4">
          <h1 className="text-3xl font-semibold tracking-tight">Complete your order</h1>
          <p className="mt-3 text-sm text-neutral-500">Pay once. No subscription.</p>
        </div>
        <div className="mt-7 min-h-80">
          {state === "loading" && <p role="status" className="flex items-center gap-2 px-4 py-4 text-sm text-neutral-500"><Spinner aria-hidden="true" />Loading secure payment form…</p>}
          <WhopCheckoutEmbed
            ref={controls}
            sessionId={order.checkoutId!}
            returnUrl={`${typeof window !== "undefined" ? window.location.origin : "https://perfilisto.com"}/onboarding?order=${order.id}`}
            theme="light"
            adaptivePricing={false}
            prefill={order.checkoutEmail ? { email: order.checkoutEmail } : undefined}
            hideEmail={!!order.checkoutEmail}
            disableEmail={!!order.checkoutEmail}
            hideSubmitButton
            hideTermsAndConditions
            themeOptions={{ accentColor: "#ff7416", borderRadius: 12 }}
            onStateChange={setState}
            onPromoCodeChanged={(promo) => setDiscounted(!!promo)}
            onPaymentError={(failure) => {
              setError(failure.message || "Your payment could not be completed. Please try again.");
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
            {state === "loading" && !processing ? <><Spinner className="size-5" aria-hidden="true" />Loading checkout…</> : processing ? <><Spinner className="size-5" />{waitingPayment ? "Confirming payment…" : "Processing payment…"}</> : <><IconLock className="size-4" />{discounted ? "Pay securely" : `Pay ${amount}`}</>}
          </button>
          <p role="status" className="mt-3 flex items-center justify-center gap-2 text-center text-xs text-neutral-500">
            {waitingPayment && <Spinner aria-hidden="true" />}
            {waitingPayment ? "Waiting for secure payment confirmation…" : "Your payment details are encrypted and securely processed by Whop."}
          </p>
          <p className="mt-4 text-center text-xs leading-relaxed text-neutral-500">
            By purchasing, you agree to Perfilisto’s <Link href="/terms" target="_blank" className="underline underline-offset-2">Terms</Link> and <Link href="/privacy" target="_blank" className="underline underline-offset-2">Privacy Policy</Link>.
          </p>
        </div>
      </section>
      <aside className="min-w-0 border-t border-black/[0.06] bg-[#fafafa] px-7 py-9 sm:px-10 lg:border-t-0 lg:border-l lg:py-12">
        <h2 className="text-2xl font-semibold tracking-tight">Price breakdown</h2>
        <p className="mt-7 text-sm text-neutral-500">One-time payment</p>
        <p className="mt-2 text-4xl font-semibold tracking-tight">{amount}</p>
        <div className="mt-8 flex items-start justify-between gap-4 border-b border-black/10 pb-6 text-sm">
          <div><p className="font-medium">{order.name} headshots</p><p className="mt-2 text-neutral-500">{order.photoCount} personalized headshots · Qty: 1</p></div>
          <span>{amount}</span>
        </div>
        <dl className="space-y-4 border-b border-black/10 py-6 text-sm">
          <div className="flex justify-between gap-4"><dt>Package price</dt><dd>{amount}</dd></div>
          <div className="flex justify-between gap-4"><dt>Delivery</dt><dd>Within {order.deliveryTime || plans.find(p => p.id === order.planId)?.deliveryTime}</dd></div>
        </dl>
        <div className="mt-6 flex justify-between gap-4 font-semibold"><span>{discounted ? "Before discount" : "Total due today"}</span><span>{amount}</span></div>
        <p className="mt-3 text-xs leading-relaxed text-neutral-500">The payment form shows the final total, including any applicable taxes or discounts, before you pay.</p>
        <div className="mt-10 border-t border-black/10 pt-7">
          <h3 className="text-lg font-semibold">A first impression you’ll love</h3>
          <TrustRating messages={getMessages()} className="mt-5 flex-wrap" />
          <p className="mt-6 flex items-start gap-3 text-sm leading-relaxed text-neutral-500"><IconShieldCheck className="mt-0.5 size-5 shrink-0 text-primary" />Your photos stay private. We use them to create your headshots.</p>
        </div>
      </aside>
    </div>
  );
}
