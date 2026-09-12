import Image from "next/image";
import { IconCheck, IconPhoto } from "@tabler/icons-react";
import { Download, Heart } from "lucide-react";

import { Spinner } from "@/components/ui/spinner";
import type { Messages } from "@/i18n";

const ATTIRE_PHOTOS = [
  "/onboarding/attire/woman-professional.jpg",
  "/onboarding/attire/woman-business-casual.jpg",
  "/onboarding/attire/woman-smart-casual.jpg",
] as const;

const UPLOAD_PHOTOS = [
  "/headshots/woman_01_casual.webp",
  "/headshots/woman_02_casual.webp",
  "/headshots/woman_03_casual.webp",
  "/headshots/man_01_casual.webp",
  "/headshots/man_02_casual.webp",
  "/headshots/woman_04_casual.webp",
] as const;

const DemoCursor = ({ className }: { className: string }) => (
  <svg className={className} viewBox="0 0 32 32" aria-hidden="true">
    <path
      d="M5 3.6 28.6 16 14.8 17.6 11.6 28.4Z"
      fill="#f97316"
      stroke="#fff"
      strokeWidth="2.4"
      strokeLinejoin="round"
      strokeLinecap="round"
    />
  </svg>
);

const AttirePreview = ({ labels }: { labels: readonly string[] }) => (
  <div className="attire-select-demo" aria-hidden="true">
    <div className="attire-select-demo-row">
      {labels.map((label, index) => (
        <article
          key={label}
          className={`attire-select-demo-card attire-select-demo-card-${index}`}
        >
          <span className="attire-select-demo-photo">
            <Image
              src={ATTIRE_PHOTOS[index] ?? ATTIRE_PHOTOS[0]}
              alt=""
              fill
              unoptimized
              sizes="140px"
              className="object-cover object-top"
            />
            <span className="attire-select-demo-check">
              <IconCheck className="size-[9px]" stroke={3} />
            </span>
          </span>
          <span className="attire-select-demo-footer">
            <span className="attire-select-demo-label">{label}</span>
          </span>
        </article>
      ))}
      <DemoCursor className="attire-select-demo-cursor" />
    </div>
  </div>
);

const UploadPreview = ({ prompt }: { prompt: string }) => (
  <div className="upload-demo" aria-hidden="true">
    <div className="upload-demo-zone">
      <div className="upload-demo-empty">
        <IconPhoto className="size-7" stroke={1.4} />
        <span>{prompt}</span>
      </div>
      <div className="upload-demo-grid">
        {UPLOAD_PHOTOS.map((src, index) => (
          <span key={src} className={`upload-demo-tile upload-demo-tile-${index}`}>
            <Image
              src={src}
              alt=""
              fill
              unoptimized
              sizes="80px"
              className="upload-demo-photo object-cover"
            />
            <span className="upload-demo-preparing">
              <Spinner className="upload-demo-spinner size-5" aria-hidden="true" />
            </span>
          </span>
        ))}
      </div>
      <div className="upload-demo-stack">
        {UPLOAD_PHOTOS.slice(0, 4).map((src, index) => (
          <span key={src} className={`upload-demo-stack-card upload-demo-stack-card-${index}`}>
            <Image
              src={src}
              alt=""
              fill
              unoptimized
              sizes="72px"
              className="object-cover"
            />
          </span>
        ))}
      </div>
      <DemoCursor className="upload-demo-cursor" />
    </div>
  </div>
);

const GENERATE_PHOTO = "/headshots/woman_01_professional_office.webp";
const GENERATE_PIXELS = [8, 14, 22, 36, 56] as const;

