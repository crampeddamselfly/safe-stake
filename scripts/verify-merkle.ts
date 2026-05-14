#!/usr/bin/env tsx
import { readFile } from "node:fs/promises"
import { isAddress, isHex } from "viem"

type Drop = {
  root: string
  claims: Record<string, { cumulativeAmount: string; proof: string[] }>
}

async function main() {
  const path = process.argv[2]
  if (!path) {
    console.error("usage: tsx scripts/verify-merkle.ts <path-to-drop.json>")
    process.exit(1)
  }
  const raw = await readFile(path, "utf8")
  const drop = JSON.parse(raw) as Drop

  if (!isHex(drop.root)) throw new Error("root is not a hex string")
  let count = 0
  for (const [addr, entry] of Object.entries(drop.claims)) {
    if (!isAddress(addr)) throw new Error(`Bad address: ${addr}`)
    if (!/^\d+$/.test(entry.cumulativeAmount))
      throw new Error(`Bad cumulativeAmount for ${addr}`)
    if (!entry.proof.every(isHex)) throw new Error(`Bad proof for ${addr}`)
    count++
  }
  console.log(`OK — root ${drop.root}, ${count} claims.`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
