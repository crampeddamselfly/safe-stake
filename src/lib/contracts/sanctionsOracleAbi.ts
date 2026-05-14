import { parseAbi } from "viem"

// Vendored from safe-fndn/safenet-staking-ui src/abi/sanctionsOracleAbi.ts (MIT).
export const sanctionsOracleAbi = parseAbi([
  "function isSanctioned(address addr) external view returns (bool)"
])
