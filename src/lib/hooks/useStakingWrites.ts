import {
  getWalletClient,
  readContract,
  waitForTransactionReceipt,
  writeContract
} from "@wagmi/core"
import { encodeFunctionData, type Address } from "viem"
import { eip5792Actions } from "viem/experimental"
import { erc20Abi } from "$lib/contracts/erc20Abi"
import { stakingAbi } from "$lib/contracts/stakingAbi"
import { getConfig } from "$lib/spec/loader"
import { getWagmiConfig } from "$lib/wallet/appkit"
import { merkleDropAbi } from "$lib/contracts/merkleDropAbi"

// Granular wallet-flow step. Each label maps to a single user-facing line
// in the progress UI so users always know what their wallet is asking for.
export type TxStep =
  | "idle"
  | "validating"
  | "checking-allowance"
  // approve+stake (two-tx path)
  | "awaiting-approval-sig"
  | "confirming-approval"
  | "awaiting-stake-sig"
  | "confirming-stake"
  // EIP-5792 batched path (single sig)
  | "awaiting-batch-sig"
  | "confirming-batch"
  // unstake
  | "awaiting-unstake-sig"
  | "confirming-unstake"
  // claim queued withdrawal
  | "awaiting-claim-sig"
  | "confirming-claim"
  // rewards
  | "awaiting-rewards-sig"
  | "confirming-rewards"
  | "done"
  | "error"

export type WriteResult = {
  hash: `0x${string}`
  receipt: Awaited<ReturnType<typeof waitForTransactionReceipt>>
}

type Eip5792Client = {
  getCapabilities: () => Promise<Record<number, { atomicBatch?: { supported?: boolean } }>>
  sendCalls: (args: { calls: { to: Address; data: `0x${string}` }[] }) => Promise<{ id: string }>
  getCallsStatus: (args: { id: string }) => Promise<{
    status: "PENDING" | "CONFIRMED" | "FAILED"
    receipts?: { transactionHash: `0x${string}` }[]
  }>
}

async function tryBatchApproveAndStake(
  chainId: number,
  validator: Address,
  amount: bigint,
  onStep: (s: TxStep) => void
): Promise<WriteResult | null> {
  const cfg = getConfig(chainId)
  if (!cfg.features.eip5792Batch) return null

  const wagmiConfig = getWagmiConfig()
  const raw = await getWalletClient(wagmiConfig, { chainId })
  if (!raw) return null
  type Extendable = { extend: (fn: ReturnType<typeof eip5792Actions>) => Eip5792Client }
  const client = (raw as unknown as Extendable).extend(eip5792Actions())

  let caps: Record<number, { atomicBatch?: { supported?: boolean } }>
  try {
    caps = await client.getCapabilities()
  } catch {
    return null
  }
  if (!caps[chainId]?.atomicBatch?.supported) return null

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

  onStep("awaiting-batch-sig")
  const { id } = await client.sendCalls({
    calls: [
      { to: cfg.contracts.safeToken, data: approveData },
      { to: cfg.contracts.staking, data: stakeData }
    ]
  })
  onStep("confirming-batch")

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
  account: Address,
  validator: Address,
  amount: bigint,
  onStep: (s: TxStep) => void
): Promise<WriteResult> {
  const cfg = getConfig(chainId)
  const wagmiConfig = getWagmiConfig()

  onStep("validating")
  if (amount <= 0n) throw new Error("InvalidAmount")

  // Try single-sig batched path first (Safe wallets).
  const batched = await tryBatchApproveAndStake(chainId, validator, amount, onStep)
  if (batched) {
    onStep("done")
    return batched
  }

  // Two-tx path. Skip approve if existing allowance covers it.
  onStep("checking-allowance")
  const current = (await readContract(wagmiConfig, {
    address: cfg.contracts.safeToken,
    abi: erc20Abi,
    functionName: "allowance",
    args: [account, cfg.contracts.staking]
  })) as bigint

  if (current < amount) {
    onStep("awaiting-approval-sig")
    const approveHash = await writeContract(wagmiConfig, {
      address: cfg.contracts.safeToken,
      abi: erc20Abi,
      functionName: "approve",
      args: [cfg.contracts.staking, amount]
    })
    onStep("confirming-approval")
    await waitForTransactionReceipt(wagmiConfig, { hash: approveHash, chainId })
  }

  onStep("awaiting-stake-sig")
  const stakeHash = await writeContract(wagmiConfig, {
    address: cfg.contracts.staking,
    abi: stakingAbi,
    functionName: "stake",
    args: [validator, amount]
  })
  onStep("confirming-stake")
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
  amount: bigint,
  onStep: (s: TxStep) => void
): Promise<WriteResult> {
  const cfg = getConfig(chainId)
  const wagmiConfig = getWagmiConfig()

  onStep("validating")
  if (amount <= 0n) throw new Error("InvalidAmount")

  onStep("awaiting-unstake-sig")
  const hash = await writeContract(wagmiConfig, {
    address: cfg.contracts.staking,
    abi: stakingAbi,
    functionName: "initiateWithdrawal",
    args: [validator, amount]
  })
  onStep("confirming-unstake")
  const receipt = await waitForTransactionReceipt(wagmiConfig, { hash, chainId })
  onStep("done")
  return { hash, receipt }
}

export async function claimWithdrawal(
  chainId: number,
  onStep: (s: TxStep) => void
): Promise<WriteResult> {
  const cfg = getConfig(chainId)
  const wagmiConfig = getWagmiConfig()

  onStep("awaiting-claim-sig")
  const hash = await writeContract(wagmiConfig, {
    address: cfg.contracts.staking,
    abi: stakingAbi,
    functionName: "claimWithdrawal"
  })
  onStep("confirming-claim")
  const receipt = await waitForTransactionReceipt(wagmiConfig, { hash, chainId })
  onStep("done")
  return { hash, receipt }
}

export async function claimRewards(
  chainId: number,
  account: Address,
  cumulativeAmount: bigint,
  root: `0x${string}`,
  proof: `0x${string}`[],
  onStep: (s: TxStep) => void
): Promise<WriteResult> {
  const cfg = getConfig(chainId)
  if (!cfg.contracts.merkleDrop) throw new Error("MerkleDrop not configured for this chain.")
  const wagmiConfig = getWagmiConfig()

  onStep("awaiting-rewards-sig")
  const hash = await writeContract(wagmiConfig, {
    address: cfg.contracts.merkleDrop,
    abi: merkleDropAbi,
    functionName: "claim",
    args: [account, cumulativeAmount, root, proof]
  })
  onStep("confirming-rewards")
  const receipt = await waitForTransactionReceipt(wagmiConfig, { hash, chainId })
  onStep("done")
  return { hash, receipt }
}
