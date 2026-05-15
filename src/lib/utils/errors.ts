// Friendly mapping for custom errors emitted by the Safenet contracts.
// Mirrors errors from `stakingAbi` + `merkleDropAbi` + `erc20Abi`.

const MAP: Record<string, string> = {
  InvalidAmount: "Amount must be greater than zero.",
  NotValidator: "This validator is not registered.",
  InsufficientStake: "You don't have enough stake with that validator.",
  WithdrawalQueueEmpty: "No withdrawals in queue.",
  NoClaimableWithdrawal: "No withdrawal is ready to claim yet.",
  InvalidAddress: "Invalid address.",
  InvalidProof: "Reward proof is invalid for this address.",
  NothingToClaim: "No rewards available to claim.",
  MerkleRootWasUpdated: "Reward data is stale — reload and try again."
}

export function formatContractError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err)
  for (const [key, friendly] of Object.entries(MAP)) {
    if (msg.includes(key)) return friendly
  }
  // User-rejected signature
  if (/user rejected|user denied|rejected the request/i.test(msg)) {
    return "Signature rejected in wallet."
  }
  // Trim viem's noisy stacks; keep first sentence.
  const first = msg.split("\n")[0] ?? msg
  return first.length > 220 ? `${first.slice(0, 217)}…` : first
}
