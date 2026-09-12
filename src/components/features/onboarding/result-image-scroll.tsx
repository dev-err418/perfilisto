import Image from "next/image";
import type { CSSProperties } from "react";

import { headshotPortraits } from "@/lib/headshot-portraits";

import styles from "./result-image-scroll.module.css";

export function ResultImageScroll({ variant = "column" }: { variant?: "column" | "card" }) {
  const columns = variant === "card"
    ? [headshotPortraits.slice(0, 10), headshotPortraits.slice(10).reverse()]
    : [headshotPortraits];
  // Complete the three-image pattern so the loop never adds an extra regular image.
  const loopingColumns = columns.map(portraits => variant === "card"
    ? [...portraits, ...portraits.slice(0, (3 - portraits.length % 3) % 3)]
    : portraits);

  return (
    <div
      className={`${styles.viewport} ${variant === "card" ? styles.cardViewport : ""} hidden lg:block`}
      aria-hidden="true"
    >
      <div className={variant === "card" ? styles.columns : undefined}>
        {loopingColumns.map((portraits, column) => (
          <div key={column} className={`${styles.track} ${column === 1 ? styles.downward : ""}`}>
            {[0, 1].map((copy) => (
              <div key={copy} className={styles.group}>
                {portraits.map((portrait, index) => {
                  const comparison = variant === "card" && index % 3 === 2;
                  return (
                    <div
                      key={`${portrait.id}-${index}`}
                      className="relative aspect-[4/5] overflow-hidden rounded-3xl"
                      style={{ "--comparison-delay": `${-(index + column) * 1.3}s` } as CSSProperties}
                    >
                      <Image
                        src={portrait.professional}
                        alt=""
                        width={576}
                        height={720}
                        unoptimized
                        loading="eager"
                        draggable={false}
                        className="h-full w-full object-cover"
                      />
                      {comparison && <>
                        <div className={styles.before}>
                          <Image src={portrait.casual} alt="" width={576} height={720} unoptimized loading="eager" draggable={false} className="h-full w-full object-cover" />
                        </div>
                        <div className={styles.divider} />
                        <div className="pointer-events-none absolute inset-x-3 bottom-3 flex justify-between text-[10px] font-semibold text-white">
                          <span className="rounded-full bg-black/45 px-2 py-1">Before</span>
                          <span className="rounded-full bg-black/45 px-2 py-1">After</span>
                        </div>
                      </>}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
