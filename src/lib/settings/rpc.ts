import { writable, get, type Writable } from "svelte/store"
import { browser } from "$app/environment"

const KEY = "safe-stake.rpcOverrides"

// Per-chain RPC URL overrides set by the user from the UI. Read precedence:
//   1. localStorage (this store)
//   2. VITE_RPC_URL_<chainId> env var
//   3. spec rpcUrl
//   4. viem default

type Overrides = Record<number, string>

function load(): Overrides {
  if (!browser) return {}
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as Overrides) : {}
  } catch {
    return {}
  }
}

export const rpcOverrides: Writable<Overrides> = writable(load())

if (browser) {
  rpcOverrides.subscribe((v) => {
    try {
      localStorage.setItem(KEY, JSON.stringify(v))
    } catch {
      // quota / private mode — non-fatal
    }
  })
}

export function setRpcOverride(chainId: number, url: string | undefined) {
  rpcOverrides.update((cur) => {
    const next = { ...cur }
    if (!url) delete next[chainId]
    else next[chainId] = url
    return next
  })
}

export function getRpcOverride(chainId: number): string | undefined {
  return get(rpcOverrides)[chainId]
}
