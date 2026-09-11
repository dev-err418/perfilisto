"use client";

import { trackFunnel } from "@/lib/analytics/client";
import { Spinner } from "@/components/ui/spinner";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { FinishingSteps, type FinishingStep } from "./finishing-steps";
import { ConsentCheckbox } from "./consent-checkbox";
import { AlbumPage, GenerationSubmitted } from "./album-page";
import { ResultImageScroll } from "./result-image-scroll";
import { CheckoutPage } from "./checkout-page";
import {
  IconCheck,
  IconLock,
  IconX,
  IconPhoto,
  IconClock,
  IconArrowRight,
  IconInfoCircle,
} from "@tabler/icons-react";
import plans from "@/lib/orders/plans.json";
import type { Order, Preferences } from "@/lib/orders/types";
import { getMessages } from "@/i18n";
import { fileToJpegDataUrl } from "@/lib/upload-session-client";
import { cn } from "@/lib/utils";
import { TrustRating } from "../landing/trust-rating";
import { LogoMark } from "../landing/logo-mark";
import { PRIMARY_TINT_BUTTON_CLASS } from "../landing/button-styles";
import { OnboardingStepShell } from "./step-shell";
import { UploadStep, type UploadedPhoto } from "./upload-step";

const primary = `${PRIMARY_TINT_BUTTON_CLASS} inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-7 py-3 font-semibold disabled:opacity-40 disabled:pointer-events-none`;
const secondary =
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-black/10 bg-[#f4f4f4] px-6 py-3 font-semibold hover:bg-[#ebebeb] disabled:opacity-40";
const money = (value: number, currency = "eur") =>
  new Intl.NumberFormat("en-IE", { style: "currency", currency }).format(value);
const examples = [
  "/onboarding/attire/woman-professional.jpg",
  "/onboarding/backgrounds/man-city.jpg",
  "/onboarding/backgrounds/woman-office.jpg",
  "/onboarding/attire/man-business-casual.jpg",
];
const savedOrderKey = "perfilisto-active-order";

async function api(
  id: string,
  action = "",
  body?: unknown,
  method = "POST",
): Promise<Order> {
  const response = await fetch(
    `/api/orders/${id}${action ? `/${action}` : ""}`,
    {
      method,
      headers: { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(180_000),
    },
  );
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Please try again.");
  return data;
}
async function encodePhotos(photos: UploadedPhoto[]) {
  const result = [];
  for (const photo of photos) {
    const blob = await (await fetch(photo.url)).blob();
    result.push({
      id: photo.id,
      name: photo.name,
      dataUrl: await fileToJpegDataUrl(
        new File([blob], photo.name, { type: blob.type }),
      ),
    });
  }
  return result;
}
function Modal({
  title,
  children,
  onClose,
  wide = false,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      dialog?.close();
      document.body.style.overflow = overflow;
    };
  }, []);
  return (
    <dialog
      ref={ref}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      aria-label={title}
      className={cn(
        "theme-light fixed inset-0 m-auto max-h-[90dvh] w-[calc(100%-2rem)] overflow-y-auto rounded-[28px] bg-white p-6 text-[#171717] shadow-2xl backdrop:bg-black/45 sm:p-9",
        wide ? "max-w-3xl" : "max-w-xl",
      )}
    >
      <button
        className="absolute top-4 right-4 grid size-10 place-items-center rounded-full hover:bg-black/5"
        aria-label="Close dialog"
        onClick={onClose}
      >
        <IconX className="size-5" />
      </button>
      {children}
    </dialog>
  );
}
function Requirements() {
  const copy = getMessages().onboarding.upload;
  return (
    <div className="space-y-5">
      <details
        open
        className="rounded-2xl border border-green-700/10 bg-[#f3faf5] p-5"
      >
        <summary className="cursor-pointer font-semibold">
          Photo requirements
        </summary>
        <div className="mt-4 grid gap-5 sm:grid-cols-2">
          {copy.requirementGroups.map((group) => (
            <div key={group.caption} className="group relative" tabIndex={0}>
              <div className="grid grid-cols-2 gap-2">
                {group.photos.map((photo) => (
                  <div
                    key={photo.src}
                    className="relative overflow-hidden rounded-xl"
                  >
                    <Image
                      src={photo.src}
                      alt={photo.label}
                      width={200}
                      height={200}
                      unoptimized
                      className="aspect-[4/5] w-full object-cover"
                    />
                    <span className="absolute inset-x-2 bottom-2 rounded-full bg-white/95 p-1 text-center text-[10px] font-bold uppercase">
                      {photo.label}
                    </span>
                  </div>
                ))}
              </div>
              <p className="mt-2 text-sm font-medium">{group.caption}</p>
              <div className="pointer-events-none absolute inset-x-0 bottom-10 hidden rounded-xl bg-white p-4 text-sm shadow-xl group-focus-visible:block [@media(hover:hover)]:group-hover:block">
                {group.caption}. Keep your face clearly visible, use recent
                photos and natural lighting.
              </div>
            </div>
          ))}
        </div>
      </details>
      <details className="rounded-2xl border border-red-200/60 bg-[#fff7f7] p-5">
        <summary className="cursor-pointer font-semibold">
          Photo restrictions
        </summary>
        <p className="mt-3 text-sm text-neutral-600">
          Avoid group photos, sunglasses, covered faces, blur, extreme angles,
          or photos where your face is too small.
        </p>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {copy.restrictionPhotos.map((photo) => (
            <div key={photo.src}>
              <Image
                src={photo.src}
                alt={photo.label}
                width={160}
                height={160}
                unoptimized
                className="aspect-square w-full rounded-xl object-cover"
              />
              <p className="mt-1 text-xs">{photo.label}</p>
            </div>
          ))}
        </div>
      </details>
    </div>
  );
}

