import { describe, it, expect } from "vitest"
import {
  formatSafe,
  truncateAddress,
  formatBps,
  formatCountdown
} from "./format"

describe("formatSafe", () => {
  it("formats 1e18 as 1", () => {
    expect(formatSafe(10n ** 18n)).toBe("1")
  })
  it("formats fractions with precision", () => {
    expect(formatSafe(10n ** 18n / 2n, { precision: 4 })).toBe("0.5")
  })
  it("renders dash for undefined", () => {
    expect(formatSafe(undefined)).toBe("—")
  })
})

describe("truncateAddress", () => {
  it("truncates middle", () => {
    expect(truncateAddress("0x1234567890abcdef1234567890abcdef12345678")).toBe(
      "0x1234…5678"
    )
  })
})

describe("formatBps", () => {
  it("converts bps to percent", () => {
    expect(formatBps(500)).toBe("5.00%")
  })
})

describe("formatCountdown", () => {
  it("returns Ready for non-positive", () => {
    expect(formatCountdown(0n)).toBe("Ready")
  })
  it("formats hours and minutes", () => {
    expect(formatCountdown(3600n + 600n)).toBe("1h 10m")
  })
})
