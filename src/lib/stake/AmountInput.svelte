<script lang="ts">
  import { formatUnits, parseUnits } from "viem"

  let {
    value = $bindable<bigint | undefined>(),
    max,
    label = "Amount"
  }: {
    value: bigint | undefined
    max?: bigint
    label?: string
  } = $props()

  let raw = $state("")
  let error = $state<string | undefined>(undefined)

  $effect(() => {
    if (raw === "") {
      value = undefined
      error = undefined
      return
    }
    try {
      const n = parseUnits(raw as `${number}`, 18)
      if (n <= 0n) {
        error = "Must be greater than zero."
        value = undefined
      } else if (max !== undefined && n > max) {
        error = "Exceeds available balance."
        value = undefined
      } else {
        error = undefined
        value = n
      }
    } catch {
      error = "Invalid number."
      value = undefined
    }
  })

  function setMax() {
    if (max === undefined) return
    raw = formatUnits(max, 18)
  }
</script>

<div class="flex flex-col gap-2">
  <span class="text-xs uppercase tracking-wide text-fg-muted">{label}</span>
  <div class="relative">
    <input
      type="text"
      inputmode="decimal"
      placeholder="0.0"
      bind:value={raw}
      class="w-full rounded-md border border-border bg-bg-elev-2 px-3 py-2 pr-20 font-mono text-fg placeholder:text-fg-muted focus:outline-none"
      aria-invalid={!!error}
      aria-describedby={error ? "amount-error" : undefined}
    />
    {#if max !== undefined}
      <button
        type="button"
        onclick={setMax}
        class="absolute right-2 top-1/2 -translate-y-1/2 rounded-sm bg-bg-elev px-2 py-0.5 text-xs text-fg-muted hover:text-fg"
      >MAX</button>
    {/if}
  </div>
  {#if error}
    <span id="amount-error" class="text-xs text-danger">{error}</span>
  {:else if max !== undefined}
    <span class="text-xs text-fg-muted">Available: {formatUnits(max, 18)} SAFE</span>
  {/if}
</div>
