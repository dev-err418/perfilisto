"use client";

import { useRouter } from "next/navigation";
import { loadCurrentOrder } from "@/lib/orders/current-order";
import { Spinner } from "@/components/ui/spinner";

import { useEffect, useState, type CSSProperties } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  IconCheck,
  IconPhoto,
  IconHome,
  IconArrowRight,
  IconClock,
} from "@tabler/icons-react";
import celebration from "./generation-celebration.module.css";
import type { Order } from "@/lib/orders/types";
import { BrandWord } from "../landing/brand-name";
import { LogoMark } from "../landing/logo-mark";
import { PRIMARY_TINT_BUTTON_CLASS } from "../landing/button-styles";
import { ResultsDashboard } from "./results-dashboard";

export function GenerationSubmitted({
  onContinue,
}: {
  onContinue: () => void;
}) {
  const [seconds, setSeconds] = useState(5);
  useEffect(() => {
    const started = Date.now();
    const timer = setInterval(
      () =>
        setSeconds(Math.max(0, 5 - Math.floor((Date.now() - started) / 1000))),
      200,
    );
    const redirect = setTimeout(onContinue, 5000);
    return () => {
      clearInterval(timer);
      clearTimeout(redirect);
    };
  }, [onContinue]);
  return (
    <main className="theme-light relative grid min-h-dvh place-items-center overflow-hidden bg-white px-6 text-center text-black">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        {Array.from({ length: 32 }, (_, i) => (
          <span
            key={i}
            className={celebration.particle}
            style={
              {
                "--left": `${(i * 37) % 100}%`,
                "--color": ["#ff7416", "#ff9d50", "#c65e24"][i % 3],
                "--delay": `${(i % 8) * 0.12}s`,
                "--round": i % 3 ? "1px" : "50%",
                "--drift": `${i % 2 ? 65 : -65}px`,
              } as CSSProperties
            }
          />
        ))}
      </div>
      <div className="relative max-w-2xl">
        <div className="mx-auto mb-7 grid size-24 place-items-center rounded-full bg-[#fff4ea]">
          <LogoMark className="size-14" />
        </div>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          <BrandWord /> is working on your photos!
        </h1>
        <p className="mt-5 text-lg text-neutral-500">
          Your headshots are queued. You can
          follow their progress in your album.
        </p>
        <button
          onClick={onContinue}
          className={`${PRIMARY_TINT_BUTTON_CLASS} mx-auto mt-7 flex items-center gap-3 rounded-full px-8 py-3 font-semibold`}
        >
          Continue <IconArrowRight className="size-5" />
        </button>
        <p className="mt-4 text-sm text-neutral-500" role="status">
          <Spinner className="mr-2 inline-block align-middle" aria-hidden="true" />Redirecting in {seconds}s…
        </p>
      </div>
    </main>
  );
}

function useEstimatedProgress(order: Order | null) {
  const [estimate, setEstimate] = useState(1);
  useEffect(() => {
    if (!order || order.status !== "generating") return;
    const key = `perfilisto-progress-start:${order.id}`;
    let started = Date.now();
    try {
      const saved = Number(sessionStorage.getItem(key));
      if (saved > 0 && saved <= started) started = saved;
      else sessionStorage.setItem(key, String(started));
    } catch { /* Animation also works without storage. */ }
    const tick = () => {
      const seconds = Math.max(0, (Date.now() - started) / 1000);
      // Reach 2% in two seconds, then wait 30 seconds for 3%.
      // Each subsequent percentage takes 15% longer than the previous one.
      setEstimate(seconds <= 2
        ? 1 + seconds / 2
        : Math.min(95, 2 + Math.log1p((seconds - 2) * 0.15 / 30) / Math.log1p(0.15)));
    };
    const timer = setInterval(tick, 250);
    return () => clearInterval(timer);
  }, [order?.id, order?.status]); // eslint-disable-line react-hooks/exhaustive-deps
  return estimate;
}

