import { dictionaries, en, type Dictionary, type MessageKey } from "./dictionaries";
import { DEFAULT_LOCALE, type Locale } from "./locale";

export type TParams = Record<string, string | number>;

/** Replace {param} tokens in a template with provided values. */
function interpolate(template: string, params?: TParams): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in params ? String(params[name]) : match,
  );
}

/**
 * Translate a key into the given locale with optional interpolation.
 * Fallback order: active locale → other locale → the key itself.
 * Never returns blank or throws (FR-009).
 */
export function translate(
  locale: Locale,
  key: MessageKey,
  params?: TParams,
): string {
  const active: Dictionary = dictionaries[locale] ?? en;
  const fallback: Dictionary = en;
  const template =
    (active[key] as string | undefined) ??
    (fallback[key] as string | undefined) ??
    key;
  return interpolate(template, params);
}

// Allow known keys (with autocomplete) OR any string (e.g. a zod message that
// carries a key through a library typed as plain string). Unknown strings fall
// back per `translate` rules.
type LooseKey = MessageKey | (string & {});

/** Bind a translate function to a fixed locale. */
export function createT(locale: Locale) {
  return (key: LooseKey, params?: TParams) =>
    translate(locale, key as MessageKey, params);
}

export type TFunction = ReturnType<typeof createT>;

/**
 * Count-aware translate. For count === 1, prefers a `${key}_one` variant if it
 * exists; otherwise uses `key`. `count` is auto-provided as an interpolation param.
 * (Keeps the two languages readable without a full plural-rules engine.)
 */
export function translateCount(
  locale: Locale,
  key: MessageKey,
  count: number,
  params?: TParams,
): string {
  const oneKey = `${key}_one` as MessageKey;
  const useOne = count === 1 && oneKey in en;
  return translate(locale, useOne ? oneKey : key, { count, ...params });
}

export { DEFAULT_LOCALE };
