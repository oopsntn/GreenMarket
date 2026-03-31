import type {
  PromotionPackage,
  PromotionPackageFormState,
} from "../types/promotionPackage";

export const initialPromotionPackages: PromotionPackage[] = [
  {
    id: 1,
    name: "Homepage Premium 7 Days",
    slot: "Home Top",
    durationDays: 7,
    price: "1,200,000 VND",
    maxPosts: 1,
    displayQuota: 50000,
    status: "Active",
    description:
      "Premium homepage package for top hero placement with the highest visibility.",
  },
  {
    id: 2,
    name: "Category Spotlight 5 Days",
    slot: "Category Top",
    durationDays: 5,
    price: "650,000 VND",
    maxPosts: 1,
    displayQuota: 25000,
    status: "Active",
    description:
      "Category-level package used to highlight selected boosted posts in category pages.",
  },
  {
    id: 3,
    name: "Search Boost 3 Days",
    slot: "Search Boost",
    durationDays: 3,
    price: "320,000 VND",
    maxPosts: 1,
    displayQuota: 15000,
    status: "Disabled",
    description:
      "Search result boosting package reserved for campaigns that need temporary ranking support.",
  },
];

export const emptyPromotionPackageForm: PromotionPackageFormState = {
  name: "",
  slot: "Home Top",
  durationDays: 7,
  price: "",
  maxPosts: 1,
  displayQuota: 10000,
  description: "",
};
