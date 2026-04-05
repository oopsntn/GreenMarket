export type CustomerSpendingCard = {
  title: string;
  value: string;
  note: string;
};

export type CustomerSpendingRow = {
  id: number;
  customerName: string;
  email: string;
  totalOrders: number;
  totalSpent: string;
  avgOrderValue: string;
  lastPurchase: string;
};

export type CustomerSpendingApiResponse = {
  summaryCards: CustomerSpendingCard[];
  rows: CustomerSpendingRow[];
};
