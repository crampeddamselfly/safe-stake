#!/usr/bin/env tsx
import { existsSync, readFileSync } from "node:fs"
import { join } from "node:path"
import { createPublicClient, formatUnits, http, parseAbi, type Hex } from "viem"
import { mainnet } from "viem/chains"

const envPath = join(process.cwd(), ".env.local")
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/)
    if (m && !process.env[m[1]!]) process.env[m[1]!] = m[2]!.replace(/^['"]|['"]$/g, "")
  }
}

type AddressRegistry = {
  addresses: Record<string, { entries: { chain: string; address: { value: Hex } }[] }>
}
type StakingUiConfig = {
  chains: { chain: string; chainId: number; validators: { address: { value: Hex }; name: string }[] }[]
}

const addrs = JSON.parse(
  readFileSync(join(process.cwd(), "config/safenet-contracts.denna-spec.json"), "utf8")
) as AddressRegistry
const ui = JSON.parse(
  readFileSync(join(process.cwd(), "config/safe-stake-ui.denna-spec.json"), "utf8")
) as StakingUiConfig

const CHAIN = "ethereum"
const lookup = (name: string) =>
  addrs.addresses[name]!.entries.find((e) => e.chain === CHAIN)!.address.value

const staking = lookup("staking")
const validators = ui.chains.find((c) => c.chain === CHAIN)?.validators ?? []

const rpc = process.env.VITE_RPC_URL_1 ?? mainnet.rpcUrls.default.http[0]
const client = createPublicClient({ chain: mainnet, transport: http(rpc) })

const abi = parseAbi([
  "function totalStakedAmount() view returns (uint256)",
  "function isValidator(address) view returns (bool)",
  "function totalValidatorStakes(address) view returns (uint256)"
])

async function main() {
  console.log(`Mainnet RPC: ${rpc}`)
  console.log(`Staking:     ${staking}`)
  console.log("")

  const total = (await client.readContract({
    address: staking,
    abi,
    functionName: "totalStakedAmount"
  })) as bigint
  console.log(`totalStakedAmount: ${formatUnits(total, 18)} SAFE`)
  console.log("")

  // Multicall approach (what UI uses)
  console.log("Multicall — validator probes")
  try {
    const calls = validators.flatMap((v) => [
      { address: staking, abi, functionName: "isValidator" as const, args: [v.address.value] as const },
      { address: staking, abi, functionName: "totalValidatorStakes" as const, args: [v.address.value] as const }
    ])
    const results = await client.multicall({ contracts: calls, allowFailure: true })
    validators.forEach((v, i) => {
      const reg = results[i * 2]
      const stake = results[i * 2 + 1]
      const regOk = reg?.status === "success" ? (reg.result as boolean) : "FAIL"
      const stakeOk =
        stake?.status === "success" ? formatUnits(stake.result as bigint, 18) : "FAIL"
      console.log(`  ${v.name.padEnd(22)} registered=${regOk} staked=${stakeOk}`)
    })
  } catch (e) {
    console.error("Multicall failed:", e instanceof Error ? e.message : e)
    console.log("Falling back to per-call reads")
    for (const v of validators) {
      const reg = await client.readContract({
        address: staking,
        abi,
        functionName: "isValidator",
        args: [v.address.value]
      })
      const stake = await client.readContract({
        address: staking,
        abi,
        functionName: "totalValidatorStakes",
        args: [v.address.value]
      })
      console.log(`  ${v.name.padEnd(22)} registered=${reg} staked=${formatUnits(stake, 18)}`)
    }
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
