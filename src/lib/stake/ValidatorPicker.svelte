<script lang="ts">
  import { getAddress, isAddress, type Address } from "viem"
  import { chainId } from "$lib/wallet/appkit"
  import { getConfig } from "$lib/spec/loader"
  import { truncateAddress } from "$lib/utils/format"

  let {
    value = $bindable<Address | undefined>(undefined)
  }: { value: Address | undefined } = $props()

  const cfg = $derived(getConfig($chainId))
  const validators = $derived(cfg.validators)

  let custom = $state("")
  let mode = $state<"select" | "custom">("custom")
  $effect(() => {
    mode = validators.length > 0 ? "select" : "custom"
  })

  $effect(() => {
    if (mode === "custom") {
      if (custom && isAddress(custom)) value = getAddress(custom)
      else value = undefined
    }
  })

  function pick(addr: Address) {
    value = addr
  }
</script>

<div class="flex flex-col gap-2">
  <span class="text-xs uppercase tracking-wide text-fg-muted">Validator</span>

  {#if validators.length > 0}
    <div class="flex gap-2 text-xs">
      <button
        type="button"
        class="rounded-sm px-2 py-1 transition"
        class:bg-bg-elev-2={mode === "select"}
        onclick={() => (mode = "select")}
      >Known</button>
      <button
        type="button"
        class="rounded-sm px-2 py-1 transition"
        class:bg-bg-elev-2={mode === "custom"}
        onclick={() => (mode = "custom")}
      >Custom address</button>
    </div>
  {/if}

  {#if mode === "select"}
    <div class="grid gap-2">
      {#each validators as v}
        <button
          type="button"
          onclick={() => pick(v.address.value)}
          class="flex items-center justify-between rounded-md border border-border px-3 py-2 text-left transition hover:bg-bg-elev-2"
          class:border-accent={value === v.address.value}
          aria-pressed={value === v.address.value}
        >
          <span>
            <span class="font-medium text-fg">{v.name}</span>
            <span class="ml-2 font-mono text-xs text-fg-muted">{truncateAddress(v.address.value)}</span>
          </span>
          {#if v.commissionBps !== undefined}
            <span class="text-xs text-fg-muted">{(v.commissionBps / 100).toFixed(2)}%</span>
          {/if}
        </button>
      {/each}
    </div>
  {:else}
    <input
      type="text"
      placeholder="0x…"
      bind:value={custom}
      class="rounded-md border border-border bg-bg-elev-2 px-3 py-2 font-mono text-sm text-fg placeholder:text-fg-muted focus:outline-none"
      aria-label="Validator address"
    />
    {#if custom && !isAddress(custom)}
      <span class="text-xs text-danger">Invalid EVM address.</span>
    {/if}
  {/if}
</div>
