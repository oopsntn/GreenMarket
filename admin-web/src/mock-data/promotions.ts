import type { Promotion } from "../types/promotion";

export const initialPromotions: Promotion[] = [
  {
    id: 1,
    postTitle: "Rare Monstera Deliciosa for Sale",
    owner: "Nguyen Van A",
    slot: "Home Top",
    packageName: "Premium 7 Days",
    startDate: "2026-03-15",
    endDate: "2026-03-22",
    status: "Active",
  },
  {
    id: 2,
    postTitle: "Mini Bonsai Collection",
    owner: "Tran Thi B",
    slot: "Category Top",
    packageName: "Standard 5 Days",
    startDate: "2026-03-14",
    endDate: "2026-03-19",
    status: "Paused",
  },
  {
    id: 3,
    postTitle: "Succulent Combo Pot Set",
    owner: "Le Van C",
    slot: "Search Boost",
    packageName: "Boost 3 Days",
    startDate: "2026-03-10",
    endDate: "2026-03-13",
    status: "Expired",
  },
];
