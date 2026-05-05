const BANGKOK_OFFSET_MS = 7 * 60 * 60 * 1000;

const bangkokDateTimeFormatter = new Intl.DateTimeFormat("vi-VN", {
  timeZone: "Asia/Bangkok",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

const coerceDate = (value: Date | string | null | undefined) => {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  // PostgreSQL `timestamp` in this project is stored without timezone.
  // The driver surfaces it as a local timestamp object, so we shift it
  // back to the intended Asia/Bangkok wall-clock time before formatting.
  return new Date(parsed.getTime() + BANGKOK_OFFSET_MS);
};

export const formatAdminBangkokDateTime = (
  value: Date | string | null | undefined,
) => {
  const parsed = coerceDate(value);
  if (!parsed) {
    return "";
  }

  return bangkokDateTimeFormatter.format(parsed);
};

export const toAdminBangkokIsoString = (
  value: Date | string | null | undefined,
) => {
  const parsed = coerceDate(value);
  if (!parsed) {
    return "";
  }

  return parsed.toISOString();
};
