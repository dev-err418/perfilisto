"use client";

import { useEffect, useRef, useState, type DragEvent } from "react";
import { createPortal } from "react-dom";
import QRCode from "qrcode";
import Image from "next/image";
import {
  IconCamera,
  IconCheck,
  IconChevronDown,
  IconCopy,
  IconDeviceMobile,
  IconLock,
  IconPhoto,
  IconSun,
  IconUpload,
  IconX,
} from "@tabler/icons-react";

import { getMessages } from "@/i18n";
import {
  createRemoteSession,
  getRemoteSessionPhotos,
} from "@/lib/upload-session-client";
import { cn } from "@/lib/utils";

import { PRIMARY_TINT_BUTTON_CLASS } from "../landing/button-styles";

const messages = getMessages();

const MIN_PHOTOS = 6;
const MAX_PHOTOS = 10;
const MAX_BYTES = 120 * 1024 * 1024;
const ACCEPT = "image/jpeg,image/png,image/webp,image/heic,image/heif,.jpg,.jpeg,.png,.webp,.heic,.heif";

type UploadedPhoto = {
  id: string;
  name: string;
  url: string;
};

const formatCount = (template: string, values: Record<string, number | string>) =>
  Object.entries(values).reduce(
    (text, [key, value]) => text.replace(`{${key}}`, String(value)),
    template,
  );

const QrMark = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 29 29" className={className} aria-hidden="true">
    {Array.from({ length: 29 * 29 }, (_, index) => {
      const x = index % 29;
      const y = Math.floor(index / 29);
      const filled =
        ((x * 7 + y * 13) % 5 !== 0 && x > 1 && y > 1 && x < 27 && y < 27) ||
        (x < 7 && y < 7) ||
        (x > 21 && y < 7) ||
        (x < 7 && y > 21);
      const finder =
        (x < 7 && y < 7) || (x > 21 && y < 7) || (x < 7 && y > 21);
      const hole =
        finder &&
        x % 6 !== 0 &&
        y % 6 !== 0 &&
        x !== 0 &&
        y !== 0 &&
        x !== 28 &&
        y !== 28 &&
        !(
          (x > 1 && x < 5 && y > 1 && y < 5) ||
          (x > 23 && x < 27 && y > 1 && y < 5) ||
          (x > 1 && x < 5 && y > 23 && y < 27)
        );
      if (finder && hole) return null;
      if (!filled && !finder) return null;
      return <rect key={index} x={x} y={y} width="1" height="1" fill="currentColor" />;
    })}
  </svg>
);

const ExamplePhoto = ({ src, label }: { src: string; label: string }) => (
  <span className="relative block overflow-hidden rounded-xl">
    <Image
      src={src}
      alt=""
      width={160}
      height={160}
      unoptimized
      className="aspect-square h-24 w-full object-cover sm:h-28"
    />
    <span className="absolute inset-x-1.5 bottom-1.5 rounded-md bg-black/55 px-1.5 py-0.5 text-center text-[9px] font-semibold tracking-[0.12em] text-white uppercase">
      {label}
    </span>
  </span>
);

