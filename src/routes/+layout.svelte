<script lang="ts">
  import "../app.css"
  import { onMount } from "svelte"
  import { QueryClient, QueryClientProvider } from "@tanstack/svelte-query"
  import { initAppKit } from "$lib/wallet/appkit"
  import Toaster from "$lib/ui/Toaster.svelte"
  import ConnectButton from "$lib/ui/ConnectButton.svelte"
  import { page } from "$app/state"

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
    <header class="border-b border-border bg-bg-elev/70 backdrop-blur">
      <div class="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <a href="/" class="flex items-center gap-2 font-semibold text-fg">
          <span
            class="grid size-7 place-items-center rounded-sm bg-accent text-accent-fg font-mono"
            aria-hidden="true"
          >S</span>
          Safe Stake
          <span class="ml-2 rounded-sm border border-border px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-fg-muted"
            >Denna Labs</span
          >
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
          <ConnectButton />
        </nav>
      </div>
    </header>

    <main class="mx-auto max-w-5xl px-4 py-8">
      {@render children()}
    </main>

    <footer class="mx-auto max-w-5xl px-4 py-8 text-xs text-fg-muted">
      <p>
        Independent Track A operator submission to the
        <a class="underline" href="https://forum.safefoundation.org/t/rfp-safenet-beta-staking-ui-call-for-operators/6992"
          >Safe Foundation RFP</a
        >. Non-custodial. Open source on
        <a class="underline" href="https://github.com/crampeddamselfly/safe-stake">GitHub</a>.
        Operated by Denna Labs.
      </p>
    </footer>
  </div>
  <Toaster />
</QueryClientProvider>
