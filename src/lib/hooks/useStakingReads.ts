import { derived } from "svelte/store"
import { createQuery } from "@tanstack/svelte-query"
import type { Address } from "viem"
import { getPublicClient } from "$lib/chain/clients"
import { getConfig } from "$lib/spec/loader"
import { stakingAbi } from "$lib/contracts/stakingAbi"
import { erc20Abi } from "$lib/contracts/erc20Abi"
import { account, chainId } from "$lib/wallet/appkit"
import type { ValidatorEntry } from "$lib/spec/schema"

const REFRESH_MS = 15_000

type AccountChain = { address?: Address; chainId: number }

const accountChain = derived([account, chainId], ([$a, $c]) => ({
  address: $a.address,
  chainId: $c
}))

function key(name: string, ac: AccountChain) {
  return [name, ac.chainId, ac.address ?? null] as const
}

export function stakedBalanceQuery() {
  return createQuery(
    derived(accountChain, (ac) => ({
      queryKey: key("stakedBalance", ac),
      queryFn: async (): Promise<bigint> => {
        if (!ac.address) return 0n
        const cfg = getConfig(ac.chainId)
        return getPublicClient(ac.chainId).readContract({
          address: cfg.contracts.staking,
          abi: stakingAbi,
          functionName: "totalStakerStakes",
          args: [ac.address]
        })
      },
      enabled: !!ac.address,
      refetchInterval: REFRESH_MS
    }))
  )
}

export function safeBalanceQuery() {
  return createQuery(
    derived(accountChain, (ac) => ({
      queryKey: key("safeBalance", ac),
      queryFn: async (): Promise<bigint> => {
        if (!ac.address) return 0n
        const cfg = getConfig(ac.chainId)
        return getPublicClient(ac.chainId).readContract({
          address: cfg.contracts.safeToken,
          abi: erc20Abi,
          functionName: "balanceOf",
          args: [ac.address]
        })
      },
      enabled: !!ac.address,
      refetchInterval: REFRESH_MS
    }))
  )
}

export function allowanceQuery() {
  return createQuery(
    derived(accountChain, (ac) => ({
      queryKey: key("allowance", ac),
      queryFn: async (): Promise<bigint> => {
        if (!ac.address) return 0n
        const cfg = getConfig(ac.chainId)
        return getPublicClient(ac.chainId).readContract({
          address: cfg.contracts.safeToken,
          abi: erc20Abi,
          functionName: "allowance",
          args: [ac.address, cfg.contracts.staking]
        })
      },
      enabled: !!ac.address,
      refetchInterval: REFRESH_MS
    }))
  )
}

export type PendingWithdrawal = {
  amount: bigint
  claimableAt: bigint
}

export function pendingWithdrawalsQuery() {
  return createQuery(
    derived(accountChain, (ac) => ({
      queryKey: key("pendingWithdrawals", ac),
      queryFn: async (): Promise<readonly PendingWithdrawal[]> => {
        if (!ac.address) return []
        const cfg = getConfig(ac.chainId)
        return getPublicClient(ac.chainId).readContract({
          address: cfg.contracts.staking,
          abi: stakingAbi,
          functionName: "getPendingWithdrawals",
          args: [ac.address]
        })
      },
      enabled: !!ac.address,
      refetchInterval: REFRESH_MS
    }))
  )
}

export function nextClaimableQuery() {
  return createQuery(
    derived(accountChain, (ac) => ({
      queryKey: key("nextClaimable", ac),
      queryFn: async (): Promise<{ amount: bigint; claimableAt: bigint }> => {
        if (!ac.address) return { amount: 0n, claimableAt: 0n }
        const cfg = getConfig(ac.chainId)
        const [amount, claimableAt] = (await getPublicClient(ac.chainId).readContract({
          address: cfg.contracts.staking,
          abi: stakingAbi,
          functionName: "getNextClaimableWithdrawal",
          args: [ac.address]
        })) as readonly [bigint, bigint]
        return { amount, claimableAt }
      },
      enabled: !!ac.address,
      refetchInterval: REFRESH_MS
    }))
  )
}

export function withdrawDelayQuery() {
  return createQuery(
    derived(chainId, ($c) => ({
      queryKey: ["withdrawDelay", $c] as const,
      queryFn: async (): Promise<bigint> => {
        const cfg = getConfig($c)
        return getPublicClient($c).readContract({
          address: cfg.contracts.staking,
          abi: stakingAbi,
          functionName: "withdrawDelay"
        })
      },
      refetchInterval: REFRESH_MS * 4
    }))
  )
}

export function totalStakedQuery() {
  return createQuery(
    derived(chainId, ($c) => ({
      queryKey: ["totalStaked", $c] as const,
      queryFn: async (): Promise<bigint> => {
        const cfg = getConfig($c)
        return getPublicClient($c).readContract({
          address: cfg.contracts.staking,
          abi: stakingAbi,
          functionName: "totalStakedAmount"
        })
      },
      refetchInterval: REFRESH_MS * 2
    }))
  )
}

export type ValidatorRow = ValidatorEntry & {
  totalStaked: bigint
  isRegistered: boolean
  participationRateBps?: number
  isActive?: boolean
}

export function validatorsQuery() {
  return createQuery(
    derived(chainId, ($c) => ({
      queryKey: ["validators", $c] as const,
      queryFn: async (): Promise<ValidatorRow[]> => {
        const cfg = getConfig($c)
        const client = getPublicClient($c)
        if (cfg.validators.length === 0) return []

        // Some public RPCs reject multicall3, and some chains have it at a
        // non-default address. Try multicall first; fall back to parallel
        // single reads on any failure so the page never goes empty.
        try {
          const calls = cfg.validators.flatMap((v) => [
            {
              address: cfg.contracts.staking,
              abi: stakingAbi,
              functionName: "isValidator" as const,
              args: [v.address.value] as const
            },
            {
              address: cfg.contracts.staking,
              abi: stakingAbi,
              functionName: "totalValidatorStakes" as const,
              args: [v.address.value] as const
            }
          ])
          const results = await client.multicall({ contracts: calls, allowFailure: true })
          return cfg.validators.map((v, i) => {
            const isRegResult = results[i * 2]
            const stakeResult = results[i * 2 + 1]
            return {
              ...v,
              isRegistered:
                isRegResult?.status === "success" ? (isRegResult.result as boolean) : false,
              totalStaked:
                stakeResult?.status === "success" ? (stakeResult.result as bigint) : 0n
            }
          })
        } catch {
          const settled = await Promise.all(
            cfg.validators.map(async (v) => {
              const [reg, stake] = await Promise.allSettled([
                client.readContract({
                  address: cfg.contracts.staking,
                  abi: stakingAbi,
                  functionName: "isValidator",
                  args: [v.address.value]
                }),
                client.readContract({
                  address: cfg.contracts.staking,
                  abi: stakingAbi,
                  functionName: "totalValidatorStakes",
                  args: [v.address.value]
                })
              ])
              return {
                ...v,
                isRegistered: reg.status === "fulfilled" ? (reg.value as boolean) : false,
                totalStaked: stake.status === "fulfilled" ? (stake.value as bigint) : 0n
              } as ValidatorRow
            })
          )
          return settled
        }
      },
      refetchInterval: REFRESH_MS * 2
    }))
  )
}
