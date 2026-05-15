import addressesRaw from "../../../config/safenet-contracts.denna-spec.json"
import uiRaw from "../../../config/safe-stake-ui.denna-spec.json"
import {
  addressRegistrySchema,
  stakingUiConfigSchema,
  type ChainEntry,
  type ValidatorEntry
} from "./schema"
import type { Address } from "viem"

const addresses = addressRegistrySchema.parse(addressesRaw)
const ui = stakingUiConfigSchema.parse(uiRaw)

export type Contracts = {
  staking: Address
  safeToken: Address
  sanctionsOracle?: Address
  merkleDrop?: Address
}

export type ResolvedConfig = {
  chain: string
  chainId: number
  deployBlock: number
  contracts: Contracts
  validators: ValidatorEntry[]
  rewards?: ChainEntry["rewards"]
  features: NonNullable<ChainEntry["features"]>
  rpcUrl?: string
}

function lookup(name: string, chain: string): Address | undefined {
  const group = addresses.addresses[name]
  if (!group) return undefined
  return group.entries.find((e) => e.chain === chain)?.address.value as Address | undefined
}

function resolve(c: ChainEntry): ResolvedConfig {
  const staking = lookup("staking", c.chain)
  const safeToken = lookup("safeToken", c.chain)
  if (!staking || !safeToken) {
    throw new Error(
      `safenet-contracts: missing staking or safeToken for chain "${c.chain}". Update config/safenet-contracts.denna-spec.json.`
    )
  }
  return {
    chain: c.chain,
    chainId: c.chainId,
    deployBlock: c.deployBlock ?? 0,
    contracts: {
      staking,
      safeToken,
      sanctionsOracle: lookup("sanctionsOracle", c.chain),
      merkleDrop: lookup("merkleDrop", c.chain)
    },
    validators: c.validators,
    rewards: c.rewards,
    features: c.features ?? { eip5792Batch: false, geoBlock: false, sanctionsGate: false },
    rpcUrl: c.rpcUrl
  }
}

const byId = new Map<number, ResolvedConfig>()
for (const c of ui.chains) byId.set(c.chainId, resolve(c))

export function getConfig(chainId: number): ResolvedConfig {
  const cfg = byId.get(chainId)
  if (!cfg) throw new Error(`No staking config for chainId ${chainId}`)
  return cfg
}

export function getSupportedChainIds(): number[] {
  return [...byId.keys()]
}

export function getAllConfigs(): ResolvedConfig[] {
  return [...byId.values()]
}

export function getRpcUrl(chainId: number): string | undefined {
  const envKey = `VITE_RPC_URL_${chainId}` as const
  const envVal = import.meta.env[envKey] as string | undefined
  if (envVal && envVal.length > 0) return envVal
  return getConfig(chainId).rpcUrl
}
