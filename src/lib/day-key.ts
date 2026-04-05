import { USAGE_TIMEZONE } from "./constants";

/** Limit sıfırlaması için gün anahtarı (YYYY-MM-DD), Europe/Istanbul */
export function getUsageDayKey(date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: USAGE_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}