export const UploadStep = ({
  photos,
  onChange,
  onBack,
}: {
  photos: UploadedPhoto[];
  onChange: (photos: UploadedPhoto[]) => void;
  onBack: () => void;
}) => {
  const copy = messages.onboarding.upload;
  const shared = messages.onboarding.shared;
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [requirementsOpen, setRequirementsOpen] = useState(true);
  const [restrictionsOpen, setRestrictionsOpen] = useState(true);
  const [qrOpen, setQrOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [mobileUrl, setMobileUrl] = useState("");
  const [qrSvg, setQrSvg] = useState("");
  const photosRef = useRef(photos);
  const importedIds = useRef(new Set<string>());
  photosRef.current = photos;

  useEffect(() => {
    let cancelled = false;
    void createRemoteSession()
      .then((id) => {
        if (!cancelled) setSessionId(id);
      })
      .catch(() => {
        if (!cancelled) setSessionId(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!sessionId) return;
    const url = `${window.location.origin}/upload-session?s=${sessionId}`;
    setMobileUrl(url);
    void QRCode.toString(url, {
      type: "svg",
      margin: 1,
      color: { dark: "#141414", light: "#00000000" },
    }).then(setQrSvg);
  }, [sessionId]);

  useEffect(() => {
    if (!sessionId) return;
    const timer = window.setInterval(() => {
      void getRemoteSessionPhotos(sessionId).then((remote) => {
        if (!remote?.length) return;
        const fresh = remote.filter((photo) => !importedIds.current.has(photo.id));
        if (!fresh.length) return;
        for (const photo of fresh) importedIds.current.add(photo.id);
        onChange([
          ...photosRef.current,
          ...fresh.map((photo) => ({
            id: photo.id,
            name: photo.name,
            url: photo.dataUrl,
          })),
        ]);
      });
    }, 1500);
    return () => window.clearInterval(timer);
  }, [onChange, sessionId]);

  useEffect(() => {
    if (!qrOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setQrOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [qrOpen]);

  const addFiles = (fileList: FileList | File[]) => {
    const next = [...photos];
    for (const file of Array.from(fileList)) {
      if (next.length >= MAX_PHOTOS) break;
      if (!file.type.startsWith("image/") && !/\.(heic|heif)$/i.test(file.name)) {
        continue;
      }
      if (file.size > MAX_BYTES) continue;
      next.push({
        id: `${file.name}-${file.size}-${file.lastModified}-${Math.random()}`,
        name: file.name,
        url: URL.createObjectURL(file),
      });
    }
    onChange(next);
  };

  const onDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setDragging(false);
    if (event.dataTransfer.files.length) addFiles(event.dataTransfer.files);
  };

  const removePhoto = (id: string) => {
    const match = photos.find((photo) => photo.id === id);
    if (match) URL.revokeObjectURL(match.url);
    onChange(photos.filter((photo) => photo.id !== id));
  };

  const progress = photos.length / MAX_PHOTOS;
  const minMark = MIN_PHOTOS / MAX_PHOTOS;

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-10 lg:grid-cols-[16.5rem_minmax(0,1fr)]">
      <aside className="lg:pt-1">
        <button
          type="button"
          onClick={onBack}
          className="mb-6 inline-flex h-9 items-center gap-1.5 rounded-full border border-black/10 bg-white px-3.5 text-sm font-semibold text-[#141414]"
        >
          ← {shared.back}
        </button>
        <h1 className="text-[1.75rem] font-semibold tracking-tight text-[#141414]">
          {copy.title}
        </h1>
        <ul className="mt-5 space-y-2.5 text-sm text-muted-foreground">
          {copy.tips.map((tip, index) => {
            const icons = [IconPhoto, IconCamera, IconSun, IconLock];
            const Icon = icons[index] ?? IconPhoto;
            return (
              <li key={tip} className="flex items-start gap-2.5">
                <Icon className="mt-0.5 size-4 shrink-0" stroke={1.8} />
                {tip}
              </li>
            );
          })}
        </ul>

        <p className="mt-8 flex items-center gap-2 text-sm font-semibold text-[#141414]">
          <IconUpload className="size-4" stroke={1.8} />
          {copy.computerTitle}
        </p>
        <label
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={cn(
            "mt-3 flex cursor-pointer flex-col items-center rounded-2xl border border-dashed px-4 py-6 text-center",
            dragging
              ? "border-[var(--primary)] bg-[var(--primary)]/5"
              : "border-black/15",
          )}
        >
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPT}
            multiple
            className="sr-only"
            onChange={(event) => {
              if (event.target.files) addFiles(event.target.files);
              event.target.value = "";
            }}
          />
          <span
            className={`${PRIMARY_TINT_BUTTON_CLASS} inline-flex h-10 items-center gap-1.5 rounded-lg px-4 text-sm font-semibold`}
          >
            <IconUpload className="size-4" stroke={2} />
            {copy.uploadFiles}
          </span>
          <span className="mt-3 text-xs leading-5 text-muted-foreground">
            {copy.dropHint}
          </span>
          <span className="mt-1 text-[11px] text-muted-foreground">
            {copy.formats}
          </span>
        </label>

        <p className="mt-6 flex items-center gap-2 text-sm font-semibold text-[#141414]">
          <IconDeviceMobile className="size-4" stroke={1.8} />
          {copy.mobileTitle}
        </p>
        <button
          type="button"
          onClick={() => setQrOpen(true)}
          className="mt-3 flex w-full flex-col items-center rounded-2xl border border-dashed border-black/15 px-4 py-5 text-center"
        >
          <p className="text-sm font-semibold text-[#141414]">{copy.qrTitle}</p>
          {qrSvg ? (
            <span
              className="mt-3 block size-24 text-[#141414] [&_svg]:size-full"
              dangerouslySetInnerHTML={{ __html: qrSvg }}
            />
          ) : (
            <QrMark className="mt-3 size-24 text-[#141414]" />
          )}
          <span className="mt-3 text-xs font-medium text-muted-foreground underline underline-offset-2">
            {copy.howToPhone}
          </span>
        </button>
      </aside>

      <div className="min-w-0">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <p className="text-sm font-semibold text-[#141414]">
            {formatCount(copy.count, { count: photos.length, max: MAX_PHOTOS })}
          </p>
          <p className="text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
            {formatCount(copy.minimum, { min: MIN_PHOTOS })}
          </p>
        </div>
        <div className="relative mt-2 h-1.5 rounded-full bg-black/[0.08]">
          <div
            className="absolute top-0 left-0 h-full rounded-full bg-[var(--primary)]"
            style={{ width: `${progress * 100}%` }}
          />
          <span
            className="absolute top-1/2 h-3 w-px -translate-y-1/2 bg-black/30"
            style={{ left: `${minMark * 100}%` }}
          />
          <span
            className="absolute top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-black/20 bg-white"
            style={{ left: `${progress * 100}%` }}
          />
        </div>

        {photos.length > 0 ? (
          <div className="mt-6 grid grid-cols-3 gap-3 sm:grid-cols-5">
            {photos.map((photo) => (
              <span key={photo.id} className="relative overflow-hidden rounded-xl">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.url}
                  alt=""
                  className="aspect-square w-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => removePhoto(photo.id)}
                  className="absolute top-1.5 right-1.5 grid size-6 place-items-center rounded-full bg-black/60 text-white"
                  aria-label="Remove photo"
                >
                  <IconX className="size-3.5" stroke={2.2} />
                </button>
              </span>
            ))}
          </div>
        ) : (
          <p className="mt-5 text-sm text-muted-foreground">{copy.hoverHint}</p>
        )}

        <section className="mt-5 rounded-2xl bg-[#eef8f0] p-4 sm:p-5">
          <button
            type="button"
            onClick={() => setRequirementsOpen((open) => !open)}
            className="flex w-full items-center justify-between text-left"
          >
            <span className="flex items-center gap-2 text-sm font-semibold text-[#141414]">
              <span className="grid size-5 place-items-center rounded-full bg-[#22c55e] text-white">
                <IconCheck className="size-3" stroke={2.6} />
              </span>
              {copy.requirementsTitle}
            </span>
            <IconChevronDown
              className={cn(
                "size-5 text-muted-foreground transition-transform",
                !requirementsOpen && "-rotate-90",
              )}
              stroke={1.8}
            />
          </button>
          {requirementsOpen ? (
            <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {copy.requirementGroups.map((group) => (
                <div key={group.caption}>
                  <div className="grid grid-cols-2 gap-2">
                    {group.photos.map((photo) => (
                      <ExamplePhoto
                        key={photo.label}
                        src={photo.src}
                        label={photo.label}
                      />
                    ))}
                  </div>
                  <p className="mt-2 text-xs font-medium text-[#141414]">
                    {group.caption}
                  </p>
                </div>
              ))}
            </div>
          ) : null}
        </section>

        <section className="mt-4 rounded-2xl bg-[#fdecec] p-4 sm:p-5">
          <button
            type="button"
            onClick={() => setRestrictionsOpen((open) => !open)}
            className="flex w-full items-center justify-between text-left"
          >
            <span className="flex items-center gap-2 text-sm font-semibold text-[#141414]">
              <span className="grid size-5 place-items-center rounded-full bg-[#ef4444] text-white">
                <IconX className="size-3" stroke={2.6} />
              </span>
              {copy.restrictionsTitle}
            </span>
            <IconChevronDown
              className={cn(
                "size-5 text-muted-foreground transition-transform",
                !restrictionsOpen && "-rotate-90",
              )}
              stroke={1.8}
            />
          </button>
          {restrictionsOpen ? (
            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {copy.restrictionPhotos.map((photo) => (
                <ExamplePhoto
                  key={photo.label}
                  src={photo.src}
                  label={photo.label}
                />
              ))}
            </div>
          ) : null}
        </section>
      </div>

      {qrOpen ? createPortal(
        <div
          className="theme-light fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 text-black [color-scheme:light]"
          onClick={() => setQrOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="qr-modal-title"
            className="relative max-h-[calc(100dvh-2rem)] w-full max-w-[34rem] overflow-y-auto rounded-[24px] bg-white p-6 shadow-[0_24px_80px_rgba(0,0,0,0.28)] sm:p-8"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setQrOpen(false)}
              aria-label={copy.closeModal}
              className="absolute top-4 right-4 grid size-9 place-items-center rounded-full text-[#141414] hover:bg-black/[0.04]"
            >
              <IconX className="size-5" stroke={1.8} />
            </button>
            <h2
              id="qr-modal-title"
              className="pr-10 text-[1.65rem] font-semibold tracking-tight text-[#141414]"
            >
              {copy.qrModalTitle}
            </h2>
            <p className="mt-2 max-w-md text-[15px] leading-6 text-muted-foreground">
              {copy.qrModalBody}
            </p>
            <div className="mt-6 flex flex-col gap-6 sm:flex-row sm:items-start">
              {qrSvg ? (
                <span
                  className="block size-32 shrink-0 text-[#141414] sm:size-36 [&_svg]:size-full"
                  dangerouslySetInnerHTML={{ __html: qrSvg }}
                />
              ) : (
                <QrMark className="size-32 shrink-0 text-[#141414] sm:size-36" />
              )}
              <ol className="space-y-2 text-[15px] leading-6 text-[#141414]">
                {copy.qrSteps.map((step, index) => (
                  <li key={step}>
                    {index + 1}. {step}
                  </li>
                ))}
              </ol>
            </div>
            <p className="mt-6 text-sm font-medium text-[#141414]">
              {copy.mobileUrlLabel}
            </p>
            <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
              <p className="min-w-0 flex-1 truncate rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm text-[#141414]">
                {mobileUrl}
              </p>
              <button
                type="button"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(mobileUrl);
                    setCopied(true);
                    window.setTimeout(() => setCopied(false), 1600);
                  } catch {
                    setCopied(false);
                  }
                }}
                className={`${PRIMARY_TINT_BUTTON_CLASS} inline-flex h-11 shrink-0 items-center justify-center gap-1.5 rounded-full px-4 text-sm font-semibold`}
              >
                {copied ? copy.copied : copy.copy}
                <IconCopy className="size-4" stroke={1.8} />
              </button>
            </div>
          </div>
        </div>,
        document.body,
      ) : null}
    </div>
  );
};

export const UPLOAD_MIN = MIN_PHOTOS;
export const UPLOAD_MAX = MAX_PHOTOS;
export type { UploadedPhoto };
