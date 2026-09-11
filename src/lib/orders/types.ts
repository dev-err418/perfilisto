export type Preferences = {
  attire: string[];
  backgrounds: string[];
  poses?: string[];
  glasses?: string;
  gender?: string | null;
  age?: string | null;
  hair?: string | null;
  hairLength?: string | null;
  hairType?: string | null;
  bodyType?: string | null;
};
export type Review = {
  photos: {
    id: string;
    index: number;
    accepted: boolean;
    reason: string;
    framing: string;
  }[];
  summary: string;
  needsMidRange: boolean;
};
export type Order = {
  id: string;
  planId: string;
  name: string;
  price: number;
  currency: string;
  photoCount: number;
  deliveryTime?: string;
  status:
    | "draft"
    | "checkout"
    | "paid"
    | "generating"
    | "complete"
    | "partial"
    | "failed";
  photos: { id: string; name: string; url: string }[];
  checkoutId?: string;
  checkoutEmail?: string;
  whopPlanId: string;
  payment?: { amount: number; currency: string };
  review?: Review;
  results: { id: string; url: string }[];
  favorites?: string[];
  preferences?: Preferences;
  batchProgress?: { completed: number; failed: number; total: number };
  emailNotificationsEnabled?: boolean;
  batchStatus?: string;
  error?: string;
  expiresAt: number;
};
