import { describe, it, expect } from "vitest"
import { getConfig, getSupportedChainIds, getAllConfigs } from "./loader"

describe("spec loader", () => {
  it("loads mainnet + sepolia", () => {
    const ids = getSupportedChainIds()
    expect(ids).toContain(1)
    expect(ids).toContain(11155111)
  })

  it("checksums mainnet staking address from address-registry", () => {
    const cfg = getConfig(1)
    expect(cfg.contracts.staking).toBe("0x115E78f160e1E3eF163B05C84562Fa16fA338509")
  })

  it("includes mainnet sanctions oracle from address-registry", () => {
    const cfg = getConfig(1)
    expect(cfg.contracts.sanctionsOracle).toBe(
      "0x40C57923924B5c5c5455c48D93317139ADDaC8fb"
    )
  })

  it("sepolia has no sanctions oracle in registry", () => {
    const cfg = getConfig(11155111)
    expect(cfg.contracts.sanctionsOracle).toBeUndefined()
  })

  it("merges validators from staking-ui per chain", () => {
    const main = getConfig(1)
    expect(main.validators.length).toBeGreaterThan(0)
    expect(main.validators.some((v) => v.name === "Gnosis")).toBe(true)
  })

  it("exposes features per chain", () => {
    expect(getConfig(1).features.sanctionsGate).toBe(true)
    expect(getConfig(11155111).features.sanctionsGate).toBe(false)
  })

  it("throws for unknown chain", () => {
    expect(() => getConfig(424242)).toThrow()
  })

  it("returns all configs", () => {
    expect(getAllConfigs().length).toBe(2)
  })
})
