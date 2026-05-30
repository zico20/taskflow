import { ar, enUS, type Locale as DateFnsLocale } from "date-fns/locale";
import type { Locale } from "./locale";

/** Map an app Locale to the matching date-fns locale for relative-time formatting. */
export function dateFnsLocale(locale: Locale): DateFnsLocale {
  return locale === "ar" ? ar : enUS;
}
