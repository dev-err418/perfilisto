import { IconCheck, IconX } from "@tabler/icons-react";

import type { Messages } from "@/i18n";
import { cn } from "@/lib/utils";

const Status = ({
  positive,
  children,
}: {
  positive: boolean;
  children: string;
}) => (
  <span className="inline-flex items-center gap-2.5">
    <span
      className={cn(
        "flex size-6 shrink-0 items-center justify-center rounded-full",
        positive ? "bg-[#22c55e]" : "bg-[#ef4444]",
      )}
    >
      {positive ? (
        <IconCheck aria-hidden="true" className="size-3.5 text-white" stroke={2.6} />
      ) : (
        <IconX aria-hidden="true" className="size-3.5 text-white" stroke={2.6} />
      )}
    </span>
    <span className="text-[15px] leading-6 font-medium text-white sm:text-base">
      {children}
    </span>
  </span>
);

export const Compare = ({ messages }: { messages: Messages }) => {
  const copy = messages.compare;

  return (
    <section
      aria-labelledby="compare-heading"
      className="bg-white px-6 py-20 sm:py-24"
    >
      <div className="mx-auto max-w-5xl">
        <div className="text-center">
          <h2
            id="compare-heading"
            className="text-[2rem] leading-[1.15] font-semibold tracking-tight text-[#141414] sm:text-4xl md:text-[2.75rem]"
          >
            {copy.titleBefore}{" "}
            <span className="primary-tint-text">{copy.titleTint}</span>
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-base font-medium text-muted-foreground sm:text-lg">
            {copy.subtitle}
          </p>
        </div>

        <div className="mt-12 overflow-x-auto rounded-[24px] bg-[#171717]">
          <table className="w-full min-w-[640px] border-collapse text-left">
            <caption className="sr-only">
              {copy.titleBefore} {copy.titleTint}
            </caption>
            <thead>
              <tr className="border-b border-white/10">
                <th className="w-[28%] px-5 py-5 sm:px-8" />
                <th className="px-4 py-5 text-base font-semibold text-white sm:px-6 sm:text-lg">
                  {copy.perfilisto}
                </th>
                <th className="px-4 py-5 text-base font-semibold text-white sm:px-6 sm:text-lg">
                  {copy.photographer}
                </th>
              </tr>
            </thead>
            <tbody>
              {copy.rows.map((row) => (
                <tr
                  key={row.label}
                  className="border-b border-white/10 last:border-b-0"
                >
                  <th
                    scope="row"
                    className="px-5 py-5 text-[15px] font-medium text-white/55 sm:px-8 sm:text-base"
                  >
                    {row.label}
                  </th>
                  <td className="px-4 py-5 sm:px-6">
                    <Status positive>{row.perfilisto}</Status>
                  </td>
                  <td className="px-4 py-5 sm:px-6">
                    <Status positive={false}>{row.photographer}</Status>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};
