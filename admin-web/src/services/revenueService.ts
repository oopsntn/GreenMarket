import { revenueCards, revenueRows } from "../mock-data/revenue";
import type { RevenueCard, RevenueRow } from "../types/revenue";

export const revenueService = {
  getRevenueCards(): RevenueCard[] {
    return revenueCards;
  },

  getRevenueRows(): RevenueRow[] {
    return revenueRows;
  },
};
