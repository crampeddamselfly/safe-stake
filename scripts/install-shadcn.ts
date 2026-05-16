#!/usr/bin/env tsx
// One-shot installer for shadcn-svelte components, since the interactive CLI
// doesn't play nicely with Bun's TTY. Fetches each component JSON from the
// registry and writes the contained files into src/lib/components/ui/.

import { mkdirSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"

const COMPONENTS = [
  "utils",
  "button",
  "card",
  "dialog",
  "input",
  "label",
  "badge",
  "tabs",
  "tooltip",
  "sheet",
  "sonner",
  "skeleton",
  "alert",
  "separator"
]

const UTILS_ALIAS = "$lib/utils/cn"
const UI_DIR = join(process.cwd(), "src/lib/components/ui")
const REGISTRY = "https://shadcn-svelte.com/registry"

type RegistryFile = {
  content: string
  type: string
  target: string
}
type RegistryItem = {
  name: string
  files: RegistryFile[]
  registryDependencies?: string[]
}

const seen = new Set<string>()

async function install(name: string) {
  if (seen.has(name)) return
  seen.add(name)

  const res = await fetch(`${REGISTRY}/${name}.json`)
  if (!res.ok) {
    console.error(`✗ ${name}: HTTP ${res.status}`)
    return
  }
  const item = (await res.json()) as RegistryItem

  for (const dep of item.registryDependencies ?? []) {
    if (dep === "utils") continue // we have our own at $lib/utils/cn
    await install(dep)
  }

  for (const f of item.files) {
    if (f.target === "utils.ts" || f.target === "lib/utils.ts") continue
    const body = f.content.replaceAll("$UTILS$", UTILS_ALIAS)
    const abs = join(UI_DIR, f.target)
    mkdirSync(dirname(abs), { recursive: true })
    writeFileSync(abs, body)
    console.log(`  + ${f.target}`)
  }
  console.log(`✓ ${name}`)
}

async function main() {
  mkdirSync(UI_DIR, { recursive: true })
  for (const c of COMPONENTS) {
    if (c === "utils") continue
    await install(c)
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
