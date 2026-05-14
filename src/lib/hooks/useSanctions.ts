import { derived } from "svelte/store"
import { createQuery } from "@tanstack/svelte-query"
import { getPublicClient } from "$lib/chain/clients"
import { getConfig } from "$lib/spec/loader"
import { sanctionsOracleAbi } from "$lib/contracts/sanctionsOracleAbi"
import { account, chainId } from "$lib/wallet/appkit"

export function sanctionsQuery() {
  return createQuery(
    derived([account, chainId], ([$a, $c]) => ({
      queryKey: ["sanctioned", $c, $a.address ?? null] as const,
      queryFn: async (): Promise<boolean> => {
        if (!$a.address) return false
        const cfg = getConfig($c)
        if (!cfg.features.sanctionsGate || !cfg.contracts.sanctionsOracle) return false
        return getPublicClient($c).readContract({
          address: cfg.contracts.sanctionsOracle.value,
          abi: sanctionsOracleAbi,
          functionName: "isSanctioned",
          args: [$a.address]
        })
      },
      enabled: !!$a.address,
      staleTime: 60_000,
      refetchInterval: 60_000
    }))
  )
}
