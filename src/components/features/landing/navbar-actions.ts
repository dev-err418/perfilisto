import type { Messages } from "@/i18n";

export type LandingNavbarAction = {
  label: string;
  href: string;
  style: "primary" | "tint";
  showArrow: boolean;
  forceVisible: boolean;
  revealAsCta: boolean;
};

export function getLandingNavbarActions(
  isAuthenticated: boolean,
  messages: Messages,
): LandingNavbarAction[] {
  if (isAuthenticated) {
    return [];
  }

  return [
    {
      label: messages.nav.login,
      href: "/login",
      style: "primary",
      showArrow: false,
      forceVisible: false,
      revealAsCta: false,
    },
  ];
}
