import { exportHistoryItems } from "../mock-data/export";
import type { ExportHistoryItem } from "../types/export";

export const exportService = {
  getExportHistory(): ExportHistoryItem[] {
    return exportHistoryItems;
  },
};
