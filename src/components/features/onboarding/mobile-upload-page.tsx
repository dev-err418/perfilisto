"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  IconBulb,
  IconChevronDown,
  IconPhoto,
  IconTrash,
  IconUpload,
} from "@tabler/icons-react";

import { getMessages } from "@/i18n";
import {
  fileToJpegDataUrl,
  putRemoteSessionPhotos,
} from "@/lib/upload-session-client";
import { cn } from "@/lib/utils";

import { BrandWord } from "../landing/brand-name";
import { PRIMARY_TINT_BUTTON_CLASS } from "../landing/button-styles";
import { LogoMark } from "../landing/logo-mark";

const messages = getMessages();
const ACCEPT = "image/jpeg,image/png,image/webp,image/heic,image/heif,.jpg,.jpeg,.png,.webp,.heic,.heif";
const MAX_PHOTOS = 10;

type LocalPhoto = {
  id: string;
  name: string;
  previewUrl: string;
  dataUrl?: string;
};

const formatCount = (template: string, count: number) =>
  template.replace("{count}", String(count));

export const MobileUploadPage = () => {
  const copy = messages.onboarding.upload;
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("s");
  const inputRef = useRef<HTMLInputElement>(null);
  const [photos, setPhotos] = useState<LocalPhoto[]>([]);
  const [encoding, setEncoding] = useState(false);
  const [listOpen, setListOpen] = useState(true);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const readyCount = useMemo(
    () => photos.filter((photo) => photo.dataUrl).length,
    [photos],
  );

  const addFiles = async (fileList: FileList) => {
    const incoming = Array.from(fileList).slice(0, MAX_PHOTOS - photos.length);
    if (!incoming.length) return;
    const placeholders: LocalPhoto[] = incoming.map((file) => ({
      id: crypto.randomUUID(),
      name: file.name,
      previewUrl: URL.createObjectURL(file),
    }));
    setPhotos((current) => [...current, ...placeholders]);
    setEncoding(true);
    setSent(false);
    setError(null);
    try {
      const encoded = await Promise.all(
        incoming.map(async (file, index) => ({
          id: placeholders[index]?.id ?? crypto.randomUUID(),
          dataUrl: await fileToJpegDataUrl(file),
        })),
      );
      setPhotos((current) =>
        current.map((photo) => {
          const match = encoded.find((item) => item.id === photo.id);
          return match ? { ...photo, dataUrl: match.dataUrl } : photo;
        }),
      );
    } catch {
      setError("Could not read one of the photos.");
    } finally {
      setEncoding(false);
    }
  };

  const sendToComputer = async () => {
    if (!sessionId) return;
    const payload = photos
      .filter((photo) => photo.dataUrl)
      .map((photo) => ({
        id: photo.id,
        name: photo.name,
        dataUrl: photo.dataUrl ?? "",
      }));
    if (!payload.length) return;
    setSending(true);
    setError(null);
    try {
      await putRemoteSessionPhotos(sessionId, payload);
      setSent(true);
    } catch {
      setError("Could not send photos. Keep the desktop page open and try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <main className="theme-light min-h-dvh bg-white px-5 pb-10 text-black [color-scheme:light]">
      <header className="flex h-16 items-center gap-2.5 border-b border-black/[0.06]">
        <Link href="/" className="flex items-center gap-2.5">
          <LogoMark className="size-8 rounded-[8px]" />
          <BrandWord className="text-[17px] font-semibold tracking-tight text-[#141414]" />
        </Link>
      </header>

      <h1 className="mt-6 text-[2rem] leading-tight font-semibold tracking-tight text-[#141414]">
        {copy.mobilePageTitle}
      </h1>
      <p className="mt-2 text-[17px] leading-7 text-muted-foreground">
        {copy.mobilePageSubtitle}
      </p>

      <p className="mt-6 flex items-start gap-3 rounded-2xl bg-[#fff4ea] px-4 py-3 text-[15px] leading-6 text-[#141414]">
        <IconBulb
          className="mt-0.5 size-5 shrink-0 text-[var(--primary)]"
          stroke={1.8}
        />
        {copy.keepDesktopOpen}
      </p>

      {!sessionId ? (
        <p className="mt-6 text-sm text-muted-foreground">{copy.sessionMissing}</p>
      ) : (
        <>
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPT}
            multiple
            className="sr-only"
            onChange={(event) => {
              if (event.target.files) void addFiles(event.target.files);
              event.target.value = "";
            }}
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="mt-5 flex h-14 w-full items-center justify-center gap-2 rounded-full border border-black/10 bg-white text-[17px] font-semibold text-[#141414] shadow-sm"
          >
            <IconUpload className="size-5 text-[var(--primary)]" stroke={1.8} />
            {copy.mobileUploadCta}
          </button>

          {photos.length > 0 ? (
            <section className="mt-5 rounded-2xl border border-black/10 bg-white p-4">
              <button
                type="button"
                onClick={() => setListOpen((open) => !open)}
                className="flex w-full items-center justify-between text-left"
              >
                <span className="flex items-center gap-2 text-[17px] font-semibold text-[#141414]">
                  {encoding ? (
                    <>
                      {formatCount(
                        photos.length === 1
                          ? copy.uploadingTitle
                          : copy.uploadingTitlePlural,
                        photos.length,
                      )}
                    </>
                  ) : (
                    <>
                      <IconUpload className="size-5 text-[var(--primary)]" stroke={1.8} />
                      {formatCount(
                        readyCount === 1 ? copy.readyTitle : copy.readyTitlePlural,
                        readyCount,
                      )}
                    </>
                  )}
                </span>
                <IconChevronDown
                  className={cn(
                    "size-5 text-muted-foreground",
                    !listOpen && "-rotate-90",
                  )}
                  stroke={1.8}
                />
              </button>
              <p className="mt-2 text-[15px] text-muted-foreground">
                {encoding ? copy.uploadingHint : copy.readyHint}
              </p>
              {listOpen ? (
                <div className="mt-4 space-y-3">
                  {photos.map((photo) => (
                    <div
                      key={photo.id}
                      className="flex items-center gap-3 rounded-2xl border border-black/10 p-3"
                    >
                      {photo.dataUrl || photo.previewUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={photo.dataUrl ?? photo.previewUrl}
                          alt=""
                          className="size-16 rounded-xl object-cover"
                        />
                      ) : (
                        <span className="grid size-16 place-items-center rounded-xl border border-black/10">
                          <IconPhoto className="size-6 text-muted-foreground" />
                        </span>
                      )}
                      <p className="min-w-0 flex-1 truncate text-[15px] font-medium text-[#141414]">
                        {photo.name}
                      </p>
                      {encoding && !photo.dataUrl ? (
                        <span className="size-5 animate-spin rounded-full border-2 border-[var(--primary)] border-t-transparent" />
                      ) : (
                        <button
                          type="button"
                          aria-label={copy.removePhoto}
                          onClick={() =>
                            setPhotos((current) =>
                              current.filter((item) => item.id !== photo.id),
                            )
                          }
                          className="grid size-9 place-items-center rounded-full bg-black/[0.04] text-[#141414]"
                        >
                          <IconTrash className="size-4" stroke={1.8} />
                        </button>
                      )}
                    </div>
                  ))}
                  {!encoding && readyCount > 0 ? (
                    <button
                      type="button"
                      disabled={sending}
                      onClick={() => void sendToComputer()}
                      className={`${PRIMARY_TINT_BUTTON_CLASS} mt-1 inline-flex h-12 w-full items-center justify-center rounded-full px-4 text-base font-semibold disabled:opacity-50`}
                    >
                      {sending ? copy.sending : sent ? copy.sent : copy.sendToComputer}
                    </button>
                  ) : null}
                </div>
              ) : null}
            </section>
          ) : null}
          {error ? (
            <p className="mt-4 text-sm text-[#b42318]">{error}</p>
          ) : null}
        </>
      )}
    </main>
  );
};
