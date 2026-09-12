"use client";

import { useT } from "@/i18n/client";

import { Spinner } from "@/components/ui/spinner";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "@/i18n/navigation";
import { useSearchParams } from "next/navigation";
import {
  IconBulb,
  IconChevronDown,
  IconTrash,
  IconUpload,
} from "@tabler/icons-react";

import { useMessages } from "@/i18n/client";
import {
  fileToJpegDataUrl,
  deleteRemoteSessionPhoto,
  UploadSessionError,
  getRemoteSessionPhotos,
  putRemoteSessionPhotos,
} from "@/lib/upload-session-client";
import { selectUploadFiles } from "@/lib/photo-upload.mjs";
import { cn } from "@/lib/utils";

import { BrandWord } from "../landing/brand-name";
import { PRIMARY_TINT_BUTTON_CLASS } from "../landing/button-styles";
import { LogoMark } from "../landing/logo-mark";

const ACCEPT = "image/jpeg,image/png,image/webp,image/heic,image/heif,.jpg,.jpeg,.png,.webp,.heic,.heif";
const MAX_PHOTOS = 10;

type LocalPhoto = {
  id: string;
  name: string;
  dataUrl?: string;
};

const formatCount = (template: string, count: number) =>
  template.replace("{count}", String(count));

export const MobileUploadPage = () => {
  const t = useT();
  const messages = useMessages();
  const copy = messages.onboarding.upload;
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("s");
  const inputRef = useRef<HTMLInputElement>(null);
  const [sentIds, setSentIds] = useState(new Set<string>());
  const [photos, setPhotos] = useState<LocalPhoto[]>([]);
  const [encoding, setEncoding] = useState(false);
  const [listOpen, setListOpen] = useState(true);
  const [sending, setSending] = useState(false);
  const sent = photos.length > 0 && photos.every((photo) => sentIds.has(photo.id));
  const [error, setError] = useState<string | null>(null);
  const [sessionState, setSessionState] = useState<"checking" | "ready" | "expired" | "error">("checking");

  useEffect(() => {
    if (!sessionId) return;
    let cancelled = false;
    void getRemoteSessionPhotos(sessionId).then((remote) => {
      if (cancelled) return;
      setSessionState(remote === null ? "expired" : "ready");
      if (remote) {
        setSentIds(new Set(remote.map((photo) => photo.id)));
        setPhotos(remote);
      }
    }).catch(() => {
      if (!cancelled) setSessionState("error");
    });
    return () => { cancelled = true; };
  }, [sessionId]);

  const readyCount = useMemo(
    () => photos.filter((photo) => photo.dataUrl).length,
    [photos],
  );

  const addFiles = async (fileList: FileList) => {
    const { accepted: incoming, rejected } = selectUploadFiles(fileList, MAX_PHOTOS - photos.length);
    if (!incoming.length) {
      setError(rejected.map(message => t(message)).join(" ") || null);
      return;
    }
    const placeholders: LocalPhoto[] = incoming.map((file: File) => ({
      id: crypto.randomUUID(),
      name: file.name,
    }));
    setPhotos((current) => [...current, ...placeholders]);
    setEncoding(true);
    setError(rejected.map(message => t(message)).join(" ") || null);
    const errors = rejected.map(message => t(message));
    try {
      for (const [index, file] of incoming.entries()) {
        const id = placeholders[index].id;
        try {
          const dataUrl = await fileToJpegDataUrl(file);
          setPhotos((current) => current.map((photo) =>
            photo.id === id ? { ...photo, dataUrl } : photo,
          ));
        } catch {
          setPhotos((current) => current.filter((photo) => photo.id !== id));
          errors.push(t("{v0}: could not read this photo. Try another image.", { v0: file.name }));
          setError(errors.join(" "));
        }
      }
    } finally {
      setEncoding(false);
    }
  };

  const sendToComputer = async () => {
    if (!sessionId) return;
    const payload = photos
      .filter((photo) => photo.dataUrl && !sentIds.has(photo.id))
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
      setSentIds((current) => new Set([...current, ...payload.map((photo) => photo.id)]));
    } catch (error) {
      if (error instanceof UploadSessionError && error.status === 404) setSessionState("expired");
      else setError(error instanceof UploadSessionError ? error.message : t("Could not send photos. Keep the desktop page open and try again."));
    } finally {
      setSending(false);
    }
  };

  const removePhoto = async (id: string) => {
    setSending(true);
    setError(null);
    try {
      if (sessionId && sentIds.has(id)) await deleteRemoteSessionPhoto(sessionId, id);
      setSentIds((current) => { const next = new Set(current); next.delete(id); return next; });
      setPhotos((current) => current.filter((photo) => photo.id !== id));
    } catch (error) {
      if (error instanceof UploadSessionError && error.status === 404) setSessionState("expired");
      else setError(t("Could not remove this photo. Please try again."));
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

      {!sessionId || sessionState === "expired" ? (
        <p className="mt-6 text-sm text-muted-foreground">{copy.sessionMissing}</p>
      ) : sessionState !== "ready" ? (
        <p role="status" className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
          {sessionState === "checking" && <Spinner aria-hidden="true" />}
          {sessionState === "checking" ? t("Connecting to your computer…") : t("Could not connect. Refresh this page to try again.")}
        </p>
      ) : (
        <>
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPT}
            multiple
            disabled={encoding || sending}
            className="sr-only"
            onChange={(event) => {
              if (event.target.files) void addFiles(event.target.files);
              event.target.value = "";
            }}
          />
          <button
            type="button"
            disabled={encoding || sending}
            onClick={() => inputRef.current?.click()}
            className="mt-5 flex h-14 w-full items-center justify-center gap-2 rounded-full border border-black/10 bg-white text-[17px] font-semibold text-[#141414] shadow-sm disabled:opacity-50"
          >
            {encoding || sending ? <Spinner className="size-5 text-primary" aria-hidden="true" /> : <IconUpload className="size-5 text-[var(--primary)]" stroke={1.8} />}
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
                      <Spinner className="size-5 text-primary" aria-hidden="true" />
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
                      {photo.dataUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={photo.dataUrl}
                          alt=""
                          className="size-16 rounded-xl object-cover"
                        />
                      ) : (
                        <span role="status" aria-label={`Preparing ${photo.name}`} className="grid size-16 place-items-center rounded-xl bg-[#fff4ea] text-[var(--primary)]">
                          <Spinner className="size-6" />
                        </span>
                      )}
                      <p className="min-w-0 flex-1 truncate text-[15px] font-medium text-[#141414]">
                        {photo.name}
                      </p>
                      {encoding && !photo.dataUrl ? (
                        <Spinner className="size-5 text-primary" aria-hidden="true" />
                      ) : (
                        <button
                          type="button"
                          aria-label={copy.removePhoto}
                          disabled={sending}
                          onClick={() => void removePhoto(photo.id)}
                          className="grid size-9 place-items-center rounded-full bg-black/[0.04] text-[#141414]"
                        >
                          <IconTrash className="size-4" stroke={1.8} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              ) : null}
              {!encoding && readyCount > 0 ? (
                <button
                  type="button"
                  disabled={sending || sent}
                  onClick={() => void sendToComputer()}
                  className={`${PRIMARY_TINT_BUTTON_CLASS} mt-1 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full px-4 text-base font-semibold disabled:opacity-50`}
                >
                  {sending && <Spinner className="size-5" aria-hidden="true" />}
                  {sending ? copy.sending : sent ? copy.sent : copy.sendToComputer}
                </button>
              ) : null}
            </section>
          ) : null}
          {error ? (
            <p role="alert" className="mt-4 text-sm text-[#b42318]">{t(error)}</p>
          ) : null}
        </>
      )}
    </main>
  );
};
