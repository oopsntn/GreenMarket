const DATE_FORMATTER = new Intl.DateTimeFormat("sv-SE", {
  timeZone: "Asia/Bangkok",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const DATE_TIME_FORMATTER = new Intl.DateTimeFormat("sv-SE", {
  timeZone: "Asia/Bangkok",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

const parseDate = (value: string | Date | null | undefined) => {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed;
};

export const formatAdminDate = (value: string | Date | null | undefined) => {
  const parsed = parseDate(value);
  if (!parsed) {
    return "";
  }

  return DATE_FORMATTER.format(parsed);
};

export const formatAdminDateTime = (
  value: string | Date | null | undefined,
) => {
  const parsed = parseDate(value);
  if (!parsed) {
    return "";
  }

  return DATE_TIME_FORMATTER.format(parsed).replace(",", "");
};

export const getAdminTodayDateValue = () => formatAdminDate(new Date());
