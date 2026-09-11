"use client";

import { useEffect, useState, type CSSProperties } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  IconCheck,
  IconLoader2,
  IconPhoto,
  IconHome,
  IconDownload,
  IconArrowRight,
  IconClock,
} from "@tabler/icons-react";
import celebration from "./generation-celebration.module.css";
import type { Order } from "@/lib/orders/types";
import { BrandWord } from "../landing/brand-name";
import { LogoMark } from "../landing/logo-mark";
import { PRIMARY_TINT_BUTTON_CLASS } from "../landing/button-styles";

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
          Redirecting in {seconds}s…
        </p>
      </div>
    </main>
  );
}

export function AlbumPage({
  initialOrder,
  preview = false,
}: {
  initialOrder?: Order;
  preview?: boolean;
}) {
  const [order, setOrder] = useState<Order | null>(initialOrder || null);
  const [error, setError] = useState("");
  useEffect(() => {
    if (preview) return;
    const id = new URLSearchParams(window.location.search).get("order");
    if (!id) {
      queueMicrotask(() =>
        setError("Open the album link from your order to view your headshots."),
      );
      return;
    }
    let stopped = false;
    let timer: ReturnType<typeof setTimeout>;
    const poll = async () => {
      try {
        const res = await fetch(`/api/orders/${encodeURIComponent(id)}`, {
          cache: "no-store",
          signal: AbortSignal.timeout(30000),
        });
        const next = await res.json();
        if (!res.ok)
          throw new Error(next.error || "Could not load your album.");
        if (!stopped) {
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
  }, [preview]);
  const complete = order?.status === "complete";
  const ended =
    order && ["complete", "partial", "failed"].includes(order.status);
  const done = complete
    ? order.photoCount
    : order?.batchProgress?.completed || order?.results.length || 0;
  const percent = order
    ? Math.min(complete ? 100 : 99, Math.floor((done / order.photoCount) * 100))
    : 0;
  const stage = complete
    ? 3
    : order?.status === "partial" || order?.batchStatus === "finalizing"
      ? 2
      : order?.batchStatus === "in_progress"
        ? 1
        : 0;
  return (
    <div className="theme-light min-h-dvh bg-white text-[#171717] md:pl-60">
      <aside className="border-b border-black/10 bg-white p-5 md:fixed md:inset-y-0 md:left-0 md:w-60 md:border-r md:border-b-0">
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
      </aside>
      <main id="album" className="mx-auto max-w-6xl px-5 py-10 sm:px-10">
        {preview && (
          <p className="mb-5 rounded-xl bg-amber-100 p-3 text-sm">
            DEBUG PREVIEW — no AI request has been made.
          </p>
        )}
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
              <IconLoader2
                aria-label="Loading album"
                className="size-9 animate-spin text-primary"
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
            <section className="flex min-h-[65vh] flex-col items-center justify-center text-center">
              <div className="mb-8 flex items-center justify-center -space-x-3">
                {order.photos.slice(0, 2).map((p, i) => (
                  <Image
                    key={p.id}
                    src={p.url}
                    alt="Your reference photo"
                    width={80}
                    height={90}
                    unoptimized
                    className={`size-16 rounded-2xl border-4 border-white object-cover sm:size-20 ${i ? "rotate-6" : "-rotate-6"}`}
                  />
                ))}
                <div
                  className="relative z-10 size-32 shrink-0 rounded-full bg-white sm:size-36"
                  role="progressbar"
                  aria-label="Headshot generation"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={percent}
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
                  <span className="absolute inset-0 grid place-items-center text-2xl font-semibold">
                    {percent}%
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
                    className={`size-16 rounded-full border-4 border-white object-cover sm:size-20 ${i ? "rotate-6" : "-rotate-6"}`}
                  />
                ))}
              </div>
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
              <ol className="mt-7 flex flex-wrap justify-center gap-x-6 gap-y-4 text-sm">
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
                      <IconLoader2 className="size-5 animate-spin text-primary motion-reduce:animate-none" />
                    ) : (
                      <span className="grid size-5 place-items-center rounded-full border text-xs">
                        {i + 1}
                      </span>
                    )}
                    {name}
                  </li>
                ))}
              </ol>
              {!ended && (
                <p className="mt-7 flex items-center gap-2 rounded-2xl bg-[#fff4ea] px-5 py-3 text-sm text-neutral-600">
                  <IconClock className="size-4 shrink-0 text-primary" />
                  {order.emailNotificationsEnabled
                    ? "We’ll email you when this album is ready."
                    : "You can close this page and return using this album link."}
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
            </section>
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {order.results.map((p) => (
                <div key={p.id}>
                  <Image
                    src={p.url}
                    alt="Your generated headshot"
                    width={400}
                    height={600}
                    unoptimized
                    className="aspect-[2/3] w-full rounded-2xl object-cover"
                  />
                  <a
                    href={`${p.url}?download=1`}
                    className="mt-3 flex items-center justify-center gap-2 rounded-full border border-black/10 px-4 py-3 text-sm font-semibold"
                  >
                    <IconDownload className="size-4" />
                    Download
                  </a>
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
