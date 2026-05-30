import { describe, expect, it, beforeEach, vi } from "vitest";
import { normalizeLocale, DEFAULT_LOCALE, LOCALE_COOKIE } from "../locale";

// The cookie write lives in the Zustand store's setLocale. We test the pure
// pieces directly (normalizeLocale fallback) and the cookie-string contract that
// setLocale relies on, without standing up the full store/runtime.

describe("locale persistence contract", () => {
  beforeEach(() => {
    // jsdom provides document.cookie
    document.cookie = `${LOCALE_COOKIE}=; path=/; max-age=0`;
  });

  it("defaults to Arabic when the cookie is absent or invalid", () => {
    expect(normalizeLocale(undefined)).toBe(DEFAULT_LOCALE);
    expect(normalizeLocale("")).toBe(DEFAULT_LOCALE);
    expect(normalizeLocale("zz")).toBe(DEFAULT_LOCALE);
    expect(DEFAULT_LOCALE).toBe("ar");
  });

  it("round-trips a written locale cookie value", () => {
    const oneYear = 60 * 60 * 24 * 365;
    document.cookie = `${LOCALE_COOKIE}=en; path=/; max-age=${oneYear}; SameSite=Lax`;
    const match = document.cookie
      .split("; ")
      .find((c) => c.startsWith(`${LOCALE_COOKIE}=`));
    expect(match).toBeDefined();
    const value = match!.split("=")[1];
    expect(normalizeLocale(value)).toBe("en");
  });

  it("normalizes a tampered cookie value back to the default", () => {
    document.cookie = `${LOCALE_COOKIE}=hacked; path=/`;
    const value = document.cookie
      .split("; ")
      .find((c) => c.startsWith(`${LOCALE_COOKIE}=`))!
      .split("=")[1];
    expect(normalizeLocale(value)).toBe(DEFAULT_LOCALE);
  });
});

// Silence unused import lint if vi isn't otherwise referenced.
void vi;
