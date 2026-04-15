export const DEFAULT_REPORT_FROM_DATE = "2026-03-01";
export const DEFAULT_REPORT_TO_DATE = "2026-03-31";

export const formatDateRangeLabel = (fromDate: string, toDate: string) => {
  if (fromDate && toDate) {
    return `${fromDate} đến ${toDate}`;
  }

  if (fromDate) {
    return `Từ ${fromDate}`;
  }

  if (toDate) {
    return `Đến ${toDate}`;
  }

  return "Toàn bộ thời gian";
};
