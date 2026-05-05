const BANGKOK_TIME_ZONE = "Asia/Bangkok";
const BANGKOK_OFFSET = "+07:00";
const TIMESTAMP_WITHOUT_TIME_ZONE_PATTERN =
  /^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}(?::\d{2}(?:\.\d{1,6})?)?$/;
const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const bangkokDateTimeFormatter = new Intl.DateTimeFormat("vi-VN", {
  timeZone: BANGKOK_TIME_ZONE,
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

const bangkokIsoPartsFormatter = new Intl.DateTimeFormat("sv-SE", {
  timeZone: BANGKOK_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
});

const normalizeTimestampWithoutTimeZone = (value: string) => {
  const normalized = value.trim().replace(" ", "T");

  if (DATE_ONLY_PATTERN.test(normalized)) {
    return `${normalized}T00:00:00${BANGKOK_OFFSET}`;
  }

  if (!TIMESTAMP_WITHOUT_TIME_ZONE_PATTERN.test(normalized)) {
    return normalized;
  }

  const [datePart, timePart = "00:00:00"] = normalized.split("T");
  const [rawHour = "00", rawMinute = "00", rawSecond = "00"] =
    timePart.split(":");
  const second = rawSecond.split(".")[0] || "00";

  return `${datePart}T${rawHour}:${rawMinute}:${second}${BANGKOK_OFFSET}`;
};

const coerceDate = (value: Date | string | null | undefined) => {
  if (!value) {
    return null;
  }

  const normalizedValue =
    typeof value === "string"
      ? normalizeTimestampWithoutTimeZone(value)
      : value;
  const parsed = new Date(normalizedValue);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed;
};

const getBangkokIsoParts = (value: Date) => {
  const parts = bangkokIsoPartsFormatter.formatToParts(value);
  const byType = Object.fromEntries(parts.map((part) => [part.type, part.value]));

  return {
    year: byType.year ?? "0000",
    month: byType.month ?? "00",
    day: byType.day ?? "00",
    hour: byType.hour ?? "00",
    minute: byType.minute ?? "00",
    second: byType.second ?? "00",
  };
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

  const { year, month, day, hour, minute, second } = getBangkokIsoParts(parsed);
  return `${year}-${month}-${day}T${hour}:${minute}:${second}${BANGKOK_OFFSET}`;
};
