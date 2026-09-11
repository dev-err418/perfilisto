import Image from "next/image";
import type { Messages } from "@/i18n";
import { cn } from "@/lib/utils";

export function TrustRating({ messages, className }: { messages: Messages; className?: string }) {
  return (
<div className={cn("flex w-fit max-w-full items-center gap-3 text-left sm:gap-5", className)}>
        <div className="flex -space-x-2.5 sm:-space-x-3" aria-hidden="true">
          {Array.from({ length: 5 }, (_, index) => (
            <Image
              key={index}
              src={`/avatars/spanish-profile-${index + 1}.webp`}
              alt=""
              width={128}
              height={128}
              unoptimized
              loading="eager"
              className="size-9 shrink-0 rounded-full border-2 border-white bg-[#f2f2f2] object-cover shadow-sm sm:size-11"
            />
          ))}
        </div>
        <div className="text-left">
          <div
            className="flex items-center gap-1.5 sm:gap-2"
            aria-label={messages.hero.ratingLabel}
          >
            <span className="text-base font-semibold tracking-tight text-[#141414] sm:text-lg">
              {messages.hero.rating}
            </span>
            <span className="flex gap-0.5 text-primary" aria-hidden="true">
              {Array.from({ length: 5 }, (_, index) => (
                <span key={index} className="text-lg leading-none">
                  ★
                </span>
              ))}
            </span>
          </div>
          <p className="mt-0 text-xs leading-tight font-medium text-muted-foreground sm:text-sm">
            {messages.hero.trustText}
          </p>
        </div>
      </div>
  );
}
