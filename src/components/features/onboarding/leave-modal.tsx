"use client";

import { useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { IconX } from "@tabler/icons-react";

import { getMessages } from "@/i18n";

import { PRIMARY_TINT_BUTTON_CLASS } from "../landing/button-styles";

const messages = getMessages();

const collage = [
  {
    src: "/onboarding/attire/woman-professional.jpg",
    className: "row-span-2",
  },
  { src: "/onboarding/hair-type/man-straight.jpg", className: "" },
  { src: "/onboarding/backgrounds/man-office.jpg", className: "" },
  { src: "/onboarding/hair-length/woman-medium.jpg", className: "" },
  { src: "/onboarding/backgrounds/man-city.jpg", className: "" },
];

export const LeaveModal = ({ onStay }: { onStay: () => void }) => {
  const copy = messages.onboarding.leave;
  const router = useRouter();

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onStay();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onStay]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4"
      onClick={onStay}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="leave-modal-title"
        className="grid w-full max-w-3xl overflow-hidden rounded-[28px] bg-white shadow-[0_24px_80px_rgba(0,0,0,0.28)] md:grid-cols-2"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="bg-[#171717] p-6 text-white sm:p-7">
          <div className="flex flex-wrap items-center gap-3 text-primary" aria-label={messages.hero.ratingLabel}>
            <p className="text-4xl font-semibold tracking-tight sm:text-5xl">
              {copy.stat}
            </p>
            <span className="flex gap-0.5" aria-hidden="true">
              {Array.from({ length: 5 }, (_, index) => (
                <span key={index} className="text-lg leading-none">★</span>
              ))}
            </span>
          </div>
          <p className="mt-2 text-lg leading-7 font-medium text-white/90">
            {copy.statLabel}
          </p>
          <div className="mt-6 grid h-56 grid-cols-3 grid-rows-2 gap-2">
            {collage.map((photo) => (
              <div
                key={photo.src}
                className={`relative overflow-hidden rounded-xl ${photo.className}`}
              >
                <Image
                  src={photo.src}
                  alt=""
                  fill
                  unoptimized
                  className="object-cover object-top"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="relative p-6 sm:p-8">
          <button
            type="button"
            onClick={onStay}
            aria-label={messages.onboarding.shared.close}
            className="absolute top-4 right-4 grid size-9 place-items-center rounded-full text-[#141414] hover:bg-black/[0.04]"
          >
            <IconX className="size-5" stroke={1.8} />
          </button>
          <h2
            id="leave-modal-title"
            className="pr-10 text-[1.85rem] leading-tight font-semibold tracking-tight text-[#141414]"
          >
            {copy.title}
          </h2>
          <p className="mt-3 text-[15px] leading-6 text-muted-foreground">
            {copy.bodyBefore}{" "}
            <span className="font-semibold text-[var(--primary)]">
              {copy.offer}
            </span>{" "}
            {copy.bodyAfter}{" "}
            <span className="font-semibold text-[var(--primary)]">
              {copy.code}
            </span>{" "}
            {copy.bodyEnd}
          </p>
          <button
            type="button"
            onClick={() => router.push("/")}
            className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-full bg-black/[0.06] px-4 text-[15px] font-semibold text-[#141414] hover:bg-black/[0.09]"
          >
            {copy.dashboard}
          </button>
          <button
            type="button"
            onClick={onStay}
            className={`${PRIMARY_TINT_BUTTON_CLASS} mt-3 inline-flex h-12 w-full items-center justify-center rounded-full px-4 text-[15px] font-semibold`}
          >
            {copy.claim}
          </button>
        </div>
      </div>
    </div>
  );
};
