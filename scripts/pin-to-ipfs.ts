#!/usr/bin/env tsx
// Pin the built static SPA to Pinata.
//
// Usage:
//   bun run build && bunx tsx scripts/pin-to-ipfs.ts
//   PINATA_JWT=... bunx tsx scripts/pin-to-ipfs.ts
//
// Reads PINATA_JWT from env (or .env.local). Reads from ./build by default.
// Prints the resulting CID and Pinata gateway URL. Use the CID to set the
// ENS contenthash for safenet-staking.denna.eth.

import { existsSync, readFileSync, statSync, readdirSync } from "node:fs"
import { join, relative } from "node:path"

const envPath = join(process.cwd(), ".env.local")
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/)
    if (m && !process.env[m[1]!]) process.env[m[1]!] = m[2]!.replace(/^['"]|['"]$/g, "")
  }
}

const JWT = process.env.PINATA_JWT
if (!JWT) {
  console.error("PINATA_JWT missing. Put it in .env.local.")
  process.exit(1)
}

const BUILD = join(process.cwd(), process.argv[2] ?? "build")
if (!existsSync(BUILD)) {
  console.error(`Build directory not found: ${BUILD}`)
  console.error("Run `bun run build` first.")
  process.exit(1)
}

function walk(dir: string): string[] {
  const out: string[] = []
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) out.push(...walk(p))
    else out.push(p)
  }
  return out
}

async function main() {
  const files = walk(BUILD)
  console.log(`Pinning ${files.length} files from ${BUILD} to Pinata…`)

  const form = new FormData()
  for (const abs of files) {
    const rel = relative(BUILD, abs)
    const data = readFileSync(abs)
    // Filepath needs a wrapping segment; using "safe-stake/<rel>" makes the
    // upload group a directory. With wrapWithDirectory: false below, Pinata
    // unwraps and the resulting CID points directly at that directory, so
    // index.html lands at CID root (works with ENS contenthash + .eth.limo).
    form.append("file", new Blob([data]), `safe-stake/${rel}`)
  }
  form.append(
    "pinataMetadata",
    JSON.stringify({
      name: `safe-stake-${new Date().toISOString().slice(0, 19).replace(/:/g, "-")}`,
      keyvalues: { project: "safe-stake", operator: "denna-labs" }
    })
  )
  form.append("pinataOptions", JSON.stringify({ cidVersion: 1, wrapWithDirectory: false }))

  const res = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
    method: "POST",
    headers: { Authorization: `Bearer ${JWT}` },
    body: form
  })
  if (!res.ok) {
    const text = await res.text()
    console.error(`Pinata error ${res.status}: ${text}`)
    process.exit(1)
  }
  const json = (await res.json()) as { IpfsHash: string; PinSize: number; Timestamp: string }
  console.log("")
  console.log(`✓ Pinned`)
  console.log(`  CID:           ${json.IpfsHash}`)
  console.log(`  Size:          ${(json.PinSize / 1024).toFixed(1)} KB`)
  console.log(`  IPFS.io:       https://ipfs.io/ipfs/${json.IpfsHash}/`)
  console.log(`  CF gateway:    https://cloudflare-ipfs.com/ipfs/${json.IpfsHash}/`)
  console.log(`  .eth.limo:     once ENS is set → https://safenet-staking.denna.eth.limo`)
  console.log("")
  console.log("Note: Pinata's public gateway blocks HTML on free plan. Use ipfs.io")
  console.log("or the .eth.limo gateway after the ENS contenthash is set.")
  console.log("")
  console.log("Set ENS contenthash for safenet-staking.denna.eth:")
  console.log(`  ipfs://${json.IpfsHash}`)
  console.log("at https://app.ens.domains/safenet-staking.denna.eth")

  // Output for GH Actions
  if (process.env.GITHUB_OUTPUT) {
    const fs = await import("node:fs/promises")
    await fs.appendFile(process.env.GITHUB_OUTPUT, `cid=${json.IpfsHash}\n`)
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
