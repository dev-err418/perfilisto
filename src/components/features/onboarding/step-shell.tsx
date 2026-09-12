"use client";

import { Spinner } from "@/components/ui/spinner";
import { useEffect, useRef, type ReactNode } from "react";
import Link from "next/link";
import { IconArrowLeft, IconX } from "@tabler/icons-react";

import { getMessages } from "@/i18n";
import { cn } from "@/lib/utils";

import { BrandWord } from "../landing/brand-name";
import { ONBOARDING_CONTINUE_BUTTON_CLASS } from "../landing/button-styles";
import { LogoMark } from "../landing/logo-mark";

const messages = getMessages();

export const OnboardingStepShell = ({
  stepKey,
  direction = "forward",
  progress,
  onBack,
  continueDisabled,
  continueLoading,
  continueLabel,
  hideBack,
  hideContinue,
  onClose,
  onContinue,
  children,
  footerContent,
}: {
  stepKey: string;
  direction?: "forward" | "back";
  progress: number;
  onBack?: () => void;
  continueDisabled?: boolean;
  continueLoading?: boolean;
  continueLabel?: string;
  hideBack?: boolean;
  hideContinue?: boolean;
  onClose?: () => void;
  onContinue?: () => void;
  children: ReactNode;
  footerContent?: ReactNode;
}) => {
  const shellRef = useRef<HTMLDivElement>(null);
  const actionBarRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const bar = actionBarRef.current;
    const update = () => shellRef.current?.style.setProperty("--action-bar-height", `${bar?.getBoundingClientRect().height ?? 0}px`);
    update();
    if (!bar) return;
    const observer = new ResizeObserver(update);
    observer.observe(bar);
    return () => observer.disconnect();
  }, [hideContinue]);
  const copy = messages.onboarding.shared;
  const isQuestion = ["gender", "age", "hair", "hairLength", "hairType", "bodyType", "attire", "backgrounds", "poses", "glasses", "details"].includes(stepKey);

  return (
    <div ref={shellRef} className="theme-light flex min-h-dvh flex-col bg-white text-black [color-scheme:light]">
      <header className="sticky top-0 z-20 bg-white grid h-16 shrink-0 grid-cols-[1fr_minmax(0,16rem)_1fr] items-center gap-4 px-4 sm:px-6">
        <Link
          href="/"
          aria-label={messages.brand.homeAriaLabel}
          className="flex w-fit items-center gap-2"
        >
          <LogoMark className="size-7 rounded-[7px]" />
          <BrandWord className="hidden text-[15px] font-semibold tracking-tight text-[#141414] sm:inline" />
        </Link>
        <div
          className="h-1.5 overflow-hidden rounded-full bg-black/[0.08]"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progress * 100)}
        >
          <div
            className="h-full rounded-full bg-[var(--primary)] transition-[width] duration-200 ease-out motion-reduce:transition-none"
            style={{ width: `${Math.min(100, Math.max(0, progress * 100))}%` }}
          />
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label={copy.close}
          className="ml-auto grid size-10 place-items-center rounded-full text-[#141414] hover:bg-black/[0.04]"
        >
          <IconX className="size-5" stroke={1.8} />
        </button>
      </header>

      <div className="relative flex min-h-0 flex-1 flex-col">
        {onBack && !hideBack ? (
          <button
            type="button"
            onClick={onBack}
            className="absolute top-4 left-4 z-10 inline-flex h-9 items-center gap-1.5 rounded-full border border-black/10 bg-white px-3.5 text-sm font-semibold text-[#141414] sm:left-8"
          >
            <IconArrowLeft className="size-4" stroke={2} />
            {copy.back}
          </button>
        ) : null}

        <div
          className={cn(
            "t-page-slide flex min-h-0 flex-1 flex-col",
            !isQuestion && "pb-8",
            isQuestion ? "px-5 pb-16 pt-[var(--action-bar-height,0px)] sm:px-8" : hideBack ? "px-5 pt-4 sm:px-8" : "px-5 pt-16 sm:px-8",
          )}
          data-page={direction === "back" ? "1" : "2"}
        >
          <div
            key={stepKey}
            className="t-page onboarding-step-page"
            data-page-id={direction === "back" ? "1" : "2"}
          >
            {children}
          </div>
        </div>
      </div>

      {hideContinue ? null : (
        <div ref={actionBarRef} data-slot="onboarding-action-bar" className="sticky bottom-0 z-10 flex shrink-0 flex-col items-center justify-center gap-4 border-t border-black/[0.04] bg-white px-5 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:pt-5 sm:pb-[max(1.25rem,env(safe-area-inset-bottom))]">
          {footerContent && <div className="w-full max-w-5xl">{footerContent}</div>}
          <button
            type="button"
            disabled={continueDisabled || continueLoading}
            aria-busy={continueLoading}
            onClick={onContinue}
            className={ONBOARDING_CONTINUE_BUTTON_CLASS}
          >
            {continueLoading && <Spinner className="size-5" aria-hidden="true" />}
            {continueLabel ?? copy.continue}
          </button>
        </div>
      )}
    </div>
  );
};
