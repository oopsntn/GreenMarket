const padDatePart = (value: number) => String(value).padStart(2, "0");

export const toDateInputValue = (date: Date) =>
  `${date.getFullYear()}-${padDatePart(date.getMonth() + 1)}-${padDatePart(date.getDate())}`;

export const getTodayDateValue = (baseDate = new Date()) => toDateInputValue(baseDate);

export const getCurrentMonthStartDateValue = (baseDate = new Date()) =>
  toDateInputValue(new Date(baseDate.getFullYear(), baseDate.getMonth(), 1));

export const getPastDateValue = (daysBack: number, baseDate = new Date()) => {
  const nextDate = new Date(baseDate);
  nextDate.setDate(nextDate.getDate() - Math.max(daysBack, 0));
  return toDateInputValue(nextDate);
};

export const DEFAULT_REPORT_FROM_DATE = getCurrentMonthStartDateValue();
export const DEFAULT_REPORT_TO_DATE = getTodayDateValue();

export const clampDateToMax = (value: string, maxDate: string) => {
  if (!value) {
    return value;
  }

  return value > maxDate ? maxDate : value;
};

export const coerceDateRange = (
  nextValue: string,
  counterpartValue: string,
  field: "from" | "to",
  maxDate: string,
) => {
  const safeNextValue = clampDateToMax(nextValue, maxDate);

  if (!safeNextValue || !counterpartValue) {
    return {
      nextValue: safeNextValue,
      counterpartValue,
    };
  }

  if (field === "from" && safeNextValue > counterpartValue) {
    return {
      nextValue: safeNextValue,
      counterpartValue: safeNextValue,
    };
  }

  if (field === "to" && safeNextValue < counterpartValue) {
    return {
      nextValue: safeNextValue,
      counterpartValue: safeNextValue,
    };
  }

  return {
    nextValue: safeNextValue,
    counterpartValue,
  };
};

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
