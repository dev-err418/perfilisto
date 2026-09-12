"use client";
import NextLink from "next/link";
import { useRouter as useNextRouter, usePathname as useNextPathname } from "next/navigation";
import { useMemo, type ComponentProps } from "react";
import { useLocale } from "./client";
import { localizedPath, stripLocale } from "./routing.mjs";
export default function Link({ href, ...props }: ComponentProps<typeof NextLink>) {
  const locale = useLocale();
  return <NextLink {...props} href={typeof href === "string" ? localizedPath(href, locale) : { ...href, pathname: localizedPath(href.pathname || "/", locale) }} />;
}
export function usePathname() { return stripLocale(useNextPathname()); }
export function useRouter() {
  const router = useNextRouter(); const locale = useLocale();
  return useMemo(() => ({ ...router, push: (url: string, options?: Parameters<typeof router.push>[1]) => router.push(localizedPath(url, locale), options), replace: (url: string, options?: Parameters<typeof router.replace>[1]) => router.replace(localizedPath(url, locale), options), prefetch: (url: string) => router.prefetch(localizedPath(url, locale)) }), [router, locale]);
}
