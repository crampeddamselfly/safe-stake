import { describe, it, expect } from "vitest"
import { getConfig, getSupportedChainIds, getAllConfigs } from "./loader"

describe("spec loader", () => {
  it("loads mainnet only", () => {
    const ids = getSupportedChainIds()
    expect(ids).toEqual([1])
  })

  it("checksums mainnet staking address from address-registry", () => {
    const cfg = getConfig(1)
    expect(cfg.contracts.staking).toBe("0x115E78f160e1E3eF163B05C84562Fa16fA338509")
  })

  it("checksums mainnet SAFE token", () => {
    const cfg = getConfig(1)
    expect(cfg.contracts.safeToken).toBe("0x5aFE3855358E112B5647B952709E6165e1c1eEEe")
  })

  it("includes mainnet sanctions oracle from address-registry", () => {
    const cfg = getConfig(1)
    expect(cfg.contracts.sanctionsOracle).toBe(
      "0x40C57923924B5c5c5455c48D93317139ADDaC8fb"
    )
  })

  it("merges validators from staking-ui", () => {
    const main = getConfig(1)
    expect(main.validators.length).toBeGreaterThan(0)
    expect(main.validators.some((v) => v.name === "Gnosis")).toBe(true)
  })

  it("exposes features", () => {
    expect(getConfig(1).features.sanctionsGate).toBe(true)
    expect(getConfig(1).features.eip5792Batch).toBe(true)
  })

  it("throws for unknown chain", () => {
    expect(() => getConfig(424242)).toThrow()
  })

  it("returns all configs", () => {
    expect(getAllConfigs().length).toBe(1)
  })
})
