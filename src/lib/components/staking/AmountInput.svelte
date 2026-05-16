<script lang="ts">
  import { formatUnits, parseUnits } from "viem"
  import { Input } from "$lib/components/ui/input"
  import { Button } from "$lib/components/ui/button"
  import { Label } from "$lib/components/ui/label"
  import { formatSafe } from "$lib/utils/format"

  let {
    value = $bindable<bigint | undefined>(),
    max,
    balanceLabel = "SAFE Balance",
    errorText
  }: {
    value: bigint | undefined
    max: bigint | undefined
    balanceLabel?: string
    errorText?: string
  } = $props()

  let raw = $state("")
  let internalError = $state<string | undefined>(undefined)

  $effect(() => {
    if (raw === "") {
      value = undefined
      internalError = undefined
      return
    }
    try {
      const n = parseUnits(raw as `${number}`, 18)
      if (n <= 0n) {
        internalError = "Must be greater than zero."
        value = undefined
      } else if (max !== undefined && n > max) {
        internalError = errorText ?? "Exceeds available balance."
        value = undefined
      } else {
        internalError = undefined
        value = n
      }
    } catch {
      internalError = "Invalid number."
      value = undefined
    }
  })

  function setFraction(num: number, den: number) {
    if (max === undefined) return
    const v = (max * BigInt(num)) / BigInt(den)
    raw = formatUnits(v, 18)
  }

  const chips: { label: string; num: number; den: number }[] = [
    { label: "25%", num: 1, den: 4 },
    { label: "50%", num: 1, den: 2 },
    { label: "75%", num: 3, den: 4 },
    { label: "MAX", num: 1, den: 1 }
  ]
</script>

<div class="flex flex-col gap-3">
  <div class="flex items-baseline justify-between">
    <Label for="amount-input" class="text-base font-medium">Amount</Label>
    <span class="text-sm text-muted-foreground">
      {balanceLabel}: <span class="font-mono text-foreground">{formatSafe(max)}</span>
    </span>
  </div>

  <Input
    id="amount-input"
    type="text"
    inputmode="decimal"
    placeholder="0.0"
    bind:value={raw}
    aria-invalid={!!internalError}
    aria-describedby={internalError ? "amount-error" : undefined}
    class="font-mono text-lg h-12"
  />

  <div class="grid grid-cols-4 gap-2">
    {#each chips as c (c.label)}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        disabled={max === undefined || max === 0n}
        onclick={() => setFraction(c.num, c.den)}
        class="font-medium"
      >
        {c.label}
      </Button>
    {/each}
  </div>

  {#if internalError}
    <p id="amount-error" class="text-sm text-destructive">{internalError}</p>
  {/if}
</div>
