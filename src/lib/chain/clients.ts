import { createPublicClient, http, type PublicClient } from "viem"
import { getChain } from "./chains"
import { getRpcUrl } from "$lib/spec/loader"

const clients = new Map<string, PublicClient>()

function cacheKey(chainId: number): string {
  return `${chainId}|${getRpcUrl(chainId) ?? "default"}`
}

export function getPublicClient(chainId: number): PublicClient {
  const key = cacheKey(chainId)
  const cached = clients.get(key)
  if (cached) return cached
  const chain = getChain(chainId)
  const rpc = getRpcUrl(chainId)
  const client = createPublicClient({
    chain,
    transport: http(rpc)
  })
  clients.set(key, client)
  return client
}

export function clearClientCache(): void {
  clients.clear()
}
