"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { getMessages } from "@/i18n";

import { BrandWord } from "../landing/brand-name";
import { PRIMARY_TINT_BUTTON_CLASS } from "../landing/button-styles";
import { LogoMark } from "../landing/logo-mark";
import { ConsentCheckbox } from "./consent-checkbox";

const messages = getMessages();

export const OnboardingWelcomeModal = ({
  onContinue,
  onOpenDashboard,
  onSkipToUpload,
}: {
  onContinue?: () => void;
  onOpenDashboard?: () => void;
  onSkipToUpload?: () => void;
}) => {
  const router = useRouter();
  const copy = messages.onboarding.welcome;
  const [age, setAge] = useState(false);
  const [terms, setTerms] = useState(false);
  const [consent, setConsent] = useState(false);
  const canContinue = age && terms && consent;
  const dialogRef = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = dialogRef.current;
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
      ref={dialogRef}
      aria-labelledby="onboarding-welcome-title"
      aria-describedby="onboarding-welcome-description"
      onCancel={(event) => { event.preventDefault(); router.push("/"); }}
      className="theme-light fixed inset-0 m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-[520px] overflow-y-auto rounded-[28px] bg-white p-7 text-black shadow-2xl backdrop:bg-black/45 backdrop:backdrop-blur-sm [color-scheme:light] sm:p-9"
    >
      <div className="mb-6 flex items-center gap-2.5">
        <LogoMark className="size-8 rounded-[8px]" />
        <BrandWord className="text-lg font-semibold tracking-tight" />
      </div>
            <h2 id="onboarding-welcome-title" className="text-[2rem] leading-tight font-semibold tracking-tight text-[#141414] sm:text-[2.35rem]">
              {copy.title}
            </h2>
            <p id="onboarding-welcome-description" className="mt-3 text-[17px] leading-7 text-muted-foreground">
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
            {process.env.NODE_ENV === "development" && onContinue ? (
              <div className="mt-4 flex flex-wrap justify-center gap-3">
                {onSkipToUpload && <button
                  type="button"
                  onClick={onSkipToUpload}
                  className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-4 py-2 text-xs font-semibold text-orange-700 hover:bg-orange-100 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-orange-500"
                >
                  <span className="rounded bg-orange-100 px-1.5 py-0.5 text-[10px] tracking-wide">DEBUG</span>
                  Skip to upload →
                </button>}
                {onOpenDashboard && <button
                  type="button"
                  onClick={onOpenDashboard}
                  className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-4 py-2 text-xs font-semibold text-orange-700 hover:bg-orange-100 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-orange-500"
                >
                  <span className="rounded bg-orange-100 px-1.5 py-0.5 text-[10px] tracking-wide">DEBUG</span>
                  Open dashboard →
                </button>}
              </div>
            ) : null}
    </dialog>
  );
};
