import { apiClient } from "../lib/apiClient";
import type {
  ExportFormat,
  ExportFileApiResponse,
  ExportHistoryItem,
  FinancialReportType,
  GeneralExportModule,
} from "../types/export";

const base64ToUint8Array = (value: string) => {
  const binary = window.atob(value);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
};

const downloadFile = (
  fileName: string,
  content: string,
  mimeType: string,
  contentEncoding: "utf-8" | "base64" = "utf-8",
) => {
  const blob =
    contentEncoding === "base64"
      ? new Blob([base64ToUint8Array(content)], { type: mimeType })
      : new Blob([content], { type: mimeType });

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
      defaultErrorMessage: "Không thể tải lịch sử xuất dữ liệu.",
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
        defaultErrorMessage: "Không thể tạo tệp xuất dữ liệu tổng quát.",
        body: JSON.stringify({ module, fromDate, toDate, format }),
      },
    );

    downloadFile(
      response.fileName,
      response.content,
      response.mimeType,
      response.contentEncoding,
    );

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
        defaultErrorMessage: "Không thể tạo tệp xuất dữ liệu tài chính.",
        body: JSON.stringify({ reportType, fromDate, toDate, format }),
      },
    );

    downloadFile(
      response.fileName,
      response.content,
      response.mimeType,
      response.contentEncoding,
    );

    return response.historyItem;
  },
};
