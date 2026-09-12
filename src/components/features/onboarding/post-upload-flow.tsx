"use client";

import { trackFunnel } from "@/lib/analytics/client";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";
import { Fireworks } from "@/components/ui/fireworks";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { FinishingSteps, type FinishingStep } from "./finishing-steps";
import { ConsentCheckbox } from "./consent-checkbox";
import { AlbumPage } from "./album-page";
import { ResultImageScroll } from "./result-image-scroll";
import { CheckoutPage } from "./checkout-page";
import {
  IconCheck,
  IconLock,
  IconX,
  IconArrowRight,
} from "@tabler/icons-react";
import plans from "@/lib/orders/plans.json";
import type { Order, Preferences } from "@/lib/orders/types";
import { getMessages } from "@/i18n";
import { fileToJpegDataUrl } from "@/lib/upload-session-client";
import { cn } from "@/lib/utils";
import { TrustRating } from "../landing/trust-rating";
import { PlanFeatureList } from "../landing/plan-feature-list";
import { LogoMark } from "../landing/logo-mark";
import { PRIMARY_TINT_BUTTON_CLASS } from "../landing/button-styles";
import { OnboardingStepShell } from "./step-shell";
import { UploadStep, type UploadedPhoto } from "./upload-step";

const primary = `${PRIMARY_TINT_BUTTON_CLASS} inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-7 py-3 font-semibold disabled:opacity-40 disabled:pointer-events-none`;
const money = (value: number, currency = "eur") =>
  new Intl.NumberFormat("en-IE", { style: "currency", currency }).format(value);
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
  });
  const [detailsConsent, setDetailsConsent] = useState(false);
  const [selected, setSelected] = useState("professional");
  const [order, setOrder] = useState<Order | null>(null);
  const sourcePhotos = useRef(photos);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [restoring, setRestoring] = useState(true);
  const [modal, setModal] = useState<
    "payment" | null
  >(null);
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const [editing, setEditing] = useState(false);
  const [editPhotos, setEditPhotos] = useState<UploadedPhoto[]>([]);
  const [demo, setDemo] = useState(false);
  const [waitingPayment, setWaitingPayment] = useState(false);
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [order?.status, finishing]);
  const pendingId = useRef<string | null>(null);
  const plan = plans.find((p) => p.id === selected)!;
  const pricingPlans = getMessages().pricing.plans;
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
      if (query.get("new") !== "1") id ||= localStorage.getItem(savedOrderKey);
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
  const verify = (savedOrder?: Order) => {
    setModal(null);
    return run("Checking your photos…", async () => {
      const current = savedOrder || order;
      if (!current) return;
      const toastId = toast.loading("Checking your photos…");
      try {
        const next = demo
          ? {
              ...current,
              review: {
                photos: current.photos.map((p, index) => ({
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
          : await api(current.id, "verify", {});
        setOrder(next);
        const acceptedCount = next.review?.photos.filter((photo) => photo.accepted).length ?? 0;
        const ready = acceptedCount >= 6;
        const needsMidRange = next.review?.needsMidRange;
        (ready ? toast.success : toast.warning)(ready ? "Your photos look good!" : "Some photos need replacing", {
          id: toastId,
          description: !ready
            ? `${acceptedCount} photos accepted. Add ${6 - acceptedCount} more clear photos with your face visible to continue.`
            : needsMidRange
              ? "You have enough accepted photos. A mid-range shot showing your shoulders and upper body would help."
              : `${acceptedCount} photos accepted. You’re ready to continue.`,
          duration: 6000,
          closeButton: true,

        });
      } catch (error) {
        toast.error("We couldn’t check your photos", { id: toastId, description: "Please try again. Your photos and payment are saved.", duration: 6000, closeButton: true });
        throw error;
      }
    });
  };
  const saveUploads = async () => {
    let saved: Order | undefined;
    await run("Saving your photos…", async () => {
      if (!order) return;
      saved = demo
        ? { ...order, photos: editPhotos, review: undefined }
        : await api(order.id, "photos", { photos: await encodePhotos(editPhotos) }, "PUT");
      setOrder(saved);
      setEditing(false);
    });
    if (saved) await verify(saved);
  };
  const generate = () =>
    run("Starting your headshots…", async () => {
      if (!order || !detailsConsent || !finishValid || accepted < 6) return;
      if (demo) {
        const previewOrder: Order = { ...order, preferences: details, status: "generating", batchStatus: "validating" };
        try { sessionStorage.setItem("perfilisto-dashboard-preview", JSON.stringify(previewOrder)); }
        catch { sessionStorage.setItem("perfilisto-dashboard-preview", JSON.stringify({ ...previewOrder, photos: [] })); }
        setOrder(previewOrder);
        setModal(null);
        router.replace("/dashboard?preview=1");
        return;
      }
      const next = await api(order.id, "generate", {
        confirmOwnPhotos: detailsConsent,
        acceptFraming: true,
        preferences: details,
      });
      setOrder(next);
      router.replace(`/dashboard?order=${encodeURIComponent(next.id)}`);
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
  useEffect(() => {
    if (inGeneration && !demo) router.replace(`/dashboard?order=${encodeURIComponent(order.id)}`);
  }, [inGeneration, demo, order?.id, router]);
  const reviewStage = !!order?.payment && !inGeneration;
  const checkingPhotos = reviewStage && finishing === "photos" && !editing;
  const needsPhotoCheck = checkingPhotos && !order?.review;
  const needsReplacementPhotos = checkingPhotos && !!order?.review && accepted < 6;
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
  const finishValid =
    !!details.poses?.length &&
    !!details.glasses &&
    !!details.attire.length &&
    !!details.backgrounds.length;
  const advance = () => {
    if (finishing === "details") void generate();
    else if (accepted >= 6) setFinishing(finishing === "photos" ? "poses" : finishing === "poses" ? "glasses" : "details");
  };
  if (inGeneration) return <AlbumPage initialOrder={order} preview={demo} />;
  return (
    <>
      <OnboardingStepShell
        stepKey={
          finishing !== "photos" && !editing
            ? finishing
            : editing
              ? "verification"
              : inGeneration
                ? "generation"
                : reviewStage
                  ? "verification"
                  : checkoutStage
                    ? "checkout"
                    : "pricing"
        }
        progress={finishing === "details" ? 1 : finishing === "glasses" ? 0.95 : finishing === "poses" ? 0.9 : reviewStage ? 0.84 : 0.78}
        onBack={finishing !== "photos" ? () => setFinishing(finishing === "details" ? "glasses" : finishing === "glasses" ? "poses" : "photos") : leavePricing}
        hideBack={!!order?.payment && finishing === "photos"}
        hideContinue={checkoutStage || !!inGeneration || restoring}
        continueDisabled={
          !!busy ||
          (editing
            ? editPhotos.length < 6 || editPhotos.some((p) => p.preparing)
            : checkingPhotos
              ? needsPhotoCheck && order.photos.length < 6
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
            ? "Check my photos"
            : needsPhotoCheck
              ? "Check my photos"
            : needsReplacementPhotos
              ? "Upload a new photo to continue"
            : reviewStage
              ? finishing === "details"
                ? "Create my headshots"
                : "Continue"
              : `Continue with ${order?.name || plan.name}`)
        }
        onContinue={editing ? saveUploads : needsPhotoCheck ? () => verify() : needsReplacementPhotos ? () => uploadInputRef.current?.click() : reviewStage ? advance : checkout}
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
        ) : (editing || (reviewStage && finishing === "photos")) && order ? (
          <fieldset disabled={!!busy || !!modal} className="min-w-0 border-0 p-0" aria-busy={!!busy}>
            <UploadStep
              fileInputRef={uploadInputRef}
              photos={editing ? editPhotos : order.photos}
              disabled={!!busy || !!modal}
              review={order.review}
              reviewPending={editing}
              checking={busy === "Checking your photos…"}
              onChange={(next) => {
                setDetailsConsent(false);
                setEditPhotos(next);
                setEditing(true);
              }}
            />
          </fieldset>
        ) : reviewStage && finishing !== "photos" ? (
          <FinishingSteps
            step={finishing}
            value={details}
            planId={order?.planId}
            onChange={(next) => {
              setDetails(next);
              setDetailsConsent(false);
            }}
          />
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
                {plans.map((p) => {
                  const copy = pricingPlans.find((plan) => plan.name === p.name);

                  return (
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
                    {copy ? (
                      <PlanFeatureList
                        className="mt-8 text-sm"
                        features={copy.features}
                      />
                    ) : null}
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
                  );
                })}
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
        <Modal title="Payment received" onClose={() => { void verify(); }}>
          <Fireworks />
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
            <button className={`${primary} mt-8`} onClick={() => verify()}>
              Check my photos
              <IconArrowRight className="size-4" />
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
