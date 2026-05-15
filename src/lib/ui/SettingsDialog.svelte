<script lang="ts">
  import Button from "./Button.svelte"
  import { useQueryClient } from "@tanstack/svelte-query"
  import { rpcOverrides, setRpcOverride } from "$lib/settings/rpc"
  import { clearClientCache } from "$lib/chain/clients"
  import { getAllConfigs, getRpcUrl } from "$lib/spec/loader"
  import { browser } from "$app/environment"

  let open = $state(false)
  const chains = getAllConfigs()
  const qc = useQueryClient()

  // Local edits before applying
  let drafts = $state<Record<number, string>>({})

  $effect(() => {
    if (open && browser) {
      drafts = Object.fromEntries(
        chains.map((c) => [c.chainId, $rpcOverrides[c.chainId] ?? ""])
      )
    }
  })

  function effectiveSource(chainId: number): string {
    if ($rpcOverrides[chainId]) return "from this device"
    const envKey = `VITE_RPC_URL_${chainId}` as const
    if (import.meta.env[envKey]) return "from env"
    const specCfg = chains.find((c) => c.chainId === chainId)
    if (specCfg?.rpcUrl) return "from spec"
    return "viem default"
  }

  function save() {
    for (const [k, v] of Object.entries(drafts)) {
      setRpcOverride(Number(k), v.trim() || undefined)
    }
    clearClientCache()
    qc.invalidateQueries()
    open = false
  }

  function reset(chainId: number) {
    drafts[chainId] = ""
  }
</script>

<button
  type="button"
  onclick={() => (open = true)}
  class="rounded-sm border border-border px-2 py-1.5 text-xs text-fg-muted hover:text-fg"
  aria-label="Open settings"
  title="RPC settings"
>
  ⚙
</button>

{#if open}
  <div
    role="dialog"
    aria-modal="true"
    aria-labelledby="settings-title"
    class="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-4"
  >
    <div class="w-full max-w-lg rounded-lg border border-border bg-bg-elev p-6 shadow-xl">
      <header class="mb-4 flex items-center justify-between">
        <h2 id="settings-title" class="text-base font-semibold text-fg">RPC settings</h2>
        <button
          type="button"
          aria-label="Close"
          class="text-fg-muted hover:text-fg"
          onclick={() => (open = false)}
        >✕</button>
      </header>

      <p class="mb-4 text-xs text-fg-muted">
        Override the public RPC endpoint for each chain. Saved to this device's
        local storage only — never sent anywhere. Precedence: this setting →
        <code>VITE_RPC_URL_&lt;chainId&gt;</code> → spec → viem default.
      </p>

      <div class="flex flex-col gap-4">
        {#each chains as c (c.chainId)}
          <div class="flex flex-col gap-1">
            <div class="flex items-baseline justify-between">
              <label for="rpc-{c.chainId}" class="text-sm font-medium text-fg">
                {c.chain} <span class="text-fg-muted">({c.chainId})</span>
              </label>
              <span class="text-xs text-fg-muted">currently {effectiveSource(c.chainId)}</span>
            </div>
            <div class="flex gap-2">
              <input
                id="rpc-{c.chainId}"
                type="url"
                placeholder={getRpcUrl(c.chainId) ?? "https://…"}
                bind:value={drafts[c.chainId]}
                class="flex-1 rounded-md border border-border bg-bg-elev-2 px-3 py-2 font-mono text-xs text-fg placeholder:text-fg-muted focus:outline-none"
              />
              <Button variant="ghost" size="sm" onclick={() => reset(c.chainId)}>Clear</Button>
            </div>
          </div>
        {/each}
      </div>

      <footer class="mt-6 flex justify-end gap-2">
        <Button variant="secondary" onclick={() => (open = false)}>Cancel</Button>
        <Button onclick={save}>Save</Button>
      </footer>
    </div>
  </div>
{/if}
