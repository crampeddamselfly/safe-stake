import { createPublicClient, http, type PublicClient } from "viem"
import { getChain } from "./chains"

const clients: Record<number, PublicClient> = {}

export function getPublicClient(chainId: number): PublicClient {
  const cached = clients[chainId]
  if (cached) return cached
  const chain = getChain(chainId)
  const client = createPublicClient({ chain, transport: http() })
  clients[chainId] = client
  return client
}
