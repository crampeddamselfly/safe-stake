import { describe, it, expect } from "vitest"
import {
  decorate,
  sortRows,
  applyRecommendedFilter
} from "./validators"
import type { ValidatorRow } from "$lib/hooks/useStakingReads"

const v: ValidatorRow[] = [
  {
    name: "A",
    address: { value: "0x0000000000000000000000000000000000000001", format: "evm" },
    commissionBps: 800,
    totalStaked: 100n,
    isRegistered: true
  },
  {
    name: "B",
    address: { value: "0x0000000000000000000000000000000000000002", format: "evm" },
    commissionBps: 200,
    totalStaked: 300n,
    isRegistered: true
  },
  {
    name: "C",
    address: { value: "0x0000000000000000000000000000000000000003", format: "evm" },
    commissionBps: 400,
    totalStaked: 0n,
    isRegistered: false
  }
]

describe("analytics", () => {
  it("computes share", () => {
    const out = decorate(v, 400n)
    expect(out[1]?.share).toBeCloseTo(0.75, 5)
  })

  it("sorts by stake desc", () => {
    const out = sortRows(decorate(v, 400n), "totalStaked", "desc")
    expect(out[0]?.name).toBe("B")
  })

  it("recommended filter excludes >=5% commission and unregistered", () => {
    const out = applyRecommendedFilter(decorate(v, 400n))
    expect(out.map((r) => r.name)).toEqual(["B"])
  })
})