const GeneratePreview = () => (
  <div className="generate-demo" aria-hidden="true">
    <div className="generate-demo-frame">
      <Image
        src={GENERATE_PHOTO}
        alt=""
        fill
        unoptimized
        sizes="160px"
        className="generate-demo-sharp object-cover object-top"
      />
      {GENERATE_PIXELS.map((size) => (
        <Image
          key={size}
          src={`/onboarding/generate/pixel-${size}.webp`}
          alt=""
          fill
          unoptimized
          sizes="160px"
          className={`generate-demo-mosaic generate-demo-mosaic-${size}`}
        />
      ))}
    </div>
  </div>
);

const GALLERY_PHOTOS = [
  "/headshots/woman_10_professional_nature.webp",
  "/headshots/woman_06_professional_city.webp",
  "/headshots/woman_01_professional_office.webp",
  "/headshots/woman_07_professional_studio.webp",
  "/headshots/woman_04_professional_nature.webp",
  "/headshots/woman_02_professional_city.webp",
  "/headshots/woman_03_professional_studio.webp",
  "/headshots/woman_05_professional_office.webp",
  "/headshots/woman_08_professional_nature.webp",
] as const;

const GalleryPreview = () => (
  <div className="gallery-demo" aria-hidden="true">
    <div className="gallery-demo-grid">
      {GALLERY_PHOTOS.map((src, index) => (
        <article
          key={src}
          className={index === 4 ? "gallery-demo-card gallery-demo-card-active" : "gallery-demo-card"}
        >
          <Image
            src={src}
            alt=""
            fill
            unoptimized
            sizes="90px"
            className="object-cover object-top"
          />
          {index === 4 ? (
            <span className="gallery-demo-overlay">
              <span className="gallery-demo-heart">
                <Heart className="gallery-demo-heart-icon" />
              </span>
              <span className="gallery-demo-download">
                <Download className="gallery-demo-download-icon" aria-hidden="true" />
                Download
              </span>
            </span>
          ) : null}
        </article>
      ))}
    </div>
    <div className="gallery-demo-saved">
      <Image
        src={GALLERY_PHOTOS[4]}
        alt=""
        fill
        unoptimized
        sizes="90px"
        className="object-cover object-top"
      />
    </div>
    <DemoCursor className="gallery-demo-cursor" />
  </div>
);

const stepPreview = (
  index: number,
  copy: Messages["howItWorks"],
) => {
  if (index === 0) return <AttirePreview labels={copy.outfits} />;
  if (index === 1) return <UploadPreview prompt={copy.uploadPrompt} />;
  if (index === 2) return <GeneratePreview />;
  return <GalleryPreview />;
};

export const HowItWorks = ({ messages }: { messages: Messages }) => {
  const copy = messages.howItWorks;

  return (
    <section
      id="how-it-works"
      aria-labelledby="how-it-works-heading"
      className="scroll-mt-24 bg-white px-6 py-20 sm:py-24"
    >
      <div className="mx-auto max-w-6xl">
        <div className="text-center">
          <h2
            id="how-it-works-heading"
            className="text-[2rem] leading-[1.15] font-semibold tracking-tight text-[#141414] sm:text-4xl md:text-[2.75rem]"
          >
            {copy.titleBefore}{" "}
            <span className="primary-tint-text">{copy.titleTint}</span>
            {copy.titleAfter}
          </h2>
          <p className="mt-3 text-base font-medium text-muted-foreground sm:text-lg">
            {copy.subtitle}
          </p>
        </div>

        <ol className="mt-14 grid gap-10 sm:grid-cols-2 xl:grid-cols-4 xl:gap-6">
          {copy.steps.map((step, index) => (
            <li key={step.number} className="flex flex-col">
              <div className="h-[220px] overflow-hidden rounded-[28px] border border-black/[0.06] bg-[#f7f7f7] sm:h-[240px]">
                {stepPreview(index, copy)}
              </div>
              <div className="mt-6 flex gap-3">
                <span className="primary-tint-surface flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white">
                  {step.number}
                </span>
                <div className="min-w-0">
                  <h3 className="text-lg leading-7 font-semibold text-[#141414]">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-[#717171] sm:text-[15px]">
                    {step.body}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
};
