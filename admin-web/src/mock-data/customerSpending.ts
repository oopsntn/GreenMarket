import type {
  CustomerSpendingCard,
  CustomerSpendingRow,
} from "../types/customerSpending";

export const customerSpendingCards: CustomerSpendingCard[] = [
  { title: "Total Customers", value: "284", note: "+18 this month" },
  { title: "Total Spending", value: "$24,860", note: "+11.3% vs last month" },
  { title: "Avg. Spend / Customer", value: "$87.5", note: "+3.8% increase" },
  { title: "Top Customer Spend", value: "$1,240", note: "Highest in period" },
];

export const customerSpendingRows: CustomerSpendingRow[] = [
  {
    id: 1,
    customerName: "Nguyen Van A",
    email: "vana@greenmarket.vn",
    totalOrders: 12,
    totalSpent: "$1,240",
    avgOrderValue: "$103",
    lastPurchase: "2026-03-16",
  },
  {
    id: 2,
    customerName: "Tran Thi B",
    email: "thib@greenmarket.vn",
    totalOrders: 10,
    totalSpent: "$1,020",
    avgOrderValue: "$102",
    lastPurchase: "2026-03-15",
  },
  {
    id: 3,
    customerName: "Le Van C",
    email: "vanc@greenmarket.vn",
    totalOrders: 8,
    totalSpent: "$860",
    avgOrderValue: "$107",
    lastPurchase: "2026-03-14",
  },
  {
    id: 4,
    customerName: "Pham Thi D",
    email: "thid@greenmarket.vn",
    totalOrders: 7,
    totalSpent: "$790",
    avgOrderValue: "$113",
    lastPurchase: "2026-03-13",
  },
];