export function PostUploadFlow({
  photos,
  preferences,
  onBack,
  onClose,
}: {
  photos: UploadedPhoto[];
  preferences: Preferences;
  onBack: () => void;
  onClose: () => void;
}) {
  const router = useRouter();
  const [finishing, setFinishing] = useState<FinishingStep>("photos");
  const [details, setDetails] = useState<Preferences>({
    ...preferences,
    poses: ["professional", "relaxed"],
    glasses: "none",
    headwear: "reference",
  });
  const [submitted, setSubmitted] = useState(false);
  const [detailsConsent, setDetailsConsent] = useState(false);
  const [selected, setSelected] = useState("professional");
  const [order, setOrder] = useState<Order | null>(null);
  const sourcePhotos = useRef(photos);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [restoring, setRestoring] = useState(true);
  const [modal, setModal] = useState<
    "payment" | "framing" | "confirm" | "submit" | null
  >(null);
  const [ownPhotos, setOwnPhotos] = useState(false);
  const [acceptedFraming, setAcceptedFraming] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editPhotos, setEditPhotos] = useState<UploadedPhoto[]>([]);
  const [toast, setToast] = useState(false);
  const [demo, setDemo] = useState(false);
  const [waitingPayment, setWaitingPayment] = useState(false);
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [order?.status, editing, finishing]);
  const pendingId = useRef<string | null>(null);
  const plan = plans.find((p) => p.id === selected)!;
  const lock = useRef(false);
  const run = async (label: string, fn: () => Promise<void>) => {
    if (lock.current) return;
    lock.current = true;
    setBusy(label);
    setError("");
    try {
      await fn();
    } catch (e) {
      if (label === "Saving your photos…") trackFunnel("order_preparation_failed");
      setError(e instanceof Error ? e.message : "Please try again.");
    } finally {
      lock.current = false;
      setBusy("");
    }
  };
  const remember = useCallback((next: Order) => {
    setOrder(next);
    setSelected(next.planId);
    if (next.preferences)
      setDetails({
        poses: ["professional", "relaxed"],
        glasses: "none",
        headwear: "reference",
        ...next.preferences,
      });
    if (next.photos.length) sourcePhotos.current = next.photos;
    try {
      localStorage.setItem(savedOrderKey, next.id);
    } catch {
      /* Navigation URL remains available. */
    }
    const url = new URL(window.location.href);
    url.searchParams.set("order", next.id);
    window.history.replaceState(null, "", url);
  }, []);
  useEffect(() => {
    let cancelled = false;
    const query = new URLSearchParams(window.location.search);
    const requestedPlan = query.get("plan");
    if (plans.some((plan) => plan.id === requestedPlan))
      queueMicrotask(() => setSelected(requestedPlan!));
    let id = query.get("order");
    try {
      id ||= localStorage.getItem(savedOrderKey);
    } catch {
      /* Optional recovery. */
    }
    if (!id) {
      queueMicrotask(() => setRestoring(false));
      return;
    }
    api(id, "", undefined, "GET")
      .then((next) => {
        if (!cancelled) {
          remember(next);
          if (next.payment && !next.review && next.status === "paid")
            setModal("payment");
        }
      })
      .catch((e) => {
        if (!cancelled) setError(e.message);
      })
      .finally(() => {
        if (!cancelled) setRestoring(false);
      });
    return () => {
      cancelled = true;
    };
  }, [remember]);
  useEffect(() => {
    if (
      !order ||
      demo ||
      editing ||
      !["checkout", "generating"].includes(order.status)
    )
      return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    const poll = async () => {
      try {
        const next = await api(order.id, "", undefined, "GET");
        if (!cancelled) {
          setOrder(next);
          if (next.payment && !order.payment) {
            setWaitingPayment(false);
            setModal("payment");
          }
        }
      } catch {
        /* Retry transient network failures without hiding checkout. */
      }
      if (!cancelled)
        timer = setTimeout(
          poll,
          order.status === "generating" ? 15_000 : 3_000,
        );
    };
    timer = setTimeout(poll, 3_000);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [order?.id, order?.status, order?.payment, demo, editing]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(false), 5000);
    return () => clearTimeout(timer);
  }, [toast]);

  const checkout = () =>
    run("Saving your photos…", async () => {
      let next = order;
      if (!next) {
        pendingId.current ||= crypto.randomUUID();
        next = await api(pendingId.current, "", {
          planId: selected,
          preferences: details,
        });
        remember(next);
      }
      trackFunnel("add_to_cart", { plan_id: next.planId, value: next.price, currency: next.currency }, `order:${next.id}:cart`);
      if (!next.photos.length) {
        next = await api(
          next.id,
          "photos",
          { photos: await encodePhotos(sourcePhotos.current) },
          "PUT",
        );
        remember(next);
      }
      trackFunnel("photos_saved", { photo_count: next.photos.length }, `order:${next.id}:photos`);
      next = await api(next.id, "checkout", {});
      remember(next);
    });
  const verify = () => {
    setModal(null);
    return run("Checking your photos…", async () => {
      if (!order) return;
      const next = demo
        ? {
            ...order,
            review: {
              photos: order.photos.map((p, index) => ({
                id: p.id,
                index,
                accepted: true,
                reason: "",
                framing: "close_up",
              })),
              summary: "Your photos are clear and well lit.",
              needsMidRange: true,
            },
          }
        : await api(order.id, "verify", {});
      setOrder(next);
      setToast(true);
      if (
        next.review?.needsMidRange &&
        next.review.photos.filter((p) => p.accepted).length >= 6
      )
        setModal("framing");
    });
  };
  const changeUploads = () => {
    if (!order) return;
    // Saved order references are independent of the previous phone session.
    // A fresh QR prevents importing those same phone photos a second time.
    try {
      sessionStorage.removeItem("perfilisto-upload-session");
    } catch {
      /* Optional browser storage. */
    }
    setModal(null);
    setEditPhotos(order.photos);
    setEditing(true);
    setFinishing("photos");
    setOwnPhotos(false);
    setAcceptedFraming(false);
  };
  const saveUploads = () =>
    run("Saving your new photos…", async () => {
      if (!order) return;
      const next = demo
        ? { ...order, photos: editPhotos, review: undefined }
        : await api(
            order.id,
            "photos",
            { photos: await encodePhotos(editPhotos) },
            "PUT",
          );
      setOrder(next);
      setEditing(false);
    });
  const generate = () =>
    run("Starting your headshots…", async () => {
      if (!order) return;
      if (demo) {
        setOrder({
          ...order,
          preferences: details,
          status: "generating",
          batchStatus: "validating",
        });
        setSubmitted(true);
        setModal(null);
        return;
      }
      const next = await api(order.id, "generate", {
        confirmOwnPhotos: ownPhotos,
        acceptFraming: acceptedFraming,
        preferences: details,
      });
      setOrder(next);
      setSubmitted(true);
      setModal(null);
    });
  const startDemo = async () => {
    setDemo(true);
    setOrder({
      ...plan,
      planId: plan.id,
      id: "preview-only",
      status: "paid",
      photos: photos.map((p) => ({ id: p.id, name: p.name, url: p.url })),
      payment: { amount: plan.price, currency: "eur" },
      preferences: details,
      results: [],
      expiresAt: Date.now() + 86_400_000,
    });
    setModal("payment");
  };
  const accepted = order?.review?.photos.filter((p) => p.accepted).length || 0;
  const inGeneration =
    order &&
    ["generating", "complete", "partial", "failed"].includes(order.status);
  const reviewStage = !!order?.payment && !inGeneration;
  const checkoutStage = !!order?.checkoutId && !order.payment;
  const leavePricing = () => {
    if (order?.payment) return;
    setOrder(null);
    pendingId.current = null;
    try {
      localStorage.removeItem(savedOrderKey);
    } catch {}
    window.history.replaceState(null, "", "/onboarding");
    onBack();
  };
  const openAlbum = useCallback(() => {
    if (!order) return;
    if (demo) setSubmitted(false);
    else router.replace(`/album?order=${encodeURIComponent(order.id)}`);
  }, [order?.id, demo, router]); // eslint-disable-line react-hooks/exhaustive-deps
  const finishValid =
    !!details.poses?.length &&
    !!details.glasses &&
    !!details.attire.length &&
    !!details.backgrounds.length;
  const advance = () => {
    if (finishing === "poses") {
      setFinishing("glasses");
    } else if (finishing === "glasses") {
      if (demo) setFinishing("details");
      else
        void run("Saving your preferences…", async () => {
          if (!order) return;
          setOrder(
            await api(order.id, "preferences", { preferences: details }, "PUT"),
          );
          setFinishing("details");
        });
    } else if (finishing === "details") setModal("submit");
    else
      setModal(
        order?.review?.needsMidRange && !acceptedFraming
          ? "framing"
          : "confirm",
      );
  };
  if (inGeneration)
    return submitted ? (
      <GenerationSubmitted onContinue={openAlbum} />
    ) : (
      <AlbumPage initialOrder={order} preview={demo} />
    );
  return (
    <>
      <OnboardingStepShell
        stepKey={
          finishing !== "photos" && !editing
            ? finishing
            : editing
              ? "edit-photos"
              : inGeneration
                ? "generation"
                : reviewStage
                  ? "verification"
                  : checkoutStage
                    ? "checkout"
                    : "pricing"
        }
        progress={
          finishing === "details"
            ? 1
            : finishing === "glasses"
              ? 0.95
              : finishing === "poses"
                ? 0.9
                : reviewStage
                  ? 0.84
                  : 0.78
        }
        onBack={
          editing
            ? () => setEditing(false)
            : finishing !== "photos"
              ? () =>
                  setFinishing(
                    finishing === "details"
                      ? "glasses"
                      : finishing === "glasses"
                        ? "poses"
                        : "photos",
                  )
              : leavePricing
        }
        hideBack={!!order?.payment && finishing === "photos"}
        hideContinue={checkoutStage || !!inGeneration || restoring}
        continueDisabled={
          !!busy ||
          (editing
            ? editPhotos.length < 6 || editPhotos.some((p) => p.preparing)
            : reviewStage
              ? !order.review ||
                accepted < 6 ||
                (finishing !== "photos" && !finishValid) ||
                (finishing === "details" && !detailsConsent)
              : false)
        }
        continueLoading={!!busy}
        continueLabel={
          busy ||
          (editing
            ? "Save photos"
            : reviewStage
              ? finishing === "details"
                ? "Submit"
                : "Continue"
              : `Continue with ${order?.name || plan.name}`)
        }
        onContinue={editing ? saveUploads : reviewStage ? advance : checkout}
        onClose={onClose}
        footerContent={
          finishing === "details" && !editing ? (
            <ConsentCheckbox
              id="confirm-headshot-details"
              checked={detailsConsent}
              onChange={setDetailsConsent}
            >
              I confirm these details are accurate, these are my own recent
              photos, I am 18 or older, and I have permission to use them. I
              agree to the{" "}
              <a
                href="/terms"
                target="_blank"
                rel="noreferrer"
                className="underline"
              >
                terms
              </a>
              .
            </ConsentCheckbox>
          ) : undefined
        }
      >
        {demo && (
          <div className="mb-5 rounded-xl bg-amber-100 px-4 py-3 text-sm font-semibold">
            DEBUG PREVIEW — no payment or AI request is made.
          </div>
        )}
        {error && (
          <div
            role="alert"
            className="mx-auto mb-5 max-w-6xl rounded-2xl bg-red-50 px-5 py-4 text-red-800"
          >
            {error}
          </div>
        )}
        {restoring ? (
          <div className="grid min-h-[50vh] place-content-center justify-items-center gap-4">
            <Spinner className="size-8 text-primary" />
            Restoring your order…
          </div>
        ) : editing ? (
          <UploadStep
            photos={editPhotos}
            onChange={setEditPhotos}
            onBack={() => setEditing(false)}
          />
        ) : reviewStage && finishing !== "photos" ? (
          <FinishingSteps
            step={finishing}
            value={details}
            onChange={(next) => {
              setDetails(next);
              setDetailsConsent(false);
            }}
          />
        ) : reviewStage ? (
          <div className="mx-auto grid w-full max-w-6xl gap-10 py-5 lg:grid-cols-[230px_1fr]">
            <aside>
              <h1 className="text-3xl font-semibold tracking-tight">
                Verify photos
              </h1>
              <p className="mt-4 leading-relaxed text-neutral-500">
                Let’s double-check your photos for the best results. You’ll need
                at least 6 accepted photos to continue.
              </p>
              <button
                className={`${secondary} mt-6 w-full`}
                onClick={changeUploads}
                disabled={!!busy}
              >
                Change uploads
              </button>
              <p className="mt-4 text-sm text-neutral-500">
                Your payment is saved. Replacing photos won’t charge you again.
              </p>
            </aside>
            <div>
              <div className="mb-7">
                <div className="mb-3 flex justify-between text-sm font-semibold">
                  <span>
                    {order.review
                      ? `Accepted ${accepted} of ${order.photos.length}`
                      : `Uploaded ${order.photos.length} of 10`}
                  </span>
                  <span className="text-green-700">
                    {accepted >= 6
                      ? "✓ Minimum met"
                      : "6 accepted photos required"}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-black/10">
                  <div
                    className="h-2 rounded-full bg-green-600 transition-[width]"
                    style={{
                      width: `${(order.review ? accepted : order.photos.length) * 10}%`,
                    }}
                  />
                </div>
              </div>
              <section
                className={cn(
                  "rounded-3xl border p-5 sm:p-6",
                  order.review
                    ? "border-green-700/10 bg-[#f3faf5]"
                    : "border-black/5 bg-[#f7f7f7]",
                )}
              >
                <h2 className="flex items-center gap-2 text-xl font-semibold">
                  {busy && <Spinner className="size-5 text-primary" aria-hidden="true" />}
                  {busy
                    ? "Hang tight — we’re checking your photos"
                    : order.review
                      ? "Your photo review"
                      : "Ready to check your photos"}
                </h2>
                <p className="mt-2 text-sm text-neutral-500">
                  {order.review?.summary ||
                    "We check clarity, lighting, framing, and whether your face is visible."}
                </p>
                <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
                  {order.photos.map((p) => {
                    const assessment = order.review?.photos.find(
                      (v) => v.id === p.id,
                    );
                    return (
                      <div key={p.id}>
                        <div className="relative overflow-hidden rounded-xl">
                          <Image
                            src={p.url}
                            alt={p.name}
                            width={200}
                            height={250}
                            unoptimized
                            className={cn(
                              "aspect-[4/5] w-full object-cover",
                              busy && "blur-sm",
                            )}
                          />
                          {busy ? (
                            <div className="absolute inset-0 grid place-items-center bg-white/30">
                              <Spinner className="size-7 text-primary" />
                            </div>
                          ) : (
                            assessment && (
                              <span
                                className={cn(
                                  "absolute right-2 bottom-2 grid size-7 place-items-center rounded-full text-white",
                                  assessment.accepted
                                    ? "bg-green-600"
                                    : "bg-red-500",
                                )}
                              >
                                {assessment.accepted ? (
                                  <IconCheck className="size-4" />
                                ) : (
                                  <IconX className="size-4" />
                                )}
                              </span>
                            )
                          )}
                        </div>
                        {assessment && (
                          <p
                            className={cn(
                              "mt-2 text-xs",
                              assessment.accepted
                                ? "text-green-800"
                                : "text-red-700",
                            )}
                          >
                            {assessment.accepted
                              ? "Accepted"
                              : assessment.reason}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
                {!order.review && !busy && (
                  <button className={`${primary} mt-5`} onClick={verify}>
                    Check my photos
                  </button>
                )}
                {order.review && accepted < 6 && (
                  <p className="mt-5 text-sm font-medium text-red-700">
                    Please replace the rejected photos. You need {6 - accepted}{" "}
                    more accepted photos.
                  </p>
                )}
              </section>
              <div className="mt-6">
                <Requirements />
              </div>
            </div>
          </div>
        ) : checkoutStage ? (
          <CheckoutPage
            key={order.checkoutId}
            order={order}
            waitingPayment={waitingPayment}
            onComplete={(receipt) => {
              setWaitingPayment(true);
              if (receipt)
                void run("Confirming your payment…", async () => {
                  const next = await api(order.id, "confirm", { paymentId: receipt });
                  setOrder(next);
                  if (next.payment) {
                    setWaitingPayment(false);
                    setModal("payment");
                  }
                });
            }}
          />
        ) : (
          <div className="mx-auto grid w-full max-w-7xl gap-12 py-4 lg:grid-cols-[1fr_220px]">
            <div>
              <h1 className="max-w-3xl text-4xl leading-tight font-semibold tracking-[-.045em] sm:text-5xl">
                Great headshots.
                <br />A lasting first impression.
              </h1>
              <p className="mt-4 text-lg text-neutral-500">
                Choose your package. Pay once, with no subscription.
              </p>
              <TrustRating messages={getMessages()} className="mt-6" />
              <div
                className="mt-9 grid items-stretch gap-4 md:grid-cols-3"
                role="radiogroup"
                aria-label="Headshot package"
              >
                {plans.map((p) => (
                  <button
                    key={p.id}
                    role="radio"
                    aria-checked={(order?.planId || selected) === p.id}
                    onClick={() => {
                      if (!order) {
                        setSelected(p.id);
                        trackFunnel("package_selected", { plan_id: p.id });
                      }
                    }}
                    disabled={!!order || !!busy}
                    className={cn(
                      "relative flex flex-col rounded-[28px] border-2 p-6 text-left transition-colors disabled:cursor-default",
                      (order?.planId || selected) === p.id
                        ? "border-primary bg-[#fffaf5] shadow-[0_8px_30px_#ff741612]"
                        : "border-black/10 bg-white hover:border-primary/40",
                    )}
                  >
                    <span className="flex min-h-14 flex-wrap items-start justify-between gap-2">
                      <span className="text-lg font-semibold">{p.name}</span>
                      {p.featured && (
                        <span className="rounded-full bg-primary/10 px-2 py-1 text-[10px] font-bold text-primary">
                          Most popular
                        </span>
                      )}
                    </span>
                    <span className="mt-5 text-5xl font-semibold tracking-tighter">
                      €{p.price}
                    </span>
                    <span className="mt-2 text-xs text-neutral-500">
                      one-time payment
                    </span>
                    <span className="mt-8 space-y-4 text-sm">
                      <span className="flex gap-2">
                        <IconPhoto className="size-5 text-primary" />
                        <strong>{p.photoCount} headshots</strong>
                      </span>
                      <span className="flex gap-2">
                        <IconClock className="size-5 text-primary" />
                        Within {p.deliveryTime}
                      </span>
                      <span className="flex gap-2">
                        <IconCheck className="size-5 text-primary" />
                        Unique outfits
                      </span>
                      <span className="flex gap-2">
                        <IconCheck className="size-5 text-primary" />
                        Multiple backgrounds
                      </span>
                    </span>
                    <span
                      className={cn(
                        "mt-8 grid size-6 place-items-center self-end rounded-full border",
                        (order?.planId || selected) === p.id
                          ? "border-primary bg-primary text-white"
                          : "border-black/20",
                      )}
                    >
                      {(order?.planId || selected) === p.id && (
                        <IconCheck className="size-4" />
                      )}
                    </span>
                  </button>
                ))}
              </div>
              <div className="mt-7 flex items-center gap-3 rounded-2xl bg-[#fff4ea] p-4 text-sm">
                <IconLock className="size-5 shrink-0 text-primary" />
                Your photos stay private. We use them to create your headshots.
              </div>
              {process.env.NODE_ENV === "development" && photos.length >= 6 && (
                <button
                  onClick={startDemo}
                  className="mt-5 rounded-full border border-dashed border-primary/40 px-5 py-2 text-xs font-semibold text-primary"
                >
                  DEBUG · Preview payment & verification
                </button>
              )}
              {order && !order.payment && (
                <button
                  className="mt-5 block text-sm text-neutral-500 underline"
                  onClick={() => {
                    setOrder(null);
                    pendingId.current = null;
                    try {
                      localStorage.removeItem(savedOrderKey);
                    } catch {}
                    window.history.replaceState(null, "", "/onboarding");
                  }}
                >
                  Choose another package
                </button>
              )}
            </div>
            <ResultImageScroll />
          </div>
        )}
      </OnboardingStepShell>
      {modal === "payment" && order && (
        <Modal title="Payment received" onClose={() => setModal(null)}>
          <div className="py-5 text-center">
            <LogoMark className="mx-auto mb-6 size-14" />
            <h2 className="text-3xl font-semibold tracking-tight">
              We’ve received your payment!
            </h2>
            <p className="mx-auto mt-6 w-fit rounded-2xl border border-black/10 px-6 py-4 text-4xl font-semibold">
              {money(order.payment!.amount, order.payment!.currency)}
            </p>
            <p className="mt-6 text-xl font-medium">You’re almost there.</p>
            <p className="mt-3 text-neutral-500">
              Let’s check your photos and confirm the details before creating
              your headshots.
            </p>
            <button className={`${primary} mt-8`} onClick={verify}>
              Verify my photos
              <IconArrowRight className="size-4" />
            </button>
          </div>
        </Modal>
      )}
      {modal === "framing" && (
        <Modal title="Add more mid-range photos" onClose={() => setModal(null)}>
          <IconInfoCircle className="mb-4 size-10 text-amber-500" />
          <h2 className="pr-7 text-3xl font-semibold tracking-tight">
            A few mid-range shots would help
          </h2>
          <p className="mt-4 leading-relaxed text-neutral-500">
            Your photos are mostly close-ups. Add photos showing your shoulders
            and upper body to give us a better reference for natural-looking
            portraits.
          </p>
          <div className="mt-6 grid grid-cols-3 gap-3">
            {[
              "/onboarding/attire/woman-business-casual.jpg",
              "/onboarding/attire/man-professional.jpg",
              "/onboarding/attire/woman-smart-casual.jpg",
            ].map((src, i) => (
              <div key={src}>
                <Image
                  src={src}
                  width={200}
                  height={260}
                  unoptimized
                  alt={
                    [
                      "Half-body example",
                      "Waist-up example",
                      "Chest-up example",
                    ][i]
                  }
                  className="aspect-[3/4] rounded-xl object-cover"
                />
                <p className="mt-2 text-xs font-semibold">
                  ✓ {["Half body", "Waist up", "Chest up"][i]}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-7 flex flex-wrap justify-end gap-3">
            <button
              className={secondary}
              onClick={() => {
                setAcceptedFraming(true);
                setModal("confirm");
              }}
            >
              Continue anyway
            </button>
            <button className={primary} onClick={changeUploads}>
              Upload more photos
            </button>
          </div>
        </Modal>
      )}
      {modal === "submit" && (
        <Modal
          title="Confirm your details"
          onClose={() => {
            if (!busy) setModal(null);
          }}
        >
          <h2 className="pr-8 text-2xl font-semibold">
            Are all your details correct?
          </h2>
          <p className="mt-4 text-neutral-500">
            We’ll use your selected poses, glasses, outfits and backgrounds to
            create your professional headshots. Once generation starts, these
            choices are final.
          </p>
          <div className="mt-6 grid grid-cols-3 gap-3">
            {[
              ...examples,
              "/onboarding/attire/man-professional.jpg",
              "/onboarding/backgrounds/woman-nature.jpg",
            ].map((src) => (
              <Image
                key={src}
                src={src}
                alt="Example professional headshot"
                width={180}
                height={200}
                unoptimized
                className="aspect-square w-full rounded-xl object-cover"
              />
            ))}
          </div>
          {error && (
            <p role="alert" className="mt-4 text-red-700">
              {error}
            </p>
          )}
          <div className="mt-7 flex flex-wrap justify-between gap-3">
            <button
              className={secondary}
              disabled={!!busy}
              onClick={() => setModal(null)}
            >
              Update details
            </button>
            <button
              className={primary}
              disabled={!!busy || !detailsConsent || !ownPhotos || !finishValid}
              onClick={generate}
            >
              {busy && <Spinner className="size-5" aria-hidden="true" />}
              {busy || "Confirm and submit"}
            </button>
          </div>
        </Modal>
      )}
      {modal === "confirm" && (
        <Modal
          title="Confirm your reference photos"
          onClose={() => setModal(null)}
          wide
        >
          <h2 className="pr-8 text-3xl font-semibold tracking-tight">
            Happy with your uploads?
          </h2>
          <p className="mt-3 mb-6 text-neutral-500">
            A mix of clear close-ups and mid-range shots gives the best results.
          </p>
          <Requirements />
          <label className="mt-6 flex items-start gap-3 text-sm">
            <input
              type="checkbox"
              checked={ownPhotos}
              onChange={(e) => setOwnPhotos(e.target.checked)}
              className="mt-1 size-5 accent-orange-500"
            />
            These are recent photos of me, I am 18 or older, and I have
            permission to use them to generate my headshots.
          </label>
          {error && (
            <p role="alert" className="mt-3 text-red-700">
              {error}
            </p>
          )}
          <div className="mt-7 flex flex-wrap justify-end gap-3">
            <button
              className={secondary}
              onClick={changeUploads}
              disabled={!!busy}
            >
              Change uploads
            </button>
            <button
              className={primary}
              onClick={() => {
                setModal(null);
                setFinishing("poses");
              }}
              disabled={!ownPhotos || !!busy}
            >
              {busy && <Spinner className="size-5" aria-hidden="true" />}
              {busy || "Continue to poses"}
            </button>
          </div>
        </Modal>
      )}
      {toast && finishing === "photos" && (
        <div
          role="status"
          className="fixed right-5 bottom-24 z-40 flex max-w-sm items-center gap-3 rounded-2xl border border-black/10 bg-white p-5 text-sm font-semibold text-black shadow-xl"
        >
          <IconCheck className="size-6 shrink-0 text-green-600" />
          {accepted >= 6
            ? "Your photo check is complete!"
            : "Photo check complete. Some photos need replacing."}
          <button
            aria-label="Dismiss notification"
            onClick={() => setToast(false)}
          >
            <IconX className="size-4" />
          </button>
        </div>
      )}
    </>
  );
}
