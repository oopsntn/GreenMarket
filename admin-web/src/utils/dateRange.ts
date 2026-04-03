export const DEFAULT_REPORT_FROM_DATE = "2026-03-01";
export const DEFAULT_REPORT_TO_DATE = "2026-03-31";

export const formatDateRangeLabel = (fromDate: string, toDate: string) => {
  if (fromDate && toDate) {
    return `${fromDate} to ${toDate}`;
  }

  if (fromDate) {
    return `From ${fromDate}`;
  }

  if (toDate) {
    return `Until ${toDate}`;
  }

  return "All dates";
};