export function AlbumPage({
  initialOrder,
  preview = false,
}: {
  initialOrder?: Order;
  preview?: boolean;
}) {
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(initialOrder || null);
  const [error, setError] = useState("");
  const [viewedAlbum, setViewedAlbum] = useState<string | null>(null);
  useEffect(() => {
    if (preview) return;
    if (process.env.NODE_ENV === "development" && new URLSearchParams(window.location.search).get("preview") === "1") {
      try {
        const saved = sessionStorage.getItem("perfilisto-dashboard-preview");
        if (saved) { queueMicrotask(() => setOrder(JSON.parse(saved))); return; }
      } catch { /* Fall back to the authenticated dashboard. */ }
    }
    let id = new URLSearchParams(window.location.search).get("order") || initialOrder?.id;
    let stopped = false;
    let timer: ReturnType<typeof setTimeout>;
    const poll = async () => {
      try {
        if (!id) {
          const current = await loadCurrentOrder();
          if (stopped) return;
          if (!current) { router.replace("/onboarding"); return; }
          id = current.id;
        }
        const res = await fetch(`/api/orders/${encodeURIComponent(id)}`, {
          cache: "no-store",
          signal: AbortSignal.timeout(30000),
        });
        const next = await res.json();
        if (!res.ok)
          throw new Error(next.error || "Could not load your album.");
        if (!stopped) {
          if (["generating", "complete", "partial", "failed"].includes(next.status)) {
            if (window.location.pathname !== "/dashboard" || !new URLSearchParams(window.location.search).get("order")) router.replace(`/dashboard?order=${encodeURIComponent(next.id)}`);
            try { localStorage.setItem("perfilisto-active-order", next.id); } catch { /* Optional storage. */ }
          } else { router.replace(`/onboarding?order=${encodeURIComponent(next.id)}`); return; }
          try {
            if (sessionStorage.getItem(`perfilisto-album-viewed:${next.id}`)) setViewedAlbum(next.id);
          } catch { /* The ready screen also works without storage. */ }
          setOrder(next);
          setError("");
        }
        if (["complete", "partial", "failed"].includes(next.status)) return;
      } catch (e) {
        if (!stopped)
          setError(
            e instanceof Error ? e.message : "Reconnecting to your album…",
          );
      }
      if (!stopped) timer = setTimeout(poll, 15000);
    };
    void poll();
    return () => {
      stopped = true;
      clearTimeout(timer);
    };
  }, [preview, initialOrder?.id, router]);
  const estimatedProgress = useEstimatedProgress(order);
  const complete = order?.status === "complete";
  const ended =
    order && ["complete", "partial", "failed"].includes(order.status);
  const done = complete
    ? order.photoCount
    : order?.batchProgress?.completed || order?.results.length || 0;
  const percent = order
    ? Math.min(complete ? 100 : 99, Math.floor(Math.max((done / order.photoCount) * 100, order.status === "generating" ? estimatedProgress : 0)))
    : 0;
  const stage = complete
    ? 3
    : order?.status === "partial" || order?.batchStatus === "finalizing"
      ? 2
      : order?.batchStatus === "in_progress"
        ? 1
        : 0;
  if (complete && order && viewedAlbum !== order.id) {
    return (
      <div className="theme-light flex min-h-dvh flex-col bg-white text-[#171717]">
        <header className="flex h-20 shrink-0 items-center justify-between px-5 sm:px-10">
          <Link href="/dashboard" className="flex items-center gap-2 font-semibold"><LogoMark className="size-8" /><BrandWord /></Link>
          <a href="mailto:hello@perfilisto.com" className="text-sm text-neutral-500">Need help?</a>
        </header>
        <main className="flex flex-1 flex-col items-center justify-center px-5 py-12 text-center">
          <div className="mb-8 flex items-center justify-center -space-x-3" aria-hidden="true">
            {order.results.slice(0, 4).map((photo, i) => (
              <Image key={photo.id} src={photo.url} alt="" width={120} height={144} unoptimized
                className={`size-20 border-4 border-white object-cover sm:size-28 ${i % 2 ? "rotate-6 rounded-2xl" : "-rotate-6 rounded-full"}`} />
            ))}
          </div>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Your headshots are ready.</h1>
          <p className="mt-5 max-w-lg text-lg leading-relaxed text-neutral-500">Your {order.results.length} headshots are ready to explore. Find your favorites and download them from your gallery.</p>
          <button type="button"
            className={`${PRIMARY_TINT_BUTTON_CLASS} mt-8 flex items-center gap-3 rounded-full px-8 py-4 font-semibold`}
            onClick={() => {
              try { sessionStorage.setItem(`perfilisto-album-viewed:${order.id}`, "1"); } catch { /* Optional storage. */ }
              setViewedAlbum(order.id);
              window.scrollTo(0, 0);
            }}>
            View my headshots <IconArrowRight className="size-5" aria-hidden="true" />
          </button>
        </main>
      </div>
    );
  }
  if (complete && order) return <ResultsDashboard order={order} />;
  return (
    <div className={`theme-light min-h-dvh bg-white text-[#171717] ${ended && !complete ? "md:pl-60" : ""}`}>
      {!complete && (ended ? <aside className="border-b border-black/10 bg-white p-5 md:fixed md:inset-y-0 md:left-0 md:w-60 md:border-r md:border-b-0">
        <Link
          href="/"
          className="flex items-center gap-2 text-xl font-semibold"
        >
          <LogoMark className="size-8 rounded-lg" />
          <BrandWord className="font-semibold tracking-tight" />
        </Link>
        <nav className="mt-5 flex gap-2 text-sm md:mt-10 md:flex-col">
          <Link
            href="/"
            className="flex items-center gap-3 rounded-full px-4 py-3 hover:bg-black/5"
          >
            <IconHome className="size-5" />
            Home
          </Link>
          <a
            href="#album"
            aria-current="page"
            className="flex items-center gap-3 rounded-full bg-[#fff4ea] px-4 py-3 font-medium text-primary"
          >
            <IconPhoto className="size-5" />
            My headshots
          </a>
        </nav>
        <a
          href="mailto:hello@perfilisto.com"
          className="hidden text-sm text-neutral-500 md:absolute md:bottom-7 md:block"
        >
          Need help? Contact us
        </a>
      </aside> : <header className="flex h-20 items-center justify-between px-5 sm:px-10">
        <Link href="/dashboard" className="flex items-center gap-2 font-semibold"><LogoMark className="size-8" /><BrandWord /></Link>
        <a href="mailto:hello@perfilisto.com" className="text-sm text-neutral-500">Need help?</a>
      </header>)}
      <main id="album" className="mx-auto max-w-6xl px-5 py-10 sm:px-10">
        {error && (
          <p
            role="alert"
            className="mb-5 rounded-xl bg-amber-50 p-4 text-amber-800"
          >
            {error}{" "}
            {!ended && order && "Your last saved progress is shown below."}
          </p>
        )}
        {!order ? (
          <div className="grid min-h-[60vh] place-content-center">
            {!error && (
              <Spinner
                aria-label="Loading album"
                className="size-9 text-primary"
              />
            )}
          </div>
        ) : !["generating", "complete", "partial", "failed"].includes(
            order.status,
          ) ? (
          <section className="grid min-h-[65vh] place-content-center gap-5 text-center">
            <h1 className="text-3xl font-semibold">
              Let’s finish setting up your headshots
            </h1>
            <p className="text-neutral-500">
              Confirm your photos and details before generation starts.
            </p>
            <Link
              href={`/onboarding?order=${encodeURIComponent(order.id)}`}
              className={`${PRIMARY_TINT_BUTTON_CLASS} mx-auto rounded-full px-7 py-3 font-semibold`}
            >
              Continue setup
            </Link>
          </section>
        ) : (
          <>
            {!complete && <section className="flex min-h-[65vh] flex-col items-center justify-center text-center">
              {!ended && <div className="mb-8 flex items-center justify-center -space-x-3">
                {order.photos.slice(0, 2).map((p, i) => (
                  <Image
                    key={p.id}
                    src={p.url}
                    alt="Your reference photo"
                    width={80}
                    height={90}
                    unoptimized
                    className={`size-16 border-4 border-white object-cover sm:size-20 ${i ? "rounded-2xl rotate-6" : "rounded-full -rotate-6"}`}
                  />
                ))}
                <div
                  className="relative z-10 size-32 shrink-0 rounded-full bg-white sm:size-36"
                  role="progressbar"
                  aria-label="Headshot generation"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={percent}
                  aria-valuetext={ended ? `${percent}%` : `${percent}% estimated progress`}
                >
                  <svg viewBox="0 0 120 120" className="size-full -rotate-90">
                    <circle
                      cx="60"
                      cy="60"
                      r="52"
                      fill="none"
                      stroke="#ececec"
                      strokeWidth="8"
                    />
                    <circle
                      cx="60"
                      cy="60"
                      r="52"
                      fill="none"
                      stroke="#ff7416"
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray="327"
                      strokeDashoffset={327 * (1 - percent / 100)}
                      className="transition-[stroke-dashoffset] duration-700 motion-reduce:transition-none"
                    />
                  </svg>
                  <span className="absolute inset-0 flex flex-col items-center justify-center gap-1">
                    <span className="text-2xl font-semibold">{percent}%</span>
                  </span>
                </div>
                {order.photos.slice(2, 4).map((p, i) => (
                  <Image
                    key={p.id}
                    src={p.url}
                    alt="Your reference photo"
                    width={80}
                    height={90}
                    unoptimized
                    className={`size-16 border-4 border-white object-cover sm:size-20 ${i ? "rounded-full rotate-6" : "rounded-2xl -rotate-6"}`}
                  />
                ))}
              </div>}
              <h1 className="max-w-3xl text-3xl font-semibold tracking-tight sm:text-4xl">
                {complete
                  ? "Your headshots are ready"
                  : ended
                    ? "Your album needs a little attention"
                    : "We’re creating your portrait photos"}
              </h1>
              <p className="mt-5 max-w-xl text-lg leading-relaxed text-neutral-500">
                {ended
                  ? `${order.results.length} of ${order.photoCount} photos are ready to download.`
                  : `Sit back while we create your ${order.photoCount} headshots. We’ll update this page as your photos are ready.`}
              </p>
              {!ended && <ol className="mt-7 flex flex-wrap justify-center gap-x-6 gap-y-4 text-sm">
                {[
                  "Queued",
                  "Creating photos",
                  "Saving your album",
                  "Ready",
                ].map((name, i) => (
                  <li
                    key={name}
                    className={`flex items-center gap-2 ${i <= stage ? "text-black" : "text-neutral-400"}`}
                  >
                    {i < stage || complete ? (
                      <IconCheck className="size-5 text-green-600" />
                    ) : i === stage && !ended ? (
                      <Spinner className="size-5 text-primary" />
                    ) : (
                      <span className="grid size-5 place-items-center rounded-full border text-xs">
                        {i + 1}
                      </span>
                    )}
                    {name}
                  </li>
                ))}
              </ol>}
              {!ended && (
                <p className="mt-7 flex items-center gap-2 rounded-2xl bg-[#fff4ea] px-5 py-3 text-sm text-neutral-600">
                  <IconClock className="size-4 shrink-0 text-primary" />
                  {order.emailNotificationsEnabled
                    ? "We’ll email you when this album is ready."
                    : "You can close this page and return using the link you’ll receive by email."}
                </p>
              )}
              {order.error && (
                <p role="alert" className="mt-5 max-w-xl text-amber-800">
                  {order.error}
                </p>
              )}
              <p className="mt-6 break-all text-xs text-neutral-400">
                Order {order.id} · Photos available for 30 days after payment
              </p>
              {process.env.NODE_ENV === "development" && order.id === "dashboard-preview" && (
                <button
                  type="button"
                  className="mt-6 rounded-full border border-orange-200 bg-orange-50 px-5 py-2 text-sm font-semibold text-orange-600 hover:bg-orange-100"
                  onClick={() => setOrder({
                    ...order,
                    status: complete ? "generating" : "complete",
                    batchStatus: complete ? "in_progress" : "completed",
                    results: complete ? [] : Array.from({ length: order.photoCount }, (_, i) => ({
                      id: `preview-result-${i}`,
                      url: `/headshots/${[
                        "man_01_professional_studio.webp",
                        "man_04_professional_nature.webp",
                        "man_05_professional_studio.webp",
                        "man_09_professional_city.webp",
                        "man_08_professional_nature.webp",
                      ][i % 5]}`,
                    })),
                  })}
                >
                  DEBUG · {complete ? "Show loading screen" : "Show completed album"} →
                </button>
              )}
            </section>}
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {order.results.map((p, i) => (
                <a
                  key={p.id}
                  href={`${p.url}?download=1`}
                  aria-label={`Download headshot ${i + 1}`}
                  className="block rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
                >
                  <Image
                    src={p.url}
                    alt="Your generated headshot"
                    width={400}
                    height={600}
                    unoptimized
                    className="aspect-[2/3] w-full rounded-2xl object-cover"
                  />
                </a>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
