<script lang="ts">
  import Card from "$lib/ui/Card.svelte"
  import Button from "$lib/ui/Button.svelte"
  import StatNumber from "$lib/ui/StatNumber.svelte"
  import { account, chainId, openModal } from "$lib/wallet/appkit"
  import { rewardsQuery, claimRewards } from "$lib/hooks/useRewards"
  import { sanctionsQuery } from "$lib/hooks/useSanctions"
  import { pushToast } from "$lib/ui/Toaster.svelte"
  import { useQueryClient } from "@tanstack/svelte-query"
  import { formatSafe, truncateAddress } from "$lib/utils/format"

  const rewards = rewardsQuery()
  const sanctioned = sanctionsQuery()
  const qc = useQueryClient()
  let busy = $state(false)

  const ready = $derived(
    !!$rewards.data?.claimable &&
      $rewards.data.claimable > 0n &&
      !!$rewards.data.proof &&
      !!$rewards.data.root &&
      $rewards.data.cumulativeAmount !== undefined
  )

  async function submit() {
    if (!ready || !$account.address || !$rewards.data?.proof || !$rewards.data.root || $rewards.data.cumulativeAmount === undefined)
      return
    busy = true
    try {
      const res = await claimRewards(
        $chainId,
        $account.address,
        $rewards.data.cumulativeAmount,
        $rewards.data.root,
        $rewards.data.proof
      )
      pushToast({
        kind: "success",
        title: "Rewards claimed",
        detail: `Tx ${truncateAddress(res.hash)}`
      })
      await qc.invalidateQueries()
    } catch (err) {
      pushToast({
        kind: "error",
        title: "Claim failed",
        detail: err instanceof Error ? err.message : String(err)
      })
    } finally {
      busy = false
    }
  }
</script>

<svelte:head>
  <title>Rewards — Safe Stake</title>
</svelte:head>

<Card title="Rewards" description="Claim SAFE rewards distributed via Merkle drop. Proofs are pinned to IPFS and served as static JSON — no backend required.">
  {#if !$account.isConnected}
    <p class="text-sm text-fg-muted">
      Connect a wallet to view reward eligibility.
      <button class="ml-2 underline" onclick={openModal}>Connect</button>
    </p>
  {:else if $rewards.isLoading}
    <p class="text-sm text-fg-muted">Loading reward state…</p>
  {:else if $rewards.error}
    <p class="text-sm text-danger">Error: {$rewards.error.message}</p>
  {:else if !$rewards.data?.hasDrop}
    <p class="text-sm text-fg-muted">No Merkle drop configured for this chain.</p>
  {:else}
    <div class="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
      <StatNumber
        label="Total allocated"
        value={formatSafe($rewards.data.cumulativeAllocated)}
      />
      <StatNumber
        label="Already claimed"
        value={formatSafe($rewards.data.cumulativeClaimed)}
      />
      <StatNumber
        label="Claimable now"
        value={formatSafe($rewards.data.claimable)}
      />
    </div>

    {#if $rewards.data.cumulativeAllocated === 0n}
      <p class="text-sm text-fg-muted">No rewards allocated to this address in the current Merkle root.</p>
    {/if}

    <Button
      onclick={submit}
      disabled={!ready || busy || !!$sanctioned.data}
      loading={busy}
      class="w-full"
      size="lg"
    >
      {#if ready}
        Claim rewards
      {:else}
        Nothing to claim
      {/if}
    </Button>
  {/if}
</Card>
