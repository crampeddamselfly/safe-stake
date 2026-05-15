#!/usr/bin/env tsx
// Read-only Sepolia smoke check: verifies every contract read path used by the UI
// answers correctly against the addresses in config/safe-staking-sepolia.denna-spec.json.
//
// Usage:
//   bunx dotenv -e .env.local -- tsx scripts/sepolia-smoke.ts
//   # or
//   SEPOLIA_E2E_PRIVATE_KEY=0x... bunx tsx scripts/sepolia-smoke.ts
//
// Requires SEPOLIA_E2E_PRIVATE_KEY (test wallet). Optional VITE_RPC_URL_11155111.

import { existsSync, readFileSync } from "node:fs"
import { join } from "node:path"
import { createPublicClient as makeClient, formatUnits, http, parseAbi, type Hex } from "viem"
import { privateKeyToAccount } from "viem/accounts"
import { sepolia } from "viem/chains"

// Minimal .env.local loader so the script works without dotenv installed.
const envPath = join(process.cwd(), ".env.local")
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/)
    if (m && !process.env[m[1]!]) process.env[m[1]!] = m[2]!.replace(/^['"]|['"]$/g, "")
  }
}

const PK = process.env.SEPOLIA_E2E_PRIVATE_KEY as Hex | undefined
if (!PK) {
  console.error("SEPOLIA_E2E_PRIVATE_KEY missing in env. Put it in .env.local.")
  process.exit(1)
}

type AddressRegistry = {
  addresses: Record<
    string,
    { entries: { chain: string; address: { value: Hex } }[] }
  >
}
type StakingUiConfig = {
  chains: {
    chain: string
    chainId: number
    validators: { address: { value: Hex }; name: string }[]
  }[]
}

const addressRegistry = JSON.parse(
  readFileSync(join(process.cwd(), "config/safenet-contracts.denna-spec.json"), "utf8")
) as AddressRegistry
const stakingUi = JSON.parse(
  readFileSync(join(process.cwd(), "config/safe-stake-ui.denna-spec.json"), "utf8")
) as StakingUiConfig

const CHAIN = "sepolia"
function lookup(name: string): Hex {
  const group = addressRegistry.addresses[name]
  if (!group) throw new Error(`missing address group ${name}`)
  const entry = group.entries.find((e) => e.chain === CHAIN)
  if (!entry) throw new Error(`missing ${name} for chain ${CHAIN}`)
  return entry.address.value
}

const cfg = {
  contracts: {
    staking: { value: lookup("staking") },
    safeToken: { value: lookup("safeToken") }
  },
  validators:
    stakingUi.chains.find((c) => c.chain === CHAIN)?.validators ?? []
}

const rpcUrl = process.env.VITE_RPC_URL_11155111 ?? sepolia.rpcUrls.default.http[0]
const client = makeClient({ chain: sepolia, transport: http(rpcUrl) })
const account = privateKeyToAccount(PK)

const stakingAbi = parseAbi([
  "function SAFE_TOKEN() view returns (address)",
  "function totalStakedAmount() view returns (uint256)",
  "function withdrawDelay() view returns (uint128)",
  "function isValidator(address) view returns (bool)",
  "function totalStakerStakes(address) view returns (uint256)",
  "function getPendingWithdrawals(address) view returns ((uint256 amount, uint256 claimableAt)[])"
])
const erc20Abi = parseAbi([
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function balanceOf(address) view returns (uint256)",
  "function allowance(address,address) view returns (uint256)"
])

function ok(label: string, val: unknown) {
  console.log(`  ✓ ${label.padEnd(28)} ${val}`)
}
function bad(label: string, err: unknown) {
  console.error(`  ✗ ${label.padEnd(28)} ${err instanceof Error ? err.message : err}`)
}

