import mainnetRaw from "../../../config/safe-staking-mainnet.denna-spec.json"
import sepoliaRaw from "../../../config/safe-staking-sepolia.denna-spec.json"
import { stakingConfigSchema, type StakingConfig } from "./schema"

const configs: Record<number, StakingConfig> = {}

function load(raw: unknown): StakingConfig {
  const parsed = stakingConfigSchema.parse(raw)
  configs[parsed.chainId] = parsed
  return parsed
}

load(mainnetRaw)
load(sepoliaRaw)

export function getConfig(chainId: number): StakingConfig {
  const cfg = configs[chainId]
  if (!cfg) throw new Error(`No staking config for chainId ${chainId}`)
  return cfg
}

export function getSupportedChainIds(): number[] {
  return Object.keys(configs).map((k) => Number(k))
}

export function getAllConfigs(): StakingConfig[] {
  return Object.values(configs)
}

export function getRpcUrl(chainId: number): string | undefined {
  const envKey = `VITE_RPC_URL_${chainId}` as const
  const envVal = import.meta.env[envKey] as string | undefined
  if (envVal && envVal.length > 0) return envVal
  return getConfig(chainId).rpcUrl
}
