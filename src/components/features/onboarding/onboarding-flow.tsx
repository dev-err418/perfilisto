"use client";

import { useT } from "@/i18n/client";

import { useFunnelStage } from "@/components/analytics/whop-pixel";
import { ANALYTICS_READY, trackFunnel } from "@/lib/analytics/client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { loadCurrentOrder } from "@/lib/orders/current-order";
import { getPlans } from "@/lib/orders/catalog.mjs";
import { useLocale } from "@/i18n/client";
import type { Order } from "@/lib/orders/types";
import { Spinner } from "@/components/ui/spinner";

import { useMessages } from "@/i18n/client";

import { PostUploadFlow } from "./post-upload-flow";
import { AttireStep, type AttireOption } from "./attire-step";
import { BackgroundsStep, type BackgroundOption } from "./backgrounds-step";
import { UploadStep, UPLOAD_MIN, type UploadedPhoto } from "./upload-step";
import { AgeStep, type AgeOption } from "./age-step";
import { GenderStep, type GenderOption } from "./gender-step";
import { HairLengthStep, type HairLengthOption } from "./hair-length-step";
import { HairStep, type HairOption } from "./hair-step";
import { BodyTypeStep, type BodyTypeOption } from "./body-type-step";
import { HairTypeStep, type HairTypeOption } from "./hair-type-step";
import { LeaveModal } from "./leave-modal";
import { OnboardingStepShell } from "./step-shell";
import { OnboardingWelcomeModal } from "./welcome-screen";

type Step =
  | "gender"
  | "age"
  | "hair"
  | "hairLength"
  | "hairType"
  | "bodyType"
  | "attire"
  | "backgrounds"
  | "upload"
  | "purchase";

const STEP_PROGRESS: Record<Step, number> = {
  gender: 2 / 14,
  age: 3 / 14,
  hair: 4 / 14,
  hairLength: 5 / 14,
  hairType: 6 / 14,
  bodyType: 7 / 14,
  attire: 8 / 14,
  backgrounds: 9 / 14,
  upload: 10 / 14,
  purchase: 11 / 14,
};

const previousStep: Record<Step, Step> = {
  gender: "gender",
  age: "gender",
  hair: "age",
  hairLength: "hair",
  hairType: "hairLength",
  bodyType: "hairType",
  attire: "bodyType",
  backgrounds: "attire",
  upload: "backgrounds",
  purchase: "upload",
};

const ALL_ATTIRE: AttireOption[] = [
  "professional",
  "business-casual",
  "smart-casual",
];

const ALL_BACKGROUNDS: BackgroundOption[] = [
  "city",
  "nature",
  "office",
  "studio",
];

const SINGLE_CHOICE_STEPS: Step[] = [
  "gender",
  "age",
  "hair",
  "hairLength",
  "hairType",
  "bodyType",
];

const NEXT_STEP: Partial<Record<Step, Step>> = {
  gender: "age",
  age: "hair",
  hair: "hairLength",
  hairLength: "hairType",
  hairType: "bodyType",
  bodyType: "attire",
  attire: "backgrounds",
  backgrounds: "upload",
  upload: "purchase",
};

