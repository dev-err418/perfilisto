import Link from "next/link";
import { IconArrowRight, IconLock } from "@tabler/icons-react";

import { PRIMARY_CTA_BUTTON_CLASS } from "./button-styles";

export const AppSignupCta = ({
  href,
  label,
  supportingText,
}: {
  href?: string;
  label: string;
  supportingText?: string;
}) => (
  <>
    <div className="mx-auto mt-8 w-full max-w-[260px]">
      {href ? <Link href={href} className={`${PRIMARY_CTA_BUTTON_CLASS} w-full min-w-0`}>
        {label}
        <IconArrowRight aria-hidden="true" className="size-5" stroke={2.2} />
      </Link> : (
        <button type="button" disabled className={`${PRIMARY_CTA_BUTTON_CLASS} w-full min-w-0 cursor-not-allowed`}>
          {label}
          <IconArrowRight aria-hidden="true" className="size-5" stroke={2.2} />
        </button>
      )}
      {supportingText ? (
        <p className="mt-2 flex items-center justify-center gap-1.5 text-center text-xs font-medium text-muted-foreground">
          <IconLock aria-hidden="true" className="size-3.5 shrink-0" stroke={1.8} />
          {supportingText}
        </p>
      ) : null}
    </div>
  </>
);
