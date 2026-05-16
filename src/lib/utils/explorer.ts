import type { Hex } from "viem"

const explorers: Record<number, string> = {
  1: "https://etherscan.io"
}

export function txUrl(chainId: number, hash: Hex): string {
  const base = explorers[chainId] ?? explorers[1]!
  return `${base}/tx/${hash}`
}

export function addressUrl(chainId: number, addr: string): string {
  const base = explorers[chainId] ?? explorers[1]!
  return `${base}/address/${addr}`
}