export const OnboardingFlow = () => {
  const t = useT();
  const messages = useMessages();
  const locale = useLocale();
  const plans = getPlans(locale);
  const router = useRouter();
  const [restoringAccount, setRestoringAccount] = useState(true);
  const [restoreError, setRestoreError] = useState(false);
  const [step, setStep] = useState<Step>("gender");
  const [welcomeOpen, setWelcomeOpen] = useState(true);
  useFunnelStage(welcomeOpen ? "welcome" : step === "purchase" ? "packages" : step.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`));
  const advanceTimer = useRef<number>(0);
  const [direction, setDirection] = useState<"forward" | "back">("forward");

  useEffect(() => () => window.clearTimeout(advanceTimer.current), []);
  useEffect(() => {
    let cancelled = false;
    const query = new URLSearchParams(window.location.search);
    if (query.get("new") === "1" && !query.get("order")) {
      queueMicrotask(() => setRestoringAccount(false));
      return;
    }
    const id = new URLSearchParams(window.location.search).get("order");
    if (id) { queueMicrotask(() => { setWelcomeOpen(false); setStep("purchase"); setRestoringAccount(false); }); return; }
    void loadCurrentOrder().then(order => {
      if (cancelled) return;
      if (order && ["generating", "complete", "partial", "failed"].includes(order.status)) {
        router.replace(`/dashboard?order=${encodeURIComponent(order.id)}`);
        return;
      }
      setRestoringAccount(false);
    }).catch(() => { if (!cancelled) { setRestoreError(true); setRestoringAccount(false); } });
    return () => { cancelled = true; };
  }, [router]);
  const [gender, setGender] = useState<GenderOption | null>(null);
  const [age, setAge] = useState<AgeOption | null>(null);
  const [hair, setHair] = useState<HairOption | null>(null);
  const [hairLength, setHairLength] = useState<HairLengthOption | null>(null);
  const [hairType, setHairType] = useState<HairTypeOption | null>(null);
  const [bodyType, setBodyType] = useState<BodyTypeOption | null>(null);
  const [attire, setAttire] = useState<AttireOption[]>(ALL_ATTIRE);
  const [backgrounds, setBackgrounds] =
    useState<BackgroundOption[]>(ALL_BACKGROUNDS);
  const [photos, setPhotos] = useState<UploadedPhoto[]>([]);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const readyPhotos = photos.filter(photo => !photo.preparing).length;
  useEffect(() => {
    const record = () => { if (readyPhotos >= UPLOAD_MIN) trackFunnel("uploads_ready", { photo_count: readyPhotos }, "uploads_ready"); };
    record();
    window.addEventListener(ANALYTICS_READY, record);
    return () => window.removeEventListener(ANALYTICS_READY, record);
  }, [readyPhotos]);

  const skipToUpload = () => {
    if (process.env.NODE_ENV !== "development") return;
    window.clearTimeout(advanceTimer.current);
    setGender("man");
    setAge("25-29");
    setHair("brown");
    setHairLength("short");
    setHairType("wavy");
    setBodyType("regular");
    setAttire(ALL_ATTIRE);
    setBackgrounds(ALL_BACKGROUNDS);
    setDirection("forward");
    setWelcomeOpen(false);
    setStep("upload");
  };

  const openDashboardPreview = () => {
    if (process.env.NODE_ENV !== "development") return;
    const plan = plans[0];
    const preview: Order = {
      ...plan, id: "dashboard-preview", planId: plan.id,
      status: "generating", batchStatus: "in_progress",
      preferences: { gender: "man", age: "25-29", hair: "brown", hairLength: "short", hairType: "wavy", bodyType: "regular", attire: ALL_ATTIRE, backgrounds: ALL_BACKGROUNDS, poses: ["professional", "relaxed"], glasses: "none" },
      photos: ["professional", "business-casual", "smart-casual", "professional"].map((attire, index) => ({ id: `example-${index}`, name: t("Example portrait"), url: `/onboarding/attire/man-${attire}.jpg` })),
      results: [], expiresAt: Date.now() + 86400000,
    };
    sessionStorage.setItem("perfilisto-dashboard-preview", JSON.stringify(preview));
    sessionStorage.removeItem("perfilisto-progress-start:dashboard-preview");
    router.push("/dashboard?preview=1");
  };

  const goNext = (from: Step) => {
    const next = NEXT_STEP[from];
    if (next) {
      window.clearTimeout(advanceTimer.current);
      setDirection("forward");
      setStep(next);
    }
  };

  const selectAndAdvance = <T,>(
    setter: (value: T) => void,
    from: Step,
    value: T,
  ) => {
    setter(value);
    window.clearTimeout(advanceTimer.current);
    advanceTimer.current = window.setTimeout(() => goNext(from), 250);
  };

  if (restoringAccount || restoreError) return <main className="theme-light grid min-h-dvh place-content-center justify-items-center gap-4 bg-white text-black">
    {restoreError ? <><p>{t("Could not restore your headshots.")}</p><button className="rounded-full border px-6 py-3" onClick={() => window.location.reload()}>{t("Try again")}</button></> : <Spinner className="size-8 text-primary" aria-label={t("Restoring your headshots")} />}
  </main>;

  if (step === "purchase")
    return (
      <>
        <PostUploadFlow
          photos={photos}
          preferences={{ attire, backgrounds, gender, age, hair, hairLength, hairType, bodyType }}
          onBack={() => setStep("upload")}
          onClose={() => setLeaveOpen(true)}
        />
        {leaveOpen ? <LeaveModal onStay={() => setLeaveOpen(false)} /> : null}
      </>
    );

  const continueDisabled =
    (step === "attire" && attire.length === 0) ||
    (step === "backgrounds" && backgrounds.length === 0) ||
    (step === "upload" &&
      (photos.length < UPLOAD_MIN || photos.some((photo) => photo.preparing)));

  const hideContinue = SINGLE_CHOICE_STEPS.includes(step);
  const continueLabel = messages.onboarding.shared.continue;

  return (
    <>
      <OnboardingStepShell
        stepKey={step}
        direction={direction}
        progress={STEP_PROGRESS[step]}
        onBack={() => {
          window.clearTimeout(advanceTimer.current);
          setDirection("back");
          setStep(previousStep[step]);
        }}
        hideBack={step === "upload" || step === "gender"}
        hideContinue={hideContinue}
        continueDisabled={continueDisabled}
        continueLabel={continueLabel}
        onClose={() => {
          window.clearTimeout(advanceTimer.current);
          setLeaveOpen(true);
        }}
        onContinue={() => goNext(step)}
      >
        {step === "gender" ? (
          <GenderStep
            value={gender}
            onChange={(value) => selectAndAdvance(setGender, "gender", value)}
          />
        ) : null}
        {step === "age" ? (
          <AgeStep
            value={age}
            onChange={(value) => selectAndAdvance(setAge, "age", value)}
          />
        ) : null}
        {step === "hair" ? (
          <HairStep
            value={hair}
            onChange={(value) => selectAndAdvance(setHair, "hair", value)}
          />
        ) : null}
        {step === "hairLength" ? (
          <HairLengthStep
            gender={gender}
            value={hairLength}
            onChange={(value) =>
              selectAndAdvance(setHairLength, "hairLength", value)
            }
          />
        ) : null}
        {step === "hairType" ? (
          <HairTypeStep
            gender={gender}
            value={hairType}
            onChange={(value) =>
              selectAndAdvance(setHairType, "hairType", value)
            }
          />
        ) : null}
        {step === "bodyType" ? (
          <BodyTypeStep
            gender={gender}
            value={bodyType}
            onChange={(value) =>
              selectAndAdvance(setBodyType, "bodyType", value)
            }
          />
        ) : null}
        {step === "attire" ? (
          <AttireStep gender={gender} value={attire} onChange={setAttire} />
        ) : null}
        {step === "backgrounds" ? (
          <BackgroundsStep
            gender={gender}
            value={backgrounds}
            onChange={setBackgrounds}
          />
        ) : null}
        {step === "upload" ? (
          <UploadStep
            photos={photos}
            onChange={setPhotos}
            onBack={() => {
              setDirection("back");
              setStep("backgrounds");
            }}
          />
        ) : null}
      </OnboardingStepShell>
      {welcomeOpen && <OnboardingWelcomeModal
        onContinue={() => setWelcomeOpen(false)}
        onOpenDashboard={openDashboardPreview}
          onSkipToUpload={skipToUpload}
      />}
      {leaveOpen ? <LeaveModal onStay={() => setLeaveOpen(false)} /> : null}
    </>
  );
};
