import { apiClient } from "../lib/apiClient";
import type {
  ExportFormat,
  ExportFileApiResponse,
  ExportHistoryItem,
  FinancialReportType,
  GeneralExportModule,
} from "../types/export";

const downloadFile = (
  fileName: string,
  content: string,
  mimeType: string,
) => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
};

export const exportService = {
  async getExportHistory(): Promise<ExportHistoryItem[]> {
    return apiClient.request<ExportHistoryItem[]>("/api/admin/exports/history", {
      defaultErrorMessage: "Unable to load export history.",
    });
  },

  async createGeneralExportHistoryItem(
    module: GeneralExportModule,
    fromDate: string,
    toDate: string,
    format: ExportFormat,
  ): Promise<ExportHistoryItem> {
    const response = await apiClient.request<ExportFileApiResponse>(
      "/api/admin/exports/general",
      {
        method: "POST",
        includeJsonContentType: true,
        defaultErrorMessage: "Unable to create general export.",
        body: JSON.stringify({ module, fromDate, toDate, format }),
      },
    );

    downloadFile(response.fileName, response.content, response.mimeType);
    return response.historyItem;
  },

  async createFinancialExportHistoryItem(
    reportType: FinancialReportType,
    fromDate: string,
    toDate: string,
    format: ExportFormat,
  ): Promise<ExportHistoryItem> {
    const response = await apiClient.request<ExportFileApiResponse>(
      "/api/admin/exports/financial",
      {
        method: "POST",
        includeJsonContentType: true,
        defaultErrorMessage: "Unable to create financial export.",
        body: JSON.stringify({ reportType, fromDate, toDate, format }),
      },
    );

    downloadFile(response.fileName, response.content, response.mimeType);
    return response.historyItem;
  },
};
