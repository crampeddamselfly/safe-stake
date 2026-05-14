import { mainnet, sepolia } from "viem/chains"
import type { Chain } from "viem"
import { getRpcUrl, getSupportedChainIds } from "$lib/spec/loader"

function withRpc(chain: Chain): Chain {
  const override = getRpcUrl(chain.id)
  if (!override) return chain
  return {
    ...chain,
    rpcUrls: {
      ...chain.rpcUrls,
      default: { http: [override] }
    }
  }
}

const all: Record<number, Chain> = {
  [mainnet.id]: withRpc(mainnet),
  [sepolia.id]: withRpc(sepolia)
}

export function getChain(chainId: number): Chain {
  const c = all[chainId]
  if (!c) throw new Error(`Unsupported chain ${chainId}`)
  return c
}

export function getSupportedChains(): Chain[] {
  return getSupportedChainIds().map(getChain)
}

export const DEFAULT_CHAIN_ID = Number(
  import.meta.env.VITE_DEFAULT_CHAIN_ID ?? mainnet.id
)
