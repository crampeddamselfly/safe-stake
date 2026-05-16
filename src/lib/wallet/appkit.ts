import { createAppKit, type AppKit } from "@reown/appkit"
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi"
import { mainnet } from "@reown/appkit/networks"
import type { AppKitNetwork } from "@reown/appkit/networks"
import { watchAccount, watchChainId } from "@wagmi/core"
import { writable, type Readable } from "svelte/store"
import type { Address } from "viem"

const projectId = import.meta.env.VITE_REOWN_PROJECT_ID as string | undefined

const networks: [AppKitNetwork, ...AppKitNetwork[]] = [mainnet]

type AccountState = {
  address?: Address
  isConnected: boolean
  status: "disconnected" | "connecting" | "connected" | "reconnecting"
}

const accountWritable = writable<AccountState>({
  isConnected: false,
  status: "disconnected"
})

const chainIdWritable = writable<number>(mainnet.id)

let initialized = false
let appkit: AppKit | undefined
let wagmiAdapter: WagmiAdapter | undefined

export function initAppKit(): void {
  if (initialized) return
  if (!projectId) {
    console.warn(
      "[appkit] VITE_REOWN_PROJECT_ID missing — wallet UI disabled. Create one at https://cloud.reown.com."
    )
    return
  }
  wagmiAdapter = new WagmiAdapter({ projectId, networks })

  appkit = createAppKit({
    adapters: [wagmiAdapter],
    networks,
    projectId,
    metadata: {
      name: "Safe Stake — Denna Labs",
      description: "Independent non-custodial staking UI for Safenet Beta.",
      url: import.meta.env.VITE_SITE_ORIGIN ?? "https://safenet-staking.denna.eth.limo",
      icons: []
    },
    features: { analytics: false, email: false, socials: false }
  })

  watchAccount(wagmiAdapter.wagmiConfig, {
    onChange(data) {
      accountWritable.set({
        address: data.address as Address | undefined,
        isConnected: data.isConnected,
        status: data.status
      })
    }
  })
  watchChainId(wagmiAdapter.wagmiConfig, {
    onChange(id) {
      chainIdWritable.set(id)
    }
  })

  initialized = true
}

export function getWagmiConfig() {
  if (!wagmiAdapter) {
    throw new Error("AppKit not initialized — call initAppKit() in +layout.svelte first.")
  }
  return wagmiAdapter.wagmiConfig
}

export function openModal(): void {
  appkit?.open()
}

export function disconnect(): void {
  appkit?.disconnect()
}

export const account: Readable<AccountState> = accountWritable
export const chainId: Readable<number> = chainIdWritable
