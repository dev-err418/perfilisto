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
    titleTint: "Studio-quality",
    titleLine1: "headshots.",
    titleLine2: "From your selfies.",
    description:
      "Get professional photos for your LinkedIn, CV, and website without booking a photographer. Upload your selfies and let Perfilisto do the rest.",
    cta: "Create my headshots",
    supportingText: "Your photos stay private",
    rating: "4.8/5",
    ratingLabel: "Rated 4.8 out of 5",
    trustText: "Trusted by +1453 professionals",
  },
} as const;

export type Messages = typeof en;
