import {
  customerSpendingCards,
  customerSpendingRows,
} from "../mock-data/customerSpending";
import type {
  CustomerSpendingCard,
  CustomerSpendingRow,
} from "../types/customerSpending";

export const customerSpendingService = {
  getCustomerSpendingCards(): CustomerSpendingCard[] {
    return customerSpendingCards;
  },

  getCustomerSpendingRows(): CustomerSpendingRow[] {
    return customerSpendingRows;
  },
};
