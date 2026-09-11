import type { CSSProperties } from "react";
import styles from "./fireworks.module.css";

const bursts = [
  { x: "14%", y: "20%", delay: 80 },
  { x: "86%", y: "30%", delay: 400 },
  { x: "10%", y: "66%", delay: 760 },
  { x: "88%", y: "78%", delay: 1080 },
  { x: "50%", y: "9%", delay: 1380 },
];

/** A brief, decorative celebration that plays once each time it is mounted. */
export function Fireworks() {
  return (
    <div className={styles.fireworks} aria-hidden="true">
      {bursts.map((burst, burstIndex) => (
        <div key={burstIndex} className={styles.burst} style={{ left: burst.x, top: burst.y }}>
          {Array.from({ length: 18 }, (_, index) => (
            <span
              key={index}
              className={styles.ray}
              style={{
                transform: `rotate(${index * 20 + burstIndex * 9}deg)`,
                "--spark-delay": `${burst.delay + (index % 3) * 25}ms`,
                "--spark-distance": `${52 + (index % 4) * 14}px`,
                "--spark-color": ["#ff7416", "#ffab48", "#eaa52b"][index % 3],
              } as CSSProperties}
            >
              <span className={styles.spark} />
            </span>
          ))}
        </div>
      ))}
    </div>
  );
}
