<script lang="ts">
  import { Button } from "$lib/components/ui/button"
  import { Skeleton } from "$lib/components/ui/skeleton"
  import * as Alert from "$lib/components/ui/alert"
  import AlertTriangleIcon from "@lucide/svelte/icons/triangle-alert"
  import WalletIcon from "@lucide/svelte/icons/wallet"
  import ArrowRightIcon from "@lucide/svelte/icons/arrow-right"
  import { account, chainId, openModal } from "$lib/wallet/appkit"
  import { rewardsQuery } from "$lib/hooks/useRewards"
  import { sanctionsQuery } from "$lib/hooks/useSanctions"
  import { claimRewards, type TxStep } from "$lib/hooks/useStakingWrites"
  import TxProgressSteps from "$lib/components/tx/TxProgressSteps.svelte"
  import { buttonLabel } from "$lib/components/tx/steps"
  import { formatSafe, truncateAddress } from "$lib/utils/format"
  import { formatContractError } from "$lib/utils/errors"
  import { txUrl } from "$lib/utils/explorer"
  import { toast } from "svelte-sonner"
  import { useQueryClient } from "@tanstack/svelte-query"

  const rewards = rewardsQuery()
  const sanctioned = sanctionsQuery()
  const qc = useQueryClient()

  let busy = $state(false)
  let step = $state<TxStep>("idle")
  const hasError = $derived(step === "error")

  const claimable = $derived($rewards.data?.claimable ?? 0n)

  const ready = $derived(
    claimable > 0n &&
      !!$rewards.data?.proof &&
      !!$rewards.data?.root &&
      $rewards.data?.cumulativeAmount !== undefined &&
      !$sanctioned.data
  )

  async function submit() {
    if (
      !ready ||
      !$account.address ||
      !$rewards.data?.proof ||
      !$rewards.data.root ||
      $rewards.data.cumulativeAmount === undefined
    )
      return
    busy = true
    step = "idle"
    try {
      const res = await claimRewards(
        $chainId,
        $account.address,
        $rewards.data.cumulativeAmount,
        $rewards.data.root,
        $rewards.data.proof,
        (s) => (step = s)
      )
      step = "done"
      toast.success("Rewards claimed", {
        description: `Tx ${truncateAddress(res.hash)}`,
        action: {
          label: "View",
          onClick: () => window.open(txUrl($chainId, res.hash), "_blank")
        }
      })
      await qc.invalidateQueries()
      step = "idle"
    } catch (err) {
      step = "error"
      toast.error("Claim failed", { description: formatContractError(err) })
    } finally {
      busy = false
    }
  }
</script>

<section
  class="relative overflow-hidden rounded-lg bg-card ring-1 ring-border"
  aria-labelledby="claimable-label"
>
  <!-- Subtle primary-tinted top edge to differentiate from the table -->
  <div
    aria-hidden="true"
    class="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent"
  ></div>

  <div class="flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:justify-between sm:gap-10">
    <div class="flex-1 min-w-0">
      <p
        id="claimable-label"
        class="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground"
      >
        Claimable SAFE
      </p>

      {#if !$account.isConnected}
        <p class="mt-3 text-sm text-muted-foreground">
          Connect a wallet to view rewards eligibility.
        </p>
      {:else if $rewards.isLoading}
        <Skeleton class="mt-3 h-10 w-44" />
      {:else if $rewards.error}
        <p class="mt-3 text-sm text-destructive">
          {$rewards.error.message}
        </p>
      {:else}
        <p
          class="mt-2 font-mono text-4xl font-medium tabular-nums tracking-tight text-foreground sm:text-5xl"
        >
          {formatSafe(claimable, { precision: 4 })}
        </p>
        {#if $rewards.data && $rewards.data.cumulativeAllocated > 0n}
          <p class="mt-2 font-mono text-xs text-muted-foreground tabular-nums">
            {formatSafe($rewards.data.cumulativeClaimed)} claimed of {formatSafe(
              $rewards.data.cumulativeAllocated
            )} allocated
          </p>
        {/if}
      {/if}
    </div>

    <div class="shrink-0">
      {#if !$account.isConnected}
        <Button size="lg" onclick={openModal}>
          <WalletIcon class="size-4" />
          Connect wallet
        </Button>
      {:else}
        <Button
          size="lg"
          onclick={submit}
          disabled={!ready || busy}
          class="min-w-[180px]"
        >
          {buttonLabel(step, "claim-rewards", ready ? "Claim rewards" : "Nothing to claim")}
          {#if ready && step === "idle"}
            <ArrowRightIcon class="size-4" />
          {/if}
        </Button>
      {/if}
    </div>
  </div>

  {#if $sanctioned.data}
    <div class="border-t border-border px-6 py-4">
      <Alert.Root variant="destructive">
        <AlertTriangleIcon class="size-4" />
        <Alert.Title>Address blocked</Alert.Title>
        <Alert.Description>
          The connected address appears on the sanctions list. Claims are
          disabled.
        </Alert.Description>
      </Alert.Root>
    </div>
  {/if}

  {#if step !== "idle"}
    <div class="border-t border-border bg-muted/30 px-6 py-4">
      <TxProgressSteps {step} flow="claim-rewards" {hasError} />
    </div>
  {/if}
</section>
