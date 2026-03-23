import type { ExportHistoryItem } from "../types/export";

export const exportHistoryItems: ExportHistoryItem[] = [
  {
    id: 1,
    reportName: "User Accounts Report",
    type: "General",
    format: "CSV",
    generatedBy: "Admin",
    date: "2026-03-17",
    status: "Completed",
  },
  {
    id: 2,
    reportName: "Revenue Summary",
    type: "Financial",
    format: "CSV",
    generatedBy: "Admin",
    date: "2026-03-16",
    status: "Completed",
  },
  {
    id: 3,
    reportName: "Customer Spending Report",
    type: "Financial",
    format: "XLSX",
    generatedBy: "Admin",
    date: "2026-03-15",
    status: "Processing",
  },
];
