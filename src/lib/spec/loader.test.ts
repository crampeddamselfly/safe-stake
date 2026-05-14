import { describe, it, expect } from "vitest"
import { getConfig, getSupportedChainIds, getRpcUrl } from "./loader"

describe("spec loader", () => {
  it("loads mainnet + sepolia", () => {
    const ids = getSupportedChainIds()
    expect(ids).toContain(1)
    expect(ids).toContain(11155111)
  })

  it("checksums mainnet staking address", () => {
    const cfg = getConfig(1)
    expect(cfg.contracts.staking.value).toBe(
      "0x115E78f160e1E3eF163B05C84562Fa16fA338509"
    )
  })

  it("throws for unknown chain", () => {
    expect(() => getConfig(424242)).toThrow()
  })

  it("falls back to spec rpcUrl when env var not set", () => {
    expect(getRpcUrl(1)).toBeUndefined()
  })
})
