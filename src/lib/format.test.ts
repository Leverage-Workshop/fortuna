import { describe, expect, test } from "vitest";
import { formatCount, formatDate, formatDuration, formatPercent, formatTimestamp, formatUsd } from "./format";

describe("format", () => {
  test("probabilities print as whole percents", () => {
    expect(formatPercent(0.5322)).toBe("53%");
    expect(formatPercent(0.072)).toBe("7%");
    expect(formatPercent(1)).toBe("100%");
  });

  test("money prints in dollars with cents, and tiny amounts don't read as zero", () => {
    expect(formatUsd(0.41)).toBe("$0.41");
    expect(formatUsd(0)).toBe("$0.00");
    expect(formatUsd(12.5)).toBe("$12.50");
    expect(formatUsd(0.0042)).toBe("<$0.01");
    expect(formatUsd(null)).toBe("—");
  });

  test("counts use thousands separators; missing values are a dash", () => {
    expect(formatCount(12345)).toBe("12,345");
    expect(formatCount(0)).toBe("0");
    expect(formatCount(null)).toBe("—");
  });

  test("durations scale from ms to minutes", () => {
    expect(formatDuration(850)).toBe("850 ms");
    expect(formatDuration(12_340)).toBe("12.3 s");
    expect(formatDuration(125_000)).toBe("2 m 05 s");
    expect(formatDuration(null)).toBe("—");
  });

  test("calendar dates print day, month, year without a timezone shift", () => {
    expect(formatDate("2016-07-01")).toBe("1 Jul 2016");
    expect(formatDate("2020-12-31")).toBe("31 Dec 2020");
    expect(formatDate(null)).toBe("—");
  });

  test("timestamps print in UTC to the minute", () => {
    expect(formatTimestamp(new Date("2026-11-27T17:42:09Z"))).toBe("2026-11-27 17:42 UTC");
    expect(formatTimestamp(null)).toBe("—");
  });
});
