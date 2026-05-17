<script lang="ts">
  import * as Card from "$lib/components/ui/card"
  import { Button } from "$lib/components/ui/button"
  import { account, chainId, openModal } from "$lib/wallet/appkit"
  import { rewardsQuery } from "$lib/hooks/useRewards"
  import { claimRewards, type TxStep } from "$lib/hooks/useStakingWrites"
  import { sanctionsQuery } from "$lib/hooks/useSanctions"
  import { toast } from "svelte-sonner"
  import { useQueryClient } from "@tanstack/svelte-query"
  import { formatSafe, truncateAddress } from "$lib/utils/format"
  import { formatContractError } from "$lib/utils/errors"
  import { txUrl } from "$lib/utils/explorer"
  import TxProgressSteps from "$lib/components/tx/TxProgressSteps.svelte"
  import { buttonLabel } from "$lib/components/tx/steps"

  const rewards = rewardsQuery()
  const sanctioned = sanctionsQuery()
  const qc = useQueryClient()
  let busy = $state(false)
  let step = $state<TxStep>("idle")
  const hasError = $derived(step === "error")

  const ready = $derived(
    !!$rewards.data?.claimable &&
      $rewards.data.claimable > 0n &&
      !!$rewards.data.proof &&
      !!$rewards.data.root &&
      $rewards.data.cumulativeAmount !== undefined
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

<svelte:head>
  <title>Rewards — Safenet Beta</title>
</svelte:head>

<div class="flex flex-col gap-8">
  <header class="flex flex-col gap-2">
    <h1 class="text-3xl font-semibold tracking-tight md:text-4xl">Rewards</h1>
    <p class="text-sm text-muted-foreground">
      Claim SAFE rewards distributed via Merkle drop. Proofs served as static
      JSON — no backend, no API key.
    </p>
  </header>

  <Card.Root>
    <Card.Header>
      <Card.Title>Claimable</Card.Title>
      <Card.Description>
        Allocations are tracked cumulatively on-chain. You can claim partial
        amounts as new drops land.
      </Card.Description>
    </Card.Header>
    <Card.Content class="flex flex-col gap-6">
      {#if !$account.isConnected}
        <p class="text-sm text-muted-foreground">
          Connect a wallet to view reward eligibility.
          <Button variant="link" class="px-1" onclick={openModal}>Connect</Button>
        </p>
      {:else if $rewards.isLoading}
        <p class="text-sm text-muted-foreground">Loading reward state…</p>
      {:else if $rewards.error}
        <p class="text-sm text-destructive">Error: {$rewards.error.message}</p>
      {:else if !$rewards.data?.hasDrop}
        <p class="text-sm text-muted-foreground">No Merkle drop configured.</p>
      {:else}
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div class="flex flex-col gap-1">
            <span class="text-xs uppercase tracking-wide text-muted-foreground">Total allocated</span>
            <span class="font-mono text-2xl">{formatSafe($rewards.data.cumulativeAllocated)}</span>
          </div>
          <div class="flex flex-col gap-1">
            <span class="text-xs uppercase tracking-wide text-muted-foreground">Already claimed</span>
            <span class="font-mono text-2xl">{formatSafe($rewards.data.cumulativeClaimed)}</span>
          </div>
          <div class="flex flex-col gap-1">
            <span class="text-xs uppercase tracking-wide text-muted-foreground">Claimable now</span>
            <span class="font-mono text-2xl text-primary">{formatSafe($rewards.data.claimable)}</span>
          </div>
        </div>

        {#if step !== "idle"}
          <div class="rounded-md border border-border bg-muted/30 p-4">
            <TxProgressSteps {step} flow="claim-rewards" {hasError} />
          </div>
        {/if}

        <Button
          size="lg"
          class="w-full"
          disabled={!ready || busy || !!$sanctioned.data}
          onclick={submit}
        >
          {buttonLabel(step, "claim-rewards", ready ? "Claim rewards" : "Nothing to claim")}
        </Button>
      {/if}
    </Card.Content>
  </Card.Root>
</div>
