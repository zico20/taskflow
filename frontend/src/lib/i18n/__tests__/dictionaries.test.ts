import { describe, expect, it } from "vitest";
import { en, ar } from "../dictionaries";

describe("dictionaries", () => {
  const enKeys = Object.keys(en).sort();
  const arKeys = Object.keys(ar).sort();

  it("ar has exactly the same keys as en", () => {
    expect(arKeys).toEqual(enKeys);
  });

  it("no value is blank in either locale", () => {
    for (const [k, v] of Object.entries(en)) {
      expect(v, `en.${k}`).toBeTruthy();
    }
    for (const [k, v] of Object.entries(ar)) {
      expect(v, `ar.${k}`).toBeTruthy();
    }
  });

  it("ar and en differ for human-language strings (sanity: not copy-paste English)", () => {
    // A representative Arabic-translated key should not equal its English value.
    expect(ar["auth.login.title"]).not.toBe(en["auth.login.title"]);
    expect(ar["boards.title"]).not.toBe(en["boards.title"]);
  });
});
