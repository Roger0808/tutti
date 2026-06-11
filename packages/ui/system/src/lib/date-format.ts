export type NextopDateLocale = "en" | "zh-CN";

const fullDateTimeFormatterByLocale = new Map<string, Intl.DateTimeFormat>();
const shortDateTimeFormatterByLocale = new Map<string, Intl.DateTimeFormat>();

export function getCurrentNextopDateLocale(): NextopDateLocale {
  if (typeof document !== "undefined") {
    const locale = normalizeNextopDateLocale(document.documentElement.lang);
    if (locale) {
      return locale;
    }
  }

  return "en";
}

export function formatNextopDateTime(
  value: Date | number,
  locale = getCurrentNextopDateLocale()
): string {
  return getFullDateTimeFormatter(locale).format(value);
}

export function formatNextopShortDateTime(
  value: Date | number,
  locale = getCurrentNextopDateLocale()
): string {
  return getShortDateTimeFormatter(locale).format(value);
}

function getFullDateTimeFormatter(locale: string): Intl.DateTimeFormat {
  const normalizedLocale = normalizeNextopDateLocale(locale) ?? "en";
  const cached = fullDateTimeFormatterByLocale.get(normalizedLocale);
  if (cached) {
    return cached;
  }

  const formatter = new Intl.DateTimeFormat(normalizedLocale, {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "2-digit",
    year: "numeric"
  });
  fullDateTimeFormatterByLocale.set(normalizedLocale, formatter);
  return formatter;
}

function getShortDateTimeFormatter(locale: string): Intl.DateTimeFormat {
  const normalizedLocale = normalizeNextopDateLocale(locale) ?? "en";
  const cached = shortDateTimeFormatterByLocale.get(normalizedLocale);
  if (cached) {
    return cached;
  }

  const formatter = new Intl.DateTimeFormat(normalizedLocale, {
    day: "numeric",
    hour: "2-digit",
    hourCycle: "h23",
    minute: "2-digit",
    month: normalizedLocale === "en" ? "short" : "long"
  });
  shortDateTimeFormatterByLocale.set(normalizedLocale, formatter);
  return formatter;
}

function normalizeNextopDateLocale(
  locale: string | null | undefined
): NextopDateLocale | null {
  const normalized = locale?.trim().toLowerCase() ?? "";
  if (!normalized) {
    return null;
  }
  if (normalized === "zh" || normalized.startsWith("zh-")) {
    return "zh-CN";
  }
  if (normalized === "en" || normalized.startsWith("en-")) {
    return "en";
  }
  return null;
}
