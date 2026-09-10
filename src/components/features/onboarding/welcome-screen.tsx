"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

import { getMessages } from "@/i18n";

import { BrandWord } from "../landing/brand-name";
import { PRIMARY_TINT_BUTTON_CLASS } from "../landing/button-styles";
import { LogoMark } from "../landing/logo-mark";
import { ConsentCheckbox } from "./consent-checkbox";

const messages = getMessages();

export const OnboardingWelcomeScreen = ({
  onContinue,
}: {
  onContinue?: () => void;
}) => {
  const copy = messages.onboarding.welcome;
  const [age, setAge] = useState(false);
  const [terms, setTerms] = useState(false);
  const [consent, setConsent] = useState(false);
  const canContinue = age && terms && consent;

  return (
    <main className="theme-light relative min-h-dvh overflow-hidden bg-black text-black [color-scheme:light]">
      <Image
        src="/onboarding/welcome-bg.jpg"
        alt=""
        fill
        priority
        unoptimized
        className="object-cover object-[20%_center]"
      />
      <div className="absolute inset-0 bg-black/25" />

      <div className="relative z-10 flex min-h-dvh flex-col px-5 py-5 sm:px-8 sm:py-7">
        <Link
          href="/"
          aria-label={messages.brand.homeAriaLabel}
          className="flex w-fit items-center gap-2.5"
        >
          <LogoMark className="size-8 rounded-[8px]" />
          <BrandWord className="text-lg font-semibold tracking-tight text-white drop-shadow-sm" />
        </Link>

        <div className="flex flex-1 items-center justify-center py-8 lg:justify-end lg:pr-[min(8vw,96px)]">
          <div className="w-full max-w-[520px] rounded-[28px] bg-white p-7 shadow-[0_24px_80px_rgba(0,0,0,0.28)] sm:p-9">
            <h1 className="text-[2rem] leading-tight font-semibold tracking-tight text-[#141414] sm:text-[2.35rem]">
              {copy.title}
            </h1>
            <p className="mt-3 text-[17px] leading-7 text-muted-foreground">
              {copy.subtitle}
            </p>

            <div className="mt-7 space-y-5">
              <ConsentCheckbox id="onboarding-age" checked={age} onChange={setAge}>
                {copy.age}
              </ConsentCheckbox>
              <ConsentCheckbox
                id="onboarding-terms"
                checked={terms}
                onChange={setTerms}
              >
                {copy.termsBefore}{" "}
                <Link
                  href="/terms"
                  target="_blank"
                  rel="noreferrer"
                  className="font-semibold underline underline-offset-2"
                >
                  {copy.termsOfService}
                </Link>{" "}
                {copy.termsAnd}{" "}
                <Link
                  href="/privacy"
                  target="_blank"
                  rel="noreferrer"
                  className="font-semibold underline underline-offset-2"
                >
                  {copy.privacyPolicy}
                </Link>
                .
              </ConsentCheckbox>
              <ConsentCheckbox
                id="onboarding-consent"
                checked={consent}
                onChange={setConsent}
              >
                {copy.consent}
              </ConsentCheckbox>
            </div>

            <button
              type="button"
              disabled={!canContinue}
              onClick={onContinue}
              className={`${PRIMARY_TINT_BUTTON_CLASS} mt-8 inline-flex h-12 w-full items-center justify-center rounded-full px-5 text-base font-semibold tracking-[0.2px] disabled:pointer-events-none disabled:opacity-40`}
            >
              {copy.continue}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
};
