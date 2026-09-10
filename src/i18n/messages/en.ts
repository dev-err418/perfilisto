export const en = {
  meta: {
    title: "Perfilisto: A profile that's ready to send",
    description:
      "Perfilisto helps you turn your work, skills, and story into one clean page you can share with recruiters, clients, and anyone who needs to know what you do.",
    siteName: "Perfilisto",
  },
  brand: {
    name: "Perfilisto",
    homeAriaLabel: "Perfilisto home",
  },
  nav: {
    howItWorks: "How it works",
    pricing: "Pricing",
    login: "Login",
    getStarted: "Get started",
    dashboard: "Dashboard",
  },
  hero: {
    badge: "#1 🇪🇸 Spanish AI headshot",
    titleLine1: "Studio-quality headshots.",
    titleLine2: "From your selfies.",
    description:
      "Get professional photos for your LinkedIn, CV, and website without booking a photographer. Upload your selfies and let Perfilisto do the rest.",
    cta: "Create my headshots",
    supportingText: "Your photos stay private.",
  },
} as const;

export type Messages = typeof en;