async function main() {
  console.log(`Sepolia RPC: ${rpcUrl}`)
  console.log(`Test wallet: ${account.address}`)
  console.log("")

  const block = await client.getBlockNumber()
  ok("blockNumber", block.toString())

  let failures = 0

  // SAFE token reads
  console.log("\nSAFE token")
  try {
    const sym = await client.readContract({
      address: cfg.contracts.safeToken.value,
      abi: erc20Abi,
      functionName: "symbol"
    })
    ok("symbol", sym)
  } catch (e) {
    bad("symbol", e)
    failures++
  }
  try {
    const dec = await client.readContract({
      address: cfg.contracts.safeToken.value,
      abi: erc20Abi,
      functionName: "decimals"
    })
    ok("decimals", dec)
  } catch (e) {
    bad("decimals", e)
    failures++
  }
  try {
    const bal = (await client.readContract({
      address: cfg.contracts.safeToken.value,
      abi: erc20Abi,
      functionName: "balanceOf",
      args: [account.address]
    })) as bigint
    ok("balanceOf(test wallet)", `${formatUnits(bal, 18)} SAFE`)
  } catch (e) {
    bad("balanceOf", e)
    failures++
  }
  try {
    const allowance = (await client.readContract({
      address: cfg.contracts.safeToken.value,
      abi: erc20Abi,
      functionName: "allowance",
      args: [account.address, cfg.contracts.staking.value]
    })) as bigint
    ok("allowance(test wallet → staking)", `${formatUnits(allowance, 18)} SAFE`)
  } catch (e) {
    bad("allowance", e)
    failures++
  }

  // Staking reads
  console.log("\nStaking contract")
  try {
    const safeRef = await client.readContract({
      address: cfg.contracts.staking.value,
      abi: stakingAbi,
      functionName: "SAFE_TOKEN"
    })
    ok("SAFE_TOKEN()", safeRef)
    if (safeRef.toLowerCase() !== cfg.contracts.safeToken.value.toLowerCase()) {
      console.error(
        `  ✗ Mismatch: staking SAFE_TOKEN ${safeRef} vs config ${cfg.contracts.safeToken.value}`
      )
      failures++
    }
  } catch (e) {
    bad("SAFE_TOKEN", e)
    failures++
  }
  try {
    const total = (await client.readContract({
      address: cfg.contracts.staking.value,
      abi: stakingAbi,
      functionName: "totalStakedAmount"
    })) as bigint
    ok("totalStakedAmount", `${formatUnits(total, 18)} SAFE`)
  } catch (e) {
    bad("totalStakedAmount", e)
    failures++
  }
  try {
    const delay = (await client.readContract({
      address: cfg.contracts.staking.value,
      abi: stakingAbi,
      functionName: "withdrawDelay"
    })) as bigint
    ok("withdrawDelay", `${delay}s (${(Number(delay) / 86400).toFixed(2)}d)`)
  } catch (e) {
    bad("withdrawDelay", e)
    failures++
  }
  try {
    const myStake = (await client.readContract({
      address: cfg.contracts.staking.value,
      abi: stakingAbi,
      functionName: "totalStakerStakes",
      args: [account.address]
    })) as bigint
    ok("totalStakerStakes(test)", `${formatUnits(myStake, 18)} SAFE`)
  } catch (e) {
    bad("totalStakerStakes", e)
    failures++
  }
  try {
    const queue = (await client.readContract({
      address: cfg.contracts.staking.value,
      abi: stakingAbi,
      functionName: "getPendingWithdrawals",
      args: [account.address]
    })) as readonly { amount: bigint; claimableAt: bigint }[]
    ok("getPendingWithdrawals", `${queue.length} entries`)
  } catch (e) {
    bad("getPendingWithdrawals", e)
    failures++
  }

  // Validator presence
  console.log("\nValidator probes")
  if (cfg.validators.length === 0) {
    console.log("  (no validators in spec yet — skipping)")
  } else {
    for (const v of cfg.validators) {
      try {
        const reg = (await client.readContract({
          address: cfg.contracts.staking.value,
          abi: stakingAbi,
          functionName: "isValidator",
          args: [v.address.value]
        })) as boolean
        ok(`isValidator(${v.name})`, reg ? "yes" : "NO")
        if (!reg) failures++
      } catch (e) {
        bad(`isValidator(${v.name})`, e)
        failures++
      }
    }
  }

  // Discover registered validators from ValidatorUpdated events.
  // Public Sepolia RPC caps eth_getLogs at 1000 blocks per call, so paginate.
  console.log("\nDiscover validators from ValidatorUpdated events")
  try {
    const span = 1000n
    const lookback = 200_000n
    const start = block > lookback ? block - lookback : 0n
    const seen = new Map<Hex, boolean>()
    let scannedRanges = 0
    let totalEvents = 0
    for (let from = start; from <= block; from += span) {
      const to = from + span - 1n > block ? block : from + span - 1n
      try {
        const logs = await client.getContractEvents({
          address: cfg.contracts.staking.value,
          abi: parseAbi([
            "event ValidatorUpdated(address indexed validator, bool isRegistered)"
          ]),
          eventName: "ValidatorUpdated",
          fromBlock: from,
          toBlock: to
        })
        scannedRanges++
        totalEvents += logs.length
        for (const l of logs) {
          if (l.args.validator !== undefined && l.args.isRegistered !== undefined) {
            seen.set(l.args.validator, l.args.isRegistered)
          }
        }
      } catch {
        // ignore single-window failures
      }
    }
    console.log(
      `  scanned ${scannedRanges} windows over blocks ${start}..${block}: ${totalEvents} events, ${seen.size} unique addresses`
    )
    const registered = [...seen.entries()].filter(([, ok]) => ok).map(([a]) => a)
    console.log(`  ${registered.length} currently registered:`)
    for (const v of registered.slice(0, 10)) console.log(`    ${v}`)
    if (registered.length > 10) console.log(`    … (${registered.length - 10} more)`)
  } catch (e) {
    bad("ValidatorUpdated logs", e)
  }

  console.log("")
  if (failures === 0) {
    console.log("✓ All Sepolia reads succeeded.")
    process.exit(0)
  } else {
    console.error(`✗ ${failures} failure(s).`)
    process.exit(1)
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
