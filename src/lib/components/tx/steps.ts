import type { TxStep } from "$lib/hooks/useStakingWrites"

export type StepStatus = "pending" | "active" | "complete" | "error"

export type StepDef = {
  id: string
  label: string
  description: string
  activeOn: TxStep[]
  completeAfter: TxStep[]
}

export type TxFlow =
  | "stake"
  | "stake-batched"
  | "unstake"
  | "claim-withdrawal"
  | "claim-rewards"

const stepIdle: TxStep = "idle"

const stakeApproveSteps: StepDef[] = [
  {
    id: "approve",
    label: "Approve SAFE",
    description: "Allow the staking contract to move your SAFE",
    activeOn: ["validating", "checking-allowance", "awaiting-approval-sig", "confirming-approval"],
    completeAfter: ["awaiting-stake-sig", "confirming-stake", "done"]
  },
  {
    id: "stake",
    label: "Stake to validator",
    description: "Deposit SAFE into the staking contract",
    activeOn: ["awaiting-stake-sig", "confirming-stake"],
    completeAfter: ["done"]
  }
]

const stakeBatchedSteps: StepDef[] = [
  {
    id: "batch",
    label: "Approve + stake (batched)",
    description: "Single Safe transaction batches approval and stake",
    activeOn: ["awaiting-batch-sig", "confirming-batch"],
    completeAfter: ["done"]
  }
]

const unstakeSteps: StepDef[] = [
  {
    id: "unstake",
    label: "Initiate withdrawal",
    description: "Queue your stake for the cooldown period",
    activeOn: ["validating", "awaiting-unstake-sig", "confirming-unstake"],
    completeAfter: ["done"]
  }
]

const claimWithdrawalSteps: StepDef[] = [
  {
    id: "claim",
    label: "Claim withdrawal",
    description: "Pop the next ready entry from the cooldown queue",
    activeOn: ["awaiting-claim-sig", "confirming-claim"],
    completeAfter: ["done"]
  }
]

const claimRewardsSteps: StepDef[] = [
  {
    id: "rewards",
    label: "Claim rewards",
    description: "Verify Merkle proof and transfer SAFE to your wallet",
    activeOn: ["awaiting-rewards-sig", "confirming-rewards"],
    completeAfter: ["done"]
  }
]

export function stepsFor(flow: TxFlow): StepDef[] {
  switch (flow) {
    case "stake":
      return stakeApproveSteps
    case "stake-batched":
      return stakeBatchedSteps
    case "unstake":
      return unstakeSteps
    case "claim-withdrawal":
      return claimWithdrawalSteps
    case "claim-rewards":
      return claimRewardsSteps
  }
}

export function statusFor(
  step: StepDef,
  current: TxStep,
  hasError: boolean
): StepStatus {
  if (current === stepIdle) return "pending"
  if (step.completeAfter.includes(current)) return "complete"
  if (step.activeOn.includes(current)) return hasError ? "error" : "active"
  return "pending"
}

// Short label for primary CTA / button. Maps every TxStep to the line the
// user should read while their wallet is open.
export function buttonLabel(step: TxStep, flow: TxFlow, fallback: string): string {
  switch (step) {
    case "validating":
      return "Preparing…"
    case "checking-allowance":
      return "Checking allowance…"
    case "awaiting-approval-sig":
      return "Confirm approval in wallet…"
    case "confirming-approval":
      return "Approval pending…"
    case "awaiting-stake-sig":
      return "Confirm stake in wallet…"
    case "confirming-stake":
      return "Stake pending…"
    case "awaiting-batch-sig":
      return "Confirm batch in wallet…"
    case "confirming-batch":
      return "Batch pending…"
    case "awaiting-unstake-sig":
      return "Confirm withdrawal in wallet…"
    case "confirming-unstake":
      return "Withdrawal pending…"
    case "awaiting-claim-sig":
      return "Confirm claim in wallet…"
    case "confirming-claim":
      return "Claim pending…"
    case "awaiting-rewards-sig":
      return "Confirm rewards claim in wallet…"
    case "confirming-rewards":
      return "Rewards claim pending…"
    case "done":
      return "Done"
    case "error":
      return "Retry"
    case "idle":
    default:
      return fallback
  }
}
