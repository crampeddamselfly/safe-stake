<script lang="ts">
  import "../app.css"
  import { onMount } from "svelte"
  import { QueryClient, QueryClientProvider } from "@tanstack/svelte-query"
  import { initAppKit } from "$lib/wallet/appkit"
  import Toaster from "$lib/ui/Toaster.svelte"
  import ConnectButton from "$lib/ui/ConnectButton.svelte"
  import MainnetBanner from "$lib/ui/MainnetBanner.svelte"
  import SettingsDialog from "$lib/ui/SettingsDialog.svelte"
  import { page } from "$app/state"
  import { base } from "$app/paths"

  let { children } = $props()

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 10_000,
        retry: 1
      }
    }
  })

  onMount(() => {
    initAppKit()
  })

  const navItems = [
    { href: "/", label: "Stake" },
    { href: "/validators", label: "Validators" },
    { href: "/rewards", label: "Rewards" }
  ]
</script>

<QueryClientProvider client={queryClient}>
  <div class="min-h-screen">
    <MainnetBanner />
    <header class="border-b border-border bg-bg-elev/70 backdrop-blur">
      <div class="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <a href="/" class="flex items-center gap-2 text-fg" aria-label="Safenet — home">
          <img
            src="{base}/brand/safenet-logo.svg"
            alt="Safenet"
            width="109"
            height="22"
            class="h-5 w-auto"
          />
        </a>
        <nav aria-label="Primary" class="flex items-center gap-2 text-sm">
          {#each navItems as item}
            <a
              href={item.href}
              class="rounded-sm px-3 py-1.5 transition hover:bg-bg-elev-2"
              class:font-semibold={page.url.pathname === item.href}
              aria-current={page.url.pathname === item.href ? "page" : undefined}
            >
              {item.label}
            </a>
          {/each}
          <SettingsDialog />
          <ConnectButton />
        </nav>
      </div>
    </header>

    <main class="mx-auto max-w-5xl px-4 py-8">
      {@render children()}
    </main>

    <footer class="mx-auto max-w-5xl px-4 py-10 text-xs text-fg-muted">
      <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p>
          Independent Track A operator submission to the
          <a class="underline" href="https://forum.safefoundation.org/t/rfp-safenet-beta-staking-ui-call-for-operators/6992"
            >Safe Foundation RFP</a
          >. Non-custodial. Open source on
          <a class="underline" href="https://github.com/crampeddamselfly/safe-stake">GitHub</a>.
        </p>
        <p class="shrink-0">
          by
          <a
            class="font-medium text-fg underline-offset-4 hover:underline"
            href="https://denna.io"
            target="_blank"
            rel="noopener"
          >Denna Labs</a>
        </p>
      </div>
    </footer>
  </div>
  <Toaster />
</QueryClientProvider>
