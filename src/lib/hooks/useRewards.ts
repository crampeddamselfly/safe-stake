import { derived } from "svelte/store"
import { createQuery } from "@tanstack/svelte-query"
import { getAddress, type Hex } from "viem"
import { merkleDropAbi } from "$lib/contracts/merkleDropAbi"
import { getPublicClient } from "$lib/chain/clients"
import { getConfig } from "$lib/spec/loader"
import { account, chainId } from "$lib/wallet/appkit"

export type MerkleClaim = {
  cumulativeAmount: string
  proof: Hex[]
}
export type MerkleDrop = {
  root: Hex
  claims: Record<string, MerkleClaim>
}

export type RewardState = {
  hasDrop: boolean
  cumulativeAllocated: bigint
  cumulativeClaimed: bigint
  claimable: bigint
  root?: Hex
  proof?: Hex[]
  cumulativeAmount?: bigint
}

export function rewardsQuery() {
  return createQuery(
    derived([account, chainId], ([$a, $c]) => ({
      queryKey: ["rewards", $c, $a.address ?? null] as const,
      queryFn: async (): Promise<RewardState> => {
        const empty: RewardState = {
          hasDrop: false,
          cumulativeAllocated: 0n,
          cumulativeClaimed: 0n,
          claimable: 0n
        }
        if (!$a.address) return empty
        const cfg = getConfig($c)
        const url = cfg.rewards?.merkleJsonUrl
        const drop = cfg.contracts.merkleDrop
        if (!url || !drop) return empty

        const res = await fetch(url)
        if (!res.ok) throw new Error(`Failed to fetch reward proofs: ${res.status}`)
        const data = (await res.json()) as MerkleDrop
        const normalized = getAddress($a.address)
        const entry =
          data.claims[normalized] ??
          data.claims[$a.address.toLowerCase()] ??
          data.claims[$a.address]
        if (!entry) {
          return {
            hasDrop: true,
            cumulativeAllocated: 0n,
            cumulativeClaimed: 0n,
            claimable: 0n,
            root: data.root
          }
        }
        const cumulative = BigInt(entry.cumulativeAmount)
        const claimed = await getPublicClient($c).readContract({
          address: drop,
          abi: merkleDropAbi,
          functionName: "cumulativeClaimed",
          args: [$a.address]
        })
        return {
          hasDrop: true,
          cumulativeAllocated: cumulative,
          cumulativeClaimed: claimed,
          claimable: cumulative > claimed ? cumulative - claimed : 0n,
          root: data.root,
          proof: entry.proof,
          cumulativeAmount: cumulative
        }
      },
      enabled: !!$a.address,
      staleTime: 60_000,
      refetchInterval: 60_000
    }))
  )
}

// claimRewards moved to useStakingWrites.ts so it shares the granular onStep
// reporter used by stake / unstake / claim flows.
export { claimRewards } from "./useStakingWrites"
