"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import Image from "next/image";
import { ChevronsUpDown, Download, Heart, Images, Plus, LogOut } from "lucide-react";
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { LogoMark } from "../landing/logo-mark";
import { BrandWord } from "../landing/brand-name";
import { ONBOARDING_CONTINUE_BUTTON_CLASS } from "../landing/button-styles";
import type { Order } from "@/lib/orders/types";

type Account = { name?: string; email?: string; image?: string };

type ResultsTab = "results" | "favorites";

function ResultsSidebar({ tab, onTabChange }: { tab: ResultsTab; onTabChange: (tab: ResultsTab) => void }) {
  const [account, setAccount] = useState<Account | null>(null);
  const { isMobile, setOpenMobile } = useSidebar();
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/auth/session", { cache: "no-store", signal: controller.signal })
      .then(response => response.ok ? response.json() : null)
      .then(session => { if (!controller.signal.aborted) setAccount(session?.user || null); })
      .catch(() => {});
    return () => controller.abort();
  }, []);
  const name = account?.name || "My account";
  const initials = account?.name?.split(/\s+/).slice(0, 2).map(part => part[0]).join("") || "P";
  const signOut = () => {
    // Auth.js serves an HTML confirmation endpoint, not a Next.js page.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.assign("/api/auth/signout");
  };
  return (
    <Sidebar variant="inset">
      <SidebarHeader>
        <SidebarMenu><SidebarMenuItem><SidebarMenuButton size="lg" asChild>
          <Link href="/"><LogoMark className="size-8! shrink-0" /><BrandWord className="text-lg font-semibold" /></Link>
        </SidebarMenuButton></SidebarMenuItem></SidebarMenu>
      </SidebarHeader>
      <SidebarContent className="px-2 pt-4">
        <SidebarMenu>
          <SidebarMenuItem><SidebarMenuButton isActive={tab === "results"} onClick={() => { onTabChange("results"); setOpenMobile(false); }}>
            <Images /><span>Results</span>
          </SidebarMenuButton></SidebarMenuItem>
          <SidebarMenuItem><SidebarMenuButton isActive={tab === "favorites"} onClick={() => { onTabChange("favorites"); setOpenMobile(false); }}>
            <Heart /><span>Favorites</span>
          </SidebarMenuButton></SidebarMenuItem>
          <SidebarMenuItem><SidebarMenuButton asChild>
            <Link href="/onboarding?new=1"><Plus /><span>Generate new</span></Link>
          </SidebarMenuButton></SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu><SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton size="lg" className="data-[state=open]:bg-sidebar-accent">
                <Avatar className="size-8 rounded-lg"><AvatarImage src={account?.image} alt="" /><AvatarFallback className="rounded-lg bg-orange-100 text-orange-700">{initials}</AvatarFallback></Avatar>
                <span className="grid flex-1 text-left text-sm leading-tight"><span className="truncate font-semibold">{name}</span><span className="truncate text-xs text-muted-foreground">{account?.email || "Account"}</span></span>
                <ChevronsUpDown className="ml-auto size-4" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent side={isMobile ? "bottom" : "right"} align="end" sideOffset={4} className="theme-light min-w-56 rounded-lg">
              <DropdownMenuLabel><div>{name}</div><div className="text-xs font-normal text-muted-foreground">{account?.email}</div></DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="focus:bg-neutral-100 focus:text-neutral-900" onSelect={signOut}><LogOut />Sign out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem></SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

export function ResultsDashboard({ order }: { order: Order }) {
  const [tab, setTab] = useState<ResultsTab>("results");
  const [favorites, setFavorites] = useState<string[]>(() => {
    if (process.env.NODE_ENV === "development" && order.id === "dashboard-preview") {
      try { return JSON.parse(localStorage.getItem("perfilisto-preview-favorites") || "[]"); } catch { /* Use the album favorites. */ }
    }
    return order.favorites || [];
  });
  const [saving, setSaving] = useState(false);
  const toggleFavorite = async (imageId: string) => {
    if (saving) return;
    const previous = favorites;
    const favorite = !favorites.includes(imageId);
    const next = favorite ? [...favorites, imageId] : favorites.filter(id => id !== imageId);
    setFavorites(next);
    if (process.env.NODE_ENV === "development" && order.id === "dashboard-preview") {
      try { localStorage.setItem("perfilisto-preview-favorites", JSON.stringify(next)); } catch { /* Preview works without storage. */ }
      return;
    }
    setSaving(true);
    try {
      const response = await fetch(`/api/orders/${encodeURIComponent(order.id)}/favorites`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageId, favorite }),
      });
      if (!response.ok) throw new Error("Could not save favorite");
      const saved = await response.json();
      setFavorites(saved.favorites || []);
    } catch {
      setFavorites(previous);
      toast.error("Could not save your favorite. Please try again.");
    } finally { setSaving(false); }
  };
  const photos = tab === "favorites" ? order.results.filter(photo => favorites.includes(photo.id)) : order.results;
  return (
    <SidebarProvider className="theme-light bg-sidebar text-foreground">
      <ResultsSidebar tab={tab} onTabChange={setTab} />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-3 px-4"><SidebarTrigger className="hover:bg-neutral-100 hover:text-neutral-900 dark:hover:bg-neutral-100" /><span className="text-sm font-medium">{tab === "favorites" ? "Favorites" : "Results"}</span></header>
        {tab === "favorites" && !photos.length && <div className="grid flex-1 place-content-center gap-3 px-6 py-10 text-center"><Heart className="mx-auto size-9 text-primary" /><h1 className="text-xl font-semibold">Your favorites will appear here</h1><p className="text-muted-foreground">Tap the heart on any headshot to save it here.</p><button type="button" className={`${ONBOARDING_CONTINUE_BUTTON_CLASS} mx-auto mt-4`} onClick={() => setTab("results")}>Browse results</button></div>}
        <div id="results" className={photos.length ? "grid grid-cols-2 gap-4 p-4 pt-0 lg:grid-cols-3 xl:grid-cols-4" : "hidden"}>
          {photos.map(photo => {
            const index = order.results.findIndex(result => result.id === photo.id) + 1;
            const favorite = favorites.includes(photo.id);
            return (
              <div key={photo.id} className="group relative overflow-hidden rounded-2xl">
                <Image src={photo.url} alt="Your generated headshot" width={400} height={600} unoptimized className="aspect-[2/3] w-full rounded-2xl object-cover" />
                <button type="button" aria-label={`${favorite ? "Remove headshot" : "Favorite headshot"} ${index}${favorite ? " from favorites" : ""}`} aria-pressed={favorite} disabled={saving} onClick={() => void toggleFavorite(photo.id)}
                  className={`absolute right-3 top-3 grid size-11 place-items-center rounded-full bg-white shadow-md transition-opacity focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-wait ${favorite ? "text-primary" : "text-neutral-800"}`}>
                  <Heart className="size-6" fill={favorite ? "currentColor" : "none"} aria-hidden="true" />
                </button>
                <div className="absolute inset-x-0 bottom-0 flex justify-center bg-gradient-to-t from-black/50 to-transparent px-3 pb-4 pt-12">
                  <a href={`${photo.url}?download=1`} aria-label={`Download headshot ${index}`} className="inline-flex h-12 w-full max-w-sm items-center justify-center gap-2 rounded-full bg-white px-5 text-base font-semibold tracking-[0.2px] text-neutral-900 shadow-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"><Download className="size-5" aria-hidden="true" /> Download</a>
                </div>
              </div>
            );
          })}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
