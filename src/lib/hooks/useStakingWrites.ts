import {
  getWalletClient,
  waitForTransactionReceipt,
  writeContract
} from "@wagmi/core"
import { encodeFunctionData, type Address } from "viem"
import { eip5792Actions } from "viem/experimental"
import { erc20Abi } from "$lib/contracts/erc20Abi"
import { stakingAbi } from "$lib/contracts/stakingAbi"
import { getConfig } from "$lib/spec/loader"
import { getWagmiConfig } from "$lib/wallet/appkit"

export type TxStep = "idle" | "approving" | "staking" | "confirming" | "done" | "error"

export type WriteResult = {
  hash: `0x${string}`
  receipt: Awaited<ReturnType<typeof waitForTransactionReceipt>>
}

async function tryBatchApproveAndStake(
  chainId: number,
  validator: Address,
  amount: bigint
): Promise<WriteResult | null> {
  const cfg = getConfig(chainId)
  if (!cfg.features.eip5792Batch) return null

  const wagmiConfig = getWagmiConfig()
  const raw = await getWalletClient(wagmiConfig, { chainId })
  if (!raw) return null
  type Eip5792Client = {
    getCapabilities: () => Promise<Record<number, { atomicBatch?: { supported?: boolean } }>>
    sendCalls: (args: { calls: { to: Address; data: `0x${string}` }[] }) => Promise<{ id: string }>
    getCallsStatus: (args: { id: string }) => Promise<{
      status: "PENDING" | "CONFIRMED" | "FAILED"
      receipts?: { transactionHash: `0x${string}` }[]
    }>
  }
  // Cast: wagmi's WalletClient and the eip5792 decorator have intersecting
  // generics that confuse tsc; the runtime contract is the decorator's API.
  type Extendable = { extend: (fn: ReturnType<typeof eip5792Actions>) => Eip5792Client }
  const client = (raw as unknown as Extendable).extend(eip5792Actions())

  let caps: Record<number, { atomicBatch?: { supported?: boolean } }>
  try {
    caps = await client.getCapabilities()
  } catch {
    return null
  }
  const chainCaps = caps[chainId]
  if (!chainCaps?.atomicBatch?.supported) return null

  const approveData = encodeFunctionData({
    abi: erc20Abi,
    functionName: "approve",
    args: [cfg.contracts.staking, amount]
  })
  const stakeData = encodeFunctionData({
    abi: stakingAbi,
    functionName: "stake",
    args: [validator, amount]
  })

  const { id } = await client.sendCalls({
    calls: [
      { to: cfg.contracts.safeToken, data: approveData },
      { to: cfg.contracts.staking, data: stakeData }
    ]
  })

  // Poll status; sendCalls returns an opaque id, not a tx hash, until included.
  // For Safe wallets, the user signs once in their app; receipt resolves when the
  // batched tx executes on-chain.
  let attempts = 0
  while (attempts++ < 120) {
    const status = await client.getCallsStatus({ id })
    if (status.status === "CONFIRMED" && status.receipts && status.receipts[0]) {
      const r = status.receipts[0]
      return {
        hash: r.transactionHash,
        receipt: r as unknown as Awaited<ReturnType<typeof waitForTransactionReceipt>>
      }
    }
    if (status.status === "FAILED") throw new Error("Batched call failed")
    await new Promise((res) => setTimeout(res, 2000))
  }
  throw new Error("Batched call timed out")
}

export async function approveAndStake(
  chainId: number,
  validator: Address,
  amount: bigint,
  onStep: (s: TxStep) => void
): Promise<WriteResult> {
  const cfg = getConfig(chainId)
  const wagmiConfig = getWagmiConfig()

  onStep("approving")
  const batched = await tryBatchApproveAndStake(chainId, validator, amount)
  if (batched) {
    onStep("done")
    return batched
  }

  const approveHash = await writeContract(wagmiConfig, {
    address: cfg.contracts.safeToken,
    abi: erc20Abi,
    functionName: "approve",
    args: [cfg.contracts.staking, amount]
  })
  onStep("confirming")
  await waitForTransactionReceipt(wagmiConfig, { hash: approveHash, chainId })

  onStep("staking")
  const stakeHash = await writeContract(wagmiConfig, {
    address: cfg.contracts.staking,
    abi: stakingAbi,
    functionName: "stake",
    args: [validator, amount]
  })
  onStep("confirming")
  const receipt = await waitForTransactionReceipt(wagmiConfig, {
    hash: stakeHash,
    chainId
  })
  onStep("done")
  return { hash: stakeHash, receipt }
}

export async function initiateWithdrawal(
  chainId: number,
  validator: Address,
  amount: bigint
): Promise<WriteResult> {
  const cfg = getConfig(chainId)
  const wagmiConfig = getWagmiConfig()
  const hash = await writeContract(wagmiConfig, {
    address: cfg.contracts.staking,
    abi: stakingAbi,
    functionName: "initiateWithdrawal",
    args: [validator, amount]
  })
  const receipt = await waitForTransactionReceipt(wagmiConfig, { hash, chainId })
  return { hash, receipt }
}

export async function claimWithdrawal(chainId: number): Promise<WriteResult> {
  const cfg = getConfig(chainId)
  const wagmiConfig = getWagmiConfig()
  const hash = await writeContract(wagmiConfig, {
    address: cfg.contracts.staking,
    abi: stakingAbi,
    functionName: "claimWithdrawal"
  })
  const receipt = await waitForTransactionReceipt(wagmiConfig, { hash, chainId })
  return { hash, receipt }
}
