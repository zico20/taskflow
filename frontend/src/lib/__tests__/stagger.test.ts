import { describe, expect, it } from "vitest";
import { staggerMs, staggerStyle } from "../stagger";

describe("staggerMs", () => {
  it("returns 0 for the first item", () => {
    expect(staggerMs(0)).toBe(0);
  });

  it("scales by the default step (40ms)", () => {
    expect(staggerMs(1)).toBe(40);
    expect(staggerMs(3)).toBe(120);
  });

  it("caps at the default max (240ms)", () => {
    expect(staggerMs(10)).toBe(240);
    expect(staggerMs(1000)).toBe(240);
  });

  it("honors custom step and cap", () => {
    expect(staggerMs(2, { step: 50, cap: 500 })).toBe(100);
    expect(staggerMs(20, { step: 50, cap: 150 })).toBe(150);
  });

  it("clamps negative / non-finite indices to 0", () => {
    expect(staggerMs(-5)).toBe(0);
    expect(staggerMs(NaN)).toBe(0);
    expect(staggerMs(Infinity)).toBe(0); // non-finite → 0
  });

  it("floors fractional indices", () => {
    expect(staggerMs(2.9)).toBe(80);
  });
});

describe("staggerStyle", () => {
  it("returns an animationDelay style string in ms", () => {
    expect(staggerStyle(2)).toEqual({ animationDelay: "80ms" });
    expect(staggerStyle(0)).toEqual({ animationDelay: "0ms" });
  });
});
