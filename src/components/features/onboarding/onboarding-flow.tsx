"use client";

import { useState } from "react";

import { getMessages } from "@/i18n";

import { AgeStep, type AgeOption } from "./age-step";
import { GenderStep, type GenderOption } from "./gender-step";
import { HairLengthStep, type HairLengthOption } from "./hair-length-step";
import { HairStep, type HairOption } from "./hair-step";
import { HairTypeStep, type HairTypeOption } from "./hair-type-step";
import { OnboardingStepShell } from "./step-shell";
import { OnboardingWelcomeScreen } from "./welcome-screen";

type Step = "welcome" | "gender" | "age" | "hair" | "hairLength" | "hairType";

const STEP_PROGRESS: Record<Exclude<Step, "welcome">, number> = {
  gender: 2 / 8,
  age: 3 / 8,
  hair: 4 / 8,
  hairLength: 5 / 8,
  hairType: 6 / 8,
};

const previousStep: Record<Exclude<Step, "welcome">, Step> = {
  gender: "welcome",
  age: "gender",
  hair: "age",
  hairLength: "hair",
  hairType: "hairLength",
};

const messages = getMessages();

export const OnboardingFlow = () => {
  const [step, setStep] = useState<Step>("welcome");
  const [gender, setGender] = useState<GenderOption | null>(null);
  const [age, setAge] = useState<AgeOption | null>(null);
  const [hair, setHair] = useState<HairOption | null>(null);
  const [hairLength, setHairLength] = useState<HairLengthOption | null>(null);
  const [hairType, setHairType] = useState<HairTypeOption | null>(null);

  if (step === "welcome") {
    return <OnboardingWelcomeScreen onContinue={() => setStep("gender")} />;
  }

  const continueDisabled =
    (step === "gender" && !gender) ||
    (step === "age" && !age) ||
    (step === "hair" && !hair) ||
    (step === "hairType" && !hairType);

  const continueLabel =
    step === "hairLength" && !hairLength
      ? messages.onboarding.shared.skip
      : messages.onboarding.shared.continue;

  return (
    <OnboardingStepShell
      progress={STEP_PROGRESS[step]}
      onBack={() => setStep(previousStep[step])}
      continueDisabled={continueDisabled}
      continueLabel={continueLabel}
      onContinue={() => {
        if (step === "gender") setStep("age");
        if (step === "age") setStep("hair");
        if (step === "hair") setStep("hairLength");
        if (step === "hairLength") setStep("hairType");
      }}
    >
      {step === "gender" ? (
        <GenderStep value={gender} onChange={setGender} />
      ) : null}
      {step === "age" ? <AgeStep value={age} onChange={setAge} /> : null}
      {step === "hair" ? <HairStep value={hair} onChange={setHair} /> : null}
      {step === "hairLength" ? (
        <HairLengthStep
          gender={gender}
          value={hairLength}
          onChange={setHairLength}
        />
      ) : null}
      {step === "hairType" ? (
        <HairTypeStep gender={gender} value={hairType} onChange={setHairType} />
      ) : null}
    </OnboardingStepShell>
  );
};
