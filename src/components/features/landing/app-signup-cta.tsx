import Link from "@/i18n/navigation";
import { IconArrowRight, IconLock } from "@tabler/icons-react";

import { PRIMARY_CTA_BUTTON_CLASS } from "./button-styles";

export const AppSignupCta = ({
  href = "/onboarding",
  label,
  supportingText,
}: {
  href?: string;
  label: string;
  supportingText?: string;
}) => (
  <>
    <div className="mx-auto mt-6 w-full max-w-[310px]">
      <Link href={href} className={`${PRIMARY_CTA_BUTTON_CLASS} w-full min-w-0`}>
        {label}
        <IconArrowRight aria-hidden="true" className="size-6" stroke={2.2} />
      </Link>
      {supportingText ? (
        <p className="mt-2 flex items-center justify-center gap-1.5 text-center text-xs leading-tight font-medium text-muted-foreground sm:text-sm">
          <IconLock aria-hidden="true" className="size-3.5 shrink-0" stroke={1.8} />
          {supportingText}
        </p>
      ) : null}
    </div>
  </>
);
