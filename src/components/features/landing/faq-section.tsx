"use client";

import { useState } from "react";

import type { Messages } from "@/i18n";

const FaqItem = ({
  question,
  answer,
  index,
  isOpen,
  onToggle,
}: {
  question: string;
  answer: string;
  index: number;
  isOpen: boolean;
  onToggle: () => void;
}) => {
  const answerId = `homepage-faq-answer-${index}`;

  return (
    <div className="border-b border-black/10">
      <button
        type="button"
        aria-expanded={isOpen}
        aria-controls={answerId}
        onClick={onToggle}
        className="flex w-full items-center justify-between py-5 text-left"
      >
        <span className="text-base font-medium text-black sm:text-lg">
          {question}
        </span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
          className={`faq-toggle-icon ml-4 h-5 w-5 shrink-0 text-muted-foreground ${isOpen ? "rotate-45" : ""}`}
        >
          <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
        </svg>
      </button>
      <div
        id={answerId}
        aria-hidden={!isOpen}
        className={`faq-answer grid ${isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
      >
        <div className="overflow-hidden">
          <p className="pb-5 text-sm leading-relaxed text-muted-foreground sm:text-base">
            {answer}
          </p>
        </div>
      </div>
    </div>
  );
};

export const FaqSection = ({ messages }: { messages: Messages }) => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const copy = messages.faq;

  return (
    <section
      id="faq"
      aria-labelledby="faq-heading"
      className="scroll-mt-24 bg-white py-20 sm:py-24"
    >
      <div className="mx-auto max-w-3xl px-6">
        <h2
          id="faq-heading"
          className="text-center text-[2rem] leading-[1.15] font-semibold tracking-tight text-[#141414] sm:text-4xl md:text-[2.75rem]"
        >
          {copy.title}
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-base font-medium text-pretty text-muted-foreground sm:text-lg">
          {copy.subtitle}
        </p>
        <div className="mt-10 sm:mt-12">
          {copy.items.map((item, index) => (
            <FaqItem
              key={item.question}
              question={item.question}
              answer={item.answer}
              index={index}
              isOpen={openIndex === index}
              onToggle={() => setOpenIndex(openIndex === index ? null : index)}
            />
          ))}
        </div>
      </div>
    </section>
  );
};
