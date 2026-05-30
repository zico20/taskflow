import { describe, expect, it } from "vitest";
import { dueInfo } from "../due-status";

// Build dates in LOCAL time (no trailing Z) so calendar-day comparisons are
// deterministic regardless of the test runner's timezone — matching how the
// helper evaluates "today" against the viewer's local day.
const local = (y: number, m: number, d: number, h = 12) =>
  new Date(y, m - 1, d, h, 0, 0);

const NOW = local(2026, 5, 30);

describe("dueInfo", () => {
  it("returns 'none' for a missing due date", () => {
    expect(dueInfo(null, NOW)).toEqual({ status: "none", days: 0 });
    expect(dueInfo(undefined, NOW)).toEqual({ status: "none", days: 0 });
  });

  it("flags a past date as overdue", () => {
    expect(dueInfo(local(2026, 5, 28), NOW).status).toBe("overdue");
  });

  it("flags a date earlier today as today (same calendar day)", () => {
    expect(dueInfo(local(2026, 5, 30, 6), NOW).status).toBe("today");
  });

  it("flags today's date later in the day as today", () => {
    expect(dueInfo(local(2026, 5, 30, 23), NOW).status).toBe("today");
  });

  it("flags a future date as upcoming with the day count", () => {
    const info = dueInfo(local(2026, 6, 2), NOW);
    expect(info.status).toBe("upcoming");
    expect(info.days).toBe(3);
  });

  it("counts one day ahead as upcoming days=1", () => {
    expect(dueInfo(local(2026, 5, 31), NOW)).toEqual({
      status: "upcoming",
      days: 1,
    });
  });
});
