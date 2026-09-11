"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
  IconLoader2,
  IconPhoto,
  IconShieldLock,
  IconSun,
  IconUpload,
  IconX,
} from "@tabler/icons-react";

import { getMessages } from "@/i18n";
import {
  createRemoteSession,
  getRemoteSessionSnapshot,
  deleteRemoteSessionPhoto,
} from "@/lib/upload-session-client";
import { cn } from "@/lib/utils";
import { selectUploadFiles } from "@/lib/photo-upload.mjs";
import { preparePhoto } from "@/lib/prepare-photo";

import { PRIMARY_TINT_BUTTON_CLASS } from "../landing/button-styles";

const messages = getMessages();

const MIN_PHOTOS = 6;
const MAX_PHOTOS = 10;
const ACCEPT = "image/jpeg,image/png,image/webp,image/heic,image/heif,.jpg,.jpeg,.png,.webp,.heic,.heif";

type UploadedPhoto = {
  id: string;
  name: string;
  url: string;
  preparing?: boolean;
};

const formatCount = (template: string, values: Record<string, number | string>) =>
  Object.entries(values).reduce(
    (text, [key, value]) => text.replace(`{${key}}`, String(value)),
    template,
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
  const [uploadError, setUploadError] = useState("");
  const [pendingBatches, setPendingBatches] = useState(0);
  const uploadQueue = useRef(Promise.resolve());
  const mounted = useRef(true);
  const [requirementsOpen, setRequirementsOpen] = useState(true);
  const [restrictionsOpen, setRestrictionsOpen] = useState(true);
  const [qrOpen, setQrOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [mobileUrl, setMobileUrl] = useState("");
  const [qrSvg, setQrSvg] = useState("");
  const [sessionError, setSessionError] = useState("");
  const [sessionRetry, setSessionRetry] = useState(0);
  const [syncNotice, setSyncNotice] = useState("");
  const photosRef = useRef(photos);
  const importedIds = useRef(new Set(photos.filter((photo) => photo.url.startsWith("data:")).map((photo) => photo.id)));
  // Uploads and polling update this ref together with onChange; a delayed render
  // must not overwrite newer async results with an older photo list.
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function connect() {
      try {
        let session: { id: string; mobileUrl: string } | null = null;
        try {
          const saved = JSON.parse(sessionStorage.getItem("perfilisto-upload-session") || "null");
          if (saved?.id && saved?.mobileUrl && await getRemoteSessionSnapshot(saved.id, [...importedIds.current])) session = saved;
        } catch { /* Recreate expired or unavailable sessions. */ }
        session ??= await createRemoteSession();
        if (cancelled) return;
        const svg = await QRCode.toString(session.mobileUrl, {
          type: "svg", margin: 1, color: { dark: "#141414", light: "#00000000" },
        });
        if (cancelled) return;
        try { sessionStorage.setItem("perfilisto-upload-session", JSON.stringify(session)); } catch { /* Storage may be disabled. */ }
        setSessionId(session.id);
        setMobileUrl(session.mobileUrl);
        setQrSvg(svg);
        setSessionError("");
      } catch {
        if (!cancelled) setSessionError("Could not connect to phone uploads. Try again.");
      }
    }
    void connect();
    return () => { cancelled = true; };
  }, [sessionRetry]);

  useEffect(() => {
    if (!sessionId) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    async function poll() {
      try {
        const remote = await getRemoteSessionSnapshot(sessionId!, [...importedIds.current]);
        if (cancelled) return;
        if (!remote) {
          setSessionId(null);
          setMobileUrl("");
          setQrSvg("");
          setSessionError("Your phone upload link expired. Create a new QR code to continue.");
          try { sessionStorage.removeItem("perfilisto-upload-session"); } catch { /* Storage may be disabled. */ }
          return;
        }
        const remoteIds = new Set(remote.ids);
        const current = photosRef.current.filter((photo) => !importedIds.current.has(photo.id) || remoteIds.has(photo.id));
        const fresh = remote.photos.filter((photo) => !importedIds.current.has(photo.id));
        const accepted = fresh.slice(0, Math.max(0, MAX_PHOTOS - current.length));
        for (const photo of accepted) importedIds.current.add(photo.id);
        if (accepted.length || current.length !== photosRef.current.length) {
          const next = [...current, ...accepted.map((photo) => ({ id: photo.id, name: photo.name, url: photo.dataUrl }))];
          photosRef.current = next;
          onChange(next);
        }
        setSyncNotice(fresh.length > accepted.length ? "More photos are waiting on your phone. Remove a photo here to make room (10 maximum)." : "");
      } catch {
        if (!cancelled) setSyncNotice("Phone connection interrupted. Retrying automatically…");
      } finally {
        if (!cancelled) timer = setTimeout(poll, 1500);
      }
    }
    void poll();
    return () => { cancelled = true; clearTimeout(timer); };
  }, [onChange, sessionId]);

  useEffect(() => {
    if (!qrOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setQrOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [qrOpen]);

  const addFiles = useCallback((fileList: FileList | File[]) => {
    const files = Array.from(fileList);
    if (!files.length) return;
    const { accepted, rejected } = selectUploadFiles(files, MAX_PHOTOS - photosRef.current.length);
    const entries = (accepted as File[]).map((file) => ({ file, id: crypto.randomUUID() }));
    const placeholders = entries.map(({ file, id }) => ({ id, name: file.name, url: "", preparing: true }));
    photosRef.current = [...photosRef.current, ...placeholders];
    onChange(photosRef.current);
    setUploadError(rejected.join(" "));
    if (!entries.length) return;
    setPendingBatches((count) => count + 1);
    // Reserve slots immediately, then replace each placeholder in selection order.
    uploadQueue.current = uploadQueue.current.then(async () => {
      for (const { file, id } of entries) {
        if (!mounted.current) return;
        if (!photosRef.current.some((photo) => photo.id === id)) continue;
        try {
          const blob = await preparePhoto(file);
          if (!mounted.current) return;
          if (!photosRef.current.some((photo) => photo.id === id)) continue;
          const ready = { id, name: file.name, url: URL.createObjectURL(blob) };
          const next = photosRef.current.map((photo) => photo.id === id ? ready : photo);
          photosRef.current = next;
          onChange(next);
        } catch {
          if (!mounted.current) return;
          if (!photosRef.current.some((photo) => photo.id === id)) continue;
          photosRef.current = photosRef.current.filter((photo) => photo.id !== id);
          onChange(photosRef.current);
          rejected.push(`${file.name}: could not read this photo. Try exporting it as JPG or PNG.`);
        }
      }
      if (mounted.current) setUploadError(rejected.join(" "));
    }).finally(() => {
      if (mounted.current) setPendingBatches((count) => count - 1);
    });
  }, [onChange]);

  useEffect(() => {
    let dragDepth = 0;
    const containsFiles = (event: DragEvent) =>
      Array.from(event.dataTransfer?.types ?? []).includes("Files");
    const reset = () => {
      dragDepth = 0;
      setDragging(false);
    };
    const onEnter = (event: DragEvent) => {
      if (!containsFiles(event)) return;
      event.preventDefault();
      dragDepth += 1;
      setDragging(true);
    };
    const onOver = (event: DragEvent) => {
      if (!containsFiles(event)) return;
      event.preventDefault();
      if (event.dataTransfer) {
        event.dataTransfer.dropEffect = photosRef.current.length < MAX_PHOTOS ? "copy" : "none";
      }
    };
    const onLeave = (event: DragEvent) => {
      if (!containsFiles(event) && dragDepth === 0) return;
      dragDepth = Math.max(0, dragDepth - 1);
      if (dragDepth === 0) reset();
    };
    const onDrop = (event: DragEvent) => {
      if (!containsFiles(event)) return;
      event.preventDefault();
      reset();
      const files = Array.from(event.dataTransfer?.files ?? []);
      if (files.length) addFiles(files);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") reset();
    };
    window.addEventListener("dragenter", onEnter);
    window.addEventListener("dragover", onOver);
    window.addEventListener("dragleave", onLeave);
    window.addEventListener("drop", onDrop);
    window.addEventListener("dragend", reset);
    window.addEventListener("blur", reset);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("dragenter", onEnter);
      window.removeEventListener("dragover", onOver);
      window.removeEventListener("dragleave", onLeave);
      window.removeEventListener("drop", onDrop);
      window.removeEventListener("dragend", reset);
      window.removeEventListener("blur", reset);
      window.removeEventListener("keydown", onKey);
    };
  }, [addFiles]);

  const removePhoto = (id: string) => {
    const match = photosRef.current.find((photo) => photo.id === id);
    if (match?.url) URL.revokeObjectURL(match.url);
    if (sessionId && importedIds.current.has(id)) {
      void deleteRemoteSessionPhoto(sessionId, id).catch(() => {
        setSyncNotice("Photo removed here, but could not update your phone. Remove it there too before adding more.");
      });
    }
    const next = photosRef.current.filter((photo) => photo.id !== id);
    photosRef.current = next;
    onChange(next);
  };

  const readyCount = photos.filter((photo) => !photo.preparing).length;
  const progress = readyCount / MAX_PHOTOS;
  const minMark = MIN_PHOTOS / MAX_PHOTOS;

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-10 lg:grid-cols-[16.5rem_minmax(0,1fr)]">
      <aside className="lg:pt-1">
        <button
          type="button"
          disabled={photos.some((photo) => photo.preparing)}
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
        <div
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
              const files = Array.from(event.target.files ?? []);
              event.target.value = "";
              addFiles(files);
            }}
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className={`${PRIMARY_TINT_BUTTON_CLASS} inline-flex h-10 items-center gap-1.5 rounded-lg px-4 text-sm font-semibold`}
          >
            <IconUpload className="size-4" stroke={2} />
            {copy.uploadFiles}
          </button>
          <span className="mt-3 text-xs leading-5 text-muted-foreground">
            {copy.dropHint}
          </span>
          <span className="mt-1 text-[11px] text-muted-foreground">
            {copy.formats}
          </span>
        </div>
        {pendingBatches > 0 ? <p role="status" className="mt-3 text-sm text-primary">{copy.preparingPhotos}</p> : null}
        {uploadError ? <p role="alert" className="mt-3 text-xs leading-5 text-red-700">{uploadError}</p> : null}

        <p className="mt-6 flex items-center gap-2 text-sm font-semibold text-[#141414]">
          <IconDeviceMobile className="size-4" stroke={1.8} />
          {copy.mobileTitle}
        </p>
        <button
          type="button"
          disabled={!qrSvg}
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
            <span role="status" className="mt-3 text-sm text-muted-foreground">{sessionError || "Connecting…"}</span>
          )}
          <span className="mt-3 text-xs font-medium text-muted-foreground underline underline-offset-2">
            {copy.howToPhone}
          </span>
        </button>
        {sessionError ? (
          <button type="button" onClick={() => { setSessionError(""); setSessionRetry((value) => value + 1); }} className="mt-3 rounded-full border border-black/10 px-4 py-2 text-sm font-semibold text-primary">
            Create a new QR code
          </button>
        ) : null}
        {syncNotice ? <p role="status" className="mt-3 text-xs text-primary">{syncNotice}</p> : null}
      </aside>

      <div className="min-w-0">
        <div className="relative pb-6 sm:pb-0">
          <p className="text-sm font-semibold text-[#141414]">
            {formatCount(copy.count, { count: readyCount, max: MAX_PHOTOS })}
          </p>
          <div
            className="absolute bottom-0 -translate-x-1/2 whitespace-nowrap text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase"
            style={{ left: `${minMark * 100}%` }}
            role="status"
          >
            {readyCount >= MIN_PHOTOS ? (
              <span className="grid size-5 place-items-center rounded-full bg-[#16a34a] text-white">
                <IconCheck aria-hidden="true" className="size-3.5" stroke={3} />
                <span className="sr-only">{copy.minimumReached}</span>
              </span>
            ) : formatCount(copy.minimum, { min: MIN_PHOTOS })}
          </div>
        </div>
        <div className="relative mt-2 h-1.5 rounded-full bg-black/[0.08]">
          <div
            className="absolute top-0 left-0 h-full rounded-full bg-[#16a34a]"
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
          <div className="mt-6 rounded-2xl border border-black/[0.08] bg-white p-4 shadow-sm sm:p-5">
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
              {photos.map((photo) => (
                <span key={photo.id} className="relative overflow-hidden rounded-xl">
                  {photo.preparing ? (
                    <span
                      role="status"
                      aria-label={`${copy.preparingPhotos} ${photo.name}`}
                      className="flex aspect-square w-full flex-col items-center justify-center gap-3 border border-orange-100 bg-[#fff4ea] px-3 text-primary"
                    >
                      <IconLoader2 className="size-7 animate-spin motion-reduce:animate-none" stroke={1.8} aria-hidden="true" />
                      <span className="w-full truncate text-center text-xs">{photo.name}</span>
                    </span>
                  ) : (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={photo.url}
                        alt=""
                        className="aspect-square w-full object-cover"
                      />
                    </>
                  )}
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
            <p className="mt-4 flex items-start gap-3 rounded-2xl bg-[#fff4ea] px-4 py-3 text-[15px] leading-6 text-[#141414]">
              <IconShieldLock
                className="mt-0.5 size-5 shrink-0 text-[var(--primary)]"
                stroke={1.8}
              />
              {copy.privacyNotice}
            </p>
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

      {dragging ? createPortal(
        <div className="theme-light pointer-events-none fixed inset-0 z-[100] flex items-center justify-center bg-white/90 p-5 text-primary backdrop-blur-sm" role="status" aria-live="polite">
          <div className="absolute inset-4 rounded-[28px] border-2 border-dashed border-primary" />
          <div className="relative flex max-w-md flex-col items-center text-center">
            <span className="mb-5 grid size-20 place-items-center rounded-full bg-primary/10">
              <IconUpload className="size-10" stroke={1.8} aria-hidden="true" />
            </span>
            <p className="text-3xl font-semibold tracking-tight">
              {photos.length < MAX_PHOTOS ? copy.dropAnywhere : copy.uploadLimitReached}
            </p>
            <p className="mt-3 text-base leading-6">
              {photos.length < MAX_PHOTOS ? copy.dropAnywhereHint : copy.removeBeforeUpload}
            </p>
          </div>
        </div>,
        document.body,
      ) : null}

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
                <span role="status" className="text-sm text-muted-foreground">{sessionError || "Connecting…"}</span>
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
