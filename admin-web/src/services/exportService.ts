import { exportHistoryItems } from "../mock-data/export";
import type {
  ExportFormat,
  ExportHistoryItem,
  FinancialReportType,
  GeneralExportModule,
} from "../types/export";

const padNumber = (value: number) => String(value).padStart(2, "0");

const getCurrentDateTime = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = padNumber(now.getMonth() + 1);
  const day = padNumber(now.getDate());
  const hours = padNumber(now.getHours());
  const minutes = padNumber(now.getMinutes());

  return `${year}-${month}-${day} ${hours}:${minutes}`;
};

const getNextHistoryId = (items: ExportHistoryItem[]) => {
  if (items.length === 0) return 1;
  return Math.max(...items.map((item) => item.id)) + 1;
};

export const exportService = {
  getExportHistory(): ExportHistoryItem[] {
    return exportHistoryItems;
  },

  createGeneralExportHistoryItem(
    historyItems: ExportHistoryItem[],
    module: GeneralExportModule,
    format: ExportFormat,
  ): ExportHistoryItem {
    return {
      id: getNextHistoryId(historyItems),
      reportName: `${module} Export`,
      type: "General",
      format,
      generatedBy: "System Administrator",
      date: getCurrentDateTime(),
      status: "Completed",
    };
  },

  createFinancialExportHistoryItem(
    historyItems: ExportHistoryItem[],
    reportType: FinancialReportType,
    format: ExportFormat,
  ): ExportHistoryItem {
    return {
      id: getNextHistoryId(historyItems),
      reportName: reportType,
      type: "Financial",
      format,
      generatedBy: "System Administrator",
      date: getCurrentDateTime(),
      status: "Completed",
    };
  },
};
