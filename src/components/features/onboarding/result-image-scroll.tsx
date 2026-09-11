import Image from "next/image";

import { headshotPortraits } from "@/lib/headshot-portraits";

import styles from "./result-image-scroll.module.css";

export function ResultImageScroll() {
  return (
    <div
      className={`${styles.viewport} hidden lg:block`}
      aria-hidden="true"
    >
      <div className={styles.track}>
        {[0, 1].map((copy) => (
          <div key={copy} className={styles.group}>
            {headshotPortraits.map((portrait) => (
              <Image
                key={portrait.id}
                src={portrait.professional}
                alt=""
                width={576}
                height={720}
                unoptimized
                loading="eager"
                draggable={false}
                className="aspect-[4/5] w-full rounded-3xl object-cover"
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
