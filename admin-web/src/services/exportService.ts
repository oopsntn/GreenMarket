import { apiClient } from "../lib/apiClient";
import type {
  ExportFormat,
  ExportFileApiResponse,
  ExportHistoryItem,
  FinancialReportType,
  GeneralExportModule,
} from "../types/export";

const REPORT_NAME_LABELS: Record<string, string> = {
  Users: "Người dùng",
  Categories: "Danh mục",
  Attributes: "Thuộc tính",
  Templates: "Mẫu nội dung",
  Promotions: "Đơn quảng bá",
  Analytics: "Phân tích",
  "Users Export": "Xuất danh sách người dùng",
  "Categories Export": "Xuất danh mục",
  "Attributes Export": "Xuất thuộc tính",
  "Templates Export": "Xuất dữ liệu mẫu nội dung",
  "Promotions Export": "Xuất đơn quảng bá",
  "Analytics Export": "Xuất báo cáo phân tích",
  "Revenue Summary": "Tổng quan doanh thu",
  "Customer Spending Report": "Báo cáo chi tiêu khách hàng",
  "Promotion Performance": "Hiệu quả đơn quảng bá",
  "Xuất danh sách người dùng": "Xuất danh sách người dùng",
  "Xuất danh mục": "Xuất danh mục",
  "Xuất thuộc tính": "Xuất thuộc tính",
  "Xuất đơn quảng bá": "Xuất đơn quảng bá",
  "Xuất báo cáo phân tích": "Xuất báo cáo phân tích",
  "Xuất dữ liệu mẫu nội dung": "Xuất dữ liệu mẫu nội dung",
  "Xuất báo cáo doanh thu": "Xuất báo cáo doanh thu",
  "Xuất báo cáo chi tiêu khách hàng": "Xuất báo cáo chi tiêu khách hàng",
  "Xuất báo cáo hiệu suất quảng bá": "Xuất báo cáo hiệu suất quảng bá",
};

const normalizeReportName = (value: string) => {
  const normalized = value.trim();
  return REPORT_NAME_LABELS[normalized] || normalized;
};

const normalizeHistoryItem = (item: ExportHistoryItem): ExportHistoryItem => ({
  ...item,
  reportName: normalizeReportName(item.reportName),
});

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
    const response = await apiClient.request<ExportHistoryItem[]>(
      "/api/admin/exports/history",
      {
        defaultErrorMessage: "Không thể tải lịch sử xuất dữ liệu.",
      },
    );

    return response.map(normalizeHistoryItem);
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

    return normalizeHistoryItem(response.historyItem);
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

    return normalizeHistoryItem(response.historyItem);
  },
};
