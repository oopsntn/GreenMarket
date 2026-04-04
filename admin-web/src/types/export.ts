export type ExportFormat = "CSV" | "XLSX";

export type GeneralExportModule =
  | "Users"
  | "Categories"
  | "Attributes"
  | "Templates"
  | "Promotions"
  | "Analytics";

export type FinancialReportType =
  | "Revenue Summary"
  | "Customer Spending Report"
  | "Promotion Performance";

export type ExportHistoryStatus = "Completed" | "In Progress";

export type ExportHistoryItem = {
  id: number;
  reportName: string;
  type: "General" | "Financial";
  format: ExportFormat;
  generatedBy: string;
  date: string;
  status: ExportHistoryStatus;
};

export type ExportFileApiResponse = {
  historyItem: ExportHistoryItem;
  fileName: string;
  mimeType: string;
  content: string;
};
